<script setup>
import HeroSection from '../components/HeroSection.vue'
import CatalogSection from '../components/CatalogSection.vue'
import StudioTeaser from '../components/StudioTeaser.vue'
// import KitchenVisualizer from '../components/KitchenVisualizer.vue'
// import GallerySection from '../components/GallerySection.vue'
import PartnersSection from '../components/PartnersSection.vue'
import AboutSection from '../components/AboutSection.vue'
// import ProcessSection from '../components/ProcessSection.vue'
import { useReveal } from '../reveal.js'

useReveal()
</script>

<template>
  <HeroSection />
  <CatalogSection />
  <StudioTeaser />
  <CatalogSection kind="product" />
  <!-- Kitchen visualizer (photo of a real kitchen) hidden for now -->
  <!-- <KitchenVisualizer /> -->
  <!-- "Our projects" section hidden for now -->
  <!-- <GallerySection /> -->
  <PartnersSection />
  <AboutSection />
  <!-- "How it works" section hidden for now -->
  <!-- <ProcessSection /> -->
</template>
