<script setup>
import { onMounted } from 'vue'
import Navbar from './components/Navbar.vue'
import HeroSection from './components/HeroSection.vue'
import CatalogSection from './components/CatalogSection.vue'
import KitchenVisualizer from './components/KitchenVisualizer.vue'
import GallerySection from './components/GallerySection.vue'
import AboutSection from './components/AboutSection.vue'
import FooterSection from './components/FooterSection.vue'

onMounted(() => {
  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
    }),
    { threshold: 0.08, rootMargin: '-20px 0px' }
  )
  document.querySelectorAll('.reveal').forEach(el => io.observe(el))
})
</script>

<template>
  <Navbar />
  <HeroSection />
  <CatalogSection />
  <KitchenVisualizer />
  <GallerySection />
  <AboutSection />
  <FooterSection />
</template>