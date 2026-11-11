<script setup>
// Real-time 3-D rooms for the design studio (the kitchen and the living room,
// SCENES below). Each room is modelled here in metres (y up, the back wall
// at ROOM.z0); every changeable surface gets its
// own material, and the chosen decor photo is laid on it at its real size:
// texture coordinates are metres along the face (metricUV), `tile` is how many
// metres one copy of the photo covers, `grain` ('h' | 'v') which way the wood
// grain runs on that surface, whichever way the photo was taken.
// Laminate photos are single boards, so the floor is drawn as real planks cut
// from the photo (plankTexture). The light is kept soft and neutral so a decor
// shows its own colour: an even environment light, a soft light from above
// for the shadows, and ambient occlusion for the contact shadows.
// Drag to look around (360°), scroll or pinch to zoom, double-click the floor
// to walk there, click a surface to pick it.
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { Reflector } from 'three/addons/objects/Reflector.js'

const props = defineProps({
  room:       { type: Object, required: true },      // entry from src/data/rooms.js
  selections: { type: Object, required: true },      // surface id → swatch
  selected:   { type: Number, default: 0 },
})
const emit = defineEmits(['select', 'loaded'])

const wrapRef = ref(null)
const canvasRef = ref(null)
const markerRefs = ref({})
const loading = ref(true)
const hoverId = ref(0)

// ── rooms ───────────────────────────────────────────────────────────────────
// Per room: its size (metres), the floor's surface id, where the visit starts,
// where each surface's marker sits (by surface key), the free floor that can
// be walked to, and the function that builds the furniture.
const SCENES = {
  kitchen: {
    room: { x0: -2.6, x1: 2.6, z0: -2.4, z1: 2.4, h: 2.7 },
    floor: 7,
    start: { pos: [1.45, 1.6, 1.6], yaw: -2.55, pitch: -0.2 },
    anchors: {
      fronts: [-1.6, 0.45, -1.8], upper: [-1.6, 1.85, -2.02], tall: [2.4, 1.1, -1.8],
      island: [1.0, 0.45, 0.24], worktop: [-2.25, 0.92, -1.5], backsplash: [0.3, 1.2, -2.37],
      floor: [0.9, 0.02, 1.0], shelves: [0.6, 1.6, -2.13],
    },
    bounds: { x0: -1.6, x1: 2.25, z0: -1.4, z1: 2.1 },
    walkable: (x, z) => !(x > -1.25 && x < 1.65 && z > -1.05 && z < 1.15),
    build: () => { kitchenShell(); buildKitchen() },
  },
  living: {
    room: { x0: -2.8, x1: 2.8, z0: -2.5, z1: 2.5, h: 2.7 },
    floor: 5,
    start: { pos: [1.55, 1.5, 2.0], yaw: -2.78, pitch: -0.12 },
    anchors: {
      tvwall: [0.25, 2.2, -2.46], slats: [-1.8, 1.55, -2.47], tvunit: [1.3, 0.45, -2.03],
      shelves: [1.75, 1.27, -2.3], floor: [1.2, 0.02, 0.9],
    },
    bounds: { x0: -2.3, x1: 2.4, z0: -1.6, z1: 2.25 },
    walkable: (x, z) => !(x < 0.75 && z > 1.35) && !(x < -1.05 && z > 0.45) && Math.hypot(x + 0.3, z - 0.25) > 0.65,
    build: buildLiving,
  },
  bedroom: {
    room: { x0: -2.6, x1: 2.6, z0: -2.4, z1: 2.6, h: 2.7 },
    floor: 6,
    start: { pos: [0.15, 1.5, 2.2], yaw: 2.98, pitch: -0.14 },
    anchors: {
      wardrobe: [1.95, 1.4, -0.6], slats: [0.3, 1.95, -2.37],
      headboard: [-1.7, 0.85, -2.35], nightstand: [1.52, 0.5, -1.98], floor: [1.45, 0.02, 1.5],
    },
    bounds: { x0: -2.2, x1: 1.8, z0: -1.8, z1: 2.3 },
    walkable: (x, z) => !(x > -0.9 && x < 1.3 && z < 0.05),
    build: buildBedroom,
  },
  hallway: {
    room: { x0: -2.2, x1: 2.6, z0: -1.3, z1: 2.4, h: 2.7 },
    floor: 4,
    start: { pos: [0.75, 1.5, 2.0], yaw: 3.32, pitch: -0.12 },
    anchors: {
      wardrobe: [1.5, 1.4, -0.68], slats: [0.3, 1.95, -1.27], console: [-0.9, 0.85, -0.93],
      floor: [1.1, 0.02, 0.9],
    },
    bounds: { x0: -1.8, x1: 2.2, z0: -0.45, z1: 2.1 },
    walkable: () => true,
    build: buildHallway,
  },
}
const BASE = { plinth: 0.1, top: 0.86, worktop: 0.04 }   // worktop surface at 0.90
const DOOR_T = 0.019, GAP = 0.003
const SC = SCENES[props.room.id] ?? SCENES.kitchen
const { room: ROOM, start: START, anchors: ANCHORS } = SC

let renderer, scene, camera, composer, ro, raf
const surfaceMats = new Map()   // surface id → MeshStandardMaterial
const pickables = []
const view = { yaw: START.yaw, pitch: START.pitch, fov: 68, pos: new THREE.Vector3(...START.pos) }
// starting field of view: a tall phone screen needs a wider one to see the room
const startFov = () => (wrapRef.value && wrapRef.value.clientWidth < wrapRef.value.clientHeight ? 92 : 68)
let walkTo = null, pulse = 0

// ── texture coordinates in metres ───────────────────────────────────────────
// u, v run along the face: x/z across, y up on walls and fronts; x, z on tops
function metricUV(geo, offset = [0, 0, 0]) {
  const p = geo.attributes.position, n = geo.attributes.normal
  const uv = new Float32Array(p.count * 2)
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + offset[0], y = p.getY(i) + offset[1], z = p.getZ(i) + offset[2]
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i))
    const [u, v] = ay >= ax && ay >= az ? [x, z] : ax >= az ? [z, y] : [x, y]
    uv[i * 2] = u; uv[i * 2 + 1] = v
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geo
}

// a box from its min/max corners, rounded a little so its edges catch light
// `origin` moves the texture's (0, 0) to that world point, e.g. a panel's corner
function box(x0, y0, z0, x1, y1, z1, mat, { r = 0.003, id = 0, shadow = true, origin = null } = {}) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0
  const rr = Math.min(r, w / 2.01, h / 2.01, d / 2.01)
  const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]
  const geo = rr > 0.0005 ? new RoundedBoxGeometry(w, h, d, 2, rr) : new THREE.BoxGeometry(w, h, d)
  metricUV(geo, origin ? c.map((v, i) => v - origin[i]) : c)
  const m = new THREE.Mesh(geo, typeof mat === 'number' ? surfaceMat(mat) : mat)
  m.position.set(...c)
  m.castShadow = shadow; m.receiveShadow = true
  if (id || typeof mat === 'number') { m.userData.surface = id || mat; pickables.push(m) }
  scene.add(m)
  return m
}

function surfaceMat(id) {
  // physical material: glossy decors get a clear lacquer coat on top (finish)
  if (!surfaceMats.has(id)) surfaceMats.set(id, new THREE.MeshPhysicalMaterial({ color: 0xdddddd, roughness: 0.6 }))
  return surfaceMats.get(id)
}

