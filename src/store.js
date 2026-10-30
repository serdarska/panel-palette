import { reactive } from 'vue'
import { mdfColors } from './data/materials.js'

export const store = reactive({
  countertop: { name: 'Calacatta Mat', code: '6624 MAT', color: '#f0ece8', textColor: '#3a3a3a', image: '/materials/countertop/6624 MAT.jpg' },
  mdf: mdfColors.find(m => m.code === '647'),
  chipboard: { name: 'Supermat Sonomo', code: '17', color: '#c8a870', textColor: '#3a3a3a', image: '/materials/chipboard/17 Supermat Sonomo.png' },
  sink: { name: 'Lena White', code: 'LENA-W', color: '#f4f0ec', image: '/materials/sinks/lena white.avif' },
  activeMaterial: 'mdf',
  // set by a category page's "Apply to design", picked up by the 360° studio
  pendingApply: null,
})