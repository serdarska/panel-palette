// Placeholder interiors for the 360° studio. These are simple real-time
// scenes; a 3D artist's renders can replace them room by room as long as
// they follow tools/ROOMS.md. Units are metres, y is up, the panorama faces -z.
import * as THREE from 'three'

const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace)
const std = (hex, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color: hex, roughness, metalness })

// Changeable surfaces are rendered plain white so the viewer can relight any
// material with the render's own shading. Keep in sync with ALBEDO in PanoViewer.
export const ALBEDO = 0.8
const surfaceMat = new THREE.MeshStandardMaterial({ color: lin(ALBEDO, ALBEDO, ALBEDO), roughness: 0.65 })

const M = {
  wall:    std('#ece7df', 0.95),
  ceiling: std('#f5f3ef', 0.95),
  skirt:   std('#f1eee9', 0.6),
  dark:    std('#232120', 0.7),
  metal:   std('#2b2a29', 0.35, 0.7),
  steel:   std('#c9c9c9', 0.25, 0.9),
  black:   std('#0e0e0f', 0.12, 0.1),
  fabric:  std('#b9b2a8', 1),
  fabric2: std('#8d877f', 1),
  linen:   std('#e9e4dc', 1),
  rug:     std('#d7cdbf', 1),
  green:   std('#56704a', 0.9),
  pot:     std('#d9d3c9', 0.7),
  art:     std('#7b8b76', 0.9),
  art2:    std('#c9a27e', 0.9),
  door:    std('#4a3a2e', 0.6),
  mirror:  new THREE.MeshStandardMaterial({ color: '#cfd8dc', roughness: 0.08, metalness: 0.25 }),
  frame:   std('#3a3836', 0.5, 0.3),
  sky:     new THREE.MeshBasicMaterial({ color: lin(2.6, 2.75, 2.9) }),
  glow:    new THREE.MeshBasicMaterial({ color: lin(3.2, 2.6, 1.9) }),
  books:   ['#8a6f55', '#3d4a52', '#c7b9a3', '#6d3f35', '#a8a39a'].map(c => std(c, 0.9)),
}

let floorMat = null
async function loadFloor() {
  if (floorMat) return floorMat
  const tex = await new THREE.TextureLoader().loadAsync('/materials/chipboard/7787 Delano Oak 18mm.png')
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping
  tex.anisotropy = 8
  floorMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })
  return floorMat
}

// ── helpers ─────────────────────────────────────────────────────────────────
function makeBox(scene) {
  // Axis-aligned box from two corners; `surface` > 0 marks a changeable surface
  return (x0, y0, z0, x1, y1, z1, mat, surface = 0, shadow = true) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)),
      surface ? surfaceMat : mat,
    )
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    m.castShadow = shadow
    m.receiveShadow = true
    m.userData.surface = surface
    scene.add(m)
    return m
  }
}

function cyl(scene, r, h, x, y, z, mat, surface = 0, segs = 40) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segs), surface ? surfaceMat : mat)
  m.position.set(x, y + h / 2, z)
  m.castShadow = m.receiveShadow = true
  m.userData.surface = surface
  scene.add(m)
  return m
}

function plant(scene, x, z, s = 1) {
  cyl(scene, 0.16 * s, 0.38 * s, x, 0, z, M.pot)
  for (const [dx, dy, dz, r] of [[0, 0.62, 0, 0.26], [0.12, 0.8, 0.05, 0.2], [-0.1, 0.78, -0.06, 0.19], [0.02, 0.98, 0, 0.15]]) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), M.green)
    leaf.position.set(x + dx * s, dy * s, z + dz * s)
    leaf.castShadow = leaf.receiveShadow = true
    scene.add(leaf)
  }
}

function pointLight(scene, x, y, z, intensity, shadow = false, color = 0xffe7c9) {
  const l = new THREE.PointLight(color, intensity, 0, 2)
  l.position.set(x, y, z)
  if (shadow) {
    l.castShadow = true
    l.shadow.mapSize.set(1024, 1024)
    l.shadow.bias = -0.002
    l.shadow.radius = 6
  }
  scene.add(l)
  // visible downlight disc in the ceiling
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 24), M.glow)
  disc.position.set(x, y + 0.095, z)
  scene.add(disc)
}