// ── plain materials ─────────────────────────────────────────────────────────
const M = {}
function plainMaterials() {
  M.wall    = new THREE.MeshStandardMaterial({ color: 0xebe6df, roughness: 0.95 })
  M.ceiling = new THREE.MeshStandardMaterial({ color: 0xf3f1ed, roughness: 0.95 })
  M.plinth  = new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.6 })
  M.gola    = new THREE.MeshStandardMaterial({ color: 0x3a3836, roughness: 0.35, metalness: 0.6 })
  M.black   = new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: 0.08 })
  M.steel   = new THREE.MeshStandardMaterial({ color: 0xb9b9b9, roughness: 0.25, metalness: 1 })
  M.matblk  = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.45, metalness: 0.4 })
  M.frame   = new THREE.MeshStandardMaterial({ color: 0x3b3b3b, roughness: 0.5, metalness: 0.3 })
  M.led     = new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffe7c2, emissiveIntensity: 1.6 })
  M.spot    = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4e2, emissiveIntensity: 2 })
  M.glow    = new THREE.MeshStandardMaterial({ color: 0xfff3e0, emissive: 0xffe2b8, emissiveIntensity: 0.7, roughness: 0.4 })
  M.fabric  = new THREE.MeshStandardMaterial({ color: 0xcfc4b6, roughness: 0.95 })
  M.ceramic = new THREE.MeshStandardMaterial({ color: 0xf0ede8, roughness: 0.35 })
  M.leaf    = new THREE.MeshStandardMaterial({ color: 0x55703f, roughness: 0.8 })
  M.wood    = new THREE.MeshStandardMaterial({ color: 0x9a7a58, roughness: 0.7 })
  M.glass   = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.15 })
  M.felt    = new THREE.MeshStandardMaterial({ color: 0x1f1c1a, roughness: 1 })
  M.screen  = new THREE.MeshStandardMaterial({ color: 0x08090b, roughness: 0.12, metalness: 0.2 })
  M.sheer   = new THREE.MeshStandardMaterial({ color: 0xf3f0ea, emissive: 0x5a554e, roughness: 0.9, side: THREE.DoubleSide })
  M.drape   = new THREE.MeshStandardMaterial({ color: 0xc8baa6, roughness: 0.95, side: THREE.DoubleSide })
  M.sofa    = new THREE.MeshStandardMaterial({ color: 0xd4c9bb, roughness: 0.96 })
  M.drum    = new THREE.MeshStandardMaterial({ color: 0x2e2b29, roughness: 0.55 })
  M.marble  = new THREE.MeshStandardMaterial({ color: 0xeeebe6, roughness: 0.25 })
  M.door    = new THREE.MeshStandardMaterial({ color: 0xe7e1d8, roughness: 0.6 })
  M.linen   = new THREE.MeshStandardMaterial({ color: 0xd9d0c4, roughness: 0.97 })
  M.vase    = new THREE.MeshStandardMaterial({ color: 0xe9e3d9, roughness: 0.15, transparent: true, opacity: 0.85 })
  M.doorDark  = new THREE.MeshStandardMaterial({ color: 0x2b2a29, roughness: 0.55 })
  M.doorFrame = new THREE.MeshStandardMaterial({ color: 0x3a3836, roughness: 0.5 })
  M.throw   = new THREE.MeshStandardMaterial({ color: 0x9e8f7e, roughness: 0.97 })
  M.seam    = new THREE.MeshStandardMaterial({ color: 0xa99d8f, roughness: 0.95 })
  M.handle  = new THREE.MeshStandardMaterial({ color: 0x3a2e24, roughness: 0.35, metalness: 0.7 })
  M.bronze  = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.3, metalness: 0.8 })
  M.lampShade = new THREE.MeshStandardMaterial({ color: 0x1e1c1a, roughness: 0.25, metalness: 0.6, side: THREE.DoubleSide })
}

// ── the room ────────────────────────────────────────────────────────────────

// floor, ceiling and the back, right and left walls of any room
function buildRoom() {
  const { x0, x1, z0, z1, h } = ROOM, t = 0.1
  box(x0, -0.02, z0, x1, 0, z1, SC.floor, { r: 0, shadow: false })             // floor
  box(x0, h, z0, x1, h + t, z1, M.ceiling, { r: 0, shadow: false })            // ceiling
  box(x0, 0, z0 - t, x1, h, z0, M.wall, { r: 0 })                              // back wall
  box(x1, 0, z0, x1 + t, h, z1, M.wall, { r: 0 })                              // right wall
  box(x0 - t, 0, z0, x0, h, z1, M.wall, { r: 0 })                              // left wall
}

// a front wall (behind the start view) with a doorway to the hall at D
function frontWall(D) {
  const { x0, x1, z1, h } = ROOM, t = 0.1
  box(x0, 0, z1, D.x0, h, z1 + t, M.wall, { r: 0 })
  box(D.x1, 0, z1, x1, h, z1 + t, M.wall, { r: 0 })
  box(D.x0, D.y1, z1, D.x1, h, z1 + t, M.wall, { r: 0 })
  box(D.x0 - 0.06, 0, z1 - 0.012, D.x0, D.y1 + 0.06, z1 + 0.02, M.ceramic, { r: 0.003 })   // door frame
  box(D.x1, 0, z1 - 0.012, D.x1 + 0.06, D.y1 + 0.06, z1 + 0.02, M.ceramic, { r: 0.003 })
  box(D.x0, D.y1, z1 - 0.012, D.x1, D.y1 + 0.06, z1 + 0.02, M.ceramic, { r: 0.003 })
  box(D.x0 - 0.5, 0, z1 + 1.4, D.x1 + 0.5, h, z1 + 1.5, M.wall, { r: 0 })                  // the hall beyond
  box(D.x0 - 0.5, -0.02, z1, D.x1 + 0.5, 0, z1 + 1.4, SC.floor, { r: 0, shadow: false })
}

function ceilingSpots(spots) {
  for (const [x, z] of spots) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.01, 24), M.spot)
    s.position.set(x, ROOM.h - 0.004, z)
    scene.add(s)
  }
}

function kitchenShell() {
  const { x0, x1, z1 } = ROOM
  frontWall({ x0: -1.9, x1: -1.0, y1: 2.15 })
  picture(0.9, 1.55, z1 - 0.02, 1.1, 0.75, 'z')
  picture(x1 - 0.02, 1.55, 0.9, 0.9, 0.65, 'x')
  floorPlant(2.25, 2.05)
  floorPlant(-2.25, 1.0)
  // skirting board on the open walls
  box(x0, 0, 0.6, x0 + 0.012, 0.08, z1, M.wall, { r: 0.002 })
  box(x0, 0, z1 - 0.012, x1, 0.08, z1, M.wall, { r: 0.002 })
  box(x1 - 0.012, 0, -1.8, x1, 0.08, z1, M.wall, { r: 0.002 })
  ceilingSpots([[-1.6, -1.2], [-0.2, -1.2], [1.2, -1.2], [-1.6, 0.8], [1.8, 0.8], [0.2, 1.6]])
  // a little warm light from the pendants over the island
  const isl = new THREE.PointLight(0xffe2bd, 0.25, 3.5, 2)
  isl.position.set(0.2, 1.6, -0.2)
  scene.add(isl)
}

// fronts along a run: `faces` 'z' = facing +z (back wall run), 'x' = facing +x (left wall run)
// cols: widths in metres; rows(column index): list of [y0, y1] per column
function fronts(id, faces, plane, from, cols, rows) {
  let a = from
  for (const [i, w] of cols.entries()) {
    for (const [y0, y1] of rows(i)) {
      const b0 = a + GAP / 2, b1 = a + w - GAP / 2
      // each door's texture starts at its own lower corner, so every front
      // shows the same part of the decor (a marble reads alike on all doors)
      if (faces === 'z') box(b0, y0 + GAP / 2, plane, b1, y1 - GAP / 2, plane + DOOR_T, id, { r: 0.0025, origin: [b0, y0 + GAP / 2, plane] })
      else box(plane, y0 + GAP / 2, b0, plane + DOOR_T, y1 - GAP / 2, b1, id, { r: 0.0025, origin: [plane, y0 + GAP / 2, b0] })
    }
    a += w
  }
}

const BASE_DOOR = [BASE.plinth, BASE.top - 0.055]   // handleless: a gola channel above the doors
const drawers3 = () => [[BASE.plinth, 0.37], [0.37, 0.59], [0.59, BASE.top - 0.055]]

