<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { store } from '../store.js'
import { countertops, mdfColors, chipboardColors, sinks } from '../data/materials.js'

// ── Left panel ──────────────────────────────────────────────────────────────
const tabs = [
  { key: 'countertop', label: 'Counter Top',     hint: 'Surface slab' },
  { key: 'mdf',        label: 'Cabinet Fronts',  hint: 'Doors & drawers' },
  { key: 'chipboard',  label: 'Decorative Board', hint: 'Cabinet boxes' },
  { key: 'sink',       label: 'Sink',             hint: 'Basin model' },
]
const swatchMap = { countertop: countertops, mdf: mdfColors, chipboard: chipboardColors, sink: sinks }
const swatches  = computed(() => swatchMap[store.activeMaterial])
const current   = computed(() => store[store.activeMaterial])
function selectMaterial(key)   { store.activeMaterial = key }
function selectColor(swatch)   { store[store.activeMaterial] = swatch }
function isActive(swatch)      { return current.value?.code === swatch.code }

// ── Three.js ─────────────────────────────────────────────────────────────────
const canvasRef = ref(null)
let renderer, scene, camera, controls, animId, ro

// Shared kitchen materials (mutated on swatch change)
let chipMat, mdfMat, ctMat, sinkMat

const loader   = new THREE.TextureLoader()
const texCache = {}

// Shared clickable mesh arrays
const chipMeshes = [], mdfMeshes = [], ctMeshes = [], sinkMeshes = []

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
watch(() => store.sink,       s => applyToMat(sinkMat, s),  { deep: true })

// Highlight the active zone with a warm emissive tint
watch(() => store.activeMaterial, zone => {
  if (!chipMat) return
  chipMat.emissive.set(zone === 'chipboard'  ? 0x1a1000 : 0x000000)
  mdfMat .emissive.set(zone === 'mdf'        ? 0x1a1000 : 0x000000)
  ctMat  .emissive.set(zone === 'countertop' ? 0x1a1000 : 0x000000)
  sinkMat.emissive.set(zone === 'sink'       ? 0x1a1000 : 0x000000)
})

onMounted(initScene)
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

  camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 50)
  camera.position.set(2.7, 1.9, 3.0)
  camera.lookAt(0, 1.1, -1.8)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 1.1, -1.8)
  controls.enablePan      = false
  controls.minPolarAngle  = Math.PI / 5
  controls.maxPolarAngle  = Math.PI / 2.1
  controls.minAzimuthAngle = -Math.PI / 10
  controls.maxAzimuthAngle =  Math.PI / 3.2
  controls.minDistance    = 2.0
  controls.maxDistance    = 5.5
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
    controls.update()
    renderer.render(scene, camera)
  })()
}

