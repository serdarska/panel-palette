<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import PanoViewer from '../components/PanoViewer.vue'
import { rooms } from '../data/rooms.js'
import { materialMeta } from '../data/materials.js'
import { store } from '../store.js'
import { t } from '../i18n.js'
import { hasCode } from '../format.js'

const STORAGE_KEY = 'iw-design-v1'
const FAV_KEY = 'iw-favourites-v1'

const roomId = ref(rooms[0].id)
const room = computed(() => rooms.find(r => r.id === roomId.value))
const selectedId = ref(room.value.surfaces[0].id)
const surface = computed(() => room.value.surfaces.find(s => s.id === selectedId.value))
const hotspots = reactive({})
const rotating = ref(false)
const isFullscreen = ref(false)
const viewer = ref(null)
const stage = ref(null)

// overlays inside the viewer — only one open at a time
const open = ref(null) // 'rooms' | 'surfaces' | 'info' | null
const toggle = name => { open.value = open.value === name ? null : name }

// rail tools
const showSearch = ref(false)
const showFilter = ref(false)
const onlyFavourites = ref(false)
const query = ref('')
const filter = ref(null)

const findSwatch = (category, code) => materialMeta[category].data.find(s => s.code === code)

// room id → surface id → swatch, restored from the last visit when possible
const load = key => { try { return JSON.parse(localStorage.getItem(key)) } catch { return null } }
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* private mode */ } }
const saved = load(STORAGE_KEY) || {}
const selections = reactive(Object.fromEntries(rooms.map(r => [r.id, Object.fromEntries(r.surfaces.map(s => [
  s.id,
  findSwatch(s.category, saved[r.id]?.[s.id]) ?? findSwatch(s.category, s.default) ?? materialMeta[s.category].data[0],
]))])))

watch(selections, () => {
  save(STORAGE_KEY, Object.fromEntries(Object.entries(selections).map(([r, m]) => [r, Object.fromEntries(Object.entries(m).map(([id, s]) => [id, s.code]))])))
}, { deep: true })

// favourites are kept per category as "category:code"
const favourites = reactive(new Set(load(FAV_KEY) || []))
const favKey = sw => `${surface.value.category}:${sw.code}`
const isFav = sw => favourites.has(favKey(sw))
function toggleFav(sw) {
  const k = favKey(sw)
  favourites.has(k) ? favourites.delete(k) : favourites.add(k)
  save(FAV_KEY, [...favourites])
}

// filters per category: thickness for floors, finish for MDF
const filters = computed(() => {
  const list = materialMeta[surface.value.category].data
  if (surface.value.category === 'laminate') {
    return [...new Set(list.map(s => s.dimensions.thickness))].sort((a, b) => a - b)
      .map(mm => ({ key: mm, label: `${mm} mm`, test: s => s.dimensions.thickness === mm }))
  }
  if (surface.value.category === 'mdf') {
    return [
      { key: 'hg', label: t('panel.finishHG'), test: s => s.name.startsWith('HG') },
      { key: 'soft', label: t('panel.finishSoft'), test: s => /soft touch/i.test(s.name) },
      { key: 'decor', label: t('panel.finishDecor'), test: s => !s.name.startsWith('HG') && !/soft touch/i.test(s.name) },
    ]
  }
  return []
})

const swatches = computed(() => {
  const q = query.value.trim().toLowerCase()
  const f = filters.value.find(x => x.key === filter.value)
  return materialMeta[surface.value.category].data.filter(s =>
    (!onlyFavourites.value || isFav(s)) &&
    (!f || f.test(s)) &&
    (!q || `${s.name ?? ''} ${s.code}`.toLowerCase().includes(q)))
})

// new surface → fresh list
watch(() => surface.value.category, () => { query.value = ''; filter.value = null; showFilter.value = false })

const swatchTitle = (category, s) => (category === 'countertop' ? s.code : (s.name || s.code))
const swatchSub = s => (!hasCode(s) ? `${s.dimensions.thickness} mm` : s.name ? s.code : '')
const bg = s => (s.image ? { backgroundImage: `url("${encodeURI(s.image)}")` } : { background: s.color })

async function loadHotspots(id) {
  if (hotspots[id]) return
  try { hotspots[id] = await (await fetch(`/rooms/${id}/hotspots.json`)).json() } catch { hotspots[id] = {} }
}