function buildKitchen() {
  const { z0, x0 } = ROOM
  const top = BASE.top, wt = BASE.top + BASE.worktop

  // back run: carcass, plinth, gola channel, fronts (hob drawers in the middle)
  const backFront = -1.84
  box(x0, BASE.plinth, z0, 1.0, top, backFront, 1, { r: 0 })
  box(x0, 0, z0, 1.0, BASE.plinth, backFront - 0.06, M.plinth, { r: 0 })
  box(-2.0, BASE.top - 0.055, backFront - 0.02, 1.0, top, backFront + 0.002, M.gola, { r: 0 })
  fronts(1, 'z', backFront, -2.0, [0.6, 0.6, 0.6, 0.6, 0.6], i => (i === 2 ? drawers3() : [BASE_DOOR]))

  // left run under the window, with the sink
  const leftFront = -1.98
  box(x0, BASE.plinth, -1.84, leftFront - DOOR_T, top, 0.6, 1, { r: 0 })
  box(x0, 0, -1.84, leftFront - 0.06, BASE.plinth, 0.6, M.plinth, { r: 0 })
  box(leftFront - 0.02, BASE.top - 0.055, -1.84, leftFront + 0.002, top, 0.6, M.gola, { r: 0 })
  fronts(1, 'x', leftFront - DOOR_T, -1.8, [0.6, 0.6, 0.6, 0.6], () => [BASE_DOOR])
  // end panel of the left run
  box(x0, 0, 0.6, leftFront + DOOR_T, top, 0.6 + DOOR_T, 1, { r: 0.002 })

  // worktops (L) — front edge 4 cm past the doors
  box(x0, top, z0, 1.0, wt, backFront + DOOR_T + 0.025, 5, { r: 0.004 })
  box(x0, top, backFront + DOOR_T + 0.025, leftFront + DOOR_T + 0.025, wt, 0.6 + DOOR_T + 0.01, 5, { r: 0.004 })

  // backsplash on both walls, up to the wall cabinets: one panel per wall,
  // both starting in the corner and sitting on the worktop (see `slab`)
  const corner = [x0, wt, z0]
  box(x0, wt, z0, 1.0, 1.45, z0 + 0.012, 6, { r: 0.001, origin: corner })
  box(x0, wt, z0 + 0.012, x0 + 0.012, 1.45, 0.6, 6, { r: 0.001, origin: corner })

  // hob with its cooking zones, sink and tap
  box(-1.42, wt, -2.3, -0.78, wt + 0.006, -1.82, M.black, { r: 0.002 })
  for (const [x, z, rad] of [[-1.25, -2.18, 0.09], [-0.95, -2.18, 0.07], [-1.25, -1.95, 0.07], [-0.95, -1.95, 0.09]]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(rad - 0.004, rad, 48), new THREE.MeshBasicMaterial({ color: 0x3a3a3a }))
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, wt + 0.0065, z); scene.add(ring)
  }
  box(-2.5, wt + 0.0005, -1.05, -2.08, wt + 0.002, -0.35, M.matblk, { r: 0 })
  box(-2.47, wt - 0.15, -1.02, -2.11, wt + 0.001, -0.38, M.matblk, { r: 0 })
  tap(-2.52, wt, -0.7)

  // tall units on the right: fridge, oven + microwave, pantry
  const tallTop = 2.4
  box(1.0, BASE.plinth, z0, ROOM.x1, tallTop, backFront, 3, { r: 0 })
  box(1.0, 0, z0, ROOM.x1, BASE.plinth, backFront - 0.06, M.plinth, { r: 0 })
  box(1.0, tallTop, z0, ROOM.x1, ROOM.h, backFront + DOOR_T, M.wall, { r: 0 })      // bulkhead to the ceiling
  box(1.0 - DOOR_T, BASE.plinth, z0, 1.0, tallTop, backFront + DOOR_T, 3, { r: 0.002 }) // side panel
  fronts(3, 'z', backFront, 1.0, [0.6], () => [[BASE.plinth, 1.45], [1.45, tallTop]])                  // fridge
  fronts(3, 'z', backFront, 1.6, [0.6], () => [[BASE.plinth, 0.74], [1.8, tallTop]])                   // oven column
  fronts(3, 'z', backFront, 2.2, [0.4], () => [[BASE.plinth, tallTop]])                                // pantry
  box(1.605, 0.76, backFront, 2.195, 1.36, backFront + 0.022, M.black, { r: 0.004 })   // oven
  box(1.62, 1.31, backFront + 0.022, 2.18, 1.325, backFront + 0.04, M.steel, { r: 0.006 })
  box(1.605, 1.38, backFront, 2.195, 1.78, backFront + 0.022, M.black, { r: 0.004 })   // microwave
  box(1.56, 0.9, backFront + DOOR_T, 1.575, 1.35, backFront + DOOR_T + 0.025, M.matblk, { r: 0.004 })  // fridge handles
  box(1.56, 1.55, backFront + DOOR_T, 1.575, 2.0, backFront + DOOR_T + 0.025, M.matblk, { r: 0.004 })

  // wall cabinets with an LED strip below, open shelves next to them
  const uy0 = 1.45, uy1 = 2.25, uFront = z0 + 0.35
  box(x0, uy0, z0, -0.3, uy1, uFront - DOOR_T, 2, { r: 0 })
  fronts(2, 'z', uFront - DOOR_T, x0, [0.575, 0.575, 0.575, 0.575], () => [[uy0, uy1]])
  box(x0, uy0 - 0.012, uFront - 0.06, -0.3, uy0 - 0.004, uFront - 0.04, M.led, { r: 0, shadow: false })
  box(-0.3, uy0, z0, -0.3 + DOOR_T, uy1, uFront, 2, { r: 0.002 })
  // wall cabinets along the left wall too, over the sink run
  const uSide = x0 + 0.35
  box(x0, uy0, uFront, uSide - DOOR_T, uy1, 0.6, 2, { r: 0 })
  fronts(2, 'x', uSide - DOOR_T, uFront, [0.6625, 0.6625, 0.6625, 0.6625], () => [[uy0, uy1]])
  box(uSide - 0.06, uy0 - 0.012, uFront, uSide - 0.04, uy0 - 0.004, 0.6, M.led, { r: 0, shadow: false })
  box(x0, uy0, 0.6, uSide, uy1, 0.6 + DOOR_T, 2, { r: 0.002 })
  for (const y of [1.55, 1.95]) box(-0.15, y, z0, 0.95, y + 0.04, z0 + 0.26, 8, { r: 0.003 })
  shelfItems(z0)

  // island: doors towards the cooking side, plain panels elsewhere, a thick top
  const ix0 = -0.9, ix1 = 1.3, iz0 = -0.72, iz1 = 0.2
  box(ix0, BASE.plinth, iz0 + DOOR_T, ix1, top, iz1, 4, { r: 0 })
  box(ix0 + 0.06, 0, iz0 + 0.06, ix1 - 0.06, BASE.plinth, iz1 - 0.06, M.plinth, { r: 0 })
  island(ix0, ix1, iz0, iz1, top)
  box(ix0 - 0.02, top, iz0 - 0.03, ix1 + 0.02, top + 0.06, iz1 + 0.35, 5, { r: 0.006 })
  islandItems(top + 0.06)
  for (const x of [-0.45, 0.2, 0.85]) stool(x, 0.82)
  for (const x of [-0.4, 0.2, 0.8]) pendant(x, -0.2)
}

function island(ix0, ix1, iz0, iz1, top) {
  // doors on the −z side
  const n = 4, w = (ix1 - ix0) / n
  fronts(4, 'z', iz0 - DOOR_T, ix0, Array(n).fill(w), () => [[BASE.plinth, top - 0.055]])
  box(ix0, top - 0.055, iz0 - 0.02, ix1, top, iz0 + DOOR_T, M.gola, { r: 0 })
  // seating side and the two ends as full panels
  box(ix0, 0, iz1, ix1, top, iz1 + DOOR_T, 4, { r: 0.002 })
  box(ix0 - DOOR_T, 0, iz0 - DOOR_T, ix0, top, iz1 + DOOR_T, 4, { r: 0.002 })
  box(ix1, 0, iz0 - DOOR_T, ix1 + DOOR_T, top, iz1 + DOOR_T, 4, { r: 0.002 })
}