// ── Lighting ─────────────────────────────────────────────────────────────────
function buildLighting() {
  scene.add(new THREE.AmbientLight(0xfff8ee, 1.3))

  const p = (x, y, z, intensity) => {
    const l = new THREE.PointLight(0xfff0d8, intensity, 10)
    l.position.set(x, y, z)
    l.castShadow = true
    l.shadow.mapSize.set(512, 512)
    scene.add(l)
  }
  p(-0.9, 2.45, 0.5, 2.4)
  p( 1.4, 2.45, 0.5, 2.0)

  const win = new THREE.DirectionalLight(0xd0e8ff, 0.85)
  win.position.set(5, 3, 2)
  win.target.position.set(-1, 1, -2)
  scene.add(win, win.target)
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

  // Floor – light warm wood tone
  plane(5.4, 5.0, std(0xc4b79e), 0,  0,  -0.2, -Math.PI / 2)
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
  chipMat = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.0 })
  mdfMat  = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.0 })
  ctMat   = new THREE.MeshStandardMaterial({ roughness: 0.28, metalness: 0.06 })
  sinkMat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.08 })

  applyToMat(chipMat, store.chipboard)
  applyToMat(mdfMat,  store.mdf)
  applyToMat(ctMat,   store.countertop)
  applyToMat(sinkMat, store.sink)

  // Trigger initial emissive state
  chipMat.emissive = new THREE.Color(store.activeMaterial === 'chipboard'  ? 0x1a1000 : 0x000000)
  mdfMat .emissive = new THREE.Color(store.activeMaterial === 'mdf'        ? 0x1a1000 : 0x000000)
  ctMat  .emissive = new THREE.Color(store.activeMaterial === 'countertop' ? 0x1a1000 : 0x000000)
  sinkMat.emissive = new THREE.Color(store.activeMaterial === 'sink'       ? 0x1a1000 : 0x000000)

  const handleMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.12, metalness: 0.92 })

  const WZ   = -1.97   // face of back wall (cabinets live between WZ and WZ+depth)
  const UDEP = 0.34    // upper cabinet depth
  const LDEP = 0.60    // lower cabinet depth
  const DOOR = 0.016   // door panel thickness

  // ── Upper cabinets ──
  makeUpperBank(-2.05, -0.68, WZ, UDEP, DOOR, handleMat)
  makeUpperBank( 0.68,  2.05, WZ, UDEP, DOOR, handleMat)

  // ── Range hood ──
  const hoodMat = new THREE.MeshStandardMaterial({ color: 0x1e1c18, roughness: 0.28, metalness: 0.5 })
  const box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, y, z); m.castShadow = true; scene.add(m); return m
  }
  box(0.26, 0.58, 0.22, hoodMat, 0, 2.0,  WZ - 0.11)  // chimney
  box(1.08, 0.38, 0.50, hoodMat, 0, 1.62, WZ - 0.25)  // canopy
  // Grille slats
  const grilleMat = new THREE.MeshStandardMaterial({ color: 0x111, roughness: 0.4, metalness: 0.3 })
  for (let i = 0; i < 3; i++) {
    box(0.82, 0.04, 0.015, grilleMat, 0, 1.5 - i * 0.055, WZ - 0.47)
  }
  // LED strip at hood bottom (emissive)
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xd4a010, emissive: new THREE.Color(0xd4a010), emissiveIntensity: 0.45,
  })
  box(0.98, 0.022, 0.04, ledMat, 0, 1.43, WZ - 0.47)
  // Under-hood warm glow
  const ledGlowL = new THREE.PointLight(0xd4900a, 1.1, 1.6)
  ledGlowL.position.set(-1.3, 1.44, -1.72); scene.add(ledGlowL)
  const ledGlowR = new THREE.PointLight(0xd4900a, 1.1, 1.6)
  ledGlowR.position.set( 1.3, 1.44, -1.72); scene.add(ledGlowR)

  // ── Backsplash tile panels ──
  const bsMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.65, metalness: 0.05 })
  const bsH = 0.50, bsY = 1.195
  const bsL = new THREE.Mesh(new THREE.PlaneGeometry(1.37, bsH), bsMat)
  bsL.position.set(-1.365, bsY, -1.984); scene.add(bsL)
  const bsR = new THREE.Mesh(new THREE.PlaneGeometry(1.37, bsH), bsMat)
  bsR.position.set( 1.365, bsY, -1.984); scene.add(bsR)

  // ── Countertop slab ──
  const ct = new THREE.Mesh(new THREE.BoxGeometry(4.14, 0.06, 0.67), ctMat)
  ct.position.set(0, 0.93, WZ + 0.67 / 2 - 0.01)
  ct.castShadow = true; ct.receiveShadow = true
  ct.userData.zone = 'countertop'
  ctMeshes.push(ct); scene.add(ct)

  // ── Sink basin (clickable, uses sinkMat) ──
  // Outer shell
  const sinkShell = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.10, 0.48), sinkMat)
  sinkShell.position.set(0, 0.905, WZ + 0.48 / 2 + 0.05)
  sinkShell.castShadow = true
  sinkShell.userData.zone = 'sink'
  sinkMeshes.push(sinkShell); scene.add(sinkShell)
  // Inner basin (dark recessed area)
  const basinMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.5, metalness: 0.3 })
  const basin = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.07, 0.40), basinMat)
  basin.position.set(0, 0.915, WZ + 0.40 / 2 + 0.07)
  scene.add(basin)
  // Drain disc
  const drainMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.2, metalness: 0.8 })
  const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.008, 16), drainMat)
  drain.position.set(0, 0.883, WZ + 0.26)
  scene.add(drain)

  // ── Faucet (arch tube along a Bezier curve) ──
  const fMat = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, roughness: 0.12, metalness: 0.90 })
  const fBase = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.06, 12), fMat)
  fBase.position.set(-0.13, 0.985, WZ + 0.10); scene.add(fBase)
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.13, 0.96, WZ + 0.10),
    new THREE.Vector3(-0.13, 1.22, WZ + 0.22),
    new THREE.Vector3( 0.05, 0.96, WZ + 0.40)
  )
  const arch = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.013, 8, false), fMat)
  scene.add(arch)
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.04, 8), fMat)
  spout.position.set(0.05, 0.94, WZ + 0.40); scene.add(spout)

  // ── Lower cabinets ──
  makeLowerBank(-2.05, -0.68, WZ, LDEP, DOOR, handleMat)
  makeSinkCab(  -0.68,  0.68, WZ, LDEP, DOOR, handleMat)
  makeLowerBank( 0.68,  2.05, WZ, LDEP, DOOR, handleMat)

  // ── Kickboard ──
  const kickMat = new THREE.MeshStandardMaterial({ color: 0x151210, roughness: 0.85 })
  const kick = new THREE.Mesh(new THREE.BoxGeometry(4.14, 0.12, 0.04), kickMat)
  kick.position.set(0, 0.06, WZ + 0.01); scene.add(kick)
}

