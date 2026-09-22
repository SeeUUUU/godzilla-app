import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GodzillaCharacter } from './GodzillaCharacter';
import { KingGhidorah } from './KingGhidorah';
import { RaidBossRenderer } from './RaidBossRenderer';
import type { RaidBossInfo } from '../data/raidBosses';
import {
  playEvolutionBeamSound,
  playElectricShockSound,
  playVictoryFanfare,
} from '../utils/soundEffects';
import { getGodzillaEvolution } from '../types';
import { Trophy, RotateCcw, Swords, ShieldAlert, Zap, Heart } from 'lucide-react';

interface GodzillaStageProps {
  level: number;
  isShootingBeam: boolean;
  isGhidorahAttacking: boolean;
  godzillaHp: number;
  ghidorahHp: number;
  combo: number;
  isAllCleared: boolean;
  isGameOver: boolean;
  onResetGame: () => void;
  onReviveGame: () => void;
  clearedCount: number;
  totalCount: number;
  isReviewMode?: boolean;
  onExitReviewMode?: () => void;
  stageRangeLabel?: string;
  currentStageNum?: number;
  totalStages?: number;
  onOpenGacha?: () => void;
  hasClaimedStageReward?: boolean;
  isCriticalHit?: boolean;
  raidBoss?: RaidBossInfo;
}

