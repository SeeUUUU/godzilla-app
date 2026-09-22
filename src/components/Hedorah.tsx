import React from 'react';

interface HedorahProps {
  isHit: boolean;
  isDefeated: boolean;
  hp?: number;
  className?: string;
}

export const Hedorah: React.FC<HedorahProps> = ({
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
          ? 'scaleY(0.7) translateY(24px) scaleX(1.1)'
          : isHit
          ? 'scale(1.05) rotate(-2deg)'
          : isCritical
          ? 'scale(0.98)'
          : 'scale(1)',
        opacity: isDefeated ? 0.5 : 1,
      }}
    >
      {/* 1. 피격 시 독성 붉은 폭발 아우라 / 평상시 맹독 스모그 안개 오라 */}
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
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.45) 0%, rgba(168, 85, 247, 0.35) 45%, rgba(34, 197, 94, 0.2) 70%, transparent 85%)'
              : 'radial-gradient(circle, rgba(147, 51, 234, 0.45) 0%, rgba(34, 197, 94, 0.3) 50%, rgba(15, 23, 42, 0.2) 75%, transparent 90%)',
            filter: 'blur(16px)',
            borderRadius: '9999px',
          }}
        />
      ) : null}

      {/* 2. 스모그 괴수 상공 피어오르는 독성 연기 & 부유 파티클 */}
      {!isDefeated && (
        <>
          <div
            className="absolute -top-5 right-4 text-base animate-bounce pointer-events-none opacity-85 z-20"
            style={{ animationDuration: '2.4s' }}
          >
            💨
          </div>
          <div
            className="absolute -top-3 left-10 text-xs animate-pulse pointer-events-none opacity-75 z-20"
            style={{ animationDuration: '1.8s' }}
          >
            ☣️
          </div>
          <div
            className="absolute top-2 right-1 text-sm animate-ping pointer-events-none opacity-60 z-20"
            style={{ animationDuration: '3s' }}
          >
            🫧
          </div>
        </>
      )}

      {/* 3. 바닥 오염 진흙 접지 그림자 */}
      <div
        style={{
          position: 'absolute',
          bottom: '0px',
          left: '5%',
          width: '90%',
          height: '16px',
          background: 'radial-gradient(ellipse, rgba(46, 16, 101, 0.9) 0%, rgba(20, 83, 45, 0.6) 50%, transparent 80%)',
          borderRadius: '9999px',
          pointerEvents: 'none',
        }}
      />

      {/* 4. 스모그 괴수 헤도라(Hedorah) 전용 정밀 벡터 SVG 일러스트 */}
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
            ? 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.8))'
            : 'drop-shadow(0 8px 18px rgba(126, 34, 206, 0.65))',
          transition: 'filter 0.25s ease',
        }}
      >
        <defs>
          {/* 어둡고 끈적한 오염 슬라임 본체 그라디언트 */}
          <linearGradient id="hedorah-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c3a1e" />
            <stop offset="35%" stopColor="#1e2815" />
            <stop offset="65%" stopColor="#3b1d4a" />
            <stop offset="100%" stopColor="#141c10" />
          </linearGradient>

          {/* 등/어깨 침전물 및 진흙 덩어리 그라디언트 */}
          <linearGradient id="hedorah-mud-top" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#4d5f2a" />
            <stop offset="40%" stopColor="#303f1b" />
            <stop offset="100%" stopColor="#1f142b" />
          </linearGradient>

          {/* 맹독성 황산/공해 보라빛 하이라이트 그라디언트 */}
          <linearGradient id="hedorah-toxic-purple" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7e22ce" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.8" />
          </linearGradient>

          {/* 산성 오염 물질 녹색 하이라이트 */}
          <linearGradient id="hedorah-acid-green" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#84cc16" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#4d7c0f" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#166534" stopOpacity="0.7" />
          </linearGradient>

          {/* 헤도라의 상징적인 눈동자 (황화 황색 안구) */}
          <radialGradient id="hedorah-eye-yellow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="55%" stopColor="#facc15" />
            <stop offset="85%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#713f12" />
          </radialGradient>

          {/* 붉은 세로 찢어진 홍채 그라디언트 */}
          <linearGradient id="hedorah-iris-red" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="40%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>

          {/* 맹독 거품 그라디언트 */}
          <radialGradient id="bubble-slime" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#bef264" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#65a30d" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#365314" stopOpacity="0.85" />
          </radialGradient>

          {/* 헤도라 눈 강렬한 발광 필터 */}
          <filter id="hedorah-eye-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* [A] 배후 굴뚝형 스모그 분출구 & 연기 줄기 */}
        <g id="hedorah-smog-vents">
          {/* 뒤쪽 진흙 융기봉우리 1 */}
          <path
            d="M80 60 C70 40, 85 20, 100 22 C115 24, 118 45, 110 65 Z"
            fill="#1f2815"
            stroke="#12180c"
            strokeWidth="2"
          />
          {/* 뒤쪽 진흙 융기봉우리 2 (연기 배출구) */}
          <path
            d="M165 50 C175 25, 195 20, 205 28 C215 36, 210 55, 195 70 Z"
            fill="#261933"
            stroke="#160e1d"
            strokeWidth="2"
          />
          {/* 굴뚝에서 뿜어져 나오는 유독 스모그 구름 (반투명) */}
          <path
            d="M95 24 Q85 8, 70 12 Q55 16, 65 30 Q75 44, 95 32 Z"
            fill="#7e22ce"
            fillOpacity="0.4"
            className="animate-pulse"
          />
          <path
            d="M195 26 Q215 10, 230 18 Q245 26, 235 40 Q225 54, 200 42 Z"
            fill="#84cc16"
            fillOpacity="0.35"
            className="animate-pulse"
          />
        </g>

        {/* [B] 바닥에 흘러내려 웅덩이를 이룬 진흙 슬라임 베이스 */}
        <g id="hedorah-base-sludge">
          <path
            d="M20 235 C30 220, 60 225, 90 222 C130 218, 170 220, 210 223 C245 226, 270 232, 260 245 C250 255, 210 252, 160 252 C110 252, 40 255, 20 245 Z"
            fill="#121a0e"
          />
          {/* 바닥 슬라임 웅덩이 윤택 하이라이트 */}
          <path
            d="M45 238 C70 232, 110 235, 140 234 C180 233, 220 236, 240 241 C220 247, 170 246, 120 246 C70 246, 48 244, 45 238 Z"
            fill="url(#hedorah-acid-green)"
            fillOpacity="0.4"
          />
          {/* 바닥 방울방울 튀어나온 거품들 */}
          <circle cx="50" cy="235" r="4.5" fill="url(#bubble-slime)" />
          <circle cx="230" cy="239" r="6" fill="url(#bubble-slime)" />
          <circle cx="245" cy="242" r="3.5" fill="#a855f7" fillOpacity="0.8" />
          <circle cx="35" cy="242" r="3" fill="#a855f7" fillOpacity="0.7" />
        </g>

        {/* [C] 헤도라 거대 본체 (공해 찌꺼기가 겹겹이 흘러내리는 슬라임 덩어리) */}
        <g id="hedorah-body-mass">
          {/* 메인 실루엣: 비대칭 덩어리 돔형 몸체 */}
          <path
            d="M40 225 
               C30 195, 38 160, 52 135 
               C62 115, 68 85, 95 65 
               C115 50, 155 45, 185 60 
               C215 75, 228 105, 235 135 
               C242 165, 252 195, 245 225 
               C230 232, 205 224, 180 226 
               C145 228, 110 225, 75 227 
               C55 228, 45 230, 40 225 Z"
            fill="url(#hedorah-body)"
            stroke="#0a0f07"
            strokeWidth="3.5"
          />

          {/* 등/가슴 상단 진흙 퇴적층 1 */}
          <path
            d="M68 110 
               C85 92, 115 85, 145 88 
               C175 91, 205 98, 220 120 
               C205 135, 175 125, 140 128 
               C105 131, 80 135, 68 110 Z"
            fill="url(#hedorah-mud-top)"
          />

          {/* 끈적하게 흘러내리는 진흙 주름들 (Dripping Sludge Folds) */}
          <path
            d="M75 140 C85 170, 95 185, 90 210 C82 190, 75 175, 75 140 Z"
            fill="#161f10"
          />
          <path
            d="M125 145 C132 175, 140 195, 135 220 C128 198, 122 175, 125 145 Z"
            fill="#2a1535"
          />
          <path
            d="M185 140 C195 168, 205 190, 200 218 C192 195, 184 172, 185 140 Z"
            fill="#161f10"
          />

          {/* 보랏빛 오염 유막 (Oil Slick Pattern) 줄무늬 */}
          <path
            d="M60 155 Q95 145, 135 152 T215 148 Q225 158, 218 168 Q175 162, 135 166 T62 170 Z"
            fill="url(#hedorah-toxic-purple)"
          />
          <path
            d="M50 185 Q95 178, 145 182 T235 180 Q240 190, 230 198 Q180 194, 135 198 T48 198 Z"
            fill="url(#hedorah-acid-green)"
          />
          <path
            d="M70 205 Q115 200, 155 204 T220 202 Q225 212, 215 218 Q165 215, 125 218 T68 216 Z"
            fill="url(#hedorah-toxic-purple)"
          />

          {/* 몸체 곳곳에 돋아난 맹독 슬라임 거품들 */}
          <circle cx="85" cy="95" r="7" fill="url(#bubble-slime)" stroke="#1a2e05" strokeWidth="1" />
          <circle cx="95" cy="90" r="4.5" fill="#bef264" fillOpacity="0.8" />
          <circle cx="195" cy="100" r="8" fill="url(#bubble-slime)" stroke="#1a2e05" strokeWidth="1" />
          <circle cx="205" cy="95" r="5" fill="#bef264" fillOpacity="0.8" />
          <circle cx="145" cy="75" r="6" fill="#a855f7" fillOpacity="0.75" />
          <circle cx="152" cy="72" r="3.5" fill="#e9d5ff" fillOpacity="0.9" />
          <circle cx="170" cy="165" r="5" fill="url(#bubble-slime)" />
        </g>

        {/* [D] 좌/우 꿈틀거리는 진흙 팔/촉수 (Oozing Sludge Arms) */}
        <g id="hedorah-arms">
          {/* 좌측 슬라임 팔 (아래로 축 늘어져 땅에 닿음) */}
          <path
            d="M55 145 
               C35 160, 20 185, 25 215 
               C28 228, 42 225, 48 215 
               C52 200, 48 180, 62 165 Z"
            fill="#1d2714"
            stroke="#0a0f07"
            strokeWidth="2.5"
          />
          {/* 좌측 팔 끝에서 뚝뚝 떨어지는 진흙 방울 */}
          <path
            d="M26 218 Q23 232, 25 236 Q28 238, 30 234 Q31 226, 29 218 Z"
            fill="#84cc16"
          />

          {/* 우측 슬라임 팔 (괴물처럼 앞/옆으로 뻗음) */}
          <path
            d="M225 145 
               C248 158, 268 178, 265 205 
               C262 218, 248 218, 242 208 
               C236 195, 238 178, 222 162 Z"
            fill="#2c1a38"
            stroke="#0a0f07"
            strokeWidth="2.5"
          />
          {/* 우측 팔 오염 진흙 드립 */}
          <path
            d="M260 208 Q264 222, 262 228 Q258 230, 256 225 Q255 218, 258 208 Z"
            fill="#a855f7"
          />
        </g>

        {/* [E] ★ 헤도라의 상징: 강렬하고 기괴한 비대칭 눈동자 ★ */}
        <g id="hedorah-eyes">
          {/* 이마를 뒤덮은 무거운 오염 진흙 눈썹 주름 */}
          <path
            d="M75 105 C95 88, 140 85, 175 92 C195 96, 215 105, 210 115 C190 105, 145 100, 110 102 C90 104, 80 110, 75 105 Z"
            fill="#12190c"
          />

          {/* ────────────────────────────────────────────────────────── */}
          {/* 1. 좌측 눈 (왼쪽 아래로 기우뚱하게 기울어진 거대한 타원 눈) */}
          {/* ────────────────────────────────────────────────────────── */}
          <g transform="translate(105, 116) rotate(-14)">
            {/* 눈구멍 바깥 두꺼운 진흙 눈꺼풀 테두리 */}
            <ellipse cx="0" cy="0" rx="24" ry="18" fill="#080c05" stroke="#1f2c14" strokeWidth="3" />
            
            {/* 황산 황색 안구 베이스 */}
            <ellipse
              cx="0"
              cy="0"
              rx="21"
              ry="15"
              fill="url(#hedorah-eye-yellow)"
              filter="url(#hedorah-eye-glow)"
            />

            {/* 핏발 선 안구 붉은 결막 디테일 */}
            <path
              d="M-18 0 Q-10 -8, 0 -6 M-15 4 Q-8 8, 0 6 M18 0 Q10 -7, 0 -5 M15 5 Q8 7, 0 5"
              stroke="#b91c1c"
              strokeWidth="1.2"
              fill="none"
              opacity="0.75"
            />

            {/* 헤도라 특유의 세로로 찢어진 불타는 붉은 홍채 (알몬드 슬릿) */}
            <ellipse cx="0" cy="0" rx="8" ry="14" fill="url(#hedorah-iris-red)" />

            {/* 홍채 중심 칠흑의 세로 동공 */}
            <ellipse cx="0" cy="0" rx="3.5" ry="13" fill="#050505" />

            {/* 눈동자 유리체 광택 하이라이트 (생기 & 번뜩임) */}
            <ellipse cx="-5" cy="-5" rx="3.5" ry="2.2" fill="#ffffff" opacity="0.9" />
            <circle cx="3" cy="4" r="1.8" fill="#ffffff" opacity="0.75" />

            {/* 윗눈꺼풀 드리운 그림자 */}
            <path
              d="M-21 -5 C-15 -14, 15 -14, 21 -5 C15 -10, -15 -10, -21 -5 Z"
              fill="#181308"
              opacity="0.85"
            />
          </g>

          {/* ────────────────────────────────────────────────────────── */}
          {/* 2. 우측 눈 (오른쪽 위로 약간 비대칭으로 찢어진 흉포한 눈) */}
          {/* ────────────────────────────────────────────────────────── */}
          <g transform="translate(175, 122) rotate(16)">
            {/* 눈구멍 바깥 두꺼운 진흙 눈꺼풀 테두리 */}
            <ellipse cx="0" cy="0" rx="23" ry="17" fill="#080c05" stroke="#2a1633" strokeWidth="3" />
            
            {/* 황산 황색 안구 베이스 */}
            <ellipse
              cx="0"
              cy="0"
              rx="20"
              ry="14"
              fill="url(#hedorah-eye-yellow)"
              filter="url(#hedorah-eye-glow)"
            />

            {/* 핏발 디테일 */}
            <path
              d="M-17 0 Q-10 -7, 0 -5 M-14 4 Q-7 7, 0 5 M17 0 Q9 -6, 0 -4 M14 4 Q7 6, 0 4"
              stroke="#b91c1c"
              strokeWidth="1.2"
              fill="none"
              opacity="0.75"
            />

            {/* 세로로 찢어진 불타는 붉은 홍채 */}
            <ellipse cx="0" cy="0" rx="7.5" ry="13" fill="url(#hedorah-iris-red)" />

            {/* 중심 세로 동공 */}
            <ellipse cx="0" cy="0" rx="3.2" ry="12" fill="#050505" />

            {/* 광택 하이라이트 */}
            <ellipse cx="-4" cy="-4" rx="3.2" ry="2" fill="#ffffff" opacity="0.9" />
            <circle cx="3" cy="3.5" r="1.6" fill="#ffffff" opacity="0.75" />

            {/* 윗눈꺼풀 그림자 */}
            <path
              d="M-20 -4 C-14 -13, 14 -13, 20 -4 C14 -9, -14 -9, -20 -4 Z"
              fill="#1b0e24"
              opacity="0.85"
            />
          </g>

          {/* 양 눈 사이로 흘러내리는 끈적한 진흙 콧등 주름 */}
          <path
            d="M132 118 C140 128, 142 142, 138 152 C135 142, 137 128, 132 118 Z"
            fill="#121a0c"
          />
          <path
            d="M142 120 C146 130, 148 140, 145 150 C143 140, 144 128, 142 120 Z"
            fill="#2c1438"
          />
        </g>

        {/* [F] 턱밑으로 뚝뚝 떨어지는 산성 침/오염 슬라임 드립 (Drips) */}
        <g id="hedorah-drips">
          <path
            d="M110 170 Q108 190, 110 196 Q113 198, 114 193 Q114 180, 113 170 Z"
            fill="#84cc16"
          />
          <path
            d="M165 172 Q167 194, 165 202 Q163 204, 161 199 Q161 185, 163 172 Z"
            fill="#a855f7"
          />
          <path
            d="M138 178 Q136 205, 138 214 Q141 216, 142 210 Q142 192, 140 178 Z"
            fill="#bef264"
          />
        </g>
      </svg>

      {/* 5. 격퇴 시 어지러움 별 & 연기 흩어짐 이펙트 */}
      {isDefeated && (
        <div
          className="animate-bounce pointer-events-none"
          style={{
            position: 'absolute',
            top: '12%',
            right: '25%',
            fontSize: '22px',
            zIndex: 20,
          }}
        >
          💫🫧
        </div>
      )}
    </div>
  );
};
