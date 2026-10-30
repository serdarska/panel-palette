<script setup>
import { computed, ref, nextTick, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { store } from '../store.js'
import { countertops, mdfColors, chipboardColors } from '../data/materials.js'
import { t } from '../i18n.js'
import KitchenPhoto from './KitchenPhoto.vue'

// ── Preview mode: the recoloured photo, or the interactive 3-D room ─────────
const view = ref('photo')
let sceneReady = false

watch(view, async v => {
  if (v !== '3d' || sceneReady) return
  sceneReady = true
  await nextTick()
  initScene()
})

// ── Left panel ──────────────────────────────────────────────────────────────
const tabs = computed(() => [
  { key: 'countertop', label: t('visualizer.tabCountertop'),  hint: t('visualizer.tabCountertopHint') },
  { key: 'mdf',        label: t('visualizer.tabMdf'),         hint: t('visualizer.tabMdfHint') },
  { key: 'chipboard',  label: t('visualizer.tabChipboard'),   hint: t('visualizer.tabChipboardHint') },
])
const swatchMap = { countertop: countertops, mdf: mdfColors, chipboard: chipboardColors }
const swatches  = computed(() => swatchMap[store.activeMaterial])
const current   = computed(() => store[store.activeMaterial])
function selectMaterial(key)   { store.activeMaterial = key }
function selectColor(swatch)   { store[store.activeMaterial] = swatch }
function isActive(swatch)      { return current.value?.code === swatch.code }

// ── Three.js ─────────────────────────────────────────────────────────────────
const canvasRef = ref(null)
let renderer, scene, camera, controls, animId, ro

// Shared kitchen materials (mutated on swatch change)
let chipMat, mdfMat, ctMat, grooveMat

const loader   = new THREE.TextureLoader()
const texCache = {}

// Shared clickable mesh arrays
const chipMeshes = [], mdfMeshes = [], ctMeshes = []

function loadTex(url) {
  if (!url) return null
  if (texCache[url]) return texCache[url]
  const t = loader.load(url, () => { t.needsUpdate = true })
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1, 1)
  texCache[url] = t
  return t
}

function applyToMat(mat, swatch) {
  if (!mat) return
  mat.map   = swatch.image ? loadTex(swatch.image) : null
  mat.color.set(swatch.image ? '#ffffff' : swatch.color)
  mat.needsUpdate = true
}

// Reactive: update 3-D materials when the user picks a new swatch
watch(() => store.chipboard,  s => applyToMat(chipMat, s),  { deep: true })
watch(() => store.mdf,        s => applyToMat(mdfMat, s),   { deep: true })
watch(() => store.countertop, s => applyToMat(ctMat, s),    { deep: true })

// Highlight the active zone with a warm emissive tint
watch(() => store.activeMaterial, zone => {
  if (!chipMat) return
  chipMat.emissive.set(zone === 'chipboard'  ? 0x1a1000 : 0x000000)
  mdfMat .emissive.set(zone === 'mdf'        ? 0x1a1000 : 0x000000)
  ctMat  .emissive.set(zone === 'countertop' ? 0x1a1000 : 0x000000)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  ro?.disconnect()
  renderer?.dispose()
})

// ── Scene init ───────────────────────────────────────────────────────────────
function initScene() {
  const canvas    = canvasRef.value
  const container = canvas.parentElement
  const W = container.clientWidth
  const H = Math.round(W * 0.58)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(W, H)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap
  renderer.toneMapping       = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace  = THREE.SRGBColorSpace

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf5f0e8)

  camera = new THREE.PerspectiveCamera(55, W / H, 0.05, 50)
  camera.position.set(3.2, 1.5, 3.4)
  camera.lookAt(-0.4, 1.3, -1.8)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(-0.4, 1.3, -1.8)
  controls.enablePan      = false
  controls.minPolarAngle  = Math.PI / 5
  controls.maxPolarAngle  = Math.PI / 2.1
  controls.minAzimuthAngle = -Math.PI / 6
  controls.maxAzimuthAngle =  Math.PI / 2.8
  controls.minDistance    = 2.0
  controls.maxDistance    = 6.0
  controls.update()

  buildLighting()
  buildRoom()
  buildKitchen()
  buildRaycaster()

  ro = new ResizeObserver(() => {
    const nW = container.clientWidth
    const nH = Math.round(nW * 0.58)
    renderer.setSize(nW, nH)
    camera.aspect = nW / nH
    camera.updateProjectionMatrix()
  })
  ro.observe(container)

  ;(function animate() {
    animId = requestAnimationFrame(animate)
    if (view.value !== '3d') return
    controls.update()
    renderer.render(scene, camera)
  })()
}

