<script setup>
// The brands we buy from, as an endless strip of logos drifting sideways.
// Logos are trimmed copies in public/firms/web/ (originals beside them). The
// list is repeated so the strip is wider than any screen, then drawn twice:
// sliding it by exactly half loops seamlessly. Pauses on hover; with reduced
// motion it just shows the logos in a row.
import { t } from '../i18n.js'

const logos = [
  // `scale` evens out how big each logo looks (AGT is bold, San Donna has a tagline)
  { name: 'AGT', src: '/firms/web/agt.webp', scale: 0.72 },
  { name: 'San Donna', src: '/firms/web/sandonna.webp', scale: 1.15 },
  { name: 'Starwood', src: '/firms/web/starwood.webp', scale: 1 },
  { name: 'Rosi', src: '/firms/web/rosi.webp', scale: 0.85 },
]
const strip = Array.from({ length: 4 }, () => logos).flat()
</script>

<template>
  <section class="partners" :aria-label="t('partners.label')">
    <div class="section-container head reveal">
      <span class="section-label">{{ t('partners.label') }}</span>
      <p>{{ t('partners.text') }}</p>
    </div>

    <div class="marquee">
      <div class="track">
        <template v-for="copy in 2" :key="copy">
          <div v-for="(l, i) in strip" :key="`${copy}-${i}`" class="logo" :aria-hidden="copy === 2 || i >= logos.length">
            <img :src="l.src" :alt="l.name" :style="{ height: `${l.scale * 100}%` }" loading="lazy" />
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.partners {
  padding: 64px 0 72px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  overflow: hidden;
}
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 40px;
}
.head p {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 420px;
  text-align: right;
}

.marquee {
  position: relative;
  /* soft fade at both edges */
  -webkit-mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent);
}
.track {
  display: flex;
  width: max-content;
  animation: slide 40s linear infinite;
}
.marquee:hover .track { animation-play-state: paused; }
@keyframes slide { to { transform: translateX(-50%); } }

.logo {
  flex: 0 0 auto;
  height: 64px;
  padding: 0 64px;
  display: flex;
  align-items: center;
}
.logo img {
  width: auto;
  max-width: 220px;
  object-fit: contain;
}

@media (prefers-reduced-motion: reduce) {
  .track { animation: none; }
}
@media (max-width: 900px) {
  .partners { padding: 48px 0 52px; }
  .head { flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .head p { text-align: left; }
  .logo { height: 48px; padding: 0 36px; }
  .track { animation-duration: 28s; }
}
</style>
