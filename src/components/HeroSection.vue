<script setup>
import { ref, onMounted } from 'vue'
import { t } from '../i18n.js'

const visible = ref(false)
onMounted(() => setTimeout(() => visible.value = true, 80))

function go(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

const heroImage = '/gallery/kitchen-antrasit-wood.jpg'
</script>

<template>
  <section id="home" class="hero">
    <div class="hero-photo" :style="{ backgroundImage: `url('${heroImage}')` }">
      <div class="hero-shade"></div>

      <div :class="['hero-inner', { visible }]">
        <div class="hero-main">
          <span class="eyebrow">{{ t('hero.badge') }}</span>
          <h1>{{ t('hero.title1') }}<br>{{ t('hero.title2') }}</h1>
        </div>

        <div class="hero-side">
          <p class="hero-sub">{{ t('hero.subtitle') }}</p>
          <div class="hero-actions">
            <button class="btn-light" @click="go('catalog')">
              {{ t('hero.exploreMaterials') }}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="btn-line" @click="$router.push({ name: 'design' })">{{ t('hero.designKitchen') }}</button>
          </div>
        </div>
      </div>

      <button class="scroll-down" @click="go('catalog')">
        <span class="scroll-icon">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M2 8l5 5 5-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        {{ t('hero.scroll') }}
      </button>
    </div>

    <div class="hero-stats">
      <div class="stat">
        <span class="stat-n">100+</span>
        <span class="stat-l">{{ t('hero.statColors') }}</span>
      </div>
      <div class="stat">
        <span class="stat-n">15+</span>
        <span class="stat-l">{{ t('hero.statYears') }}</span>
      </div>
      <div class="stat">
        <span class="stat-n">500+</span>
        <span class="stat-l">{{ t('hero.statKitchens') }}</span>
      </div>
      <div class="stat">
        <span class="stat-n">360°</span>
        <span class="stat-l">{{ t('design.label') }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  /* the photo starts under the navbar, which is transparent over white at the top */
  padding-top: 86px;
  background: var(--bg-primary);
}

.hero-photo {
  position: relative;
  height: calc(100vh - 86px - 112px);
  min-height: 560px;
  max-height: 860px;
  background-size: cover;
  background-position: center 62%;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.hero-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, rgba(20, 17, 15, 0.82) 0%, rgba(20, 17, 15, 0.35) 45%, rgba(20, 17, 15, 0.1) 100%);
}

.hero-inner {
  position: relative;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 48px 96px;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 64px;
  align-items: end;
  color: #fff;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.9s ease, transform 0.9s ease;
}
.hero-inner.visible { opacity: 1; transform: translateY(0); }

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 22px;
}
.eyebrow::before {
  content: '';
  width: 10px; height: 10px;
  background: var(--accent-light);
}

h1 {
  font-family: var(--font-display);
  font-size: clamp(38px, 4.6vw, 66px);
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.04;
  text-transform: uppercase;
  color: #fff;
}

.hero-sub {
  font-size: 16px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 28px;
}

.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }

.btn-light, .btn-line {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all var(--transition);
}
.btn-light {
  background: #fff;
  color: var(--text-primary);
  border: 1px solid #fff;
}
.btn-light svg { transition: transform var(--transition); }
.btn-light:hover { background: transparent; color: #fff; }
.btn-light:hover svg { transform: translateX(3px); }
.btn-line {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.55);
}
.btn-line:hover { border-color: #fff; background: rgba(255, 255, 255, 0.1); }

.scroll-down {
  position: absolute;
  left: 48px;
  bottom: 28px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.75);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
}
.scroll-icon {
  width: 32px; height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition);
}
.scroll-down:hover { color: #fff; }
.scroll-down:hover .scroll-icon { background: rgba(255, 255, 255, 0.12); }

/* Stats strip under the photo */
.hero-stats {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid var(--border);
}
.stat {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 36px 48px;
  border-left: 1px solid var(--border);
}
.stat:first-child { border-left: none; }
.stat-n {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.stat-l {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

@media (max-width: 1100px) {
  .stat { flex-direction: column; gap: 4px; padding: 28px 32px; }
}

@media (max-width: 900px) {
  .hero { padding-top: 76px; }
  .hero-photo { height: auto; min-height: 78vh; max-height: none; }
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 120px 20px 88px;
  }
  .hero-actions { flex-direction: column; }
  .btn-light, .btn-line { width: 100%; justify-content: center; }
  .scroll-down { left: 20px; bottom: 24px; }
  .hero-stats { grid-template-columns: repeat(2, 1fr); }
  .stat { padding: 22px 20px; border-left: none; }
  .stat:nth-child(even) { border-left: 1px solid var(--border); }
  .stat:nth-child(n + 3) { border-top: 1px solid var(--border); }
  .stat-n { font-size: 22px; }
  .stat-l { font-size: 10px; }
}
</style>