function selectRoom(id) {
  roomId.value = id
  selectedId.value = room.value.surfaces[0].id
  rotating.value = false
  open.value = null
  loadHotspots(id)
}

function selectSurface(id) {
  selectedId.value = id
  open.value = null
}

function pick(swatch) {
  selections[roomId.value][selectedId.value] = swatch
}

function toggleRotate() {
  rotating.value = viewer.value.toggleRotate()
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen()
  else stage.value.requestFullscreen?.()
}

function download() {
  const a = document.createElement('a')
  a.href = viewer.value.screenshot()
  a.download = `interwood-${roomId.value}.jpg`
  a.click()
}

const mailto = computed(() => {
  const lines = room.value.surfaces.map(s => {
    const sw = selections[roomId.value][s.id]
    const detail = !hasCode(sw) ? `${sw.dimensions.thickness} mm` : sw.name && s.category !== 'countertop' ? sw.code : ''
    return `${s.label}: ${t(`categories.${s.category}`)} ${swatchTitle(s.category, sw)}${detail ? ` (${detail})` : ''}`
  })
  const body = `${t('design.mailIntro')} — ${room.value.name}\n\n${lines.join('\n')}\n`
  return `mailto:interwoodd@gmail.com?subject=${encodeURIComponent(`${t('design.mailSubject')}: ${room.value.name}`)}&body=${encodeURIComponent(body)}`
})

onMounted(() => {
  rooms.forEach(r => loadHotspots(r.id))
  document.addEventListener('fullscreenchange', () => { isFullscreen.value = !!document.fullscreenElement })
  // "Try in the studio" from a category or product page
  if (store.pendingApply) {
    const { category, swatch } = store.pendingApply
    store.pendingApply = null
    const target = room.value.surfaces.filter(s => s.category === category)
    target.forEach(s => { selections[roomId.value][s.id] = swatch })
    if (target[0]) selectedId.value = target[0].id
  }
})
</script>

