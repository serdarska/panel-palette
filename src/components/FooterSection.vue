<script setup>
function go(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <footer class="footer">
    <div class="section-container">
      <div class="footer-top">
        <div class="footer-brand">
          <div class="footer-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="11" height="11" rx="2" fill="#c9a84c"/>
              <rect x="15" y="2" width="11" height="11" rx="2" fill="#c9a84c" opacity="0.55"/>
              <rect x="2" y="15" width="11" height="11" rx="2" fill="#c9a84c" opacity="0.55"/>
              <rect x="15" y="15" width="11" height="11" rx="2" fill="#c9a84c" opacity="0.25"/>
            </svg>
            <span>INTERWOOD <strong>DESIGN</strong></span>
          </div>
          <p class="brand-tagline">Premium materials for the kitchen of your dreams. Three categories, hundreds of colors, one perfect result.</p>
        </div>

        <div class="footer-cols">
          <div class="footer-col">
            <span class="col-title">Materials</span>
            <a href="#catalog" @click.prevent="go('catalog')">Counter Tops</a>
            <a href="#catalog" @click.prevent="go('catalog')">MDF Fronts</a>
            <a href="#catalog" @click.prevent="go('catalog')">Decorative Boards</a>
            <a href="#visualizer" @click.prevent="go('catalog')">All Collections</a>
          </div>
          <div class="footer-col">
            <span class="col-title">Services</span>
            <a href="#visualizer" @click.prevent="go('visualizer')">Design Studio</a>
            <a href="#gallery" @click.prevent="go('gallery')">Kitchen Gallery</a>
            <a href="#about" @click.prevent="go('about')">Consultation</a>
            <a href="#about" @click.prevent="go('about')">Installation</a>
          </div>
          <div class="footer-col">
            <span class="col-title">Contact</span>
            <span class="contact-item">interwoodd@gmail.com</span>
            <span class="contact-item">+381 11 000 0000</span>
            <span class="contact-item">Mon–Fri  08:00–17:00</span>
            <span class="contact-item">Shtip, North Macedonia</span>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© 2025 Interwood Design. All rights reserved.</span>
        <div class="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: #060606;
  border-top: 1px solid var(--border);
  padding: 72px 0 32px;
}

.footer-top {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 80px;
  margin-bottom: 56px;
  padding-bottom: 56px;
  border-bottom: 1px solid var(--border);
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 13px;
  letter-spacing: 0.12em;
  margin-bottom: 20px;
}
.footer-logo strong { color: var(--text-primary); font-weight: 700; }

.brand-tagline {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.7;
  max-width: 280px;
}

.footer-cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.col-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.footer-col a {
  font-size: 14px;
  color: var(--text-muted);
  transition: color var(--transition);
  text-decoration: none;
}
.footer-col a:hover { color: var(--accent); }

.contact-item {
  font-size: 14px;
  color: var(--text-muted);
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
  .footer-top {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .footer-cols { grid-template-columns: repeat(2, 1fr); gap: 28px; }
  .brand-tagline { max-width: 100%; }
}

@media (max-width: 600px) {
  .footer-cols { grid-template-columns: 1fr; }
  .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
  .footer-links { justify-content: center; }
}
</style>