// ── Lighting ─────────────────────────────────────────────────────────────────
function buildLighting() {
  // Reduced ambient so shadows inside grooves have proper contrast
  scene.add(new THREE.AmbientLight(0xfff8ee, 0.55))

  const p = (x, y, z, intensity) => {
    const l = new THREE.PointLight(0xfff0d8, intensity, 10)
    l.position.set(x, y, z)
    l.castShadow = true
    l.shadow.mapSize.set(512, 512)
    scene.add(l)
  }
  p(-0.9, 2.45, 0.5, 2.4)
  p( 1.4, 2.45, 0.5, 2.0)

  // Window – cool side light from the right
  const win = new THREE.DirectionalLight(0xd0e8ff, 1.1)
  win.position.set(5, 3, 2)
  win.target.position.set(-1, 1, -2)
  scene.add(win, win.target)

  // Grazing fill from the left – catches raised panel edges
  const fill = new THREE.DirectionalLight(0xfff4e0, 0.7)
  fill.position.set(-4, 1.5, 3)
  fill.target.position.set(0, 1, -2)
  scene.add(fill, fill.target)
}

// ── Room shell ───────────────────────────────────────────────────────────────
function buildRoom() {
  const lam = c => new THREE.MeshLambertMaterial({ color: c })
  const std = (c, r = 0.92) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 })
  const plane = (w, h, mat, px, py, pz, rx, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
    m.position.set(px, py, pz)
    if (rx) m.rotation.x = rx
    if (ry) m.rotation.y = ry
    m.receiveShadow = true
    scene.add(m)
    return m
  }

  // Floor – light grey/white wood planks (matching the photo)
  plane(5.4, 5.0, std(0xdddbd4), 0,  0,  -0.2, -Math.PI / 2)
  // Back wall
  plane(5.4, 2.8, lam(0xe8e3da), 0, 1.4, -2.0)
  // Left wall
  plane(5.0, 2.8, lam(0xe0dbd3), -2.7, 1.4, -0.2, 0, Math.PI / 2)
  // Right wall
  plane(5.0, 2.8, lam(0xd8d4cc),  2.7, 1.4, -0.2, 0, -Math.PI / 2)
  // Ceiling
  plane(5.4, 5.0, lam(0xf2ede6),  0, 2.7, -0.2, Math.PI / 2)

  // Window (emissive bright panel on right wall)
  const winMat = new THREE.MeshBasicMaterial({ color: 0xc8e4f8, transparent: true, opacity: 0.82 })
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4), winMat)
  win.rotation.y = -Math.PI / 2
  win.position.set(2.68, 1.4, 0.4)
  scene.add(win)

  // Window frame
  const frMat = lam(0xd0c8c0)
  const addBar = (w, h, d, x, y, z, ry) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frMat)
    b.rotation.y = ry || 0
    b.position.set(x, y, z)
    scene.add(b)
  }
  addBar(0.06, 1.46, 0.04, 2.68, 1.40, -0.16, -Math.PI/2)
  addBar(0.06, 1.46, 0.04, 2.68, 1.40,  0.96, -Math.PI/2)
  addBar(1.16, 0.06, 0.04, 2.68, 2.08,  0.40, -Math.PI/2)
  addBar(1.16, 0.06, 0.04, 2.68, 0.72,  0.40, -Math.PI/2)
  addBar(1.16, 0.06, 0.04, 2.68, 1.40,  0.40, -Math.PI/2) // centre divider

  // Baseboards
  const baseMat = lam(0xd4cec4)
  const base = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, 0.025), baseMat)
  base.position.set(0, 0.05, -1.99); scene.add(base)
  const baseL = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.1, 5.0), baseMat)
  baseL.position.set(-2.69, 0.05, -0.2); scene.add(baseL)
  const baseR = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.1, 5.0), baseMat)
  baseR.position.set(2.69, 0.05, -0.2); scene.add(baseR)

  // Crown moulding on back wall
  const crownMat = lam(0xf0ece6)
  const crown = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.08, 0.06), crownMat)
  crown.position.set(0, 2.66, -1.97); scene.add(crown)
}

