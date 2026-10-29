import React from 'react';
import type { GodzillaStageTier } from '../types';

/**
 * 고질라 SVG 아트 (viewBox 320 x 220, 오른쪽을 향함)
 *
 * - 기존 PNG(640x440 = 320x220 의 2배)와 동일한 비율/방향을 유지하므로 부모(GodzillaCharacter)의
 *   aspectRatio(320/220), 열선 발사 위치(입 ≈ x 292, y 122), HP 바 레이아웃이 그대로 유지된다.
 * - 5개 진화 티어(chibi / classic / minusone / evil / burning)를 팔레트 + 체형 지오메트리로 구분한다.
 */

interface GodzillaArtProps {
  tier: GodzillaStageTier;
  isShooting: boolean;
  isDefeated: boolean;
  label: string;
  attackPhase?: 'idle' | 'charge' | 'fire' | 'impact';
  isHit?: boolean;
}

type Pt = [number, number];

interface Palette {
  bodyTop: string;
  bodyMid: string;
  bodyBot: string;
  belly1: string;
  belly2: string;
  outline: string;
  plateTip: string;
  plateBase: string;
  plateStroke: string;
  plateStrokeW: number;
  plateEdge: string;
  eye: string;
  eyeCore: string;
  glowA: string;
  glowB: string;
  crack: string | null;
  claw: string;
  scaleOpacity: number;
}

const PALETTES: Record<GodzillaStageTier, Palette> = {
  chibi: {
    bodyTop: '#4ade80',
    bodyMid: '#10b981',
    bodyBot: '#047857',
    belly1: '#d1fae5',
    belly2: '#6ee7b7',
    outline: '#064e3b',
    plateTip: '#a7f3d0',
    plateBase: '#059669',
    plateStroke: '#064e3b',
    plateStrokeW: 1.2,
    plateEdge: '#ecfdf5',
    eye: '#38bdf8',
    eyeCore: '#0c4a6e',
    glowA: '#4ade80',
    glowB: '#00f0ff',
    crack: null,
    claw: '#f0fdf4',
    scaleOpacity: 0.28,
  },
  classic: {
    bodyTop: '#4b5563',
    bodyMid: '#1f2937',
    bodyBot: '#0b1220',
    belly1: '#64748b',
    belly2: '#334155',
    outline: '#020617',
    plateTip: '#94a3b8',
    plateBase: '#0f172a',
    plateStroke: '#020617',
    plateStrokeW: 1.2,
    plateEdge: '#e2e8f0',
    eye: '#f59e0b',
    eyeCore: '#451a03',
    glowA: '#00f0ff',
    glowB: '#3b82f6',
    crack: null,
    claw: '#e2e8f0',
    scaleOpacity: 0.5,
  },
  minusone: {
    bodyTop: '#334155',
    bodyMid: '#0f172a',
    bodyBot: '#020617',
    belly1: '#334155',
    belly2: '#0f172a',
    outline: '#020617',
    plateTip: '#1e5b8a',
    plateBase: '#020617',
    plateStroke: '#0ea5e9',
    plateStrokeW: 1.8,
    plateEdge: '#7dd3fc',
    eye: '#fde047',
    eyeCore: '#000000',
    glowA: '#00f0ff',
    glowB: '#3b82f6',
    crack: '#38bdf8',
    claw: '#e0f2fe',
    scaleOpacity: 0.55,
  },
  evil: {
    bodyTop: '#2e2650',
    bodyMid: '#120c26',
    bodyBot: '#050309',
    belly1: '#3b2a5f',
    belly2: '#150f2a',
    outline: '#050309',
    plateTip: '#6d28d9',
    plateBase: '#0a0414',
    plateStroke: '#a855f7',
    plateStrokeW: 1.8,
    plateEdge: '#e9d5ff',
    eye: '#f5f3ff',
    eyeCore: '#7e22ce',
    glowA: '#c084fc',
    glowB: '#38bdf8',
    crack: '#a855f7',
    claw: '#f3e8ff',
    scaleOpacity: 0.55,
  },
  burning: {
    bodyTop: '#57534e',
    bodyMid: '#292524',
    bodyBot: '#1c1917',
    belly1: '#f97316',
    belly2: '#7c2d12',
    outline: '#7c2d12',
    plateTip: '#fff3a0',
    plateBase: '#ff2200',
    plateStroke: '#fbbf24',
    plateStrokeW: 1.4,
    plateEdge: '#ffffff',
    eye: '#fb923c',
    eyeCore: '#7c2d12',
    glowA: '#ff8800',
    glowB: '#ff2200',
    crack: '#ff7a00',
    claw: '#fde68a',
    scaleOpacity: 0.45,
  },
};

