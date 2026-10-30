<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { store } from '../store.js'
import { categories, getCategory } from '../data/categories.js'
import { t } from '../i18n.js'
import { formatPrice, hasCode } from '../format.js'

const route = useRoute()
const router = useRouter()

const key = computed(() => route.params.category)
const category = computed(() => getCategory(key.value))
const items = computed(() => category.value.data)
const isProduct = computed(() => category.value.kind === 'product')
const unit = c => t(c.kind === 'product' ? 'categories.models' : 'categories.decors')

const query = ref('')
// flooring is chosen by thickness: one chip per thickness found in the data (null = all)
const thickness = ref(null)
const thicknesses = computed(() => key.value === 'laminate'
  ? [...new Set(items.value.map(i => i.dimensions.thickness))].sort((a, b) => a - b)
  : [])
watch(key, () => { query.value = ''; thickness.value = null; closePopup(); revealActive() })

// on phones the sidebar is a horizontal strip — keep the current category visible
function revealActive() {
  nextTick(() => {
    const el = document.querySelector('.side-link.active')
    const strip = el?.parentElement
    if (strip && strip.scrollWidth > strip.clientWidth) {
      strip.scrollTo({ left: el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' })
    }
  })
}
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return items.value.filter(s =>
    (thickness.value == null || s.dimensions?.thickness === thickness.value) &&
    (!q || `${s.name ?? ''} ${s.code}`.toLowerCase().includes(q)))
})

// Countertops are identified by code only; everything else has a name + code
const showName = computed(() => key.value !== 'countertop')
const itemTitle = s => (showName.value ? (s.name || s.code) : s.code)
const imgStyle = s => (s.image ? { backgroundImage: `url("${encodeURI(s.image)}")` } : { background: s.color })

// Items with interior examples get their own page instead of the popup
const hasPages = computed(() => items.value.some(i => i.examples))

// Board decors can be tried on in the 360° studio
const canApply = computed(() => ['mdf', 'chipboard', 'countertop'].includes(key.value))

const popup = ref(null)

function openPopup(item) {
  popup.value = item
  document.body.style.overflow = 'hidden'
}

function closePopup() {
  popup.value = null
  document.body.style.overflow = ''
}

function apply(swatch) {
  store[key.value] = swatch
  store.activeMaterial = key.value
  store.pendingApply = { category: key.value, swatch }
  closePopup()
  router.push({ name: 'design' })
}

const dims = computed(() => {
  const d = popup.value?.dimensions
  if (!d) return []
  const mm = v => `${v} mm`
  return [
    d.diameter != null && [t('accessories.diameter'), `Ф${mm(d.diameter)}`],
    d.length != null && [t('accessories.length'), mm(d.length)],
    d.width != null && [t('accessories.width'), mm(d.width)],
    d.depth != null && [t('accessories.depth'), mm(d.depth)],
  ].filter(Boolean)
})

const offerLink = computed(() => {
  const item = popup.value
  const subject = `${t('categories.requestOffer')}: ${t(`categories.${key.value}`)} ${item ? itemTitle(item) : ''}`.trim()
  return `mailto:interwoodd@gmail.com?subject=${encodeURIComponent(subject)}`
})

function isSelected(item) {
  return store[key.value]?.code === item.code
}

