import React from 'react';
import { Hedorah } from './Hedorah';
import { KingGhidorahArt } from './KingGhidorahArt';

interface KingGhidorahProps {
  isHit: boolean;
  isDefeated: boolean;
  hp?: number;
  isReviewBoss?: boolean;
  className?: string;
  isAttacking?: boolean;
  attackPhase?: 'idle' | 'charge' | 'fire' | 'impact';
}

export const KingGhidorah: React.FC<KingGhidorahProps> = ({
  isHit,
  isDefeated,
  hp = 100,
  isReviewBoss = false,
  className = '',
  isAttacking = false,
  attackPhase,
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

  let svgFilter = 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.55)) drop-shadow(0 8px 14px rgba(0, 0, 0, 0.45))';

  if (isDefeated) {
    svgFilter = 'grayscale(0.8) opacity(0.45)';
  } else if (isHit) {
    svgFilter = 'drop-shadow(0 0 24px #ef4444) brightness(1.3) saturate(1.3)';
  } else if (isCritical) {
    svgFilter = 'drop-shadow(0 0 18px rgba(239, 68, 68, 0.9)) saturate(1.15)';
  } else if (isWounded) {
    svgFilter = 'drop-shadow(0 0 14px rgba(245, 158, 11, 0.8)) drop-shadow(0 0 6px rgba(239, 68, 68, 0.5))';
  }

  return (
    <div
      className={`relative flex items-end justify-center select-none ${className}`}
      style={{
        // 레이아웃 점유 크기(기존 240:220)는 그대로 유지하여 HP 바/배틀 레이아웃을 보호한다.
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
        transformOrigin: '70% 90%',
        opacity: isDefeated ? 0.45 : 1,
      }}
    >
      {/* 킹 기도라 SVG: 기준 박스 대비 가로 140% (viewBox 336x220 == 240x220 의 1.4배) 로
          좌측(고질라 방향)으로 확장해 배틀 영역을 묵직하게 채운다. */}
      <div
        className={`pointer-events-none ${
          isHit ? 'animate-boss-hit' : isCritical ? 'animate-boss-tremble' : ''
        }`}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          height: '100%',
          width: '140%',
          filter: svgFilter,
          transition: 'filter 0.2s ease',
        }}
      >
        <KingGhidorahArt
          isHit={isHit}
          isDefeated={isDefeated}
          isWounded={isWounded}
          isCritical={isCritical}
          isAttacking={isAttacking}
          attackPhase={attackPhase}
        />
      </div>

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