// ── living room (after public/rooms/photos/living.png) ─────────────────────
// Back wall: slats on the left, MDF wall panels with the TV, open shelves with
// LED light on the right, a floating TV unit along the bottom. Sheer curtains
// on the left wall, an L-shaped sofa facing the TV, a round coffee table on a rug.
function buildLiving() {
  const { x0, x1, z0, z1, h } = ROOM

  // slat wall: two decorative wall panels, 600 mm each (their photo carries the
  // slats and the gaps, see panelTexture), lined up with the panel grid at x = 0
  const sx0 = -2.4, sx1 = -1.2
  box(sx0, 0, z0, sx1, h, z0 + 0.02, 2, { r: 0.001 })

  // MDF wall panels around the TV, and a narrow one right of the shelves
  const px0 = -1.2, px1 = 1.5
  fronts(1, 'z', z0, px0, Array(5).fill((px1 - px0) / 5), () => [[0, h - 0.004]])
  fronts(1, 'z', z0, 2.28, [x1 - 2.28], () => [[0, h - 0.004]])
  fronts(1, 'z', z0, 1.5, [0.78], () => [[0, 0.62], [2.62, h - 0.004]])          // below and above the shelves

  // TV on the wall
  box(-0.65, 1.12, z0 + 0.03, 0.95, 2.02, z0 + 0.07, M.matblk, { r: 0.006 })
  box(-0.635, 1.135, z0 + 0.07, 0.935, 2.005, z0 + 0.072, M.screen, { r: 0 })

  // open shelves: chipboard box with a middle divider, LED strip under each shelf
  const nx0 = 1.5, nx1 = 2.28, nd = 0.3, ny0 = 0.62, ny1 = 2.62, T = 0.019
  box(nx0, ny0, z0, nx1, ny1, z0 + 0.012, 4, { r: 0 })                                  // back
  box(nx0, ny0, z0, nx0 + T, ny1, z0 + nd, 4)                                           // sides
  box(nx1 - T, ny0, z0, nx1, ny1, z0 + nd, 4)
  box(nx0, ny1 - T, z0, nx1, ny1, z0 + nd, 4)                                           // top
  const mid = (nx0 + nx1) / 2
  box(mid - T / 2, ny0, z0, mid + T / 2, ny1, z0 + nd - 0.01, 4)
  for (const y of [1.06, 1.5, 1.94]) {
    box(nx0 + T, y, z0 + 0.012, nx1 - T, y + 0.025, z0 + nd - 0.01, 4)
    box(nx0 + T, y - 0.006, z0 + nd - 0.05, nx1 - T, y, z0 + nd - 0.035, M.led, { r: 0, shadow: false })
  }
  box(nx0 + T, ny1 - T - 0.006, z0 + nd - 0.05, nx1 - T, ny1 - T, z0 + nd - 0.035, M.led, { r: 0, shadow: false })
  const glow = new THREE.PointLight(0xffd9a8, 0.35, 1.6, 2)
  glow.position.set(mid, 1.7, z0 + 0.22); scene.add(glow)
  books(nx0 + 0.06, 1.085, z0 + 0.05, 5); books(mid + 0.08, 1.965, z0 + 0.05, 4); books(nx0 + 0.07, 1.525, z0 + 0.05, 3)
  cyl(0.05, 0.04, 0.12, mid + 0.18, 1.085, z0 + 0.15, M.ceramic)
  cyl(0.06, 0.06, 0.07, mid + 0.17, 1.525, z0 + 0.15, M.ceramic)
  trailing(mid + 0.17, 1.6, z0 + 0.15, 0.6)

  // floating TV unit with five drawers, LED glow underneath
  const ux0 = -1.65, ux1 = 2.55, uy0 = 0.28, uy1 = 0.62, ud = 0.45
  box(ux0, uy0, z0 + 0.012, ux1, uy1, z0 + ud - DOOR_T, 3, { r: 0 })
  fronts(3, 'z', z0 + ud - DOOR_T, ux0, Array(5).fill((ux1 - ux0) / 5), () => [[uy0, uy1]])
  const gc = document.createElement('canvas'); gc.width = 256; gc.height = 64
  const gg = gc.getContext('2d'), grad = gg.createLinearGradient(0, 0, 0, 64)
  grad.addColorStop(0, 'rgba(255,226,184,0.5)'); grad.addColorStop(1, 'rgba(255,226,184,0)')
  gg.fillStyle = grad; gg.fillRect(0, 0, 256, 64)
  const fade = gg.createLinearGradient(0, 0, 256, 0)
  fade.addColorStop(0, 'rgba(0,0,0,1)'); fade.addColorStop(0.08, 'rgba(0,0,0,0)'); fade.addColorStop(0.92, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)')
  gg.globalCompositeOperation = 'destination-out'; gg.fillStyle = fade; gg.fillRect(0, 0, 256, 64)
  const glowTex = new THREE.CanvasTexture(gc); glowTex.colorSpace = THREE.SRGBColorSpace
  const under = new THREE.Mesh(new THREE.PlaneGeometry(ux1 - ux0 - 0.1, 0.45), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false }))
  under.rotation.x = -Math.PI / 2; under.position.set((ux0 + ux1) / 2, 0.002, z0 + 0.24); scene.add(under)   // LED glow on the floor
  cyl(0.06, 0.05, 0.16, 0.95, uy1, z0 + 0.25, M.ceramic)
  foliage(0.95, uy1 + 0.14, z0 + 0.25, { n: 8, h: 0.34, spread: 0.16, size: 0.05, leaves: 7, seed: 4 })
  books(0.2, uy1, z0 + 0.12, 3, true)

  // ceiling: a light cove along the media wall, spots
  box(x0, h - 0.12, z0, x1, h, z0 + 0.5, M.ceiling, { r: 0, shadow: false })
  box(x0, h - 0.122, z0 + 0.5, x1, h - 0.11, z0 + 0.52, M.led, { r: 0, shadow: false })
  ceilingSpots([[-1.5, -0.8], [0.3, -0.8], [1.9, -0.8], [-1.5, 1.2], [0.3, 1.2], [1.9, 1.2]])

  // left wall: sheer curtains in front of a window, a heavier drape at each end
  curtain(x0 + 0.14, -2.4, 1.6, h - 0.05, M.sheer, 0.03)
  curtain(x0 + 0.24, -2.45, -1.85, h - 0.05, M.drape, 0.05)
  curtain(x0 + 0.24, 1.0, 1.65, h - 0.05, M.drape, 0.05)
  box(x0 + 0.02, h - 0.06, -2.45, x0 + 0.3, h, 1.7, M.ceiling, { r: 0 })                  // curtain pelmet

  // the rest of the room: a doorway behind, a door on the right wall
  frontWall({ x0: 0.9, x1: 1.8, y1: 2.15 })
  box(x1 - 0.04, 0, -0.2, x1, 2.15, 0.75, M.door, { r: 0.004 })
  box(x1 - 0.07, 0.95, 0.62, x1 - 0.04, 0.97, 0.7, M.matblk, { r: 0.004 })
  picture(-0.9, 1.55, z1 - 0.02, 1.2, 0.8, 'z')
  box(x0, 0, 1.7, x0 + 0.012, 0.08, z1, M.wall, { r: 0.002 })                              // skirting
  box(x1 - 0.012, 0, 0.8, x1, 0.08, z1, M.wall, { r: 0.002 })
  floorPlant(-2.5, -1.75)
  floorPlant(2.4, 2.15)

  rug(-0.35, 0.45, 3.4, 2.5)
  coffeeTable(-0.3, 0.25)
  sofa()
}

// ── bedroom (after public/rooms/photos/bedroom.png) ─────────────────────────
// Back wall: a wood band behind the bed and nightstands with an LED line along
// its top; above it decorative slat panels just as wide as the band, plain wall beside.
// An upholstered bed on a rug, floating nightstands with mushroom lamps, a
// full-height wardrobe along the right wall, sheer curtains on the left.
function buildBedroom() {
  const { x0, z0, z1, h } = ROOM
  const band = 1.05, wx = 2.0           // top of the wood band, front of the wardrobe

  // wood band behind the bed and nightstands, from the curtains to the wardrobe
  box(-1.8, 0, z0 + 0.02, wx, band, z0 + 0.045, 4, { r: 0.002 })
  box(-1.8, band - 0.004, z0 + 0.045, wx, band + 0.004, z0 + 0.055, M.led, { r: 0, shadow: false })
  // above the band: decorative slat panels exactly as wide as the band (600 mm
  // each on the panel grid, the last one cut at the wardrobe); plain wall left of it
  box(-1.8, band, z0, wx, h, z0 + 0.02, 3, { r: 0.001 })
  const bandGlow = new THREE.PointLight(0xffd9a8, 0.15, 1.6, 2)
  bandGlow.position.set(0.2, band + 0.05, z0 + 0.25); scene.add(bandGlow)

  // bed: upholstered frame and headboard, mattress, duvet, pillows, a throw at the foot
  const bx0 = -0.75, bx1 = 1.15, bz1 = -0.2, cx = (bx0 + bx1) / 2
  box(bx0 + 0.08, 0.3, z0 + 0.05, bx1 - 0.08, 1.12, z0 + 0.18, M.sofa, { r: 0.04 })
  box(cx - 0.004, 0.32, z0 + 0.175, cx + 0.004, 1.1, z0 + 0.185, M.seam, { r: 0 })
  box(bx0, 0.02, z0 + 0.16, bx1, 0.42, bz1, M.sofa, { r: 0.05 })
  box(bx0 + 0.06, 0.42, z0 + 0.2, bx1 - 0.06, 0.58, z0 + 0.8, M.ceramic, { r: 0.04 })          // sheet under the pillows
  box(bx0 + 0.01, 0.4, z0 + 0.72, bx1 - 0.01, 0.62, bz1 + 0.015, M.linen, { r: 0.06 })       // duvet over the sides
  box(bx0, 0.5, -0.92, bx1, 0.635, bz1 + 0.025, M.throw, { r: 0.05 })                        // throw at the foot
  for (const [x, c] of [[bx0 + 0.42, M.linen], [bx1 - 0.42, M.linen], [bx0 + 0.55, M.ceramic], [bx1 - 0.55, M.ceramic]]) {
    const back = c === M.linen
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.36, 0.14, 3, 0.06), c)
    m.position.set(x, back ? 0.8 : 0.74, z0 + (back ? 0.3 : 0.42)); m.rotation.x = -0.25; m.castShadow = true; scene.add(m)
  }
  rug(cx, -0.6, 3.4, 2.8)

  // floating nightstands with a drawer, mushroom lamps on top
  for (const [nx0, nx1] of [[-1.4, -0.85], [1.25, 1.8]]) {
    box(nx0, 0.32, z0 + 0.045, nx1, 0.6, z0 + 0.42 - DOOR_T, 5, { r: 0.002 })
    fronts(5, 'z', z0 + 0.42 - DOOR_T, nx0, [nx1 - nx0], () => [[0.32, 0.6]])
    lamp((nx0 + nx1) / 2, 0.6, z0 + 0.22)
  }

  // wardrobe along the right wall: six full-height doors, long dark handles
  const wz0 = z0, wz1 = 1.0, n = 6, dw = (wz1 - wz0) / n
  box(wx, 0, wz0, ROOM.x1, h, wz1, M.wall, { r: 0 })
  fronts(1, 'x', wx - DOOR_T, wz0, Array(n).fill(dw), () => [[0.03, h - 0.004]])
  box(wx - DOOR_T, 0, wz1, ROOM.x1, h, wz1 + DOOR_T, 1, { r: 0.002 })                      // end panel
  for (let i = 1; i < n; i += 2) {
    const z = wz0 + i * dw
    box(wx - DOOR_T - 0.012, 0.55, z - 0.02, wx - DOOR_T, 1.95, z - 0.008, M.handle, { r: 0.003 })
    box(wx - DOOR_T - 0.012, 0.55, z + 0.008, wx - DOOR_T, 1.95, z + 0.02, M.handle, { r: 0.003 })
  }

  // ceiling: two linear lights, spots near the door
  for (const x of [-1.1, 1.4]) box(x - 0.015, h - 0.006, -2.2, x + 0.015, h, 0.8, M.spot, { r: 0, shadow: false })
  ceilingSpots([[-0.6, 1.8], [1.0, 1.8]])

  // left wall: sheer curtains in front of a window, linen drapes at each side
  curtain(x0 + 0.14, -2.3, 0.7, h - 0.05, M.sheer, 0.03)
  curtain(x0 + 0.24, -1.2, -0.45, h - 0.05, M.drape, 0.05)
  curtain(x0 + 0.24, 0.1, 0.75, h - 0.05, M.drape, 0.05)
  box(x0 + 0.02, h - 0.06, -2.35, x0 + 0.3, h, 0.8, M.ceiling, { r: 0 })

  // behind the start view: a doorway, a print, a plant
  frontWall({ x0: -1.7, x1: -0.8, y1: 2.15 })
  picture(0.9, 1.5, z1 - 0.02, 1.0, 0.7, 'z')
  box(x0, 0, 0.8, x0 + 0.012, 0.08, z1, M.wall, { r: 0.002 })
  floorPlant(-2.25, 1.3)
}

