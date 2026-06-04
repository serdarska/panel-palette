<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { store } from '../store.js'
import { sinks, faucets } from '../data/materials.js'

const popup = ref(null)
// track whether popup is for a sink or faucet
const popupCategory = ref('')

function open(item, category) {
  popup.value = item
  popupCategory.value = category
  document.body.style.overflow = 'hidden'
}

function close() {
  popup.value = null
  document.body.style.overflow = ''
}

function apply(item) {
  if (popupCategory.value === 'sink') {
    store.sink = item
    store.activeMaterial = 'sink'
    close()
    document.getElementById('visualizer')?.scrollIntoView({ behavior: 'smooth' })
  } else {
    close()
  }
}

function isSinkSelected(sink) { return store.sink?.code === sink.code }

function onKey(e) { if (e.key === 'Escape') close() }

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

const dim = (val) => val != null ? `${val} mm` : '—'

const finishLabel = (color) => {
  if (color.includes('1c1a')) return 'Black'
  if (color.includes('f4f0')) return 'White'
  if (color.includes('7a78')) return 'Gray'
  if (color.includes('8c78')) return 'Dark Beige'
  if (color.includes('c8b8')) return 'Beige'
  return 'Gray Granit'
}
</script>

<template>
  <section id="accessories" class="accessories section-pad">
    <div class="section-container">

      <!-- ── Sinks ── -->
      <div class="section-header reveal">
        <span class="section-label">Accessories</span>
        <h2>Sink Collection</h2>
        <p>Premium granite composite sinks by Sadoperi — available in multiple models and finishes. Click any model to view details.</p>
      </div>

      <div class="acc-grid reveal">
        <div
          v-for="sink in sinks"
          :key="sink.code"
          :class="['acc-card', { selected: isSinkSelected(sink) }]"
          @click="open(sink, 'sink')"
        >
          <div class="acc-img" :style="{ backgroundImage: `url('${sink.image}')` }">
            <div class="acc-overlay">
              <span class="view-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="white" stroke-width="1.4"/>
                  <circle cx="8" cy="8" r="2" stroke="white" stroke-width="1.4"/>
                </svg>
                View details
              </span>
            </div>
            <div v-if="isSinkSelected(sink)" class="selected-badge">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7L5.5 10L11.5 4" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
          <div class="acc-meta">
            <span class="acc-dot" :style="{ background: sink.color }"/>
            <div class="acc-text">
              <span class="acc-name">{{ sink.name }}</span>
              <span class="acc-code">{{ sink.code }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Faucets ── -->
      <div class="section-header section-header--sub reveal">
        <h2>Faucet Collection</h2>
        <p>Kitchen mixer taps by Son Donna — available in multiple styles and finishes.</p>
      </div>

      <div class="acc-grid reveal">
        <div
          v-for="faucet in faucets"
          :key="faucet.code"
          class="acc-card"
          @click="open(faucet, 'faucet')"
        >
          <div class="acc-img" :style="{ backgroundImage: `url('${faucet.image}')` }">
            <div class="acc-overlay">
              <span class="view-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="white" stroke-width="1.4"/>
                  <circle cx="8" cy="8" r="2" stroke="white" stroke-width="1.4"/>
                </svg>
                View details
              </span>
            </div>
          </div>
          <div class="acc-meta">
            <span class="acc-dot" :style="{ background: faucet.color }"/>
            <div class="acc-text">
              <span class="acc-name">{{ faucet.name }}</span>
              <span class="acc-code">{{ faucet.code }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="popup" class="modal-overlay" @click.self="close">
        <div class="modal">
          <button class="modal-close" @click="close" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- Image -->
          <div class="modal-img" :style="{ backgroundImage: `url('${popup.image}')` }"/>

          <!-- Info -->
          <div class="modal-info">
            <span class="modal-label">{{ popupCategory === 'sink' ? 'Sadoperi · Sink' : 'Cesmi · Faucet' }}</span>
            <h3 class="modal-name">{{ popup.name }}</h3>
            <span class="modal-code">{{ popup.code }}</span>

            <!-- Color -->
            <div class="modal-color-row">
              <span class="modal-color-dot" :style="{ background: popup.color }"/>
              <span class="modal-color-label">{{ finishLabel(popup.color) }}</span>
            </div>

            <div class="modal-divider"/>

            <!-- Dimensions -->
            <p class="modal-section-title">Dimensions</p>
            <div class="modal-dims">
              <template v-if="popup.dimensions.diameter != null">
                <div class="dim-row">
                  <span class="dim-label">Diameter</span>
                  <span class="dim-val">Ф{{ popup.dimensions.diameter }} mm</span>
                </div>
              </template>
              <template v-else>
                <div class="dim-row">
                  <span class="dim-label">Length</span>
                  <span class="dim-val">{{ dim(popup.dimensions.length) }}</span>
                </div>
                <div class="dim-row">
                  <span class="dim-label">Width</span>
                  <span class="dim-val">{{ dim(popup.dimensions.width) }}</span>
                </div>
              </template>
              <div class="dim-row">
                <span class="dim-label">{{ popupCategory === 'faucet' ? 'Height' : 'Depth' }}</span>
                <span class="dim-val">{{ popupCategory === 'faucet' ? dim(popup.dimensions.height) : dim(popup.dimensions.depth) }}</span>
              </div>
            </div>

            <div class="modal-actions">
              <button v-if="popupCategory === 'sink'" class="modal-apply" @click="apply(popup)">
                Apply to Design
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button class="modal-cancel" @click="close">Close</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.accessories {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
}

/* Sub-header spacing for faucets section */
.section-header--sub {
  margin-top: 72px;
}

/* Shared grid */
.acc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.acc-card {
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-card);
  cursor: pointer;
  transition: all var(--transition);
}
.acc-card:hover {
  border-color: var(--border-light);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.4);
}
.acc-card.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}

