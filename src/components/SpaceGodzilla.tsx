import React from 'react';

interface SpaceGodzillaProps {
  isHit: boolean;
  isDefeated: boolean;
  hp?: number;
  className?: string;
}

export const SpaceGodzilla: React.FC<SpaceGodzillaProps> = ({
  isHit,
  isDefeated,
  hp = 100,
  className = '',
}) => {
  const isCritical = hp <= 25 && !isDefeated;
  const isWounded = hp <= 50 && !isDefeated;

  return (
    <div
      className={`relative flex items-end justify-center select-none ${className}`}
      style={{
        height: '100%',
        maxHeight: '100%',
        width: 'auto',
        aspectRatio: '260 / 240',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        transition: 'transform 0.4s ease, opacity 0.5s ease',
        transform: isDefeated
          ? 'rotate(-15deg) translateY(24px) scale(0.9)'
          : isHit
          ? 'scale(1.05) translateY(-3px)'
          : isCritical
          ? 'scale(0.98)'
          : 'scale(1)',
        opacity: isDefeated ? 0.45 : 1,
      }}
    >
      {/* 1. 피격 시 코로나 붉은 폭발 / 평상시 우주 크리스털 보라·하늘빛 아우라 */}
      {isHit ? (
        <div
          style={{
            position: 'absolute',
            inset: '-10px',
            backgroundColor: 'rgba(239, 68, 68, 0.55)',
            filter: 'blur(22px)',
            borderRadius: '9999px',
            pointerEvents: 'none',
          }}
        />
      ) : !isDefeated ? (
        <div
          className="animate-pulse pointer-events-none"
          style={{
            position: 'absolute',
            inset: '-8px',
            background: isCritical
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.45) 0%, rgba(139, 92, 246, 0.3) 50%, transparent 80%)'
              : 'radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, rgba(56, 189, 248, 0.3) 55%, transparent 85%)',
            filter: 'blur(16px)',
            borderRadius: '9999px',
          }}
        />
      ) : null}

      {/* 2. 상공 우주 결정체 파티클 */}
      {!isDefeated && (
        <>
          <div
            className="absolute -top-5 right-6 text-sm animate-bounce pointer-events-none opacity-90 z-20"
            style={{ animationDuration: '2.1s' }}
          >
            💎
          </div>
          <div
            className="absolute -top-3 left-4 text-xs animate-ping pointer-events-none opacity-75 z-20"
            style={{ animationDuration: '2.6s' }}
          >
            ✨
          </div>
          <div
            className="absolute top-2 right-1 text-sm animate-pulse pointer-events-none opacity-80 z-20"
            style={{ animationDuration: '1.8s' }}
          >
            🌌
          </div>
        </>
      )}

      {/* 3. 접지 그림자 */}
      <div
        style={{
          position: 'absolute',
          bottom: '0px',
          left: '8%',
          width: '84%',
          height: '16px',
          background: 'radial-gradient(ellipse, rgba(46, 16, 101, 0.95) 0%, rgba(15, 23, 42, 0.6) 60%, transparent 85%)',
          borderRadius: '9999px',
          pointerEvents: 'none',
        }}
      />

      {/* 4. 스페이스 고질라 벡터 SVG */}
      <svg
        viewBox="0 0 280 250"
        className={`h-full w-auto max-h-full block object-contain pointer-events-none ${
          isHit ? 'animate-boss-hit' : isCritical ? 'animate-boss-tremble' : ''
        }`}
        style={{
          filter: isDefeated
            ? 'grayscale(0.85) contrast(1.1) opacity(0.5)'
            : isHit
            ? 'drop-shadow(0 0 24px #ef4444) brightness(2)'
            : isCritical
            ? 'drop-shadow(0 0 20px #ef4444) saturate(1.4)'
            : isWounded
            ? 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.85))'
            : 'drop-shadow(0 8px 18px rgba(124, 58, 237, 0.7))',
          transition: 'filter 0.25s ease',
        }}
      >
        <defs>
          {/* 짙은 남보라색 우주 피부 그라디언트 */}
          <linearGradient id="sg-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4338ca" />
            <stop offset="35%" stopColor="#312e81" />
            <stop offset="70%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* ★ 양 어깨 거대 코로나 크리스털 결정체 그라디언트 ★ */}
          <linearGradient id="sg-crystal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#e0f2fe" />
            <stop offset="60%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* 크리스털 림 하이라이트 */}
          <linearGradient id="sg-crystal-rim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#7dd3fc" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.9" />
          </linearGradient>

          {/* 머리 왕관 뿔 황색 크리스털 */}
          <linearGradient id="sg-crest-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#fde047" />
            <stop offset="80%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          {/* 붉은 안광 그라디언트 */}
          <radialGradient id="sg-eye-red" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#fca5a5" />
            <stop offset="70%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </radialGradient>

          <filter id="sg-crystal-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* [A] 배후 크리스털 꼬리 & 등 결정 지느러미 */}
        <g id="sg-tail-and-spines">
          {/* 육중한 꼬리 */}
          <path
            d="M210 185 C245 195, 270 215, 265 235 C255 242, 235 238, 220 225 C205 210, 200 195, 210 185 Z"
            fill="url(#sg-body)"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* 꼬리 끝 크리스털 침들 */}
          <polygon points="265,235 278,240 268,245" fill="url(#sg-crystal)" />
          <polygon points="260,230 274,232 265,238" fill="url(#sg-crystal)" />

          {/* 등 뒤 솟아난 소형 크리스털 지느러미 3열 */}
          <polygon points="188,75 212,58 200,95" fill="url(#sg-crystal)" stroke="#7dd3fc" strokeWidth="1.2" />
          <polygon points="208,105 232,88 215,130" fill="url(#sg-crystal)" stroke="#7dd3fc" strokeWidth="1.2" />
          <polygon points="222,140 245,128 228,165" fill="url(#sg-crystal)" stroke="#7dd3fc" strokeWidth="1.2" />
        </g>

        {/* [B] ★ 양 어깨 거대 코로나 크리스털 기둥 (Gigantic Shoulder Crystals) ★ */}
        <g id="sg-shoulder-crystals" filter="url(#sg-crystal-glow)">
          {/* 좌측 어깨 대형 크리스털 */}
          <polygon
            points="58,125 40,25 72,12 88,115"
            fill="url(#sg-crystal)"
            stroke="url(#sg-crystal-rim)"
            strokeWidth="2"
          />
          {/* 좌측 크리스털 보조 면들 (Facet Lines) */}
          <polygon points="58,125 40,25 58,40 75,120" fill="#bae6fd" opacity="0.6" />
          <line x1="58" y1="40" x2="72" y2="12" stroke="#ffffff" strokeWidth="1.5" />

          {/* 우측 어깨 대형 크리스털 */}
          <polygon
            points="192,115 208,12 240,25 222,125"
            fill="url(#sg-crystal)"
            stroke="url(#sg-crystal-rim)"
            strokeWidth="2"
          />
          {/* 우측 크리스털 보조 면들 */}
          <polygon points="192,115 208,12 222,40 205,120" fill="#bae6fd" opacity="0.6" />
          <line x1="222" y1="40" x2="208" y2="12" stroke="#ffffff" strokeWidth="1.5" />
        </g>

        {/* [C] 육중한 하체 & 다리 */}
        <g id="sg-legs">
          <path d="M68 185 L92 185 L108 238 L58 238 Z" fill="url(#sg-body)" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="52,244 44,242 56,236" fill="#7dd3fc" />
          <polygon points="78,246 72,248 84,248" fill="#7dd3fc" />
          <polygon points="112,244 120,242 110,236" fill="#7dd3fc" />

          <path d="M172 185 L196 185 L212 238 L162 238 Z" fill="url(#sg-body)" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="156,244 148,242 160,236" fill="#7dd3fc" />
          <polygon points="216,244 224,242 214,236" fill="#7dd3fc" />
        </g>

        {/* [D] 두터운 가슴판 & 흉부 (붉은 아가미 흉터/코어) */}
        <g id="sg-torso">
          {/* 몸통 실루엣 */}
          <path
            d="M85 105 C85 90, 115 85, 140 85 C165 85, 195 90, 195 105 C210 145, 205 185, 192 205 C162 212, 118 212, 88 205 C75 185, 70 145, 85 105 Z"
            fill="url(#sg-body)"
            stroke="#1e1b4b"
            strokeWidth="3.5"
          />

          {/* 가슴 붉은색 에너지 코어 / 아가미 슬릿 */}
          <path d="M102 125 C115 145, 130 155, 140 155 C150 155, 165 145, 178 125 Z" fill="#431407" stroke="#ea580c" strokeWidth="2" />
          <path d="M110 132 C120 145, 132 150, 140 150 C148 150, 160 145, 170 132" stroke="#f97316" strokeWidth="2" fill="none" />
          <circle cx="140" cy="142" r="7" fill="#fef08a" filter="url(#sg-crystal-glow)" />

          {/* 복부 비늘 질감 */}
          <path d="M105 170 Q140 178, 175 170" stroke="#4338ca" strokeWidth="2" fill="none" />
          <path d="M110 190 Q140 198, 170 190" stroke="#4338ca" strokeWidth="2" fill="none" />
        </g>

        {/* [E] 발톱 팔 */}
        <g id="sg-arms">
          <path d="M85 115 L62 145 L52 180 L70 182 L80 155 L96 128 Z" fill="url(#sg-body)" stroke="#1e1b4b" strokeWidth="2" />
          <polygon points="50,180 42,192 54,188" fill="#7dd3fc" />
          <polygon points="56,182 52,198 62,190" fill="#7dd3fc" />

          <path d="M195 115 L218 145 L228 180 L210 182 L200 155 L184 128 Z" fill="url(#sg-body)" stroke="#1e1b4b" strokeWidth="2" />
          <polygon points="230,180 238,192 226,188" fill="#7dd3fc" />
          <polygon points="224,182 228,198 218,190" fill="#7dd3fc" />
        </g>

        {/* [F] ★ 고질라 두부 & 이마 황금 크리스털 혼 & 붉은 눈동자 ★ */}
        <g id="sg-head">
          {/* 목 */}
          <rect x="122" y="78" width="36" height="24" fill="#1e1b4b" />

          {/* 머리 본체 */}
          <path
            d="M105 52 C115 35, 140 32, 140 32 C140 32, 165 35, 175 52 C185 70, 178 88, 168 92 L112 92 C102 88, 95 70, 105 52 Z"
            fill="url(#sg-body)"
            stroke="#1e1b4b"
            strokeWidth="3"
          />

          {/* ★ 이마 왕관 중앙 황금 크리스털 뿔 (Golden Crest Crystal) ★ */}
          <polygon
            points="140,12 148,45 132,45"
            fill="url(#sg-crest-yellow)"
            stroke="#ea580c"
            strokeWidth="1.5"
            filter="url(#sg-crystal-glow)"
          />

          {/* 턱 송곳니 & 입안 */}
          <polygon points="120,78 124,85 128,78" fill="#ffffff" />
          <polygon points="152,78 156,85 160,78" fill="#ffffff" />
          <path d="M115 88 Q140 94, 165 88" stroke="#1e1b4b" strokeWidth="2" fill="none" />

          {/* ★ 사악하게 빛나는 붉은 눈 (Sinister Red Eyes) ★ */}
          <g filter="url(#sg-crystal-glow)">
            <ellipse cx="120" cy="62" rx="7.5" ry="5" fill="url(#sg-eye-red)" />
            <circle cx="120" cy="62" r="2.5" fill="#ffffff" />

            <ellipse cx="160" cy="62" rx="7.5" ry="5" fill="url(#sg-eye-red)" />
            <circle cx="160" cy="62" r="2.5" fill="#ffffff" />
          </g>
        </g>
      </svg>

      {/* 5. 격퇴 시 크리스털 파쇄 이펙트 */}
      {isDefeated && (
        <div
          className="animate-bounce pointer-events-none"
          style={{
            position: 'absolute',
            top: '8%',
            right: '25%',
            fontSize: '22px',
            zIndex: 20,
          }}
        >
          💫💎
        </div>
      )}
    </div>
  );
};
