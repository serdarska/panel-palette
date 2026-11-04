<script setup>
import { rooms } from '../data/rooms.js'
import { t } from '../i18n.js'
</script>

<template>
  <section class="teaser">
    <div class="teaser-bg"></div>
    <div class="teaser-shade"></div>

    <RouterLink :to="{ name: 'design' }" class="card reveal">
      <span class="label">{{ t('design.teaserLabel') }}</span>
      <h2>{{ t('design.teaserTitle') }}</h2>
      <p>{{ t('design.teaserText') }}</p>

      <div class="rooms">
        <div v-for="r in rooms" :key="r.id" class="room">
          <div class="room-img" :style="{ backgroundImage: `url(/rooms/${r.id}/thumb.jpg)` }"></div>
          <span>{{ r.name }}</span>
        </div>
      </div>

      <span class="cta">
        {{ t('design.teaserCta') }}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
    </RouterLink>
  </section>
</template>

<style scoped>
.teaser {
  position: relative;
  padding: 120px 20px;
  display: flex;
  justify-content: center;
  overflow: hidden;
}
.teaser-bg {
  position: absolute;
  inset: 0;
  /* a render of the studio's own 3-D kitchen */
  background: url('/studio/kitchen-3d.webp') center / cover no-repeat;
}
.teaser-shade {
  position: absolute;
  inset: 0;
  background: rgba(34, 31, 28, 0.35);
}

.card {
  position: relative;
  width: 100%;
  max-width: 520px;
  padding: 44px 44px 40px;
  text-align: center;
  background: var(--bg-card);
  box-shadow: 0 30px 80px rgba(20, 17, 15, 0.22);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 14px;
}
h2 {
  font-family: var(--font-display);
  font-size: clamp(24px, 2.4vw, 32px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  line-height: 1.2;
  margin-bottom: 16px;
}
p {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.7;
  margin-bottom: 26px;
}

.rooms {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 100%;
  margin-bottom: 28px;
}
.room { display: flex; flex-direction: column; gap: 6px; }
.room-img {
  aspect-ratio: 4 / 3;
  background-size: cover;
  background-position: center;
}
.room span {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: var(--text-primary);
  color: #fff;
  padding: 14px 26px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: background var(--transition);
}
.card:hover .cta { background: var(--accent); }
.cta svg { transition: transform var(--transition); }
.card:hover .cta svg { transform: translateX(4px); }

@media (max-width: 768px) {
  .teaser { padding: 72px 16px; }
  .card { padding: 32px 22px 28px; }
  .rooms { grid-template-columns: repeat(2, 1fr); }
}
</style>