// ── Kitchen ──────────────────────────────────────────────────────────────────
function buildKitchen() {
  chipMat   = new THREE.MeshStandardMaterial({ roughness: 0.70, metalness: 0.02 })
  mdfMat    = new THREE.MeshStandardMaterial({ roughness: 0.40, metalness: 0.04 })
  grooveMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.98, metalness: 0.0 })
  ctMat     = new THREE.MeshStandardMaterial({ roughness: 0.28, metalness: 0.06 })

  applyToMat(chipMat, store.chipboard)
  applyToMat(mdfMat,  store.mdf)
  applyToMat(ctMat,   store.countertop)

  // Trigger initial emissive state
  chipMat.emissive = new THREE.Color(store.activeMaterial === 'chipboard'  ? 0x1a1000 : 0x000000)
  mdfMat .emissive = new THREE.Color(store.activeMaterial === 'mdf'        ? 0x1a1000 : 0x000000)
  ctMat  .emissive = new THREE.Color(store.activeMaterial === 'countertop' ? 0x1a1000 : 0x000000)

  const handleMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.12, metalness: 0.92 })

  const WZ   = -1.97   // face of back wall (cabinets live between WZ and WZ+depth)
  const UDEP = 0.34    // upper cabinet depth
  const LDEP = 0.60    // lower cabinet depth
  const DOOR = 0.028   // door panel thickness

  const box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, y, z); m.castShadow = true; scene.add(m); return m
  }

  // ── Upper cabinets – one continuous run, same width as countertop (-1.80 → 1.40) ──
  makeUpperBank(-1.80, 1.40, WZ, UDEP, DOOR, handleMat)

  // ── Range hood (slim built-in style) ──
  const hoodMat = new THREE.MeshStandardMaterial({ color: 0x1e1c18, roughness: 0.28, metalness: 0.5 })
  box(0.18, 0.80, 0.18, hoodMat,  0, 2.06, WZ - 0.09)   // chimney
  box(0.90, 0.28, 0.44, hoodMat,  0, 1.66, WZ - 0.22)   // canopy
  const grilleMat = new THREE.MeshStandardMaterial({ color: 0x111, roughness: 0.4, metalness: 0.3 })
  for (let i = 0; i < 3; i++) box(0.70, 0.032, 0.014, grilleMat, 0, 1.54 - i * 0.048, WZ - 0.43)
  // LED strip under hood
  const ledMat = new THREE.MeshStandardMaterial({ color: 0xd4a010, emissive: new THREE.Color(0xd4a010), emissiveIntensity: 0.5 })
  box(0.80, 0.018, 0.036, ledMat, 0, 1.45, WZ - 0.43)
  const ledGlowL = new THREE.PointLight(0xd4900a, 1.0, 1.6); ledGlowL.position.set(-1.1, 1.46, -1.72); scene.add(ledGlowL)
  const ledGlowR = new THREE.PointLight(0xd4900a, 1.0, 1.6); ledGlowR.position.set( 1.1, 1.46, -1.72); scene.add(ledGlowR)

  // ── Under-cabinet LED strip (warm glow over backsplash) ──
  const ucLedMat = new THREE.MeshStandardMaterial({ color: 0xffe8b0, emissive: new THREE.Color(0xffe8b0), emissiveIntensity: 0.6 })
  // Cabinets run from x=-1.80 to x=1.40 → width=3.20, centre=-0.20
  box(3.20, 0.012, 0.018, ucLedMat, -0.20, 1.465, WZ + 0.015)
  const ucGlow = new THREE.PointLight(0xffe090, 0.7, 2.2); ucGlow.position.set(-0.20, 1.36, WZ + 0.32); scene.add(ucGlow)

  // ── Marble backsplash ──
  const bsMat = new THREE.MeshStandardMaterial({ color: 0xf0edea, roughness: 0.20, metalness: 0.05 })
  const bsH = 0.52, bsY = 1.20
  const bsFull = new THREE.Mesh(new THREE.PlaneGeometry(3.20, bsH), bsMat)
  bsFull.position.set(-0.20, bsY, -1.983); scene.add(bsFull)

  // ── Countertop slab ──
  const ct = new THREE.Mesh(new THREE.BoxGeometry(3.20, 0.06, 0.67), ctMat)
  ct.position.set(-0.20, 0.93, WZ + 0.67 / 2 - 0.01)
  ct.castShadow = true; ct.receiveShadow = true
  ct.userData.zone = 'countertop'
  ctMeshes.push(ct); scene.add(ct)


  // ── Lower cabinets ──
  makeLowerBank(-1.80, -0.68, WZ, LDEP, DOOR, handleMat)
  makeSinkCab(  -0.68,  0.68, WZ, LDEP, DOOR, handleMat)
  makeLowerBank( 0.68,  1.40, WZ, LDEP, DOOR, handleMat)

  // ── Kickboard ──
  const kickMat = new THREE.MeshStandardMaterial({ color: 0x0e0c0a, roughness: 0.9 })
  const kick = new THREE.Mesh(new THREE.BoxGeometry(3.20, 0.12, 0.04), kickMat)
  kick.position.set(-0.20, 0.06, WZ + LDEP + 0.02); scene.add(kick)

  // ── Left pantry tower (glass-front, full height) ──
  makePantryTower(-2.55, -1.80, WZ, LDEP, DOOR)

  // ── Right fridge / appliance tower ──
  // Fridge: left edge at 1.40 (flush with cabinet right edge), centre at 1.76
  const fridgeMat = new THREE.MeshStandardMaterial({ color: 0x636058, roughness: 0.28, metalness: 0.18 })
  box(0.72, 2.56, 0.62, fridgeMat, 1.76, 1.28, WZ + 0.31)
  const seamMat = new THREE.MeshStandardMaterial({ color: 0x111, roughness: 0.9 })
  box(0.70, 0.003, 0.015, seamMat, 1.76, 1.75, WZ + 0.625)
  const fHan = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.40, 0.018), handleMat)
  fHan.position.set(1.76 - 0.28, 1.5, WZ + 0.64); scene.add(fHan)
  // Top cabinet panel above fridge (same chipMat)
  // (fridge goes nearly to ceiling – no gap needed)
}