// ── hallway (after public/rooms/photos/hallway.png) ─────────────────────────
// Back wall: a tall mirror with LED light round it over a floating console,
// two decorative slat panels with coat hooks and an upholstered bench in front,
// and a full-height wardrobe. The front door is on the right wall.
function buildHallway() {
  const { x0, x1, z0, z1, h } = ROOM

  // a wall column on the left, the mirror recess beside it
  box(x0, 0, z0, -1.5, h, z0 + 0.25, M.wall, { r: 0.002 })
  // a real mirror: it reflects the hallway (Reflector renders the mirrored view)
  const mirror = new Reflector(new THREE.PlaneGeometry(0.74, 2.2), {
    color: 0xc9cccd, textureWidth: 1024, textureHeight: 2048, clipBias: 0.003,
  })
  mirror.position.set(-1.05, 1.45, z0 + 0.016); scene.add(mirror)
  box(-1.42, 0.35, z0, -0.68, 2.55, z0 + 0.015, M.matblk, { r: 0.002 })
  for (const [a0, a1, b0, b1] of [[-1.46, -1.42, 0.31, 2.59], [-0.68, -0.64, 0.31, 2.59]]) box(a0, b0, z0, a1, b1, z0 + 0.02, M.led, { r: 0, shadow: false })
  box(-1.46, 2.55, z0, -0.64, 2.59, z0 + 0.02, M.led, { r: 0, shadow: false })
  const mirrorGlow = new THREE.PointLight(0xffdcae, 0.35, 2.2, 2)
  mirrorGlow.position.set(-1.05, 1.5, z0 + 0.35); scene.add(mirrorGlow)

  // floating console: two drawers, a vase and a diffuser on top
  const cx0 = -1.48, cx1 = -0.25, cy0 = 0.74, cy1 = 0.94, cd = 0.36
  box(cx0, cy0, z0, cx1, cy1, z0 + cd - DOOR_T, 3, { r: 0.002 })
  fronts(3, 'z', z0 + cd - DOOR_T, cx0, [(cx1 - cx0) / 2, (cx1 - cx0) / 2], () => [[cy0, cy1 - 0.03]])
  box(cx0, cy1 - 0.03, z0, cx1, cy1, z0 + cd, 3, { r: 0.002 })
  cyl(0.07, 0.05, 0.2, -1.2, cy1, z0 + 0.18, M.vase, 40)
  foliage(-1.2, cy1 + 0.18, z0 + 0.18, { n: 9, h: 0.3, spread: 0.16, size: 0.05, leaves: 8, seed: 6 })
  cyl(0.035, 0.035, 0.09, -0.62, cy1, z0 + 0.2, M.matblk, 20)
  for (let i = 0; i < 6; i++) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.24, 4), M.wood)
    stick.position.set(-0.62 + Math.sin(i) * 0.012, cy1 + 0.2, z0 + 0.2 + Math.cos(i) * 0.012); stick.rotation.z = Math.sin(i * 2) * 0.15
    scene.add(stick)
  }

  // two decorative slat panels (600 mm each, on the panel grid) with coat hooks
  box(-0.6, 0, z0, 0.6, h, z0 + 0.02, 2, { r: 0.001 })
  for (const x of [-0.35, 0, 0.35]) {
    box(x - 0.012, 1.86, z0 + 0.02, x + 0.012, 1.9, z0 + 0.09, M.matblk, { r: 0.006 })
    box(x - 0.012, 1.9, z0 + 0.07, x + 0.012, 1.95, z0 + 0.09, M.matblk, { r: 0.006 })
  }
  // upholstered bench in front of them
  box(-0.55, 0.02, z0 + 0.03, 0.55, 0.32, z0 + 0.45, M.sofa, { r: 0.03 })
  box(-0.54, 0.32, z0 + 0.035, -0.005, 0.45, z0 + 0.445, M.sofa, { r: 0.05 })
  box(0.005, 0.32, z0 + 0.035, 0.54, 0.45, z0 + 0.445, M.sofa, { r: 0.05 })
  box(-0.006, 0.04, z0 + 0.44, 0.006, 0.3, z0 + 0.452, M.seam, { r: 0 })

  // full-height wardrobe: four doors, slim dark handles low on two of them
  const wx0 = 0.6, wx1 = 2.4, wd = 0.6, n = 4, dw = (wx1 - wx0) / n
  box(wx0, 0, z0, wx1, h, z0 + wd - DOOR_T, M.wall, { r: 0 })
  fronts(1, 'z', z0 + wd - DOOR_T, wx0, Array(n).fill(dw), () => [[0.03, h - 0.004]])
  box(wx0 - DOOR_T, 0, z0, wx0, h, z0 + wd, 1, { r: 0.002 })                              // side panels
  box(wx1, 0, z0, wx1 + DOOR_T, h, z0 + wd, 1, { r: 0.002 })
  for (const i of [1, 3]) {
    const x = wx0 + i * dw
    box(x - 0.016, 0.25, z0 + wd, x - 0.006, 1.2, z0 + wd + 0.012, M.handle, { r: 0.003 })
  }

  // front door on the right wall: dark leaf, frame, handle and lock
  const dz0 = -0.2, dz1 = 0.75, dh = 2.15
  box(x1 - 0.05, 0, dz0, x1, dh, dz1, M.doorDark, { r: 0.004 })
  box(x1 - 0.07, 0, dz0 - 0.06, x1, dh + 0.06, dz0, M.doorFrame, { r: 0.003 })
  box(x1 - 0.07, 0, dz1, x1, dh + 0.06, dz1 + 0.06, M.doorFrame, { r: 0.003 })
  box(x1 - 0.07, dh, dz0, x1, dh + 0.06, dz1, M.doorFrame, { r: 0.003 })
  box(x1 - 0.09, 1.02, dz0 + 0.08, x1 - 0.05, 1.04, dz0 + 0.22, M.steel, { r: 0.006 })
  box(x1 - 0.06, 0.92, dz0 + 0.1, x1 - 0.05, 0.98, dz0 + 0.13, M.steel, { r: 0.004 })
  box(x1 - 0.06, 1.35, dz0 + 0.1, x1 - 0.05, 1.37, dz0 + 0.12, M.steel, { r: 0.004 })

  // ceiling: a recessed light line along the back and down the hall, spots
  box(x0 + 0.3, h - 0.006, z0 + 0.95, x1 - 0.3, h, z0 + 0.98, M.spot, { r: 0, shadow: false })
  box(x1 - 0.65, h - 0.006, z0 + 0.95, x1 - 0.62, h, z1 - 0.4, M.spot, { r: 0, shadow: false })
  ceilingSpots([[-1.0, 1.4], [0.6, 1.4]])

  // the rest: a doorway behind, a picture and a plant, skirting
  frontWall({ x0: -1.3, x1: -0.4, y1: 2.15 })
  picture(x0 + 0.02, 1.55, 0.9, 0.8, 0.6, 'xl')
  floorPlant(-1.85, 2.05)
  box(x0, 0, z0 + 0.25, x0 + 0.012, 0.08, z1, M.wall, { r: 0.002 })
  box(x1 - 0.012, 0, z0 + wd, x1, 0.08, dz0 - 0.06, M.wall, { r: 0.002 })
  box(x1 - 0.012, 0, dz1 + 0.06, x1, 0.08, z1, M.wall, { r: 0.002 })
}

// table lamp with a dark mushroom shade and a bronze base
function lamp(x, y, z) {
  cyl(0.06, 0.07, 0.03, x, y, z, M.bronze, 32)
  cyl(0.035, 0.035, 0.22, x, y + 0.03, z, M.bronze, 24)
  const shade = new THREE.Mesh(new THREE.SphereGeometry(0.15, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.lampShade)
  shade.position.set(x, y + 0.24, z); shade.scale.y = 0.85; shade.castShadow = true; scene.add(shade)
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.13, 32), M.spot)
  bulb.rotation.x = Math.PI / 2; bulb.position.set(x, y + 0.239, z); scene.add(bulb)
  const l = new THREE.PointLight(0xffd7a0, 0.25, 1.4, 2)
  l.position.set(x, y + 0.16, z + 0.05); scene.add(l)
}

// a trailing plant hanging from a pot at (x, y, z), strands up to `len` long
function trailing(x, y, z, len) {
  let sd = 11
  const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280)
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4f6b38, roughness: 0.7, side: THREE.DoubleSide })
  for (let k = 0; k < 7; k++) {
    const a = rnd() * Math.PI * 2, out = 0.05 + rnd() * 0.05, l = len * (0.5 + rnd() * 0.5)
    for (let t = 0; t <= 1; t += 0.06) {
      const leaf = new THREE.Mesh(leafGeo, leafMat)
      const r = out + t * 0.04
      leaf.position.set(x + Math.cos(a) * r + Math.sin(t * 9 + k) * 0.015, y - t * l, z + Math.sin(a) * r * 0.6)
      leaf.scale.setScalar(0.035 + rnd() * 0.015)
      leaf.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3)
      leaf.castShadow = true; scene.add(leaf)
    }
  }
}

