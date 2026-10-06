import os
from PIL import Image

def optimize_sprite(src, dst_webp, dst_png, max_height=600):
    if not os.path.exists(src):
        print(f"❌ 파일 없음: {src}")
        return
    img = Image.open(src).convert("RGBA")
    
    # 태블릿 레티나 디스플레이에 선명하게 보일 최적 크기로 리사이징 (세로 최대 600px)
    ratio = max_height / float(img.size[1])
    if ratio < 1.0:
        new_width = int(float(img.size[0]) * ratio)
        img = img.resize((new_width, max_height), Image.Resampling.LANCZOS)
    
    # 1) 초경량 WebP로 저장 (약 80~150KB)
    img.save(dst_webp, "WEBP", quality=85)
    
    # 2) 호환용 최적화 PNG로도 동시 저장
    img.save(dst_png, "PNG", optimize=True)
    
    size_kb = os.path.getsize(dst_webp) / 1024
    print(f"✅ 최적화 완료: {dst_webp} ({size_kb:.1f} KB)")

optimize_sprite("public/images/godzilla.png", "public/images/godzilla.webp", "public/images/godzilla.png")
optimize_sprite("public/images/king_ghidorah.png", "public/images/king_ghidorah.webp", "public/images/king_ghidorah.png")