interface Geo {
  tail: string;
  torso: string;
  belly: string;
  neck: string;
  thigh: { cx: number; cy: number; rx: number; ry: number; rot: number };
  foot: string;
  footClaws: string[];
  farThigh: { cx: number; cy: number; rx: number; ry: number; rot: number };
  farFoot: string;
  farClaws: string[];
  arm: string;
  armClaws: string[];
  head: { x: number; y: number; s: number; jawIdle: [number, number]; jawShoot: [number, number] };
  eyeScale: number;
  toothScale: number;
  spine: Pt[];
  plateW: number[];
  tailPlates: number;
  mouth: Pt;
  cracks: string[];
}

const KAIJU: Geo = {
  tail: 'M126,122 C92,128 52,150 10,182 C8,186 12,190 18,192 C56,208 96,206 132,186 Z',
  torso:
    'M112,178 C108,140 126,102 166,90 C204,82 228,98 238,122 C246,146 238,172 222,190 C190,198 150,196 112,178 Z',
  belly: 'M222,108 C238,124 238,160 220,188 C210,192 200,192 196,190 C214,168 220,136 214,112 Z',
  neck: 'M196,92 C212,78 234,76 248,86 L254,124 L226,134 C218,120 206,106 196,92 Z',
  thigh: { cx: 164, cy: 164, rx: 36, ry: 38, rot: -12 },
  foot: 'M138,196 C148,192 190,192 204,198 L214,206 L216,212 L136,212 Z',
  footClaws: ['206,201 224,207 208,207', '210,206 228,211 210,211', '200,198 214,202 202,203'],
  farThigh: { cx: 214, cy: 172, rx: 26, ry: 30, rot: 8 },
  farFoot: 'M190,198 C202,194 236,196 246,202 L254,208 L256,212 L186,212 Z',
  farClaws: ['248,203 262,208 249,208', '250,208 266,212 250,212'],
  arm: 'M224,136 Q234,150 244,160 L260,164',
  armClaws: ['260,159 275,160 261,164', '260,164 277,167 261,168', '259,168 272,174 260,171'],
  head: { x: 238, y: 114, s: 1.28, jawIdle: [9, 14], jawShoot: [20, 26] },
  eyeScale: 1,
  toothScale: 1,
  spine: [
    [24, 172],
    [44, 158],
    [72, 142],
    [100, 129],
    [122, 122],
    [140, 104],
    [166, 91],
    [190, 87],
    [212, 94],
  ],
  plateW: [9, 11, 14, 18, 22, 28, 30, 26, 18],
  tailPlates: 5,
  mouth: [298, 125],
  cracks: [
    'M150,110 L158,126 L150,134 L162,150 L156,162 L168,176',
    'M126,150 L134,164 L128,172 L138,184',
    'M110,140 L96,150 L90,146 L74,158 L66,156 L48,170',
    'M214,104 L222,118 L216,126 L226,140',
    'M232,134 L244,144 L252,142',
    'M176,150 L186,160 L180,170 L192,184',
  ],
};