function onKey(e) {
  if (e.key === 'Escape') closePopup()
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  revealActive()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <section class="category">
    <div class="layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <span class="side-title">{{ t('categories.sidebarTitle') }}</span>
        <nav class="side-nav">
          <RouterLink
            v-for="c in categories"
            :key="c.key"
            :to="{ name: 'category', params: { category: c.key } }"
            :class="['side-link', { active: c.key === key }]"
          >
            <span class="side-text">
              <span class="side-name">{{ t(`categories.${c.key}`) }}</span>
              <span class="side-count">{{ c.data.length ? `${c.data.length} ${unit(c)}` : t('categories.soon') }}</span>
            </span>
          </RouterLink>
        </nav>
        <RouterLink :to="{ name: 'design' }" class="side-studio">
          <span class="studio-badge">360°</span>
          <span>{{ t('nav.designStudio') }}</span>
        </RouterLink>
      </aside>

      <!-- Content -->
      <div class="content">
        <header class="head">
          <nav class="crumbs">
            <RouterLink :to="{ name: 'home' }">Interwood</RouterLink>
            <span>/</span>
            <RouterLink :to="{ name: 'home', hash: '#catalog' }">{{ t('nav.materials') }}</RouterLink>
            <span>/</span>
            <span class="current">{{ t(`categories.${key}`) }}</span>
          </nav>
          <div class="head-row">
            <div>
              <h1>{{ t(`categories.${key}`) }}</h1>
              <p class="lead">{{ t(`categories.${key}Desc`) }}</p>
            </div>
            <div v-if="items.length" class="count">
              <span class="count-n">{{ items.length }}</span>
              <span class="count-l">{{ unit(category) }}</span>
            </div>
          </div>
          <div v-if="items.length" class="search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input v-model="query" type="search" :placeholder="t('categories.search')" />
          </div>
          <div v-if="thicknesses.length > 1" class="chips">
            <button :class="['chip', { active: thickness == null }]" @click="thickness = null">{{ t('categories.allThickness') }}</button>
            <button
              v-for="mm in thicknesses"
              :key="mm"
              :class="['chip', { active: thickness === mm }]"
              @click="thickness = mm"
            >{{ mm }} mm</button>
          </div>
        </header>

        <div v-if="!items.length" class="soon">
          <div class="soon-art"></div>
          <p>{{ t('categories.comingSoon') }}</p>
          <a href="mailto:interwoodd@gmail.com" class="btn">{{ t('categories.requestOffer') }}</a>
        </div>

        <p v-if="hasPages && filtered.length" class="hover-hint">{{ t('panel.exampleHint') }}</p>

        <!-- Categories with their own product pages (MDF): colour, interior on hover, price -->
        <div v-if="hasPages && filtered.length" class="grid panels">
          <RouterLink
            v-for="item in filtered"
            :key="item.code"
            :to="{ name: 'panel', params: { category: key, code: item.code } }"
            :class="['card', { selected: isSelected(item) }]"
          >
            <div class="card-img" :style="imgStyle(item)">
              <span v-if="item.examples[0]" class="card-example" :style="imgStyle({ image: item.examples[0] })"></span>
            </div>
            <div class="card-info">
              <span class="card-name">{{ item.name }}</span>
              <span class="card-row">
                <span class="card-code">{{ hasCode(item) ? item.code : `${item.dimensions.thickness} mm` }}</span>
                <span v-if="item.price != null" class="card-price">{{ formatPrice(item.price) }}</span>
              </span>
            </div>
          </RouterLink>
        </div>

        <div v-else-if="filtered.length" :class="['grid', { products: isProduct }]">
          <button
            v-for="item in filtered"
            :key="item.code"
            :class="['card', { selected: canApply && isSelected(item) }]"
            @click="openPopup(item)"
          >
            <div class="card-img" :style="imgStyle(item)">
              <span class="preview-hint">{{ t('catalog.preview') }}</span>
              <span v-if="canApply && isSelected(item)" class="selected-badge">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </span>
            </div>
            <div class="card-info">
              <span class="card-name">{{ itemTitle(item) }}</span>
              <span v-if="showName && item.name" class="card-code">{{ item.code }}</span>
            </div>
          </button>
        </div>
        <p v-else-if="items.length" class="empty">{{ t('categories.noResults') }}</p>
      </div>
    </div>
  </section>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="popup" class="modal-overlay" @click.self="closePopup">
        <div class="modal">
          <button class="modal-close" @click="closePopup" :aria-label="t('catalog.close')">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>

          <div :class="['modal-image', { product: isProduct }]" :style="imgStyle(popup)"></div>

          <div class="modal-info">
            <span class="modal-category">{{ t(`categories.${key}`) }}</span>
            <h3 class="modal-name">{{ itemTitle(popup) }}</h3>
            <span v-if="showName && popup.name" class="modal-code">{{ popup.code }}</span>

            <div class="modal-divider"></div>

            <div v-if="dims.length" class="dims">
              <span class="dims-title">{{ t('accessories.dimensions') }}</span>
              <div v-for="[label, val] in dims" :key="label" class="dim">
                <span>{{ label }}</span><strong>{{ val }}</strong>
              </div>
            </div>
            <p v-else class="modal-desc">{{ t(`categories.${key}Desc`) }}</p>

            <div class="modal-actions">
              <button v-if="canApply" class="modal-apply" @click="apply(popup)">
                {{ t('catalog.apply') }}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <a v-else :href="offerLink" class="modal-apply">{{ t('categories.requestOffer') }}</a>
              <button class="modal-cancel" @click="closePopup">{{ t('catalog.close') }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.category {
  background: var(--bg-primary);
  min-height: 100vh;
  padding: calc(var(--nav-height) + 40px) 0 120px;
}
.layout {
  padding: 0 32px;
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 40px;
  align-items: start;
}

/* ===== SIDEBAR ===== */
.sidebar {
  position: sticky;
  top: calc(var(--nav-height) + 24px);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 12px 12px;
  box-shadow: var(--shadow-sm);
}
.side-title {
  display: block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0 10px 12px;
}
.side-nav { display: flex; flex-direction: column; gap: 2px; }
.side-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: var(--radius);
  transition: background var(--transition);
  position: relative;
}
.side-link:hover { background: var(--bg-secondary); }
.side-link.active { background: rgba(154, 106, 66, 0.1); }
.side-link.active::before {
  content: '';
  position: absolute;
  left: 0; top: 10px; bottom: 10px;
  width: 3px;
  border-radius: 0;
  background: var(--accent);
}
.side-text { display: flex; flex-direction: column; min-width: 0; }
.side-name { font-size: 17px; font-weight: 600; color: var(--text-primary); }
.side-link.active .side-name { color: var(--accent); }
.side-count { font-size: 13px; color: var(--text-muted); }

.side-studio {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 12px;
  border-radius: var(--radius);
  background: var(--bg-secondary);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  transition: background var(--transition);
}
.side-studio:hover { background: var(--accent-dim); }
.studio-badge {
  font-family: var(--font-display);
  font-size: 12px;
  color: var(--on-accent);
  background: var(--accent);
  border-radius: 0;
  padding: 2px 9px;
}

/* ===== CONTENT ===== */
.content { min-width: 0; }
.crumbs {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 18px;
}
.crumbs a { color: var(--text-secondary); transition: color var(--transition); }
.crumbs a:hover { color: var(--accent); }
.crumbs .current { color: var(--text-primary); }
.head-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 28px;
}
h1 {
  font-family: var(--font-display);
  font-size: clamp(35px, 4.4vw, 58px);
  font-weight: 500;
  line-height: 1;
  margin-bottom: 14px;
}
.lead { font-size: 16px; color: var(--text-secondary); max-width: 520px; line-height: 1.7; }
.count { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
.count-n { font-family: var(--font-display); font-size: 43px; line-height: 1; color: var(--accent); }
.count-l { font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-muted); }

