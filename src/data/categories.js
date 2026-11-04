// Catalogue categories shown in the sidebar, on the home page and at
// /materials/<key>. `kind: 'material'` = board decors that can be tried in the
// design studio; `kind: 'product'` = items shown as product photos.
// Covers show the product itself: one board photo for materials, cut-outs for products.
import { mdfColors, chipboardColors, countertops, laminates, wallPanels, sinks, faucets } from './materials.js'

export const categories = [
  {
    key: 'mdf', kind: 'material', data: mdfColors,
    covers: ['/materials/mdf/HG Cool Gri example.webp'],
  },
  {
    key: 'chipboard', kind: 'material', data: chipboardColors,
    covers: ['/materials/chipboard/Senkron Asya 328 example.jpg'],
  },
  {
    key: 'countertop', kind: 'material', data: countertops,
    covers: ['/materials/countertop/6624.webp'],
  },
  {
    key: 'laminate', kind: 'material', data: laminates,
    covers: ['/materials/flooring/laminat 10mm/MARVEL 10mm example.webp'],
  },
  {
    key: 'panels', kind: 'material', data: wallPanels,
    covers: ['/materials/dekorativni dzidni paneli/329_Seul.jpg'],
  },
  {
    key: 'sinks', kind: 'product', data: sinks,
    covers: ['/materials/sinks/ines dark beige.avif', '/materials/sinks/lena white.avif', '/materials/sinks/arona black matt.avif'],
  },
  {
    key: 'faucets', kind: 'product', data: faucets,
    covers: ['/materials/faucets/lola beige.avif', '/materials/faucets/solo black.avif', '/materials/faucets/lola white.avif'],
  },
]

export const categoryKeys = categories.map(c => c.key)
export const getCategory = key => categories.find(c => c.key === key)
