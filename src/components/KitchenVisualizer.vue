<script setup>
import { computed } from 'vue'
import { store } from '../store.js'
import { countertops, mdfColors, chipboardColors } from '../data/materials.js'

const tabs = [
  { key: 'countertop', label: 'Counter Top', hint: 'Surface slab' },
  { key: 'mdf', label: 'Cabinet Fronts', hint: 'Doors & drawers' },
  { key: 'chipboard', label: 'Decorative Board', hint: 'Cabinet boxes' },
]

const swatchMap = { countertop: countertops, mdf: mdfColors, chipboard: chipboardColors }
const swatches = computed(() => swatchMap[store.activeMaterial])
const current = computed(() => store[store.activeMaterial])

function selectMaterial(key) { store.activeMaterial = key }
function selectColor(swatch) { store[store.activeMaterial] = swatch }
function isActive(swatch) { return current.value?.code === swatch.code }

function darken(hex, amount = 28) {
  if (!hex || hex[0] !== '#' || hex.length < 7) return hex
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount)
  return `rgb(${r},${g},${b})`
}

const isMdf = computed(() => store.activeMaterial === 'mdf')
const isCounter = computed(() => store.activeMaterial === 'countertop')
const isChip = computed(() => store.activeMaterial === 'chipboard')

const goldStroke = '#c9a84c'
const noStroke = 'none'

const doorStroke = computed(() => isMdf.value ? goldStroke : noStroke)
const counterStroke = computed(() => isCounter.value ? goldStroke : noStroke)
const carcassStroke = computed(() => isChip.value ? goldStroke : noStroke)