<template>
  <section class="design">
    <!-- Page header -->
    <header class="page-head">
      <nav class="crumbs">
        <RouterLink :to="{ name: 'home' }">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2.5 7.5L8 3l5.5 4.5V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V7.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
          Interwood
        </RouterLink>
        <span class="crumb-sep">›</span>
        <span class="crumb-current">{{ t('design.label') }}</span>
      </nav>
      <h1>{{ t('design.pageTitle') }}</h1>
      <p class="intro">{{ t('design.intro') }}</p>
    </header>

    <!-- Viewer -->
    <div ref="stage" class="stage">
      <PanoViewer
        ref="viewer"
        :room="room"
        :hotspots="hotspots[roomId] || {}"
        :selections="selections[roomId]"
        :selected="selectedId"
        @select="selectSurface"
      />

      <!-- Left: surface header + swatch rail -->
      <div class="left">
      <div class="rail-head">
        <button class="surface-title" :title="t('design.changeSurface')" @click="toggle('surfaces')">
          <span class="surface-name">{{ surface.label }}</span>
          <span class="surface-cat">{{ t(`categories.${surface.category}`) }}</span>
          <svg :class="['caret', { up: open === 'surfaces' }]" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="tools">
          <button :class="['tool', { on: onlyFavourites }]" :title="t('design.favourites')" @click="onlyFavourites = !onlyFavourites">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 13.5S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 7.5-6 7.5z" :fill="onlyFavourites ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
          </button>
          <button :class="['tool', { on: showSearch }]" :title="t('design.search')" @click="showSearch = !showSearch; if (!showSearch) query = ''">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </button>
          <button
            v-if="filters.length"
            :class="['tool', 'tool-text', { on: showFilter || filter != null }]"
            @click="showFilter = !showFilter"
          >{{ t('design.filter') }}</button>
        </div>
        <input
          v-if="showSearch"
          v-model="query"
          class="rail-search"
          type="search"
          :placeholder="t('categories.search')"
          autofocus
        />
        <div v-if="showFilter && filters.length" class="rail-filters">
          <button :class="['chip', { active: filter == null }]" @click="filter = null">{{ t('categories.allThickness') }}</button>
          <button
            v-for="f in filters"
            :key="f.key"
            :class="['chip', { active: filter === f.key }]"
            @click="filter = f.key"
          >{{ f.label }}</button>
        </div>

        <!-- surface picker -->
        <div v-if="open === 'surfaces'" class="surface-menu">
          <button
            v-for="s in room.surfaces"
            :key="s.id"
            :class="['surface-opt', { active: s.id === selectedId }]"
            @click="selectSurface(s.id)"
          >
            <span class="opt-swatch" :style="bg(selections[roomId][s.id])"></span>
            <span class="opt-text">
              <span class="opt-label">{{ s.label }}</span>
              <span class="opt-mat">{{ swatchTitle(s.category, selections[roomId][s.id]) }}</span>
            </span>
          </button>
        </div>
      </div>

      <aside class="rail">
        <span class="rail-label">{{ onlyFavourites ? t('design.favourites') : t('design.colour') }}</span>
        <div class="rail-list">
          <div
            v-for="sw in swatches"
            :key="sw.code"
            :class="['sw', { active: selections[roomId][selectedId]?.code === sw.code }]"
          >
            <button class="sw-img" :style="bg(sw)" :title="swatchTitle(surface.category, sw)" @click="pick(sw)"></button>
            <button :class="['fav', { on: isFav(sw) }]" :aria-label="t('design.favourites')" @click.stop="toggleFav(sw)">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 13.5S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 7.5-6 7.5z" :fill="isFav(sw) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
            </button>
            <span class="sw-name">{{ swatchTitle(surface.category, sw) }}</span>
            <span v-if="swatchSub(sw)" class="sw-sub">{{ swatchSub(sw) }}</span>
          </div>
          <p v-if="!swatches.length" class="rail-empty">
            {{ onlyFavourites ? t('design.noFavourites') : t('categories.noResults') }}
          </p>
        </div>
      </aside>
      </div>

      <button :class="['menu-btn', { on: open === 'rooms' }]" :title="t('design.roomsMenu')" @click="toggle('rooms')">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>

      <!-- Room picker -->
      <Transition name="fade">
        <div v-if="open === 'rooms'" class="rooms-overlay" @click.self="open = null">
          <div class="rooms-list">
            <button
              v-for="r in rooms"
              :key="r.id"
              :class="['room-card', { active: r.id === roomId }]"
              @click="selectRoom(r.id)"
            >
              <span class="room-thumb" :style="{ backgroundImage: `url(/rooms/${r.id}/thumb.jpg)` }"></span>
              <span class="room-name">{{ r.name }}</span>
            </button>
            <button class="close-btn" @click="open = null">{{ t('design.close') }}</button>
          </div>
        </div>
      </Transition>

      <!-- Selection summary -->
      <Transition name="fade">
        <div v-if="open === 'info'" class="info-card">
          <div class="info-head">
            <span>{{ t('design.info') }} · {{ room.name }}</span>
            <button class="info-x" :aria-label="t('design.close')" @click="open = null">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
          <button
            v-for="s in room.surfaces"
            :key="s.id"
            class="info-row"
            @click="selectSurface(s.id)"
          >
            <span class="opt-swatch" :style="bg(selections[roomId][s.id])"></span>
            <span class="opt-text">
              <span class="opt-label">{{ s.label }}</span>
              <span class="opt-mat">{{ t(`categories.${s.category}`) }} · {{ swatchTitle(s.category, selections[roomId][s.id]) }}</span>
            </span>
          </button>
          <p class="info-hint">{{ t('design.hint') }}</p>
          <a :href="mailto" class="send">
            {{ t('design.send') }}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </Transition>

      <!-- Bottom-right controls -->
      <div class="controls">
        <button class="ctl" :title="t('design.reset')" @click="viewer.reset()">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10a6 6 0 1 0 1.8-4.3M4 3.5v3h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button :class="['ctl', { on: open === 'info' }]" :title="t('design.info')" @click="toggle('info')">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 9v5M10 6.2v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
        <a class="ctl" :href="mailto" :title="t('design.send')">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="5" width="14" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 5.5L10 10.5l6.5-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        </a>
        <button :class="['ctl', 'ctl-360', { on: rotating }]" :title="t('design.rotate')" @click="toggleRotate">360</button>
        <button class="ctl" :title="t('design.download')" @click="download">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="5.5" width="15" height="10.5" rx="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10.7" r="2.8" stroke="currentColor" stroke-width="1.5"/><path d="M7 5.5l1-2h4l1 2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        </button>
        <button class="ctl" :title="t('design.fullscreen')" @click="toggleFullscreen">
          <svg v-if="!isFullscreen" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3.5 7.5v-4h4M16.5 7.5v-4h-4M3.5 12.5v4h4M16.5 12.5v4h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.5 3.5v4h-4M12.5 3.5v4h4M7.5 16.5v-4h-4M12.5 16.5v-4h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.design {
  padding-top: var(--nav-height);
  background: var(--bg-secondary);
  padding-bottom: 48px;
}