.search {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0;
  padding: 0 18px;
  width: min(360px, 100%);
  margin-bottom: 32px;
  color: var(--text-muted);
  transition: border-color var(--transition), box-shadow var(--transition);
}
.search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(154, 106, 66, 0.12); }
.search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 14px;
  color: var(--text-primary);
  padding: 12px 0;
}

.chips { display: flex; flex-wrap: wrap; gap: 8px; margin: -16px 0 32px; }
.chip {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 9px 18px;
  cursor: pointer;
  transition: all var(--transition);
}
.chip:hover { border-color: var(--text-primary); color: var(--text-primary); }
.chip.active { background: var(--text-primary); border-color: var(--text-primary); color: #fff; }

.grid {
  display: grid;
  /* three cards per row in every category */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
.card {
  font: inherit;
  text-align: left;
  padding: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}
.card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--border-light); }
.card.selected { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.card-img {
  position: relative;
  aspect-ratio: 1 / 1;
  background-size: cover;
  background-position: center;
}
.products .card-img { background-color: #fff; background-size: 78%; background-repeat: no-repeat; }
.preview-hint {
  position: absolute;
  left: 50%; bottom: 12px;
  transform: translate(-50%, 6px);
  background: rgba(255, 255, 255, 0.94);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 0;
  opacity: 0;
  box-shadow: var(--shadow-sm);
  transition: opacity var(--transition), transform var(--transition);
}
.card:hover .preview-hint { opacity: 1; transform: translate(-50%, 0); }
.selected-badge {
  position: absolute;
  top: 10px; right: 10px;
  width: 26px; height: 26px;
  background: var(--accent);
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-info { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 2px; border-top: 1px solid var(--border); }
.card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-code { font-size: 11px; color: var(--text-muted); letter-spacing: 0.06em; }

/* MDF panels: wide colour photo, interior example fades in on hover */
.hover-hint { font-size: 12px; color: var(--text-muted); margin: -16px 0 16px; }
/* two big cards per row; three only on very wide screens, one on small ones */
@media (max-width: 1199px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.panels .card-info { padding: 16px 18px 18px; }
.panels .card-name { font-size: 16px; }
.panels .card-price { font-size: 20px; }
.panels .card { display: block; }
.panels .card-img { aspect-ratio: 3 / 2; overflow: hidden; }
.card-example {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transform: scale(1.04);
  transition: opacity 0.45s ease, transform 0.6s ease;
}
.panels .card:hover .card-example { opacity: 1; transform: none; }
.card-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.card-price { font-variant-numeric: lining-nums; font-family: var(--font-display); font-size: 14px; font-weight: 600; color: var(--accent); }
.empty { text-align: center; color: var(--text-secondary); padding: 60px 0; }

.soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
  padding: 48px 24px;
  background: var(--bg-card);
  border: 1px dashed var(--border-light);
  border-radius: var(--radius-lg);
}
.soon-art {
  width: 220px; height: 120px;
  border-radius: var(--radius);
  background: repeating-linear-gradient(90deg, #d9c6a8 0 23%, #c9b291 23% 24%, #e0cfb3 24% 49%, #ccb594 49% 50%, #d6c19f 50% 74%, #c9b291 74% 75%, #dfcdb0 75% 100%);
}
.soon p { color: var(--text-secondary); max-width: 420px; line-height: 1.7; }
.btn {
  background: var(--accent);
  color: var(--on-accent);
  padding: 12px 24px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
}
.btn:hover { background: var(--accent-light); }

/* ===== MODAL ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(43, 39, 36, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  display: grid;
  grid-template-columns: 1fr 380px;
  width: 100%;
  max-width: 880px;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 32px 80px rgba(43, 39, 36, 0.2);
}
.modal-close {
  position: absolute;
  top: 16px; right: 16px;
  width: 36px; height: 36px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border);
  border-radius: 0;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}
.modal-close:hover { color: var(--text-primary); }
.modal-image { min-height: 440px; background-size: cover; background-position: center; }
.modal-image.product { background-color: #fff; background-size: 80%; background-repeat: no-repeat; border-right: 1px solid var(--border); }
.modal-info {
  padding: 44px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow-y: auto;
}
.modal-category {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 14px;
}
.modal-name { font-family: var(--font-display); font-size: 27px; font-weight: 500; line-height: 1.1; margin-bottom: 8px; }
.modal-code { font-size: 13px; color: var(--text-muted); letter-spacing: 0.08em; }
.modal-divider { height: 1px; background: var(--border); margin: 20px 0 24px; }
.modal-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.75; margin-bottom: 36px; }
.dims { margin-bottom: 32px; }
.dims-title {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 10px;
}
.dim {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
}
.dim strong { color: var(--text-primary); font-weight: 600; }
.modal-actions { display: flex; flex-direction: column; gap: 10px; }
.modal-apply {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--accent);
  color: var(--on-accent);
  border: none;
  padding: 14px 24px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}
.modal-apply:hover { background: var(--accent-light); }
.modal-cancel {
  background: transparent;
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  padding: 12px 24px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.modal-cancel:hover { color: var(--text-primary); border-color: var(--text-muted); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: opacity 0.25s ease, transform 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { opacity: 0; transform: scale(0.95) translateY(16px); }

/* ===== MOBILE: sidebar becomes a scrolling strip under the navbar ===== */
@media (max-width: 900px) {
  .category { padding: var(--nav-height) 0 72px; }
  .layout { grid-template-columns: minmax(0, 1fr); gap: 20px; padding: 0 20px; }
  .grid.panels { grid-template-columns: 1fr; gap: 16px; }
  .sidebar {
    min-width: 0;
    top: var(--nav-height);
    z-index: 5;
    margin: 0 -20px;
    padding: 10px 20px;
    border-radius: 0;
    border-width: 0 0 1px;
    background: rgba(255, 255, 255, 0.97);
    backdrop-filter: blur(12px);
  }
  .side-title, .side-studio { display: none; }
  .side-nav { flex-direction: row; overflow-x: auto; gap: 8px; scrollbar-width: none; }
  .side-nav::-webkit-scrollbar { display: none; }
  .side-link { flex-shrink: 0; padding: 9px 16px; border: 1px solid var(--border); border-radius: 0; background: var(--bg-card); }
  .side-link.active { border-color: var(--accent); }
  .side-link.active::before { display: none; }
  .side-name { font-size: 15px; }
  .side-count { display: none; }
  .head-row { flex-direction: column; align-items: flex-start; gap: 14px; }
  .count { flex-direction: row; align-items: baseline; gap: 8px; }
  .count-n { font-size: 29px; }
  .search { width: 100%; }
  .grid, .grid.products { grid-template-columns: repeat(2, 1fr); gap: 12px; }

  .modal-overlay { padding: 0; align-items: flex-end; }
  .modal {
    grid-template-columns: 1fr;
    grid-template-rows: 260px 1fr;
    max-height: 92vh;
    border-radius: 0;
  }
  .modal-image { min-height: unset; height: 260px; }
  .modal-info { padding: 24px 20px; }
  .modal-name { font-size: 22px; }
}
</style>
