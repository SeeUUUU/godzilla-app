import os
from PIL import Image

os.makedirs("public/images", exist_ok=True)

def convert_transparent(src, dst):
    if not os.path.exists(src):
        print(f"❌ 파일을 찾을 수 없습니다: {src} (파일이 godzilla-app 폴더에 있는지 확인해주세요)")
        return
    img = Image.open(src).convert("RGBA")
    datas = img.getdata()
    new_data = []
    for item in datas:
        # 캐릭터 색상(청록색/황금색)은 보존하고 배경 흰색(245 이상)만 투명 처리
        if item[0] > 245 and item[1] > 245 and item[2] > 245:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    img.save(dst, "PNG")
    print(f"✅ 변환 완료: {dst}")

convert_transparent("godzilla.jfif", "public/images/godzilla.png")
convert_transparent("Gemini_gidora.jfif", "public/images/king_ghidorah.png")
