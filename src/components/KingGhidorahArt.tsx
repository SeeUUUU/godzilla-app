import React from 'react';

/**
 * 킹 기도라 SVG 아트 (viewBox 336 x 220)
 *
 * - 레이아웃 기준 박스(240 x 220)보다 가로로 1.4배(336) 넓게 그려, 왼쪽(고질라 방향)으로
 *   뻗는 3개의 목/머리와 우측 상단을 뒤덮는 거대한 날개를 한 장에 담는다.
 * - 부모(KingGhidorah)가 오른쪽/아래 기준으로 width 140% 로 배치하므로
 *   1 viewBox 단위 = 기존 레이아웃 1 단위로 정확히 일치한다.
 */

interface KingGhidorahArtProps {
  isHit: boolean;
  isDefeated: boolean;
  isWounded: boolean;
  isCritical: boolean;
  isAttacking?: boolean;
  attackPhase?: 'idle' | 'charge' | 'fire' | 'impact';
}

type Pt = [number, number];

const pts = (arr: Pt[]) => arr.map((p) => p.join(',')).join(' ');

/** from → to 선분 위에 일정 간격으로 가시(삼각형)를 생성한다. side: 1 | -1 (진행 방향 기준 좌/우) */
const spikePolys = (from: Pt, to: Pt, count: number, size: number, side: 1 | -1): string[] => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = uy * side;
  const ny = -ux * side;
  const out: string[] = [];
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const cx = from[0] + dx * t;
    const cy = from[1] + dy * t;
    const half = size * 0.45;
    out.push(
      pts([
        [cx - ux * half, cy - uy * half],
        [cx + nx * size + ux * half * 0.4, cy + ny * size + uy * half * 0.4],
        [cx + ux * half, cy + uy * half],
      ])
    );
  }
  return out;
};

