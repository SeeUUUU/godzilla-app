import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outputDir = path.resolve('public/icons');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function createPwaIcons() {
  const godzillaImgPath = path.resolve('public/images/godzilla.png');
  const godzillaBuffer = await sharp(godzillaImgPath).toBuffer();

  // 1. 512x512 기본 마스터 아이콘 디자인
  // 세련된 사이버/게이밍 테마 다크 그라디언트 + 네온 링 + 중앙 고질라
  const createBaseSvg = (size, isMaskable = false) => {
    const scale = size / 512;
    const padding = isMaskable ? 80 * scale : 40 * scale;
    const contentSize = size - padding * 2;

    return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- 배경 그라디언트: 심해의 짙은 네이비 ~ 우주적 퍼플 -->
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#020617" />
          <stop offset="40%" stop-color="#0f172a" />
          <stop offset="70%" stop-color="#1e1b4b" />
          <stop offset="100%" stop-color="#090d16" />
        </linearGradient>

        <!-- 네온 링 오라 그라디언트 -->
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#06b6d4" />
          <stop offset="50%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>

        <!-- 방사형 발광 효과 -->
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.35" />
          <stop offset="60%" stop-color="#3b82f6" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#020617" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- 배경 사각형 (Maskable 호환용 꽉 찬 배경) -->
      <rect width="${size}" height="${size}" fill="url(#bgGrad)" />

      <!-- 중앙 에너지 발광 -->
      <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.45}" fill="url(#centerGlow)" />

      <!-- 네온 서클 프레임 -->
      <circle 
        cx="${size / 2}" 
        cy="${size / 2}" 
        r="${isMaskable ? size * 0.38 : size * 0.42}" 
        fill="none" 
        stroke="url(#ringGrad)" 
        stroke-width="${Math.max(2, 4 * scale)}" 
        stroke-opacity="0.6" 
        stroke-dasharray="${isMaskable ? 'none' : '10 5'}" 
      />

      <!-- 앱 이름 뱃지 바닥 살짝 -->
      <text 
        x="${size / 2}" 
        y="${size - (isMaskable ? 42 * scale : 24 * scale)}" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${Math.round(23 * scale)}px" 
        font-weight="900" 
        text-anchor="middle" 
        fill="#38bdf8" 
        letter-spacing="1.5"
        opacity="0.95"
      >GODZILLA QUEST</text>
    </svg>
    `;
  };

  const sizes = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'icon-maskable-192.png', size: 192, maskable: true },
    { name: 'icon-maskable-512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
  ];

  for (const { name, size, maskable } of sizes) {
    const bgSvg = Buffer.from(createBaseSvg(size, maskable));
    const characterSize = Math.round(maskable ? size * 0.62 : size * 0.74);

    const resizedCharacter = await sharp(godzillaBuffer)
      .resize(characterSize, characterSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    const charTop = Math.round((size - characterSize) / 2 - (maskable ? 10 * (size / 512) : 12 * (size / 512)));
    const charLeft = Math.round((size - characterSize) / 2);

    const finalImage = await sharp(bgSvg)
      .composite([
        {
          input: resizedCharacter,
          top: charTop,
          left: charLeft,
        }
      ])
      .png()
      .toFile(path.join(outputDir, name));

    console.log(`Generated: ${name} (${size}x${size})`);
  }

  // public/favicon.png 생성
  await sharp(path.join(outputDir, 'icon-192.png'))
    .resize(48, 48)
    .png()
    .toFile(path.resolve('public/favicon.png'));
  console.log('Generated: public/favicon.png (48x48)');

  // apple-touch-icon을 public 바로 아래에도 복사 (iOS 기본 호환)
  await fs.promises.copyFile(
    path.join(outputDir, 'apple-touch-icon.png'),
    path.resolve('public/apple-touch-icon.png')
  );
  console.log('Copied to public/apple-touch-icon.png');
}

createPwaIcons().catch(err => {
  console.error('Failed to generate PWA icons:', err);
  process.exit(1);
});