const CHIBI: Geo = {
  tail: 'M120,150 C90,156 56,168 24,176 C20,182 26,190 34,192 C70,200 104,198 134,188 Z',
  torso:
    'M110,182 C104,142 130,110 168,106 C206,102 230,128 232,156 C234,182 220,198 200,202 L132,202 Z',
  belly: 'M222,128 C234,146 232,176 214,196 L196,198 C212,176 214,150 206,128 Z',
  neck: 'M190,112 C204,100 226,98 240,106 L246,140 L216,148 C206,136 196,124 190,112 Z',
  thigh: { cx: 160, cy: 178, rx: 32, ry: 28, rot: -8 },
  foot: 'M136,200 C146,196 188,196 202,200 L214,208 L216,212 L134,212 Z',
  footClaws: ['206,203 223,209 208,209', '208,207 226,212 208,212'],
  farThigh: { cx: 206, cy: 184, rx: 22, ry: 22, rot: 6 },
  farFoot: 'M190,202 L234,202 L246,208 L248,212 L186,212 Z',
  farClaws: ['238,204 252,209 239,209', '240,208 256,212 240,212'],
  arm: 'M222,144 Q234,154 244,162 L254,164',
  armClaws: ['254,160 266,161 255,164', '254,164 267,167 255,167'],
  head: { x: 230, y: 110, s: 1.3, jawIdle: [6, 10], jawShoot: [15, 20] },
  eyeScale: 1.3,
  toothScale: 1.35,
  spine: [
    [32, 174],
    [58, 167],
    [84, 160],
    [102, 154],
    [120, 134],
    [142, 114],
    [168, 106],
    [196, 112],
  ],
  plateW: [10, 13, 16, 20, 25, 27, 22, 16],
  tailPlates: 4,
  mouth: [297, 121],
  cracks: [],
};

const pts = (arr: Pt[]) => arr.map((p) => p.join(',')).join(' ');

/** 단풍잎/톱날 형태의 뾰족한 암석 골판 (로컬: 바닥 중앙 0,0 / 위쪽이 -y) */
const platePoints = (w: number, h: number): Pt[] => [
  [-0.5 * w, 0],
  [-0.48 * w, -0.42 * h],
  [-0.2 * w, -0.3 * h],
  [-0.12 * w, -h],
  [0.12 * w, -0.38 * h],
  [0.4 * w, -0.68 * h],
  [0.5 * w, 0],
];

/** 지직 아크 */
const Arc: React.FC<{ points: string; delay: number; color: string }> = ({ points, delay, color }) => (
  <g className="godz-arc" style={{ animationDelay: `${delay}s` }}>
    <polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    <polyline points={points} fill="none" stroke="#ffffff" strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round" />
  </g>
);

const MOTES: Array<[number, number, number]> = [
  [26, -14, 0],
  [22, 12, 0.25],
  [34, 0, 0.5],
  [14, -22, 0.7],
  [12, 22, 0.15],
  [-6, -20, 0.4],
  [-4, 18, 0.6],
  [30, -6, 0.85],
];