export const GodzillaStage: React.FC<GodzillaStageProps> = ({
  level,
  isShootingBeam,
  isGhidorahAttacking,
  godzillaHp,
  ghidorahHp,
  combo,
  isAllCleared,
  isGameOver,
  onResetGame,
  onReviveGame,
  clearedCount,
  totalCount,
  isReviewMode = false,
  onExitReviewMode,
  stageRangeLabel,
  currentStageNum,
  totalStages,
  onOpenGacha,
  hasClaimedStageReward = false,
  isCriticalHit = false,
  raidBoss,
}) => {
  // 레이드 모드 보스 HP 계산 (남은 오답 단어 수에 맞춰 정확히 타격당 감소, 0개 남으면 0%)
  const raidBossHp = totalCount > 0
    ? Math.max(0, Math.round(((totalCount - clearedCount) / totalCount) * 100))
    : 0;
  const effectiveBossHp = isReviewMode ? raidBossHp : ghidorahHp;
  const isBossDefeated = isAllCleared && !isGameOver;

  // 1. 공식 파워 랭킹에 따른 고질라 5단계 진화 정보
  // LV.1 ~ 2: 치비 고질라 (Chibi)
  // LV.3 ~ 4: 기본 고질라 (Classic)
  // LV.5 ~ 6: 고질라 -1.0 (Minus One)
  // LV.7 ~ 8: 이블 고질라 (Evil GMK)
  // LV.9 이상: 최강 버닝 고질라 (Burning)
  const evo = getGodzillaEvolution(level);

  // 2. 3연속 콤보 이상 시 버닝 피버 모드 활성화
  const isFever = combo >= 3;

  // 고질라 형태별 특화 열선 발사 사운드
  useEffect(() => {
    if (isShootingBeam) {
      playEvolutionBeamSound(evo.tier, isFever);
    }
  }, [isShootingBeam, evo.tier, isFever]);

  // 킹 기도라 중력 번개 공격 사운드
  useEffect(() => {
    if (isGhidorahAttacking) {
      playElectricShockSound();
    }
  }, [isGhidorahAttacking]);

  // 승리(클리어) 시 축하 효과음 및 폭죽 연출 (오버레이가 열릴 때 1회 재생)
  useEffect(() => {
    if (isBossDefeated) {
      playVictoryFanfare();

      // 화려한 컨페티 폭죽 팡팡 연출
      const interval = setInterval(() => {
        confetti({
          particleCount: 50,
          spread: 80,
          ticks: 60,
          origin: { x: Math.random(), y: Math.random() * 0.5 },
          colors: isReviewMode
            ? ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#00f2ff']
            : ['#00f2ff', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'],
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [isBossDefeated, isReviewMode]);

  // 고질라 체력 바 색상
  let gzHpColor = 'linear-gradient(90deg, #06b6d4 0%, #22c55e 100%)';
  if (godzillaHp <= 25) {
    gzHpColor = 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)';
  } else if (godzillaHp <= 50) {
    gzHpColor = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
  }

  // 보스 체력 바 색상 (일반: 킹 기도라, 복습 레이드: 5대 랜덤 보스)
  let bossHpColor = 'linear-gradient(90deg, #22c55e 0%, #84cc16 100%)';
  if (isReviewMode) {
    const primary = raidBoss?.themeColor || '#9333ea';
    const accent = raidBoss?.accentColor || '#c084fc';
    bossHpColor = `linear-gradient(90deg, ${accent} 0%, ${primary} 100%)`;
    if (effectiveBossHp <= 25) {
      bossHpColor = 'linear-gradient(90deg, #ef4444 0%, #991b1b 100%)';
    } else if (effectiveBossHp <= 50) {
      bossHpColor = `linear-gradient(90deg, #f59e0b 0%, ${primary} 100%)`;
    }
  } else {
    if (effectiveBossHp <= 25) {
      bossHpColor = 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)';
    } else if (effectiveBossHp <= 50) {
      bossHpColor = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
    }
  }

  // 스테이지 프레임 테두리 & 네온 펄스 효과
  let frameBorder = `2px solid ${evo.themeColor}88`;
  let frameShadow = `0 0 25px ${evo.themeColor}44`;
  if (isFever) {
    frameBorder = '2.5px solid #ef4444';
    frameShadow =
      '0 0 25px rgba(239, 68, 68, 0.85), 0 0 50px rgba(249, 115, 22, 0.65), inset 0 0 20px rgba(239, 68, 68, 0.3)';
  }

  // 빔 높이 및 구슬 크기 (피버 모드 및 크리티컬 시 대폭 확대)
  const beamHeight =
    evo.tier === 'burning'
      ? isCriticalHit
        ? '66px'
        : isFever
        ? '58px'
        : '48px'
      : isCriticalHit
      ? '58px'
      : isFever
      ? '50px'
      : '34px';
  const mouthBallSize = isCriticalHit ? '38px' : isFever ? '34px' : '26px';

  // 5단계 진화별 열선 그라데이션 및 발광
  let beamGradient = 'linear-gradient(90deg, #ffffff 0%, #cffafe 10%, #22d3ee 45%, #00f2ff 100%)';
  let beamShadow = isFever
    ? '0 0 35px #00f2ff, 0 0 70px #06b6d4, 0 0 95px #38bdf8'
    : '0 0 25px #00f2ff, 0 0 50px #06b6d4';
  let innerCoreColor = '#ffffff';
  let innerCoreShadow = '0 0 10px #ffffff';
  let mouthBallBg = 'radial-gradient(circle, #ffffff 35%, #a5f3fc 55%, #00f0ff 80%, transparent 100%)';
  let mouthBallShadow = '0 0 20px #00f2ff, 0 0 40px #0284c7';

  if (evo.tier === 'chibi') {
    mouthBallBg = 'radial-gradient(circle, #ffffff 40%, #86efac 65%, #00f0ff 90%, transparent 100%)';
    mouthBallShadow = '0 0 20px #4ade80, 0 0 35px #00f0ff';
  } else if (evo.tier === 'minusone') {
    beamGradient = 'linear-gradient(90deg, #ffffff 0%, #f0fdfa 15%, #ffffff 50%, #e0f2fe 80%, #38bdf8 100%)';
    beamShadow = isFever
      ? '0 0 45px #ffffff, 0 0 85px #38bdf8, 0 0 125px #0284c7'
      : '0 0 32px #ffffff, 0 0 65px #38bdf8';
    innerCoreColor = '#ffffff';
    innerCoreShadow = '0 0 18px #ffffff';
    mouthBallBg = 'radial-gradient(circle, #ffffff 50%, #e0f2fe 75%, #38bdf8 90%, transparent 100%)';
    mouthBallShadow = '0 0 25px #ffffff, 0 0 50px #38bdf8';
  } else if (evo.tier === 'evil') {
    beamGradient = 'linear-gradient(90deg, #ffffff 0%, #c084fc 25%, #a855f7 55%, #818cf8 80%, #38bdf8 100%)';
    beamShadow = isFever
      ? '0 0 45px #a855f7, 0 0 85px #818cf8, 0 0 120px #38bdf8'
      : '0 0 30px #a855f7, 0 0 60px #818cf8';
    innerCoreColor = '#faf5ff';
    innerCoreShadow = '0 0 14px #c084fc';
    mouthBallBg = 'radial-gradient(circle, #ffffff 35%, #c084fc 60%, #a855f7 85%, transparent 100%)';
    mouthBallShadow = '0 0 25px #a855f7, 0 0 50px #38bdf8';
  } else if (evo.tier === 'burning') {
    beamGradient = 'linear-gradient(90deg, #ffffff 0%, #ffee55 10%, #ff8800 35%, #ff2200 70%, #991b1b 100%)';
    beamShadow = isFever
      ? '0 0 50px #ff2200, 0 0 95px #ff8800, 0 0 140px #ffee55'
      : '0 0 35px #ff2200, 0 0 75px #ff8800';
    innerCoreColor = '#fffbeb';
    innerCoreShadow = '0 0 16px #ffee55';
    mouthBallBg = 'radial-gradient(circle, #ffffff 30%, #ffee55 50%, #ff8800 75%, #ff2200 100%)';
    mouthBallShadow = '0 0 30px #ff2200, 0 0 60px #ff8800';
  }

  return (
    <div
      className="w-full flex-none px-1 sm:px-2 md:px-3 my-1 sm:my-1.5 md:my-2 h-48 xs:h-52 sm:h-56 md:h-60 lg:h-64 landscape-short:h-full landscape-short:my-0"
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-slate-900 p-2 sm:p-2.5 md:p-3 flex flex-col justify-between h-full ${
          isFever ? 'animate-fever-pulse' : ''
        }`}
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '18px',
          border: frameBorder,
          height: '100%',
          boxShadow: frameShadow,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'border 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {/* 우주 배경 그리드 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: isFever
              ? 'radial-gradient(#ef4444 1px, transparent 1px)'
              : `radial-gradient(${evo.themeColor} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            opacity: isFever ? 0.22 : 0.12,
          }}
        />

        {/* 1. 상단 대칭형 대전 격투 HUD (5단계 진화 연동) */}
        <div
          className="w-full flex items-center justify-between flex-none z-10 border-b border-white/10 pb-1 sm:pb-1.5 mb-1 px-0.5 sm:px-1"
        >
          {/* [좌측] 고질라 5단계 진화 라벨 & HP */}
          <div className="flex flex-col items-start min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
              <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" style={{ color: evo.themeColor, fill: evo.themeColor }} />
              <span className="text-xs sm:text-sm font-black truncate max-w-[100px] xs:max-w-none" style={{ color: evo.themeColor }}>
                {evo.icon} {evo.shortName}
              </span>
              <span className="text-xs sm:text-sm font-black" style={{ color: godzillaHp <= 25 ? '#ef4444' : '#a5f3fc' }}>
                {godzillaHp}%
              </span>
            </div>
            {/* 고질라 체력 트랙 */}
            <div
              className="w-24 xs:w-28 sm:w-36 md:w-44 lg:w-52 h-2 sm:h-2.5 md:h-3 rounded-full overflow-hidden bg-slate-950 border"
              style={{ borderColor: `${evo.themeColor}99` }}
            >
              <div
                style={{
                  width: `${godzillaHp}%`,
                  height: '100%',
                  background: gzHpColor,
                  borderRadius: '9999px',
                  transition: 'width 0.35s ease, background 0.35s ease',
                }}
              />
            </div>
          </div>

          {/* [중앙] VS 배지 & 피버 모드 팝업 & 콤보 & 격파 진행도 */}
          <div className="flex flex-col items-center gap-0.5 sm:gap-1 mx-1 flex-shrink-0">
            {isReviewMode ? (
              <div
                className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs md:text-sm font-black text-white border border-amber-300 shadow-sm whitespace-nowrap"
                style={{
                  background: 'linear-gradient(90deg, #b45309 0%, #ea580c 100%)',
                }}
              >
                <span>🔥 특훈 배틀</span>
              </div>
            ) : isFever ? (
              <div
                className="animate-bounce px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs md:text-sm font-black text-white border border-yellow-200 shadow-md whitespace-nowrap"
                style={{
                  background: 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #eab308 100%)',
                }}
              >
                🔥 FEVER x2! 🔥
              </div>
            ) : combo > 1 ? (
              <div
                className="animate-bounce px-2 sm:px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] sm:text-xs md:text-sm font-black border border-amber-300 shadow-sm whitespace-nowrap"
              >
                🔥 {combo} COMBO!
              </div>
            ) : (
              <div
                className="flex items-center gap-1 text-rose-500 font-black text-[10px] sm:text-xs md:text-sm px-2 py-0.5 rounded bg-rose-950/60 border border-rose-600/60"
              >
                <Swords className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>VS</span>
              </div>
            )}
            <div
              className="text-[9px] sm:text-[11px] md:text-xs font-extrabold flex items-center gap-1 tracking-tight"
              style={{ color: isFever || isReviewMode ? '#fde047' : '#94a3b8' }}
            >
              <span>
                {isReviewMode
                  ? `오답 ${clearedCount}/${totalCount}`
                  : `격파 ${clearedCount}/${totalCount}`}
              </span>
              {isReviewMode && onExitReviewMode && (
                <button
                  type="button"
                  onClick={onExitReviewMode}
                  className="text-[9px] sm:text-[11px] md:text-xs text-slate-400 underline cursor-pointer hover:text-white"
                >
                  (일반)
                </button>
              )}
            </div>
            {stageRangeLabel && !isReviewMode && (
              <div className="hidden xs:block text-[8px] sm:text-[9px] md:text-[10px] font-bold text-slate-500 whitespace-nowrap">
                {stageRangeLabel}
              </div>
            )}
          </div>

          {/* [우측] 보스 HP (일반: 👑 킹 기도라, 복습 레이드: 5대 랜덤 보스) */}
          <div className="flex flex-col items-end min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
              <ShieldAlert
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4"
                style={{
                  color: isReviewMode ? (raidBoss?.themeColor || '#a855f7') : '#f59e0b',
                }}
              />
              <span
                className="text-xs sm:text-sm font-black truncate max-w-[140px] xs:max-w-none"
                style={{
                  color: isReviewMode ? (raidBoss?.themeColor || '#d8b4fe') : '#fef08a',
                }}
              >
                {isReviewMode ? `${raidBoss?.icon || '👾'} ${raidBoss?.title || '스모그 괴수 헤도라'}` : '👑 킹 기도라'}
              </span>
              <span
                className="text-xs sm:text-sm font-black"
                style={{
                  color:
                    effectiveBossHp <= 25
                      ? '#ef4444'
                      : isReviewMode
                      ? (raidBoss?.accentColor || '#d8b4fe')
                      : '#fef08a',
                }}
              >
                {effectiveBossHp}%
              </span>
            </div>
            {/* 보스 체력 트랙 */}
            <div
              className="w-24 xs:w-28 sm:w-36 md:w-44 lg:w-52 h-2 sm:h-2.5 md:h-3 rounded-full overflow-hidden bg-slate-950 border"
              style={{
                borderColor: isReviewMode
                  ? `${raidBoss?.themeColor || '#a855f7'}99`
                  : 'rgba(217, 119, 6, 0.7)',
              }}
            >
              <div
                style={{
                  width: `${effectiveBossHp}%`,
                  height: '100%',
                  background: bossHpColor,
                  borderRadius: '9999px',
                  transition: 'width 0.35s ease, background 0.35s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* 2. 대전 격투 아레나 (유연한 flex 3단 구조: 고질라 - 빔 공간 - 킹 기도라) */}
        <div
          className="relative w-full flex-1 min-h-0 flex items-end justify-between overflow-hidden pt-1"
          style={{
            position: 'relative',
            width: '100%',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          {/* 바닥 접지 라인 */}
          <div
            style={{
              position: 'absolute',
              bottom: '2px',
              left: '6px',
              right: '6px',
              height: '3px',
              background: `linear-gradient(90deg, transparent, ${evo.themeColor}88 15%, rgba(245, 158, 11, 0.5) 85%, transparent)`,
              borderRadius: '9999px',
              pointerEvents: 'none',
            }}
          />

          {/* 좌측: 5단계 진화 고질라 (상대 축 100% 일치) */}
          <div
            className="relative h-full flex-shrink-0 flex items-end"
            style={{ height: '100%', position: 'relative', zIndex: 10 }}
          >
            <GodzillaCharacter
              level={level}
              tier={evo.tier}
              isShooting={isShootingBeam}
              isHit={isGhidorahAttacking}
              isDefeated={isGameOver}
              isFever={isFever}
            />
          </div>

          {/* 중앙: 5단계 특화 열선 & 공격 이펙트 레이어 (반응형 연결 공간) */}
          <div
            className="flex-1 h-full relative"
            style={{ flex: 1, height: '100%', position: 'relative', minWidth: '40px' }}
          >
            {/* [정답 시] 고질라 5단계 특화 열선 (고질라 입 cx=282 cy=132 -> 기도라 흉부 직격) */}
            {isShootingBeam && (
              <div
                style={{
                  position: 'absolute',
                  left: '-18px', // 고질라 입술 끝 오버랩
                  right: '-24px', // 킹 기도라 흉곽 오버랩
                  bottom: '40%', // 양측 캐릭터의 88/220 높이와 100% 일치
                  transform: 'translateY(50%)',
                  height: beamHeight,
                  display: 'flex',
                  alignItems: 'center',
                  zIndex: 25,
                  transition: 'height 0.2s ease',
                }}
              >
                {/* 고질라 입 발광 구슬 */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: mouthBallSize,
                    height: mouthBallSize,
                    borderRadius: '9999px',
                    background: mouthBallBg,
                    boxShadow: mouthBallShadow,
                    zIndex: 35,
                    pointerEvents: 'none',
                  }}
                />

                {/* 1단계 (치비 고질라): 귀여운 파이어볼 팝 (Fireball Pop) */}
                {evo.tier === 'chibi' ? (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                      paddingRight: '12px',
                    }}
                  >
                    <div
                      className="animate-bounce"
                      style={{
                        width: isFever ? '26px' : '20px',
                        height: isFever ? '26px' : '20px',
                        borderRadius: '9999px',
                        background: 'radial-gradient(circle, #ffffff 30%, #86efac 60%, #00f0ff 100%)',
                        boxShadow: '0 0 16px #00f0ff, 0 0 28px #4ade80',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                      }}
                    >
                      ✨
                    </div>
                    <div
                      className="animate-pulse"
                      style={{
                        width: isFever ? '30px' : '23px',
                        height: isFever ? '30px' : '23px',
                        borderRadius: '9999px',
                        background: 'radial-gradient(circle, #ffffff 30%, #38bdf8 65%, #0284c7 100%)',
                        boxShadow: '0 0 20px #38bdf8, 0 0 35px #00f0ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                      }}
                    >
                      💫
                    </div>
                    <div
                      className="animate-bounce"
                      style={{
                        width: isFever ? '34px' : '26px',
                        height: isFever ? '34px' : '26px',
                        borderRadius: '9999px',
                        background: 'radial-gradient(circle, #ffffff 35%, #67e8f9 60%, #06b6d4 100%)',
                        boxShadow: '0 0 22px #06b6d4, 0 0 40px #22d3ee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                      }}
                    >
                      ⭐
                    </div>
                    <div
                      className="animate-pulse"
                      style={{
                        width: isFever ? '40px' : '30px',
                        height: isFever ? '40px' : '30px',
                        borderRadius: '9999px',
                        background: 'radial-gradient(circle, #ffffff 40%, #a7f3d0 70%, #00f0ff 100%)',
                        boxShadow: '0 0 25px #00f0ff, 0 0 45px #38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                      }}
                    >
                      🔥
                    </div>
                  </div>
                ) : (
                  /* 2~5단계: 메인 에너지 열선 레이저 코어 */
                  <div
                    className="animate-beam-glow"
                    style={{
                      width: '100%',
                      height: '100%',
                      background: beamGradient,
                      borderRadius: '0 16px 16px 0',
                      boxShadow: beamShadow,
                      position: 'relative',
                    }}
                  >
                    {/* 중심 레이저 하이라이트 코어 */}
                    <div
                      style={{
                        position: 'absolute',
                        top: isFever ? '8px' : '6px',
                        bottom: isFever ? '8px' : '6px',
                        left: 0,
                        right: '10px',
                        backgroundColor: innerCoreColor,
                        borderRadius: '0 12px 12px 0',
                        boxShadow: innerCoreShadow,
                      }}
                    />

                    {/* 3단계 (고질라 -1.0): 팽창하는 충격파 고리 이펙트 */}
                    {evo.tier === 'minusone' && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: '-8px 0',
                          pointerEvents: 'none',
                          display: 'flex',
                          justifyContent: 'space-around',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '100%',
                            border: '3px solid #ffffff',
                            borderRadius: '9999px',
                            boxShadow: '0 0 20px #38bdf8',
                          }}
                          className="animate-ping"
                        />
                        <div
                          style={{
                            width: '24px',
                            height: '100%',
                            border: '3px solid #ffffff',
                            borderRadius: '9999px',
                            boxShadow: '0 0 24px #0284c7',
                          }}
                          className="animate-ping"
                        />
                      </div>
                    )}

                    {/* 4단계 (이블 고질라): 일렁이는 보랏빛/청백색 악령 파괴 번개 */}
                    {evo.tier === 'evil' && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: '-6px 0',
                          pointerEvents: 'none',
                          zIndex: 32,
                          display: 'flex',
                          justifyContent: 'space-around',
                          alignItems: 'center',
                        }}
                      >
                        <span className="animate-bounce" style={{ fontSize: '18px', filter: 'drop-shadow(0 0 8px #a855f7)' }}>
                          ⚡
                        </span>
                        <span className="animate-pulse" style={{ fontSize: '18px', filter: 'drop-shadow(0 0 8px #38bdf8)' }}>
                          🟣
                        </span>
                        <span className="animate-bounce" style={{ fontSize: '20px', filter: 'drop-shadow(0 0 8px #a855f7)' }}>
                          ⚡
                        </span>
                      </div>
                    )}

                    {/* 5단계 (버닝 고질라): 초대형 나선 화염 회오리 (Infinite Spiral Heat Ray) */}
                    {evo.tier === 'burning' && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: '-12px 0',
                          pointerEvents: 'none',
                          zIndex: 32,
                        }}
                      >
                        {/* 회전하는 나선 화염 파티클 */}
                        <span
                          className="animate-pulse"
                          style={{ position: 'absolute', left: '10%', top: '-10px', fontSize: '20px' }}
                        >
                          🔥
                        </span>
                        <span
                          className="animate-pulse"
                          style={{ position: 'absolute', left: '40%', bottom: '-12px', fontSize: '22px' }}
                        >
                          🔥
                        </span>
                        <span
                          className="animate-pulse"
                          style={{ position: 'absolute', left: '70%', top: '-8px', fontSize: '22px' }}
                        >
                          🔥
                        </span>
                        {/* 나선형 와류 오버레이 */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255, 238, 85, 0.4) 15px, rgba(255, 238, 85, 0.4) 30px)',
                            borderRadius: '0 16px 16px 0',
                          }}
                          className="animate-pulse"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 킹 기도라 피격 폭발 */}
                <div
                  style={{
                    position: 'absolute',
                    right: '-14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: isFever ? '42px' : '34px',
                    filter: 'drop-shadow(0 0 14px #ef4444) drop-shadow(0 0 24px #facc15)',
                    zIndex: 35,
                    pointerEvents: 'none',
                  }}
                >
                  {evo.tier === 'chibi' ? '💥✨' : '💥'}
                </div>

                {/* EXP 및 피버 팝업 배지 */}
                <div
                  className="animate-bounce"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: isFever ? '-30px' : '-26px',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: isCriticalHit
                      ? 'linear-gradient(90deg, #b91c1c, #ea580c, #f59e0b)'
                      : isFever
                      ? 'linear-gradient(90deg, #ef4444, #f97316)'
                      : 'linear-gradient(90deg, #0284c7, #06b6d4)',
                    color: '#ffffff',
                    fontWeight: 900,
                    padding: isCriticalHit ? '4px 14px' : isFever ? '3px 12px' : '2px 10px',
                    borderRadius: '9999px',
                    border: isCriticalHit
                      ? '2px solid #fef08a'
                      : isFever
                      ? '2px solid #fef08a'
                      : '1.5px solid #ffffff',
                    boxShadow: isCriticalHit
                      ? '0 0 25px rgba(239, 68, 68, 1), 0 0 40px rgba(245, 158, 11, 0.9)'
                      : isFever
                      ? '0 0 20px rgba(239, 68, 68, 0.9), 0 0 30px rgba(245, 158, 11, 0.7)'
                      : '0 0 15px rgba(250, 204, 21, 0.8)',
                    whiteSpace: 'nowrap',
                    fontSize: isCriticalHit ? '12px' : '11px',
                    zIndex: 40,
                  }}
                >
                  {isCriticalHit
                    ? '💥 CRITICAL ROAR 2배 치명타! (+60 EXP)'
                    : isFever
                    ? '⚡ FEVER EXP 2배 획득! (+50 EXP)'
                    : `⚡ ${evo.beamName} (+25 EXP)`}
                </div>
              </div>
            )}

            {/* [오답 시] 킹 기도라 중력 번개 (우측 기도라 머리 -> 좌측 고질라 직격) */}
            {isGhidorahAttacking && (
              <div
                style={{
                  position: 'absolute',
                  left: '-20px',
                  right: '-15px',
                  top: '15%',
                  bottom: '15%',
                  zIndex: 25,
                  pointerEvents: 'none',
                }}
              >
                <svg
                  viewBox="0 0 300 100"
                  preserveAspectRatio="none"
                  style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'visible',
                    filter: 'drop-shadow(0 0 12px #facc15) drop-shadow(0 0 22px #eab308)',
                  }}
                >
                  <path
                    d="M 290 10 Q 230 20 180 45 T 80 55 T 5 65"
                    stroke="#fef08a"
                    strokeWidth="4"
                    fill="none"
                    className="animate-pulse"
                  />
                  <path
                    d="M 290 10 Q 230 20 180 45 T 80 55 T 5 65"
                    stroke="#ffffff"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M 270 50 Q 200 35 140 60 T 60 65 T 2 70"
                    stroke="#facc15"
                    strokeWidth="5"
                    fill="none"
                    className="animate-pulse"
                  />
                  <path
                    d="M 270 50 Q 200 35 140 60 T 60 65 T 2 70"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    fill="none"
                  />
                </svg>

                {/* 감전 폭발 */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-8px',
                    top: '55%',
                    transform: 'translateY(-50%)',
                    fontSize: '32px',
                    filter: 'drop-shadow(0 0 15px #ef4444)',
                    zIndex: 35,
                  }}
                >
                  ⚡💥
                </div>
              </div>
            )}
          </div>

          {/* 우측: 보스 괴수 (일반: 킹 기도라, 레이드: 5대 랜덤 보스) */}
          <div
            className="relative h-full flex-shrink-0 flex items-end"
            style={{ height: '100%', position: 'relative', zIndex: 10 }}
          >
            {isReviewMode ? (
              <RaidBossRenderer
                bossId={raidBoss?.id || 'hedorah'}
                isHit={isShootingBeam}
                isDefeated={isBossDefeated}
                hp={effectiveBossHp}
              />
            ) : (
              <KingGhidorah
                isHit={isShootingBeam}
                isDefeated={isBossDefeated}
                hp={effectiveBossHp}
              />
            )}
          </div>
        </div>

        {/* 3. 승리 화면 오버레이 (모든 단어 100% 클리어 시에만 표시) */}
        {isBossDefeated && (
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-2 z-50 animate-fadeIn"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.9)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-bounce shrink-0" />
              <h2 className="text-sm sm:text-base md:text-lg font-black text-amber-300">
                {isReviewMode
                  ? `🎉 약점 극복 완료! ${raidBoss?.name || '오답 괴수'} 격파!`
                  : `🎉 킹 기도라 격퇴! ${evo.name} 승리!`}
              </h2>
            </div>
            {/* 복습 모드: 마스터 완료 뱃지 & 레이드 보상 */}
            {isReviewMode && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-1.5">
                <span
                  style={{
                    padding: '1px 8px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(90deg, #9333ea, #c026d3, #ea580c)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 900,
                    border: '1.5px solid #fde047',
                    boxShadow: '0 0 8px rgba(168, 85, 247, 0.6)',
                  }}
                >
                  🏆 {raidBoss?.title || '오답 괴수'} 완전 퇴치!
                </span>
                <span
                  style={{
                    padding: '1px 8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    color: '#34d399',
                    fontSize: '10px',
                    fontWeight: 800,
                    border: '1px solid #10b981',
                    boxShadow: '0 0 6px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  🎁 레이드 토벌 보너스: 🥚 괴수 알 1개 + ⚡ 100 EXP 획득!
                </span>
              </div>
            )}
            {/* 일반 모드: 스테이지 진행 정보 */}
            {!isReviewMode && currentStageNum !== undefined && totalStages !== undefined && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '2px',
                }}
              >
                <span
                  style={{
                    padding: '1px 8px',
                    borderRadius: '9999px',
                    background: currentStageNum < totalStages
                      ? 'linear-gradient(90deg, #0369a1, #06b6d4)'
                      : 'linear-gradient(90deg, #d97706, #f59e0b)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 900,
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  {currentStageNum < totalStages
                    ? `STAGE ${currentStageNum} / ${totalStages} 클리어!`
                    : `🏆 전체 ${totalStages} 스테이지 완전 정복!`}
                </span>
              </div>
            )}
            <p className="text-slate-300 text-[11px] sm:text-xs font-bold mb-1.5">
              {isReviewMode
                ? `틀렸던 약점 단어 ${totalCount}개를 모두 마스터했어요! 약점 완전 극복! 🌟`
                : currentStageNum !== undefined && totalStages !== undefined && currentStageNum < totalStages
                  ? `단어 ${totalCount}개 격파! 다음 스테이지로 고고!`
                  : `단어 ${totalCount}개(${totalCount}/${totalCount})를 모두 격파했어요! 대단해요!`}
            </p>

            {/* 승리 보상 괴수 알 지급 완료 안내 배지 */}
            {!isReviewMode && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/60 text-amber-300 text-[10px] sm:text-[11px] font-black mb-1.5 shadow-sm">
                <span>🎁 승리 보상:</span>
                <span className="text-yellow-400 font-black">🥚 괴수 알 +1 획득 완료!</span>
              </div>
            )}

            {/* 알 깨기 가챠 보상 버튼 (일반 스테이지 전용) */}
            {!isReviewMode && onOpenGacha && (
              hasClaimedStageReward ? (
                <button
                  type="button"
                  disabled
                  className="bg-slate-700/60 text-slate-400 font-bold text-[11px] sm:text-xs px-4 py-1.5 rounded-lg cursor-not-allowed border border-slate-600 flex items-center gap-1.5 mb-1.5 select-none shadow-sm"
                >
                  <span className="text-xs">✅</span>
                  <span>이번 스테이지 괴수 알 부화 완료!</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenGacha}
                  className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-black text-xs sm:text-sm px-4 py-1.5 rounded-lg shadow-lg animate-bounce flex items-center gap-1.5 cursor-pointer border border-yellow-300 mb-1.5 active:scale-95"
                  style={{
                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.6), 0 0 8px rgba(244, 63, 94, 0.5)',
                  }}
                >
                  <span className="text-sm">🥚</span>
                  <span>획득한 괴수 알 부화하러 가기!</span>
                  <span
                    style={{
                      fontSize: '10px',
                      backgroundColor: '#facc15',
                      color: '#0f172a',
                      fontWeight: 900,
                      padding: '1px 6px',
                      borderRadius: '9999px',
                    }}
                  >
                    부화하기
                  </span>
                </button>
              )
            )}

            {/* 메인 CTA 버튼 */}
            <button
              type="button"
              onClick={onResetGame}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-slate-950 font-black text-xs sm:text-sm border border-white shadow-md transition-all cursor-pointer ${
                isReviewMode
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-400 hover:brightness-110 active:scale-95'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 active:scale-95'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isReviewMode
                ? '✅ 레이드 보상 수령 & 일반 모드 복귀'
                : currentStageNum !== undefined && totalStages !== undefined && currentStageNum < totalStages
                  ? `⚔️ STAGE ${currentStageNum + 1} 시작하기!`
                  : '🔄 처음부터 다시 시작하기!'}
            </button>
            {/* 복습 모드: 추가 나가기 버튼 (배틀 중단) */}
            {isReviewMode && onExitReviewMode && (
              <button
                type="button"
                onClick={onExitReviewMode}
                style={{
                  marginTop: '4px',
                  background: 'none',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  cursor: 'pointer',
                }}
              >
                그냥 나가기
              </button>
            )}
          </div>
        )}

        {/* 4. 패배 모달 오버레이 */}
        {isGameOver && (
          <div
            className="absolute inset-0 bg-slate-950/92 backdrop-blur-md flex flex-col items-center justify-center text-center p-3 z-50 animate-fadeIn overflow-y-auto"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.94)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
          >
            <div className="text-4xl mb-1 animate-pulse">⚡🦖💔</div>
            <h2 className="text-xl sm:text-2xl font-black text-red-400 mb-1">
              고질라 에너지 방전!
            </h2>
            <p className="text-slate-300 text-xs font-semibold mb-3">
              킹 기도라의 공격에 에너지가 소진되었어요. 다시 충전할까요?
            </p>
            <button
              type="button"
              onClick={onReviveGame}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm border border-white shadow-lg transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              ⚡ 에너지 충전 후 부활하기!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
