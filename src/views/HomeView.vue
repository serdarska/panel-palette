<script setup>
import HeroSection from '../components/HeroSection.vue'
import CatalogSection from '../components/CatalogSection.vue'
import StudioTeaser from '../components/StudioTeaser.vue'
import KitchenVisualizer from '../components/KitchenVisualizer.vue'
// import GallerySection from '../components/GallerySection.vue'
import AboutSection from '../components/AboutSection.vue'
// import ProcessSection from '../components/ProcessSection.vue'
import { useReveal } from '../reveal.js'

useReveal()
</script>

<template>
  <HeroSection />
  <CatalogSection />
  <StudioTeaser />
  <KitchenVisualizer />
  <!-- "Our projects" section hidden for now -->
  <!-- <GallerySection /> -->
  <AboutSection />
  <!-- "How it works" section hidden for now -->
  <!-- <ProcessSection /> -->
</template>
