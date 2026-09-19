import React from 'react';
import { MONSTER_MAP } from '../data/monsterData';

// 각 괴수별 고유 벡터 일러스트레이션 (컬러 및 실루엣 렌더링 지원)
export const MonsterSvgIllustration: React.FC<{
  monsterId: string;
  isSilhouette?: boolean;
  className?: string;
}> = ({ monsterId, isSilhouette = false, className = 'w-full h-full' }) => {
  // 실루엣 모드: 완전 검정/진회색 실루엣 처리
  if (isSilhouette) {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={{
          filter: 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.8))',
          opacity: 0.35,
        }}
      >
        {renderMonsterPath(monsterId, '#1e293b', '#0f172a')}
      </svg>
    );
  }

  const meta = MONSTER_MAP.get(monsterId);
  const mainColor = meta?.color || '#06b6d4';
  const glowColor = meta?.glowColor || '#38bdf8';

  return (
    <svg viewBox="0 0 100 100" className={className}>
      <defs>
        <radialGradient id={`glow-${monsterId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* 배경 발광 오라 */}
      <circle cx="50" cy="50" r="42" fill={`url(#glow-${monsterId})`} />
      {renderMonsterPath(monsterId, mainColor, glowColor)}
    </svg>
  );
};

// 10종 괴수 고유 SVG 패스 렌더링
function renderMonsterPath(monsterId: string, mainColor: string, accentColor: string) {
  switch (monsterId) {
    case 'chibi-godzilla':
      return (
        <g>
          {/* 둥글둥글 치비 고질라 몸체 */}
          <path
            d="M 50 20 C 35 20 28 32 28 50 C 28 68 35 80 50 82 C 65 80 72 68 72 50 C 72 32 65 20 50 20 Z"
            fill={mainColor}
          />
          {/* 치비 귀여운 아기 꼬리 */}
          <path d="M 68 70 C 80 74 88 65 86 58 C 82 58 75 64 68 70 Z" fill={mainColor} />
          {/* 아기 등지느러미 */}
          <polygon points="46,18 50,12 54,18" fill={accentColor} />
          <polygon points="44,28 41,22 47,26" fill={accentColor} />
          <polygon points="56,28 59,22 53,26" fill={accentColor} />
          {/* 치비 왕방울 눈 */}
          <circle cx="41" cy="42" r="7" fill="#ffffff" />
          <circle cx="59" cy="42" r="7" fill="#ffffff" />
          <circle cx="42" cy="42" r="4" fill="#0f172a" />
          <circle cx="60" cy="42" r="4" fill="#0f172a" />
          <circle cx="44" cy="40" r="1.5" fill="#ffffff" />
          <circle cx="62" cy="40" r="1.5" fill="#ffffff" />
          {/* 발그레 볼터치 */}
          <circle cx="34" cy="52" r="3.5" fill="#f43f5e" opacity="0.6" />
          <circle cx="66" cy="52" r="3.5" fill="#f43f5e" opacity="0.6" />
          {/* 웃는 입 & 꼬마 송곳니 */}
          <path d="M 45 54 Q 50 60 55 54" stroke="#0f172a" strokeWidth="2" fill="none" />
          <polygon points="48,54 50,57 52,54" fill="#ffffff" />
          {/* 미니 파이어볼 거품 */}
          <circle cx="50" cy="67" r="4" fill="#67e8f9" opacity="0.8" />
          <circle cx="53" cy="74" r="2.5" fill="#38bdf8" opacity="0.6" />
        </g>
      );

    case 'classic-godzilla':
      return (
        <g>
          {/* 원조 고질라 강인한 두상과 몸통 */}
          <path
            d="M 38 24 C 45 16 62 16 68 26 C 74 34 76 42 70 48 L 76 75 C 78 82 72 86 60 86 C 45 86 32 82 30 72 L 32 46 C 30 38 32 30 38 24 Z"
            fill={mainColor}
          />
          {/* 거대한 클래식 등지느러미 3열 */}
          <polygon points="32,26 22,20 28,32" fill={accentColor} />
          <polygon points="28,38 15,32 24,46" fill={accentColor} />
          <polygon points="25,52 12,48 22,62" fill={accentColor} />
          <polygon points="24,68 14,68 22,76" fill={accentColor} />
          {/* 묵직한 턱 & 날카로운 이빨 */}
          <path d="M 45 42 L 68 40 L 65 48 L 46 48 Z" fill="#0f172a" />
          <polygon points="48,42 50,45 52,42" fill="#ffffff" />
          <polygon points="54,42 56,45 58,42" fill="#ffffff" />
          <polygon points="60,42 62,45 64,42" fill="#ffffff" />
          {/* 번뜩이는 괴수왕 눈 */}
          <circle cx="58" cy="30" r="3.5" fill="#facc15" />
          <circle cx="59" cy="30" r="1.5" fill="#000000" />
          {/* 입가 방사열선 푸른 에너지 */}
          <circle cx="68" cy="45" r="5" fill="#22d3ee" opacity="0.85" />
          <line x1="68" y1="45" x2="88" y2="45" stroke="#a5f3fc" strokeWidth="3" strokeLinecap="round" />
        </g>
      );

    case 'mothra':
      return (
        <g>
          {/* 모스라 화려한 거대 날개 (좌/우) */}
          <path
            d="M 50 45 C 38 18 10 18 12 40 C 14 55 35 62 48 50 Z"
            fill="url(#mothra-wing-l)"
            stroke={mainColor}
            strokeWidth="1.5"
          />
          <path
            d="M 50 45 C 62 18 90 18 88 40 C 86 55 65 62 52 50 Z"
            fill="url(#mothra-wing-r)"
            stroke={mainColor}
            strokeWidth="1.5"
          />
          {/* 날개 하단 서브 윙 */}
          <path d="M 48 50 C 35 58 20 70 30 80 C 40 82 48 65 50 54 Z" fill="#f59e0b" opacity="0.9" />
          <path d="M 52 50 C 65 58 80 70 70 80 C 60 82 52 65 50 54 Z" fill="#f59e0b" opacity="0.9" />
          {/* 날개 눈 무늬 */}
          <circle cx="28" cy="36" r="6" fill="#ef4444" />
          <circle cx="28" cy="36" r="3" fill="#000000" />
          <circle cx="72" cy="36" r="6" fill="#ef4444" />
          <circle cx="72" cy="36" r="3" fill="#000000" />
          {/* 털북숭이 모스라 몸체와 눈 */}
          <ellipse cx="50" cy="50" rx="6" ry="16" fill="#fef3c7" />
          <circle cx="48" cy="42" r="2.5" fill="#38bdf8" />
          <circle cx="52" cy="42" r="2.5" fill="#38bdf8" />
          {/* 깃털 더듬이 */}
          <path d="M 47 38 Q 38 28 32 30" stroke="#fef08a" strokeWidth="2" fill="none" />
          <path d="M 53 38 Q 62 28 68 30" stroke="#fef08a" strokeWidth="2" fill="none" />
          {/* 날리는 빛 가루 파티클 */}
          <circle cx="20" cy="25" r="1.5" fill="#fde047" />
          <circle cx="80" cy="25" r="1.5" fill="#fde047" />
          <circle cx="50" cy="74" r="1.5" fill="#fde047" />
          <defs>
            <linearGradient id="mothra-wing-l" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="mothra-wing-r" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </g>
      );

    case 'rodan':
      return (
        <g>
          {/* 라돈 날카로운 익룡 날개 (좌/우) */}
          <path
            d="M 50 48 L 14 28 Q 24 50 35 62 L 46 54 Z"
            fill={mainColor}
            stroke="#c2410c"
            strokeWidth="1.5"
          />
          <path
            d="M 50 48 L 86 28 Q 76 50 65 62 L 54 54 Z"
            fill={mainColor}
            stroke="#c2410c"
            strokeWidth="1.5"
          />
          {/* 익룡 날개 끝 발톱 */}
          <polygon points="14,28 10,24 16,26" fill="#78350f" />
          <polygon points="86,28 90,24 84,26" fill="#78350f" />
          {/* 라돈 몸통 & 가슴 비늘 */}
          <ellipse cx="50" cy="54" rx="9" ry="18" fill="#c2410c" />
          <path d="M 45 50 Q 50 56 55 50" stroke="#fed7aa" strokeWidth="1.5" fill="none" />
          <path d="M 45 56 Q 50 62 55 56" stroke="#fed7aa" strokeWidth="1.5" fill="none" />
          {/* 날카로운 부리와 머리 뿔 */}
          <polygon points="46,38 50,22 54,38" fill="#9a3412" />
          <polygon points="50,24 44,14 48,22" fill="#7c2d12" />
          <polygon points="50,24 56,14 52,22" fill="#7c2d12" />
          <polygon points="50,30 50,42 60,34" fill="#ea580c" />
          {/* 붉게 이글거리는 눈 */}
          <circle cx="49" cy="28" r="2" fill="#facc15" />
          {/* 마하 충격파 바람 고리 */}
          <ellipse cx="50" cy="74" rx="20" ry="5" fill="none" stroke="#fdba74" strokeWidth="1.5" opacity="0.7" />
        </g>
      );

    case 'anguirus':
      return (
        <g>
          {/* 안기라스 4족 보행 웅크린 몸체 */}
          <ellipse cx="50" cy="56" rx="26" ry="18" fill="#713f12" />
          {/* 등에 돋아난 날카로운 가시 껍질 갑옷 */}
          <path
            d="M 30 52 Q 50 34 70 52"
            fill="none"
            stroke="#ca8a04"
            strokeWidth="3"
          />
          <polygon points="34,48 32,36 38,46" fill="#fde047" />
          <polygon points="42,44 40,30 46,42" fill="#fde047" />
          <polygon points="50,42 50,26 54,42" fill="#fde047" />
          <polygon points="58,44 60,30 54,42" fill="#fde047" />
          <polygon points="66,48 68,36 62,46" fill="#fde047" />
          {/* 코뿔과 머리 */}
          <path d="M 28 54 C 20 54 18 64 26 66 Z" fill="#854d0e" />
          <polygon points="22,56 12,50 20,60" fill="#facc15" />
          {/* 맹수의 눈 */}
          <circle cx="24" cy="58" r="2" fill="#facc15" />
          {/* 튼튼한 앞/뒷발 */}
          <ellipse cx="32" cy="72" rx="5" ry="6" fill="#582d09" />
          <ellipse cx="64" cy="72" rx="5" ry="6" fill="#582d09" />
          {/* 가시 곤봉 꼬리 */}
          <path d="M 74 58 Q 86 62 88 52" stroke="#854d0e" strokeWidth="4" fill="none" strokeLinecap="round" />
          <polygon points="86,52 92,48 88,56" fill="#fde047" />
        </g>
      );

    case 'mechagodzilla':
      return (
        <g>
          {/* 메카 고질라 각진 티타늄 헤드 & 몸체 */}
          <path
            d="M 36 26 L 64 26 L 68 46 L 74 76 L 26 76 L 32 46 Z"
            fill="#475569"
            stroke={mainColor}
            strokeWidth="1.5"
          />
          {/* 사이버네틱 아머 패널 라인 */}
          <line x1="36" y1="38" x2="64" y2="38" stroke="#06b6d4" strokeWidth="1.5" />
          <line x1="32" y1="56" x2="68" y2="56" stroke="#06b6d4" strokeWidth="1.5" />
          <line x1="50" y1="26" x2="50" y2="76" stroke="#06b6d4" strokeWidth="1" />
          {/* 메카 등지느러미 블레이드 */}
          <polygon points="34,24 24,18 28,30" fill="#94a3b8" stroke="#06b6d4" strokeWidth="1" />
          <polygon points="28,38 18,34 22,46" fill="#94a3b8" stroke="#06b6d4" strokeWidth="1" />
          <polygon points="24,54 14,50 20,62" fill="#94a3b8" stroke="#06b6d4" strokeWidth="1" />
          {/* 트윈 레이저 바이저 눈빛 */}
          <rect x="40" y="32" width="20" height="5" rx="2" fill="#f43f5e" />
          <line x1="39" y1="34.5" x2="61" y2="34.5" stroke="#ffffff" strokeWidth="1.5" />
          {/* 어깨 미사일 런처 포대 */}
          <rect x="22" y="44" width="8" height="14" rx="2" fill="#334155" stroke="#38bdf8" strokeWidth="1" />
          <rect x="70" y="44" width="8" height="14" rx="2" fill="#334155" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="26" cy="48" r="1.5" fill="#f43f5e" />
          <circle cx="26" cy="54" r="1.5" fill="#f43f5e" />
          <circle cx="74" cy="48" r="1.5" fill="#f43f5e" />
          <circle cx="74" cy="54" r="1.5" fill="#f43f5e" />
          {/* 가슴 플라즈마 그레네이드 코어 */}
          <polygon points="50,58 56,64 50,70 44,64" fill="#00f2ff" />
        </g>
      );

    case 'godzilla-minusone':
      return (
        <g>
          {/* 마이너스원 거대하고 날카로운 등지느러미가 특징 */}
          <polygon points="36,24 20,8 30,30" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="28,38 10,22 22,48" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="24,56 6,42 18,66" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="20,72 8,62 16,80" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          {/* 흉포하고 거친 몸체와 주둥이 */}
          <path
            d="M 36 28 C 42 18 64 16 72 26 C 78 34 82 46 72 52 L 78 82 C 70 88 45 88 32 80 L 34 50 Z"
            fill="#1e293b"
            stroke="#0ea5e9"
            strokeWidth="1"
          />
          {/* 흉터 가득한 거친 피부 텍스처 */}
          <path d="M 40 40 L 48 36" stroke="#475569" strokeWidth="1.5" />
          <path d="M 45 60 L 58 54" stroke="#475569" strokeWidth="1.5" />
          <path d="M 52 70 L 64 66" stroke="#475569" strokeWidth="1.5" />
          {/* 튀어나오는 등지느러미 초고압 스파크 */}
          <line x1="20" y1="8" x2="16" y2="4" stroke="#ffffff" strokeWidth="2" />
          <line x1="10" y1="22" x2="4" y2="18" stroke="#ffffff" strokeWidth="2" />
          {/* 번뜩이는 날카로운 눈동자 */}
          <polygon points="62,30 68,31 64,34 60,32" fill="#38bdf8" />
          <circle cx="64" cy="32" r="1" fill="#ffffff" />
          {/* 입에서 푸른빛 응축 */}
          <circle cx="72" cy="50" r="5" fill="#38bdf8" opacity="0.9" />
          <circle cx="72" cy="50" r="2.5" fill="#ffffff" />
        </g>
      );

    case 'king-ghidorah':
      return (
        <g>
          {/* 킹 기도라 세 개의 용 머리와 긴 목 */}
          {/* 왼쪽 머리 & 목 */}
          <path d="M 45 60 Q 30 45 28 32 L 20 28 L 30 26 Z" fill={mainColor} stroke="#ca8a04" strokeWidth="1" />
          <circle cx="26" cy="28" r="1.5" fill="#ef4444" />
          {/* 중앙 머리 & 목 */}
          <path d="M 50 62 Q 50 40 50 24 L 44 20 L 56 20 Z" fill={mainColor} stroke="#ca8a04" strokeWidth="1" />
          <circle cx="50" cy="22" r="1.5" fill="#ef4444" />
          {/* 오른쪽 머리 & 목 */}
          <path d="M 55 60 Q 70 45 72 32 L 80 28 L 70 26 Z" fill={mainColor} stroke="#ca8a04" strokeWidth="1" />
          <circle cx="74" cy="28" r="1.5" fill="#ef4444" />
          {/* 거대한 황금 박쥐 날개 (좌/우) */}
          <path
            d="M 40 60 L 6 30 Q 18 58 32 70 Z"
            fill="url(#ghidorah-wing)"
            stroke="#ca8a04"
            strokeWidth="1.5"
          />
          <path
            d="M 60 60 L 94 30 Q 82 58 68 70 Z"
            fill="url(#ghidorah-wing)"
            stroke="#ca8a04"
            strokeWidth="1.5"
          />
          {/* 황금 몸체 & 다리 */}
          <ellipse cx="50" cy="68" rx="14" ry="16" fill="#eab308" />
          {/* 두 갈래 용 꼬리 */}
          <path d="M 46 82 Q 38 92 32 90" stroke="#ca8a04" strokeWidth="2.5" fill="none" />
          <path d="M 54 82 Q 62 92 68 90" stroke="#ca8a04" strokeWidth="2.5" fill="none" />
          {/* 세 입에서 뿜어져 나오는 황금 중력 번개 */}
          <polyline points="22,28 14,36 18,44 10,50" stroke="#ffffff" strokeWidth="1.5" fill="none" />
          <polyline points="50,22 54,12 48,6" stroke="#ffffff" strokeWidth="1.5" fill="none" />
          <polyline points="78,28 86,36 82,44 90,50" stroke="#ffffff" strokeWidth="1.5" fill="none" />
          <defs>
            <linearGradient id="ghidorah-wing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
        </g>
      );

    case 'evil-godzilla':
      return (
        <g>
          {/* 이블 고질라 백안과 보랏빛 원혼 오라 */}
          <path
            d="M 34 26 C 42 16 66 16 72 26 C 78 34 76 46 68 52 L 76 80 C 65 86 38 86 30 78 L 32 46 Z"
            fill="#1e1028"
            stroke={mainColor}
            strokeWidth="1.5"
          />
          {/* 날카롭고 사악한 보랏빛 등지느러미 */}
          <polygon points="30,26 18,18 24,32" fill="#7e22ce" stroke="#c084fc" strokeWidth="1" />
          <polygon points="26,40 12,34 20,48" fill="#7e22ce" stroke="#c084fc" strokeWidth="1" />
          <polygon points="22,56 8,50 16,64" fill="#7e22ce" stroke="#c084fc" strokeWidth="1" />
          {/* 공포의 하얀 백안 (동공 없음!) */}
          <circle cx="62" cy="30" r="4.5" fill="#ffffff" />
          <circle cx="62" cy="30" r="2.5" fill="#e9d5ff" />
          {/* 흉측하게 벌린 입과 이빨 */}
          <path d="M 45 42 L 72 40 L 68 48 L 46 48 Z" fill="#3b0764" />
          <polygon points="50,42 52,46 54,42" fill="#ffffff" />
          <polygon points="56,42 58,46 60,42" fill="#ffffff" />
          <polygon points="62,42 64,46 66,42" fill="#ffffff" />
          {/* 사악한 보라 불꽃 오라 파티클 */}
          <circle cx="68" cy="44" r="5" fill="#a855f7" opacity="0.8" />
          <circle cx="75" cy="42" r="3" fill="#c084fc" opacity="0.9" />
          <circle cx="82" cy="40" r="2" fill="#f3e8ff" />
        </g>
      );

    case 'burning-godzilla':
      return (
        <g>
          {/* 버닝 고질라 전신이 붉게 타오르는 최강 형태 */}
          <path
            d="M 36 24 C 44 14 66 14 72 24 C 80 34 78 44 70 50 L 78 80 C 66 88 40 88 30 80 L 32 46 Z"
            fill="#450a0a"
            stroke="#ef4444"
            strokeWidth="2"
          />
          {/* 전신 용암 마그마 균열 무늬 */}
          <path d="M 42 36 Q 52 42 60 38" stroke="#f97316" strokeWidth="3" fill="none" />
          <path d="M 40 52 Q 54 58 66 50" stroke="#f97316" strokeWidth="3.5" fill="none" />
          <path d="M 38 68 Q 50 74 68 66" stroke="#facc15" strokeWidth="3" fill="none" />
          {/* 붉게 폭주하는 등지느러미 */}
          <polygon points="32,24 16,14 26,30" fill="#dc2626" stroke="#fef08a" strokeWidth="1.5" />
          <polygon points="26,38 8,28 18,46" fill="#dc2626" stroke="#fef08a" strokeWidth="1.5" />
          <polygon points="22,54 4,46 14,62" fill="#dc2626" stroke="#fef08a" strokeWidth="1.5" />
          {/* 불타는 주황빛 눈동자 */}
          <circle cx="62" cy="28" r="4" fill="#facc15" />
          <circle cx="62" cy="28" r="2" fill="#ffffff" />
          {/* 붉은 나선 열선 인피니트 파이어볼 */}
          <circle cx="74" cy="46" r="8" fill="#ef4444" opacity="0.9" />
          <circle cx="74" cy="46" r="5" fill="#f97316" />
          <circle cx="74" cy="46" r="2.5" fill="#ffffff" />
          {/* 화염 증기 폭발 */}
          <circle cx="84" cy="42" r="3" fill="#f97316" opacity="0.8" />
          <circle cx="90" cy="40" r="2" fill="#fef08a" opacity="0.9" />
        </g>
      );

    default:
      return (
        <circle cx="50" cy="50" r="35" fill={mainColor} />
      );
  }
}