// Room shell with window holes. Windows: { wall: 'back'|'front'|'left'|'right', s0, s1, y0, y1 }
// where s runs along x for back/front walls and along z for left/right walls.
// `floorSurface` > 0 makes the floor a changeable (laminate) surface.
function shell(scene, box, { x0, x1, z0, z1, h, windows = [] }, floor, floorSurface = 0) {
  const T = 0.15
  const f = box(x0 - T, -0.05, z0 - T, x1 + T, 0, z1 + T, floor, floorSurface)
  // floor texture: one tile ≈ 0.6 m
  f.geometry.attributes.uv.array.forEach((_, i, a) => { a[i] *= i % 2 ? (z1 - z0) / 0.6 : (x1 - x0) / 0.6 })
  box(x0 - T, h, z0 - T, x1 + T, h + 0.05, z1 + T, M.ceiling)

  const walls = {
    back:  { s: [x0, x1], piece: (a, b, c, d) => box(a, c, z0 - T, b, d, z0, M.wall) },
    front: { s: [x0, x1], piece: (a, b, c, d) => box(a, c, z1, b, d, z1 + T, M.wall) },
    left:  { s: [z0, z1], piece: (a, b, c, d) => box(x0 - T, c, a, x0, d, b, M.wall) },
    right: { s: [z0, z1], piece: (a, b, c, d) => box(x1, c, a, x1 + T, d, b, M.wall) },
  }
  for (const [name, w] of Object.entries(walls)) {
    const holes = windows.filter(win => win.wall === name).sort((a, b) => a.s0 - b.s0)
    let cur = w.s[0]
    for (const hole of holes) {
      w.piece(cur, hole.s0, 0, h)
      w.piece(hole.s0, hole.s1, 0, hole.y0)
      w.piece(hole.s0, hole.s1, hole.y1, h)
      cur = hole.s1
    }
    w.piece(cur, w.s[1], 0, h)
  }

  // skirting boards
  box(x0, 0, z0, x1, 0.07, z0 + 0.012, M.skirt, 0, false)
  box(x0, 0, z1 - 0.012, x1, 0.07, z1, M.skirt, 0, false)
  box(x0, 0, z0, x0 + 0.012, 0.07, z1, M.skirt, 0, false)
  box(x1 - 0.012, 0, z0, x1, 0.07, z1, M.skirt, 0, false)

  // window glass (bright sky), frames and the sun coming through the first one
  for (const win of windows) {
    const F = 0.05
    const along = win.wall === 'back' || win.wall === 'front'
    const plane = { back: z0 - T, front: z1 + T, left: x0 - T, right: x1 + T }[win.wall]
    const inner = { back: z0, front: z1, left: x0, right: x1 }[win.wall]
    const mid = (plane + inner) / 2
    const put = (a, b, c, d, p, q, mat, sh = true) => along ? box(a, c, p, b, d, q, mat, 0, sh) : box(p, c, a, q, d, b, mat, 0, sh)
    put(win.s0, win.s1, win.y0, win.y1, plane - 0.01 * Math.sign(inner - plane), plane, M.sky, false)
    put(win.s0, win.s1, win.y0, win.y0 + F, mid - 0.03, mid + 0.03, M.frame)
    put(win.s0, win.s1, win.y1 - F, win.y1, mid - 0.03, mid + 0.03, M.frame)
    put(win.s0, win.s0 + F, win.y0, win.y1, mid - 0.03, mid + 0.03, M.frame)
    put(win.s1 - F, win.s1, win.y0, win.y1, mid - 0.03, mid + 0.03, M.frame)
    const midS = (win.s0 + win.s1) / 2
    put(midS - F / 2, midS + F / 2, win.y0, win.y1, mid - 0.03, mid + 0.03, M.frame)
    if (win.y0 > 0.2) put(win.s0 - 0.05, win.s1 + 0.05, win.y0 - 0.03, win.y0, inner - 0.06 * Math.sign(inner - plane), inner + 0.02 * Math.sign(inner - plane), M.skirt)
  }
  if (windows[0]) {
    const win = windows[0]
    const s = (win.s0 + win.s1) / 2
    const pos = {
      back:  new THREE.Vector3(s + 2, 5, z0 - 6),
      front: new THREE.Vector3(s + 2, 5, z1 + 6),
      left:  new THREE.Vector3(x0 - 6, 5, s + 2),
      right: new THREE.Vector3(x1 + 6, 5, s - 2),
    }[win.wall]
    const sun = new THREE.DirectionalLight(0xfff1dc, 4.2)
    sun.position.copy(pos)
    sun.target.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2)
    sun.castShadow = true
    sun.shadow.mapSize.set(4096, 4096)
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.02
    sun.shadow.radius = 4
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 25 })
    scene.add(sun, sun.target)
  }
}

