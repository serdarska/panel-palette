<script setup>
import { ref, computed } from 'vue'
import { store } from '../store.js'
import { materialMeta } from '../data/materials.js'

const activeTab = ref('countertop')
const tabs = [
  { key: 'countertop', label: 'Counter Tops' },
  { key: 'mdf', label: 'MDF Fronts' },
  { key: 'chipboard', label: 'Decorative Boards' },
]

const current = computed(() => materialMeta[activeTab.value])

function apply(swatch) {
  store[activeTab.value] = swatch
  store.activeMaterial = activeTab.value
  document.getElementById('visualizer')?.scrollIntoView({ behavior: 'smooth' })
}

function isSelected(swatch) {
  return store[activeTab.value]?.code === swatch.code
}
</script>

<template>
  <section id="catalog" class="catalog section-pad">
    <div class="section-container">
      <div class="section-header reveal">
        <span class="section-label">Material Catalog</span>
        <h2>Choose Your Materials</h2>
        <p>Browse our curated selection across three categories. Click any color to apply it to your kitchen design.</p>
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
        >
          <div
            class="swatch-color"
            :style="swatch.image ? { backgroundImage: `url('${swatch.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: swatch.color }"
            @click="apply(swatch)"
          >
            <!-- Text overlay at bottom -->
            <div class="swatch-info">
              <span class="swatch-name">{{ swatch.name }}</span>
              <span class="swatch-code">{{ swatch.code }}</span>
            </div>
            <!-- Hover overlay -->
            <div class="swatch-overlay">
              <button class="apply-btn">
                Apply to Design
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <!-- Selected badge -->
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

/* Text gradient at bottom */
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
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition);
  z-index: 2;
}
.swatch-card:hover .swatch-overlay { opacity: 1; }

.apply-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--accent);
  color: #000;
  border: none;
  padding: 9px 16px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.03em;
  transition: background var(--transition);
  white-space: nowrap;
}
.apply-btn:hover { background: var(--accent-light); }

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
</style>