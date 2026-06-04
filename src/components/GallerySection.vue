<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

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

const kitchens = [
  {
    name: 'Antrasit Elegance',
    style: 'Contemporary',
    desc: 'Anthracite fronts · Grey marble backsplash · Warm oak accents',
    image: '/gallery/kitchen-antrasit.webp',
    palette: ['#4a4a4a', '#c0b8a8', '#a07848'],
    materials: [
      { category: 'Countertop',  name: '6645 SHINE',         code: '6645 SHINE', image: '/materials/countertop/6645 sjaj.jpg' },
      { category: 'MDF Fronts',  name: 'HG Antrasit',        code: '6022',      image: '/materials/mdf/6022 HG ANTRASIT.webp' },
      { category: 'Chipboard',   name: 'Supermat Beylerbeyi',code: '155',       image: '/materials/chipboard/155 Supermat Beylerbeyi.png' },
    ],
  },
  {
    name: 'Sage & Oak',
    style: 'Natural',
    desc: 'Sage green MDF · Oak chipboard · White countertop',
    image: '/gallery/kitchen-green.webp',
    palette: ['#7a9e7e', '#a07848', '#f5f5f3'],
    materials: [
      { category: 'Countertop',  name: '6624 MATT',            code: '6624 MATT', image: '/materials/countertop/6624 MAT.jpg' },
      { category: 'MDF Fronts',  name: 'Soft Touch Green',    code: '735',      image: '/materials/mdf/735 SOFT TOUCH RELAX GREEN (ZELEN).webp' },
      { category: 'Chipboard',   name: 'Safir Meşe',          code: '102',      image: '/materials/chipboard/102 Safir Mese.jpg' },
    ],
  },
  {
    name: 'Luxury White',
    style: 'Luxury',
    desc: 'Cream MDF · Calacatta backsplash · Stone island',
    image: '/gallery/kitchen-white.webp',
    palette: ['#f0ece8', '#c0b090', '#686870'],
    materials: [
      { category: 'Countertop',  name: '6681',                code: '6681',     image: '/materials/countertop/6681.png' },
      { category: 'MDF Fronts',  name: 'HG Krem',             code: '605',      image: '/materials/mdf/605 HG KREM.webp' },
      { category: 'Chipboard',   name: 'Senkron Dolunay',     code: '161',      image: '/materials/chipboard/161 Senkron Dolunay.jpg' },
    ],
  },
  {
    name: 'Midnight Wood',
    style: 'Premium',
    desc: 'Black MDF · Dark walnut accents · Marble island countertop',
    image: '/gallery/kitchen-antrasit-wood.jpg',
    palette: ['#1a1a1a', '#5a3820', '#c0b0a0'],
    materials: [
      { category: 'Countertop',  name: '6633 SHINE',          code: '6633 SHINE', image: '/materials/countertop/6633 sjaj.jpg' },
      { category: 'MDF Fronts',  name: 'HG Antrasit',         code: '6022',      image: '/materials/mdf/6022 HG ANTRASIT.webp' },
      { category: 'Chipboard',   name: 'Tamni Orah Premium',  code: '6676',      image: '/materials/countertop/6676.png' },
    ],
  },
  {
    name: 'Beige & Oak',
    style: 'Transitional',
    desc: 'Beige soft-touch MDF · Natural oak chipboard · Stone countertop',
    image: '/gallery/kitchen-beige.webp',
    palette: ['#e0d0b0', '#c8a870', '#888878'],
    materials: [
      { category: 'Countertop',  name: '6618',                code: '6618',     image: '/materials/countertop/6618.png' },
      { category: 'MDF Fronts',  name: 'Soft Touch Krem',     code: '730',      image: '/materials/mdf/730 SOFT TOUCH KREM MAT.webp' },
      { category: 'Chipboard',   name: 'Safir Meşe',          code: '102',      image: '/materials/chipboard/102 Safir Mese.jpg' },
    ],
  },
  {
    name: 'Pure Walnut',
    style: 'Minimalist',
    desc: 'Full walnut MDF & chipboard · White quartz countertop · Handle-free design',
    image: '/gallery/kitchen-wood.jpg',
    palette: ['#7a5030', '#a07848', '#f5f0e8'],
    materials: [
      { category: 'Countertop',  name: '6624 MATT',            code: '6624 MATT', image: '/materials/countertop/6624 MAT.jpg' },
      { category: 'MDF Fronts',  name: 'Siena Soft Touch',     code: '737B',     image: '/materials/mdf/737BSIENA SOFT TOUCH .webp' },
      { category: 'Chipboard',   name: 'Supermat Beylerbeyi',  code: '155',      image: '/materials/chipboard/155 Supermat Beylerbeyi.png' },
    ],
  },
]
</script>