// Row of doors/drawers between x-positions (or z for side walls) with small gaps
function fronts(box, { axis = 'x', from, to, count, y0, y1, plane, depth = 0.019, dir = 1, surface, handle = 'top', rows = 1 }) {
  const G = 0.003
  const w = (to - from) / count
  const rh = (y1 - y0) / rows
  for (let i = 0; i < count; i++) {
    for (let r = 0; r < rows; r++) {
      const a = from + i * w + G, b = from + (i + 1) * w - G
      const c = y0 + r * rh + G, d = y0 + (r + 1) * rh - G
      const p = plane, q = plane + depth * dir
      if (axis === 'x') box(a, c, Math.min(p, q), b, d, Math.max(p, q), null, surface)
      else box(Math.min(p, q), c, a, Math.max(p, q), d, b, null, surface)
      // handle
      const hq = q + 0.012 * dir
      if (handle === 'top') {
        const hy = d - 0.05
        if (axis === 'x') box(a + w * 0.3, hy, Math.min(q, hq), b - w * 0.3, hy + 0.012, Math.max(q, hq), M.metal)
        else box(Math.min(q, hq), hy, a + w * 0.3, Math.max(q, hq), hy + 0.012, b - w * 0.3, M.metal)
      } else if (handle === 'side') {
        const hs = i % 2 ? a + 0.04 : b - 0.055
        const hy = Math.min(1.15, (c + d) / 2)
        if (axis === 'x') box(hs, hy - 0.2, Math.min(q, hq), hs + 0.015, hy + 0.2, Math.max(q, hq), M.metal)
        else box(Math.min(q, hq), hy - 0.2, hs, Math.max(q, hq), hy + 0.2, hs + 0.015, M.metal)
      }
    }
  }
}