// Use image pattern URL when image exists, otherwise fall back to flat color
const mdfFill = computed(() => store.mdf.image ? 'url(#patternMdf)' : store.mdf.color)
const counterFill = computed(() => store.countertop.image ? 'url(#patternCountertop)' : store.countertop.color)
const chipFill = computed(() => store.chipboard.image ? 'url(#patternChipboard)' : store.chipboard.color)
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
            <div class="cur-dot" :style="current.image ? { backgroundImage: `url('${current.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: current.color }"></div>
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
              :style="sw.image ? { backgroundImage: `url('${sw.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: sw.color }"
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
              <span class="sum-dot" :style="store.countertop.image ? { backgroundImage: `url('${store.countertop.image}')`, backgroundSize: 'cover' } : { background: store.countertop.color }"></span>
              <span class="sum-text">{{ store.countertop.name }}</span>
            </div>
            <div class="sum-item">
              <span class="sum-dot" :style="store.mdf.image ? { backgroundImage: `url('${store.mdf.image}')`, backgroundSize: 'cover' } : { background: store.mdf.color }"></span>
              <span class="sum-text">{{ store.mdf.name }}</span>
            </div>
            <div class="sum-item">
              <span class="sum-dot" :style="store.chipboard.image ? { backgroundImage: `url('${store.chipboard.image}')`, backgroundSize: 'cover' } : { background: store.chipboard.color }"></span>
              <span class="sum-text">{{ store.chipboard.name }}</span>
            </div>
          </div>
        </div>

        <!-- Kitchen SVG -->
        <div class="kitchen-wrap">
          <svg viewBox="0 0 800 460" xmlns="http://www.w3.org/2000/svg" class="kitchen-svg">
            <defs>
              <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2a2a2a"/>
                <stop offset="100%" stop-color="#1c1c1c"/>
              </linearGradient>
              <linearGradient id="doorSheen" x1="0" y1="0" x2="0.25" y2="1">
                <stop offset="0%" stop-color="white" stop-opacity="0.13"/>
                <stop offset="55%" stop-color="white" stop-opacity="0.02"/>
                <stop offset="100%" stop-color="black" stop-opacity="0.1"/>
              </linearGradient>
              <linearGradient id="counterSheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="white" stop-opacity="0.18"/>
                <stop offset="100%" stop-color="black" stop-opacity="0.14"/>
              </linearGradient>
              <filter id="cabShadow" x="-8%" y="-8%" width="120%" height="125%">
                <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#000" flood-opacity="0.55"/>
              </filter>
              <!-- Material texture patterns -->
              <pattern id="patternCountertop" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
                <rect width="400" height="400" :fill="counterFill"/>
                <image v-if="store.countertop.image" :href="store.countertop.image" x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice"/>
              </pattern>
              <pattern id="patternMdf" x="0" y="0" width="200" height="300" patternUnits="userSpaceOnUse">
                <rect width="200" height="300" :fill="mdfFill"/>
                <image v-if="store.mdf.image" :href="store.mdf.image" x="0" y="0" width="200" height="300" preserveAspectRatio="xMidYMid slice"/>
              </pattern>
              <pattern id="patternChipboard" x="0" y="0" width="300" height="200" patternUnits="userSpaceOnUse">
                <rect width="300" height="200" :fill="chipFill"/>
                <image v-if="store.chipboard.image" :href="store.chipboard.image" x="0" y="0" width="300" height="200" preserveAspectRatio="xMidYMid slice"/>
              </pattern>
            </defs>

            <!-- Wall -->
            <rect x="0" y="0" width="800" height="460" fill="url(#wallGrad)"/>
            <!-- Floor -->
            <rect x="0" y="432" width="800" height="28" fill="#101010"/>
            <!-- Floor line -->
            <line x1="0" y1="432" x2="800" y2="432" stroke="#1e1e1e" stroke-width="1"/>

            <!-- Backsplash tiles -->
            <rect x="20" y="210" width="760" height="40" fill="#222"/>
            <line x1="20" y1="221" x2="780" y2="221" stroke="#1a1a1a" stroke-width="1"/>
            <line x1="20" y1="232" x2="780" y2="232" stroke="#2e2e2e" stroke-width="0.5"/>
            <line x1="20" y1="243" x2="780" y2="243" stroke="#1a1a1a" stroke-width="1"/>
            <line x1="80"  y1="210" x2="80"  y2="250" stroke="#1a1a1a" stroke-width="0.5"/>
            <line x1="140" y1="210" x2="140" y2="250" stroke="#2e2e2e" stroke-width="0.5"/>
            <line x1="200" y1="210" x2="200" y2="250" stroke="#1a1a1a" stroke-width="0.5"/>
            <line x1="260" y1="210" x2="260" y2="250" stroke="#2e2e2e" stroke-width="0.5"/>
            <line x1="540" y1="210" x2="540" y2="250" stroke="#1a1a1a" stroke-width="0.5"/>
            <line x1="600" y1="210" x2="600" y2="250" stroke="#2e2e2e" stroke-width="0.5"/>
            <line x1="660" y1="210" x2="660" y2="250" stroke="#1a1a1a" stroke-width="0.5"/>
            <line x1="720" y1="210" x2="720" y2="250" stroke="#2e2e2e" stroke-width="0.5"/>

            <!-- ===== UPPER LEFT CARCASS ===== -->
            <rect
              :fill="chipFill"
              :stroke="carcassStroke" stroke-width="1.5"
              x="20" y="15" width="280" height="195" rx="2"
              filter="url(#cabShadow)"
              style="cursor:pointer"
              @click="selectMaterial('chipboard')"
            />

            <!-- Upper left doors -->
            <rect :fill="mdfFill" :stroke="doorStroke" stroke-width="1.5"
                  x="27" y="21" width="82" height="182" rx="2"
                  class="zone-door" @click="selectMaterial('mdf')"/>
            <rect x="27" y="21" width="82" height="182" rx="2" fill="url(#doorSheen)" style="pointer-events:none"/>

            <rect :fill="mdfFill" :stroke="doorStroke" stroke-width="1.5"
                  x="116" y="21" width="82" height="182" rx="2"
                  class="zone-door" @click="selectMaterial('mdf')"/>
            <rect x="116" y="21" width="82" height="182" rx="2" fill="url(#doorSheen)" style="pointer-events:none"/>

            <rect :fill="mdfFill" :stroke="doorStroke" stroke-width="1.5"
                  x="205" y="21" width="82" height="182" rx="2"
                  class="zone-door" @click="selectMaterial('mdf')"/>
            <rect x="205" y="21" width="82" height="182" rx="2" fill="url(#doorSheen)" style="pointer-events:none"/>

            <!-- Upper left handles -->
            <rect x="56"  y="196" width="24" height="4" rx="2" fill="#b8b8b8" style="pointer-events:none"/>
            <rect x="145" y="196" width="24" height="4" rx="2" fill="#b8b8b8" style="pointer-events:none"/>
            <rect x="234" y="196" width="24" height="4" rx="2" fill="#b8b8b8" style="pointer-events:none"/>

            <!-- ===== RANGE HOOD ===== -->
            <!-- Chimney -->
            <rect x="367" y="0" width="66" height="20" fill="#161616" rx="1"/>
            <!-- Canopy trapezoid -->
            <polygon points="300,20 500,20 478,210 322,210" fill="#1c1c1c"/>
            <!-- Hood accent line -->
            <line x1="322" y1="185" x2="478" y2="185" stroke="#2a2a2a" stroke-width="1"/>
            <!-- Vent grille lines -->
            <line x1="340" y1="148" x2="460" y2="148" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/>
            <line x1="340" y1="158" x2="460" y2="158" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/>
            <line x1="340" y1="168" x2="460" y2="168" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/>
            <!-- Hood bottom light strip -->
            <rect x="325" y="188" width="150" height="10" rx="3" fill="#131305" opacity="0.9"/>
            <rect x="328" y="190" width="144" height="5" rx="2" fill="#3a3a10" opacity="0.7"/>

            <!-- ===== UPPER RIGHT CARCASS ===== -->
            <rect
              :fill="chipFill"
              :stroke="carcassStroke" stroke-width="1.5"
              x="500" y="15" width="280" height="195" rx="2"
              filter="url(#cabShadow)"
              style="cursor:pointer"
              @click="selectMaterial('chipboard')"
            />

            <!-- Upper right doors -->
            <rect :fill="mdfFill" :stroke="doorStroke" stroke-width="1.5"
                  x="507" y="21" width="82" height="182" rx="2"
                  class="zone-door" @click="selectMaterial('mdf')"/>
            <rect x="507" y="21" width="82" height="182" rx="2" fill="url(#doorSheen)" style="pointer-events:none"/>

            <rect :fill="mdfFill" :stroke="doorStroke" stroke-width="1.5"
                  x="596" y="21" width="82" height="182" rx="2"
                  class="zone-door" @click="selectMaterial('mdf')"/>
            <rect x="596" y="21" width="82" height="182" rx="2" fill="url(#doorSheen)" style="pointer-events:none"/>

            <rect :fill="mdfFill" :stroke="doorStroke" stroke-width="1.5"
                  x="685" y="21" width="82" height="182" rx="2"
                  class="zone-door" @click="selectMaterial('mdf')"/>
            <rect x="685" y="21" width="82" height="182" rx="2" fill="url(#doorSheen)" style="pointer-events:none"/>

            <!-- Upper right handles -->
            <rect x="536" y="196" width="24" height="4" rx="2" fill="#b8b8b8" style="pointer-events:none"/>
            <rect x="625" y="196" width="24" height="4" rx="2" fill="#b8b8b8" style="pointer-events:none"/>
            <rect x="714" y="196" width="24" height="4" rx="2" fill="#b8b8b8" style="pointer-events:none"/>

            <!-- ===== COUNTERTOP ===== -->
            <rect
              :fill="counterFill"
              :stroke="counterStroke" stroke-width="1.5"
              x="20" y="210" width="760" height="40" rx="1"
              class="zone-counter"
              @click="selectMaterial('countertop')"
            />
            <rect x="20" y="210" width="760" height="40" rx="1" fill="url(#counterSheen)" style="pointer-events:none"/>
            <!-- Counter front edge -->
            <rect :fill="darken(store.countertop.color)" x="20" y="247" width="760" height="5" rx="0" style="pointer-events:none"/>

            <!-- Sink basin (sits on counter) -->
            <rect x="323" y="217" width="154" height="28" rx="3" fill="#111" style="pointer-events:none"/>
            <rect x="326" y="220" width="148" height="22" rx="2" fill="#0a0a0a" style="pointer-events:none"/>
            <!-- Faucet neck -->
            <rect x="395" y="207" width="10" height="16" rx="3" fill="#999" style="pointer-events:none"/>
            <!-- Faucet spout -->
            <path d="M395 210 Q395 204 404 204 L412 204" stroke="#aaa" stroke-width="3" fill="none" stroke-linecap="round" style="pointer-events:none"/>

            <!-- ===== LOWER LEFT CARCASS ===== -->
            <rect
              :fill="chipFill"
              :stroke="carcassStroke" stroke-width="1.5"
              x="20" y="250" width="280" height="175" rx="2"
              style="cursor:pointer"
              @click="selectMaterial('chipboard')"
            />

            <!-- Lower left drawer -->
            <rect :fill="mdfFill" :stroke="doorStroke" stroke-width="1.5"
                  x="27" y="256" width="266" height="38" rx="2"
                  class="zone-door" @click="selectMaterial('mdf')"/>
            <rect x="27" y="256" width="266" height="38" rx="2" fill="url(#doorSheen)" style="pointer-events:none"/>
            <rect x="148" y="272" width="24" height="4" rx="2" fill="#b8b8b8" style="pointer-events:none"/>

            <!-- Lower left doors -->
            <rect :fill="mdfFill" :stroke="doorStroke" stroke-width="1.5"
                  x="27" y="300" width="129" height="119" rx="2"
                  class="zone-door" @click="selectMaterial('mdf')"/>
            <rect x="27" y="300" width="129" height="119" rx="2" fill="url(#doorSheen)" style="pointer-events:none"/>

            <rect :fill="mdfFill" :stroke="doorStroke" stroke-width="1.5"
                  x="162" y="300" width="131" height="119" rx="2"
                  class="zone-door" @click="selectMaterial('mdf')"/>
            <rect x="162" y="300" width="131" height="119" rx="2" fill="url(#doorSheen)" style="pointer-events:none"/>

            <!-- Lower left door handles -->
            <rect x="79"  y="306" width="24" height="4" rx="2" fill="#b8b8b8" style="pointer-events:none"/>
            <rect x="215" y="306" width="24" height="4" rx="2" fill="#b8b8b8" style="pointer-events:none"/>

            <!-- ===== SINK CARCASS ===== -->
            <rect
              :fill="chipFill"
              :stroke="carcassStroke" stroke-width="1.5"
              x="300" y="250" width="200" height="175" rx="2"
              style="cursor:pointer"
              @click="selectMaterial('chipboard')"
            />

            <!-- Sink door -->
            <rect :fill="mdfFill" :stroke="doorStroke" stroke-width="1.5"
                  x="307" y="256" width="186" height="163" rx="2"
                  class="zone-door" @click="selectMaterial('mdf')"/>
            <rect x="307" y="256" width="186" height="163" rx="2" fill="url(#doorSheen)" style="pointer-events:none"/>
            <rect x="388" y="262" width="24" height="4" rx="2" fill="#b8b8b8" style="pointer-events:none"/>

            <!-- ===== LOWER RIGHT CARCASS ===== -->
            <rect
              :fill="chipFill"
              :stroke="carcassStroke" stroke-width="1.5"
              x="500" y="250" width="280" height="175" rx="2"
              style="cursor:pointer"
              @click="selectMaterial('chipboard')"
            />

            <!-- Lower right drawer -->
            <rect :fill="mdfFill" :stroke="doorStroke" stroke-width="1.5"
                  x="507" y="256" width="266" height="38" rx="2"
                  class="zone-door" @click="selectMaterial('mdf')"/>
            <rect x="507" y="256" width="266" height="38" rx="2" fill="url(#doorSheen)" style="pointer-events:none"/>
            <rect x="628" y="272" width="24" height="4" rx="2" fill="#b8b8b8" style="pointer-events:none"/>

            <!-- Lower right doors -->
            <rect :fill="mdfFill" :stroke="doorStroke" stroke-width="1.5"
                  x="507" y="300" width="129" height="119" rx="2"
                  class="zone-door" @click="selectMaterial('mdf')"/>
            <rect x="507" y="300" width="129" height="119" rx="2" fill="url(#doorSheen)" style="pointer-events:none"/>

            <rect :fill="mdfFill" :stroke="doorStroke" stroke-width="1.5"
                  x="642" y="300" width="131" height="119" rx="2"
                  class="zone-door" @click="selectMaterial('mdf')"/>
            <rect x="642" y="300" width="131" height="119" rx="2" fill="url(#doorSheen)" style="pointer-events:none"/>

            <!-- Lower right door handles -->
            <rect x="559" y="306" width="24" height="4" rx="2" fill="#b8b8b8" style="pointer-events:none"/>
            <rect x="695" y="306" width="24" height="4" rx="2" fill="#b8b8b8" style="pointer-events:none"/>

            <!-- ===== KICKBOARD ===== -->
            <rect :fill="darken(store.chipboard.color, 40)" x="20" y="425" width="760" height="10" rx="1" style="pointer-events:none"/>
          </svg>

          <div class="kitchen-hint">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#888" stroke-width="1.2"/>
              <path d="M7 6v4M7 4.5v.5" stroke="#888" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            Click any cabinet or surface to switch material
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
.ptab-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.ptab-hint {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}
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
.sum-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sum-dot {
  width: 16px; height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}
.sum-text {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Kitchen canvas */
.kitchen-wrap {
  background: #1a1a1a;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  padding: 24px;
}
.kitchen-svg {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius);
}
.zone-door { cursor: pointer; transition: filter 0.2s; }
.zone-door:hover { filter: brightness(1.12); }
.zone-counter { cursor: pointer; transition: filter 0.2s; }
.zone-counter:hover { filter: brightness(1.08); }

.kitchen-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 14px;
  justify-content: center;
}
</style>