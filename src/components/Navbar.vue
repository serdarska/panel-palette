<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { t } from '../i18n.js'
import logoMark from '../assets/logo-mark.png'

const route = useRoute()
const router = useRouter()

const scrolled = ref(false)
const active = ref('home')
const menuOpen = ref(false)

const links = computed(() => [
  { id: 'catalog',      label: t('nav.materials') },
  { id: 'visualizer',   label: t('nav.designStudio') },
  // { id: 'gallery',      label: t('nav.gallery') },
  { id: 'about',        label: t('nav.about') },
  // { id: 'process',      label: t('nav.process') },
])

const sections = ['home', 'catalog', 'visualizer', 'about']

function onScroll() {
  scrolled.value = window.scrollY > 60
  if (route.name !== 'home') { active.value = { category: 'catalog', design: 'visualizer' }[route.name] ?? ''; return }
  const found = sections.find(id => {
    const el = document.getElementById(id)
    if (!el) return false
    const { top, bottom } = el.getBoundingClientRect()
    return top <= 90 && bottom > 90
  })
  if (found) active.value = found
}

function go(id) {
  menuOpen.value = false
  document.body.style.overflow = ''
  // the design studio has its own page
  if (id === 'visualizer') return router.push({ name: 'design' })
  if (route.name !== 'home') {
    router.push(id === 'home' ? { name: 'home' } : { name: 'home', hash: `#${id}` })
    return
  }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  document.body.style.overflow = menuOpen.value ? 'hidden' : ''
}

watch(() => route.fullPath, () => setTimeout(onScroll, 200))

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.body.style.overflow = ''
})
</script>

<template>
  <nav :class="['navbar', { scrolled, wide: ['category', 'design'].includes(route.name) }]">
    <div class="nav-inner">
      <button class="logo" @click="go('home')" aria-label="Interwood Design">
        <img :src="logoMark" alt="" class="logo-mark" />
        <span class="logo-text">
          <span class="logo-name">INTERWOOD</span>
          <span class="logo-sub">DESIGN</span>
        </span>
      </button>

      <div class="links">
        <a v-for="link in links" :key="link.id"
           :href="`#${link.id}`"
           :class="{ active: active === link.id }"
           @click.prevent="go(link.id)">
          {{ link.label }}
        </a>
      </div>

      <div class="nav-end">
        <button class="cta desktop-cta" @click="go('visualizer')">{{ t('nav.designNow') }}</button>
        <!-- Language switch hidden while the site is Macedonian-only -->
        <!-- <span class="nav-sep"></span>
        <button class="lang-toggle" @click="toggleLang">{{ i18n.lang === 'en' ? 'MK' : 'EN' }}</button> -->
      </div>

      <button class="hamburger" @click="toggleMenu" aria-label="Toggle menu">
        <span :class="['bar', { open: menuOpen }]"></span>
        <span :class="['bar', { open: menuOpen }]"></span>
        <span :class="['bar', { open: menuOpen }]"></span>
      </button>
    </div>
  </nav>

  <!-- Mobile menu overlay -->
  <Transition name="mobile-menu">
    <div v-if="menuOpen" class="mobile-overlay" @click.self="toggleMenu">
      <div class="mobile-menu">
        <a v-for="link in links" :key="link.id"
           :href="`#${link.id}`"
           :class="['mobile-link', { active: active === link.id }]"
           @click.prevent="go(link.id)">
          {{ link.label }}
        </a>
        <button class="cta mobile-cta" @click="go('visualizer')">{{ t('nav.designNow') }}</button>
        <!-- <button class="lang-toggle mobile-lang" @click="toggleLang">{{ i18n.lang === 'en' ? 'MK' : 'EN' }}</button> -->
      </div>
    </div>
  </Transition>
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
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 4px 24px rgba(43, 39, 36, 0.05);
  padding: 10px 0;
}
/* full-width pages (catalogue, studio) stretch the bar to match */
.wide .nav-inner { max-width: none; padding: 0 32px; }
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
  padding: 0;
}
.logo-mark {
  height: 42px;
  width: auto;
  transition: height 0.3s ease;
}
.scrolled .logo-mark { height: 36px; }
.logo-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  font-family: var(--font-brand);
}
.logo-name {
  font-size: 19px;
  font-weight: 500;
  letter-spacing: 0.28em;
  margin-right: -0.28em;
  color: var(--text-primary);
}
.logo-sub {
  font-family: var(--font);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.5em;
  margin-right: -0.5em;
  color: var(--accent);
  margin-top: 5px;
}
.links { display: flex; gap: 32px; }
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
  color: var(--on-accent);
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

.nav-end {
  display: flex;
  align-items: center;
  gap: 14px;
}
.nav-sep {
  width: 1px;
  height: 18px;
  background: var(--border-light);
}

.lang-toggle {
  background: transparent;
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  padding: 7px 13px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.08em;
  transition: all var(--transition);
}
.lang-toggle:hover { border-color: var(--accent); color: var(--accent); }
.mobile-lang { margin-top: 8px; width: 100%; }

/* Hamburger */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}
.bar {
  width: 22px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 0;
  transition: all 0.3s ease;
  transform-origin: center;
}
.bar:nth-child(1).open { transform: translateY(7px) rotate(45deg); }
.bar:nth-child(2).open { opacity: 0; }
.bar:nth-child(3).open { transform: translateY(-7px) rotate(-45deg); }

/* Mobile overlay */
.mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgba(43, 39, 36, 0.35);
  backdrop-filter: blur(4px);
}
.mobile-menu {
  position: absolute;
  top: 0; right: 0;
  width: min(320px, 85vw);
  height: 100%;
  background: var(--bg-primary);
  border-left: 1px solid var(--border);
  box-shadow: -12px 0 40px rgba(43, 39, 36, 0.12);
  display: flex;
  flex-direction: column;
  padding: 80px 32px 40px;
  gap: 8px;
}
.mobile-link {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
  transition: color var(--transition);
  text-decoration: none;
}
.mobile-link:last-of-type { border-bottom: none; }
.mobile-link:hover, .mobile-link.active { color: var(--text-primary); }
.mobile-link.active { color: var(--accent); }
.mobile-cta {
  margin-top: 24px;
  width: 100%;
  justify-content: center;
}

/* Transitions */
.mobile-menu-enter-active, .mobile-menu-leave-active { transition: opacity 0.25s ease; }
.mobile-menu-enter-active .mobile-menu, .mobile-menu-leave-active .mobile-menu { transition: transform 0.25s ease; }
.mobile-menu-enter-from, .mobile-menu-leave-to { opacity: 0; }
.mobile-menu-enter-from .mobile-menu, .mobile-menu-leave-to .mobile-menu { transform: translateX(100%); }

@media (max-width: 900px) {
  .links { display: none; }
  .desktop-cta { display: none; }
  .hamburger { display: flex; }
  .nav-inner, .wide .nav-inner { padding: 0 20px; }
}
</style>