// ── Cabinet helpers ───────────────────────────────────────────────────────────
function makeUpperBank(x1, x2, wz, depth, doorThick, handleMat) {
  const w  = x2 - x1
  const h  = 1.10   // tall upper cabinets, bottom 1.46 → top 2.56
  const cx = (x1 + x2) / 2
  const cy = 1.46 + h / 2

  // Carcass protrudes OUT from the wall (back face at wz, front face at wz + depth)
  const carc = new THREE.Mesh(new THREE.BoxGeometry(w - 0.005, h - 0.005, depth), chipMat)
  carc.position.set(cx, cy, wz + depth / 2)
  carc.castShadow = true; carc.receiveShadow = true
  carc.userData.zone = 'chipboard'
  chipMeshes.push(carc); scene.add(carc)

  const n  = Math.max(2, Math.round((w - 0.024) / 0.52))
  const dw = (w - 0.024) / n
  for (let i = 0; i < n; i++) {
    const dx    = x1 + 0.012 + dw * (i + 0.5)
    const dW    = dw - 0.006
    const dH    = h - 0.018
    const dFace = wz + depth + doorThick  // front face of door

    // Flat slab door on the front face of the carcass
    const door = new THREE.Mesh(new THREE.BoxGeometry(dW, dH, doorThick), mdfMat)
    door.position.set(dx, cy, wz + depth + doorThick / 2)
    door.castShadow = true; door.receiveShadow = true
    door.userData.zone = 'mdf'
    mdfMeshes.push(door); scene.add(door)

    // Thin integrated groove handle at door bottom
    const han = new THREE.Mesh(new THREE.BoxGeometry(dW * 0.52, 0.010, 0.005), grooveMat)
    han.position.set(dx, cy - dH / 2 + 0.024, dFace + 0.003)
    scene.add(han)
  }
}

