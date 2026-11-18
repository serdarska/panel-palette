// Catalogue categories shown in the sidebar, on the home page and at
// /materials/<key>. `kind: 'material'` = board decors that can be tried in the
// design studio; `kind: 'product'` = items shown as product photos.
// Covers show the product itself: one board photo for materials, cut-outs for products.
import { mdfColors, chipboardColors, countertops, laminates, wallPanels, glassFronts, sinks, faucets } from './materials.js'

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
    covers: ['/materials/countertop/trimmed/6624 mat.webp'],
  },
  {
    // the worktop decors that also come as wall cladding (4100 × 650 × 12 mm).
    // Same decors as the countertops, so in the studio they go on the
    // kitchen's backsplash, a countertop surface that only takes `wall` decors
    key: 'countertopWall', kind: 'material', data: countertops.filter(c => c.wall),
    studio: { category: 'countertop', only: 'wall' },
    covers: ['/materials/countertop/trimmed/6660.webp'],
  },
  {
    key: 'laminate', kind: 'material', data: laminates,
    covers: ['/materials/flooring/laminat 10mm/MARVEL 10mm example.webp'],
  },
  {
    key: 'panels', kind: 'material', data: wallPanels,
    covers: ['/materials/dekorativni dzidni paneli/249_Anti_Walnut.jpg'],
  },
  {
    // counted in variants ("3 варијанти") rather than decors
    key: 'glass', kind: 'material', data: glassFronts, unit: 'variants',
    covers: ['/materials/glass/3 designs.webp'],
  },
  {
    key: 'sinks', kind: 'product', data: sinks,
    covers: ['/materials/sinks/ines dark beige.avif', '/materials/sinks/ewelina white.avif', '/materials/sinks/selena black matt.avif'],
  },
  {
    key: 'faucets', kind: 'product', data: faucets,
    covers: ['/materials/faucets/lola gray.avif', '/materials/faucets/solo gray.avif', '/materials/faucets/lola white.avif'],
  },
]

export const categoryKeys = categories.map(c => c.key)
export const getCategory = key => categories.find(c => c.key === key)