// a row of books standing on a shelf at (x, y, z), or lying in a stack
function books(x, y, z, n, lying = false) {
  const colours = [0xece7de, 0xc9bba6, 0x3a3532, 0xe2dbd0, 0x8a7a68]
  for (let i = 0; i < n; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: colours[i % colours.length], roughness: 0.8 })
    if (lying) box(x, y + i * 0.03, z, x + 0.26 - i * 0.02, y + i * 0.03 + 0.028, z + 0.19, mat, { r: 0.003 })
    else box(x + i * 0.032, y, z, x + i * 0.032 + 0.028, y + 0.22 - (i % 3) * 0.02, z + 0.17, mat, { r: 0.003 })
  }
}

// a curtain hanging along the left wall at x, from z0 to z1: soft folds
function curtain(x, z0, z1, h, mat, depth) {
  const n = Math.max(8, Math.round((z1 - z0) / 0.012))
  const geo = new THREE.PlaneGeometry(z1 - z0, h, n, 1)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 52) * depth / 2 + Math.sin(p.getX(i) * 19) * depth / 4)
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, mat)
  m.rotation.y = Math.PI / 2
  m.position.set(x, h / 2, (z0 + z1) / 2)
  m.castShadow = m.receiveShadow = true
  scene.add(m)
}

// a woven rug: a soft grey with a fine irregular texture
function rug(cx, cz, w, d) {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = '#b9b4ad'; g.fillRect(0, 0, 512, 512)
  let sd = 7
  const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280)
  for (let i = 0; i < 9000; i++) {
    const v = 150 + rnd() * 70
    g.fillStyle = `rgba(${v},${v - 4},${v - 9},0.35)`
    g.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 10, 1.4)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 2)
  box(cx - w / 2, 0, cz - d / 2, cx + w / 2, 0.012, cz + d / 2, new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }), { r: 0.004, shadow: false })
}

// round coffee table: dark drum base, marble top
function coffeeTable(x, z) {
  cyl(0.42, 0.42, 0.3, x, 0.012, z, M.drum, 64)
  const top = cyl(0.46, 0.46, 0.05, x, 0.31, z, M.marble, 64)
  top.castShadow = true
  cyl(0.2, 0.2, 0.012, x + 0.05, 0.36, z, M.matblk, 40)                               // tray
  cyl(0.045, 0.04, 0.09, x - 0.02, 0.372, z, M.ceramic)
  cyl(0.06, 0.05, 0.14, x + 0.12, 0.372, z + 0.04, M.glass)
  foliage(x + 0.12, 0.47, z + 0.04, { n: 5, h: 0.22, spread: 0.1, size: 0.04, leaves: 6, seed: 2 })
}

// L-shaped sofa: seats along the front wall side, a chaise towards the TV
function sofa() {
  const f = M.sofa, sh = 0.42
  const seat = (x0, z0, x1, z1) => {
    box(x0, 0.06, z0, x1, sh - 0.12, z1, f, { r: 0.03 })                                // base
    box(x0 + 0.01, sh - 0.12, z0 + 0.01, x1 - 0.01, sh, z1 - 0.01, f, { r: 0.05 })        // cushion
  }
  // main part, back towards the doorway
  seat(-2.15, 1.45, 0.7, 2.3)
  box(-2.15, 0.06, 2.12, 0.7, 0.82, 2.35, f, { r: 0.06 })                                // backrest
  for (const x0 of [-1.4, -0.45]) box(x0, sh, 1.95, x0 + 0.9, 0.72, 2.14, f, { r: 0.08 })  // back cushions
  box(0.55, 0.06, 1.45, 0.75, 0.62, 2.35, f, { r: 0.06 })                                 // arm
  // chaise
  seat(-2.15, 0.45, -1.15, 1.45)
  box(-2.35, 0.06, 0.45, -2.15, 0.82, 2.35, f, { r: 0.06 })                              // side backrest
  box(-2.15, sh, 0.6, -1.95, 0.72, 1.85, f, { r: 0.08 })
  // legs
  for (const [x, z] of [[-2.25, 0.5], [0.65, 1.5], [0.65, 2.3], [-1.2, 0.5], [-2.25, 2.3]]) box(x - 0.02, 0, z - 0.02, x + 0.02, 0.06, z + 0.02, M.matblk, { r: 0.004 })
  // throw cushions
  for (const [x, z, c] of [[-1.9, 1.95, 0x9c8f80], [0.3, 1.95, 0xd8cfc2], [-1.95, 0.75, 0xd8cfc2]]) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.4, 0.13, 3, 0.06), new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }))
    m.position.set(x, sh + 0.2, z); m.rotation.set(-0.15, x < -1.5 && z < 1.2 ? Math.PI / 2 : 0, 0); m.castShadow = true; scene.add(m)
  }
}

// ── props ───────────────────────────────────────────────────────────────────
// a framed print on a wall: a soft two-tone abstract on canvas
function picture(x, y, z, w, h, faces) {
  const c = document.createElement('canvas')
  c.width = 512; c.height = Math.round(512 * h / w)
  const g = c.getContext('2d')
  g.fillStyle = '#e9e1d4'; g.fillRect(0, 0, c.width, c.height)
  g.fillStyle = '#b89a78'; g.beginPath(); g.arc(c.width * 0.38, c.height * 0.55, c.height * 0.3, 0, Math.PI * 2); g.fill()
  g.fillStyle = '#6f7a6a'; g.fillRect(c.width * 0.55, c.height * 0.2, c.width * 0.22, c.height * 0.6)
  g.fillStyle = '#3d3a36'; g.fillRect(c.width * 0.18, c.height * 0.82, c.width * 0.64, 3)
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace
  const art = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })
  const d = 0.03
  if (faces === 'z') {
    box(x - w / 2, y - h / 2, z - d, x + w / 2, y + h / 2, z, M.matblk, { r: 0.004 })
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), art)
    p.position.set(x, y, z - d - 0.001); p.rotation.y = Math.PI; scene.add(p)
  } else if (faces === 'xl') {
    box(x, y - h / 2, z - w / 2, x + d, y + h / 2, z + w / 2, M.matblk, { r: 0.004 })
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), art)
    p.position.set(x + d + 0.001, y, z); p.rotation.y = Math.PI / 2; scene.add(p)
  } else {
    box(x - d, y - h / 2, z - w / 2, x, y + h / 2, z + w / 2, M.matblk, { r: 0.004 })
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), art)
    p.position.set(x - d - 0.001, y, z); p.rotation.y = -Math.PI / 2; scene.add(p)
  }
}

// leaves on stems rising from (x, y, z): `n` stems up to `h` tall, leaves `size` long
const leafGeo = (() => {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0); shape.quadraticCurveTo(0.45, 0.45, 0, 1); shape.quadraticCurveTo(-0.45, 0.45, 0, 0)
  return new THREE.ShapeGeometry(shape, 6)
})()
function foliage(x, y, z, { n = 7, h = 0.35, spread = 0.12, size = 0.07, leaves = 6, seed = 1 } = {}) {
  let sd = seed * 7919
  const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280)
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x52693d, roughness: 0.7, side: THREE.DoubleSide })
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, lean = spread * (0.4 + rnd() * 0.6), top = h * (0.6 + rnd() * 0.4)
    const end = new THREE.Vector3(x + Math.cos(a) * lean, y + top, z + Math.sin(a) * lean)
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.004, top, 5), M.wood)
    stem.position.set((x + end.x) / 2, y + top / 2, (z + end.z) / 2)
    stem.lookAt(end); stem.rotateX(Math.PI / 2); scene.add(stem)
    for (let j = 0; j < leaves; j++) {
      const t = 0.35 + 0.65 * (j / leaves)
      const leaf = new THREE.Mesh(leafGeo, leafMat)
      leaf.position.set(x + (end.x - x) * t, y + top * t, z + (end.z - z) * t)
      leaf.scale.setScalar(size * (0.7 + rnd() * 0.5))
      leaf.rotation.set(-0.6 - rnd() * 0.8, rnd() * Math.PI * 2, (rnd() - 0.5) * 1.2)
      leaf.castShadow = true; scene.add(leaf)
    }
  }
}

// a tall plant in a pot
function floorPlant(x, z) {
  cyl(0.17, 0.13, 0.42, x, 0, z, M.ceramic, 40)
  foliage(x, 0.42, z, { n: 14, h: 1.25, spread: 0.32, size: 0.13, leaves: 9, seed: Math.round(x * 10 + z * 100) })
}

function cyl(r0, r1, h, x, y, z, mat, seg = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat)
  m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true
  scene.add(m)
  return m
}

function tap(x, y, z) {
  cyl(0.022, 0.022, 0.03, x, y, z, M.matblk)
  cyl(0.013, 0.013, 0.3, x, y + 0.03, z, M.matblk)
  const spout = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 12, 32, Math.PI), M.matblk)
  spout.position.set(x + 0.1, y + 0.33, z); spout.rotation.y = 0
  spout.castShadow = true
  scene.add(spout)
}

function stool(x, z) {
  cyl(0.2, 0.19, 0.06, x, 0.68, z, M.fabric)
  for (const [dx, dz] of [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.69, 10), M.matblk)
    leg.position.set(x + dx * 0.95, 0.345, z + dz * 0.95); leg.castShadow = true
    scene.add(leg)
  }
  box(x - 0.14, 0.25, z - 0.006, x + 0.14, 0.262, z + 0.006, M.matblk, { r: 0.004 })
}

