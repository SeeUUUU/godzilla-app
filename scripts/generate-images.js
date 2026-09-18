import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outputDir = path.resolve('public/images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. King Ghidorah SVG
const ghidorahSvg = `<svg viewBox="0 0 240 220" width="480" height="440" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="kgGoldMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef9c3" />
      <stop offset="25%" stop-color="#fbbf24" />
      <stop offset="65%" stop-color="#d97706" />
      <stop offset="90%" stop-color="#b45309" />
      <stop offset="100%" stop-color="#78350f" />
    </linearGradient>
    <linearGradient id="kgWingMembrane" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="35%" stop-color="#f59e0b" />
      <stop offset="75%" stop-color="#b45309" />
      <stop offset="100%" stop-color="#451a03" />
    </linearGradient>
    <radialGradient id="kgRubyEye" cx="45%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#fca5a5" />
      <stop offset="50%" stop-color="#ef4444" />
      <stop offset="85%" stop-color="#b91c1c" />
      <stop offset="100%" stop-color="#450a0a" />
    </radialGradient>
  </defs>
  <g opacity="0.95">
    <path d="M 95 130 Q 55 60 15 25 Q 48 70 38 115 Q 65 118 78 145 Z" fill="url(#kgWingMembrane)" stroke="#78350f" stroke-width="2.5" />
    <path d="M 95 130 L 15 25" stroke="#fef9c3" stroke-width="2" />
    <path d="M 68 85 L 38 115" stroke="#ca8a04" stroke-width="1.5" />
    <path d="M 125 125 Q 175 35 230 10 Q 195 65 208 112 Q 172 108 150 150 Z" fill="url(#kgWingMembrane)" stroke="#78350f" stroke-width="3" />
    <path d="M 125 125 L 230 10" stroke="#fef9c3" stroke-width="2.5" />
    <path d="M 140 110 L 208 112" stroke="#fde047" stroke-width="2" />
    <path d="M 145 120 L 182 145" stroke="#f59e0b" stroke-width="1.5" />
  </g>
  <g stroke="#fef08a" stroke-width="2" stroke-linecap="round" opacity="0.85">
    <polyline points="20,40 28,52 22,60 32,70" />
    <polyline points="180,30 190,42 184,50 196,58" />
    <polyline points="110,185 105,198 115,204 108,215" />
  </g>
  <path d="M 68 122 Q 95 110 120 122 L 126 180 Q 95 195 62 180 Z" fill="url(#kgGoldMain)" stroke="#713f12" stroke-width="3" />
  <path d="M 74 130 Q 95 122 114 130" stroke="#78350f" stroke-width="2.8" stroke-linecap="round" fill="none" />
  <path d="M 72 144 Q 95 136 116 144" stroke="#78350f" stroke-width="2.8" stroke-linecap="round" fill="none" />
  <path d="M 70 158 Q 95 150 118 158" stroke="#78350f" stroke-width="2.8" stroke-linecap="round" fill="none" />
  <path d="M 68 172 Q 95 164 116 172" stroke="#78350f" stroke-width="2.8" stroke-linecap="round" fill="none" />
  <path d="M 66 180 L 58 210 L 80 210 Z" fill="#ca8a04" stroke="#713f12" stroke-width="2" />
  <path d="M 124 180 L 132 210 L 110 210 Z" fill="#ca8a04" stroke="#713f12" stroke-width="2" />
  <polygon points="56,208 52,212 60,211" fill="#fef08a" />
  <polygon points="66,208 64,213 71,211" fill="#fef08a" />
  <polygon points="122,208 120,213 127,211" fill="#fef08a" />
  <polygon points="132,208 134,213 129,211" fill="#fef08a" />
  <g>
    <path d="M 98 124 Q 90 85 64 55 Q 78 45 92 60 Q 108 85 112 122 Z" fill="url(#kgGoldMain)" stroke="#713f12" stroke-width="3" />
    <path d="M 64 55 L 38 52 Q 28 42 44 34 L 72 38 Q 80 46 64 55 Z" fill="url(#kgGoldMain)" stroke="#713f12" stroke-width="2.5" />
    <path d="M 68 38 L 86 16 L 76 42 Z" fill="#fef08a" stroke="#78350f" stroke-width="2" />
    <path d="M 60 37 L 70 22 L 64 40 Z" fill="#fde047" stroke="#78350f" stroke-width="1.5" />
    <circle cx="46" cy="44" r="4" fill="url(#kgRubyEye)" />
    <circle cx="47" cy="43" r="1.2" fill="#ffffff" />
    <polygon points="38,52 42,46 45,52" fill="#ffffff" />
    <polygon points="46,52 50,46 53,52" fill="#ffffff" />
  </g>
  <g>
    <path d="M 112 124 Q 135 90 118 64 Q 130 52 142 66 Q 138 95 125 125 Z" fill="url(#kgGoldMain)" stroke="#713f12" stroke-width="2.5" />
    <path d="M 118 64 L 96 58 Q 88 48 102 42 L 124 46 Q 130 55 118 64 Z" fill="url(#kgGoldMain)" stroke="#713f12" stroke-width="2.5" />
    <path d="M 122 46 L 142 26 L 130 50 Z" fill="#fef08a" stroke="#78350f" stroke-width="1.8" />
    <circle cx="105" cy="52" r="3.5" fill="url(#kgRubyEye)" />
    <circle cx="106" cy="51" r="1" fill="#ffffff" />
  </g>
  <g>
    <path d="M 85 130 Q 55 106 38 82 Q 48 68 64 78 Q 75 102 92 126 Z" fill="url(#kgGoldMain)" stroke="#713f12" stroke-width="2.5" />
    <path d="M 38 82 L 16 76 Q 8 68 20 60 L 44 64 Q 50 72 38 82 Z" fill="url(#kgGoldMain)" stroke="#713f12" stroke-width="2.5" />
    <path d="M 40 64 L 56 46 L 48 68 Z" fill="#fef08a" stroke="#78350f" stroke-width="1.6" />
    <circle cx="24" cy="70" r="3.5" fill="url(#kgRubyEye)" />
    <circle cx="25" cy="69" r="1" fill="#ffffff" />
  </g>
</svg>`;

// 2. Godzilla generator based on Tier
function getGodzillaSvg(tier) {
  let skinStops = '';
  let bellyStops = '';
  let finStops = '';
  let finIdleStops = '';
  let eyeMarkup = '';
  let dorsalFinsMarkup = '';
  let overlayMarkup = '';
  let bodyStroke = '#1e293b';
  let bodyHighlight = '#334155';

  if (tier === 'chibi') {
    bodyStroke = '#047857';
    bodyHighlight = '#34d399';
    skinStops = `<stop offset="0%" stop-color="#34d399" /><stop offset="35%" stop-color="#10b981" /><stop offset="75%" stop-color="#059669" /><stop offset="100%" stop-color="#047857" />`;
    bellyStops = `<stop offset="0%" stop-color="#bbf7d0" /><stop offset="50%" stop-color="#86efac" /><stop offset="100%" stop-color="#4ade80" />`;
    finStops = `<stop offset="0%" stop-color="#10b981" /><stop offset="40%" stop-color="#34d399" /><stop offset="80%" stop-color="#a7f3d0" /><stop offset="100%" stop-color="#ffffff" />`;
    finIdleStops = `<stop offset="0%" stop-color="#065f46" /><stop offset="50%" stop-color="#059669" /><stop offset="100%" stop-color="#34d399" />`;
    eyeMarkup = `
      <ellipse cx="252" cy="98" rx="8" ry="6.5" fill="#0f172a" />
      <ellipse cx="252" cy="98" rx="7" ry="5.5" fill="#0284c7" />
      <circle cx="254" cy="96" r="2.8" fill="#ffffff" />
      <circle cx="250" cy="100" r="1.3" fill="#ffffff" />
      <ellipse cx="260" cy="112" rx="5" ry="3.5" fill="#f43f5e" opacity="0.5" />
    `;
    dorsalFinsMarkup = `
      <g fill="url(#gFullFinIdle)" stroke="#059669" stroke-width="1.8">
        <ellipse cx="28" cy="190" rx="8" ry="6" />
        <ellipse cx="44" cy="176" rx="10" ry="8" />
        <ellipse cx="64" cy="160" rx="12" ry="10" />
        <ellipse cx="88" cy="140" rx="14" ry="12" />
        <ellipse cx="114" cy="115" rx="17" ry="15" />
        <ellipse cx="146" cy="85" rx="19" ry="18" />
        <ellipse cx="178" cy="68" rx="16" ry="15" />
      </g>
    `;
  } else if (tier === 'minusone') {
    bodyStroke = '#020617';
    bodyHighlight = '#1e293b';
    skinStops = `<stop offset="0%" stop-color="#1e293b" /><stop offset="35%" stop-color="#0f172a" /><stop offset="75%" stop-color="#090d16" /><stop offset="100%" stop-color="#020617" />`;
    bellyStops = `<stop offset="0%" stop-color="#0f172a" /><stop offset="60%" stop-color="#090d16" /><stop offset="100%" stop-color="#020617" />`;
    finStops = `<stop offset="0%" stop-color="#0369a1" /><stop offset="25%" stop-color="#0284c7" /><stop offset="60%" stop-color="#38bdf8" /><stop offset="90%" stop-color="#e0f2fe" /><stop offset="100%" stop-color="#ffffff" />`;
    finIdleStops = `<stop offset="0%" stop-color="#020617" /><stop offset="50%" stop-color="#0f172a" /><stop offset="100%" stop-color="#334155" />`;
    eyeMarkup = `
      <path d="M 243 92 L 261 95 L 258 104 L 244 101 Z" fill="#090d16" />
      <ellipse cx="252" cy="98" rx="6.5" ry="4.8" fill="#fde047" />
      <polygon points="252,93 254,98 252,103 250,98" fill="#020617" />
      <circle cx="254" cy="96" r="1.3" fill="#ffffff" />
    `;
    dorsalFinsMarkup = `
      <g fill="url(#gFullFinIdle)" stroke="#0284c7" stroke-width="2.4">
        <polygon points="18,198 8,180 25,188 22,170 34,182" />
        <polygon points="34,186 18,162 38,174 32,150 48,168" />
        <polygon points="52,172 32,140 54,158 48,128 70,154" />
        <polygon points="74,156 50,116 76,138 70,98 94,132" />
        <polygon points="98,136 72,82 100,114 92,66 122,108" />
        <polygon points="122,112 96,44 126,76 114,24 148,68 152,42 162,104" />
        <polygon points="160,86 142,34 170,58 174,28 190,64 196,48 194,92" />
      </g>
    `;
    overlayMarkup = `
      <g stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round" opacity="0.85">
        <line x1="168" y1="116" x2="192" y2="136" />
        <line x1="178" y1="130" x2="202" y2="148" />
        <line x1="135" y1="156" x2="152" y2="175" />
      </g>
    `;
  } else if (tier === 'evil') {
    bodyStroke = '#000000';
    bodyHighlight = '#374151';
    skinStops = `<stop offset="0%" stop-color="#1f2937" /><stop offset="35%" stop-color="#111827" /><stop offset="75%" stop-color="#030712" /><stop offset="100%" stop-color="#000000" />`;
    bellyStops = `<stop offset="0%" stop-color="#111827" /><stop offset="70%" stop-color="#030712" /><stop offset="100%" stop-color="#000000" />`;
    finStops = `<stop offset="0%" stop-color="#581c87" /><stop offset="30%" stop-color="#9333ea" /><stop offset="65%" stop-color="#c084fc" /><stop offset="90%" stop-color="#38bdf8" /><stop offset="100%" stop-color="#ffffff" />`;
    finIdleStops = `<stop offset="0%" stop-color="#000000" /><stop offset="60%" stop-color="#111827" /><stop offset="100%" stop-color="#1e1b4b" />`;
    eyeMarkup = `
      <ellipse cx="252" cy="99" rx="7.5" ry="5.5" fill="#ffffff" />
      <path d="M 244 94 Q 252 92 260 96" stroke="#581c87" stroke-width="1.8" fill="none" />
    `;
    dorsalFinsMarkup = `
      <g fill="url(#gFullFinIdle)" stroke="#7e22ce" stroke-width="2">
        <path d="M 18 194 L 14 184 L 23 189 L 22 178 L 30 186 Z" />
        <path d="M 32 184 L 28 170 L 38 178 L 36 164 L 46 174 Z" />
        <path d="M 50 172 L 44 152 L 56 163 L 55 146 L 68 159 Z" />
        <path d="M 72 156 L 62 130 L 78 144 L 76 122 L 92 140 Z" />
        <path d="M 95 138 L 82 104 L 102 122 L 98 94 L 118 116 Z" />
        <path d="M 120 114 L 105 68 L 126 86 L 118 48 L 140 76 L 144 54 L 158 84 L 152 110 Z" />
        <path d="M 158 88 L 152 56 L 168 70 L 172 48 L 186 72 L 194 60 L 192 92 Z" />
      </g>
    `;
  } else if (tier === 'burning') {
    bodyStroke = '#7c2d12';
    bodyHighlight = '#ea580c';
    skinStops = `<stop offset="0%" stop-color="#450a0a" /><stop offset="35%" stop-color="#292524" /><stop offset="75%" stop-color="#1c1917" /><stop offset="100%" stop-color="#0c0a09" />`;
    bellyStops = `<stop offset="0%" stop-color="#ffaa00" /><stop offset="35%" stop-color="#ff4500" /><stop offset="70%" stop-color="#ff2200" /><stop offset="100%" stop-color="#7f1d1d" />`;
    finStops = `<stop offset="0%" stop-color="#991b1b" /><stop offset="25%" stop-color="#ff2200" /><stop offset="60%" stop-color="#ff8800" /><stop offset="90%" stop-color="#ffee55" /><stop offset="100%" stop-color="#ffffff" />`;
    finIdleStops = `<stop offset="0%" stop-color="#450a0a" /><stop offset="50%" stop-color="#7c2d12" /><stop offset="100%" stop-color="#ea580c" />`;
    eyeMarkup = `
      <ellipse cx="252" cy="99" rx="7" ry="5.5" fill="#ff4500" />
      <polygon points="252,94 254,99 252,104 250,99" fill="#ffee55" />
      <circle cx="254" cy="97" r="1.5" fill="#ffffff" />
    `;
    dorsalFinsMarkup = `
      <g fill="url(#gFullFinGlow)" stroke="#fde047" stroke-width="2.2">
        <path d="M 18 194 L 14 184 L 23 189 L 22 178 L 30 186 Z" />
        <path d="M 32 184 L 28 170 L 38 178 L 36 164 L 46 174 Z" />
        <path d="M 50 172 L 44 152 L 56 163 L 55 146 L 68 159 Z" />
        <path d="M 72 156 L 62 130 L 78 144 L 76 122 L 92 140 Z" />
        <path d="M 95 138 L 82 104 L 102 122 L 98 94 L 118 116 Z" />
        <path d="M 120 114 L 105 68 L 126 86 L 118 48 L 140 76 L 144 54 L 158 84 L 152 110 Z" />
        <path d="M 158 88 L 152 56 L 168 70 L 172 48 L 186 72 L 194 60 L 192 92 Z" />
      </g>
    `;
    overlayMarkup = `
      <g opacity="0.95">
        <path d="M 166 114 Q 188 126 182 146 Q 174 162 160 172" stroke="#ff2200" stroke-width="3.5" stroke-linecap="round" fill="none" />
        <path d="M 175 120 Q 198 132 192 152" stroke="#ffaa00" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <path d="M 185 82 Q 212 86 222 102" stroke="#ff2200" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M 140 144 Q 158 154 152 176" stroke="#ff8800" stroke-width="3" stroke-linecap="round" fill="none" />
        <circle cx="195" cy="115" r="2.2" fill="#ffee55" />
        <circle cx="210" cy="128" r="2.6" fill="#ff2200" />
        <circle cx="178" cy="140" r="2.2" fill="#ffaa00" />
      </g>
    `;
  } else {
    // classic
    bodyStroke = '#1e293b';
    bodyHighlight = '#334155';
    skinStops = `<stop offset="0%" stop-color="#334155" /><stop offset="35%" stop-color="#1e293b" /><stop offset="75%" stop-color="#0f172a" /><stop offset="100%" stop-color="#020617" />`;
    bellyStops = `<stop offset="0%" stop-color="#1e293b" /><stop offset="70%" stop-color="#0f172a" /><stop offset="100%" stop-color="#050811" />`;
    finStops = `<stop offset="0%" stop-color="#1d4ed8" /><stop offset="25%" stop-color="#0284c7" /><stop offset="60%" stop-color="#00f0ff" /><stop offset="90%" stop-color="#a5f3fc" /><stop offset="100%" stop-color="#ffffff" />`;
    finIdleStops = `<stop offset="0%" stop-color="#090d16" /><stop offset="45%" stop-color="#1e293b" /><stop offset="85%" stop-color="#334155" /><stop offset="100%" stop-color="#64748b" />`;
    eyeMarkup = `
      <ellipse cx="252" cy="99" rx="7" ry="5.5" fill="#f59e0b" />
      <polygon points="252,94 254,99 252,104 250,99" fill="#020617" />
      <circle cx="254" cy="97" r="1.5" fill="#ffffff" />
    `;
    dorsalFinsMarkup = `
      <g fill="url(#gFullFinIdle)" stroke="#334155" stroke-width="2">
        <path d="M 18 194 L 14 184 L 23 189 L 22 178 L 30 186 Z" />
        <path d="M 32 184 L 28 170 L 38 178 L 36 164 L 46 174 Z" />
        <path d="M 50 172 L 44 152 L 56 163 L 55 146 L 68 159 Z" />
        <path d="M 72 156 L 62 130 L 78 144 L 76 122 L 92 140 Z" />
        <path d="M 95 138 L 82 104 L 102 122 L 98 94 L 118 116 Z" />
        <path d="M 120 114 L 105 68 L 126 86 L 118 48 L 140 76 L 144 54 L 158 84 L 152 110 Z" />
        <path d="M 158 88 L 152 56 L 168 70 L 172 48 L 186 72 L 194 60 L 192 92 Z" />
      </g>
    `;
  }

  return `<svg viewBox="0 0 320 220" width="640" height="440" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gFullSkin" x1="0%" y1="0%" x2="100%" y2="100%">${skinStops}</linearGradient>
      <linearGradient id="gFullBelly" x1="0%" y1="0%" x2="50%" y2="100%">${bellyStops}</linearGradient>
      <linearGradient id="gFullFinGlow" x1="0%" y1="100%" x2="60%" y2="0%">${finStops}</linearGradient>
      <linearGradient id="gFullFinIdle" x1="0%" y1="100%" x2="60%" y2="0%">${finIdleStops}</linearGradient>
    </defs>
    <!-- Tail -->
    <path d="M 125 155 Q 85 160 55 178 Q 28 194 15 198 Q 25 210 50 208 Q 85 204 115 192 L 140 175 Z" fill="url(#gFullSkin)" stroke="${bodyStroke}" stroke-width="2.5" />
    <path d="M 85 172 Q 78 188 88 198" stroke="${bodyHighlight}" stroke-width="2" stroke-linecap="round" fill="none" />
    <path d="M 60 182 Q 54 194 62 204" stroke="${bodyHighlight}" stroke-width="2" stroke-linecap="round" fill="none" />
    <!-- Dorsal Fins -->
    ${dorsalFinsMarkup}
    <!-- Leg -->
    <path d="M 112 170 L 105 204 L 128 206 L 132 175 Z" fill="#090d16" />
    <path d="M 132 135 Q 165 140 162 172 Q 160 198 142 208 L 122 208 Q 112 195 118 168 Q 120 145 132 135 Z" fill="url(#gFullSkin)" stroke="${bodyStroke}" stroke-width="2.5" />
    <path d="M 136 150 Q 152 160 148 185" stroke="${bodyHighlight}" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <path d="M 122 202 L 115 210 L 162 210 L 156 202 Z" fill="url(#gFullBelly)" stroke="${bodyStroke}" stroke-width="2" />
    <polygon points="128,207 124,213 133,212" fill="#f8fafc" stroke="#475569" stroke-width="0.8" />
    <polygon points="140,207 138,214 146,212" fill="#f8fafc" stroke="#475569" stroke-width="0.8" />
    <polygon points="152,207 154,214 159,211" fill="#f8fafc" stroke="#475569" stroke-width="0.8" />
    <!-- Chest / Belly -->
    <path d="M 160 108 Q 185 105 208 128 Q 205 160 160 175 Q 148 150 160 108 Z" fill="url(#gFullBelly)" stroke="${bodyStroke}" stroke-width="2" />
    <path d="M 172 128 Q 192 135 188 152" stroke="${bodyHighlight}" stroke-width="2.2" stroke-linecap="round" fill="none" />
    <!-- Arm -->
    <path d="M 188 135 Q 212 142 225 152 L 216 160 Q 200 152 182 148 Z" fill="url(#gFullSkin)" stroke="${bodyStroke}" stroke-width="2" />
    <polygon points="224,150 232,152 225,155" fill="#f8fafc" stroke="#475569" stroke-width="0.8" />
    <polygon points="222,154 230,158 223,160" fill="#f8fafc" stroke="#475569" stroke-width="0.8" />
    <!-- Neck / Jaw -->
    <path d="M 175 80 Q 205 75 224 98 Q 235 116 230 135 L 205 130 Q 185 105 175 80 Z" fill="url(#gFullSkin)" stroke="${bodyStroke}" stroke-width="2" />
    <path d="M 230 124 Q 252 118 282 126 L 276 148 Q 248 148 228 138 Z" fill="#881337" stroke="#4c0519" stroke-width="1.5" />
    <path d="M 198 118 Q 210 88 238 84 Q 265 82 284 94 Q 296 104 292 116 L 276 124 Q 255 120 230 122 Z" fill="url(#gFullSkin)" stroke="${bodyStroke}" stroke-width="2.5" />
    <ellipse cx="284" cy="104" rx="2.5" ry="3.5" fill="#020617" transform="rotate(15 284 104)" />
    <!-- Eye -->
    ${eyeMarkup}
    <!-- Teeth -->
    <g fill="#f8fafc" stroke="#475569" stroke-width="0.8">
      <polygon points="236,122 240,129 243,122" />
      <polygon points="246,121 250,130 253,121" />
      <polygon points="256,121 261,133 264,121" />
      <polygon points="267,120 272,129 275,120" />
      <polygon points="277,119 282,127 285,119" />
    </g>
    <!-- Lower Jaw -->
    <path d="M 224 135 L 260 142 Q 286 148 282 162 Q 265 168 242 162 L 215 148 Z" fill="url(#gFullSkin)" stroke="${bodyStroke}" stroke-width="2.5" />
    <g fill="#f8fafc" stroke="#475569" stroke-width="0.8">
      <polygon points="232,136 236,128 239,136" />
      <polygon points="242,138 247,129 250,139" />
      <polygon points="254,140 259,130 262,141" />
      <polygon points="265,142 270,132 274,143" />
    </g>
    ${overlayMarkup}
  </svg>`;
}

async function generateAll() {
  console.log('Generating PNG images into public/images/ ...');

  // Ghidorah
  await sharp(Buffer.from(ghidorahSvg))
    .png()
    .toFile(path.join(outputDir, 'ghidorah.png'));
  console.log('Saved ghidorah.png');

  // Godzillas
  const tiers = ['chibi', 'classic', 'minusone', 'evil', 'burning'];
  for (const tier of tiers) {
    const svg = getGodzillaSvg(tier);
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(outputDir, `godzilla-${tier}.png`));
    console.log(`Saved godzilla-${tier}.png`);
  }

  // Also create generic godzilla.png (pointing to classic) and numeric versions
  await sharp(Buffer.from(getGodzillaSvg('classic')))
    .png()
    .toFile(path.join(outputDir, 'godzilla.png'));

  // Numeric backups
  await sharp(Buffer.from(getGodzillaSvg('chibi'))).png().toFile(path.join(outputDir, 'godzilla-1.png'));
  await sharp(Buffer.from(getGodzillaSvg('classic'))).png().toFile(path.join(outputDir, 'godzilla-2.png'));
  await sharp(Buffer.from(getGodzillaSvg('minusone'))).png().toFile(path.join(outputDir, 'godzilla-3.png'));
  await sharp(Buffer.from(getGodzillaSvg('evil'))).png().toFile(path.join(outputDir, 'godzilla-4.png'));
  await sharp(Buffer.from(getGodzillaSvg('burning'))).png().toFile(path.join(outputDir, 'godzilla-5.png'));

  console.log('All images generated successfully!');
}

generateAll().catch(console.error);