// ── Cabinet helpers ───────────────────────────────────────────────────────────
function makeUpperBank(x1, x2, wz, depth, doorThick, handleMat) {
  const w  = x2 - x1
  const h  = 0.72
  const cx = (x1 + x2) / 2
  const cy = 1.46 + h / 2  // bottom at 1.46, top at ~2.18

  const carc = new THREE.Mesh(new THREE.BoxGeometry(w - 0.005, h - 0.005, depth), chipMat)
  carc.position.set(cx, cy, wz - depth / 2)
  carc.castShadow = true
  carc.userData.zone = 'chipboard'
  chipMeshes.push(carc); scene.add(carc)

  const n  = 3
  const dw = (w - 0.024) / n
  for (let i = 0; i < n; i++) {
    const dx = x1 + 0.012 + dw * (i + 0.5)
    const door = new THREE.Mesh(new THREE.BoxGeometry(dw - 0.006, h - 0.018, doorThick), mdfMat)
    door.position.set(dx, cy, wz + doorThick / 2)
    door.castShadow = true
    door.userData.zone = 'mdf'
    mdfMeshes.push(door); scene.add(door)

    // Vertical bar handle near door bottom
    const han = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 8), handleMat)
    han.position.set(dx, cy - h / 2 + 0.15, wz + doorThick + 0.012)
    scene.add(han)
  }
}