/** 날개 손가락 끝의 날카로운 발톱 */
const clawPoly = (base: Pt, from: Pt, length: number): string => {
  const dx = base[0] - from[0];
  const dy = base[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy * 3.2;
  const py = ux * 3.2;
  return pts([
    [base[0] + px, base[1] + py],
    [base[0] + ux * length + px * 0.2, base[1] + uy * length + py * 0.2],
    [base[0] - px, base[1] - py],
  ]);
};

/** 지지직 번개 (황금/붉은색 공용) */
const Bolt: React.FC<{
  points: string;
  delay: number;
  dur?: number;
  color: string;
  width?: number;
  rage?: boolean;
}> = ({ points, delay, dur = 2.4, color, width = 2.4, rage = false }) => (
  <g
    className={rage ? 'ghid-bolt ghid-bolt-rage' : 'ghid-bolt'}
    style={{ animationDelay: `${delay}s`, animationDuration: `${dur}s` }}
  >
    <polyline
      points={points}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <polyline
      points={points}
      fill="none"
      stroke={rage ? '#fecaca' : '#ffffff'}
      strokeWidth={rage ? width * 0.22 : width * 0.35}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </g>
);

/** 뱀처럼 굽이치는 S자 목 */
const Neck: React.FC<{ d: string; w: number }> = ({ d, w }) => (
  <g>
    {/* 등쪽 가시 */}
    <path
      d={d}
      fill="none"
      stroke="#92400e"
      strokeWidth={w + 11}
      strokeDasharray="3 11"
      strokeLinecap="butt"
    />
    {/* 외곽선 */}
    <path d={d} fill="none" stroke="#5b210a" strokeWidth={w + 4} strokeLinecap="round" />
    {/* 몸통 */}
    <path d={d} fill="none" stroke="url(#kgd-gold)" strokeWidth={w} strokeLinecap="round" />
    {/* 배 비늘 마디 */}
    <path
      d={d}
      fill="none"
      stroke="#b45309"
      strokeWidth={w - 2}
      strokeDasharray="1.6 7"
      opacity={0.55}
    />
    {/* 광택 */}
    <path
      d={d}
      fill="none"
      stroke="#fff7c2"
      strokeWidth={w * 0.25}
      opacity={0.5}
      strokeLinecap="round"
      transform="translate(0,-2)"
    />
  </g>
);

/** 왼쪽을 향한 용머리 (로컬 좌표 0,0 = 목과의 연결부, 왼쪽이 정면) */
const Head: React.FC<{
  x: number;
  y: number;
  rot: number;
  scale: number;
  animate: boolean;
  eyeBoost: boolean;
  jawDur: number;
}> = ({ x, y, rot, scale, animate, eyeBoost, jawDur }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
    {/* 뒤로 뻗은 황금 뿔 (큰 것) */}
    <path
      d="M4,-8 C16,-26 34,-34 54,-28 C38,-24 26,-16 14,-4 Z"
      fill="url(#kgd-horn)"
      stroke="#92400e"
      strokeWidth="0.8"
    />
    {/* 뒤로 뻗은 황금 뿔 (작은 것) */}
    <path
      d="M0,-4 C8,-14 20,-18 32,-15 C22,-12 14,-8 8,0 Z"
      fill="url(#kgd-horn)"
      stroke="#92400e"
      strokeWidth="0.8"
    />
    {/* 턱 아래 가시 */}
    <path d="M-2,8 L10,22 L8,6 Z" fill="url(#kgd-horn)" stroke="#92400e" strokeWidth="0.7" />

    {/* 입 안쪽 (붉은 어둠) */}
    <path d="M-2,0 L-44,1 L-40,16 L-4,13 Z" fill="#450a0a" />
    <path d="M-12,6 Q-24,12 -34,9 L-30,4 Z" fill="#dc2626" opacity={0.85} />

    {/* 아래턱: 쩍 벌린 입 (로컬 힌지 -2,2) */}
    <g transform="rotate(-24 -2 2)">
      {animate && (
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-17 -2 2;-30 -2 2;-17 -2 2"
          dur={`${jawDur}s`}
          repeatCount="indefinite"
        />
      )}
      <path
        d="M-2,2 L-40,3 L-47,6 L-40,11 L-6,12 Z"
        fill="url(#kgd-gold-dark)"
        stroke="#5b210a"
        strokeWidth="0.8"
      />
      {/* 아래 송곳니 */}
      <polygon points="-38,3 -36,-5 -33,3" fill="#ffffff" stroke="#9ca3af" strokeWidth="0.4" />
      <polygon points="-29,3 -27,-3 -24,3" fill="#ffffff" stroke="#9ca3af" strokeWidth="0.4" />
      <polygon points="-20,3 -18,-2 -15,3" fill="#ffffff" stroke="#9ca3af" strokeWidth="0.4" />
      <polygon points="-11,3 -9,-1 -6,3" fill="#ffffff" stroke="#9ca3af" strokeWidth="0.4" />
    </g>

    {/* 위턱 / 두개골 */}
    <path
      d="M6,-10 C-6,-15 -24,-13 -46,-5 L-50,0 L-42,2 L-4,2 L8,-3 Z"
      fill="url(#kgd-gold)"
      stroke="#5b210a"
      strokeWidth="0.9"
    />
    {/* 위 송곳니 */}
    <polygon points="-45,1 -43,11 -40,1" fill="#ffffff" stroke="#9ca3af" strokeWidth="0.4" />
    <polygon points="-36,2 -34,9 -31,2" fill="#ffffff" stroke="#9ca3af" strokeWidth="0.4" />
    <polygon points="-27,2 -25,8 -22,2" fill="#ffffff" stroke="#9ca3af" strokeWidth="0.4" />
    <polygon points="-18,2 -16,7 -13,2" fill="#ffffff" stroke="#9ca3af" strokeWidth="0.4" />
    <polygon points="-9,2 -7,6 -4,2" fill="#ffffff" stroke="#9ca3af" strokeWidth="0.4" />

    {/* 콧구멍 */}
    <ellipse cx="-43" cy="-3" rx="1.6" ry="1" fill="#450a0a" />

    {/* 험악한 눈썹 */}
    <path d="M-26,-12 L-6,-6 L-8,-9 L-24,-15 Z" fill="#5b210a" />

    {/* 붉은 안광 */}
    <circle
      className="ghid-eye-glow"
      cx="-15"
      cy="-6.5"
      r={eyeBoost ? 11 : 8}
      fill="url(#kgd-eye-glow)"
      style={{ animationDuration: eyeBoost ? '0.35s' : '1.4s' }}
    />
    <path
      d="M-23,-9.5 L-8,-5 L-19,-2.5 Z"
      fill="#ff1a1a"
      stroke="#7f1d1d"
      strokeWidth="0.5"
    />
    <circle cx="-16.5" cy="-6" r="1" fill="#fff5f5" />
  </g>
);

export const KingGhidorahArt: React.FC<KingGhidorahArtProps> = ({
  isHit,
  isDefeated,
  isWounded,
  isCritical,
  isAttacking = false,
  attackPhase,
}) => {
  const alive = !isDefeated;
  const effectivePhase = attackPhase ?? (isAttacking ? 'fire' : 'idle');
  const isCharging = effectivePhase === 'charge';
  const isFiring = effectivePhase === 'fire';
  const isImpacting = effectivePhase === 'impact';
  const isActionActive = isCharging || isFiring || isImpacting || isAttacking;
  const rageLevel = isHit ? 3 : isCritical ? 2 : isWounded ? 1 : 0;
  const rageActive = alive && rageLevel > 0;
  const boltColor = '#fde047';
  const rageColor = '#ef4444';

  // 날개 정보 (어깨 S, 손목 W, 손가락 끝 T1~T4)
  const nearS: Pt = [240, 100];
  const nearW: Pt = [284, 26];
  const nearT: Pt[] = [
    [332, 10],
    [335, 60],
    [322, 116],
    [290, 142],
  ];
  const farS: Pt = [234, 98];
  const farW: Pt = [246, 16];
  const farT: Pt[] = [
    [196, 10],
    [166, 44],
    [174, 90],
    [214, 120],
  ];

  const nearMembrane =
    `M${nearS[0]},${nearS[1]} L${nearW[0]},${nearW[1]} ` +
    `Q306,8 ${nearT[0][0]},${nearT[0][1]} ` +
    `Q306,34 ${nearT[1][0]},${nearT[1][1]} ` +
    `Q308,88 ${nearT[2][0]},${nearT[2][1]} ` +
    `Q302,112 ${nearT[3][0]},${nearT[3][1]} ` +
    `Q266,124 ${nearS[0] + 6},${nearS[1] + 14} Z`;

  const farMembrane =
    `M${farS[0]},${farS[1]} L${farW[0]},${farW[1]} ` +
    `Q222,2 ${farT[0][0]},${farT[0][1]} ` +
    `Q206,32 ${farT[1][0]},${farT[1][1]} ` +
    `Q198,64 ${farT[2][0]},${farT[2][1]} ` +
    `Q208,98 ${farT[3][0]},${farT[3][1]} ` +
    `Q238,110 ${farS[0]},${farS[1] + 10} Z`;

  const necks = {
    n1: 'M228,120 C275,92 244,30 192,36 C152,41 156,58 126,64',
    n2: 'M224,130 C270,132 246,96 204,104 C170,108 168,120 128,128',
    n3: 'M222,142 C252,176 226,200 186,190 C156,183 160,168 128,172',
  };

  return (
    <svg
      viewBox="0 0 336 220"
      width="100%"
      height="100%"
      preserveAspectRatio="xMaxYMax meet"
      overflow="visible"
      style={{ display: 'block', overflow: 'visible' }}
      className={isDefeated ? 'ghid-defeated' : ''}
      role="img"
      aria-label="킹 기도라 (King Ghidorah)"
    >
      <defs>
        <linearGradient id="kgd-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="kgd-gold-dark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="kgd-horn" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="55%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#fffbeb" />
        </linearGradient>
        <linearGradient id="kgd-wing-near" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7f1d1d" />
          <stop offset="55%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="kgd-wing-far" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#450a0a" />
          <stop offset="60%" stopColor="#7c2d12" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <radialGradient id="kgd-eye-glow">
          <stop offset="0%" stopColor="#ff4d4d" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#ef4444" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="kgd-aura-gold" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde047" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="kgd-aura-red" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#b91c1c" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="kgd-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <filter id="kgd-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 공중 부유로 인한 바닥 그림자 (몸체와 반대로 작아졌다 커짐) */}
      <ellipse
        className={alive ? 'ghid-shadow' : ''}
        cx="236"
        cy="213"
        rx="62"
        ry="5"
        fill="url(#kgd-shadow)"
      />

      {/* 전체 부유 그룹 */}
      <g className={alive ? 'ghid-float' : ''}>
        {/* 오라 (평상시 황금 / 위기 시 붉은색) */}
        {alive && (
          <>
            <ellipse
              className="ghid-aura"
              cx="240"
              cy="100"
              rx="104"
              ry="92"
              fill="url(#kgd-aura-gold)"
            />
            {rageActive && (
              <ellipse
                className="ghid-aura-rage"
                cx="220"
                cy="108"
                rx="118"
                ry="98"
                fill="url(#kgd-aura-red)"
                style={{ animationDuration: rageLevel === 3 ? '0.25s' : '0.8s' }}
              />
            )}
          </>
        )}

        {/* ── 뒤쪽 날개 (어둡게, 깊이감) ── */}
        <g className={alive ? 'ghid-wing-far' : ''}>
          <path d={farMembrane} fill="url(#kgd-wing-far)" stroke="#2a0a05" strokeWidth="1.4" strokeLinejoin="round" />
          {farT.map((t, i) => (
            <line key={`fb${i}`} x1={farW[0]} y1={farW[1]} x2={t[0]} y2={t[1]} stroke="#a16207" strokeWidth="2.6" strokeLinecap="round" />
          ))}
          <line x1={farS[0]} y1={farS[1]} x2={farW[0]} y2={farW[1]} stroke="#ca8a04" strokeWidth="4.5" strokeLinecap="round" />
          {spikePolys(farS, farW, 3, 7, -1).map((p, i) => (
            <polygon key={`fs${i}`} points={p} fill="#fde68a" stroke="#92400e" strokeWidth="0.6" />
          ))}
          {farT.map((t, i) => (
            <polygon key={`fc${i}`} points={clawPoly(t, farW, 9)} fill="#fffbeb" stroke="#92400e" strokeWidth="0.5" />
          ))}
        </g>

        {/* ── 앞쪽 거대 날개 (우측 상단을 뒤덮음) ── */}
        <g className={alive ? 'ghid-wing-near' : ''}>
          <path d={nearMembrane} fill="url(#kgd-wing-near)" stroke="#3b0a05" strokeWidth="1.6" strokeLinejoin="round" />
          {/* 막 주름 */}
          {nearT.map((t, i) => (
            <path
              key={`nv${i}`}
              d={`M${nearS[0] + 12},${nearS[1] + 6} Q${(nearS[0] + t[0]) / 2 + 4},${(nearS[1] + t[1]) / 2 + 6} ${t[0] - (t[0] - nearW[0]) * 0.12},${t[1] - (t[1] - nearW[1]) * 0.12}`}
              fill="none"
              stroke="#451a03"
              strokeWidth="0.8"
              opacity={0.35}
            />
          ))}
          {/* 손가락 뼈 */}
          {nearT.map((t, i) => (
            <line key={`nb${i}`} x1={nearW[0]} y1={nearW[1]} x2={t[0]} y2={t[1]} stroke="#fbbf24" strokeWidth="3.2" strokeLinecap="round" />
          ))}
          {/* 팔뼈 */}
          <line x1={nearS[0]} y1={nearS[1]} x2={nearW[0]} y2={nearW[1]} stroke="#fcd34d" strokeWidth="6" strokeLinecap="round" />
          <circle cx={nearW[0]} cy={nearW[1]} r="5" fill="#fde047" stroke="#92400e" strokeWidth="1" />
          {/* 앞날개 가장자리 가시 */}
          {spikePolys(nearS, nearW, 4, 9, -1).map((p, i) => (
            <polygon key={`ns${i}`} points={p} fill="#fff7c2" stroke="#92400e" strokeWidth="0.7" />
          ))}
          {/* 엄지 큰 발톱 */}
          <path d="M284,26 C276,19 274,12 279,6 C282,13 288,19 292,23 Z" fill="#fffbeb" stroke="#92400e" strokeWidth="0.8" />
          {/* 손가락 끝 발톱 */}
          {nearT.map((t, i) => (
            <polygon key={`nc${i}`} points={clawPoly(t, nearW, 11)} fill="#fffbeb" stroke="#92400e" strokeWidth="0.6" />
          ))}
        </g>

        {/* ── 두 갈래 꼬리 ── */}
        <g className={alive ? 'ghid-tail' : ''}>
          <path d="M264,172 C302,166 324,182 318,206" fill="none" stroke="#5b210a" strokeWidth="14" strokeLinecap="round" />
          <path d="M264,172 C302,166 324,182 318,206" fill="none" stroke="url(#kgd-gold)" strokeWidth="10" strokeLinecap="round" />
          <polygon points="311,204 318,219 325,203" fill="#fff7c2" stroke="#92400e" strokeWidth="0.8" />
          <path d="M258,182 C290,202 298,208 276,213" fill="none" stroke="#5b210a" strokeWidth="12" strokeLinecap="round" />
          <path d="M258,182 C290,202 298,208 276,213" fill="none" stroke="url(#kgd-gold)" strokeWidth="8" strokeLinecap="round" />
          <polygon points="276,207 262,214 276,219" fill="#fff7c2" stroke="#92400e" strokeWidth="0.8" />
        </g>

        {/* ── 다리 (공중에 대롱대롱, 날카로운 발톱) ── */}
        <path d="M236,172 L224,198" stroke="#5b210a" strokeWidth="14" strokeLinecap="round" />
        <path d="M236,172 L224,198" stroke="url(#kgd-gold-dark)" strokeWidth="10" strokeLinecap="round" />
        <polygon points="217,200 210,214 221,205" fill="#fffbeb" stroke="#92400e" strokeWidth="0.6" />
        <polygon points="223,202 221,216 228,205" fill="#fffbeb" stroke="#92400e" strokeWidth="0.6" />
        <polygon points="229,200 235,213 232,201" fill="#fffbeb" stroke="#92400e" strokeWidth="0.6" />
        <path d="M258,176 L264,200" stroke="#5b210a" strokeWidth="14" strokeLinecap="round" />
        <path d="M258,176 L264,200" stroke="url(#kgd-gold-dark)" strokeWidth="10" strokeLinecap="round" />
        <polygon points="257,202 253,215 262,206" fill="#fffbeb" stroke="#92400e" strokeWidth="0.6" />
        <polygon points="263,204 263,217 269,206" fill="#fffbeb" stroke="#92400e" strokeWidth="0.6" />
        <polygon points="269,202 276,214 272,202" fill="#fffbeb" stroke="#92400e" strokeWidth="0.6" />

        {/* ── 3개의 목 + 머리 (S자로 고질라를 향해 뻗음) ── */}
        <g className={alive ? (isCharging ? 'ghid-neck-charge ghid-neck-3' : isFiring ? 'ghid-neck-fire ghid-neck-3' : 'ghid-neck ghid-neck-3') : ''}>
          <Neck d={necks.n3} w={14} />
          <Head x={128} y={172} rot={isCharging ? 12 : -7} scale={1.1} animate={alive} eyeBoost={rageActive || isActionActive} jawDur={isActionActive ? 0.2 : 1.9} />
        </g>
        <g className={alive ? (isCharging ? 'ghid-neck-charge ghid-neck-1' : isFiring ? 'ghid-neck-fire ghid-neck-1' : 'ghid-neck ghid-neck-1') : ''}>
          <Neck d={necks.n1} w={14} />
          <Head x={126} y={64} rot={isCharging ? 14 : -8} scale={1.1} animate={alive} eyeBoost={rageActive || isActionActive} jawDur={isActionActive ? 0.2 : 2.3} />
        </g>
        <g className={alive ? (isCharging ? 'ghid-neck-charge ghid-neck-2' : isFiring ? 'ghid-neck-fire ghid-neck-2' : 'ghid-neck ghid-neck-2') : ''}>
          <Neck d={necks.n2} w={16} />
          <Head x={128} y={128} rot={isCharging ? 16 : -10} scale={1.3} animate={alive} eyeBoost={rageActive || isActionActive} jawDur={isActionActive ? 0.16 : 1.6} />
        </g>

        {/* ── 몸통 ── */}
        <g>
          {/* 등 가시 */}
          <polygon points="268,92 284,86 272,106" fill="#92400e" stroke="#5b210a" strokeWidth="0.7" />
          <polygon points="274,112 291,110 276,128" fill="#92400e" stroke="#5b210a" strokeWidth="0.7" />
          <polygon points="277,134 294,136 277,152" fill="#92400e" stroke="#5b210a" strokeWidth="0.7" />
          <polygon points="272,156 288,162 270,172" fill="#92400e" stroke="#5b210a" strokeWidth="0.7" />
          <ellipse cx="244" cy="140" rx="33" ry="49" fill="#5b210a" />
          <ellipse cx="244" cy="140" rx="30" ry="46" fill="url(#kgd-gold)" />
          {/* 배 비늘 */}
          {[104, 116, 128, 140, 152, 164, 176].map((y, i) => (
            <path
              key={`bp${i}`}
              d={`M${232 - (i % 2)},${y} Q${243},${y + 5} ${256 + (i % 2)},${y}`}
              fill="none"
              stroke="#b45309"
              strokeWidth="1.4"
              opacity={0.7}
            />
          ))}
          {/* 가슴 광택 */}
          <ellipse cx="236" cy="118" rx="9" ry="22" fill="#fff7c2" opacity={0.28} />
        </g>

                {/* ── 뇌전 차징 에너지 볼 (입 앞 황금 번개 구체 3개) ── */}
        {alive && isCharging && (
          <g filter="url(#kgd-glow)" style={{ pointerEvents: 'none' }}>
            {/* 상단 머리 입 앞 */}
            <g transform="translate(86 58)" className="ghid-lightning-orb">
              <circle r={14} fill="none" stroke="#fde047" strokeWidth={2.2} strokeDasharray="4 3" />
              <circle r={8} fill="#ffffff" />
            </g>
            {/* 중앙 머리 입 앞 */}
            <g transform="translate(84 122)" className="ghid-lightning-orb">
              <circle r={16} fill="none" stroke="#fde047" strokeWidth={2.5} strokeDasharray="4 3" />
              <circle r={10} fill="#ffffff" />
            </g>
            {/* 하단 머리 입 앞 */}
            <g transform="translate(86 168)" className="ghid-lightning-orb">
              <circle r={14} fill="none" stroke="#fde047" strokeWidth={2.2} strokeDasharray="4 3" />
              <circle r={8} fill="#ffffff" />
            </g>
          </g>
        )}

        {/* ── 뇌전 차징 시 목덜미를 따라 지지직거리는 급격 점멸 번개 ── */}
        {alive && isCharging && (
          <g filter="url(#kgd-glow)" style={{ pointerEvents: 'none' }}>
            <Bolt color="#ffffff" delay={0} dur={0.12} points="132,60 156,52 170,40 200,38" width={3.2} />
            <Bolt color="#fde047" delay={0.04} dur={0.10} points="134,124 164,116 186,108 214,110" width={3.6} />
            <Bolt color="#ffffff" delay={0.08} dur={0.14} points="132,168 158,176 182,188 206,178" width={3.2} />
            <Bolt color="#fef08a" delay={0.02} dur={0.09} points="230,90 250,70 270,50 286,30" width={2.8} />
          </g>
        )}

        {/* ── 번개 오라 (황금빛 지지직 스파크) ── */}
        {alive && (
          <g filter="url(#kgd-glow)" style={{ pointerEvents: 'none' }}>
            <Bolt color={boltColor} delay={0} dur={2.2} points="326,26 314,40 322,48 308,64 316,72 304,90" />
            <Bolt color={boltColor} delay={0.7} dur={2.6} points="292,42 284,58 294,64 282,82" width={2} />
            <Bolt color={boltColor} delay={1.3} dur={2.0} points="284,118 296,132 282,140 296,158 284,172" />
            <Bolt color={boltColor} delay={0.4} dur={2.8} points="176,22 168,38 180,44 170,58" />
            <Bolt color={boltColor} delay={1.8} dur={2.3} points="204,152 192,142 200,134 188,122" />
            <Bolt color={boltColor} delay={1.0} dur={2.1} points="302,192 314,184 308,200 322,198" width={2} />
            <Bolt color={boltColor} delay={1.6} dur={2.5} points="224,24 216,40 226,48 214,66" width={2} />
            <Bolt color={boltColor} delay={0.2} dur={2.7} points="108,100 120,108 112,116 126,124" width={2} />
          </g>
        )}

        {/* ── 분노의 붉은 번개 (피격 / 체력 저하) ── */}
        {rageActive && (
          <g filter="url(#kgd-glow)" style={{ pointerEvents: 'none' }}>
            <Bolt rage color={rageColor} delay={0} dur={rageLevel === 3 ? 0.45 : 0.9} width={3} points="70,70 90,86 80,92 104,112" />
            <Bolt rage color={rageColor} delay={0.15} dur={rageLevel === 3 ? 0.4 : 1.1} width={3} points="236,56 252,78 240,84 262,108" />
            <Bolt rage color={rageColor} delay={0.3} dur={rageLevel === 3 ? 0.5 : 0.8} width={3} points="196,200 212,178 204,172 226,150" />
            <Bolt rage color={rageColor} delay={0.1} dur={rageLevel === 3 ? 0.42 : 1.0} width={3} points="304,28 292,60 306,66 294,100" />
            <Bolt rage color={rageColor} delay={0.25} dur={rageLevel === 3 ? 0.38 : 1.2} width={2.6} points="110,150 130,152 122,162 146,166" />
          </g>
        )}
      </g>
    </svg>
  );
};
