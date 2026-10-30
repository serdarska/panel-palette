// Renders a placeholder room into the files the 360° studio reads
// (beauty.jpg, mask.png, uv.png, thumb.jpg, hotspots.json).
// Driven by tools/render-rooms.mjs through window.generate(roomId).
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { scenes } from './scenes.js'
import { rooms } from '../../src/data/rooms.js'

const W = 4096, H = 2048, CUBE = 2048

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(64, 64)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

// Writes world-space planar texture coordinates (metres, offset by +5 and
// scaled into 0..1 over 10 m) and the surface id of every changeable mesh.
function dataMaterial(id) {
  return new THREE.ShaderMaterial({
    uniforms: { uId: { value: id } },
    vertexShader: /* glsl */`
      varying vec3 vPos; varying vec3 vN;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPos = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform float uId; varying vec3 vPos; varying vec3 vN;
      void main() {
        vec3 n = abs(vN); vec2 uv;
        if (n.y > n.x && n.y > n.z) uv = vPos.xz;
        else if (n.x > n.z)         uv = vPos.zy;
        else                        uv = vPos.xy;
        gl_FragColor = vec4((uv + 5.0) / 10.0, uId / 255.0, 1.0);
      }`,
  })
}

// Turns a cube map into the output images. mode 0 = beauty (tone-mapped sRGB),
// 1 = mask, 2 = packed uv, 3 = perspective thumbnail.
const convert = new THREE.ShaderMaterial({
  uniforms: {
    cube: { value: null }, mode: { value: 0 }, res: { value: new THREE.Vector2() },
    exposure: { value: 1 }, view: { value: new THREE.Vector3() },
  },
  vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: /* glsl */`
    uniform samplerCube cube; uniform int mode; uniform vec2 res; uniform float exposure; uniform vec3 view;
    const float PI = 3.14159265359;
    vec3 equirectDir(vec2 uv) {
      float phi = (uv.x - 0.5) * 2.0 * PI, lat = (uv.y - 0.5) * PI;
      return vec3(sin(phi) * cos(lat), sin(lat), -cos(phi) * cos(lat));
    }
    vec3 neutral(vec3 c) {
      const float start = 0.8 - 0.04, desat = 0.15;
      float x = min(c.r, min(c.g, c.b));
      c -= x < 0.08 ? x - 6.25 * x * x : 0.04;
      float peak = max(c.r, max(c.g, c.b));
      if (peak < start) return c;
      const float d = 1.0 - start;
      float np = 1.0 - d * d / (peak + d - start);
      c *= np / peak;
      return mix(c, vec3(np), 1.0 - 1.0 / (desat * (peak - np) + 1.0));
    }
    vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    vec3 beauty(vec3 dir) { return toSRGB(clamp(neutral(texture(cube, dir).rgb * exposure), 0.0, 1.0)); }
    void main() {
      vec2 px = gl_FragCoord.xy;
      if (mode == 0) {
        vec3 c = vec3(0.0);
        for (int i = 0; i < 4; i++) {
          vec2 o = vec2(i == 0 || i == 3 ? 0.25 : 0.75, i < 2 ? 0.25 : 0.75) - 0.5;
          c += beauty(equirectDir((px + o) / res));
        }
        gl_FragColor = vec4(c / 4.0, 1.0);
      } else if (mode == 3) {
        // view = (yaw, pitch, fov) in radians
        vec2 ndc = px / res * 2.0 - 1.0;
        float t = tan(view.z / 2.0);
        vec3 f = vec3(sin(view.x) * cos(view.y), sin(view.y), -cos(view.x) * cos(view.y));
        vec3 r = normalize(cross(f, vec3(0, 1, 0)));
        vec3 u = cross(r, f);
        gl_FragColor = vec4(beauty(normalize(f + r * ndc.x * t * res.x / res.y + u * ndc.y * t)), 1.0);
      } else {
        vec4 d = texture(cube, equirectDir(px / res));
        float id = floor(d.b * 255.0 + 0.5);
        if (mode == 1) { gl_FragColor = vec4(id * 16.0 / 255.0, 0.0, 0.0, 1.0); return; }
        if (id < 0.5) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
        float u = clamp(floor(d.r * 4095.0 + 0.5), 0.0, 4095.0);
        float v = clamp(floor(d.g * 4095.0 + 0.5), 0.0, 4095.0);
        gl_FragColor = vec4(floor(u / 16.0), floor(v / 16.0), mod(u, 16.0) * 16.0 + mod(v, 16.0), 255.0) / 255.0;
      }
    }`,
})
const quadScene = new THREE.Scene()
quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), convert))
const quadCam = new THREE.Camera()

