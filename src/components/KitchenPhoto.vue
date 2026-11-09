<script setup>
import { ref, onMounted, watch } from 'vue'
import { store } from '../store.js'
import { t } from '../i18n.js'

const PHOTO = '/materials/kitchen.jpeg'
const MASK  = '/materials/kitchen-mask.png'
// Working resolution. 1536 matches the mask asset; phones recolour a smaller
// buffer so a swatch tap stays instant.
const SIZE = typeof window !== 'undefined' && window.innerWidth < 760 ? 1024 : 1536

// One zone per material. `anchor` is the median luminance of the zone in the
// source photo and `phi` the 88th percentile – both measured once from the
// photo, they let us relight an arbitrary colour with the original shading.
const ZONES = [
  { key: 'mdf',        ch: 0, anchor: 110.5, phi: 138.3, tile: 4, gloss: 0.65 },
  { key: 'chipboard',  ch: 1, anchor: 107.3, phi: 134.5, tile: 5, gloss: 0.35 },
  { key: 'countertop', ch: 2, anchor:  59.5, phi: 109.3, tile: 2, gloss: 0.40 },
]

const canvasRef = ref(null)
const loading   = ref(true)
const failed    = ref(false)

let ctx = null
let frame = null              // ImageData we paint into
let base  = null              // Uint8ClampedArray – untouched photo
let lumB  = null              // Uint8Array – luminance of the photo
let maskB = null              // Uint8ClampedArray – RGBA of the mask
const pix = {}                // zone key → { idx: Int32Array, a: Float32Array }
const texCache = new Map()    // swatch url → { data, size } | 'pending'

// ── asset loading ────────────────────────────────────────────────────────────
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function toData(img, size) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d', { willReadFrequently: true })
  g.drawImage(img, 0, 0, size, size)
  return g.getImageData(0, 0, size, size)
}

onMounted(init)

async function init() {
  try {
    const [photo, mask] = await Promise.all([loadImage(PHOTO), loadImage(MASK)])
    const canvas = canvasRef.value
    canvas.width = canvas.height = SIZE
    ctx = canvas.getContext('2d', { willReadFrequently: true })

    frame = toData(photo, SIZE)
    base  = new Uint8ClampedArray(frame.data)
    maskB = toData(mask, SIZE).data

    const n = SIZE * SIZE
    lumB = new Uint8Array(n)
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      lumB[i] = (0.2126 * base[p] + 0.7152 * base[p + 1] + 0.0722 * base[p + 2]) | 0
    }

    // Collect the pixels of each zone up front so a recolour only walks them.
    for (const z of ZONES) {
      const idx = [], a = []
      for (let i = 0; i < n; i++) {
        const w = maskB[i * 4 + z.ch]
        if (w > 2) { idx.push(i); a.push(w / 255) }
      }
      pix[z.key] = { idx: Int32Array.from(idx), a: Float32Array.from(a) }
    }

    loading.value = false
    render()
  } catch (e) {
    failed.value = true
    loading.value = false
  }
}

// ── material helpers ─────────────────────────────────────────────────────────
function glossOf(swatch, baseGloss) {
  const s = `${swatch.name || ''} ${swatch.code || ''} ${swatch.image || ''}`.toUpperCase()
  // `matt` / `gloss` flags win; a matte board may reuse its glossy twin's photo,
  // so gloss words are read from the name and code only, never the image path
  const nameCode = `${swatch.name || ''} ${swatch.code || ''}`.toUpperCase()
  if (swatch.matt || /SOFT ?TOUCH|SUPERMAT|\bMATT?\b|NATUREL|(^|\s)МАТ(\s|$)/.test(s)) return baseGloss * 0.35
  if (swatch.gloss || /\bHG\b|SJAJ|СЈАЈ|GLOSS|PARLAK/.test(nameCode))               return baseGloss * 1.55
  return baseGloss
}

function hexToRgb(hex) {
  const h = (hex || '#cccccc').replace('#', '')
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}

/** Square sample of a swatch image, loaded lazily; falls back to its flat colour. */
function textureFor(url) {
  if (!url) return null
  const hit = texCache.get(url)
  if (hit) return hit === 'pending' ? null : hit
  texCache.set(url, 'pending')
  loadImage(url).then(img => {
    const size = 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const g = c.getContext('2d', { willReadFrequently: true })
    const side = Math.min(img.width, img.height)
    g.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
    texCache.set(url, { data: g.getImageData(0, 0, size, size).data, size })
    render()
  }).catch(() => texCache.set(url, { data: null, size: 0 }))
  return null
}