function pendant(x, z) {
  const y = 1.85
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, ROOM.h - y, 6), M.matblk)
  cord.position.set(x, (ROOM.h + y) / 2, z); scene.add(cord)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.04, 16), M.matblk)
  cap.position.set(x, y + 0.085, z); scene.add(cap)
  const shade = new THREE.Mesh(new THREE.SphereGeometry(0.085, 32, 16), M.glow)
  shade.position.set(x, y, z); scene.add(shade)
}

function shelfItems(z0) {
  cyl(0.06, 0.05, 0.16, -0.02, 1.59, z0 + 0.13, M.ceramic)
  cyl(0.045, 0.045, 0.2, 0.15, 1.59, z0 + 0.12, M.glass)
  cyl(0.05, 0.05, 0.12, 0.72, 1.99, z0 + 0.13, M.ceramic)
  for (let i = 0; i < 5; i++) box(0.3 + i * 0.035, 1.99, z0 + 0.04, 0.33 + i * 0.035, 2.2 - (i % 2) * 0.03, z0 + 0.22, i % 2 ? M.fabric : M.wood, { r: 0.002 })
  foliage(0.72, 2.11, z0 + 0.13, { n: 6, h: 0.16, spread: 0.12, size: 0.05, leaves: 5, seed: 3 })
}

function islandItems(y) {
  cyl(0.15, 0.1, 0.07, -0.25, y, -0.3, M.ceramic, 48)
  for (const [dx, dz] of [[-0.05, 0], [0.05, 0.03], [0, -0.05]]) {
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), new THREE.MeshStandardMaterial({ color: 0xc9a34a, roughness: 0.5 }))
    fruit.position.set(-0.25 + dx, y + 0.08, -0.3 + dz); fruit.castShadow = true; scene.add(fruit)
  }
  cyl(0.05, 0.04, 0.22, 0.75, y, -0.35, M.glass)
  foliage(0.75, y + 0.2, -0.35, { n: 6, h: 0.32, spread: 0.1, size: 0.05, leaves: 7, seed: 5 })
  box(-0.75, y, -0.6, -0.4, y + 0.02, -0.38, M.wood, { r: 0.006 })
}

// ── lighting ────────────────────────────────────────────────────────────────
function buildLights() {
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.72
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d1c6, 0.2))

  // soft light from above, for the shadows under the cabinets, island and stools
  const sun = new THREE.DirectionalLight(0xfff6ea, 0.7)
  sun.position.set(0.9, 8, 1.4)
  sun.target.position.set(0, 0, -0.4)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 14 })
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.02
  sun.shadow.radius = 6
  scene.add(sun, sun.target)
}

// ── decors ──────────────────────────────────────────────────────────────────
const loader = new THREE.TextureLoader()
const images = new Map()   // url → Promise<image>
const loadImage = url => {
  if (!images.has(url)) images.set(url, new Promise((res, rej) => loader.load(encodeURI(url), t => res(t.image), undefined, rej)))
  return images.get(url)
}

// does a decor photo's grain run up and down? (more contrast across than along)
function grainIsVertical(img) {
  const n = 96, c = document.createElement('canvas')
  c.width = c.height = n
  const g = c.getContext('2d', { willReadFrequently: true })
  g.drawImage(img, 0, 0, n, n)
  const d = g.getImageData(0, 0, n, n).data
  const L = i => d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]
  let across = 0, along = 0
  for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) {
    const i = y * n + x
    across += (L(i + 1) - L(i)) ** 2
    along += (L(i + n) - L(i)) ** 2
  }
  return across > along
}

// floor planks cut from a single-board photo: 1.38 × 0.193 m, staggered rows,
// each plank a different piece of the photo, a slightly different tone and a
// fine bevelled groove all round. Tiles seamlessly over 2.76 × 2.316 m.
const PLANK = { l: 1.38, w: 0.193, cols: 2, rows: 12 }
const plankCache = new Map()
function plankTexture(img, key) {
  if (plankCache.has(key)) return plankCache.get(key)
  const pxm = 740
  const W = Math.round(PLANK.l * PLANK.cols * pxm), H = Math.round(PLANK.w * PLANK.rows * pxm)
  const pl = PLANK.l * pxm, pw = H / PLANK.rows
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  const vertical = grainIsVertical(img)
  let seed = [...key].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7)
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
  const iw = img.width, ih = img.height
  const drawPlank = (x, y) => {
    g.save()
    g.beginPath(); g.rect(x, y, pl, pw); g.clip()
    if (vertical) {
      // grain up the photo: take a narrow upright strip and lay it down
      const sw = Math.min(iw, ih * pw / pl), sx = rnd() * (iw - sw)
      g.translate(x, y + pw); g.rotate(-Math.PI / 2)
      g.drawImage(img, sx, 0, sw, ih, 0, 0, pw, pl)
    } else {
      const sh = Math.min(ih, iw * pw / pl), sy = rnd() * (ih - sh)
      g.drawImage(img, 0, sy, iw, sh, x, y, pl, pw)
    }
    g.restore()
    const tone = (rnd() - 0.5) * 0.09
    g.fillStyle = tone > 0 ? `rgba(255,255,255,${tone})` : `rgba(0,0,0,${-tone})`
    g.fillRect(x, y, pl, pw)
    // groove: dark line with a soft lit bevel on one side
    g.fillStyle = 'rgba(0,0,0,0.32)'
    g.fillRect(x, y, pl, 1.6); g.fillRect(x, y, 1.6, pw)
    g.fillStyle = 'rgba(0,0,0,0.10)'
    g.fillRect(x, y + 1.6, pl, 1.6); g.fillRect(x + 1.6, y, 1.6, pw)
    g.fillStyle = 'rgba(255,255,255,0.06)'
    g.fillRect(x, y + pw - 1.5, pl, 1.5)
  }
  for (let r = 0; r < PLANK.rows; r++) {
    const off = (0.2 + rnd() * 0.6) * pl
    for (let x = -off; x < W; x += pl) {
      drawPlank(x, r * pw)
      if (x < 0) drawPlank(x + W, r * pw)
      if (x + pl > W) drawPlank(x - W, r * pw)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1 / (PLANK.l * PLANK.cols), 1 / (PLANK.w * PLANK.rows))
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
  plankCache.set(key, tex)
  return tex
}

// decorative wall panels are 600 mm wide; their photos show one whole panel
const PANEL_W = 0.6

// how shiny a decor is: MDF by its `gloss` flag, other boards from their name.
// High gloss = a smooth base under a mirror-like lacquer coat, so the room
// reflects in it while the decor keeps its colour.
const GLOSSY = { roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03 }
function finish(surface, swatch) {
  const name = `${swatch.name ?? ''} ${swatch.code}`
  const matt = { clearcoat: 0, clearcoatRoughness: 0 }
  if (surface.category === 'mdf') {
    if (swatch.gloss) return GLOSSY
    return { ...matt, roughness: /soft touch/i.test(name) ? 0.82 : 0.6 }
  }
  if (swatch.gloss || /GLOSS|SJAJ|PARLAK|IPAK/i.test(name)) return GLOSSY
  if (/soft touch|supermat/i.test(name)) return { ...matt, roughness: 0.82 }
  return { ...matt, ...{ countertop: { roughness: 0.32 }, laminate: { roughness: 0.55 }, chipboard: { roughness: 0.62 }, panels: { roughness: 0.6 } }[surface.category] }
}

let applyToken = 0
async function applySelections() {
  const token = ++applyToken
  await Promise.all(props.room.surfaces.map(async s => {
    const swatch = props.selections[s.id]
    if (!swatch) return
    const mat = surfaceMat(s.id)
    Object.assign(mat, finish(s, swatch), { metalness: 0 })
    if (!swatch.image) {
      if (token !== applyToken) return
      mat.map = null; mat.color.set(swatch.color); mat.needsUpdate = true
      return
    }
    const img = await loadImage(swatch.texture ?? swatch.image)
    if (token !== applyToken) return
    let tex
    mat.bumpMap = null
    if (s.category === 'laminate') tex = plankTexture(img, swatch.texture ?? swatch.image)
    else if (s.category === 'panels') {
      // a decorative wall panel photo is one whole 600 mm panel: repeat it
      // side by side at its real size, and let its dark gaps sit deeper (bump)
      tex = new THREE.Texture(img)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.MirroredRepeatWrapping
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
      tex.repeat.set(1 / PANEL_W, img.width / (img.height * PANEL_W))
      tex.needsUpdate = true
      mat.bumpMap = tex
      mat.bumpScale = 4
    } else if (s.slab) {
      // a long panel (the backsplash): the photo spans the panel's full
      // length once, unmirrored, so no vein is folded back on itself
      tex = new THREE.Texture(img)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
      tex.repeat.set(1 / s.slab, img.width / (img.height * s.slab))
      tex.needsUpdate = true
    } else {
      tex = new THREE.Texture(img)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
      // a pattern shown as photographed is laid at the board's real size (its
      // photo spans the board's width), so a door shows one calm piece of it
      const asp = img.width / img.height
      const tile = swatch.asIs && swatch.dimensions ? swatch.dimensions.width / 1000 : s.tile ?? 0.8
      // turned to follow the surface's grain, unless the decor is a pattern to show as photographed
      const rotate = !swatch.asIs && s.grain && (s.grain === 'h') === grainIsVertical(img)
      // rotated by 90° the photo's width runs up the face instead of across;
      // either way its width covers tile × aspect metres and its height tile
      tex.rotation = rotate ? Math.PI / 2 : 0
      tex.repeat.set(1 / (tile * asp), 1 / tile)
      tex.needsUpdate = true
    }
    const old = mat.map
    mat.map = tex
    mat.color.set(0xffffff)
    mat.needsUpdate = true
    if (old && old !== tex && !(old instanceof THREE.CanvasTexture)) old.dispose()   // planks stay cached
  }))
}