.acc-img {
  height: 200px;
  background-size: cover;
  background-position: center;
  background-color: var(--bg-primary);
  position: relative;
  overflow: hidden;
}
.acc-img::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%);
  pointer-events: none;
}

.acc-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition);
  z-index: 2;
}
.acc-card:hover .acc-overlay { opacity: 1; }

.view-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.25);
  padding: 8px 16px;
  border-radius: 100px;
}

.selected-badge {
  position: absolute;
  top: 10px; right: 10px;
  width: 26px; height: 26px;
  background: var(--accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.acc-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}
.acc-dot {
  width: 20px; height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.12);
}
.acc-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.acc-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.acc-code {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.82);
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
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  display: grid;
  grid-template-columns: 1fr 360px;
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 32px 80px rgba(0,0,0,0.7);
}

.modal-close {
  position: absolute;
  top: 16px; right: 16px;
  width: 36px; height: 36px;
  background: rgba(0,0,0,0.5);
  border: 1px solid var(--border-light);
  border-radius: 50%;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all var(--transition);
}
.modal-close:hover { background: var(--bg-card-hover); color: var(--text-primary); }

.modal-img {
  background-size: cover;
  background-position: center;
  background-color: var(--bg-primary);
  min-height: 420px;
}

.modal-info {
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.modal-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 14px;
  display: block;
}

.modal-name {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.modal-code {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  font-weight: 500;
  display: block;
  margin-bottom: 20px;
}

.modal-color-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}
.modal-color-dot {
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
}
.modal-color-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.modal-divider {
  height: 1px;
  background: var(--border);
  margin-bottom: 24px;
}

.modal-section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 14px;
}

.modal-dims {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.dim-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 16px;
  border-bottom: 1px solid var(--border);
}
.dim-row:last-child { border-bottom: none; }
.dim-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}
.dim-val {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.03em;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
}

.modal-apply {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--accent);
  color: #000;
  border: none;
  padding: 14px 24px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.03em;
  transition: all var(--transition);
  width: 100%;
}
.modal-apply:hover { background: var(--accent-light); transform: translateY(-1px); }

.modal-cancel {
  background: transparent;
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  padding: 12px 24px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
  width: 100%;
}
.modal-cancel:hover { border-color: var(--text-muted); color: var(--text-primary); }

/* Transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: opacity 0.25s ease, transform 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { opacity: 0; transform: scale(0.95) translateY(16px); }

@media (max-width: 768px) {
  .acc-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .acc-img { height: 160px; }
  .section-header--sub { margin-top: 48px; }

  .modal-overlay { padding: 0; align-items: flex-end; }
  .modal {
    grid-template-columns: 1fr;
    grid-template-rows: 240px 1fr;
    max-height: 92vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
  .modal-img { min-height: unset; height: 240px; }
  .modal-info { padding: 24px 20px; }
  .modal-name { font-size: 22px; }
}
</style>