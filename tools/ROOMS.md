# Rooms for the 360° design studio

The studio at `/design` shows each room as a 360° panorama and re-textures the
changeable surfaces live in the browser. Each room is a folder in
`public/rooms/<id>/`, and the surfaces are listed in `src/data/rooms.js`.

The rooms in the repo now are **placeholders** rendered by
`tools/render-rooms.mjs`. To get the photo-realistic look, have a 3D artist
render each room in the format below and replace the files. No code changes are
needed as long as the surface ids match `src/data/rooms.js`.

## Files per room

All panoramas are **equirectangular, 2:1, the same size** (4096 × 2048
recommended; 8192 × 4096 also works). The centre of the image is the
direction the visitor faces first, with +x to the right and y up.

| File | What it is |
| --- | --- |
| `beauty.jpg` | The final 360° render. **Every changeable surface must be rendered plain white matte** (linear albedo 0.8, no texture). The viewer uses its brightness as the lighting for whatever material is picked. Everything else (floor, walls, sofa, …) is rendered normally. |
| `mask.png` | Which surface each pixel belongs to. Red channel = surface id × 16 (id 1 → 16, id 2 → 32, … up to 15). Black (0) = not changeable. No anti-aliasing: hard edges, flat colours only. |
| `uv.png` | Where on the surface each pixel is, in metres, so wood grain and stone sit in correct perspective. See the encoding below. |
| `thumb.jpg` | Around 640 × 400 preview for the room picker. |
| `hotspots.json` | `{ "<surface id>": [yaw, pitch] }` in degrees for the markers. Yaw 0 = image centre, positive to the right; pitch positive up. |

### uv.png encoding

For every pixel of a changeable surface, take planar world coordinates in
metres:

- floor-facing / horizontal faces: `u = x`, `v = z`
- faces pointing along ±x: `u = z`, `v = y`
- faces pointing along ±z: `u = x`, `v = y`

Then `U = round((u + 5) / 10 × 4095)` and the same for V (the room must fit
within ±5 m of the origin), and pack the two 12-bit numbers into 8-bit RGB:

```
R = U >> 4
G = V >> 4
B = ((U & 15) << 4) | (V & 15)
```

Save as an 8-bit RGB PNG **with no colour profile**. In Blender this is a
world-position AOV rendered to EXR; we can write the packing script once the
renders exist.

## Adding or changing a room

1. Put the files in `public/rooms/<id>/`.
2. Add or update the entry in `src/data/rooms.js`: surface ids, labels,
   category (`mdf`, `chipboard`, `countertop`, `laminate`), default material code, and
   `tile`, the size in metres one copy of the material photo covers.

## Re-rendering the placeholders

```
npx vite --port 5199 &
node tools/render-rooms.mjs            # all rooms
node tools/render-rooms.mjs kitchen    # one room
```

The scenes are in `tools/room-gen/scenes.js`. The script uses the installed
Google Chrome through Playwright.
