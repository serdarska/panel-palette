<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { store } from '../store.js'
import { categories, getCategory } from '../data/categories.js'
import { studioCategories } from '../data/rooms.js'
import { t } from '../i18n.js'
import { hasCode, codeOf } from '../format.js'

const route = useRoute()

const key = computed(() => route.params.category)
const category = computed(() => getCategory(key.value))
// an optional subcategory (?sub=wall) narrows the category's decors
const sub = computed(() => category.value.subs?.find(s => s.key === route.query.sub) ?? null)
const subItems = (c, s) => c.data.filter(s.filter)
const items = computed(() => (sub.value ? subItems(category.value, sub.value) : category.value.data))
// title/description keys, e.g. categories.countertop or categories.countertopWall
const subName = s => s.key[0].toUpperCase() + s.key.slice(1)
const titleKey = computed(() => `categories.${key.value}${sub.value ? subName(sub.value) : ''}`)
const isProduct = computed(() => category.value.kind === 'product')
const unit = c => t(c.kind === 'product' ? 'categories.models' : 'categories.decors')

const query = ref('')
// flooring and chipboard are chosen by thickness (null = all): flooring gets
// one chip per thickness in the data, chipboard the board thicknesses on offer.
// Flooring also has an 'XL' chip in that row: the large-format tiles (`xl`)
const thickness = ref(null)
const hasXl = computed(() => key.value === 'laminate' && items.value.some(i => i.xl))
const thicknessesOf = i => i.thicknesses ?? [i.dimensions?.thickness]
const thicknesses = computed(() => key.value === 'laminate'
  ? [...new Set(items.value.map(i => i.dimensions.thickness))].sort((a, b) => a - b)
  : key.value === 'chipboard' ? [16, 18, 25] : [])
// countertops and MDF are filtered by finish (null = all): matt or high gloss.
// Countertops go by their `gloss` flag; MDF by name — "HG …" is high gloss
const finish = ref(null)
const finishes = computed(() => ['countertop', 'mdf'].includes(key.value) ? ['matt', 'gloss'] : [])
const finishOf = i => ((key.value === 'mdf' ? /^HG\b/i.test(i.name ?? '') : i.gloss) ? 'gloss' : 'matt')
watch([key, sub], () => { query.value = ''; thickness.value = null; finish.value = null; revealActive() })

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
    (thickness.value == null || (thickness.value === 'xl' ? s.xl : thicknessesOf(s).includes(thickness.value))) &&
    (finish.value == null || finishOf(s) === finish.value) &&
    (!q || `${s.name ?? ''} ${codeOf(s)}`.toLowerCase().includes(q)))
})

// Countertops are identified by code only; everything else has a name + code
const showName = computed(() => key.value !== 'countertop')
const itemTitle = s => (showName.value ? (s.name || s.code) : s.code)
const imgStyle = s => (s.image ? { backgroundImage: `url("${encodeURI(s.image)}")` } : { background: s.color })

// every item opens its own page. Decors (with interior examples) use the big
// colour cards; products (sinks, faucets) keep their cut-out photo cards
const hasPages = computed(() => items.value.some(i => i.examples))

// Decors with a surface in the design studio can be tried on there
const canApply = computed(() => studioCategories.has(key.value))

function isSelected(item) {
  // a studio default isn't a choice, so nothing is outlined until one is made
  return !!store.picked[key.value] && store[key.value]?.code === item.code
}

onMounted(revealActive)
</script>

<template>
  <section class="category">
    <div class="layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <span class="side-title">{{ t('categories.sidebarTitle') }}</span>
        <nav class="side-nav">
          <template v-for="c in categories" :key="c.key">
          <RouterLink
            :to="{ name: 'category', params: { category: c.key } }"
            :class="['side-link', { active: c.key === key && !sub }]"
          >
            <span class="side-text">
              <span class="side-name">{{ t(`categories.${c.key}`) }}</span>
              <span class="side-count">{{ c.data.length ? `${c.data.length} ${unit(c)}` : t('categories.soon') }}</span>
            </span>
          </RouterLink>
          <RouterLink
            v-for="s in c.subs ?? []"
            :key="`${c.key}-${s.key}`"
            :to="{ name: 'category', params: { category: c.key }, query: { sub: s.key } }"
            :class="['side-link', 'side-sub', { active: c.key === key && sub?.key === s.key }]"
          >
            <span class="side-text">
              <span class="side-name">{{ t(`categories.${c.key}${subName(s)}`) }}</span>
              <span class="side-count">{{ subItems(c, s).length }} {{ unit(c) }}</span>
            </span>
          </RouterLink>
          </template>
        </nav>
        <RouterLink :to="{ name: 'design' }" class="side-studio">
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
            <template v-if="sub">
              <RouterLink :to="{ name: 'category', params: { category: key } }">{{ t(`categories.${key}`) }}</RouterLink>
              <span>/</span>
            </template>
            <span class="current">{{ t(titleKey) }}</span>
          </nav>
          <div class="head-row">
            <div>
              <h1>{{ t(titleKey) }}</h1>
              <p class="lead">{{ t(`${titleKey}Desc`) }}</p>
            </div>
            <div v-if="items.length" class="count">
              <!-- follows the filters and search, so it matches the cards shown -->
              <span class="count-n">{{ filtered.length }}</span>
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
            <button v-if="hasXl" :class="['chip', { active: thickness === 'xl' }]" @click="thickness = 'xl'">XL</button>
          </div>
          <div v-if="finishes.length" class="chips">
            <button :class="['chip', { active: finish == null }]" @click="finish = null">{{ t('categories.allThickness') }}</button>
            <button
              v-for="f in finishes"
              :key="f"
              :class="['chip', { active: finish === f }]"
              @click="finish = f"
            >{{ t(f === 'gloss' ? 'categories.finishGloss' : 'categories.finishMatt') }}</button>
          </div>
        </header>

        <div v-if="!items.length" class="soon">
          <div class="soon-art"></div>
          <p>{{ t('categories.comingSoon') }}</p>
          <a href="mailto:interwoodd@gmail.com" class="btn">{{ t('categories.requestOffer') }}</a>
        </div>

        <p v-if="hasPages && filtered.length && items.some(i => i.examples[0])" class="hover-hint">{{ t('panel.exampleHint') }}</p>

        <!-- Categories with their own product pages (MDF): colour, interior on hover -->
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
              <span class="card-name">{{ itemTitle(item) }}</span>
              <span v-if="item.name || !hasCode(item)" class="card-row">
                <span class="card-code">{{ hasCode(item) ? codeOf(item) : `${item.dimensions.thickness} mm` }}</span>
              </span>
            </div>
          </RouterLink>
        </div>

        <div v-else-if="filtered.length" :class="['grid', { products: isProduct }]">
          <RouterLink
            v-for="item in filtered"
            :key="item.code"
            :to="{ name: 'panel', params: { category: key, code: item.code } }"
            :class="['card', { selected: canApply && isSelected(item) }]"
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
              <span v-if="showName && item.name" class="card-code">{{ codeOf(item) }}</span>
            </div>
          </RouterLink>
        </div>
        <p v-else-if="items.length" class="empty">{{ t('categories.noResults') }}</p>
      </div>
    </div>
  </section>
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
/* a subcategory sits indented under its category */
.side-sub { padding-left: 30px; }
.side-sub .side-name { font-size: 15px; font-weight: 500; }

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
}
</style>
