<script setup>
import Navbar from './components/Navbar.vue'
import FooterSection from './components/FooterSection.vue'
</script>

<template>
  <Navbar />
  <main>
    <RouterView :key="String($route.name)" />
  </main>
  <FooterSection v-if="!$route.meta.bare" />
</template>
