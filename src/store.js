import { reactive } from 'vue'
import { mdfColors, chipboardColors } from './data/materials.js'

export const store = reactive({
  countertop: { name: 'Calacatta', code: '6624', color: '#ededeb', textColor: '#3a3a3a', image: '/materials/countertop/6624.webp' },
  mdf: mdfColors.find(m => m.code === '647'),
  chipboard: chipboardColors.find(c => c.code === '17'),
  sink: { name: 'Lena White', code: 'LENA-W', color: '#f4f0ec', image: '/materials/sinks/lena white.avif' },
  activeMaterial: 'mdf',
  // set by a category page's "Apply to design", picked up by the design studio
  pendingApply: null,
})