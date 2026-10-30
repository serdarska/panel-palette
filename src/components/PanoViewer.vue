<script setup>
// 360° room viewer. Draws an equirectangular render on a full-screen quad and
// re-textures the changeable surfaces live: mask.png says which surface a
// pixel belongs to, uv.png where on that surface it is, and the render's own
// brightness provides the lighting. See tools/ROOMS.md for the asset format.
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  room:       { type: Object, required: true },   // entry from src/data/rooms.js
  hotspots:   { type: Object, default: () => ({}) }, // surface id → [yaw, pitch]
  selections: { type: Object, required: true },   // surface id → swatch
  selected:   { type: Number, default: 0 },
})
const emit = defineEmits(['select', 'loaded'])

// Albedo the changeable surfaces were rendered with (tools/room-gen/scenes.js)
const ALBEDO = 0.8
const MAX_SURFACES = 8
const UV_RANGE = 10 // metres covered by the 12-bit uv encoding

const wrapRef = ref(null)
const canvasRef = ref(null)
const markerRefs = ref({})
const loading = ref(true)
const hoverId = ref(0)

let renderer, scene, camera, material, ro, raf
let maskData = null, maskW = 0, maskH = 0
const view = { yaw: 0, pitch: 0, fov: 75, vYaw: 0, vPitch: 0 }
// the view only moves when the visitor drags it; rotation is opt-in from the toolbar
let autoRotate = false
let loadToken = 0

const texLoader = new THREE.TextureLoader()
const texCache = new Map()

// ── shader ──────────────────────────────────────────────────────────────────
const surfaceUniforms = {}
for (let i = 1; i <= MAX_SURFACES; i++) {
  surfaceUniforms[`tex${i}`] = { value: null }
  surfaceUniforms[`tile${i}`] = { value: 1 }
  surfaceUniforms[`rot${i}`] = { value: 0 }
  surfaceUniforms[`asp${i}`] = { value: 1 } // width / height of the material photo
}
const sampleChain = Array.from({ length: MAX_SURFACES }, (_, k) => {
  const i = k + 1
  return `if (id == ${i}) { vec2 c = rot${i} > 0.5 ? m.yx : m; return texture(tex${i}, c / (tile${i} * vec2(asp${i}, 1.0))).rgb; }`
}).join('\n      ')

function makeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      beauty: { value: null }, mask: { value: null }, uvmap: { value: null },
      yaw: { value: 0 }, pitch: { value: 0 }, tanHalf: { value: 1 }, aspect: { value: 1 },
      hover: { value: 0 }, sel: { value: 0 },
      ...surfaceUniforms,
    },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D beauty, mask, uvmap;
      uniform float yaw, pitch, tanHalf, aspect;
      uniform int hover, sel;
      ${Object.keys(surfaceUniforms).map(k => `uniform ${k.startsWith('tex') ? 'sampler2D' : 'float'} ${k};`).join('\n      ')}
      varying vec2 vUv;
      const float PI = 3.14159265359;

      vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
      vec3 toSRGB(vec3 c)   { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }

      vec3 sampleSurface(int id, vec2 m) {
      ${sampleChain}
        return vec3(1.0);
      }

      void main() {
        vec2 ndc = vUv * 2.0 - 1.0;
        vec3 f = vec3(sin(yaw) * cos(pitch), sin(pitch), -cos(yaw) * cos(pitch));
        vec3 r = normalize(cross(f, vec3(0.0, 1.0, 0.0)));
        vec3 u = cross(r, f);
        vec3 d = normalize(f + r * ndc.x * tanHalf * aspect + u * ndc.y * tanHalf);
        vec2 eq = vec2(atan(d.x, -d.z) / (2.0 * PI) + 0.5, asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5);

        vec3 base = texture(beauty, eq).rgb;
        vec3 light = toLinear(base) / ${ALBEDO.toFixed(2)};

        // mask and uv are id/coordinate data, so they are read texel by texel
        // and blended by hand — that keeps the edges between surfaces smooth.
        ivec2 size = textureSize(mask, 0);
        vec2 tp = eq * vec2(size) - 0.5;
        ivec2 t0 = ivec2(floor(tp));
        vec2 fr = fract(tp);
        int ids[4]; vec2 ms[4];
        for (int k = 0; k < 4; k++) {
          ivec2 tc = t0 + ivec2(k & 1, k >> 1);
          tc.x = (tc.x % size.x + size.x) % size.x;
          tc.y = clamp(tc.y, 0, size.y - 1);
          ids[k] = int(floor(texelFetch(mask, tc, 0).r * 255.0 / 16.0 + 0.5));
          vec3 p = floor(texelFetch(uvmap, tc, 0).rgb * 255.0 + 0.5);
          ms[k] = vec2(p.r * 16.0 + floor(p.b / 16.0), p.g * 16.0 + mod(p.b, 16.0)) / 4095.0 * ${UV_RANGE.toFixed(1)};
        }
        float w[4] = float[4]((1.0 - fr.x) * (1.0 - fr.y), fr.x * (1.0 - fr.y), (1.0 - fr.x) * fr.y, fr.x * fr.y);
        if (ids[0] == 0 && ids[1] == 0 && ids[2] == 0 && ids[3] == 0) { gl_FragColor = vec4(base, 1.0); return; }

        vec3 col;
        int mainId = ids[0];
        if (ids[0] == ids[1] && ids[0] == ids[2] && ids[0] == ids[3]) {
          vec2 m = ms[0] * w[0] + ms[1] * w[1] + ms[2] * w[2] + ms[3] * w[3];
          col = toLinear(sampleSurface(ids[0], m)) * light;
        } else {
          col = vec3(0.0);
          float best = -1.0;
          for (int k = 0; k < 4; k++) {
            col += w[k] * (ids[k] == 0 ? toLinear(base) : toLinear(sampleSurface(ids[k], ms[k])) * light);
            if (w[k] > best) { best = w[k]; mainId = ids[k]; }
          }
        }
        if (mainId == sel)   col = mix(col, vec3(1.0, 0.86, 0.66) * light, 0.08);
        if (mainId == hover) col *= 1.12;
        gl_FragColor = vec4(toSRGB(clamp(col, 0.0, 1.0)), 1.0);
      }`,
  })
}

// ── loading ─────────────────────────────────────────────────────────────────
function loadTex(url, { data = false } = {}) {
  return new Promise((resolve, reject) => {
    texLoader.load(url, t => {
      t.colorSpace = THREE.NoColorSpace
      t.generateMipmaps = false
      t.minFilter = data ? THREE.NearestFilter : THREE.LinearFilter
      t.magFilter = data ? THREE.NearestFilter : THREE.LinearFilter
      t.wrapS = THREE.RepeatWrapping
      resolve(t)
    }, undefined, reject)
  })
}

function swatchTexture(swatch) {
  const key = swatch.image || swatch.color
  if (texCache.has(key)) return texCache.get(key)
  let tex
  if (swatch.image) {
    tex = texLoader.load(encodeURI(swatch.image), () => { tex.needsUpdate = true; applySelections() })
  } else {
    const c = new THREE.Color(swatch.color)
    tex = new THREE.DataTexture(new Uint8Array([c.r * 255, c.g * 255, c.b * 255, 255]), 1, 1)
    tex.needsUpdate = true
  }
  tex.colorSpace = THREE.NoColorSpace
  tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping
  tex.anisotropy = renderer?.capabilities.getMaxAnisotropy() ?? 4
  texCache.set(key, tex)
  return tex
}

function applySelections() {
  if (!material) return
  for (const s of props.room.surfaces) {
    const swatch = props.selections[s.id]
    if (!swatch) continue
    material.uniforms[`tex${s.id}`].value = swatchTexture(swatch)
    material.uniforms[`tile${s.id}`].value = s.tile ?? 0.8
    material.uniforms[`rot${s.id}`].value = s.rotate ? 1 : 0
    const img = material.uniforms[`tex${s.id}`].value.image
    material.uniforms[`asp${s.id}`].value = img?.width && img?.height ? img.width / img.height : 1
  }
}

async function loadRoom() {
  const token = ++loadToken
  loading.value = true
  const base = `/rooms/${props.room.id}/`
  try {
    const [beauty, mask, uvmap, maskImg] = await Promise.all([
      loadTex(base + 'beauty.jpg'),
      loadTex(base + 'mask.png', { data: true }),
      loadTex(base + 'uv.png', { data: true }),
      new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = base + 'mask.png' }),
    ])
    if (token !== loadToken) return
    for (const k of ['beauty', 'mask', 'uvmap']) material.uniforms[k].value?.dispose()
    Object.assign(material.uniforms.beauty, { value: beauty })
    material.uniforms.mask.value = mask
    material.uniforms.uvmap.value = uvmap

    // CPU copy of the mask for click picking
    const c = document.createElement('canvas')
    maskW = c.width = maskImg.width
    maskH = c.height = maskImg.height
    const g = c.getContext('2d', { willReadFrequently: true })
    g.drawImage(maskImg, 0, 0)
    maskData = g.getImageData(0, 0, maskW, maskH).data

    const v = props.room.view ?? {}
    Object.assign(view, { yaw: v.yaw ?? 0, pitch: v.pitch ?? 0, fov: v.fov ?? 75, vYaw: 0, vPitch: 0 })
    applySelections()
    loading.value = false
    emit('loaded')
  } catch (e) {
    console.error('Room failed to load', e)
  }
}

// ── camera / picking ────────────────────────────────────────────────────────
const rad = d => d * Math.PI / 180

function basis() {
  const y = rad(view.yaw), p = rad(view.pitch)
  const f = new THREE.Vector3(Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p))
  const r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize()
  const u = new THREE.Vector3().crossVectors(r, f)
  return { f, r, u, t: Math.tan(rad(view.fov) / 2) }
}

function pick(clientX, clientY) {
  if (!maskData) return 0
  const rect = canvasRef.value.getBoundingClientRect()
  const nx = ((clientX - rect.left) / rect.width) * 2 - 1
  const ny = 1 - ((clientY - rect.top) / rect.height) * 2
  const { f, r, u, t } = basis()
  const aspect = rect.width / rect.height
  const d = f.clone().addScaledVector(r, nx * t * aspect).addScaledVector(u, ny * t).normalize()
  const ex = Math.atan2(d.x, -d.z) / (2 * Math.PI) + 0.5
  const ey = 0.5 - Math.asin(d.y) / Math.PI
  const px = Math.min(maskW - 1, Math.floor(ex * maskW))
  const py = Math.min(maskH - 1, Math.floor(ey * maskH))
  const id = Math.round(maskData[(py * maskW + px) * 4] / 16)
  return props.room.surfaces.some(s => s.id === id) ? id : 0
}

function placeMarkers() {
  const rect = wrapRef.value?.getBoundingClientRect()
  if (!rect) return
  const { f, r, u, t } = basis()
  const aspect = rect.width / rect.height
  for (const [id, el] of Object.entries(markerRefs.value)) {
    const hs = props.hotspots[id]
    if (!el || !hs) continue
    const y = rad(hs[0]), p = rad(hs[1])
    const d = new THREE.Vector3(Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p))
    const z = d.dot(f)
    if (z < 0.15) { el.style.opacity = '0'; el.style.pointerEvents = 'none'; continue }
    const sx = d.dot(r) / (z * t * aspect), sy = d.dot(u) / (z * t)
    el.style.opacity = ''
    el.style.pointerEvents = ''
    el.style.transform = `translate(${(sx + 1) / 2 * rect.width}px, ${(1 - sy) / 2 * rect.height}px) translate(-50%, -50%)`
  }
}

// ── input ───────────────────────────────────────────────────────────────────
const pointers = new Map()
let drag = null
let pinchDist = 0

function onPointerDown(e) {
  canvasRef.value.setPointerCapture(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  autoRotate = false
  if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false }
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    pinchDist = Math.hypot(a.x - b.x, a.y - b.y)
  }
}

function onPointerMove(e) {
  if (!pointers.has(e.pointerId)) {
    const id = pick(e.clientX, e.clientY)
    if (id !== hoverId.value) hoverId.value = id
    return
  }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    zoom((pinchDist - dist) * 0.15)
    pinchDist = dist
    drag = null
    return
  }
  if (!drag) return
  const h = canvasRef.value.clientHeight
  const k = view.fov / h
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y
  view.yaw -= dx * k
  view.pitch = Math.max(-85, Math.min(85, view.pitch + dy * k))
  const now = performance.now()
  const dt = Math.max(1, now - drag.t)
  view.vYaw = (-dx * k) / dt * 16
  view.vPitch = (dy * k) / dt * 16
  drag.x = e.clientX; drag.y = e.clientY; drag.t = now
  if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) drag.moved = true
}

function onPointerUp(e) {
  pointers.delete(e.pointerId)
  if (drag && !drag.moved) {
    view.vYaw = view.vPitch = 0
    const id = pick(e.clientX, e.clientY)
    if (id) emit('select', id)
  }
  if (performance.now() - (drag?.t ?? 0) > 80) view.vYaw = view.vPitch = 0
  drag = null
}

function onWheel(e) {
  e.preventDefault()
  zoom(e.deltaY * 0.04)
}

function zoom(delta) {
  view.fov = Math.max(35, Math.min(95, view.fov + delta))
}

// ── loop ────────────────────────────────────────────────────────────────────
function frame(time) {
  raf = requestAnimationFrame(frame)
  if (!drag) {
    if (autoRotate) view.yaw += 0.03
    view.yaw += view.vYaw
    view.pitch = Math.max(-85, Math.min(85, view.pitch + view.vPitch))
    view.vYaw *= 0.92
    view.vPitch *= 0.92
  }
  const u = material.uniforms
  const w = canvasRef.value.clientWidth, h = canvasRef.value.clientHeight
  u.yaw.value = rad(view.yaw)
  u.pitch.value = rad(view.pitch)
  u.tanHalf.value = Math.tan(rad(view.fov) / 2)
  u.aspect.value = w / h
  u.hover.value = hoverId.value
  u.sel.value = props.selected
  renderer.render(scene, camera)
  placeMarkers()
}

onMounted(() => {
  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: false, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  scene = new THREE.Scene()
  camera = new THREE.Camera()
  material = makeMaterial()
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))
  ro = new ResizeObserver(() => {
    const { clientWidth: w, clientHeight: h } = wrapRef.value
    renderer.setSize(w, h, false)
  })
  ro.observe(wrapRef.value)
  canvasRef.value.addEventListener('wheel', onWheel, { passive: false })
  loadRoom()
  raf = requestAnimationFrame(frame)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
  texCache.forEach(t => t.dispose())
  for (const k of ['beauty', 'mask', 'uvmap']) material?.uniforms[k].value?.dispose()
  material?.dispose()
  renderer?.dispose()
})

watch(() => props.room.id, () => { autoRotate = false; loadRoom() })
watch(() => props.selections, applySelections, { deep: true })

defineExpose({
  zoom,
  reset() {
    const v = props.room.view ?? {}
    Object.assign(view, { yaw: v.yaw ?? 0, pitch: v.pitch ?? 0, fov: v.fov ?? 75, vYaw: 0, vPitch: 0 })
  },
  toggleRotate() { autoRotate = !autoRotate; return autoRotate },
  screenshot() { return canvasRef.value.toDataURL('image/jpeg', 0.92) },
})
</script>

<template>
  <div ref="wrapRef" class="pano" :class="{ hovering: hoverId }">
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
      v-show="!loading && hotspots[s.id]"
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
      <div v-if="loading" class="loader">
        <span class="spinner"></span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pano {
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