function makeLowerBank(x1, x2, wz, depth, doorThick, handleMat) {
  const w   = x2 - x1
  const h   = 0.88
  const cx  = (x1 + x2) / 2

  // Carcass protrudes OUT from wall (back at wz, front at wz + depth)
  const carc = new THREE.Mesh(new THREE.BoxGeometry(w - 0.005, h - 0.005, depth), chipMat)
  carc.position.set(cx, h / 2, wz + depth / 2)
  carc.castShadow = true; carc.receiveShadow = true
  carc.userData.zone = 'chipboard'
  chipMeshes.push(carc); scene.add(carc)

  // Flat slab drawer on the front face of the carcass
  const drawerH  = 0.20
  const drawerCY = h - drawerH / 2 - 0.006
  const drFace   = wz + depth + doorThick

  const drawer = new THREE.Mesh(new THREE.BoxGeometry(w - 0.016, drawerH - 0.008, doorThick), mdfMat)
  drawer.position.set(cx, drawerCY, wz + depth + doorThick / 2)
  drawer.castShadow = true; drawer.receiveShadow = true
  drawer.userData.zone = 'mdf'
  mdfMeshes.push(drawer); scene.add(drawer)
  const dHan = new THREE.Mesh(new THREE.BoxGeometry((w - 0.016) * 0.52, 0.010, 0.005), grooveMat)
  dHan.position.set(cx, drawerCY + (drawerH - 0.008) / 2 - 0.024, drFace + 0.003)
  scene.add(dHan)

  // 2 flat slab lower doors
  const doorH = h - drawerH - 0.015
  const dw    = (w - 0.024) / 2
  for (let i = 0; i < 2; i++) {
    const dx     = x1 + 0.012 + dw * (i + 0.5)
    const doorCY = (doorH - 0.006) / 2 + 0.008
    const ldW    = dw - 0.006
    const ldH    = doorH - 0.006
    const ldFace = wz + depth + doorThick

    const door = new THREE.Mesh(new THREE.BoxGeometry(ldW, ldH, doorThick), mdfMat)
    door.position.set(dx, doorCY, wz + depth + doorThick / 2)
    door.castShadow = true; door.receiveShadow = true
    door.userData.zone = 'mdf'
    mdfMeshes.push(door); scene.add(door)
    const han = new THREE.Mesh(new THREE.BoxGeometry(ldW * 0.52, 0.010, 0.005), grooveMat)
    han.position.set(dx, doorCY + ldH / 2 - 0.024, ldFace + 0.003)
    scene.add(han)
  }
}

function makeSinkCab(x1, x2, wz, depth, doorThick, handleMat) {
  const w      = x2 - x1
  const h      = 0.88
  const cx     = (x1 + x2) / 2
  const sdFace = wz + depth + doorThick

  // Carcass protrudes OUT from wall
  const carc = new THREE.Mesh(new THREE.BoxGeometry(w - 0.005, h - 0.005, depth), chipMat)
  carc.position.set(cx, h / 2, wz + depth / 2)
  carc.castShadow = true; carc.receiveShadow = true
  carc.userData.zone = 'chipboard'
  chipMeshes.push(carc); scene.add(carc)

  const sdW = w - 0.016, sdH = h - 0.018
  const door = new THREE.Mesh(new THREE.BoxGeometry(sdW, sdH, doorThick), mdfMat)
  door.position.set(cx, h / 2, wz + depth + doorThick / 2)
  door.castShadow = true; door.receiveShadow = true
  door.userData.zone = 'mdf'
  mdfMeshes.push(door); scene.add(door)
  const han = new THREE.Mesh(new THREE.BoxGeometry(sdW * 0.52, 0.010, 0.005), grooveMat)
  han.position.set(cx, h / 2 + sdH / 2 - 0.024, sdFace + 0.003)
  scene.add(han)
}