// ── rooms ───────────────────────────────────────────────────────────────────
export const scenes = {
  async kitchen(scene) {
    const box = makeBox(scene)
    const R = { x0: -2.6, x1: 2.6, z0: -2.2, z1: 2.2, h: 2.7 }
    shell(scene, box, { ...R, windows: [{ wall: 'left', s0: -0.4, s1: 1.4, y0: 0.95, y1: 2.35 }] }, await loadFloor(), 7)

    // back run
    box(-2.6, 0, -2.2, 1.4, 0.1, -1.66, M.dark)
    box(-2.6, 0.1, -2.2, 1.4, 0.82, -1.62, null, 2)
    fronts(box, { from: -2.6, to: -1.0, count: 2, y0: 0.1, y1: 0.82, plane: -1.62, surface: 1, rows: 3 })
    fronts(box, { from: -1.0, to: 1.4, count: 3, y0: 0.1, y1: 0.82, plane: -1.62, surface: 1 })
    box(-2.6, 0.82, -2.2, 1.4, 0.86, -1.58, null, 3)
    box(-2.6, 0.86, -2.2, 1.4, 1.45, -2.185, null, 6)
    // sink + tap, hob
    box(-1.55, 0.861, -2.05, -0.85, 0.864, -1.7, M.steel)
    cyl(scene, 0.018, 0.32, -1.2, 0.86, -2.1, M.steel)
    box(-1.215, 1.15, -2.1, -1.185, 1.17, -1.92, M.steel)
    box(0.0, 0.861, -2.06, 0.7, 0.866, -1.68, M.black)
    // uppers + under-cabinet light
    box(-2.6, 1.45, -2.2, 1.4, 2.35, -1.87, null, 2)
    fronts(box, { from: -2.6, to: 1.4, count: 5, y0: 1.45, y1: 2.35, plane: -1.87, surface: 4, handle: 'none' })
    box(-2.6, 1.44, -2.02, 1.4, 1.45, -1.98, M.glow, 0, false)
    pointLight(scene, -1.6, 1.3, -1.95, 0.6)
    pointLight(scene, 0.4, 1.3, -1.95, 0.6)
    // tall column: oven + fridge
    box(1.4, 0.0, -2.2, 2.6, 0.1, -1.66, M.dark)
    box(1.4, 0.1, -2.2, 2.6, 2.35, -1.62, null, 2)
    fronts(box, { from: 1.4, to: 2.0, count: 1, y0: 0.1, y1: 0.8, plane: -1.62, surface: 1 })
    box(1.42, 0.82, -1.62, 1.98, 1.4, -1.6, M.black)
    box(1.47, 1.33, -1.6, 1.93, 1.345, -1.585, M.steel)
    fronts(box, { from: 1.4, to: 2.0, count: 1, y0: 1.42, y1: 2.35, plane: -1.62, surface: 1, handle: 'none' })
    fronts(box, { from: 2.0, to: 2.6, count: 1, y0: 0.1, y1: 2.35, plane: -1.62, surface: 1, handle: 'side' })
    // island
    box(-1.15, 0, -0.5, 0.75, 0.1, 0.3, M.dark)
    box(-1.2, 0.1, -0.55, 0.8, 0.86, 0.35, null, 5)
    fronts(box, { from: -1.2, to: 0.8, count: 3, y0: 0.1, y1: 0.86, plane: -0.55, dir: -1, surface: 1, rows: 2 })
    box(-1.25, 0.86, -0.6, 0.85, 0.9, 0.4, null, 3)
    for (const x of [-0.85, -0.2, 0.45]) {
      cyl(scene, 0.012, 0.64, x, 0, 0.62, M.metal, 0, 12)
      cyl(scene, 0.2, 0.04, x, 0.64, 0.62, M.fabric2)
    }
    // pendants over the island
    for (const x of [-0.6, 0.2]) {
      cyl(scene, 0.005, 0.9, x, 1.8, -0.1, M.metal, 0, 8)
      const shade = new THREE.Mesh(new THREE.SphereGeometry(0.14, 32, 16), M.glow)
      shade.position.set(x, 1.72, -0.1)
      scene.add(shade)
    }
    plant(scene, -2.2, 1.85, 1.0)
    box(R.x1 - 0.03, 1.2, 0.0, R.x1, 1.95, 1.0, M.art)
    box(-0.5, 0, R.z1 - 0.04, 0.4, 2.1, R.z1, M.door)
    pointLight(scene, -0.2, 2.58, -0.1, 3.5, true)
    pointLight(scene, -0.6, 2.58, -1.4, 2.5, true)
    pointLight(scene, 1.0, 2.58, 1.3, 2.0)
    return { eye: new THREE.Vector3(0.75, 1.55, 1.35) }
  },

  async living(scene) {
    const box = makeBox(scene)
    const R = { x0: -3, x1: 3, z0: -2.4, z1: 2.4, h: 2.8 }
    shell(scene, box, { ...R, windows: [{ wall: 'left', s0: -1.5, s1: 1.3, y0: 0.25, y1: 2.55 }] }, await loadFloor(), 6)

    // TV wall: flat centre panel + slats either side
    box(-1.0, 0, -2.4, 1.0, R.h, -2.36, null, 1)
    for (const [a, b] of [[-2.1, -1.0], [1.0, 2.1]]) {
      box(a, 0, -2.4, b, R.h, -2.385, M.dark)
      for (let x = a + 0.012; x + 0.04 <= b; x += 0.066) box(x, 0, -2.385, x + 0.04, R.h, -2.352, null, 2)
    }
    // floating TV unit
    box(-1.6, 0.25, -2.36, 1.6, 0.62, -1.96, null, 3)
    for (const x of [-0.8, 0, 0.8]) box(x - 0.002, 0.25, -1.962, x + 0.002, 0.62, -1.957, M.dark, 0, false)
    box(-0.85, 1.05, -2.36, 0.85, 2.0, -2.32, M.black)
    cyl(scene, 0.07, 0.3, 1.25, 0.62, -2.15, M.pot)
    box(-1.4, 0.62, -2.3, -1.15, 0.7, -2.05, M.books[2])
    box(-1.38, 0.7, -2.28, -1.17, 0.76, -2.07, M.books[1])
    // shelving on the right wall
    const sx0 = 2.62, sz0 = -1.3, sz1 = 0.5
    for (const z of [sz0, sz1 - 0.025]) box(sx0, 0, z, 3, 2.3, z + 0.025, null, 4)
    for (const y of [0.0, 0.42, 0.84, 1.26, 1.68, 2.27]) box(sx0, y, sz0, 3, y + 0.03, sz1, null, 4)
    let k = 0
    for (const y of [0.45, 1.29, 1.71]) {
      for (let z = sz0 + 0.1; z < sz0 + 0.55; z += 0.045) box(2.72, y, z, 2.95, y + 0.24 + (k % 3) * 0.03, z + 0.035, M.books[k++ % 5])
    }
    cyl(scene, 0.08, 0.22, 2.82, 0.87, -0.2, M.pot)
    box(2.7, 0.03, 0.0, 2.95, 0.3, 0.4, M.fabric2)
    // sofa facing the TV
    const sf = M.fabric
    box(-1.5, 0.12, 1.45, 1.5, 0.42, 2.35, sf)
    box(-1.5, 0.42, 2.05, 1.5, 0.88, 2.35, sf)
    box(-1.5, 0.12, 1.45, -1.28, 0.64, 2.35, sf)
    box(1.28, 0.12, 1.45, 1.5, 0.64, 2.35, sf)
    for (const x of [-1.27, -0.02]) box(x + 0.02, 0.42, 1.5, x + 1.25, 0.52, 2.04, sf)
    box(-1.0, 0.52, 1.9, -0.55, 0.85, 2.02, M.art2)
    box(0.6, 0.52, 1.9, 1.05, 0.85, 2.02, M.fabric2)
    for (const [x, z] of [[-1.45, 1.5], [1.45, 1.5], [-1.45, 2.3], [1.45, 2.3]]) box(x - 0.02, 0, z - 0.02, x + 0.02, 0.12, z + 0.02, M.metal)
    // coffee table + rug
    box(-1.7, 0, -1.0, 1.7, 0.012, 1.7, M.rug, 0, false)
    cyl(scene, 0.2, 0.36, 0, 0.012, 0.15, M.dark, 0, 32)
    cyl(scene, 0.6, 0.04, 0, 0.372, 0.15, null, 5, 64)
    box(-0.25, 0.412, 0.0, 0.05, 0.432, 0.22, M.books[0])
    plant(scene, -2.6, -2.0, 1.1)
    // curtains
    for (const z of [-1.75, 1.45]) box(-2.98, 0.02, z, -2.9, 2.7, z + 0.3, M.linen)
    box(-0.8, 1.1, R.z1 - 0.03, 0.8, 2.0, R.z1, M.art2)
    pointLight(scene, 0, 2.68, -1.2, 3.2, true)
    pointLight(scene, 0, 2.68, 1.0, 3.0, true)
    pointLight(scene, 2.0, 2.68, -0.4, 1.6)
    return { eye: new THREE.Vector3(0.0, 1.45, 0.95) }
  },

  async bedroom(scene) {
    const box = makeBox(scene)
    const R = { x0: -2.5, x1: 2.5, z0: -2.2, z1: 2.2, h: 2.7 }
    shell(scene, box, { ...R, windows: [{ wall: 'right', s0: -1.3, s1: 0.9, y0: 0.6, y1: 2.4 }] }, await loadFloor(), 5)

    // wardrobe along the left wall
    box(-2.5, 0, -1.7, -1.92, 2.5, 1.3, null, 2)
    fronts(box, { axis: 'z', from: -1.7, to: 1.3, count: 6, y0: 0.08, y1: 2.48, plane: -1.92, surface: 1, handle: 'side' })
    box(-1.92, 2.5, -1.7, -1.9, 2.7, 1.3, M.wall)
    // headboard wall panel + bed
    box(-0.95, 0, -2.2, 2.0, 1.3, -2.16, null, 3)
    box(-0.4, 0.08, -2.16, 1.45, 0.36, -0.05, M.fabric2)
    box(-0.36, 0.36, -2.12, 1.41, 0.56, -0.09, M.linen)
    box(-0.38, 0.5, -1.35, 1.43, 0.6, -0.07, M.fabric)
    box(-0.25, 0.56, -2.1, 0.45, 0.72, -1.82, M.linen)
    box(0.6, 0.56, -2.1, 1.3, 0.72, -1.82, M.linen)
    // floating nightstands with lamps
    for (const [a, b] of [[-0.92, -0.48], [1.52, 1.96]]) {
      box(a, 0.3, -2.16, b, 0.72, -1.78, null, 4)
      box(a + 0.03, 0.51, -1.781, b - 0.03, 0.513, -1.776, M.dark, 0, false)
      const x = (a + b) / 2
      cyl(scene, 0.05, 0.25, x, 0.72, -2.0, M.pot)
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.16, 32), M.glow)
      shade.position.set(x, 1.05, -2.0)
      scene.add(shade)
      pointLight(scene, x, 0.95, -1.85, 0.5)
    }
    box(-1.1, 0, -1.6, 1.9, 0.012, 0.8, M.rug, 0, false)
    for (const z of [-1.65, 0.85]) box(2.4, 0.02, z, 2.48, 2.6, z + 0.3, M.linen)
    plant(scene, 2.1, 1.7, 1.0)
    box(-0.3, 0, R.z1 - 0.04, 0.6, 2.1, R.z1, M.door)
    box(0.9, 1.0, R.z1 - 0.03, 1.9, 1.8, R.z1, M.art)
    pointLight(scene, 0.4, 2.58, -0.8, 2.6, true)
    pointLight(scene, -1.0, 2.58, 0.8, 2.0, true)
    return { eye: new THREE.Vector3(0.6, 1.5, 1.4) }
  },

  async hallway(scene) {
    const box = makeBox(scene)
    const R = { x0: -1.2, x1: 1.2, z0: -2.8, z1: 2.8, h: 2.7 }
    shell(scene, box, { ...R, windows: [{ wall: 'back', s0: 0.62, s1: 0.95, y0: 0.15, y1: 2.15 }] }, await loadFloor(), 5)

    // shoe cabinet + wall panel on the left
    box(-1.2, 0.18, -1.9, -0.82, 0.88, 0.3, null, 2)
    fronts(box, { axis: 'z', from: -1.9, to: 0.3, count: 4, y0: 0.18, y1: 0.88, plane: -0.82, surface: 1, handle: 'none' })
    box(-1.2, 0.88, -1.9, -1.17, 2.35, 0.3, null, 3)
    for (const z of [-1.5, -1.2, -0.9, -0.6]) {
      const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 12), M.metal)
      hook.rotation.z = Math.PI / 2
      hook.position.set(-1.12, 1.85, z)
      scene.add(hook)
    }
    const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.02, 64), M.mirror)
    mirror.rotation.z = Math.PI / 2
    mirror.position.set(-1.155, 1.45, 0.0 - 0.1)
    scene.add(mirror)
    // wardrobe on the right
    box(0.6, 0, -2.2, 1.2, 2.5, -0.4, null, 2)
    fronts(box, { axis: 'z', from: -2.2, to: -0.4, count: 3, y0: 0.06, y1: 2.48, plane: 0.6, dir: -1, surface: 4, handle: 'side' })
    box(0.58, 2.5, -2.2, 0.6, 2.7, -0.4, M.wall)
    // front door at the end + runner
    box(-0.5, 0, -2.8, 0.45, 2.15, -2.76, M.door)
    box(0.3, 1.0, -2.76, 0.33, 1.05, -2.7, M.steel)
    box(-0.55, 0, -2.4, 0.4, 0.01, 1.8, M.rug, 0, false)
    plant(scene, 0.85, 1.4, 0.9)
    box(-0.5, 1.1, R.z1 - 0.03, 0.5, 1.9, R.z1, M.art2)
    for (const z of [-1.8, -0.2, 1.4]) pointLight(scene, 0, 2.58, z, 2.2, z !== 1.4)
    return { eye: new THREE.Vector3(0.0, 1.55, 1.9) }
  },
}
