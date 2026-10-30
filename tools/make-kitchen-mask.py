"""Build public/materials/kitchen-mask.png from public/materials/kitchen.jpeg.

The mask packs one zone per channel — R = cabinet fronts (MDF), G = decorative
boards (the tall column), B = worktop — and KitchenPhoto.vue uses it to recolour
those surfaces while keeping the photo's own shading and reflections.

Zones are hand-traced polygons; the fronts and the column are additionally
filtered by colour so handles, gaps and appliances keep their own look.
Re-run after editing the polygons:  python3 tools/make-kitchen-mask.py

Also prints the per-zone luminance stats (median, 88th percentile) that
KitchenPhoto.vue hard-codes in its ZONES table — update them if they change.
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCR = os.path.join(ROOT, 'public', 'materials')
SRC = os.path.join(SCR, 'kitchen.jpeg')
OUT = 1536

im = Image.open(SRC).convert('RGB')
W, H = im.size
a = np.asarray(im).astype(np.int16)
R, G, B = a[:,:,0], a[:,:,1], a[:,:,2]
mxc = a.max(2); mnc = a.min(2)
V = mxc / 255.0
S = np.where(mxc > 0, (mxc - mnc) / np.maximum(mxc, 1), 0)

FRONT_POLYS = [
    [(0,0),(0.205,0),(0.288,0.127),(0.288,0.268),(0.213,0.268),(0.213,0.210),
     (0.104,0.210),(0.098,0.386),(0,0.378)],                      # left-wall uppers
    [(0.286,0.127),(0.706,0.129),(0.706,0.266),(0.286,0.268)],    # back uppers, top row
    [(0.212,0.250),(0.400,0.254),(0.400,0.428),(0.212,0.446)],    # back uppers, left of hood
    [(0.596,0.252),(0.706,0.250),(0.706,0.430),(0.596,0.428)],    # back uppers, right of hood
    [(0.333,0.616),(0.712,0.613),(0.712,0.803),(0.333,0.820)],    # base run, back wall
    [(0,0.838),(0.332,0.616),(0.333,0.822),(0.156,1.0),(0,1.0)],  # peninsula base run
]
DECOR_POLYS = [
    [(0.714,0.101),(0.856,0.098),(0.856,0.818),(0.714,0.816)],    # tall column, right
]
COUNTER_POLYS = [
    [(0.332,0.600),(0.450,0.598),(0.620,0.596),(0.712,0.594),
     (0.712,0.617),(0.450,0.618),(0.332,0.620)],                  # worktop, back wall
    [(0.332,0.600),(0.332,0.620),(0,0.843),(0,0.652),(0.150,0.618),
     (0.230,0.606)],                                              # worktop, peninsula
]
SINK_ZONE = [
    [(0.090,0.575),(0.325,0.575),(0.330,0.645),(0.100,0.730)],    # around sink + tap
]
EXCLUDE_POLYS = [
    [(0.072,0.470),(0.126,0.470),(0.126,0.634),(0.072,0.634)],    # tap
    [(0,0.590),(0.108,0.590),(0.108,0.762),(0,0.762)],            # fruit bowl
    [(0.395,0.492),(0.586,0.490),(0.586,0.602),(0.395,0.604)],    # hob + pot
    [(0.592,0.496),(0.702,0.496),(0.702,0.592),(0.592,0.592)],    # utensils + tray
    [(0,0.395),(0.152,0.395),(0.152,0.606),(0,0.606)],            # window + sill
    [(0.156,1.0),(0.333,0.822),(0.724,0.800),(0.862,0.812),
     (1.0,0.856),(1.0,1.0)],                                      # floor
]

def poly_mask(polys):
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m)
    for p in polys:
        d.polygon([(x*W, y*H) for x, y in p], fill=255)
    return np.asarray(m) > 127

def poly_alpha(polys, ss=4):
    """Anti-aliased polygon coverage in [0,1]."""
    m = Image.new('L', (W//2*ss, H//2*ss), 0)
    d = ImageDraw.Draw(m)
    for p in polys:
        d.polygon([(x*W//2*ss, y*H//2*ss) for x, y in p], fill=255)
    return np.asarray(m.resize((W, H), Image.LANCZOS)).astype(float)/255.0

def clean(m, open_r=2, close_r=3):
    img = Image.fromarray((m*255).astype(np.uint8))
    img = img.filter(ImageFilter.MinFilter(open_r*2+1)).filter(ImageFilter.MaxFilter(open_r*2+1))
    img = img.filter(ImageFilter.MaxFilter(close_r*2+1)).filter(ImageFilter.MinFilter(close_r*2+1))
    return np.asarray(img) > 127

keep = ~poly_mask(EXCLUDE_POLYS)
cab  = (R >= B+4) & (R >= G-2) & (G >= B-3) & (V > 0.13) & (V < 0.995) & (S > 0.02) & (S < 0.52)

fronts = clean(poly_mask(FRONT_POLYS) & cab & keep, 1, 2).astype(float)
decor  = clean(poly_mask(DECOR_POLYS) & cab & keep, 1, 2).astype(float)

# worktop: hard inside the dark stone, fading out over bright reflections
steel   = poly_alpha(SINK_ZONE) * np.clip((V - 0.46)/0.10, 0, 1)
counter = np.clip(poly_alpha(COUNTER_POLYS) - poly_alpha(EXCLUDE_POLYS) - steel, 0, 1)

def soften(m, r=1.2):
    return np.asarray(Image.fromarray((m*255).clip(0,255).astype(np.uint8))
                      .filter(ImageFilter.GaussianBlur(r))).astype(float)/255.0

fronts, decor, counter = soften(fronts), soften(decor), soften(counter)

stack = np.stack([fronts, decor, counter], -1)
Image.fromarray((stack*255).astype(np.uint8)).resize((OUT, OUT), Image.LANCZOS)\
     .save(os.path.join(SCR, 'kitchen-mask.png'), optimize=True)

L = 0.2126*R + 0.7152*G + 0.0722*B
for n, m in (('fronts',fronts),('decor',decor),('counter',counter)):
    w = m > 0.5
    print(f"{n}: cover={w.mean():.4f} anchor(median)={np.median(L[w]):.1f} "
          f"phi(p88)={np.percentile(L[w],88):.1f}")