<template>
  <section id="gallery" class="gallery section-pad">
    <div class="section-container">
      <div class="section-header reveal">
        <span class="section-label">Our Work</span>
        <h2>Kitchens We've Crafted</h2>
        <p>A selection of completed kitchens showcasing our material combinations and craftsmanship.</p>
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
              <span class="style-tag">{{ k.style }}</span>
            </div>
            <div class="card-view-hint">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="white" stroke-width="1.4"/>
                <circle cx="8" cy="8" r="2" stroke="white" stroke-width="1.4"/>
              </svg>
              View Details
            </div>
          </div>

          <div class="card-body">
            <h3>{{ k.name }}</h3>
            <p>{{ k.desc }}</p>
            <div class="card-footer">
              <div class="k-palette">
                <span v-for="color in k.palette" :key="color" class="pal-dot" :style="{ background: color }"></span>
              </div>
              <span class="view-link">View details →</span>
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
            <span class="modal-style-tag">{{ popupKitchen.style }}</span>
          </div>

          <!-- Right: info -->
          <div class="modal-info">
            <h3 class="modal-name">{{ popupKitchen.name }}</h3>
            <p class="modal-desc">{{ popupKitchen.desc }}</p>

            <div class="modal-divider"></div>

            <span class="modal-mat-label">Materials Used</span>

            <div class="modal-materials">
              <div v-for="mat in popupKitchen.materials" :key="mat.code" class="mat-row">
                <div
                  class="mat-swatch"
                  :style="mat.image
                    ? { backgroundImage: `url('${mat.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: mat.color }"
                ></div>
                <div class="mat-text">
                  <span class="mat-category">{{ mat.category }}</span>
                  <span class="mat-name">{{ mat.category === 'Countertop' ? mat.code : mat.name }}</span>
                  <span v-if="mat.category !== 'Countertop'" class="mat-code">{{ mat.code }}</span>
                </div>
              </div>
            </div>

            <button class="modal-close-btn" @click="closePopup">Close</button>
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
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
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
.k-upper { height: 30%; background: rgba(0,0,0,0.25); border-radius: 3px 3px 0 0; margin-bottom: 10%; }
.k-counter { height: 6%; background: rgba(0,0,0,0.4); border-radius: 1px; }
.k-lower { height: 28%; background: rgba(0,0,0,0.25); border-radius: 0 0 3px 3px; }

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
  border-radius: 100px;
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
.pal-dot { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); }
.view-link { font-size: 12px; color: var(--accent); font-weight: 500; cursor: pointer; transition: color var(--transition); }
.view-link:hover { color: var(--accent-light); }

/* ===== MODAL ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
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
  box-shadow: 0 32px 80px rgba(0,0,0,0.7);
}

.modal-close {
  position: absolute;
  top: 16px; right: 16px;
  width: 36px; height: 36px;
  background: rgba(0,0,0,0.5);
  border: 1px solid var(--border-light);
  border-radius: 50%;
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
  border-radius: 100px;
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
  border-radius: 6px;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.08);
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
</style>