/* ===== PAGE HEADER ===== */
.page-head {
  max-width: 1280px;
  margin: 0 auto;
  padding: 28px 48px 32px;
}
.crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 28px;
}
.crumbs a { display: inline-flex; align-items: center; gap: 6px; color: var(--text-secondary); }
.crumbs a:hover { color: var(--accent); }
.crumb-sep { color: var(--text-muted); }
.crumb-current { font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-primary); }
.page-head h1 {
  font-family: var(--font-display);
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  line-height: 1.1;
  margin-bottom: 16px;
}
.intro { font-size: 16px; line-height: 1.6; color: var(--text-secondary); max-width: 640px; }

/* ===== STAGE ===== */
.stage {
  position: relative;
  margin: 0 10px;
  height: clamp(520px, calc(100vh - var(--nav-height) - 40px), 860px);
  background: #e9e3da;
  overflow: hidden;
}
.stage:fullscreen { margin: 0; height: 100vh; }

/* ---- left column: header block over the swatch rail ---- */
.left {
  position: absolute;
  top: 0; bottom: 0; left: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  pointer-events: none;
}
.left > * { pointer-events: auto; }
.rail-head {
  position: relative;
  width: 220px;
  z-index: 1;
  background: #fff;
  padding: 14px 14px 12px;
  box-shadow: 0 6px 20px rgba(20, 17, 15, 0.08);
}
.surface-title {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  text-align: center;
  font: inherit;
  padding: 0 0 10px;
}
.surface-name {
  grid-column: 1;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-primary);
}
.surface-cat { grid-column: 1; font-size: 11px; color: var(--text-muted); }
.caret { grid-column: 2; grid-row: 1 / span 2; color: var(--text-muted); transition: transform var(--transition); }
.caret.up { transform: rotate(180deg); }

