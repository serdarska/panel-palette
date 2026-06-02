<script setup>
import { ref, onMounted } from 'vue'

const visible = ref(false)
onMounted(() => setTimeout(() => visible.value = true, 80))

function go(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

const mosaic = [
  { image: '/materials/countertop/6624 MAT.jpg',                    name: 'Calacatta Mat',       dark: false },
  { image: '/materials/chipboard/17 Supermat Sonomo.png',           name: 'Supermat Sonomo',     dark: false },
  { image: '/materials/mdf/6022 HG ANTRASIT.webp',                  name: 'HG Antrasit',         dark: true  },
  { image: '/materials/chipboard/113 Dinamik Yosun.jpg',            name: 'Dinamik Yosun',       dark: true  },
  { image: '/materials/chipboard/155 Supermat Beylerbeyi.png',      name: 'Beylerbeyi',          dark: true  },
  { image: '/materials/mdf/735 SOFT TOUCH RELAX GREEN (ZELEN).webp',name: 'Relax Green',         dark: false },
  { image: '/materials/chipboard/7749 Country Copper - 18mm.jpg',  name: 'Country Copper',      dark: false },
  { image: '/materials/mdf/605 HG KREM.webp',                       name: 'HG Krem',             dark: false },
  { image: '/materials/countertop/6645 sjaj.jpg',                   name: 'Sivi Mramor',         dark: true  },
]
</script>

<template>
  <section id="home" class="hero">
    <div class="hero-bg">
      <div class="hero-glow"></div>
    </div>

    <div class="hero-layout">
      <div :class="['hero-content', { visible }]">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          Premium Kitchen Materials
        </div>
        <h1>Craft Your<br><span class="accent">Perfect Kitchen.</span></h1>
        <p class="hero-sub">
          Three material categories, hundreds of colors — countertops, MDF fronts,
          and chipboard crafted for your dream kitchen.
        </p>
        <div class="hero-actions">
          <button class="btn-primary" @click="go('catalog')">
            Explore Materials
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="btn-ghost" @click="go('visualizer')">Design Your Kitchen</button>
        </div>
        <div class="hero-stats">
          <div class="stat">
            <span class="stat-n">300+</span>
            <span class="stat-l">Material Colors</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat">
            <span class="stat-n">15+</span>
            <span class="stat-l">Years Experience</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat">
            <span class="stat-n">500+</span>
            <span class="stat-l">Kitchens Made</span>
          </div>
        </div>
      </div>

      <div :class="['hero-visual', { visible }]">
        <div class="mosaic">
          <div
            v-for="(card, i) in mosaic"
            :key="card.name"
            class="mosaic-card"
            :style="{ backgroundImage: `url('${card.image}')`, backgroundSize: 'cover', backgroundPosition: 'center', animationDelay: `${i * 0.12}s` }"
          >
            <span :style="{ color: card.dark ? '#f0f0f0' : '#1a1a1a' }">{{ card.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <button class="scroll-hint" @click="go('catalog')">
      <span>Scroll to explore</span>
      <div class="scroll-line"></div>
    </button>
  </section>
</template>

<style scoped>
@keyframes heroBg {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
@keyframes scrollPulse {
  0%, 100% { transform: scaleY(1); opacity: 1; }
  50% { transform: scaleY(0.4); opacity: 0.4; }
}

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(-45deg, #0a0a0a, #0d0d10, #0a0a0a, #10100d);
  background-size: 400% 400%;
  animation: heroBg 22s ease infinite;
}
.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hero-glow {
  position: absolute;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}

.hero-layout {
  max-width: 1280px;
  margin: 0 auto;
  padding: 120px 48px 80px;
  display: grid;
  grid-template-columns: 1fr 480px;
  gap: 80px;
  align-items: center;
  width: 100%;
}

.hero-content {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.9s ease, transform 0.9s ease;
}
.hero-content.visible { opacity: 1; transform: translateY(0); }

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 28px;
  border: 1px solid rgba(201,168,76,0.25);
  padding: 8px 16px;
  border-radius: 100px;
}
.badge-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: float 2s ease infinite;
}

h1 {
  font-size: clamp(48px, 6vw, 80px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin-bottom: 24px;
  color: var(--text-primary);
}
.accent {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-sub {
  font-size: 18px;
  color: var(--text-secondary);
  line-height: 1.75;
  max-width: 480px;
  margin-bottom: 40px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 56px;
  flex-wrap: wrap;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent);
  color: #000;
  border: none;
  padding: 14px 28px;
  border-radius: var(--radius);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
  letter-spacing: 0.02em;
}
.btn-primary:hover { background: var(--accent-light); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,168,76,0.25); }

.btn-ghost {
  display: inline-flex;
  align-items: center;
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  padding: 14px 28px;
  border-radius: var(--radius);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}
.btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

.hero-stats {
  display: flex;
  align-items: center;
  gap: 32px;
}
.stat { display: flex; flex-direction: column; gap: 2px; }
.stat-n { font-size: 26px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.03em; }
.stat-l { font-size: 12px; color: var(--text-secondary); letter-spacing: 0.05em; }
.stat-sep { width: 1px; height: 40px; background: var(--border-light); }

/* Mosaic */
.hero-visual {
  opacity: 0;
  transform: translateY(32px) scale(0.96);
  transition: opacity 1s ease 0.2s, transform 1s ease 0.2s;
}
.hero-visual.visible { opacity: 1; transform: translateY(0) scale(1); }

.mosaic {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  transform: rotate(-4deg);
  filter: drop-shadow(0 20px 60px rgba(0,0,0,0.6));
}
.mosaic-card {
  border-radius: var(--radius);
  height: 110px;
  display: flex;
  align-items: flex-end;
  padding: 10px;
  animation: float 4s ease infinite;
  transition: transform 0.3s ease;
}
.mosaic-card:hover { transform: scale(1.04); }
.mosaic-card span {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.85;
}

/* Scroll hint */
.scroll-hint {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transition: color var(--transition);
}
.scroll-hint:hover { color: var(--accent); }
.scroll-line {
  width: 1px; height: 40px;
  background: linear-gradient(to bottom, var(--text-muted), transparent);
  animation: scrollPulse 2s ease infinite;
}
</style>