function makeLowerBank(x1, x2, wz, depth, doorThick, handleMat) {
  const w   = x2 - x1
  const h   = 0.88
  const cx  = (x1 + x2) / 2
  const cy  = h / 2

  const carc = new THREE.Mesh(new THREE.BoxGeometry(w - 0.005, h - 0.005, depth), chipMat)
  carc.position.set(cx, cy, wz - depth / 2)
  carc.castShadow = true
  carc.userData.zone = 'chipboard'
  chipMeshes.push(carc); scene.add(carc)

  // Drawer
  const drawerH = 0.2
  const drawer = new THREE.Mesh(new THREE.BoxGeometry(w - 0.016, drawerH - 0.008, doorThick), mdfMat)
  drawer.position.set(cx, h - drawerH / 2 - 0.006, wz + doorThick / 2)
  drawer.userData.zone = 'mdf'
  mdfMeshes.push(drawer); scene.add(drawer)
  // Horizontal bar handle on drawer
  const dhan = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, w * 0.45, 8), handleMat)
  dhan.rotation.z = Math.PI / 2
  dhan.position.set(cx, h - drawerH / 2 - 0.006, wz + doorThick + 0.013)
  scene.add(dhan)

  // 2 doors
  const doorH = h - drawerH - 0.015
  const dw    = (w - 0.024) / 2
  for (let i = 0; i < 2; i++) {
    const dx   = x1 + 0.012 + dw * (i + 0.5)
    const door = new THREE.Mesh(new THREE.BoxGeometry(dw - 0.006, doorH - 0.006, doorThick), mdfMat)
    door.position.set(dx, (doorH - 0.006) / 2 + 0.008, wz + doorThick / 2)
    door.castShadow = true
    door.userData.zone = 'mdf'
    mdfMeshes.push(door); scene.add(door)
    const han = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 8), handleMat)
    han.position.set(dx, doorH - 0.16, wz + doorThick + 0.013)
    scene.add(han)
  }
}

function makeSinkCab(x1, x2, wz, depth, doorThick, handleMat) {
  const w  = x2 - x1
  const h  = 0.88
  const cx = (x1 + x2) / 2

  const carc = new THREE.Mesh(new THREE.BoxGeometry(w - 0.005, h - 0.005, depth), chipMat)
  carc.position.set(cx, h / 2, wz - depth / 2)
  carc.castShadow = true
  carc.userData.zone = 'chipboard'
  chipMeshes.push(carc); scene.add(carc)

  const door = new THREE.Mesh(new THREE.BoxGeometry(w - 0.016, h - 0.018, doorThick), mdfMat)
  door.position.set(cx, h / 2, wz + doorThick / 2)
  door.userData.zone = 'mdf'
  mdfMeshes.push(door); scene.add(door)

  const han = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 8), handleMat)
  han.position.set(cx, h / 2 + 0.14, wz + doorThick + 0.013)
  scene.add(han)
}

// ── Raycasting for click-to-select ────────────────────────────────────────────
function buildRaycaster() {
  const raycaster = new THREE.Raycaster()
  const mouse     = new THREE.Vector2()
  const allClick  = [...chipMeshes, ...mdfMeshes, ...ctMeshes, ...sinkMeshes]

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
        <span class="section-label">Design Studio</span>
        <h2>Build Your Kitchen</h2>
        <p>Select a material category, choose a color, and watch your kitchen transform in real time.</p>
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
            <div class="sum-item">
              <span class="sum-dot" :style="store.sink.image
                ? { backgroundImage: `url('${store.sink.image}')`, backgroundSize: 'cover' }
                : { background: store.sink.color }"/>
              <span class="sum-text">{{ store.sink.name }}</span>
            </div>
          </div>
        </div>

        <!-- Three.js canvas -->
        <div class="kitchen-wrap">
          <canvas ref="canvasRef" class="kitchen-canvas"/>
          <div class="kitchen-hint">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#888" stroke-width="1.2"/>
              <path d="M7 6v4M7 4.5v.5" stroke="#888" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            Click a surface to switch material · Drag to rotate
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
.ptab.active { background: rgba(201,168,76,0.08); border-color: var(--accent); }
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
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.08);
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
  border-radius: 6px;
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
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}
.sum-text { font-size: 12px; color: var(--text-secondary); }

/* Three.js canvas */
.kitchen-wrap {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #f5f0e8;
}
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