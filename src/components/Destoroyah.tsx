import React from 'react';

interface DestoroyahProps {
  isHit: boolean;
  isDefeated: boolean;
  hp?: number;
  className?: string;
}

export const Destoroyah: React.FC<DestoroyahProps> = ({
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
          ? 'rotate(-12deg) translateY(24px) scale(0.9)'
          : isHit
          ? 'scale(1.05) translateY(-4px)'
          : isCritical
          ? 'scale(0.98)'
          : 'scale(1)',
        opacity: isDefeated ? 0.45 : 1,
      }}
    >
      {/* 1. 피격 시 화염 폭발 / 평상시 옥시전 디스트로이어 진홍빛 악마 아우라 */}
      {isHit ? (
        <div
          style={{
            position: 'absolute',
            inset: '-10px',
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
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
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.5) 0%, rgba(245, 158, 11, 0.3) 50%, transparent 80%)'
              : 'radial-gradient(circle, rgba(220, 38, 38, 0.45) 0%, rgba(88, 28, 135, 0.3) 55%, transparent 85%)',
            filter: 'blur(16px)',
            borderRadius: '9999px',
          }}
        />
      ) : null}

      {/* 2. 상공 악마 불꽃 파티클 */}
      {!isDefeated && (
        <>
          <div
            className="absolute -top-5 right-8 text-base animate-bounce pointer-events-none opacity-85 z-20"
            style={{ animationDuration: '2s' }}
          >
            🔥
          </div>
          <div
            className="absolute -top-3 left-6 text-xs animate-pulse pointer-events-none opacity-80 z-20"
            style={{ animationDuration: '1.7s' }}
          >
            ⚡
          </div>
          <div
            className="absolute top-2 right-2 text-sm animate-ping pointer-events-none opacity-70 z-20"
            style={{ animationDuration: '2.8s' }}
          >
            🩸
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
          background: 'radial-gradient(ellipse, rgba(69, 10, 10, 0.95) 0%, rgba(15, 23, 42, 0.6) 60%, transparent 85%)',
          borderRadius: '9999px',
          pointerEvents: 'none',
        }}
      />

      {/* 4. 완전체 데스토로이아 벡터 SVG */}
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
            ? 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.85))'
            : 'drop-shadow(0 8px 18px rgba(185, 28, 28, 0.7))',
          transition: 'filter 0.25s ease',
        }}
      >
        <defs>
          {/* 진홍빛 갑각 그라디언트 */}
          <linearGradient id="des-shell-main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="35%" stopColor="#991b1b" />
            <stop offset="70%" stopColor="#7f1d1d" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          {/* 거대 박쥐 날개 피막 그라디언트 */}
          <linearGradient id="des-wing-membrane" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#991b1b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2e1065" stopOpacity="0.95" />
          </linearGradient>

          {/* 이마 레이저 혼 황금/옐로우 레이저 발광 */}
          <linearGradient id="des-horn-laser" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="65%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>

          {/* 악마 눈동자 발광 필터 */}
          <filter id="des-laser-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* [A] 배후 거대한 박쥐형 악마 날개 (Giant Demonic Wings) */}
        <g id="des-wings">
          {/* 좌측 거대 날개 */}
          <path
            d="M95 105 C70 50, 20 28, 5 35 C-5 65, 12 115, 45 145 C65 130, 85 120, 95 105 Z"
            fill="url(#des-wing-membrane)"
            stroke="#450a0a"
            strokeWidth="3"
          />
          {/* 좌측 날개 골격 (Bone ribs) */}
          <path d="M95 105 Q35 55, 5 35 M95 105 Q45 90, 15 105 M95 105 Q65 125, 45 145" stroke="#7f1d1d" strokeWidth="2.5" fill="none" />
          {/* 날개 끝 뼈 발톱 */}
          <polygon points="5,35 15,30 10,42" fill="#facc15" />

          {/* 우측 거대 날개 */}
          <path
            d="M185 105 C210 50, 260 28, 275 35 C285 65, 268 115, 235 145 C215 130, 195 120, 185 105 Z"
            fill="url(#des-wing-membrane)"
            stroke="#450a0a"
            strokeWidth="3"
          />
          {/* 우측 날개 골격 */}
          <path d="M185 105 Q245 55, 275 35 M185 105 Q235 90, 265 105 M185 105 Q215 125, 235 145" stroke="#7f1d1d" strokeWidth="2.5" fill="none" />
          {/* 날개 끝 발톱 */}
          <polygon points="275,35 265,30 270,42" fill="#facc15" />
        </g>

        {/* [B] 집게 꼬리 (Scorpion-like Pincer Tail) */}
        <g id="des-tail">
          <path
            d="M210 190 C245 200, 265 218, 255 238 C248 244, 230 238, 215 225 C198 212, 195 198, 210 190 Z"
            fill="url(#des-shell-main)"
            stroke="#450a0a"
            strokeWidth="2"
          />
          {/* 꼬리 끝 집게 가시 */}
          <polygon points="255,238 270,246 258,250" fill="#facc15" />
          <polygon points="255,238 266,230 262,242" fill="#facc15" />
        </g>

        {/* [C] 육중한 다리 & 발톱 */}
        <g id="des-legs">
          {/* 좌측 다리 갑각 */}
          <path d="M65 185 L90 185 L105 238 L55 238 Z" fill="url(#des-shell-main)" stroke="#450a0a" strokeWidth="2.5" />
          <polygon points="50,242 42,240 54,234" fill="#facc15" />
          <polygon points="75,244 70,246 80,246" fill="#facc15" />
          <polygon points="108,242 116,240 106,234" fill="#facc15" />

          {/* 우측 다리 갑각 */}
          <path d="M175 185 L200 185 L215 238 L165 238 Z" fill="url(#des-shell-main)" stroke="#450a0a" strokeWidth="2.5" />
          <polygon points="160,242 152,240 164,234" fill="#facc15" />
          <polygon points="218,242 226,240 216,234" fill="#facc15" />
        </g>

        {/* [D] 흉갑 (가슴 꽃모양 갑각판 & 복부) */}
        <g id="des-torso">
          {/* 몸통 메인 실루엣 */}
          <path
            d="M80 110 C80 95, 110 88, 140 88 C170 88, 200 95, 200 110 C215 150, 210 190, 195 210 C165 215, 115 215, 85 210 C70 190, 65 150, 80 110 Z"
            fill="url(#des-shell-main)"
            stroke="#260404"
            strokeWidth="3.5"
          />
          {/* 가슴 중앙 옥시전 디스트로이어 붉은 코어 판 */}
          <polygon points="140,118 165,140 155,175 125,175 115,140" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
          <polygon points="140,126 156,142 150,165 130,165 124,142" fill="#ef4444" opacity="0.8" />
          <circle cx="140" cy="148" r="8" fill="#fef08a" filter="url(#des-laser-glow)" />

          {/* 어깨 뿔 돌기 */}
          <polygon points="85,115 65,98 85,108" fill="#facc15" stroke="#7f1d1d" strokeWidth="1.5" />
          <polygon points="195,115 215,98 195,108" fill="#facc15" stroke="#7f1d1d" strokeWidth="1.5" />
        </g>

        {/* [E] 갑각 팔 & 대형 집게발 손 (Pincer Claws) */}
        <g id="des-arms">
          {/* 좌측 팔 */}
          <path d="M78 125 L50 155 L42 195 L62 198 L72 165 L88 135 Z" fill="url(#des-shell-main)" stroke="#260404" strokeWidth="2" />
          {/* 집게손 */}
          <path d="M42 195 C32 205, 30 220, 38 226 C45 220, 48 208, 48 195 Z" fill="#b91c1c" stroke="#facc15" strokeWidth="1.5" />
          <path d="M48 195 C55 208, 62 222, 54 228 C48 220, 45 208, 48 195 Z" fill="#b91c1c" stroke="#facc15" strokeWidth="1.5" />

          {/* 우측 팔 */}
          <path d="M202 125 L230 155 L238 195 L218 198 L208 165 L192 135 Z" fill="url(#des-shell-main)" stroke="#260404" strokeWidth="2" />
          {/* 집게손 */}
          <path d="M238 195 C248 205, 250 220, 242 226 C235 220, 232 208, 232 195 Z" fill="#b91c1c" stroke="#facc15" strokeWidth="1.5" />
          <path d="M232 195 C225 208, 218 222, 226 228 C232 220, 235 208, 232 195 Z" fill="#b91c1c" stroke="#facc15" strokeWidth="1.5" />
        </g>

        {/* [F] ★ 데스토로이아 두부 & 거대 황금 레이저 혼(Laser Horn) ★ */}
        <g id="des-head">
          {/* 목 */}
          <path d="M115 85 L165 85 L170 102 L110 102 Z" fill="#450a0a" />

          {/* 머리 악마형 헬멧 갑각 */}
          <path
            d="M95 52 C105 35, 135 32, 140 32 C145 32, 175 35, 185 52 C195 72, 185 88, 175 92 L105 92 C95 88, 85 72, 95 52 Z"
            fill="url(#des-shell-main)"
            stroke="#260404"
            strokeWidth="3"
          />

          {/* ★ 이마 중앙의 상징: 초강력 레이저 혼 (Laser Horn) ★ */}
          <polygon
            points="140,8 148,46 132,46"
            fill="url(#des-horn-laser)"
            stroke="#ea580c"
            strokeWidth="1.5"
            filter="url(#des-laser-glow)"
          />

          {/* 양옆 악마 뿔 2쌍 */}
          <polygon points="105,42 85,28 102,48" fill="#facc15" stroke="#7f1d1d" strokeWidth="1.5" />
          <polygon points="175,42 195,28 178,48" fill="#facc15" stroke="#7f1d1d" strokeWidth="1.5" />

          {/* 좌우 턱 집게 이빨 (Crustacean Mandibles) */}
          <path d="M102 78 Q92 88, 108 94 Q114 88, 108 80 Z" fill="#fef08a" stroke="#7f1d1d" strokeWidth="1.2" />
          <path d="M178 78 Q188 88, 172 94 Q166 88, 172 80 Z" fill="#fef08a" stroke="#7f1d1d" strokeWidth="1.2" />

          {/* 입 안쪽 붉은 공동 & 송곳니 */}
          <ellipse cx="140" cy="82" rx="18" ry="8" fill="#180404" />
          <polygon points="128,78 132,84 135,78" fill="#ffffff" />
          <polygon points="145,78 148,84 152,78" fill="#ffffff" />

          {/* ★ 사악하게 빛나는 황색/붉은빛 악마 눈 ★ */}
          <g filter="url(#des-laser-glow)">
            {/* 좌측 눈 */}
            <ellipse cx="122" cy="62" rx="8.5" ry="5.5" fill="#fef08a" stroke="#ef4444" strokeWidth="2" />
            <ellipse cx="122" cy="62" rx="3.5" ry="5" fill="#b91c1c" />
            {/* 우측 눈 */}
            <ellipse cx="158" cy="62" rx="8.5" ry="5.5" fill="#fef08a" stroke="#ef4444" strokeWidth="2" />
            <ellipse cx="158" cy="62" rx="3.5" ry="5" fill="#b91c1c" />
          </g>
        </g>
      </svg>

      {/* 5. 격퇴 시 어지러움 별 & 연기 */}
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
          💫🩸
        </div>
      )}
    </div>
  );
};
