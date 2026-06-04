<script setup>
const steps = [
  {
    num: '01',
    title: 'Consultation',
    desc: 'We meet to discuss your vision, space requirements, style preferences, and budget. No obligation, just ideas.',
    icon: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 6h20v14H4z" rx="2"/>
      <path d="M9 12h10M9 16h6"/>
    </svg>`,
  },
  {
    num: '02',
    title: 'Measurements',
    desc: 'Our team visits your home to take precise measurements of every wall, window, and corner of your kitchen space.',
    icon: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 22L22 4"/>
      <path d="M7 22h17v-3M7 22v-7"/>
      <path d="M10 19l2-2M14 15l2-2M18 11l2-2"/>
    </svg>`,
  },
  {
    num: '03',
    title: 'Design & Selection',
    desc: 'We create a tailored 3D design and guide you through selecting countertops, MDF fronts, and chipboard from our catalog.',
    icon: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 4l6 6-12 12H6v-6L18 4z"/>
      <path d="M15 7l6 6"/>
    </svg>`,
  },
  {
    num: '04',
    title: 'Production',
    desc: 'Your kitchen components are precision-cut and finished in our workshop using the materials you selected.',
    icon: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="12" width="20" height="12" rx="1"/>
      <path d="M8 12V8a6 6 0 0112 0v4"/>
      <circle cx="14" cy="18" r="2"/>
    </svg>`,
  },
  {
    num: '05',
    title: 'Delivery',
    desc: 'Every component is carefully wrapped and delivered to your home on a date that suits you, ready for installation.',
    icon: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 8h16v12H2zM18 10l6 4v6h-6V10z"/>
      <circle cx="7" cy="22" r="2"/>
      <circle cx="21" cy="22" r="2"/>
    </svg>`,
  },
  {
    num: '06',
    title: 'Installation',
    desc: 'Our professional team installs your kitchen with meticulous attention to detail, leaving your space perfect and ready to use.',
    icon: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 22l3-3 10-10a2.83 2.83 0 00-4-4L5 15l-1 7 7-1z"/>
      <path d="M15 7l4 4"/>
      <path d="M19 3l2 2-1 2-3-3 2-1z"/>
    </svg>`,
  },
]
</script>

<template>
  <section id="process" class="process section-pad">
    <div class="section-container">
      <div class="section-header reveal">
        <span class="section-label">How It Works</span>
        <h2>From Measurement<br>to Move-In</h2>
        <p>Six simple steps — from your first idea to a fully installed kitchen you'll love for years.</p>
      </div>

      <div class="timeline">
        <!-- connecting line -->
        <div class="timeline-line"></div>

        <div
          v-for="(step, i) in steps"
          :key="step.num"
          class="step reveal"
          :style="{ transitionDelay: `${i * 0.1}s` }"
        >
          <div class="step-top">
            <div class="step-node">
              <span class="step-num">{{ step.num }}</span>
            </div>
          </div>

          <div class="step-body">
            <div class="step-icon" v-html="step.icon"></div>
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-desc">{{ step.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Bottom CTA -->
      <div class="process-cta reveal">
        <p>Ready to start your kitchen project?</p>
        <button class="cta-btn" @click="document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })">
          Get in Touch
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.process {
  background: var(--bg-primary);
  border-top: 1px solid var(--border);
  overflow: hidden;
}

.section-header h2 {
  line-height: 1.1;
}

/* Timeline */
.timeline {
  position: relative;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0 8px;
  margin-bottom: 72px;
}

.timeline-line {
  position: absolute;
  top: 28px;
  left: calc(100% / 12);
  right: calc(100% / 12);
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border-light) 10%, var(--border-light) 90%, transparent);
  z-index: 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 1;
}

.step-top {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}

.step-node {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.step:hover .step-node {
  border-color: var(--accent);
  background: rgba(201, 168, 76, 0.08);
  box-shadow: 0 0 0 6px rgba(201, 168, 76, 0.06);
}

.step-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.05em;
}

.step-body {
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.step-icon {
  color: var(--text-muted);
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step:hover .step-icon {
  color: var(--accent);
}

.step-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.step-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.65;
  max-width: 160px;
}

/* CTA */
.process-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 40px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.process-cta p {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent);
  color: #000;
  border: none;
  padding: 13px 28px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition);
  white-space: nowrap;
  letter-spacing: 0.03em;
}
.cta-btn:hover { background: var(--accent-light); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201,168,76,0.25); }
</style>