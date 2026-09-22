import React from 'react';
import { Hedorah } from './Hedorah';

interface KingGhidorahProps {
  isHit: boolean;
  isDefeated: boolean;
  hp?: number;
  isReviewBoss?: boolean;
  className?: string;
}

export const KingGhidorah: React.FC<KingGhidorahProps> = ({
  isHit,
  isDefeated,
  hp = 100,
  isReviewBoss = false,
  className = '',
}) => {
  // 오답 복습 레이드 보스일 경우 전용 헤도라(Hedorah) 컴포넌트로 렌더링
  if (isReviewBoss) {
    return (
      <Hedorah
        isHit={isHit}
        isDefeated={isDefeated}
        hp={hp}
        className={className}
      />
    );
  }

  // HP 비율에 따른 상태 및 필터
  const isCritical = hp <= 25 && !isDefeated;
  const isWounded = hp <= 50 && !isDefeated;

  let imgFilter = 'drop-shadow(0 6px 14px rgba(180, 83, 9, 0.6))';

  if (isDefeated) {
    imgFilter = isReviewBoss
      ? 'grayscale(0.85) opacity(0.4) contrast(1.2)'
      : 'grayscale(0.8) opacity(0.45)';
  } else if (isHit) {
    imgFilter = isReviewBoss
      ? 'drop-shadow(0 0 26px #ef4444) brightness(2.2) hue-rotate(130deg)'
      : 'drop-shadow(0 0 24px #ef4444) brightness(2.2)';
  } else if (isCritical) {
    imgFilter = isReviewBoss
      ? 'drop-shadow(0 0 20px #ef4444) hue-rotate(100deg) contrast(1.4)'
      : 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.85)) hue-rotate(-15deg)';
  } else if (isWounded) {
    imgFilter = isReviewBoss
      ? 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.8)) hue-rotate(120deg)'
      : 'drop-shadow(0 0 14px rgba(245, 158, 11, 0.75))';
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
            background: isReviewBoss
              ? 'radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(34, 197, 94, 0.25) 55%, transparent 80%)'
              : isCritical
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.35) 0%, rgba(245, 158, 11, 0.2) 60%, transparent 80%)'
              : 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(234, 179, 8, 0.1) 60%, transparent 80%)',
            filter: 'blur(14px)',
            borderRadius: '9999px',
          }}
        />
      ) : null}

      {/* 스모그 괴수 헤도라 독성 안개 파티클 */}
      {isReviewBoss && !isDefeated && (
        <div
          className="absolute -top-3 right-6 text-sm animate-pulse pointer-events-none opacity-85 z-20"
          title="스모그 독기"
        >
          👾💨
        </div>
      )}

      {/* 바닥 접지 그림자 */}
      <div
        style={{
          position: 'absolute',
          bottom: '1px',
          right: '10%',
          width: '75%',
          height: '10px',
          background: isReviewBoss
            ? 'radial-gradient(ellipse, rgba(88, 28, 135, 0.85) 0%, rgba(15, 23, 42, 0.5) 65%, transparent 85%)'
            : 'radial-gradient(ellipse, rgba(0, 0, 0, 0.85) 0%, rgba(15, 23, 42, 0.5) 65%, transparent 85%)',
          borderRadius: '9999px',
          pointerEvents: 'none',
        }}
      />

      {/* 킹 기도라 또는 스모그 괴수 헤도라 PNG 이미지 */}
      <img
        src="/images/ghidorah.png"
        alt={isReviewBoss ? '스모그 괴수 헤도라 (Hedorah)' : '킹 기도라 (King Ghidorah)'}
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
