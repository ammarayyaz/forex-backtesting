import os
import base64
from PIL import Image
import numpy as np

src_path = r'C:/Users/aamma/.gemini/antigravity/brain/be4c584e-648e-4506-882a-32c03fd02820/.user_uploaded/media_1794744753976_0193edab.jpg'
img = Image.open(src_path).convert('RGB')
arr = np.array(img, dtype=float)

# Background color estimation from border
border = np.concatenate([
    arr[0:10, :].reshape(-1, 3),
    arr[-10:, :].reshape(-1, 3),
    arr[:, 0:10].reshape(-1, 3),
    arr[:, -10:].reshape(-1, 3)
])
bg = border.mean(axis=0)

# Distance to background
dist = np.linalg.norm(arr - bg, axis=2)

# High confidence foreground pixels
fg_mask = dist > 150
fg_mean = arr[fg_mask].mean(axis=0)

# Smooth alpha calculation
low_th = 16.0
high_th = 55.0
alpha = np.clip((dist - low_th) / (high_th - low_th), 0.0, 1.0)
alpha = alpha * alpha * (3.0 - 2.0 * alpha)

# Edge decontamination: recover true vibrant foreground color
clean_rgb = np.zeros_like(arr)
for c in range(3):
    f_est = np.where(
        alpha > 0.05,
        (arr[:, :, c] - (1.0 - alpha) * bg[c]) / np.maximum(alpha, 0.05),
        fg_mean[c]
    )
    clean_rgb[:, :, c] = np.clip(f_est, 0.0, 255.0)

rgba = np.dstack([clean_rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])
full_rgba = Image.fromarray(rgba, 'RGBA')

# Crop to logo content
y_indices, x_indices = np.where(alpha > 0.1)
ymin, ymax = y_indices.min(), y_indices.max()
xmin, xmax = x_indices.min(), x_indices.max()
w = xmax - xmin + 1
h = ymax - ymin + 1
size = max(w, h)
cx = (xmin + xmax) // 2
cy = (ymin + ymax) // 2

# Add 8% padding for aesthetic balance in favicons
padded_size = int(size * 1.16)
canvas = Image.new('RGBA', (padded_size, padded_size), (0, 0, 0, 0))
offset_x = padded_size // 2 - cx
offset_y = padded_size // 2 - cy
canvas.paste(full_rgba, (offset_x, offset_y))

# Output directory
out_dir = r'C:/Users/aamma/Downloads/FOREX BACKTESTING/public'
src_assets_dir = r'C:/Users/aamma/Downloads/FOREX BACKTESTING/src/assets'
os.makedirs(out_dir, exist_ok=True)
os.makedirs(src_assets_dir, exist_ok=True)

fav_512 = canvas.resize((512, 512), Image.Resampling.LANCZOS)
fav_180 = canvas.resize((180, 180), Image.Resampling.LANCZOS)
fav_48 = canvas.resize((48, 48), Image.Resampling.LANCZOS)
fav_32 = canvas.resize((32, 32), Image.Resampling.LANCZOS)
fav_16 = canvas.resize((16, 16), Image.Resampling.LANCZOS)

png_512_path = os.path.join(out_dir, 'favicon.png')
fav_512.save(png_512_path)
fav_512.save(os.path.join(out_dir, 'favicon-512x512.png'))
fav_180.save(os.path.join(out_dir, 'apple-touch-icon.png'))
fav_32.save(os.path.join(out_dir, 'favicon-32x32.png'))
fav_16.save(os.path.join(out_dir, 'favicon-16x16.png'))
fav_512.save(os.path.join(src_assets_dir, 'logo.png'))

fav_512.save(
    os.path.join(out_dir, 'favicon.ico'),
    format='ICO',
    sizes=[(16, 16), (32, 32), (48, 48)]
)

# Also create clean SVG with embedded high-res transparent PNG
with open(png_512_path, 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

svg_path = os.path.join(out_dir, 'favicon.svg')
with open(svg_path, 'w', encoding='utf-8') as f:
    f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64}" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>
''')

print('All favicon assets generated successfully with transparent background!')
