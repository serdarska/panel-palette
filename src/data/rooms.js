// Rooms for the design studio (/design).
//
// Every room is a 3-D model built in src/components/Room3D.vue, modelled after
// the reference photos in public/rooms/photos/. `key` places a surface's
// marker (Room3D's anchors). `tile` is how many metres one copy of the decor
// photo covers (its height); `grain` ('h' or 'v') is the way the wood grain
// should run on that surface. Floors are laid as planks, wall panels at
// their real 600 mm width.

export const rooms = [
  {
    id: 'kitchen',
    name: 'Кујна',
    surfaces: [
      { id: 1, key: 'fronts',     label: 'Долни фронтови',  category: 'mdf',        default: '732',         tile: 0.8, grain: 'v' },
      { id: 2, key: 'upper',      label: 'Горни фронтови',  category: 'mdf',        default: '734',         tile: 0.8, grain: 'v' },
      { id: 3, key: 'tall',       label: 'Високи елементи', category: 'mdf',        default: '732',         tile: 0.8, grain: 'v' },
      { id: 4, key: 'island',     label: 'Остров',          category: 'chipboard',  default: '7787',        tile: 1.0, grain: 'h' },
      { id: 5, key: 'worktop',    label: 'Плотна',          category: 'countertop', default: '6624',        tile: 1.4 },
      { id: 6, key: 'backsplash', label: 'Заштитен ѕид',    category: 'countertop', default: '6624',        tile: 1.4 },
      { id: 7, key: 'floor',      label: 'Под',             category: 'laminate',   default: 'termessos-8' },
      { id: 8, key: 'shelves',    label: 'Полици',          category: 'chipboard',  default: '7787',        tile: 1.0, grain: 'h' },
    ],
  },
  {
    // modelled in 3-D after public/rooms/photos/living.png, see Room3D.vue
    id: 'living',
    name: 'Дневна соба',
    surfaces: [
      { id: 1, key: 'tvwall',  label: 'ТВ ѕид',      category: 'mdf',       default: '732',         tile: 0.8, grain: 'v' },
      { id: 2, key: 'slats',   label: 'Ѕидни панели', category: 'panels',    default: '265' },
      { id: 3, key: 'tvunit',  label: 'ТВ комода',   category: 'mdf',       default: '732',         tile: 0.8, grain: 'h' },
      { id: 4, key: 'shelves', label: 'Полици',      category: 'chipboard', default: '7787',        tile: 1.0, grain: 'h' },
      { id: 5, key: 'floor',   label: 'Под',         category: 'laminate',  default: 'termessos-8' },
    ],
  },
  {
    // modelled in 3-D after public/rooms/photos/bedroom.png, see Room3D.vue
    id: 'bedroom',
    name: 'Спална соба',
    surfaces: [
      { id: 1, key: 'wardrobe',   label: 'Плакар',           category: 'mdf',       default: '730',         tile: 0.8, grain: 'v' },
      { id: 3, key: 'slats',      label: 'Ѕидни панели',     category: 'panels',    default: '265' },
      { id: 4, key: 'headboard',  label: 'Табла зад кревет', category: 'chipboard', default: '7789',        tile: 1.0, grain: 'h' },
      { id: 5, key: 'nightstand', label: 'Ноќни шкафчиња',   category: 'mdf',       default: '734',         tile: 0.8, grain: 'h' },
      { id: 6, key: 'floor',      label: 'Под',              category: 'laminate',  default: 'termessos-8' },
    ],
  },
  {
    // modelled in 3-D after public/rooms/photos/hallway.png, see Room3D.vue
    id: 'hallway',
    name: 'Ходник',
    surfaces: [
      { id: 1, key: 'wardrobe', label: 'Плакар',       category: 'mdf',      default: '729',         tile: 0.8, grain: 'v' },
      { id: 2, key: 'slats',    label: 'Ѕидни панели', category: 'panels',   default: '265' },
      { id: 3, key: 'console',  label: 'Конзола',      category: 'mdf',      default: '730',         tile: 0.8, grain: 'h' },
      { id: 4, key: 'floor',    label: 'Под',          category: 'laminate', default: 'termessos-8' },
    ],
  },
]

// material categories that have a surface in some room ("try it in the studio")
export const studioCategories = new Set(rooms.flatMap(r => r.surfaces.map(s => s.category)))