// ── camera: look around from a spot, walk by double-clicking the floor ─────
function updateCamera() {
  camera.position.copy(view.pos)
  const cp = Math.cos(view.pitch)
  camera.lookAt(view.pos.x + Math.sin(view.yaw) * cp, view.pos.y + Math.sin(view.pitch), view.pos.z + Math.cos(view.yaw) * cp)
  if (camera.fov !== view.fov) { camera.fov = view.fov; camera.updateProjectionMatrix() }
}

// free floor to stand on: inside the room's bounds, away from the furniture
const walkable = (x, z) => SC.walkable(x, z)

const ray = new THREE.Raycaster()
const ndc = new THREE.Vector2()
function hit(clientX, clientY) {
  const r = canvasRef.value.getBoundingClientRect()
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
  ray.setFromCamera(ndc, camera)
  return ray.intersectObjects(pickables, false)[0]
}

const pointers = new Map()
let drag = null, pinch = 0, lastTap = 0

function onPointerDown(e) {
  canvasRef.value.setPointerCapture(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false }
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); drag = null }
}

function onPointerMove(e) {
  if (!pointers.has(e.pointerId)) {
    const h = hit(e.clientX, e.clientY)
    hoverId.value = h?.object.userData.surface ?? 0
    return
  }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    const d = Math.hypot(a.x - b.x, a.y - b.y)
    zoom((pinch - d) * 0.12); pinch = d
    return
  }
  if (!drag) return
  const k = (view.fov * Math.PI / 180) / canvasRef.value.clientHeight
  view.yaw += (e.clientX - drag.x) * k
  view.pitch = Math.max(-1.25, Math.min(1.0, view.pitch + (e.clientY - drag.y) * k))
  drag.x = e.clientX; drag.y = e.clientY
  if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) drag.moved = true
}

function onPointerUp(e) {
  pointers.delete(e.pointerId)
  if (drag && !drag.moved) {
    const now = performance.now(), h = hit(e.clientX, e.clientY)
    if (now - lastTap < 320 && h?.object.userData.surface === SC.floor) {
      const b = SC.bounds
      const x = Math.max(b.x0, Math.min(b.x1, h.point.x)), z = Math.max(b.z0, Math.min(b.z1, h.point.z))
      if (walkable(x, z)) walkTo = new THREE.Vector3(x, view.pos.y, z)
    } else if (h) emit('select', h.object.userData.surface)
    lastTap = now
  }
  drag = null
}

function onWheel(e) { e.preventDefault(); zoom(e.deltaY * 0.03) }
function zoom(d) { view.fov = Math.max(30, Math.min(100, view.fov + d)) }

// ── markers ─────────────────────────────────────────────────────────────────
const tmp = new THREE.Vector3()
const seeRay = new THREE.Raycaster()
// is the anchor in sight, or is something (the island, a wall) in front of it?
function visible(a) {
  tmp.set(...a).sub(camera.position)
  const dist = tmp.length()
  seeRay.set(camera.position, tmp.normalize())
  seeRay.far = dist - 0.06
  return seeRay.intersectObjects(scene.children, false).length === 0
}

function placeMarkers() {
  const w = canvasRef.value.clientWidth, h = canvasRef.value.clientHeight
  for (const s of props.room.surfaces) {
    const el = markerRefs.value[s.id], a = ANCHORS[s.key]
    if (!el || !a) continue
    const hidden = !visible(a)
    tmp.set(...a).project(camera)
    const off = hidden || tmp.z > 1 || Math.abs(tmp.x) > 1.02 || Math.abs(tmp.y) > 1.02
    el.style.opacity = off ? '0' : ''
    el.style.pointerEvents = off ? 'none' : ''
    el.style.transform = `translate(${(tmp.x + 1) / 2 * w}px, ${(1 - tmp.y) / 2 * h}px) translate(-50%, -50%)`
  }
}

// ── loop ────────────────────────────────────────────────────────────────────
const warm = new THREE.Color(0xffd9a0)
function frame() {
  raf = requestAnimationFrame(frame)
  if (walkTo) {
    view.pos.lerp(walkTo, 0.08)
    if (view.pos.distanceTo(walkTo) < 0.01) walkTo = null
  }
  updateCamera()
  pulse *= 0.94
  for (const [id, mat] of surfaceMats) {
    const k = (id === props.selected ? pulse * 0.22 : 0) + (id === hoverId.value ? 0.05 : 0)
    mat.emissive.copy(warm).multiplyScalar(k)
  }
  if (composer) composer.render()
  else renderer.render(scene, camera)
  placeMarkers()
}

function resize() {
  const { clientWidth: w, clientHeight: h } = wrapRef.value
  renderer.setSize(w, h, false)
  composer?.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

onMounted(async () => {
  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping    // keeps decor colours as they are
  renderer.toneMappingExposure = 0.9
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xebe6df)
  camera = new THREE.PerspectiveCamera(view.fov, 1, 0.05, 30)

  plainMaterials()
  buildLights()
  buildRoom()
  SC.build()

  // ambient occlusion for the soft contact shadows; skipped on small screens
  if (wrapRef.value.clientWidth >= 700) {
    const { clientWidth: w, clientHeight: h } = wrapRef.value
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(w, h, { samples: 4, type: THREE.HalfFloatType }))
    composer.addPass(new RenderPass(scene, camera))
    const ao = new GTAOPass(scene, camera, w, h)
    ao.updateGtaoMaterial({ radius: 0.5, distanceExponent: 1.5, thickness: 1, scale: 1.2 })
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 10, rings: 3, samples: 24 })
    ao.blendIntensity = 0.85
    composer.addPass(ao)
    composer.addPass(new OutputPass())
  }

  ro = new ResizeObserver(resize)
  ro.observe(wrapRef.value)
  resize()
  view.fov = startFov()
  canvasRef.value.addEventListener('wheel', onWheel, { passive: false })
  raf = requestAnimationFrame(frame)
  await applySelections()
  loading.value = false
  emit('loaded')
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
  scene?.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose?.(); o.material?.dispose?.() })
  plankCache.forEach(t => t.dispose())
  composer?.dispose?.()
  renderer?.dispose()
})

watch(() => props.selections, applySelections, { deep: true })
watch(() => props.selected, () => { pulse = 1 })

defineExpose({
  zoom,
  reset() { Object.assign(view, { yaw: START.yaw, pitch: START.pitch, fov: startFov() }); view.pos.set(...START.pos); walkTo = null },
  screenshot() { return canvasRef.value.toDataURL('image/jpeg', 0.92) },
})
</script>

<template>
  <div ref="wrapRef" class="k3d" :class="{ hovering: hoverId }">
    <canvas
      ref="canvasRef"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="hoverId = 0"
    ></canvas>

    <button
      v-for="s in room.surfaces"
      v-show="!loading"
      :key="s.id"
      :ref="el => { markerRefs[s.id] = el }"
      :class="['marker', { active: selected === s.id }]"
      :aria-label="s.label"
      @click="emit('select', s.id)"
    >
      <span class="marker-dot">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M13.5 6.5A5.5 5.5 0 0 0 3.2 4.3M2.5 9.5a5.5 5.5 0 0 0 10.3 2.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M3 1.8v2.7h2.7M13 14.2v-2.7h-2.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="marker-label">{{ s.label }}</span>
    </button>

    <Transition name="fade">
      <div v-if="loading" class="loader"><span class="spinner"></span></div>
    </Transition>
  </div>
</template>

<style scoped>
.k3d {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #e9e3da;
  user-select: none;
  -webkit-user-select: none;
}
canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}
canvas:active { cursor: grabbing; }
.hovering canvas { cursor: pointer; }

.marker {
  position: absolute;
  top: 0; left: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: opacity 0.2s ease;
  will-change: transform;
}
.marker-dot {
  width: 34px; height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 4px 14px rgba(43, 39, 36, 0.25);
  position: relative;
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}
.marker-dot::after {
  content: '';
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.7);
}
.marker-label {
  position: absolute;
  left: 42px;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.94);
  padding: 5px 10px;
  border-radius: 0;
  box-shadow: 0 4px 14px rgba(43, 39, 36, 0.18);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
}
.marker:hover .marker-dot, .marker.active .marker-dot { transform: scale(1.1); background: var(--accent); color: #fff; }
.marker:hover .marker-label, .marker.active .marker-label { opacity: 1; transform: none; }

.loader {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(6px);
}
.spinner {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 3px solid var(--accent-dim);
  border-top-color: var(--accent);
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
