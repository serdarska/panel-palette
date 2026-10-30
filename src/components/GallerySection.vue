<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { t } from '../i18n.js'
import { countertops, mdfColors, chipboardColors } from '../data/materials.js'

// MDF fronts are looked up by code so names, photos and colours stay current
const mdf = code => {
  const p = mdfColors.find(m => m.code === code)
  return { category: 'MDF Fronts', name: p.name, code: p.code, image: p.image }
}
const allMaterials = [...countertops, ...mdfColors, ...chipboardColors]

const popupKitchen = ref(null)

function openPopup(k) {
  popupKitchen.value = k
  document.body.style.overflow = 'hidden'
}
function closePopup() {
  popupKitchen.value = null
  document.body.style.overflow = ''
}
function onKey(e) { if (e.key === 'Escape') closePopup() }
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

const categoryLabel = {
  'Countertop': 'categories.countertop',
  'MDF Fronts': 'categories.mdf',
  'Chipboard':  'categories.chipboard',
}

const kitchens = [
  {
    name: 'Antrasit Elegance',
    style: 'Contemporary',
    desc: 'Антрацит фронтови · Сив мермерен заштитен ѕид · Топли дабови детали',
    image: '/gallery/kitchen-antrasit.webp',
    materials: [
      { category: 'Countertop',  name: '6645 GLOSS',         code: '6645 GLOSS', image: '/materials/countertop/6645 sjaj.jpg' },
      mdf('6022'),
      { category: 'Chipboard',   name: 'Supermat Beylerbeyi',code: '155',       image: '/materials/chipboard/155 Supermat Beylerbeyi.png' },
    ],
  },
  {
    name: 'Sage & Oak',
    style: 'Natural',
    desc: 'Жалфија зелен медијапан · Дабова иверка · Бела плотна',
    image: '/gallery/kitchen-green.webp',
    materials: [
      { category: 'Countertop',  name: '6624 MATT',            code: '6624 MATT', image: '/materials/countertop/6624 MAT.jpg' },
      mdf('735'),
      { category: 'Chipboard',   name: 'Safir Meşe',          code: '102',      image: '/materials/chipboard/102 Safir Mese.jpg' },
    ],
  },
  {
    name: 'Luxury White',
    style: 'Luxury',
    desc: 'Крем медијапан · Калаката заштитен ѕид · Камен остров',
    image: '/gallery/kitchen-white.webp',
    materials: [
      { category: 'Countertop',  name: '6681',                code: '6681',     image: '/materials/countertop/6681.png' },
      mdf('605'),
      { category: 'Chipboard',   name: 'Senkron Dolunay',     code: '161',      image: '/materials/chipboard/161 Senkron Dolunay.jpg' },
    ],
  },
  {
    name: 'Midnight Wood',
    style: 'Premium',
    desc: 'Антрацит медијапан · Темни орев детали · Мермерна плотна на островот',
    image: '/gallery/kitchen-antrasit-wood.jpg',
    materials: [
      { category: 'Countertop',  name: '6633 GLOSS',          code: '6633 GLOSS', image: '/materials/countertop/6633 sjaj.jpg' },
      mdf('6022'),
      { category: 'Chipboard',   name: 'Tamni Orah Premium',  code: '6676',      image: '/materials/countertop/6676.png' },
    ],
  },
  {
    name: 'Beige & Oak',
    style: 'Transitional',
    desc: 'Крем soft-touch медијапан · Природна дабова иверка · Камена плотна',
    image: '/gallery/kitchen-beige.webp',
    materials: [
      { category: 'Countertop',  name: '6618',                code: '6618',     image: '/materials/countertop/6618.png' },
      mdf('730'),
      { category: 'Chipboard',   name: 'Safir Meşe',          code: '102',      image: '/materials/chipboard/102 Safir Mese.jpg' },
    ],
  },
  {
    name: 'Pure Walnut',
    style: 'Minimalist',
    desc: 'Soft touch Siena медијапан и иверка · Бела кварцна плотна · Дизајн без рачки',
    image: '/gallery/kitchen-wood.jpg',
    materials: [
      { category: 'Countertop',  name: '6624 MATT',            code: '6624 MATT', image: '/materials/countertop/6624 MAT.jpg' },
      mdf('737'),
      { category: 'Chipboard',   name: 'Supermat Beylerbeyi',  code: '155',      image: '/materials/chipboard/155 Supermat Beylerbeyi.png' },
    ],
  },
]

