import React from 'react';

interface MechagodzillaProps {
  isHit: boolean;
  isDefeated: boolean;
  hp?: number;
  className?: string;
}

export const Mechagodzilla: React.FC<MechagodzillaProps> = ({
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
          ? 'rotate(15deg) translateY(22px) scale(0.92)'
          : isHit
          ? 'scale(1.04) translateX(4px)'
          : isCritical
          ? 'scale(0.98)'
          : 'scale(1)',
        opacity: isDefeated ? 0.45 : 1,
      }}
    >
      {/* 1. 피격 시 스파크 폭발 / 평상시 사이버네틱 블루 아우라 */}
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
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(56, 189, 248, 0.25) 50%, transparent 80%)'
              : 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(30, 58, 138, 0.2) 55%, transparent 85%)',
            filter: 'blur(16px)',
            borderRadius: '9999px',
          }}
        />
      ) : null}

      {/* 2. 상공 전자 스파크 & 미사일 배기 파티클 */}
      {!isDefeated && (
        <>
          <div
            className="absolute -top-4 right-6 text-sm animate-bounce pointer-events-none opacity-90 z-20"
            style={{ animationDuration: '1.6s' }}
          >
            ⚡
          </div>
          <div
            className="absolute -top-2 left-6 text-xs animate-ping pointer-events-none opacity-70 z-20"
            style={{ animationDuration: '2.5s' }}
          >
            🔴
          </div>
          <div
            className="absolute top-4 right-1 text-xs animate-pulse pointer-events-none opacity-80 z-20"
          >
            🚀
          </div>
        </>
      )}

      {/* 3. 접지 메탈 그림자 */}
      <div
        style={{
          position: 'absolute',
          bottom: '0px',
          left: '10%',
          width: '80%',
          height: '14px',
          background: 'radial-gradient(ellipse, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.6) 60%, transparent 85%)',
          borderRadius: '9999px',
          pointerEvents: 'none',
        }}
      />

      {/* 4. 메카고질라 벡터 SVG */}
      <svg
        viewBox="0 0 280 250"
        className={`h-full w-auto max-h-full block object-contain pointer-events-none ${
          isHit ? 'animate-boss-hit' : isCritical ? 'animate-boss-tremble' : ''
        }`}
        style={{
          filter: isDefeated
            ? 'grayscale(0.9) contrast(1.1) opacity(0.5)'
            : isHit
            ? 'drop-shadow(0 0 22px #ef4444) brightness(2)'
            : isCritical
            ? 'drop-shadow(0 0 18px #ef4444) saturate(1.3)'
            : isWounded
            ? 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.8))'
            : 'drop-shadow(0 8px 18px rgba(14, 165, 233, 0.6))',
          transition: 'filter 0.25s ease',
        }}
      >
        <defs>
          {/* 메탈 장갑 메인 그라디언트 */}
          <linearGradient id="mg-metal-main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="30%" stopColor="#94a3b8" />
            <stop offset="70%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* 짙은 건메탈 관절 및 프레임 그라디언트 */}
          <linearGradient id="mg-dark-frame" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* 어깨 미사일 포드 블루/실버 하이라이트 */}
          <linearGradient id="mg-pod-blue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* 붉게 타오르는 로봇 안광 그라디언트 */}
          <radialGradient id="mg-eye-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fca5a5" />
            <stop offset="60%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </radialGradient>

          <filter id="mg-laser-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* [A] 배후 기계식 강철 꼬리 & 등지느러미 안테나 */}
        <g id="mg-tail-and-back-plates">
          {/* 육중한 메탈 테일 */}
          <path
            d="M220 185 C255 195, 275 220, 270 238 C265 244, 250 240, 235 228 C215 212, 205 195, 220 185 Z"
            fill="url(#mg-dark-frame)"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* 등판 강철 지느러미(Fin) 3단 */}
          <polygon points="190,75 215,60 205,95" fill="url(#mg-pod-blue)" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="210,105 235,92 220,130" fill="url(#mg-pod-blue)" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="225,140 248,132 232,165" fill="url(#mg-pod-blue)" stroke="#38bdf8" strokeWidth="1.5" />
        </g>

        {/* [B] 양 어깨 미사일 포드 유닛 (Dual Missile Pods) */}
        <g id="mg-missile-pods">
          {/* 좌측 어깨 미사일 런처 */}
          <rect x="52" y="72" width="42" height="34" rx="6" fill="url(#mg-dark-frame)" stroke="#38bdf8" strokeWidth="2" />
          <rect x="56" y="76" width="34" height="26" rx="4" fill="#0f172a" />
          {/* 미사일 탄두 6발 (좌) */}
          <circle cx="63" cy="83" r="3.5" fill="#ef4444" />
          <circle cx="73" cy="83" r="3.5" fill="#ef4444" />
          <circle cx="83" cy="83" r="3.5" fill="#ef4444" />
          <circle cx="63" cy="95" r="3.5" fill="#ef4444" />
          <circle cx="73" cy="95" r="3.5" fill="#ef4444" />
          <circle cx="83" cy="95" r="3.5" fill="#ef4444" />

          {/* 우측 어깨 미사일 런처 */}
          <rect x="186" y="72" width="42" height="34" rx="6" fill="url(#mg-dark-frame)" stroke="#38bdf8" strokeWidth="2" />
          <rect x="190" y="76" width="34" height="26" rx="4" fill="#0f172a" />
          {/* 미사일 탄두 6발 (우) */}
          <circle cx="197" cy="83" r="3.5" fill="#ef4444" />
          <circle cx="207" cy="83" r="3.5" fill="#ef4444" />
          <circle cx="217" cy="83" r="3.5" fill="#ef4444" />
          <circle cx="197" cy="95" r="3.5" fill="#ef4444" />
          <circle cx="207" cy="95" r="3.5" fill="#ef4444" />
          <circle cx="217" cy="95" r="3.5" fill="#ef4444" />
        </g>

        {/* [C] 육중한 메탈 하체 & 다리 */}
        <g id="mg-legs-and-feet">
          {/* 왼쪽 다리 강철 플레이트 */}
          <path d="M60 180 L80 180 L95 235 L50 235 Z" fill="url(#mg-dark-frame)" stroke="#0f172a" strokeWidth="2" />
          <rect x="42" y="232" width="56" height="12" rx="3" fill="url(#mg-metal-main)" stroke="#0f172a" strokeWidth="2" />
          {/* 발톱 3개 리벳 */}
          <polygon points="42,244 36,242 42,238" fill="#38bdf8" />
          <polygon points="62,244 58,246 66,246" fill="#38bdf8" />
          <polygon points="98,244 104,242 98,238" fill="#38bdf8" />

          {/* 오른쪽 다리 */}
          <path d="M180 180 L205 180 L220 235 L175 235 Z" fill="url(#mg-dark-frame)" stroke="#0f172a" strokeWidth="2" />
          <rect x="172" y="232" width="56" height="12" rx="3" fill="url(#mg-metal-main)" stroke="#0f172a" strokeWidth="2" />
          <polygon points="172,244 166,242 172,238" fill="#38bdf8" />
          <polygon points="228,244 234,242 228,238" fill="#38bdf8" />
        </g>

        {/* [D] 견고한 합금 몸체 (토르소 및 가슴 메가 플라즈마 캐논 챔버) */}
        <g id="mg-torso">
          {/* 흉곽 메인 아머 */}
          <path
            d="M80 105 L200 105 L215 185 L65 185 Z"
            fill="url(#mg-metal-main)"
            stroke="#1e293b"
            strokeWidth="3"
          />
          {/* 가슴 중앙 플라즈마 그레네이드 원형 코어 */}
          <circle cx="140" cy="148" r="24" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="140" cy="148" r="16" fill="url(#mg-pod-blue)" />
          <circle cx="140" cy="148" r="8" fill="#e0f2fe" filter="url(#mg-laser-glow)" />

          {/* 리벳 및 각진 장갑 분할선 */}
          <line x1="80" y1="135" x2="114" y2="135" stroke="#334155" strokeWidth="2" />
          <line x1="166" y1="135" x2="200" y2="135" stroke="#334155" strokeWidth="2" />
          <line x1="100" y1="105" x2="100" y2="185" stroke="#1e293b" strokeWidth="2" />
          <line x1="180" y1="105" x2="180" y2="185" stroke="#1e293b" strokeWidth="2" />

          {/* 복부 관절 실린더 */}
          <rect x="90" y="185" width="100" height="15" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="110" cy="192" r="3" fill="#94a3b8" />
          <circle cx="140" cy="192" r="3" fill="#94a3b8" />
          <circle cx="170" cy="192" r="3" fill="#94a3b8" />
        </g>

        {/* [E] 강철 팔 & 레이저 핸드 클로 */}
        <g id="mg-arms">
          {/* 왼쪽 팔 */}
          <path d="M75 115 L50 145 L40 185 L58 188 L70 155 L85 125 Z" fill="url(#mg-dark-frame)" stroke="#0f172a" strokeWidth="2" />
          {/* 왼손 핑거 클로 */}
          <polygon points="38,185 30,198 42,192" fill="#cbd5e1" />
          <polygon points="44,188 40,204 50,195" fill="#cbd5e1" />
          <polygon points="54,188 56,204 62,194" fill="#cbd5e1" />

          {/* 오른쪽 팔 */}
          <path d="M205 115 L230 145 L240 185 L222 188 L210 155 L195 125 Z" fill="url(#mg-dark-frame)" stroke="#0f172a" strokeWidth="2" />
          {/* 오른손 핑거 클로 */}
          <polygon points="242,185 250,198 238,192" fill="#cbd5e1" />
          <polygon points="236,188 240,204 230,195" fill="#cbd5e1" />
          <polygon points="226,188 224,204 218,194" fill="#cbd5e1" />
        </g>

        {/* [F] ★ 각진 기계 두부 & 붉게 빛나는 트윈 바이저 아이 ★ */}
        <g id="mg-head">
          {/* 목 실린더 */}
          <rect x="120" y="80" width="40" height="28" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />

          {/* 기계 두개골 메탈 헬멧 */}
          <path
            d="M102 45 L178 45 L188 78 L168 92 L112 92 L92 78 Z"
            fill="url(#mg-metal-main)"
            stroke="#0f172a"
            strokeWidth="2.5"
          />

          {/* 정수리 통신 안테나 핀 */}
          <polygon points="140,22 135,45 145,45" fill="url(#mg-pod-blue)" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="140" cy="22" r="2.5" fill="#ef4444" />

          {/* 강철 하악 & 이빨 슬릿 */}
          <rect x="115" y="78" width="50" height="12" fill="#0f172a" rx="2" />
          {/* 날카로운 기계 톱니 이빨 */}
          <path d="M117 78 L121 84 L125 78 L129 84 L133 78 L137 84 L141 78 L145 84 L149 78 L153 84 L157 78 L161 84 L165 78" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />

          {/* ★ 붉은 광선 트윈 로봇 아이 (Twin Crimson Visor Eyes) ★ */}
          <g filter="url(#mg-laser-glow)">
            {/* 좌측 사각 바이저 눈 */}
            <polygon points="112,58 132,58 130,69 114,69" fill="url(#mg-eye-glow)" stroke="#ef4444" strokeWidth="1.5" />
            {/* 우측 사각 바이저 눈 */}
            <polygon points="148,58 168,58 166,69 150,69" fill="url(#mg-eye-glow)" stroke="#ef4444" strokeWidth="1.5" />
          </g>
        </g>
      </svg>

      {/* 5. 격퇴 시 합선 스파크 이펙트 */}
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
          💥⚡
        </div>
      )}
    </div>
  );
};