.tools { display: flex; gap: 8px; }
.tool {
  height: 32px;
  min-width: 32px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: #fff;
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition);
}
.tool:hover { border-color: var(--text-primary); color: var(--text-primary); }
.tool.on { border-color: var(--text-primary); color: var(--text-primary); background: var(--bg-secondary); }
.tool-text { flex: 1; font: inherit; font-size: 13px; padding: 0 12px; }
.rail-search {
  width: 100%;
  margin-top: 10px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  padding: 8px 10px;
  font: inherit;
  font-size: 13px;
  outline: none;
}
.rail-search:focus { border-color: var(--accent); }
.rail-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.chip {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-secondary);
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.chip.active { background: var(--text-primary); border-color: var(--text-primary); color: #fff; }

.surface-menu {
  margin-top: 12px;
  border-top: 1px solid var(--border);
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 340px;
  overflow-y: auto;
}
.surface-opt, .info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  font: inherit;
  width: 100%;
}
.surface-opt:hover, .info-row:hover { background: var(--bg-secondary); }
.surface-opt.active { background: var(--bg-secondary); }
.opt-swatch {
  width: 30px; height: 30px;
  flex-shrink: 0;
  background-size: cover;
  background-position: center;
  box-shadow: inset 0 0 0 1px rgba(43, 39, 36, 0.12);
}
.opt-text { display: flex; flex-direction: column; min-width: 0; }
.opt-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.opt-mat { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.menu-btn {
  position: absolute;
  top: 0; left: 226px;
  z-index: 4;
  width: 38px; height: 38px;
  background: #fff;
  border: none;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(20, 17, 15, 0.08);
}
.menu-btn.on, .menu-btn:hover { background: var(--text-primary); color: #fff; }

/* ---- swatch rail ---- */
.rail {
  flex: 1;
  min-height: 0;
  width: 112px;
  background: rgba(236, 234, 231, 0.94);
  display: flex;
  flex-direction: column;
}
.rail-label {
  padding: 14px 0 8px;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
}
.rail-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  scrollbar-width: thin;
}
.sw { position: relative; display: flex; flex-direction: column; gap: 4px; }
.sw-img {
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid transparent;
  background-size: cover;
  background-position: center;
  box-shadow: inset 0 0 0 1px rgba(43, 39, 36, 0.12);
  cursor: pointer;
  padding: 0;
  transition: border-color var(--transition);
}
.sw-img:hover { border-color: rgba(43, 39, 36, 0.35); }
.sw.active .sw-img { border-color: var(--text-primary); }
.fav {
  position: absolute;
  top: 5px; left: 5px;
  width: 22px; height: 22px;
  padding: 0;
  border: none;
  background: none;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.fav.on { color: #e0484f; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35)); }
.sw-name { font-size: 12px; line-height: 1.25; color: var(--text-primary); }
.sw.active .sw-name { font-weight: 700; }
.sw-sub { font-size: 10px; color: var(--text-muted); margin-top: -3px; }
.rail-empty { font-size: 12px; color: var(--text-secondary); line-height: 1.5; text-align: center; padding: 8px 0; }

/* ---- room picker ---- */
.rooms-overlay {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: flex;
  justify-content: center;
  overflow-y: auto;
  padding: 20px 0;
}
.rooms-list { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.room-card {
  position: relative;
  width: 204px;
  border: 2px solid #1d1b1a;
  padding: 0;
  cursor: pointer;
  background: #fff;
  box-shadow: 0 8px 24px rgba(20, 17, 15, 0.3);
  transition: transform var(--transition);
}
.room-card:hover { transform: scale(1.03); }
.room-card.active { border-color: var(--accent); }
.room-thumb { display: block; aspect-ratio: 2 / 1; background-size: cover; background-position: center; }
.room-name {
  position: absolute;
  top: 6px; left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1d1b1a;
  white-space: nowrap;
}
.close-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  padding: 6px 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  border-radius: 4px;
}
.close-btn:hover { background: #fff; }

/* ---- selection summary ---- */
.info-card {
  position: absolute;
  right: 20px;
  bottom: 84px;
  z-index: 5;
  width: 300px;
  background: #fff;
  padding: 14px;
  box-shadow: 0 16px 40px rgba(20, 17, 15, 0.22);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.info-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.info-x { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; display: flex; }
.info-x:hover { color: var(--text-primary); }
.info-hint { font-size: 11px; color: var(--text-muted); line-height: 1.5; margin: 8px 0 10px; }
.send {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--text-primary);
  color: #fff;
  padding: 11px 16px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.send:hover { background: var(--accent); }

/* ---- bottom-right controls ---- */
.controls {
  position: absolute;
  right: 20px;
  bottom: 18px;
  z-index: 4;
  display: flex;
  gap: 14px;
}
.ctl {
  width: 46px; height: 46px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.95);
  background: rgba(20, 17, 15, 0.12);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35));
  transition: background var(--transition), color var(--transition);
}
.ctl:hover { background: rgba(255, 255, 255, 0.95); color: var(--text-primary); }
.ctl.on { background: #fff; color: var(--text-primary); }
.ctl-360 { font: inherit; font-size: 11px; font-weight: 700; letter-spacing: 0.02em; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ===== MOBILE ===== */
@media (max-width: 900px) {
  .design { padding-bottom: 32px; }
  .page-head { padding: 20px 20px 24px; }
  .crumbs { margin-bottom: 18px; }
  .intro { font-size: 14px; }
  .stage { margin: 0; height: 78vh; min-height: 520px; }

  .left { align-items: stretch; }
  .rail-head { width: auto; padding: 10px 12px; }
  .surface-title { padding-bottom: 8px; }
  .menu-btn { left: auto; right: 8px; top: 8px; }
  /* swatches become a strip along the bottom */
  /* the column spans the stage, so the rail sits at the bottom edge */
  .left { right: 0; }
  .rail-head { margin-right: 54px; }
  .rail {
    flex: 0 0 132px;
    margin-top: auto;
    width: auto;
    flex-direction: row;
  }
  .rail-label { display: none; }
  .rail-list { flex-direction: row; overflow-x: auto; overflow-y: hidden; padding: 10px; gap: 10px; }
  .sw { width: 76px; flex-shrink: 0; }
  .sw-name { font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rail-empty { white-space: normal; text-align: left; }
  .controls { bottom: 146px; right: 10px; gap: 8px; }
  .ctl { width: 38px; height: 38px; }
  .info-card { left: 10px; right: 10px; width: auto; bottom: 196px; }
}
</style>
