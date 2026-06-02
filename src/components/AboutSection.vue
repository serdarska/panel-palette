<script setup>
function goToDesign() {
  document.getElementById('visualizer')?.scrollIntoView({ behavior: 'smooth' })
}

const stats = [
  { value: '15+', label: 'Years in business' },
  { value: '500+', label: 'Kitchens completed' },
  { value: '300+', label: 'Material colors' },
  { value: '100%', label: 'Client satisfaction' },
]
</script>

<template>
  <section id="about" class="about section-pad">
    <div class="section-container">
      <div class="about-grid">
        <!-- Text column -->
        <div class="about-text reveal">
          <span class="section-label">About Us</span>
          <h2>Crafting Excellence<br>Since 2008</h2>
          <p>
            Panel Palette was built on a passion for beautiful, functional kitchens. For over 15 years,
            we have been the trusted partner for homeowners and interior designers seeking premium
            materials and expert craftsmanship.
          </p>
          <p>
            Our curated selection of countertops, MDF panels, and chipboard gives you total creative
            control over every surface in your kitchen. Every material is rigorously sourced for quality,
            durability, and aesthetic excellence — because we believe a kitchen should be as lasting
            as it is beautiful.
          </p>
          <p>
            From contemporary minimalism to timeless classics, our team of designers works closely
            with each client, ensuring their vision becomes an everyday reality.
          </p>
          <div class="about-actions">
            <button class="btn-outline" @click="goToDesign()">
              Start Designing
            </button>
          </div>
        </div>

        <!-- Stats column -->
        <div class="about-right reveal">
          <div class="stats-grid">
            <div v-for="stat in stats" :key="stat.value" class="stat-card">
              <span class="stat-val">{{ stat.value }}</span>
              <span class="stat-lbl">{{ stat.label }}</span>
            </div>
          </div>

          <div class="about-badge">
            <div class="badge-inner">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2.5" fill="#c9a84c"/>
                <rect x="18" y="2" width="12" height="12" rx="2.5" fill="#c9a84c" opacity="0.5"/>
                <rect x="2" y="18" width="12" height="12" rx="2.5" fill="#c9a84c" opacity="0.5"/>
                <rect x="18" y="18" width="12" height="12" rx="2.5" fill="#c9a84c" opacity="0.2"/>
              </svg>
              <div>
                <span class="badge-title">Premium Quality</span>
                <span class="badge-sub">Certified materials · Expert installation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr 440px;
  gap: 80px;
  align-items: start;
}

.about-text h2 {
  font-size: clamp(32px, 3.5vw, 48px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.12;
  margin: 16px 0 28px;
  color: var(--text-primary);
}

.about-text p {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 20px;
  max-width: 520px;
}

.about-actions { margin-top: 36px; }
.btn-outline {
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent);
  padding: 13px 28px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.04em;
  transition: all var(--transition);
}
.btn-outline:hover { background: var(--accent); color: #000; }

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color var(--transition);
}
.stat-card:hover { border-color: var(--accent); }
.stat-val {
  font-size: 40px;
  font-weight: 800;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}
.stat-lbl {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 400;
  line-height: 1.4;
}

.about-badge {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
}
.badge-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}
.badge-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
}
.badge-sub {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>