<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const scrolled = ref(false)
const active = ref('home')

const links = [
  { id: 'catalog', label: 'Materials' },
  { id: 'visualizer', label: 'Design Studio' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'about', label: 'About' },
  { id: 'process', label: 'Process' },
]

const sections = ['home', 'catalog', 'visualizer', 'gallery', 'about', 'process']

function onScroll() {
  scrolled.value = window.scrollY > 60
  const found = sections.find(id => {
    const el = document.getElementById(id)
    if (!el) return false
    const { top, bottom } = el.getBoundingClientRect()
    return top <= 90 && bottom > 90
  })
  if (found) active.value = found
}

function go(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <nav :class="['navbar', { scrolled }]">
    <div class="nav-inner">
      <button class="logo" @click="go('home')">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="10" height="10" rx="2" fill="#c9a84c"/>
          <rect x="14" y="2" width="10" height="10" rx="2" fill="#c9a84c" opacity="0.55"/>
          <rect x="2" y="14" width="10" height="10" rx="2" fill="#c9a84c" opacity="0.55"/>
          <rect x="14" y="14" width="10" height="10" rx="2" fill="#c9a84c" opacity="0.25"/>
        </svg>
        <span class="logo-text">INTERWOOD <strong>DESIGN</strong></span>
      </button>

      <div class="links">
        <a v-for="link in links" :key="link.id"
           :href="`#${link.id}`"
           :class="{ active: active === link.id }"
           @click.prevent="go(link.id)">
          {{ link.label }}
        </a>
      </div>

      <button class="cta" @click="go('visualizer')">Design Now</button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  padding: 22px 0;
  transition: all 0.3s ease;
}
.navbar.scrolled {
  background: rgba(10, 10, 10, 0.96);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border);
  padding: 14px 0;
}
.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 13px;
  letter-spacing: 0.12em;
  padding: 0;
}
.logo strong { color: var(--text-primary); font-weight: 700; }
.links { display: flex; gap: 36px; }
.links a {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: color var(--transition);
  position: relative;
  padding-bottom: 2px;
  text-decoration: none;
}
.links a::after {
  content: '';
  position: absolute;
  bottom: -3px; left: 0; right: 0;
  height: 1px;
  background: var(--accent);
  transform: scaleX(0);
  transition: transform var(--transition);
  transform-origin: left;
}
.links a:hover, .links a.active { color: var(--text-primary); }
.links a.active::after, .links a:hover::after { transform: scaleX(1); }
.cta {
  background: var(--accent);
  color: #000;
  border: none;
  padding: 10px 22px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.04em;
  transition: all var(--transition);
}
.cta:hover { background: var(--accent-light); transform: translateY(-1px); }
</style>