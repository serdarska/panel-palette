<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { store } from '../store.js'
import { materialMeta } from '../data/materials.js'

const activeTab = ref('countertop')
const tabs = [
  { key: 'countertop', label: 'Counter Tops' },
  { key: 'mdf', label: 'MDF Fronts' },
  { key: 'chipboard', label: 'Decorative Boards' },
]

const current = computed(() => materialMeta[activeTab.value])
const popupSwatch = ref(null)

function openPopup(swatch) {
  popupSwatch.value = swatch
  document.body.style.overflow = 'hidden'
}

function closePopup() {
  popupSwatch.value = null
  document.body.style.overflow = ''
}

function apply(swatch) {
  store[activeTab.value] = swatch
  store.activeMaterial = activeTab.value
  closePopup()
  document.getElementById('visualizer')?.scrollIntoView({ behavior: 'smooth' })
}

function isSelected(swatch) {
  return store[activeTab.value]?.code === swatch.code
}

function onKey(e) {
  if (e.key === 'Escape') closePopup()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <section id="catalog" class="catalog section-pad">
    <div class="section-container">
      <div class="section-header reveal">
        <span class="section-label">Material Catalog</span>
        <h2>Choose Your Materials</h2>
        <p>Browse our curated selection across three categories. Click any material to preview it up close.</p>
      </div>

      <div class="tabs reveal">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span class="tab-count">{{ materialMeta[tab.key].data.length }}</span>
        </button>
      </div>

      <div class="cat-desc reveal">
        <p>{{ current.description }}</p>
      </div>

      <div class="swatch-grid reveal">
        <div
          v-for="swatch in current.data"
          :key="swatch.code"
          :class="['swatch-card', { selected: isSelected(swatch) }]"
          @click="openPopup(swatch)"
        >
          <div
            class="swatch-color"
            :style="swatch.image ? { backgroundImage: `url('${swatch.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: swatch.color }"
          >
            <div class="swatch-info">
              <span class="swatch-name">{{ activeTab === 'countertop' ? swatch.code : (swatch.name || swatch.code) }}</span>
              <span v-if="activeTab !== 'countertop' && swatch.name" class="swatch-code">{{ swatch.code }}</span>
            </div>
            <div class="swatch-overlay">
              <span class="preview-hint">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="white" stroke-width="1.4"/>
                  <circle cx="8" cy="8" r="2" stroke="white" stroke-width="1.4"/>
                </svg>
                Preview
              </span>
            </div>
            <div v-if="isSelected(swatch)" class="selected-badge">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7L5.5 10L11.5 4" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Modal popup -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="popupSwatch" class="modal-overlay" @click.self="closePopup">
        <div class="modal">
          <!-- Close button -->
          <button class="modal-close" @click="closePopup">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- Left: full image -->
          <div
            class="modal-image"
            :style="popupSwatch.image
              ? { backgroundImage: `url('${popupSwatch.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: popupSwatch.color }"
          ></div>

          <!-- Right: info -->
          <div class="modal-info">
            <span class="modal-category">{{ current.label }}</span>
            <h3 class="modal-name">{{ activeTab === 'countertop' ? popupSwatch.code : (popupSwatch.name || popupSwatch.code) }}</h3>
            <span v-if="activeTab !== 'countertop' && popupSwatch.name" class="modal-code">{{ popupSwatch.code }}</span>

            <div class="modal-divider"></div>

            <p class="modal-desc">{{ current.description }}</p>

            <div class="modal-actions">
              <button class="modal-apply" @click="apply(popupSwatch)">
                Apply to Design
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button class="modal-cancel" @click="closePopup">Close</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.catalog {
  background: var(--bg-primary);
  border-top: 1px solid var(--border);
}

.tabs {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 32px;
}
.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 12px 24px;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
  letter-spacing: 0.02em;
}
.tab:hover { border-color: var(--border-light); color: var(--text-primary); }
.tab.active {
  background: var(--accent);
  color: #000;
  border-color: var(--accent);
  font-weight: 600;
}
.tab-count {
  font-size: 11px;
  font-weight: 700;
  background: rgba(0,0,0,0.15);
  border-radius: 100px;
  padding: 2px 7px;
}
.tab.active .tab-count { background: rgba(0,0,0,0.2); }

.cat-desc {
  text-align: center;
  margin-bottom: 48px;
}
.cat-desc p {
  font-size: 15px;
  color: var(--text-secondary);
  max-width: 560px;
  margin: 0 auto;
  line-height: 1.7;
}

.swatch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.swatch-card {
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  transition: all var(--transition);
  cursor: pointer;
}
.swatch-card:hover { border-color: var(--border-light); transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
.swatch-card.selected { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }

.swatch-color {
  height: 180px;
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
}
.swatch-color::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 50%, transparent 100%);
  pointer-events: none;
}

.swatch-info {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 1;
}
.swatch-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.swatch-code {
  font-size: 11px;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.05em;
  font-weight: 500;
}

.swatch-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition);
  z-index: 2;
}
.swatch-card:hover .swatch-overlay { opacity: 1; }
.preview-hint {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
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

/* ===== MODAL ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
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
  grid-template-columns: 1fr 380px;
  width: 100%;
  max-width: 860px;
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

.modal-image {
  min-height: 420px;
  background-size: cover;
  background-position: center;
}

.modal-info {
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  overflow-y: auto;
}

.modal-category {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 14px;
  display: block;
}

.modal-name {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.modal-code {
  font-size: 13px;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  font-weight: 500;
  display: block;
  margin-bottom: 28px;
}

.modal-divider {
  height: 1px;
  background: var(--border);
  margin-bottom: 24px;
}

.modal-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.75;
  margin-bottom: 36px;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .modal, .modal-leave-active .modal {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal, .modal-leave-to .modal {
  opacity: 0;
  transform: scale(0.95) translateY(16px);
}

@media (max-width: 768px) {
  .tabs { flex-wrap: wrap; gap: 8px; justify-content: center; }
  .tab { padding: 10px 16px; font-size: 13px; }
  .swatch-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
  .swatch-color { height: 140px; }

  .modal-overlay { padding: 0; align-items: flex-end; }
  .modal {
    grid-template-columns: 1fr;
    grid-template-rows: 260px 1fr;
    max-height: 92vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
  .modal-image { min-height: unset; height: 260px; }
  .modal-info { padding: 24px 20px; }
  .modal-name { font-size: 22px; }
}
</style>