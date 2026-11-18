<script setup>
import { useRoute, useRouter } from 'vue-router'
import { t } from '../i18n.js'
import logo from '../assets/logo.png'

const route = useRoute()
const router = useRouter()

const locations = [
  { key: 'location2', phones: ['+389 78 213 085'] }, // Kočani
  { key: 'location',  phones: ['+389 78 424 682'] }, // Shtip
  { key: 'location4', phones: ['+389 70 755 982'] }, // Bitola
  { key: 'location3', phones: ['+389 78 424 463'] }, // Skopje
]

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
            <span class="contact-item">{{ t('footer.hours') }}</span>
            <span class="contact-item">{{ t('footer.hoursSat') }}</span>
            <!-- each city with its own phone numbers (tap to call on phones) -->
            <div class="locations-wrap">
              <div class="locations">
                <template v-for="loc in locations" :key="loc.key">
                  <span class="contact-item city">{{ t(`footer.${loc.key}`) }}</span>
                  <a v-for="tel in loc.phones" :key="tel" class="phone" :href="`tel:${tel.replace(/\s/g, '')}`">{{ tel }}</a>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>{{ t('footer.copyright').replace(/\d{4}/, new Date().getFullYear()) }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--bg-primary);
  padding: 0 0 28px;
}
/* the footer runs side to side, not inside the centred page width */
.footer .section-container { max-width: none; }

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
  /* contact is widest so each city and its number fit on one row */
  grid-template-columns: 1fr 0.8fr 1.4fr;
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

/* city | number on one row, numbers lined up; when the column is too narrow
   for that, the number goes under its city */
.locations-wrap { container-type: inline-size; }
.locations {
  display: grid;
  grid-template-columns: max-content max-content;
  justify-content: start;
  column-gap: 14px;
  row-gap: 12px;
  align-items: baseline;
}
.locations .phone { white-space: nowrap; }
@container (max-width: 340px) {
  .locations { grid-template-columns: 1fr; row-gap: 2px; }
  .locations .phone { margin-bottom: 10px; }
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-muted);
}

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
}
</style>