function makePantryTower(x1, x2, wz, depth, doorThick) {
  const w  = x2 - x1
  const h  = 2.56
  const cx = (x1 + x2) / 2

  // Carcass protrudes OUT from wall (back face at wz, front face at wz + depth)
  const carc = new THREE.Mesh(new THREE.BoxGeometry(w - 0.005, h - 0.005, depth), chipMat)
  carc.position.set(cx, h / 2, wz + depth / 2)
  carc.castShadow = true; carc.receiveShadow = true
  carc.userData.zone = 'chipboard'
  chipMeshes.push(carc); scene.add(carc)

  // Interior shelves centred inside the carcass depth
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0xc8b888, roughness: 0.60 })
  for (let i = 0; i <= 5; i++) {
    const sy = 0.28 + i * (h - 0.42) / 5
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.040, 0.018, depth - 0.040), shelfMat)
    shelf.position.set(cx, sy, wz + depth / 2)
    scene.add(shelf)
  }

  // Glass-front doors on the front face of the carcass
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xc8d8e0, transparent: true, opacity: 0.18,
    roughness: 0.05, metalness: 0.12, depthWrite: false,
  })
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1714, roughness: 0.75 })
  const dw    = (w - 0.024) / 2
  const dH    = h - 0.018
  const dFace = wz + depth + doorThick

  for (let i = 0; i < 2; i++) {
    const dx = x1 + 0.012 + dw * (i + 0.5)
    const dW = dw - 0.006
    const doorZ = wz + depth + doorThick / 2

    const glDoor = new THREE.Mesh(new THREE.BoxGeometry(dW, dH, doorThick), glassMat)
    glDoor.position.set(dx, h / 2, doorZ)
    scene.add(glDoor)

    const fw = 0.022
    const addFrame = (fw, fh, fd, fx, fy) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, fd), frameMat)
      f.position.set(fx, fy, doorZ); scene.add(f)
    }
    addFrame(dW, fw, doorThick + 0.001, dx, h / 2 + dH / 2 - fw / 2)
    addFrame(dW, fw, doorThick + 0.001, dx, h / 2 - dH / 2 + fw / 2)
    addFrame(fw, dH, doorThick + 0.001, dx - dW / 2 + fw / 2, h / 2)
    addFrame(fw, dH, doorThick + 0.001, dx + dW / 2 - fw / 2, h / 2)
    addFrame(dW, fw, doorThick + 0.001, dx, h / 2)

    const pHan = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.28, 0.016), grooveMat)
    pHan.position.set(dx + (i === 0 ? dW / 2 - 0.04 : -dW / 2 + 0.04), h / 2, dFace + 0.012)
    scene.add(pHan)
  }
}

// ── Raycasting for click-to-select ────────────────────────────────────────────
function buildRaycaster() {
  const raycaster = new THREE.Raycaster()
  const mouse     = new THREE.Vector2()
  const allClick  = [...chipMeshes, ...mdfMeshes, ...ctMeshes]

  renderer.domElement.addEventListener('click', e => {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1
    mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    const hits = raycaster.intersectObjects(allClick)
    if (hits.length > 0) {
      const zone = hits[0].object.userData.zone
      if (zone) store.activeMaterial = zone
    }
  })
}
</script>

<template>
  <section id="visualizer" class="visualizer section-pad">
    <div class="section-container">
      <div class="section-header reveal">
        <span class="section-label">{{ t('visualizer.label') }}</span>
        <h2>{{ t('visualizer.title') }}</h2>
        <p>{{ t('visualizer.subtitle') }}</p>
      </div>

      <div class="vis-layout reveal">
        <!-- Left panel -->
        <div class="panel">
          <div class="panel-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              :class="['ptab', { active: store.activeMaterial === tab.key }]"
              @click="selectMaterial(tab.key)"
            >
              <span class="ptab-label">{{ tab.label }}</span>
              <span class="ptab-hint">{{ tab.hint }}</span>
            </button>
          </div>

          <div class="current-sel">
            <div class="cur-dot" :style="current.image
              ? { backgroundImage: `url('${current.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: current.color }"/>
            <div class="cur-info">
              <span class="cur-name">{{ current.name }}</span>
              <span class="cur-code">{{ current.code }}</span>
            </div>
          </div>

          <div class="color-grid">
            <button
              v-for="sw in swatches"
              :key="sw.code"
              :class="['cswatch', { sel: isActive(sw) }]"
              :style="sw.image
                ? { backgroundImage: `url('${sw.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: sw.color }"
              :title="sw.name"
              @click="selectColor(sw)"
            >
              <span v-if="isActive(sw)" class="cswatch-check">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 3" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </span>
            </button>
          </div>

          <div class="summary-row">
            <div class="sum-item">
              <span class="sum-dot" :style="store.countertop.image
                ? { backgroundImage: `url('${store.countertop.image}')`, backgroundSize: 'cover' }
                : { background: store.countertop.color }"/>
              <span class="sum-text">{{ store.countertop.name }}</span>
            </div>
            <div class="sum-item">
              <span class="sum-dot" :style="store.mdf.image
                ? { backgroundImage: `url('${store.mdf.image}')`, backgroundSize: 'cover' }
                : { background: store.mdf.color }"/>
              <span class="sum-text">{{ store.mdf.name }}</span>
            </div>
            <div class="sum-item">
              <span class="sum-dot" :style="store.chipboard.image
                ? { backgroundImage: `url('${store.chipboard.image}')`, backgroundSize: 'cover' }
                : { background: store.chipboard.color }"/>
              <span class="sum-text">{{ store.chipboard.name }}</span>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="kitchen-wrap">
          <div class="view-switch">
            <button :class="['vbtn', { active: view === 'photo' }]" @click="view = 'photo'">
              {{ t('visualizer.viewPhoto') }}
            </button>
            <button :class="['vbtn', { active: view === '3d' }]" @click="view = '3d'">
              {{ t('visualizer.view3d') }}
            </button>
          </div>

          <KitchenPhoto v-show="view === 'photo'"/>

          <div v-show="view === '3d'" class="canvas-slot">
            <canvas ref="canvasRef" class="kitchen-canvas"/>
          </div>

          <div class="kitchen-hint">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#888" stroke-width="1.2"/>
              <path d="M7 6v4M7 4.5v.5" stroke="#888" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            {{ view === 'photo' ? t('visualizer.hintPhoto') : t('visualizer.hint') }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.visualizer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
}

.vis-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 32px;
  align-items: start;
}

/* Panel */
.panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  position: sticky;
  top: 90px;
}

