<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { store } from '../store.js'
import { getCategory } from '../data/categories.js'
import { studioCategories } from '../data/rooms.js'
import { t } from '../i18n.js'
import { hasCode, codeOf } from '../format.js'

const route = useRoute()
const router = useRouter()

const categoryKey = computed(() => route.params.category)
const list = computed(() => getCategory(categoryKey.value).data)
// sinks and faucets: a cut-out product photo, measurements instead of a board size
const isProduct = computed(() => getCategory(categoryKey.value).kind === 'product')
const index = computed(() => list.value.findIndex(i => i.code === route.params.code))
const panel = computed(() => list.value[index.value])
const prev = computed(() => list.value[(index.value - 1 + list.value.length) % list.value.length])
const next = computed(() => list.value[(index.value + 1) % list.value.length])

// worktops have no name, only a code
const title = p => p.name ?? p.code
const finish = p => (p.gloss ? 'finishHG' : /soft touch/i.test(p.name) ? 'finishSoft' : 'finishDecor')
// products are grouped by model (Lena, Ines…), boards by finish, flooring by thickness
const group = p => (isProduct.value ? p.name.split(' ')[0] : p.dimensions.length ? finish(p) : p.dimensions.thickness)
// other colours from the same group first
const related = computed(() => {
  const g = group(panel.value)
  const others = list.value.filter(p => p.code !== panel.value.code)
  return [...others.filter(p => group(p) === g), ...others.filter(p => group(p) !== g)].slice(0, 8)
})

const size = ({ dimensions: d }) => (d.length ? `${d.length} × ${d.width} × ${d.thickness} mm` : `${d.thickness} mm`)
// code or (for laminate) thickness under each related tile
const meta = p => (!hasCode(p) ? size(p) : p.name ? codeOf(p) : size(p))

// a product's measurements, one row each; faucets have none listed yet
const productSpecs = computed(() => {
  const d = panel.value.dimensions ?? {}
  const mm = v => `${v} mm`
  return [
    d.diameter != null && ['accessories.diameter', `Ф${mm(d.diameter)}`],
    d.length != null && ['accessories.length', mm(d.length)],
    d.width != null && ['accessories.width', mm(d.width)],
    d.depth != null && ['accessories.depth', mm(d.depth)],
  ].filter(Boolean)
})

// categories with a surface in the design studio
const canTry = computed(() => studioCategories.has(categoryKey.value))

// one row per picture: the colour, then each interior example
const figures = computed(() => [
  { kind: 'colour', src: panel.value.image },
  // where no example was supplied the colour photo stands in — don't show it twice
  ...(panel.value.examples ?? []).filter(src => src !== panel.value.image).map(src => ({ kind: 'example', src })),
])

const zoomed = ref(null)
function openZoom(src) {
  zoomed.value = src
  document.body.style.overflow = 'hidden'
}
function closeZoom() {
  zoomed.value = null
  document.body.style.overflow = ''
}

function tryInStudio() {
  store[categoryKey.value] = panel.value
  store.picked[categoryKey.value] = true
  store.pendingApply = { category: categoryKey.value, swatch: panel.value }
  router.push({ name: 'design' })
}

const offerLink = computed(() => {
  const p = panel.value
  const code = hasCode(p) && p.name ? ` (${codeOf(p)})` : ''
  const subject = `${t('categories.requestOffer')}: ${t(`categories.${categoryKey.value}`)} ${title(p)}${code}`
  return `mailto:interwoodd@gmail.com?subject=${encodeURIComponent(subject)}`
})

const go = p => router.push({ name: 'panel', params: { category: categoryKey.value, code: p.code } })
const bg = src => ({ backgroundImage: `url("${encodeURI(src)}")` })

