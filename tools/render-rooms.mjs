// Renders the placeholder rooms for the 360° studio into public/rooms/<id>/.
//
//   npx vite --port 5199 &           (dev server must be running)
//   node tools/render-rooms.mjs              # all rooms
//   node tools/render-rooms.mjs kitchen 1.2  # one room, custom exposure
//
// Uses the locally installed Google Chrome through Playwright.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const URL = process.env.GEN_URL || 'http://localhost:5199/tools/room-gen/index.html'
const ALL = ['kitchen', 'living', 'bedroom', 'hallway']
const [only, exposure = '1'] = process.argv.slice(2)

const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] })
const page = await browser.newPage()
page.on('console', m => m.type() === 'error' && console.error('[page]', m.text()))
page.on('pageerror', e => console.error('[page]', e.message))
await page.goto(URL)
await page.waitForFunction(() => window.ready, null, { timeout: 60000 })

for (const id of only ? [only] : ALL) {
  const t0 = Date.now()
  const out = await page.evaluate(([id, ex]) => window.generate(id, ex), [id, Number(exposure)])
  const dir = join(ROOT, 'public', 'rooms', id)
  mkdirSync(dir, { recursive: true })
  const save = (name, dataUrl) => writeFileSync(join(dir, name), Buffer.from(dataUrl.split(',')[1], 'base64'))
  save('beauty.jpg', out.beauty)
  save('mask.png', out.mask)
  save('uv.png', out.uv)
  save('thumb.jpg', out.thumb)
  writeFileSync(join(dir, 'hotspots.json'), JSON.stringify(out.hotspots, null, 2) + '\n')
  console.log(`${id}: done in ${((Date.now() - t0) / 1000).toFixed(1)}s`, out.hotspots)
}
await browser.close()
