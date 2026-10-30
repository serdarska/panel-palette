// Rooms for the 360° design studio (/design).
//
// Every room lives in public/rooms/<id>/ as three equirectangular images
// (2:1, same size) plus a thumbnail — see tools/ROOMS.md for the full spec:
//   beauty.jpg  the 360° render, changeable surfaces rendered plain white
//   mask.png    red channel = surface id × 16 (0 = not changeable)
//   uv.png      texture coordinates of the changeable surfaces, 12-bit packed
//   thumb.jpg   small preview for the room picker
//   hotspots.json  surface id → [yaw, pitch] in degrees for the markers
//                  (a surface's `aim` steers its marker, e.g. floors)
//
// `id` here must match the id painted into mask.png. `tile` is how many metres
// one copy of the material photo covers (its height); `rotate` turns the grain 90°.
// Laminate photos span about 1.45 m across, so floors use 0.7 (~19 cm planks).
// The placeholder rooms are produced by tools/render-rooms.mjs.

export const rooms = [
  {
    id: 'kitchen',
    name: 'Кујна',
    view: { yaw: 0, pitch: -8, fov: 75 },
    surfaces: [
      { id: 1, key: 'fronts',     label: 'Долни фронтови',  category: 'mdf',        default: '730',       tile: 0.7 },
      { id: 4, key: 'upper',      label: 'Горни фронтови',  category: 'mdf',        default: '647',       tile: 0.7 },
      { id: 2, key: 'carcass',    label: 'Корпус',          category: 'chipboard',  default: '17',        tile: 0.9 },
      { id: 5, key: 'island',     label: 'Остров',          category: 'chipboard',  default: '7789',      tile: 0.9 },
      { id: 3, key: 'worktop',    label: 'Плотна',          category: 'countertop', default: '6624 MATT', tile: 1.4 },
      { id: 6, key: 'backsplash', label: 'Заштитен ѕид',    category: 'countertop', default: '6624 MATT', tile: 1.4 },
      { id: 7, key: 'floor',      label: 'Под',             category: 'laminate',   default: 'mimoza-10', tile: 0.7, aim: [25, -40] },
    ],
  },
  {
    id: 'living',
    name: 'Дневна соба',
    view: { yaw: 0, pitch: -6, fov: 78 },
    surfaces: [
      { id: 1, key: 'tvwall',  label: 'ТВ ѕид',       category: 'chipboard',  default: '7787',      tile: 1.0 },
      { id: 2, key: 'slats',   label: 'Летви',        category: 'chipboard',  default: '7789',      tile: 1.0 },
      { id: 3, key: 'tvunit',  label: 'ТВ комода',    category: 'mdf',        default: '6022',      tile: 0.7 },
      { id: 4, key: 'shelves', label: 'Полици',       category: 'chipboard',  default: '102',       tile: 0.9 },
      { id: 5, key: 'table',   label: 'Маса',         category: 'countertop', default: '6645 GLOSS', tile: 1.2 },
      { id: 6, key: 'floor',   label: 'Под',          category: 'laminate',   default: 'mimoza-10',  tile: 0.7, aim: [-30, -35] },
    ],
  },
  {
    id: 'bedroom',
    name: 'Спална соба',
    view: { yaw: -20, pitch: -6, fov: 78 },
    surfaces: [
      { id: 1, key: 'wardrobe',  label: 'Плакар — фронтови', category: 'mdf',       default: '734', tile: 0.7 },
      { id: 2, key: 'carcass',   label: 'Плакар — корпус',   category: 'chipboard', default: '17',  tile: 0.9 },
      { id: 3, key: 'headboard', label: 'Табла за кревет',   category: 'chipboard', default: '7791', tile: 1.0 },
      { id: 4, key: 'nightstand',label: 'Ноќни шкафчиња',    category: 'mdf',       default: '733', tile: 0.7 },
      { id: 5, key: 'floor',     label: 'Под',               category: 'laminate',  default: 'natura-mese-8', tile: 0.7, aim: [-40, -40] },
    ],
  },
  {
    id: 'hallway',
    name: 'Ходник',
    view: { yaw: 0, pitch: -8, fov: 78 },
    surfaces: [
      { id: 1, key: 'shoes',    label: 'Чевлар — фронтови', category: 'mdf',       default: '647',  tile: 0.7 },
      { id: 2, key: 'carcass',  label: 'Корпус',            category: 'chipboard', default: '17',   tile: 0.9 },
      { id: 3, key: 'panel',    label: 'Ѕиден панел',       category: 'chipboard', default: '7789', tile: 1.0 },
      { id: 4, key: 'wardrobe', label: 'Плакар',            category: 'mdf',       default: '730',  tile: 0.7 },
      { id: 5, key: 'floor',    label: 'Под',               category: 'laminate',  default: 'termessos-8', tile: 0.7, aim: [0, -35] },
    ],
  },
]
