<script setup>
import { computed } from 'vue'
import { t } from '../i18n.js'

function goToCatalog() {
  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
}

// icon paths are 24×24 line drawings
const features = computed(() => [
  { key: 'f1', icon: 'M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z M8.5 12l2.5 2.5 4.5-5' },
  { key: 'f2', icon: 'M4 5h16v11H9l-5 4V5z M8 9.5h8 M8 12.5h5' },
  { key: 'f3', icon: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z' },
  { key: 'f4', icon: 'M3 12a9 4 0 1 0 18 0a9 4 0 1 0-18 0 M12 3v18 M17 15l1.5 1.5L17 18' },
].map(f => ({ ...f, title: t(`about.${f.key}`), text: t(`about.${f.key}Text`) })))
</script>

<template>
  <section id="about" class="about section-pad">
    <div class="section-container">
      <div class="about-grid reveal">
        <div class="about-head">
          <span class="section-label">{{ t('about.label') }}</span>
          <h2>{{ t('about.title1') }}<br>{{ t('about.title2') }}</h2>
          <button class="btn-light" @click="goToCatalog()">
            {{ t('about.startDesigning') }}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="about-text">
          <p class="lead">{{ t('about.p1') }}</p>
          <p>{{ t('about.p2') }}</p>
          <p>{{ t('about.p3') }}</p>
        </div>
      </div>

      <div class="features reveal">
        <div v-for="f in features" :key="f.key" class="feature">
          <svg class="feature-icon" width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path :d="f.icon" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="feature-title">{{ f.title }}</span>
          <span class="feature-text">{{ f.text }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about {
  background: #221f1c;
  color: #fff;
}
.about .section-label { color: var(--accent-dim); }
.about .section-label::before { background: var(--accent-light); }

.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: start;
  padding-bottom: 72px;
}

.about-head h2 {
  font-family: var(--font-display);
  font-size: clamp(30px, 3.4vw, 48px);
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 40px;
  color: #fff;
}

.btn-light {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  color: var(--text-primary);
  border: 1px solid #fff;
  padding: 14px 24px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all var(--transition);
}
.btn-light svg { transition: transform var(--transition); }
.btn-light:hover { background: transparent; color: #fff; }
.btn-light:hover svg { transform: translateX(3px); }

.about-text p {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.8;
  margin-bottom: 18px;
}
.about-text .lead {
  font-size: 20px;
  line-height: 1.6;
  color: #fff;
  margin-bottom: 26px;
}

.features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}
.feature {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 40px 32px 8px 0;
}
.feature + .feature {
  padding-left: 32px;
  border-left: 1px solid rgba(255, 255, 255, 0.14);
}
.feature-icon { color: var(--accent-light); margin-bottom: 10px; }
.feature-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.feature-text {
  font-size: 13px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.55);
}

@media (max-width: 1000px) {
  .features { grid-template-columns: repeat(2, 1fr); }
  .feature, .feature + .feature { padding: 32px 24px 24px 0; border-left: none; }
  .feature:nth-child(even) { padding-left: 24px; border-left: 1px solid rgba(255, 255, 255, 0.14); }
  .feature:nth-child(n + 3) { border-top: 1px solid rgba(255, 255, 255, 0.14); }
}
@media (max-width: 900px) {
  .about-grid { grid-template-columns: 1fr; gap: 32px; padding-bottom: 48px; }
  .about-head h2 { margin-bottom: 28px; }
  .about-text .lead { font-size: 17px; }
}
@media (max-width: 560px) {
  .features { grid-template-columns: 1fr; }
  .feature, .feature + .feature, .feature:nth-child(even) { padding: 28px 0 20px; border-left: none; }
  .feature + .feature { border-top: 1px solid rgba(255, 255, 255, 0.14); }
}
</style>
