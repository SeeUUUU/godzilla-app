import React from 'react';

interface KingGhidorahProps {
  isHit: boolean;
  isDefeated: boolean;
  hp?: number;
  className?: string;
}

export const KingGhidorah: React.FC<KingGhidorahProps> = ({
  isHit,
  isDefeated,
  hp = 100,
  className = '',
}) => {
  // HP 비율에 따른 상태 및 필터
  const isCritical = hp <= 25 && !isDefeated;
  const isWounded = hp <= 50 && !isDefeated;

  let imgFilter = 'drop-shadow(0 6px 14px rgba(180, 83, 9, 0.6))';
  if (isDefeated) {
    imgFilter = 'grayscale(0.8) opacity(0.45)';
  } else if (isHit) {
    imgFilter = 'drop-shadow(0 0 24px #ef4444) brightness(2.2)';
  } else if (isCritical) {
    imgFilter = 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.85)) hue-rotate(-15deg)';
  } else if (isWounded) {
    imgFilter = 'drop-shadow(0 0 14px rgba(245, 158, 11, 0.75))';
  }

  return (
    <div
      className={`relative flex items-end justify-center select-none ${className}`}
      style={{
        height: '100%',
        maxHeight: '100%',
        width: 'auto',
        aspectRatio: '240 / 220',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        transition: 'transform 0.4s ease, opacity 0.5s ease',
        transform: isDefeated
          ? 'rotate(18deg) translateY(18px) scale(0.9)'
          : isHit
          ? 'scale(1.04)'
          : 'scale(1)',
        opacity: isDefeated ? 0.45 : 1,
      }}
    >
      {/* 1. 피격 시 붉은 화염 아우라 / 평상시 황금 중력 번개 아우라 */}
      {isHit ? (
        <div
          style={{
            position: 'absolute',
            inset: '-8px',
            backgroundColor: 'rgba(239, 68, 68, 0.45)',
            filter: 'blur(20px)',
            borderRadius: '9999px',
            pointerEvents: 'none',
          }}
        />
      ) : !isDefeated ? (
        <div
          className="animate-pulse pointer-events-none"
          style={{
            position: 'absolute',
            inset: '-4px',
            background: isCritical
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.35) 0%, rgba(245, 158, 11, 0.2) 60%, transparent 80%)'
              : 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(234, 179, 8, 0.1) 60%, transparent 80%)',
            filter: 'blur(14px)',
            borderRadius: '9999px',
          }}
        />
      ) : null}

      {/* 바닥 접지 그림자 */}
      <div
        style={{
          position: 'absolute',
          bottom: '1px',
          right: '10%',
          width: '75%',
          height: '10px',
          background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.85) 0%, rgba(15, 23, 42, 0.5) 65%, transparent 85%)',
          borderRadius: '9999px',
          pointerEvents: 'none',
        }}
      />

      {/* 킹 기도라 PNG 이미지 (/images/ghidorah.png) */}
      <img
        src="/images/ghidorah.png"
        alt="킹 기도라 (King Ghidorah)"
        className={`h-full w-auto max-h-full block object-contain pointer-events-none ${
          isHit ? 'animate-boss-hit' : isCritical ? 'animate-boss-tremble' : ''
        }`}
        style={{
          filter: imgFilter,
          transition: 'filter 0.2s ease',
        }}
        draggable={false}
      />

      {/* 격퇴 시 어지러움 별 이펙트 */}
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
          💫⭐
        </div>
      )}
    </div>
  );
};
