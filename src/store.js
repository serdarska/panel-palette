import { reactive } from 'vue'

export const store = reactive({
  countertop: { name: 'Calacatta Mat', code: '6624 MAT', color: '#f0ece8', textColor: '#3a3a3a', image: '/materials/countertop/6624 MAT.jpg' },
  mdf: { name: 'HG Bianco', code: '647', color: '#f8f4ec', textColor: '#3a3a3a', image: '/materials/mdf/647 HG BIANCO.webp' },
  chipboard: { name: 'Supermat Sonomo', code: '17', color: '#c8a870', textColor: '#3a3a3a', image: '/materials/chipboard/17 Supermat Sonomo.png' },
  activeMaterial: 'mdf',
})