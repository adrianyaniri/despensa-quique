import urllib.request
import urllib.parse
from PIL import Image, ImageDraw
import os

def generate_qr_with_logo(url, logo_path, out_png, out_svg):
    os.makedirs(os.path.dirname(out_png), exist_ok=True)
    # 1. Fetch QR PNG (1000x1000 with High error correction ecc=H)
    qr_url = f'https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data={urllib.parse.quote(url)}&ecc=H&margin=15'
    print(f'Fetching QR from {qr_url}...')
    urllib.request.urlretrieve(qr_url, out_png)
    
    # 2. Fetch SVG
    svg_url = f'https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data={urllib.parse.quote(url)}&ecc=H&margin=15&format=svg'
    urllib.request.urlretrieve(svg_url, out_svg)
    
    # 3. Embed Logo
    qr_img = Image.open(out_png).convert('RGBA')
    logo = Image.open(logo_path).convert('RGBA')
    
    badge_size = 230
    logo_size = 210
    
    logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    # Badge (white rounded rectangle)
    badge = Image.new('RGBA', (badge_size, badge_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(badge)
    draw.rounded_rectangle([0, 0, badge_size, badge_size], radius=32, fill=(255, 255, 255, 255), outline=(220, 220, 220, 255), width=3)
    
    # Paste logo onto badge
    offset = (badge_size - logo_size) // 2
    badge.paste(logo, (offset, offset), logo)
    
    # Paste badge onto center of QR
    pos = ((qr_img.width - badge_size) // 2, (qr_img.height - badge_size) // 2)
    qr_img.paste(badge, pos, badge)
    
    qr_img.save(out_png)
    print(f'Saved {out_png} and {out_svg}')

if __name__ == '__main__':
    # 1. Precios QR -> apunta al catalogo publico
    generate_qr_with_logo(
        'https://despensa-quique.vercel.app/precios',
        'public/logo/logo.png',
        'public/qr/qr-precios-1000px.png',
        'public/qr/qr-precios-vector.svg'
    )

    # 2. Instagram QR -> apunta a la redireccion dinamica /ig
    generate_qr_with_logo(
        'https://despensa-quique.vercel.app/ig',
        'public/logo/logo.png',
        'public/qr/qr-instagram-1000px.png',
        'public/qr/qr-instagram-vector.svg'
    )
    print('All QRs generated successfully!')