function averageOf(tex, fallback) {
  if (!tex || !tex.data) return fallback
  const d = tex.data
  let r = 0, g = 0, b = 0
  for (let p = 0; p < d.length; p += 16) { r += d[p]; g += d[p + 1]; b += d[p + 2] }
  const n = d.length / 16
  return [r / n, g / n, b / n]
}

// ── the recolour itself ──────────────────────────────────────────────────────
let queued = 0
function render() {
  if (queued) return
  queued = requestAnimationFrame(() => { queued = 0; draw() })
}

function draw() {
  if (!ctx || loading.value) return
  const out = frame.data
  out.set(base)

  for (const z of ZONES) {
    const swatch = store[z.key]
    if (!swatch) continue
    const { idx, a } = pix[z.key]
    if (!idx.length) continue

    const tex   = textureFor(swatch.image)
    const avg   = averageOf(tex, hexToRgb(swatch.color))
    const gloss = glossOf(swatch, z.gloss)

    // How far we are pushing the surface away from its luminance in the photo.
    // Lightening a near-black worktop has to flatten the original shading,
    // otherwise its mirror-dark reflections drag the new colour back to black.
    const lt    = 0.2126 * avg[0] + 0.7152 * avg[1] + 0.0722 * avg[2]
    const ratio = Math.log2(Math.max(lt, 6) / z.anchor)
    const mix   = 1 - 0.85 * Math.min(1, Math.max(0, ratio) / 2.5)

    const shadeLUT = new Float32Array(256)
    const specLUT  = new Float32Array(256)
    const specAmt  = 255 * 0.95 * gloss * (0.3 + 0.7 * mix)
    for (let l = 0; l < 256; l++) {
      shadeLUT[l] = Math.max(0, 1 + mix * (Math.min(l / z.anchor, 8) - 1))
      const s = Math.min(1, Math.max(0, (l - z.phi) / (255 - z.phi)))
      specLUT[l] = Math.pow(s, 1.4) * specAmt
    }

    const td = tex && tex.data ? tex.data : null
    const ts = tex ? tex.size : 0
    const scale = td ? (z.tile * ts) / SIZE : 0
    const [ar, ag, ab] = avg

    for (let k = 0; k < idx.length; k++) {
      const i = idx[k], p = i * 4, l = lumB[i]
      const sh = shadeLUT[l], sp = specLUT[l], w = a[k], iw = 1 - w

      let tr = ar, tg = ag, tb = ab
      if (td) {
        const tx = ((i % SIZE) * scale | 0) % ts
        const ty = (((i / SIZE) | 0) * scale | 0) % ts
        const q = (ty * ts + tx) * 4
        tr = td[q]; tg = td[q + 1]; tb = td[q + 2]
      }

      out[p]     = base[p]     * iw + (tr * sh + sp) * w
      out[p + 1] = base[p + 1] * iw + (tg * sh + sp) * w
      out[p + 2] = base[p + 2] * iw + (tb * sh + sp) * w
    }
  }

  ctx.putImageData(frame, 0, 0)
}

watch(() => [store.mdf, store.chipboard, store.countertop], render, { deep: true })

// ── click a surface to switch to that material ───────────────────────────────
function onClick(e) {
  if (!maskB) return
  const r = e.currentTarget.getBoundingClientRect()
  const x = Math.floor(((e.clientX - r.left) / r.width) * SIZE)
  const y = Math.floor(((e.clientY - r.top) / r.height) * SIZE)
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return
  const p = (y * SIZE + x) * 4
  let best = null, bestW = 24
  for (const z of ZONES) {
    const w = maskB[p + z.ch]
    if (w > bestW) { bestW = w; best = z.key }
  }
  if (best) store.activeMaterial = best
}
</script>

<template>
  <div class="photo-wrap">
    <canvas ref="canvasRef" class="photo-canvas" @click="onClick"/>
    <div v-if="loading" class="photo-state">{{ t('visualizer.photoLoading') }}</div>
    <div v-else-if="failed" class="photo-state">
      <img :src="PHOTO" alt="" class="photo-fallback">
    </div>
  </div>
</template>

<style scoped>
.photo-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #ece7e0;
}
.photo-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: pointer;
}
.photo-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-muted);
  background: var(--bg-card);
}
.photo-fallback { width: 100%; height: 100%; object-fit: cover; }
</style>