const Head: React.FC<{
  geo: Geo;
  pal: Palette;
  uid: string;
  isShooting: boolean;
  isDefeated: boolean;
  isChibi: boolean;
  tier: GodzillaStageTier;
}> = ({ geo, pal, uid, isShooting, isDefeated, isChibi, tier }) => {
  const { x, y, s } = geo.head;
  const jaw = isShooting ? geo.head.jawShoot : geo.head.jawIdle;
  const ts = geo.toothScale;
  const upperTeeth: Pt[] = [
    [17, 8],
    [24, 6],
    [31, 9],
    [38, 6],
    [45, 8],
  ];
  const lowerTeeth: Pt[] = [
    [8, 7],
    [16, 6],
    [24, 8],
    [32, 6],
    [40, 7],
  ];
  const hasPupil = tier !== 'evil';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* 입 안쪽 */}
      <path d="M-2,3 L48,3 L52,22 L0,20 Z" fill="#450a0a" />
      <path d="M2,12 Q20,22 44,12 L44,20 Q20,28 2,20 Z" fill="#be123c" opacity={0.9} />

      {/* 아래턱 (쩍 벌린 입: 힌지 -4,6) */}
      <g transform={`rotate(${jaw[0]} -4 6)`}>
        {!isDefeated && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={`${jaw[0]} -4 6;${jaw[1]} -4 6;${jaw[0]} -4 6`}
            dur={isShooting ? '0.28s' : '3.2s'}
            repeatCount="indefinite"
          />
        )}
        <path
          d="M-4,4 L48,5 C53,6 54,12 50,17 L40,22 L-2,19 Z"
          fill={`url(#${uid}-body)`}
          stroke={pal.outline}
          strokeWidth="1.2"
        />
        <path d="M-2,14 L38,17 L38,20 L-2,18 Z" fill={pal.bodyBot} opacity={0.4} />
        {lowerTeeth.map(([tx, th], i) => (
          <polygon
            key={`lt${i}`}
            points={`${tx},5 ${tx + 3 * ts},${5 - th * 0.85 * ts} ${tx + 6 * ts},5`}
            fill="#f8fafc"
            stroke="#94a3b8"
            strokeWidth="0.4"
          />
        ))}
      </g>

      {/* 두개골 / 위턱 */}
      <path
        d="M-36,-26 C-18,-44 16,-44 38,-28 C46,-24 52,-17 51,-8 L49,2 L18,3 L-6,6 L-36,0 Z"
        fill={`url(#${uid}-body)`}
        stroke={pal.outline}
        strokeWidth="1.3"
      />
      <path
        d="M-36,-26 C-18,-44 16,-44 38,-28 C46,-24 52,-17 51,-8 L49,2 L18,3 L-6,6 L-36,0 Z"
        fill={`url(#${uid}-scales)`}
        opacity={pal.scaleOpacity}
      />
      {/* 콧등 하이라이트 */}
      <path d="M0,-38 C16,-42 34,-32 46,-18" fill="none" stroke={pal.plateEdge} strokeWidth="1.4" opacity={0.28} strokeLinecap="round" />
      {/* 귀구멍 / 목주름 */}
      <ellipse cx="-10" cy="-8" rx="2.4" ry="3.4" fill={pal.outline} opacity={0.85} />
      <path d="M-30,-16 Q-20,-6 -26,6" fill="none" stroke={pal.outline} strokeWidth="1" opacity={0.45} />
      <path d="M-18,-12 Q-10,-4 -14,6" fill="none" stroke={pal.outline} strokeWidth="1" opacity={0.35} />
      {/* 콧구멍 */}
      <ellipse cx="46" cy="-15" rx="1.8" ry="1.2" fill={pal.outline} />

      {/* 위 송곳니 */}
      {upperTeeth.map(([tx, th], i) => (
        <polygon
          key={`ut${i}`}
          points={`${tx - 3 * ts},3 ${tx},${3 + th * ts * (i === 0 || i === 4 ? 1.2 : 1)} ${tx + 3 * ts},3`}
          fill="#f8fafc"
          stroke="#94a3b8"
          strokeWidth="0.4"
        />
      ))}

      {/* 험악한 눈썹 능선 */}
      <path
        d="M-2,-33 C12,-38 30,-32 40,-20 L37,-15 C28,-22 14,-26 2,-24 Z"
        fill={pal.bodyBot}
        stroke={pal.outline}
        strokeWidth="0.8"
      />

      {/* 눈: 당차고 날카로운 눈매 */}
      <g transform={`translate(21 -15) scale(${geo.eyeScale}) translate(-21 15)`}>
        {tier !== 'chibi' && <circle cx="22" cy="-15" r="9" fill={pal.eye} opacity={0.28} />}
        <path
          d="M9,-22 L33,-14 C29,-8 16,-8 11,-14 Z"
          fill={pal.eye}
          stroke={pal.outline}
          strokeWidth="0.9"
        />
        {hasPupil && <ellipse cx="22.5" cy="-14" rx={isChibi ? 2.2 : 1.5} ry="4.2" fill={pal.eyeCore} />}
        {!hasPupil && <ellipse cx="22.5" cy="-14" rx="5" ry="2.4" fill={pal.eyeCore} opacity={0.5} />}
        <circle cx="19" cy="-16" r="1.5" fill="#ffffff" />
        {/* 윗눈꺼풀 그림자: 졸린 눈 → 매서운 눈 */}
        <path d="M8,-23 L34,-14.5 L33,-12.5 L10,-19 Z" fill={pal.outline} />
      </g>

      {/* 균열 (머리) */}
      {pal.crack && (
        <g className="godz-crack" style={{ pointerEvents: 'none' }}>
          <polyline points="-14,-24 -6,-16 -12,-10 -4,-4" fill="none" stroke={pal.crack} strokeWidth="1.6" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

export const GodzillaArt: React.FC<GodzillaArtProps> = ({
  tier,
  isShooting,
  isDefeated,
  label,
  attackPhase,
}) => {
  const pal = PALETTES[tier];
  const isChibi = tier === 'chibi';
  const isBurning = tier === 'burning';
  const geo = isChibi ? CHIBI : KAIJU;
  const uid = `gz-${tier}`;
  const alive = !isDefeated;

  const effectivePhase = attackPhase ?? (isShooting ? 'fire' : 'idle');
  const isCharging = effectivePhase === 'charge';
  const isFiring = effectivePhase === 'fire';

  const chargeDur = isCharging ? 0.35 : isFiring ? 0.3 : 2.8;
  const [mx, my] = geo.mouth;
  const sp = geo.spine;
  const n = sp.length;

  const plateData = sp.map((p, i) => {
    const a = sp[Math.max(0, i - 1)];
    const b = sp[Math.min(n - 1, i + 1)];
    const theta = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    const w = geo.plateW[i];
    return { p, angle: theta - 16, w, h: w * 1.45 };
  });

  const spinePath = `M${sp.map((p) => p.join(',')).join(' L')}`;
  const tailPlates = plateData.slice(0, geo.tailPlates);
  const bodyPlates = plateData.slice(geo.tailPlates);

  const renderPlate = (d: (typeof plateData)[number], i: number) => {
    const poly = pts(platePoints(d.w, d.h));
    const delay = isCharging ? (i / (n - 1)) * 0.52 : (i / (n - 1)) * chargeDur * 0.8;
    return (
      <g key={`pl${i}`} transform={`translate(${d.p[0]} ${d.p[1] + 3}) rotate(${d.angle})`}>
        <polygon
          points={poly}
          fill={`url(#${uid}-plate)`}
          stroke={pal.plateStroke}
          strokeWidth={pal.plateStrokeW}
          strokeLinejoin="round"
        />
        {/* 암석 면 분할 하이라이트 */}
        <polygon
          points={pts([
            [-0.12 * d.w, -d.h],
            [0.12 * d.w, -0.38 * d.h],
            [0.08 * d.w, 0],
            [-0.14 * d.w, 0],
          ])}
          fill={pal.plateEdge}
          opacity={0.2}
        />
        <polyline
          points={pts([
            [-0.3 * d.w, 0],
            [-0.12 * d.w, -0.5 * d.h],
          ])}
          fill="none"
          stroke={pal.plateEdge}
          strokeWidth="0.8"
          opacity={0.35}
        />
        {/* 아토믹 충전 파동: 꼬리 → 머리 순으로 점등 */}
        {alive && (
          <polygon
            className={
              isCharging
                ? 'godz-plate-charge'
                : isBurning
                ? 'godz-plate godz-plate-fire'
                : 'godz-plate'
            }
            points={poly}
            fill={isCharging ? '#00f0ff' : pal.glowA}
            stroke={isCharging ? '#ffffff' : pal.glowB}
            strokeWidth={isCharging ? 2.2 : 1.4}
            strokeLinejoin="round"
            style={{ animationDuration: `${chargeDur}s`, animationDelay: `${delay}s` }}
          />
        )}
      </g>
    );
  };

  const ellipseOf = (e: Geo['thigh']) => (
    <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} transform={`rotate(${e.rot} ${e.cx} ${e.cy})`} />
  );

  return (
    <svg
      viewBox="0 0 320 220"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMax meet"
      overflow="visible"
      style={
        {
          display: 'block',
          overflow: 'visible',
          '--gz-a': pal.glowA,
          '--gz-b': pal.glowB,
        } as React.CSSProperties
      }
      className={`${alive ? 'godz-art' : 'godz-defeated'}`}
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={`${uid}-body`} x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor={pal.bodyTop} />
          <stop offset="55%" stopColor={pal.bodyMid} />
          <stop offset="100%" stopColor={pal.bodyBot} />
        </linearGradient>
        <linearGradient id={`${uid}-far`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={pal.bodyMid} />
          <stop offset="100%" stopColor={pal.bodyBot} />
        </linearGradient>
        <linearGradient id={`${uid}-belly`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={pal.belly1} />
          <stop offset="100%" stopColor={pal.belly2} />
        </linearGradient>
        <linearGradient id={`${uid}-plate`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={pal.plateBase} />
          <stop offset="100%" stopColor={pal.plateTip} />
        </linearGradient>
        <radialGradient id={`${uid}-shine`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-orb`}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="35%" stopColor={pal.glowA} stopOpacity="0.95" />
          <stop offset="75%" stopColor={pal.glowB} stopOpacity="0.45" />
          <stop offset="100%" stopColor={pal.glowB} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-lava`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff6a00" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ff2200" stopOpacity="0" />
        </radialGradient>
        {/* 가죽/비늘 질감 */}
        <pattern id={`${uid}-scales`} width="9" height="7" patternUnits="userSpaceOnUse">
          <path d="M0,6 Q4.5,1.5 9,6" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.18" />
          <path d="M-4.5,3 Q0,-1.5 4.5,3 M4.5,3 Q9,-1.5 13.5,3" fill="none" stroke="#000000" strokeWidth="0.6" opacity="0.22" />
        </pattern>
        <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 버닝: 몸 뒤쪽 용암 열기 */}
      {isBurning && alive && (
        <ellipse className="godz-lava-glow" cx="170" cy="140" rx="130" ry="80" fill={`url(#${uid}-lava)`} />
      )}

      <g
        className={
          alive
            ? isCharging
              ? 'godz-body-charge'
              : isFiring
              ? 'godz-body-fire'
              : 'godz-breathe'
            : ''
        }
      >
        {/* 뒤쪽 다리 */}
        <g fill={`url(#${uid}-far)`} stroke={pal.outline} strokeWidth="1.2">
          {ellipseOf(geo.farThigh)}
          <path d={geo.farFoot} strokeLinejoin="round" />
        </g>
        {geo.farClaws.map((c, i) => (
          <polygon key={`fc${i}`} points={c} fill={pal.claw} stroke={pal.outline} strokeWidth="0.6" />
        ))}

        {/* 몸통 쪽 등지느러미 */}
        {bodyPlates.map((d, i) => renderPlate(d, i + geo.tailPlates))}

        {/* 꼬리 (등지느러미 포함, 느리게 휘두름) */}
        <g className={alive ? 'godz-tail' : ''}>
          {tailPlates.map((d, i) => renderPlate(d, i))}
          <path d={geo.tail} fill={`url(#${uid}-body)`} stroke={pal.outline} strokeWidth="1.5" strokeLinejoin="round" />
          <path d={geo.tail} fill={`url(#${uid}-scales)`} opacity={pal.scaleOpacity} />
          {/* 꼬리 근육 라인 */}
          <path d="M112,150 Q84,160 56,178" fill="none" stroke={pal.bodyTop} strokeWidth="1.4" opacity={0.4} strokeLinecap="round" />
          {geo.cracks[2] && pal.crack && (
            <g className="godz-crack" filter={`url(#${uid}-glow)`}>
              <path d={geo.cracks[2]} fill="none" stroke={pal.crack} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          )}
        </g>

        {/* 몸통 */}
        <path d={geo.neck} fill={`url(#${uid}-body)`} />
        <path d={geo.torso} fill={`url(#${uid}-body)`} stroke={pal.outline} strokeWidth="1.5" strokeLinejoin="round" />
        <path d={geo.torso} fill={`url(#${uid}-scales)`} opacity={pal.scaleOpacity} />
        <path d={geo.torso} fill={`url(#${uid}-shine)`} />
        {/* 가슴/배 */}
        <path d={geo.belly} fill={`url(#${uid}-belly)`} stroke={pal.outline} strokeWidth="1" opacity={isBurning ? 0.9 : 0.8} />
        {[0.25, 0.45, 0.65, 0.85].map((t, i) => {
          const y = (isChibi ? 134 : 116) + t * (isChibi ? 60 : 70);
          return (
            <path
              key={`bl${i}`}
              d={`M${isChibi ? 208 : 202},${y} Q${isChibi ? 222 : 220},${y + 4} ${isChibi ? 232 : 236},${y - 2}`}
              fill="none"
              stroke={pal.outline}
              strokeWidth="1.1"
              opacity={0.4}
            />
          );
        })}

        {/* 육중한 허벅지 + 발 */}
        <g fill={`url(#${uid}-body)`} stroke={pal.outline} strokeWidth="1.5">
          {ellipseOf(geo.thigh)}
        </g>
        <g
          fill={`url(#${uid}-scales)`}
          opacity={pal.scaleOpacity}
          transform={`rotate(${geo.thigh.rot} ${geo.thigh.cx} ${geo.thigh.cy})`}
        >
          <ellipse cx={geo.thigh.cx} cy={geo.thigh.cy} rx={geo.thigh.rx} ry={geo.thigh.ry} />
        </g>
        <ellipse
          cx={geo.thigh.cx - 8}
          cy={geo.thigh.cy - 10}
          rx={geo.thigh.rx * 0.5}
          ry={geo.thigh.ry * 0.45}
          fill={`url(#${uid}-shine)`}
        />
        {/* 허벅지 근육 곡선 */}
        <path
          d={`M${geo.thigh.cx - 14},${geo.thigh.cy - geo.thigh.ry + 8} Q${geo.thigh.cx + 6},${geo.thigh.cy} ${geo.thigh.cx - 10},${geo.thigh.cy + geo.thigh.ry - 8}`}
          fill="none"
          stroke={pal.plateEdge}
          strokeWidth="1.3"
          opacity={0.25}
          strokeLinecap="round"
        />
        <path d={geo.foot} fill={`url(#${uid}-body)`} stroke={pal.outline} strokeWidth="1.5" strokeLinejoin="round" />
        {geo.footClaws.map((c, i) => (
          <polygon key={`ftc${i}`} points={c} fill={pal.claw} stroke={pal.outline} strokeWidth="0.7" />
        ))}

        {/* 균열 (몸 전체) */}
        {pal.crack &&
          geo.cracks
            .filter((_, i) => i !== 2)
            .map((c, i) => (
              <g key={`cr${i}`} className="godz-crack" filter={`url(#${uid}-glow)`} style={{ animationDelay: `${i * 0.25}s` }}>
                <path d={c} fill="none" stroke={pal.crack ?? undefined} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </g>
            ))}

        {/* 강력한 앞발톱 */}
        <path d={geo.arm} fill="none" stroke={pal.outline} strokeWidth={isChibi ? 11 : 14} strokeLinecap="round" strokeLinejoin="round" />
        <path d={geo.arm} fill="none" stroke={`url(#${uid}-body)`} strokeWidth={isChibi ? 8 : 11} strokeLinecap="round" strokeLinejoin="round" />
        <path d={geo.arm} fill="none" stroke={pal.bodyTop} strokeWidth="1.5" opacity={0.35} strokeLinecap="round" transform="translate(0,-2)" />
        {geo.armClaws.map((c, i) => (
          <polygon key={`ac${i}`} points={c} fill={pal.claw} stroke={pal.outline} strokeWidth="0.7" />
        ))}

        {/* 아토믹 충전 빛줄기: 꼬리 끝 → 등지느러미 → 머리 */}
        {alive && (
          <path
            className="godz-spine-flow"
            d={spinePath}
            pathLength={100}
            fill="none"
            stroke={pal.glowA}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="16 84"
            filter={`url(#${uid}-glow)`}
            style={{ animationDuration: `${chargeDur}s` }}
          />
        )}

        {/* 머리 */}
        <g
          className={alive ? 'godz-head' : ''}
          style={{ transformOrigin: `${geo.head.x}px ${geo.head.y}px` }}
        >
          <Head geo={geo} pal={pal} uid={uid} isShooting={isShooting} isDefeated={isDefeated} isChibi={isChibi} tier={tier} />
        </g>
      </g>

      {/* 입가 방사열선 에너지: 모이는 입자 + 광원 + 지직 아크 */}
      {alive && (
        <g transform={`translate(${mx} ${my})`} style={{ pointerEvents: 'none' }}>
          {isCharging && (
            <g className="godz-charge-spark-core">
              <circle r={24} fill="none" stroke="#00f0ff" strokeWidth={2.4} strokeDasharray="6 4" opacity={0.9} />
              <circle r={15} fill="none" stroke="#ffffff" strokeWidth={2.0} strokeDasharray="4 3" opacity={0.95} />
              <circle r={8} fill="#ffffff" filter={`url(#${uid}-glow)`} />
            </g>
          )}
          <circle
            className={isCharging ? 'godz-charge-core-pulse' : 'godz-orb'}
            r={isCharging ? 16 : isFiring ? 14 : 8}
            fill={`url(#${uid}-orb)`}
            style={{ animationDuration: isCharging ? '0.2s' : isShooting ? '0.3s' : '1.2s' }}
          />
          <g filter={`url(#${uid}-glow)`}>
            {MOTES.slice(0, isCharging ? 8 : isShooting ? 8 : 5).map(([dx, dy, dl], i) => (
              <circle
                key={`mt${i}`}
                className={isCharging ? 'godz-mote-gather' : 'godz-mote'}
                r={i % 2 ? 1.6 : 2.2}
                fill={i % 3 === 0 ? '#ffffff' : pal.glowA}
                style={
                  {
                    '--dx': `${dx * (isCharging ? 1.6 : 1)}px`,
                    '--dy': `${dy * (isCharging ? 1.6 : 1)}px`,
                    animationDelay: `${dl * (isCharging ? 0.3 : 1)}s`,
                    animationDuration: isCharging ? '0.35s' : isShooting ? '0.55s' : '1.5s',
                  } as React.CSSProperties
                }
              />
            ))}
            <Arc points="0,0 6,-4 3,-7 11,-12 8,-14 15,-19" delay={0.1} color={pal.glowA} />
            <Arc points="0,0 7,4 3,8 12,12 9,15 16,20" delay={0.65} color={pal.glowB} />
            <Arc points="0,0 9,-1 6,-4 15,-3 13,0 20,2" delay={1.15} color={pal.glowA} />
          </g>
        </g>
      )}

      {/* 버닝: 피어오르는 불씨 */}
      {isBurning && alive && (
        <g style={{ pointerEvents: 'none' }}>
          {[
            [130, 110, 0],
            [176, 90, 0.5],
            [92, 140, 1.0],
            [150, 130, 1.5],
            [204, 100, 0.8],
          ].map(([ex, ey, ed], i) => (
            <circle
              key={`em${i}`}
              className="godz-ember"
              cx={ex}
              cy={ey}
              r="2"
              fill="#ffd166"
              style={{ animationDelay: `${ed}s` }}
            />
          ))}
        </g>
      )}
    </svg>
  );
};
