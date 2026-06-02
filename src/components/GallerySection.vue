<script setup>
const kitchens = [
  {
    name: 'Modern Noir',
    style: 'Contemporary',
    desc: 'Charcoal MDF · Nero Assoluto countertop · Anthracite chipboard',
    gradient: 'linear-gradient(160deg, #111 0%, #1e1e1e 50%, #151515 100%)',
    palette: ['#3a3b3c', '#0f0f0f', '#2d2d2f'],
  },
  {
    name: 'Nordic Light',
    style: 'Minimalist',
    desc: 'Alpine White MDF · Calacatta marble · Natural Oak carcass',
    gradient: 'linear-gradient(160deg, #f4f0ea 0%, #eae5de 50%, #ddd8d0 100%)',
    palette: ['#f5f5f3', '#f2ede8', '#c8a55a'],
  },
  {
    name: 'Warm Harvest',
    style: 'Transitional',
    desc: 'Linen MDF · Sahara Beige countertop · Sonoma Oak carcass',
    gradient: 'linear-gradient(160deg, #2a1a0a 0%, #6b4c2a 40%, #c8a55a 100%)',
    palette: ['#e8dfc8', '#d4b896', '#b08040'],
  },
  {
    name: 'Sage Garden',
    style: 'Natural',
    desc: 'Sage Green MDF · Warm Taupe countertop · Nebraska Oak carcass',
    gradient: 'linear-gradient(160deg, #1a2a1e 0%, #2d4a35 45%, #7a9e7e 100%)',
    palette: ['#7a9e7e', '#b5a490', '#c4a070'],
  },
  {
    name: 'Navy & Brass',
    style: 'Classic',
    desc: 'Midnight Blue MDF · Grey Quartz countertop · Bardolino Oak carcass',
    gradient: 'linear-gradient(160deg, #0a0e1a 0%, #1e3a5a 50%, #4a6585 100%)',
    palette: ['#1e3a5a', '#9ba0a3', '#8b6035'],
  },
  {
    name: 'Graphite Studio',
    style: 'Industrial',
    desc: 'Graphite MDF · Silver Cloud countertop · Light Grey chipboard',
    gradient: 'linear-gradient(160deg, #111 0%, #2a2a2a 45%, #464646 100%)',
    palette: ['#4a4a4e', '#c8cdd0', '#d0d0d0'],
  },
]
</script>

<template>
  <section id="gallery" class="gallery section-pad">
    <div class="section-container">
      <div class="section-header reveal">
        <span class="section-label">Our Work</span>
        <h2>Kitchens We've Crafted</h2>
        <p>A selection of completed kitchens showcasing our material combinations and craftsmanship.</p>
      </div>

      <div class="kitchen-grid">
        <div
          v-for="(k, i) in kitchens"
          :key="k.name"
          :class="['kitchen-card', 'reveal', i === 0 || i === 3 ? 'featured' : '']"
          :style="{ transitionDelay: `${(i % 3) * 0.1}s` }"
        >
          <div class="card-image" :style="{ background: k.gradient }">
            <!-- Abstract kitchen silhouette -->
            <div class="k-scene">
              <div class="k-upper"></div>
              <div class="k-counter"></div>
              <div class="k-lower"></div>
            </div>
            <div class="card-overlay">
              <span class="style-tag">{{ k.style }}</span>
            </div>
          </div>
          <div class="card-body">
            <h3>{{ k.name }}</h3>
            <p>{{ k.desc }}</p>
            <div class="card-footer">
              <div class="k-palette">
                <span
                  v-for="color in k.palette"
                  :key="color"
                  class="pal-dot"
                  :style="{ background: color }"
                ></span>
              </div>
              <span class="view-link">View details →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.gallery {
  background: var(--bg-primary);
  border-top: 1px solid var(--border);
}

.kitchen-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.kitchen-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border);
  transition: all 0.3s ease;
}
.kitchen-card:hover {
  transform: translateY(-6px);
  border-color: var(--border-light);
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}
.kitchen-card.featured .card-image { height: 280px; }

.card-image {
  height: 220px;
  position: relative;
  overflow: hidden;
}
.card-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%);
}

/* CSS kitchen silhouette */
.k-scene {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 10%;
  gap: 0;
  z-index: 1;
  pointer-events: none;
}
.k-upper {
  height: 30%;
  background: rgba(0,0,0,0.25);
  border-radius: 3px 3px 0 0;
  margin-bottom: 10%;
}
.k-counter {
  height: 6%;
  background: rgba(0,0,0,0.4);
  border-radius: 1px;
}
.k-lower {
  height: 28%;
  background: rgba(0,0,0,0.25);
  border-radius: 0 0 3px 3px;
}

.card-overlay {
  position: absolute;
  top: 14px; left: 14px;
  z-index: 2;
}
.style-tag {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.9);
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(8px);
  padding: 5px 12px;
  border-radius: 100px;
  border: 1px solid rgba(255,255,255,0.15);
}

.card-body {
  padding: 20px;
}
.card-body h3 {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin-bottom: 6px;
}
.card-body p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.k-palette {
  display: flex;
  gap: 5px;
}
.pal-dot {
  width: 14px; height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.1);
}
.view-link {
  font-size: 12px;
  color: var(--accent);
  font-weight: 500;
  cursor: pointer;
  transition: color var(--transition);
}
.view-link:hover { color: var(--accent-light); }
</style>