function readImage(cube, mode, w, h, type, extra = {}) {
  const rt = new THREE.WebGLRenderTarget(w, h)
  Object.assign(convert.uniforms.cube, { value: cube })
  convert.uniforms.mode.value = mode
  convert.uniforms.res.value.set(w, h)
  if (extra.view) convert.uniforms.view.value.copy(extra.view)
  renderer.setRenderTarget(rt)
  renderer.render(quadScene, quadCam)
  const buf = new Uint8Array(w * h * 4)
  renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf)
  renderer.setRenderTarget(null)
  rt.dispose()
  // WebGL rows start at the bottom; images start at the top
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(w, h)
  for (let y = 0; y < h; y++) img.data.set(buf.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4)
  ctx.putImageData(img, 0, 0)
  return { data: img.data, url: canvas.toDataURL(type, 0.9) }
}

// Marker position for each surface: the pixel of that surface closest to
// the surface's average direction, or to `aim` ([yaw, pitch] in degrees) when
// the surface sets one — a floor's average direction is straight down.
function hotspots(mask, surfaces) {
  const acc = {}
  const dir = (x, y) => {
    const phi = ((x + 0.5) / W - 0.5) * 2 * Math.PI
    const lat = (0.5 - (y + 0.5) / H) * Math.PI
    return [Math.sin(phi) * Math.cos(lat), Math.sin(lat), -Math.cos(phi) * Math.cos(lat), Math.cos(lat)]
  }
  for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) {
    const id = Math.round(mask[(y * W + x) * 4] / 16)
    if (!id) continue
    const [dx, dy, dz, w] = dir(x, y)
    const a = (acc[id] ??= { v: [0, 0, 0], best: null, bestDot: -2 })
    a.v[0] += dx * w; a.v[1] += dy * w; a.v[2] += dz * w
  }
  for (const s of surfaces) {
    if (!s.aim || !acc[s.id]) continue
    const [yaw, pitch] = s.aim.map(d => d * Math.PI / 180)
    acc[s.id].v = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)]
  }
  for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) {
    const id = Math.round(mask[(y * W + x) * 4] / 16)
    if (!id) continue
    const a = acc[id]
    const [dx, dy, dz] = dir(x, y)
    const dot = dx * a.v[0] + dy * a.v[1] + dz * a.v[2]
    if (dot > a.bestDot) { a.bestDot = dot; a.best = [dx, dy, dz] }
  }
  const out = {}
  for (const { id } of surfaces) {
    const b = acc[id]?.best
    if (!b) continue
    out[id] = [
      +(Math.atan2(b[0], -b[2]) * 180 / Math.PI).toFixed(2),
      +(Math.asin(b[1]) * 180 / Math.PI).toFixed(2),
    ]
  }
  return out
}

window.generate = async function (roomId, exposure = 1.0) {
  const room = rooms.find(r => r.id === roomId)
  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.45
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x8a7d6e, 0.35))
  const { eye } = await scenes[roomId](scene)

  // beauty
  const beautyRT = new THREE.WebGLCubeRenderTarget(CUBE, { type: THREE.HalfFloatType, generateMipmaps: false })
  const cam = new THREE.CubeCamera(0.02, 40, beautyRT)
  cam.position.copy(eye)
  scene.add(cam)
  cam.update(renderer, scene)

  // mask + uv
  const dataRT = new THREE.WebGLCubeRenderTarget(CUBE, {
    type: THREE.FloatType, generateMipmaps: false,
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
  })
  const mats = {}
  const swapped = []
  scene.traverse(o => {
    if (!o.isMesh) return
    const id = o.userData.surface || 0
    swapped.push([o, o.material])
    o.material = (mats[id] ??= dataMaterial(id))
  })
  const env = scene.environment
  scene.environment = null
  renderer.setClearColor(0x000000, 0)
  cam.renderTarget = dataRT
  cam.update(renderer, scene)
  swapped.forEach(([o, m]) => { o.material = m })
  scene.environment = env

  convert.uniforms.exposure.value = exposure
  const beauty = readImage(beautyRT.texture, 0, W, H, 'image/jpeg')
  const mask = readImage(dataRT.texture, 1, W, H, 'image/png')
  const uv = readImage(dataRT.texture, 2, W, H, 'image/png')
  const v = room.view
  const thumb = readImage(beautyRT.texture, 3, 640, 400, 'image/jpeg', {
    view: new THREE.Vector3(v.yaw * Math.PI / 180, v.pitch * Math.PI / 180, 80 * Math.PI / 180),
  })
  const spots = hotspots(mask.data, room.surfaces)

  beautyRT.dispose(); dataRT.dispose(); pmrem.dispose()
  return { beauty: beauty.url, mask: mask.url, uv: uv.url, thumb: thumb.url, hotspots: spots }
}

window.ready = true
