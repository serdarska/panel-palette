<script setup>
import { computed } from 'vue'
import { categories } from '../data/categories.js'
import { t } from '../i18n.js'

const cards = computed(() => categories.map((c, i) => ({
  key: c.key,
  num: String(i + 1).padStart(2, '0'),
  title: t(`categories.${c.key}`),
  desc: t(`categories.${c.key}Desc`),
  count: c.data.length,
  unit: t(c.kind === 'product' ? 'categories.models' : 'categories.decors'),
  covers: c.covers,
  product: c.kind === 'product',
})))
</script>

<template>
  <section id="catalog" class="catalog section-pad">
    <div class="section-container">
      <div class="section-header reveal">
        <span class="section-label">{{ t('categories.label') }}</span>
        <h2>{{ t('categories.title') }}</h2>
        <p>{{ t('categories.subtitle') }}</p>
      </div>

      <div class="cat-grid reveal">
        <RouterLink
          v-for="cat in cards"
          :key="cat.key"
          :to="{ name: 'category', params: { category: cat.key } }"
          :class="['tile', { product: cat.product }]"
        >
          <!-- material: one room photo filling the tile -->
          <div
            v-if="!cat.product"
            class="tile-photo"
            :style="{ backgroundImage: `url('${cat.covers[0]}')` }"
          ></div>
          <!-- product: a row of cut-out product shots -->
          <div v-else class="tile-products">
            <div
              v-for="img in cat.covers"
              :key="img"
              class="tile-product"
              :style="{ backgroundImage: `url('${img}')` }"
            ></div>
          </div>

          <span class="tile-count">
            {{ cat.count ? `${cat.count} ${cat.unit}` : t('categories.soon') }}
          </span>

          <div class="tile-body">
            <span class="tile-num">{{ cat.num }}</span>
            <h3 class="tile-title">{{ cat.title }}</h3>
            <p class="tile-desc">{{ cat.desc }}</p>
            <span class="tile-link">
              {{ t('categories.browse') }}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.catalog { background: var(--bg-primary); }

.cat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.tile {
  position: relative;
  height: 440px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  color: #fff;
  background: #2b2724;
}

.tile-photo {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 0.8s cubic-bezier(.2, .7, .2, 1);
}
.tile-photo::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(20, 17, 15, 0.85) 0%, rgba(20, 17, 15, 0.35) 45%, rgba(20, 17, 15, 0.05) 75%);
  transition: background 0.4s ease;
}
.tile:hover .tile-photo { transform: scale(1.05); }

.tile-count {
  position: absolute;
  top: 18px; left: 18px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 6px 10px;
  background: rgba(20, 17, 15, 0.55);
  color: #fff;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.tile-body {
  position: relative;
  padding: 28px;
  width: 100%;
}
.tile-num {
  display: block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--accent-dim);
  margin-bottom: 8px;
}
.tile-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.1;
  color: inherit;
  margin-bottom: 10px;
}
.tile-desc {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
  max-width: 340px;
  /* hidden until hover on desktop, so tiles stay calm */
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.4s ease, opacity 0.4s ease, margin 0.4s ease;
}
.tile:hover .tile-desc { max-height: 80px; opacity: 1; margin-bottom: 16px; }
.tile-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}
.tile-link svg { transition: transform var(--transition); }
.tile:hover .tile-link svg { transform: translateX(4px); }

/* Product tiles: light background, products in a row, dark text */
.tile.product {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.tile-products {
  position: absolute;
  inset: 48px 20px 150px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 8px;
}
.tile-product {
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  transition: transform 0.6s ease;
}
.tile.product:hover .tile-product { transform: translateY(-6px); }
.tile.product .tile-count { background: #fff; color: var(--text-primary); }
.tile.product .tile-num { color: var(--accent); }
.tile.product .tile-desc { color: var(--text-secondary); }
.tile.product .tile-link { border-top-color: var(--border-light); color: var(--accent); }

@media (max-width: 1000px) {
  .cat-grid { grid-template-columns: repeat(2, 1fr); }
  .tile { height: 380px; }
}
@media (max-width: 640px) {
  .cat-grid { grid-template-columns: 1fr; gap: 12px; }
  .tile { height: 340px; }
  .tile-body { padding: 22px 20px; }
  .tile-title { font-size: 21px; }
  /* no hover on touch screens: always show the description */
  .tile-desc { max-height: none; opacity: 1; margin-bottom: 14px; }
}
</style>