.panel-tabs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 24px;
}
.ptab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
  cursor: pointer;
  transition: all var(--transition);
  text-align: left;
  width: 100%;
}
.ptab:hover { border-color: var(--border-light); }
.ptab.active { background: rgba(154,106,66,0.08); border-color: var(--accent); }
.ptab-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.ptab-hint  { font-size: 11px; color: var(--text-muted); letter-spacing: 0.04em; }
.ptab.active .ptab-label { color: var(--accent); }

.current-sel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-primary);
  border-radius: var(--radius);
  margin-bottom: 20px;
  border: 1px solid var(--border);
}
.cur-dot {
  width: 32px; height: 32px;
  border-radius: 0;
  border: 1px solid rgba(43,39,36,0.12);
  flex-shrink: 0;
}
.cur-info { display: flex; flex-direction: column; gap: 1px; }
.cur-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.cur-code { font-size: 11px; color: var(--text-muted); letter-spacing: 0.05em; }

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 20px;
}
.cswatch {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 0;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition);
  position: relative;
  overflow: hidden;
}
.cswatch:hover { transform: scale(1.1); z-index: 1; }
.cswatch.sel { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.cswatch-check {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.sum-item { display: flex; align-items: center; gap: 10px; }
.sum-dot {
  width: 16px; height: 16px;
  border-radius: 0;
  border: 1px solid rgba(43,39,36,0.12);
  flex-shrink: 0;
}
.sum-text { font-size: 12px; color: var(--text-secondary); }

/* Preview */
.kitchen-wrap {
  position: relative;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #f5f0e8;
}

.view-switch {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 0;
  background: rgba(20,18,16,0.55);
  backdrop-filter: blur(6px);
}
.vbtn {
  border: 0;
  background: transparent;
  color: rgba(255,255,255,0.75);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 0;
  cursor: pointer;
  transition: all var(--transition);
}
.vbtn:hover  { color: #fff; }
.vbtn.active { background: var(--accent); color: var(--on-accent); }
.kitchen-canvas {
  width: 100%;
  display: block;
  cursor: grab;
}
.kitchen-canvas:active { cursor: grabbing; }

.kitchen-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  padding: 10px 16px;
  justify-content: center;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
}

@media (max-width: 900px) {
  .vis-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .panel { position: static; }
  /* preview first, so the photo stays in view while swatches are tapped */
  .kitchen-wrap { order: -1; }
  .panel-tabs {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ptab {
    flex: 1;
    min-width: 120px;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    padding: 10px 12px;
  }
  .ptab-hint { display: none; }
  .color-grid { grid-template-columns: repeat(6, 1fr); }
  .summary-row { flex-direction: row; flex-wrap: wrap; gap: 12px; }
  .sum-item { flex: 1; min-width: 120px; }
}

@media (max-width: 480px) {
  .color-grid { grid-template-columns: repeat(5, 1fr); }
  .ptab { min-width: 90px; }
}
</style>