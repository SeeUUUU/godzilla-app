import React from 'react';

interface GiganProps {
  isHit: boolean;
  isDefeated: boolean;
  hp?: number;
  className?: string;
}

export const Gigan: React.FC<GiganProps> = ({
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
          ? 'rotate(18deg) translateY(22px) scale(0.9)'
          : isHit
          ? 'scale(1.05) rotate(2deg)'
          : isCritical
          ? 'scale(0.98)'
          : 'scale(1)',
        opacity: isDefeated ? 0.45 : 1,
      }}
    >
      {/* 1. 피격 시 붉은 스파크 / 평상시 사이보그 황금·진녹색 에너지 아우라 */}
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
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.45) 0%, rgba(234, 179, 8, 0.3) 50%, transparent 80%)'
              : 'radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, rgba(22, 101, 52, 0.3) 55%, transparent 85%)',
            filter: 'blur(16px)',
            borderRadius: '9999px',
          }}
        />
      ) : null}

      {/* 2. 가이강 회전톱 & 낫 스파크 파티클 */}
      {!isDefeated && (
        <>
          <div
            className="absolute -top-4 right-8 text-sm animate-bounce pointer-events-none opacity-85 z-20"
            style={{ animationDuration: '1.9s' }}
          >
            🪓
          </div>
          <div
            className="absolute top-12 left-4 text-xs animate-spin pointer-events-none opacity-80 z-20"
            style={{ animationDuration: '3s' }}
          >
            ⚙️
          </div>
          <div
            className="absolute top-4 right-2 text-xs animate-ping pointer-events-none opacity-75 z-20"
            style={{ animationDuration: '2.2s' }}
          >
            ⚡
          </div>
        </>
      )}

      {/* 3. 접지 그림자 */}
      <div
        style={{
          position: 'absolute',
          bottom: '0px',
          left: '10%',
          width: '80%',
          height: '14px',
          background: 'radial-gradient(ellipse, rgba(20, 83, 45, 0.95) 0%, rgba(15, 23, 42, 0.6) 60%, transparent 85%)',
          borderRadius: '9999px',
          pointerEvents: 'none',
        }}
      />

      {/* 4. 가이강(Gigan) 벡터 SVG */}
      <svg
        viewBox="0 0 280 250"
        className={`h-full w-auto max-h-full block object-contain pointer-events-none ${
          isHit ? 'animate-boss-hit' : isCritical ? 'animate-boss-tremble' : ''
        }`}
        style={{
          filter: isDefeated
            ? 'grayscale(0.85) contrast(1.1) opacity(0.5)'
            : isHit
            ? 'drop-shadow(0 0 22px #ef4444) brightness(2)'
            : isCritical
            ? 'drop-shadow(0 0 18px #ef4444) saturate(1.3)'
            : isWounded
            ? 'drop-shadow(0 0 16px rgba(234, 179, 8, 0.8))'
            : 'drop-shadow(0 8px 18px rgba(202, 138, 4, 0.65))',
          transition: 'filter 0.25s ease',
        }}
      >
        <defs>
          {/* 가이강 비늘 피부 녹색 그라디언트 */}
          <linearGradient id="gigan-skin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="40%" stopColor="#14532d" />
            <stop offset="80%" stopColor="#052e16" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* 강철 낫 블레이드 메탈릭 실버 그라디언트 */}
          <linearGradient id="gigan-blade" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#cbd5e1" />
            <stop offset="65%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* 황금 지느러미 날개 및 뿔 골드 그라디언트 */}
          <linearGradient id="gigan-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          {/* 붉은 단안 바이저 아이 그라디언트 */}
          <linearGradient id="gigan-visor" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="40%" stopColor="#ff2200" />
            <stop offset="60%" stopColor="#ffffff" />
            <stop offset="80%" stopColor="#ff2200" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>

          <filter id="gigan-visor-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* [A] 배후 3중 황금 돛 지느러미 날개 (Sail Fins) & 꼬리 */}
        <g id="gigan-back-fins">
          {/* 중앙 황금 돛 지느러미 */}
          <polygon points="175,45 225,25 210,85" fill="url(#gigan-gold)" stroke="#854d0e" strokeWidth="1.5" />
          <polygon points="195,85 240,70 225,125" fill="url(#gigan-gold)" stroke="#854d0e" strokeWidth="1.5" />
          <polygon points="210,125 250,115 235,165" fill="url(#gigan-gold)" stroke="#854d0e" strokeWidth="1.5" />
          {/* 꼬리 가시 */}
          <path d="M210 185 C240 195, 265 215, 260 235 C250 240, 235 235, 220 222 C205 210, 200 195, 210 185 Z" fill="url(#gigan-skin)" stroke="#052e16" strokeWidth="2" />
          <polygon points="260,235 272,242 262,246" fill="url(#gigan-gold)" />
        </g>

        {/* [B] 하체 및 다리 */}
        <g id="gigan-legs">
          <path d="M68 185 L92 185 L108 238 L58 238 Z" fill="url(#gigan-skin)" stroke="#052e16" strokeWidth="2" />
          <polygon points="52,244 44,242 56,236" fill="url(#gigan-gold)" />
          <polygon points="78,246 72,248 84,248" fill="url(#gigan-gold)" />
          <polygon points="112,244 120,242 110,236" fill="url(#gigan-gold)" />

          <path d="M172 185 L196 185 L212 238 L162 238 Z" fill="url(#gigan-skin)" stroke="#052e16" strokeWidth="2" />
          <polygon points="156,244 148,242 160,236" fill="url(#gigan-gold)" />
          <polygon points="216,244 224,242 214,236" fill="url(#gigan-gold)" />
        </g>

        {/* [C] 몸통 & ★ 가슴 중앙 회전 톱니바퀴 그라인더(Buzzsaw) ★ */}
        <g id="gigan-torso">
          {/* 사이보그 흉부 실루엣 */}
          <path
            d="M85 105 C85 90, 115 85, 140 85 C165 85, 195 90, 195 105 C208 145, 205 185, 190 205 C160 212, 120 212, 90 205 C75 185, 72 145, 85 105 Z"
            fill="url(#gigan-skin)"
            stroke="#022c12"
            strokeWidth="3"
          />

          {/* 복부 황금 사이보그 비늘 띠 */}
          <path d="M98 120 Q140 130, 182 120" stroke="url(#gigan-gold)" strokeWidth="3" fill="none" />
          <path d="M102 145 Q140 155, 178 145" stroke="url(#gigan-gold)" strokeWidth="3" fill="none" />
          <path d="M106 170 Q140 180, 174 170" stroke="url(#gigan-gold)" strokeWidth="3" fill="none" />
          <path d="M110 195 Q140 202, 170 195" stroke="url(#gigan-gold)" strokeWidth="2.5" fill="none" />

          {/* ★ 가슴 중앙 종단 톱니바퀴(Buzzsaw) 레일 ★ */}
          <rect x="133" y="105" width="14" height="98" fill="#1e293b" stroke="#0f172a" strokeWidth="2" rx="3" />
          {/* 회전 톱니 날 6개 */}
          <polygon points="140,110 148,118 140,126 132,118" fill="url(#gigan-blade)" stroke="#475569" strokeWidth="1" />
          <polygon points="140,126 148,134 140,142 132,134" fill="url(#gigan-blade)" stroke="#475569" strokeWidth="1" />
          <polygon points="140,142 148,150 140,158 132,150" fill="url(#gigan-blade)" stroke="#475569" strokeWidth="1" />
          <polygon points="140,158 148,166 140,174 132,166" fill="url(#gigan-blade)" stroke="#475569" strokeWidth="1" />
          <polygon points="140,174 148,182 140,190 132,182" fill="url(#gigan-blade)" stroke="#475569" strokeWidth="1" />
          <polygon points="140,190 148,196 140,202 132,196" fill="url(#gigan-blade)" stroke="#475569" strokeWidth="1" />
        </g>

        {/* [D] ★ 양손 거대 강철 낫 블레이드 (Steel Scythe Hooks) ★ */}
        <g id="gigan-scythe-arms">
          {/* 좌측 팔 어깨 관절 */}
          <path d="M85 115 L60 140 L50 170 L68 172 L78 148 L95 125 Z" fill="url(#gigan-skin)" />
          {/* 좌측 거대 곡면 낫 칼날 (Scythe Blade) */}
          <path
            d="M50 168 
               C30 185, 12 215, 16 235 
               C20 242, 28 238, 34 228 
               C48 205, 58 185, 68 172 Z"
            fill="url(#gigan-blade)"
            stroke="#1e293b"
            strokeWidth="2.5"
          />
          {/* 낫 날카로운 칼날 엣지 하이라이트 */}
          <path d="M16 235 C28 208, 48 182, 68 172" stroke="#ffffff" strokeWidth="2" fill="none" />

          {/* 우측 팔 어깨 관절 */}
          <path d="M195 115 L220 140 L230 170 L212 172 L202 148 L185 125 Z" fill="url(#gigan-skin)" />
          {/* 우측 거대 곡면 낫 칼날 */}
          <path
            d="M230 168 
               C250 185, 268 215, 264 235 
               C260 242, 252 238, 246 228 
               C232 205, 222 185, 212 172 Z"
            fill="url(#gigan-blade)"
            stroke="#1e293b"
            strokeWidth="2.5"
          />
          {/* 낫 엣지 하이라이트 */}
          <path d="M264 235 C252 208, 232 182, 212 172" stroke="#ffffff" strokeWidth="2" fill="none" />
        </g>

        {/* [E] ★ 가이강 두부 & 붉은 단안 고글 바이저(Single Visor Eye) ★ */}
        <g id="gigan-head">
          {/* 목 */}
          <rect x="122" y="78" width="36" height="24" fill="#0f172a" />

          {/* 머리 본체 실루엣 */}
          <path
            d="M108 55 C115 35, 140 32, 140 32 C140 32, 165 35, 172 55 C180 72, 172 88, 165 92 L115 92 C108 88, 100 72, 108 55 Z"
            fill="url(#gigan-skin)"
            stroke="#022c12"
            strokeWidth="2.5"
          />

          {/* 정수리 황금 뿔 1개 */}
          <polygon points="140,15 146,38 134,38" fill="url(#gigan-gold)" stroke="#854d0e" strokeWidth="1.5" />
          {/* 뒷머리 황금 핀 2개 */}
          <polygon points="122,35 106,22 120,42" fill="url(#gigan-gold)" />
          <polygon points="158,35 174,22 160,42" fill="url(#gigan-gold)" />

          {/* 금속 부리 & 턱 집게 */}
          <polygon points="140,95 132,78 148,78" fill="url(#gigan-gold)" stroke="#854d0e" strokeWidth="1.2" />
          <polygon points="120,82 110,88 122,88" fill="url(#gigan-blade)" />
          <polygon points="160,82 170,88 158,88" fill="url(#gigan-blade)" />

          {/* ★ 가이강의 상징: 가로로 길게 빛나는 붉은 단안 바이저(Single Cyclops Visor) ★ */}
          <g filter="url(#gigan-visor-glow)">
            {/* 바이저 프레임 */}
            <path d="M112 60 Q140 54, 168 60 L166 70 Q140 65, 114 70 Z" fill="#050505" stroke="#450a0a" strokeWidth="1.5" />
            {/* 붉게 타오르는 일자형 레이저 렌즈 */}
            <path d="M115 62 Q140 56, 165 62 L164 68 Q140 63, 116 68 Z" fill="url(#gigan-visor)" />
          </g>
        </g>
      </svg>

      {/* 5. 격퇴 시 톱니 고장 스파크 */}
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
          💥🪓
        </div>
      )}
    </div>
  );
};
