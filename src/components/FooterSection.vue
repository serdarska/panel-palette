<script setup>
import { useRoute, useRouter } from 'vue-router'
import { t } from '../i18n.js'
import logo from '../assets/logo.png'

const route = useRoute()
const router = useRouter()

function go(id) {
  if (route.name !== 'home') return router.push({ name: 'home', hash: `#${id}` })
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <footer class="footer">
    <div class="section-container">
      <div class="footer-top">
        <div class="footer-brand">
          <img :src="logo" alt="Interwood Design" class="footer-logo" />
          <p class="brand-tagline">{{ t('footer.tagline') }}</p>
        </div>

        <div class="footer-cols">
          <div class="footer-col">
            <span class="col-title">{{ t('footer.materials') }}</span>
            <RouterLink :to="{ name: 'category', params: { category: 'mdf' } }">{{ t('categories.mdf') }}</RouterLink>
            <RouterLink :to="{ name: 'category', params: { category: 'chipboard' } }">{{ t('categories.chipboard') }}</RouterLink>
            <RouterLink :to="{ name: 'category', params: { category: 'countertop' } }">{{ t('categories.countertop') }}</RouterLink>
            <RouterLink :to="{ name: 'category', params: { category: 'laminate' } }">{{ t('categories.laminate') }}</RouterLink>
            <RouterLink :to="{ name: 'category', params: { category: 'panels' } }">{{ t('categories.panels') }}</RouterLink>
            <RouterLink :to="{ name: 'category', params: { category: 'sinks' } }">{{ t('categories.sinks') }}</RouterLink>
            <RouterLink :to="{ name: 'category', params: { category: 'faucets' } }">{{ t('categories.faucets') }}</RouterLink>
            <a href="/#catalog" @click.prevent="go('catalog')">{{ t('footer.allCollections') }}</a>
          </div>
          <div class="footer-col">
            <span class="col-title">{{ t('footer.services') }}</span>
            <RouterLink :to="{ name: 'design' }">{{ t('footer.designStudio') }}</RouterLink>
            <!-- <a href="#gallery" @click.prevent="go('gallery')">{{ t('footer.kitchenGallery') }}</a> -->
            <a href="#about" @click.prevent="go('about')">{{ t('footer.consultation') }}</a>
            <a href="#about" @click.prevent="go('about')">{{ t('footer.installation') }}</a>
          </div>
          <div class="footer-col">
            <span class="col-title">{{ t('footer.contact') }}</span>
            <a href="mailto:interwoodd@gmail.com">interwoodd@gmail.com</a>
            <span class="contact-item">+381 11 000 0000</span>
            <span class="contact-item">{{ t('footer.hours') }}</span>
            <span class="contact-item">{{ t('footer.location') }}</span>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>{{ t('footer.copyright').replace(/\d{4}/, new Date().getFullYear()) }}</span>
        <div class="footer-links">
          <a href="#">{{ t('footer.privacy') }}</a>
          <a href="#">{{ t('footer.terms') }}</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--bg-primary);
  padding: 0 0 28px;
}

.footer-top {
  display: grid;
  grid-template-columns: 320px 1fr;
  margin-bottom: 28px;
  border-bottom: 1px solid var(--border);
}

.footer-logo {
  width: 170px;
  height: auto;
  margin-bottom: 24px;
}

.footer-brand { padding: 64px 48px 56px 0; }
.brand-tagline {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  max-width: 280px;
}

.footer-cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 64px 32px 56px;
  border-left: 1px solid var(--border);
}

.col-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.footer-col a {
  font-size: 14px;
  color: var(--text-secondary);
  transition: color var(--transition);
  text-decoration: none;
}
.footer-col a:hover { color: var(--accent); }

.contact-item {
  font-size: 14px;
  color: var(--text-secondary);
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-muted);
}
.footer-links {
  display: flex;
  gap: 24px;
}
.footer-links a {
  color: var(--text-muted);
  transition: color var(--transition);
  text-decoration: none;
}
.footer-links a:hover { color: var(--text-secondary); }

@media (max-width: 900px) {
  .footer-top { grid-template-columns: 1fr; }
  .footer-brand { padding: 48px 0 32px; border-bottom: 1px solid var(--border); }
  .footer-cols { grid-template-columns: repeat(2, 1fr); }
  .footer-col { padding: 32px 20px 32px 0; border-left: none; }
  .footer-col + .footer-col { padding-left: 20px; border-left: 1px solid var(--border); }
  .brand-tagline { max-width: 100%; }
}

@media (max-width: 600px) {
  .footer-cols { grid-template-columns: 1fr; }
  .footer-col, .footer-col + .footer-col { padding: 28px 0; border-left: none; }
  .footer-col + .footer-col { border-top: 1px solid var(--border); }
  .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
  .footer-links { justify-content: center; }
}
</style>