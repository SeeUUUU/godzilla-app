import React from 'react';
import type { GodzillaStageTier } from '../types';
import { getGodzillaEvolution } from '../types';

export type GodzillaSkin = GodzillaStageTier;

interface GodzillaCharacterProps {
  isShooting: boolean;
  isHit?: boolean;
  isDefeated?: boolean;
  level?: number;
  tier?: GodzillaStageTier;
  skin?: GodzillaStageTier;
  isFever?: boolean;
  className?: string;
}

const GODZILLA_TIER_IMAGES: Record<GodzillaStageTier, string> = {
  chibi: '/images/godzilla-chibi.png',
  classic: '/images/godzilla-classic.png',
  minusone: '/images/godzilla-minusone.png',
  evil: '/images/godzilla-evil.png',
  burning: '/images/godzilla-burning.png',
};

export const GodzillaCharacter: React.FC<GodzillaCharacterProps> = ({
  isShooting,
  isHit = false,
  isDefeated = false,
  level,
  tier,
  skin,
  isFever = false,
  className = '',
}) => {
  // tier가 주어지면 tier 사용, level이 주어지면 level로부터 tier 계산
  const effectiveTier: GodzillaStageTier =
    tier || skin || (level !== undefined ? getGodzillaEvolution(level).tier : 'classic');

  const evo = getGodzillaEvolution(
    level ??
      (effectiveTier === 'burning'
        ? 9
        : effectiveTier === 'evil'
        ? 7
        : effectiveTier === 'minusone'
        ? 5
        : effectiveTier === 'classic'
        ? 3
        : 1)
  );

  const isChibi = effectiveTier === 'chibi';
  const isMinusOne = effectiveTier === 'minusone';
  const isEvil = effectiveTier === 'evil';
  const isBurning = effectiveTier === 'burning';

  // 아우라 배경 이펙트
  let auraBg = 'radial-gradient(ellipse, rgba(0, 240, 255, 0.45) 0%, rgba(59, 130, 246, 0.2) 60%, transparent 80%)';
  if (isChibi) {
    auraBg = 'radial-gradient(ellipse, rgba(74, 222, 128, 0.5) 0%, rgba(56, 189, 248, 0.25) 60%, transparent 80%)';
  } else if (isMinusOne) {
    auraBg = 'radial-gradient(ellipse, rgba(56, 189, 248, 0.65) 0%, rgba(255, 255, 255, 0.35) 45%, transparent 80%)';
  } else if (isEvil) {
    auraBg = 'radial-gradient(ellipse, rgba(168, 85, 247, 0.7) 0%, rgba(56, 189, 248, 0.3) 50%, transparent 80%)';
  } else if (isBurning) {
    auraBg = 'radial-gradient(ellipse, rgba(255, 34, 0, 0.75) 0%, rgba(255, 170, 0, 0.45) 60%, transparent 80%)';
  }

  if (isFever && isShooting) {
    auraBg = 'radial-gradient(ellipse, rgba(239, 68, 68, 0.85) 0%, rgba(245, 158, 11, 0.55) 50%, transparent 80%)';
  }

  // 이미지 외곽 필터
  let imgFilter = 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.75))';
  if (isHit) {
    imgFilter = 'drop-shadow(0 0 20px #ef4444) brightness(2)';
  } else if (isDefeated) {
    imgFilter = 'grayscale(0.7)';
  } else if (isShooting) {
    if (isChibi) {
      imgFilter = 'drop-shadow(0 0 16px rgba(74, 222, 128, 0.9)) drop-shadow(0 0 26px rgba(56, 189, 248, 0.5))';
    } else if (isMinusOne) {
      imgFilter = 'drop-shadow(0 0 22px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 35px rgba(56, 189, 248, 0.7))';
    } else if (isEvil) {
      imgFilter = 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.95)) drop-shadow(0 0 35px rgba(56, 189, 248, 0.5))';
    } else if (isBurning) {
      imgFilter = 'drop-shadow(0 0 22px rgba(255, 34, 0, 0.95)) drop-shadow(0 0 40px rgba(245, 158, 11, 0.7))';
    } else {
      imgFilter = 'drop-shadow(0 0 14px rgba(0, 240, 255, 0.85)) drop-shadow(0 0 30px rgba(59, 130, 246, 0.5))';
    }
  }

  const imageSrc = GODZILLA_TIER_IMAGES[effectiveTier] || '/images/godzilla-classic.png';

  return (
    <div
      className={`relative flex items-end justify-center select-none ${className}`}
      style={{
        height: '100%',
        maxHeight: '100%',
        width: 'auto',
        aspectRatio: '320 / 220',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        transition: 'transform 0.35s ease, opacity 0.4s ease',
        transform: isDefeated
          ? 'rotate(-12deg) translateY(14px) scale(0.92)'
          : isHit
          ? 'scale(1.03)'
          : 'scale(1)',
        opacity: isDefeated ? 0.45 : 1,
      }}
    >
      {/* 피격 / 발광 아우라 */}
      {isHit ? (
        <div
          style={{
            position: 'absolute',
            inset: '-8px',
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            filter: 'blur(20px)',
            borderRadius: '9999px',
            pointerEvents: 'none',
          }}
        />
      ) : isShooting ? (
        <div
          className="absolute rounded-full pointer-events-none animate-pulse"
          style={{
            position: 'absolute',
            left: '10%',
            top: '15%',
            width: '80%',
            height: '75%',
            background: auraBg,
            filter: 'blur(20px)',
            borderRadius: '9999px',
          }}
        />
      ) : null}

      {/* 발 및 꼬리 바닥 접지 그림자 */}
      <div
        style={{
          position: 'absolute',
          bottom: '1px',
          left: '5%',
          width: '85%',
          height: '10px',
          background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.85) 0%, rgba(15, 23, 42, 0.5) 65%, transparent 85%)',
          borderRadius: '9999px',
          pointerEvents: 'none',
        }}
      />

      {/* 고질라 5단계 진화 PNG 이미지 (/images/godzilla-*.png) */}
      <img
        src={imageSrc}
        alt={evo.name}
        className="h-full w-auto max-h-full block object-contain pointer-events-none"
        style={{
          filter: imgFilter,
          transition: 'filter 0.25s ease',
        }}
        draggable={false}
      />
    </div>
  );
};