function onKey(e) {
  if (e.key === 'Escape') closeZoom()
  if (zoomed.value) return
  if (e.key === 'ArrowLeft') go(prev.value)
  if (e.key === 'ArrowRight') go(next.value)
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <section class="panel-page">
    <div class="section-container">
      <!-- Header -->
      <nav class="crumbs">
        <RouterLink :to="{ name: 'home' }">Interwood</RouterLink>
        <span>/</span>
        <RouterLink :to="{ name: 'category', params: { category: categoryKey } }">{{ t(`categories.${categoryKey}`) }}</RouterLink>
        <span>/</span>
        <span class="current">{{ title(panel) }}</span>
      </nav>

      <header class="head">
        <div>
          <span class="finish">{{ t(`categories.${categoryKey}`) }}<template v-if="!isProduct"> · {{ panel.dimensions.length ? t(`panel.${finish(panel)}`) : size(panel) }}</template></span>
          <h1>{{ title(panel) }}</h1>
        </div>
        <div class="pager">
          <RouterLink :to="{ name: 'panel', params: { category: categoryKey, code: prev.code } }" class="pager-btn" :title="t('panel.prev')">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </RouterLink>
          <span class="pager-count">{{ index + 1 }} / {{ list.length }}</span>
          <RouterLink :to="{ name: 'panel', params: { category: categoryKey, code: next.code } }" class="pager-btn" :title="t('panel.next')">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </RouterLink>
        </div>
      </header>

      <!-- One row per picture, details next to it -->
      <div class="figures">
        <article v-for="(fig, i) in figures" :key="fig.src" :class="['figure', { flip: i % 2 }]">
          <button :class="['figure-img', { product: isProduct }]" :style="bg(fig.src)" :title="t('panel.zoom')" @click="openZoom(fig.src)">
            <span class="zoom-chip">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14M7 5v4M5 7h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </span>
          </button>

          <div class="figure-info">
            <span class="figure-label">{{ t(fig.kind === 'example' ? 'panel.example' : isProduct ? 'panel.product' : panel.dimensions.length ? 'panel.colour' : 'panel.decor') }}</span>
            <h2>{{ title(panel) }}</h2>
            <dl class="specs">
              <div v-if="hasCode(panel)"><dt>{{ t('panel.code') }}</dt><dd>{{ codeOf(panel) }}</dd></div>
              <template v-if="isProduct">
                <div v-for="[label, val] in productSpecs" :key="label"><dt>{{ t(label) }}</dt><dd>{{ val }}</dd></div>
              </template>
              <div v-else><dt>{{ t(panel.dimensions.length ? 'panel.dimensions' : 'panel.thickness') }}</dt><dd>{{ size(panel) }}</dd></div>
            </dl>
            <div v-if="i === 0" class="actions">
              <button v-if="canTry" class="btn-primary" @click="tryInStudio">
                {{ t('panel.tryInStudio') }}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <a :href="offerLink" class="btn-ghost">{{ t('categories.requestOffer') }}</a>
            </div>
          </div>
        </article>
      </div>

      <!-- More colours -->
      <div class="related">
        <div class="related-head">
          <h3>{{ t(isProduct ? 'panel.moreModels' : 'panel.more') }}</h3>
          <RouterLink :to="{ name: 'category', params: { category: categoryKey } }" class="all-link">
            {{ t('categories.back') }} →
          </RouterLink>
        </div>
        <div class="related-grid">
          <RouterLink
            v-for="p in related"
            :key="p.code"
            :to="{ name: 'panel', params: { category: categoryKey, code: p.code } }"
            class="rel"
          >
            <span :class="['rel-img', { product: isProduct }]" :style="bg(p.image)">
              <span v-if="p.examples?.[0]" class="rel-example" :style="bg(p.examples[0])"></span>
            </span>
            <span class="rel-name">{{ title(p) }}</span>
            <span class="rel-meta">{{ meta(p) }}</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </section>

  <Teleport to="body">
    <Transition name="zoom">
      <div v-if="zoomed" class="lightbox" @click="closeZoom">
        <img :src="zoomed" :alt="title(panel)" />
        <button class="lb-close" :aria-label="t('catalog.close')">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.panel-page {
  background: var(--bg-primary);
  min-height: 100vh;
  padding: calc(var(--nav-height) + 40px) 0 120px;
}

.crumbs { display: flex; flex-wrap: wrap; gap: 8px; font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
.crumbs a { color: var(--text-secondary); transition: color var(--transition); }
.crumbs a:hover { color: var(--accent); }
.crumbs .current { color: var(--text-primary); }

.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 40px;
}
.finish {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 12px;
}
h1 {
  font-family: var(--font-display);
  font-size: clamp(35px, 4.8vw, 64px);
  font-weight: 500;
  line-height: 1;
}
.pager { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.pager-btn {
  width: 44px; height: 44px;
  border-radius: 0;
  border: 1px solid var(--border-light);
  background: var(--bg-card);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}
.pager-btn:hover { border-color: var(--accent); color: var(--accent); }
.pager-count { font-size: 13px; color: var(--text-muted); min-width: 52px; text-align: center; }

/* ===== FIGURES ===== */
.figures { display: flex; flex-direction: column; gap: 28px; }
.figure {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(300px, 1fr);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.figure.flip { grid-template-columns: minmax(300px, 1fr) minmax(0, 1.7fr); }
.figure.flip .figure-img { order: 2; }
.figure-img {
  position: relative;
  min-height: 340px;
  border: none;
  padding: 0;
  background-color: var(--bg-secondary);
  background-size: cover;
  background-position: center;
  cursor: zoom-in;
}
.zoom-chip {
  position: absolute;
  right: 14px; bottom: 14px;
  width: 34px; height: 34px;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
  opacity: 0;
  transform: scale(0.9);
  transition: opacity var(--transition), transform var(--transition);
}
.figure-img:hover .zoom-chip { opacity: 1; transform: none; }
/* product cut-outs are shown whole on white, not cropped to fill */
.figure-img.product, .rel-img.product {
  background-color: #fff;
  background-size: contain;
  background-repeat: no-repeat;
  background-origin: content-box;
}
.figure-img.product { min-height: 420px; padding: 32px; }
.rel-img.product { padding: 12px; }

.figure-info {
  padding: 36px 36px 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.figure-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
}
h2 {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 500;
  line-height: 1.1;
  margin-bottom: 20px;
}
.specs { display: flex; flex-direction: column; }
.specs > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 11px 0;
  border-bottom: 1px solid var(--border);
}
.specs > div:first-child { border-top: 1px solid var(--border); }
dt { font-size: 13px; color: var(--text-secondary); }
dd { font-size: 14px; font-weight: 600; color: var(--text-primary); text-align: right; }

.actions { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
.btn-primary, .btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 20px;
  border-radius: var(--radius);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}
.btn-primary { background: var(--accent); color: var(--on-accent); border: none; }
.btn-primary:hover { background: var(--accent-light); }
.btn-ghost { background: transparent; color: var(--text-primary); border: 1px solid var(--text-primary); }
.btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

/* ===== RELATED ===== */
.related { margin-top: 72px; }
.related-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
.related-head h3 { font-family: var(--font-display); font-size: 26px; font-weight: 500; }
.all-link { font-size: 13px; font-weight: 600; color: var(--accent); }
.related-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.rel { display: flex; flex-direction: column; gap: 4px; }
.rel-img {
  position: relative;
  aspect-ratio: 3 / 2;
  border-radius: var(--radius);
  overflow: hidden;
  background-size: cover;
  background-position: center;
  margin-bottom: 8px;
  box-shadow: inset 0 0 0 1px rgba(43, 39, 36, 0.08);
}
.rel-example {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.rel:hover .rel-example { opacity: 1; }
.rel-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.rel-meta { font-size: 12px; color: var(--text-muted); }

/* ===== LIGHTBOX ===== */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(30, 27, 25, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  cursor: zoom-out;
}
.lightbox img { max-width: 100%; max-height: 100%; border-radius: var(--radius); box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4); }
.lb-close {
  position: absolute;
  top: 20px; right: 20px;
  width: 42px; height: 42px;
  border-radius: 0;
  border: none;
  background: rgba(255, 255, 255, 0.92);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.zoom-enter-active, .zoom-leave-active { transition: opacity 0.25s ease; }
.zoom-enter-from, .zoom-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .panel-page { padding: calc(var(--nav-height) + 20px) 0 72px; }
  .head { flex-direction: column; align-items: flex-start; margin-bottom: 24px; }
  .figure, .figure.flip { grid-template-columns: 1fr; }
  .figure.flip .figure-img { order: 0; }
  .figure-img { min-height: 0; aspect-ratio: 2.19 / 1; }
  .figure-info { padding: 22px 20px 24px; }
  h2 { font-size: 21px; }
  .related { margin-top: 48px; }
  .related-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .lightbox { padding: 12px; }
}
</style>