// colour dots on each card = the colours of the materials it uses
kitchens.forEach(k => {
  k.palette = k.materials.map(m => allMaterials.find(x => x.image === m.image)?.color).filter(Boolean)
})
</script>

<template>
  <section id="gallery" class="gallery section-pad">
    <div class="section-container">
      <div class="section-header reveal">
        <span class="section-label">{{ t('gallery.label') }}</span>
        <h2>{{ t('gallery.title') }}</h2>
        <p>{{ t('gallery.subtitle') }}</p>
      </div>

      <div class="kitchen-grid">
        <div
          v-for="(k, i) in kitchens"
          :key="k.name"
          :class="['kitchen-card', 'reveal', { photo: !!k.image }]"
          :style="{ transitionDelay: `${(i % 3) * 0.1}s` }"
          @click="openPopup(k)"
        >
          <div
            class="card-image"
            :style="k.image
              ? { backgroundImage: `url('${k.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: k.gradient }"
          >
            <template v-if="!k.image">
              <div class="k-scene">
                <div class="k-upper"></div>
                <div class="k-counter"></div>
                <div class="k-lower"></div>
              </div>
            </template>
            <div class="card-overlay">
              <span class="style-tag">{{ t(`gallery.style${k.style}`) }}</span>
            </div>
            <div class="card-view-hint">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="white" stroke-width="1.4"/>
                <circle cx="8" cy="8" r="2" stroke="white" stroke-width="1.4"/>
              </svg>
              {{ t('accessories.viewDetails') }}
            </div>
          </div>

          <div class="card-body">
            <h3>{{ k.name }}</h3>
            <p>{{ k.desc }}</p>
            <div class="card-footer">
              <div class="k-palette">
                <span v-for="color in k.palette" :key="color" class="pal-dot" :style="{ background: color }"></span>
              </div>
              <span class="view-link">{{ t('gallery.viewDetails') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Kitchen popup -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="popupKitchen" class="modal-overlay" @click.self="closePopup">
        <div class="modal">
          <button class="modal-close" @click="closePopup">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- Left: kitchen photo -->
          <div
            class="modal-image"
            :style="popupKitchen.image
              ? { backgroundImage: `url('${popupKitchen.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: popupKitchen.gradient }"
          >
            <template v-if="!popupKitchen.image">
              <div class="k-scene modal-scene">
                <div class="k-upper"></div>
                <div class="k-counter"></div>
                <div class="k-lower"></div>
              </div>
            </template>
            <span class="modal-style-tag">{{ t(`gallery.style${popupKitchen.style}`) }}</span>
          </div>

          <!-- Right: info -->
          <div class="modal-info">
            <h3 class="modal-name">{{ popupKitchen.name }}</h3>
            <p class="modal-desc">{{ popupKitchen.desc }}</p>

            <div class="modal-divider"></div>

            <span class="modal-mat-label">{{ t('gallery.materialsUsed') }}</span>

            <div class="modal-materials">
              <div v-for="mat in popupKitchen.materials" :key="mat.code" class="mat-row">
                <div
                  class="mat-swatch"
                  :style="mat.image
                    ? { backgroundImage: `url('${mat.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: mat.color }"
                ></div>
                <div class="mat-text">
                  <span class="mat-category">{{ t(categoryLabel[mat.category]) }}</span>
                  <span class="mat-name">{{ mat.category === 'Countertop' ? mat.code : mat.name }}</span>
                  <span v-if="mat.category !== 'Countertop'" class="mat-code">{{ mat.code }}</span>
                </div>
              </div>
            </div>

            <button class="modal-close-btn" @click="closePopup">{{ t('gallery.close') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.gallery {
  background: var(--bg-primary);
  border-top: 1px solid var(--border);
}

.kitchen-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.kitchen-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border);
  transition: all 0.3s ease;
  cursor: pointer;
}
.kitchen-card:hover {
  transform: translateY(-6px);
  border-color: var(--border-light);
  box-shadow: 0 20px 50px rgba(43,39,36,0.14);
}
.kitchen-card.photo .card-image { height: 260px; }

.card-image {
  height: 220px;
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  transition: transform 0.5s ease;
}
.kitchen-card:hover .card-image { transform: scale(1.03); }
.card-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%);
}

.k-scene {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 10%;
  z-index: 1;
  pointer-events: none;
}
.k-upper { height: 30%; background: rgba(0,0,0,0.25); border-radius: 0; margin-bottom: 10%; }
.k-counter { height: 6%; background: rgba(0,0,0,0.4); border-radius: 0; }
.k-lower { height: 28%; background: rgba(0,0,0,0.25); border-radius: 0; }

.card-overlay { position: absolute; top: 14px; left: 14px; z-index: 2; }
.style-tag {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.95);
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(8px);
  padding: 5px 12px;
  border-radius: 0;
  border: 1px solid rgba(255,255,255,0.18);
}

.card-view-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  background: rgba(0,0,0,0.4);
  opacity: 0;
  transition: opacity var(--transition);
  z-index: 3;
}
.kitchen-card:hover .card-view-hint { opacity: 1; }

.card-body { padding: 20px; }
.card-body h3 { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: var(--text-primary); margin-bottom: 6px; }
.card-body p { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; }
.card-footer { display: flex; align-items: center; justify-content: space-between; }
.k-palette { display: flex; gap: 5px; }
.pal-dot { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(43,39,36,0.12); }
.view-link { font-size: 12px; color: var(--accent); font-weight: 500; cursor: pointer; transition: color var(--transition); }
.view-link:hover { color: var(--accent-light); }

/* ===== MODAL ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(43,39,36,0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  display: grid;
  grid-template-columns: 1fr 360px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 32px 80px rgba(43,39,36,0.18);
}

.modal-close {
  position: absolute;
  top: 16px; right: 16px;
  width: 36px; height: 36px;
  background: rgba(255,255,255,0.88);
  border: 1px solid var(--border-light);
  border-radius: 0;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all var(--transition);
}
.modal-close:hover { background: var(--bg-card-hover); color: var(--text-primary); }

.modal-image {
  min-height: 460px;
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
}
.modal-scene { padding: 0 8%; }
.modal-style-tag {
  position: absolute;
  top: 20px; left: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.95);
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(8px);
  padding: 6px 14px;
  border-radius: 0;
  border: 1px solid rgba(255,255,255,0.18);
}

.modal-info {
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

.modal-name {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin-bottom: 10px;
  line-height: 1.2;
}

.modal-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 24px;
}

.modal-divider {
  height: 1px;
  background: var(--border);
  margin-bottom: 24px;
}

.modal-mat-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent);
  display: block;
  margin-bottom: 16px;
}

.modal-materials {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
  flex: 1;
}

.mat-row {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 14px;
  transition: border-color var(--transition);
}
.mat-row:hover { border-color: var(--border-light); }

.mat-swatch {
  width: 44px;
  height: 44px;
  border-radius: 0;
  flex-shrink: 0;
  border: 1px solid rgba(43,39,36,0.12);
  background-size: cover;
  background-position: center;
}

.mat-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mat-category {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.mat-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mat-code {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.06em;
}

.modal-close-btn {
  background: transparent;
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  padding: 12px 24px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
  width: 100%;
}
.modal-close-btn:hover { border-color: var(--text-muted); color: var(--text-primary); }

/* Transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: opacity 0.25s ease, transform 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { opacity: 0; transform: scale(0.95) translateY(16px); }

@media (max-width: 900px) {
  .kitchen-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
}

@media (max-width: 600px) {
  .kitchen-grid { grid-template-columns: 1fr; }
  .kitchen-card.photo .card-image { height: 220px; }

  .modal-overlay { padding: 0; align-items: flex-end; }
  .modal {
    grid-template-columns: 1fr;
    grid-template-rows: 240px 1fr;
    max-height: 92vh;
    border-radius: 0;
  }
  .modal-image { min-height: unset; height: 240px; }
  .modal-info { padding: 24px 20px; }
  .modal-name { font-size: 22px; }
}
</style>
