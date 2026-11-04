<script setup>
// Hero carousel: the photos in public/carousel crossfade with a slow zoom and
// the headline changes with each one (hero.slides in i18n.js, same order).
// Moves on every 4 s; arrows, swipe and the arrow keys move it by hand,
// and it pauses while the pointer is over the text or the tab is hidden.
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { t } from '../i18n.js'

const visible = ref(false)

function go(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

const images = [1, 2, 3, 4, 5].map(n => `/carousel/interwood_slide_${n}.jpg`)
const slides = computed(() => images.map((src, i) => ({ src, title: t(`hero.slides.${i}`) })))
const current = ref(0)
const INTERVAL = 4000
let timer = null, paused = false

function show(i) {
  current.value = (i + images.length) % images.length
  restart()
}
const next = () => show(current.value + 1)
const prev = () => show(current.value - 1)

function restart() {
  clearInterval(timer)
  timer = setInterval(() => { if (!paused && !document.hidden) current.value = (current.value + 1) % images.length }, INTERVAL)
}

// touch swipe
let touchX = null
const onTouchStart = e => { touchX = e.touches[0].clientX }
function onTouchEnd(e) {
  if (touchX == null) return
  const dx = e.changedTouches[0].clientX - touchX
  if (Math.abs(dx) > 50) (dx < 0 ? next : prev)()
  touchX = null
}
function onKey(e) {
  if (e.target.closest?.('input, textarea')) return
  const r = document.getElementById('home')?.getBoundingClientRect()
  if (!r || r.bottom < 100) return
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft') prev()
}

onMounted(() => {
  setTimeout(() => visible.value = true, 80)
  images.slice(1).forEach(src => { new Image().src = src })   // preload, so fades never wait
  restart()
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <section id="home" class="hero">
    <div class="hero-photo" @touchstart.passive="onTouchStart" @touchend="onTouchEnd">
      <div
        v-for="(s, i) in slides"
        :key="s.src"
        :class="['slide', { on: i === current }]"
        :style="{ backgroundImage: `url('${s.src}')` }"
        :aria-hidden="i !== current"
      ></div>
      <div class="hero-shade"></div>

      <div :class="['hero-inner', { visible }]" @mouseenter="paused = true" @mouseleave="paused = false">
        <div class="hero-main">
          <span class="eyebrow">{{ t('hero.badge') }}</span>
          <div class="titles" aria-live="polite">
            <Transition name="title" mode="out-in">
              <h1 :key="current">{{ slides[current].title }}</h1>
            </Transition>
          </div>
        </div>

        <div class="hero-side">
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

      <button class="arrow arrow-prev" :aria-label="t('hero.prev')" @click="prev">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button class="arrow arrow-next" :aria-label="t('hero.next')" @click="next">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>

      <button class="scroll-down" @click="go('catalog')">
        <span class="scroll-icon">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M2 8l5 5 5-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        {{ t('hero.scroll') }}
      </button>
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
  height: calc(100vh - 86px);
  min-height: 560px;
  max-height: 860px;
  background: #1b1815;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
/* slides: crossfade, each one slowly zooming while it is shown */
.slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transform: scale(1.08);
  transition: opacity 1.1s ease, transform 5s ease-out;
}
.slide.on { opacity: 1; transform: scale(1); }
@media (prefers-reduced-motion: reduce) {
  .slide { transition: opacity 0.6s ease; transform: none; }
  .slide.on { transform: none; }
}

/* headline: one at a time, sliding up */
.titles { min-height: calc(3 * 1.04 * clamp(38px, 4.6vw, 66px)); display: flex; align-items: flex-end; }
.title-enter-active, .title-leave-active { transition: opacity 0.5s ease, transform 0.5s ease; }
.title-enter-from { opacity: 0; transform: translateY(18px); }
.title-leave-to { opacity: 0; transform: translateY(-12px); }

/* previous / next arrows on the left and right edge, above the text block */
.arrow {
  position: absolute;
  top: 36%;
  z-index: 2;
  transform: translateY(-50%);
  width: 46px; height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(20, 17, 15, 0.2);
  color: #fff;
  cursor: pointer;
  transition: background var(--transition), border-color var(--transition);
}
.arrow:hover { background: #fff; color: var(--text-primary); border-color: #fff; }
.arrow-prev { left: 24px; }
.arrow-next { right: 24px; }
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
  .scroll-down { display: none; }
  /* on phones the text fills the middle, so the arrows sit in the bottom corners */
  .arrow { top: auto; bottom: 22px; transform: none; }
  .arrow-prev { left: 20px; }
  .arrow-next { right: 20px; }
  .arrow { width: 40px; height: 40px; }
  .titles { min-height: calc(3 * 1.04 * 38px); }
}
</style>
