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
import { getGodzillaEvolution, getGodzillaAura } from '../types';
import type { RoarPowerResult } from '../types';
import { GodzillaAuraEffect } from './GodzillaAuraEffect';
import { MONSTER_MAP } from '../data/monsterData';
import { Trophy, RotateCcw, Swords, ShieldAlert, Zap, Heart, ArrowRight } from 'lucide-react';

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
  isStageClearReady?: boolean;
  isInfiniteMode?: boolean;
  cycleCount?: number;
  equippedPartnerId?: string | null;
  partnerSkillNotification?: { message: string; icon: string; id: number } | null;
  roarPower?: RoarPowerResult | null;
  isScreenShaking?: boolean;
  onGoToMath?: () => void;
  isMathDoneToday?: boolean;
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
  onOpenGacha: _onOpenGacha,
  hasClaimedStageReward: _hasClaimedStageReward = false,
  isCriticalHit = false,
  raidBoss,
  isStageClearReady = true,
  isInfiniteMode = false,
  cycleCount = 1,
  equippedPartnerId,
  partnerSkillNotification,
  roarPower,
  isScreenShaking = false,
  onGoToMath,
  isMathDoneToday = false,
}) => {
  const partnerMonster = equippedPartnerId ? MONSTER_MAP.get(equippedPartnerId) : null;

  // 보스 HP (남은 단어 수 및 파트너 추가 데미지 보너스 반영)
  const effectiveBossHp = Math.max(0, ghidorahHp);
  const isBossDefeated = isAllCleared && !isGameOver;
  // 마지막 6번째 단어 격파 시 1.8초 배틀 연출(열선 발사, 보스 HP 0% 감소, 격파 연출)이 완전히 끝난 뒤에만 결과창 오버레이 오픈
  const shouldShowClearOverlay = isBossDefeated && isStageClearReady;

  // 1. 공식 파워 랭킹에 따른 고질라 5단계 진화 정보
  // LV.1 ~ 2: 치비 고질라 (Chibi)
  // LV.3 ~ 4: 기본 고질라 (Classic)
  // LV.5 ~ 6: 고질라 -1.0 (Minus One)
  // LV.7 ~ 8: 이블 고질라 (Evil GMK)
  // LV.9 이상: 최강 버닝 고질라 (Burning)
  const evo = getGodzillaEvolution(level);
  const aura = getGodzillaAura(level);

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

  // 승리(클리어) 시 축하 효과음 및 폭죽 연출 (1.8초 배틀 연출 후 오버레이가 열릴 때 재생)
  useEffect(() => {
    if (shouldShowClearOverlay) {
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
  }, [shouldShowClearOverlay, isReviewMode]);

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

  // 빔 높이 및 구슬 크기 (목소리 크기 3단계 파워 판정 연동)
  // 1) GOOD (0~40): 1.0x 표준 두께
  // 2) GREAT (41~75): 1.8x 두께 확대 + 고질라 네온 발광 강화
  // 3) PERFECT (76~100): 3.0x 초대형 하이퍼 열선 + 0.4초 화면 진동
  const powerScale = roarPower
    ? roarPower.scaleMultiplier
    : isCriticalHit
    ? 1.6
    : isFever
    ? 1.35
    : 1.0;

  const baseBeamH = evo.tier === 'burning' ? (isFever ? 24 : 22) : isFever ? 22 : 18;
  const beamHeight = `${Math.min(32, Math.round(baseBeamH * (powerScale >= 3.0 ? 1.4 : powerScale >= 1.8 ? 1.2 : 1.0)))}px`;
  const mouthBallSize = `${Math.min(
    32,
    Math.round(20 * (powerScale >= 3.0 ? 1.35 : powerScale >= 1.8 ? 1.2 : 1.0))
  )}px`;

  // 5단계 진화별 열선 그라데이션 및 발광 (파워 판정에 따른 네온 발광 증폭, 박스 잘림 없는 날렵한 글로우)
  let beamGradient = 'linear-gradient(90deg, #ffffff 0%, #cffafe 15%, #22d3ee 50%, #00f2ff 100%)';
  let beamShadow = isFever
    ? '0 0 16px #00f2ff, 0 0 32px #06b6d4'
    : '0 0 12px #00f2ff, 0 0 24px #06b6d4';
  if (roarPower?.level === 'PERFECT') {
    beamShadow = '0 0 22px #ffffff, 0 0 42px #00f2ff, 0 0 65px #38bdf8';
  } else if (roarPower?.level === 'GREAT') {
    beamShadow = '0 0 16px #00f2ff, 0 0 32px #06b6d4, 0 0 45px #38bdf8';
  }
  let innerCoreColor = '#ffffff';
  let innerCoreShadow = '0 0 8px #ffffff';
  let mouthBallBg = 'radial-gradient(circle, #ffffff 40%, #a5f3fc 60%, #00f0ff 85%, transparent 100%)';
  let mouthBallShadow = '0 0 14px #00f2ff, 0 0 26px #0284c7';

  if (evo.tier === 'chibi') {
    mouthBallBg = 'radial-gradient(circle, #ffffff 45%, #86efac 70%, #00f0ff 90%, transparent 100%)';
    mouthBallShadow = '0 0 14px #4ade80, 0 0 24px #00f0ff';
  } else if (evo.tier === 'minusone') {
    beamGradient = 'linear-gradient(90deg, #ffffff 0%, #f0fdfa 15%, #ffffff 50%, #e0f2fe 80%, #38bdf8 100%)';
    beamShadow = isFever
      ? '0 0 18px #ffffff, 0 0 36px #38bdf8'
      : '0 0 14px #ffffff, 0 0 26px #38bdf8';
    innerCoreColor = '#ffffff';
    innerCoreShadow = '0 0 10px #ffffff';
    mouthBallBg = 'radial-gradient(circle, #ffffff 55%, #e0f2fe 80%, #38bdf8 95%, transparent 100%)';
    mouthBallShadow = '0 0 16px #ffffff, 0 0 30px #38bdf8';
  } else if (evo.tier === 'evil') {
    beamGradient = 'linear-gradient(90deg, #ffffff 0%, #c084fc 25%, #a855f7 55%, #818cf8 80%, #38bdf8 100%)';
    beamShadow = isFever
      ? '0 0 18px #a855f7, 0 0 36px #818cf8'
      : '0 0 14px #a855f7, 0 0 26px #818cf8';
    innerCoreColor = '#faf5ff';
    innerCoreShadow = '0 0 8px #c084fc';
    mouthBallBg = 'radial-gradient(circle, #ffffff 40%, #c084fc 65%, #a855f7 85%, transparent 100%)';
    mouthBallShadow = '0 0 16px #a855f7, 0 0 30px #38bdf8';
  } else if (evo.tier === 'burning') {
    beamGradient = 'linear-gradient(90deg, #ffffff 0%, #ffee55 12%, #ff8800 38%, #ff2200 70%, #991b1b 100%)';
    beamShadow = isFever
      ? '0 0 20px #ff2200, 0 0 38px #ff8800'
      : '0 0 14px #ff2200, 0 0 28px #ff8800';
    innerCoreColor = '#fffbeb';
    innerCoreShadow = '0 0 10px #ffee55';
    mouthBallBg = 'radial-gradient(circle, #ffffff 35%, #ffee55 55%, #ff8800 80%, #ff2200 100%)';
    mouthBallShadow = '0 0 18px #ff2200, 0 0 36px #ff8800';
  }

  return (
    <div
      className={`w-full flex-none px-1 sm:px-2 md:px-3 my-0.5 sm:my-1 h-[175px] xs:h-[185px] sm:h-[210px] md:h-[220px] landscape-short:h-full landscape-short:my-0 ${
        isScreenShaking ? 'animate-screen-shake' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-slate-900 p-1.5 sm:p-2 md:p-2.5 flex flex-col justify-between h-full ${
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

        {/* 파트너 스킬 발동 팝업 알림 (모스라 1회 방어, 메카고질라 EXP 등) */}
        {partnerSkillNotification && (
          <div
            key={partnerSkillNotification.id}
            className="absolute top-10 sm:top-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/95 border-2 border-amber-400 text-amber-300 font-black text-xs sm:text-sm shadow-2xl shadow-amber-500/50 animate-bounce whitespace-nowrap backdrop-blur-sm pointer-events-none"
          >
            <span className="text-base sm:text-lg">{partnerSkillNotification.icon}</span>
            <span className="tracking-tight text-white">{partnerSkillNotification.message}</span>
          </div>
        )}

        {/* 1. 상단 대칭형 대전 격투 HUD (5단계 진화 연동 - 컴팩트 슬림화) */}
        <div
          className="w-full flex items-center justify-between flex-none z-10 border-b border-white/10 pb-0.5 sm:pb-1 mb-0.5 px-0.5 sm:px-1"
        >
          {/* [좌측] 고질라 5단계 진화 라벨 & HP */}
          <div className="flex flex-col items-start min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: evo.themeColor, fill: evo.themeColor }} />
              <span className="text-[11px] sm:text-xs md:text-sm font-black truncate max-w-[110px] xs:max-w-none flex items-center gap-0.5" style={{ color: evo.themeColor }}>
                <span>{evo.icon} {evo.shortName}</span>
                {aura.tier !== 'none' && (
                  <span className="text-[9px] ml-0.5 animate-pulse" title={`[각성 아우라] ${aura.name}`}>
                    {aura.icon}
                  </span>
                )}
              </span>
              <span className="text-[11px] sm:text-xs font-black" style={{ color: godzillaHp <= 25 ? '#ef4444' : '#a5f3fc' }}>
                {godzillaHp}%
              </span>
            </div>
            {/* 고질라 체력 트랙 (슬림화: h-1.5 sm:h-2) */}
            <div
              className="w-20 xs:w-26 sm:w-34 md:w-42 lg:w-50 h-1.5 sm:h-2 rounded-full overflow-hidden bg-slate-950 border"
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
            {/* 파트너 동행 미니 뱃지 (슬림화) */}
            {partnerMonster && (
              <div
                className="flex items-center gap-0.5 mt-0.5 px-1 py-0.2 rounded-full bg-slate-950/85 border border-amber-400/40 text-[7px] xs:text-[8px] sm:text-[9px] text-amber-300 font-extrabold shadow-sm flex-shrink-0"
                title={`${partnerMonster.ko} 파트너 패시브: ${partnerMonster.partnerSkill.description}`}
              >
                <span>{partnerMonster.partnerSkill.icon}</span>
                <span className="text-white hidden sm:inline">{partnerMonster.ko}</span>
                <span className="text-amber-400 font-black">[{partnerMonster.partnerSkill.name}]</span>
              </div>
            )}
          </div>

          {/* [중앙] VS 배지 & 피버 모드 팝업 & 콤보 & 격파 진행도 (압축) */}
          <div className="flex flex-col items-center gap-0.5 mx-1 flex-shrink-0">
            {isReviewMode ? (
              <div
                className="flex items-center gap-0.5 px-1.5 sm:px-2 py-0.2 rounded-md text-[9px] sm:text-[11px] font-black text-white border border-amber-300 shadow-sm whitespace-nowrap leading-tight"
                style={{
                  background: 'linear-gradient(90deg, #b45309 0%, #ea580c 100%)',
                }}
              >
                <span>🔥 특훈 배틀</span>
              </div>
            ) : isFever ? (
              <div
                className="animate-bounce px-1.5 sm:px-2 py-0.2 rounded-full text-[9px] sm:text-[11px] font-black text-white border border-yellow-200 shadow-md whitespace-nowrap leading-tight"
                style={{
                  background: 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #eab308 100%)',
                }}
              >
                🔥 FEVER x2! 🔥
              </div>
            ) : combo > 1 ? (
              <div
                className="animate-bounce px-1.5 sm:px-2 py-0.2 rounded-md bg-amber-500 text-slate-950 text-[9px] sm:text-[11px] font-black border border-amber-300 shadow-sm whitespace-nowrap leading-tight"
              >
                🔥 {combo} COMBO!
              </div>
            ) : (
              <div
                className="flex items-center gap-0.5 text-rose-500 font-black text-[9px] sm:text-[11px] px-1.5 py-0.2 rounded bg-rose-950/60 border border-rose-600/60 leading-tight"
              >
                <Swords className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>VS</span>
              </div>
            )}
            <div
              className="text-[8px] sm:text-[10px] font-extrabold flex items-center gap-1 tracking-tight leading-tight"
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
                  className="text-[8px] sm:text-[10px] text-slate-400 underline cursor-pointer hover:text-white"
                >
                  (일반)
                </button>
              )}
            </div>
            {stageRangeLabel && !isReviewMode && (
              <div className="hidden xs:block text-[7px] sm:text-[8px] font-bold text-slate-500 whitespace-nowrap leading-none">
                {stageRangeLabel}
              </div>
            )}
          </div>

          {/* [우측] 보스 HP (일반: 👑 킹 기도라, 복습 레이드: 5대 랜덤 보스) */}
          <div className="flex flex-col items-end min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <ShieldAlert
                className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                style={{
                  color: isReviewMode ? (raidBoss?.themeColor || '#a855f7') : '#f59e0b',
                }}
              />
              <span
                className="text-[11px] sm:text-xs md:text-sm font-black truncate max-w-[130px] xs:max-w-none"
                style={{
                  color: isReviewMode ? (raidBoss?.themeColor || '#d8b4fe') : '#fef08a',
                }}
              >
                {isReviewMode ? `${raidBoss?.icon || '👾'} ${raidBoss?.title || '스모그 괴수 헤도라'}` : '👑 킹 기도라'}
              </span>
              <span
                className="text-[11px] sm:text-xs font-black"
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
            {/* 보스 체력 트랙 (슬림화: h-1.5 sm:h-2) */}
            <div
              className="w-20 xs:w-26 sm:w-34 md:w-42 lg:w-50 h-1.5 sm:h-2 rounded-full overflow-hidden bg-slate-950 border"
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

        {/* 2. 대전 격투 아레나 (유연한 flex 3단 구조: 고질라 - 빔 공간 - 킹 기도라 - 확장된 수직 영역) */}
        <div
          className="relative w-full flex-1 min-h-0 flex items-end justify-between overflow-hidden pt-0.5"
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
            style={{
              height: '100%',
              position: 'relative',
              zIndex: 10,
              filter: isShootingBeam
                ? roarPower?.level === 'PERFECT'
                  ? 'drop-shadow(0 0 28px #00f2ff) drop-shadow(0 0 45px #38bdf8)'
                  : roarPower?.level === 'GREAT'
                  ? 'drop-shadow(0 0 16px #00f2ff)'
                  : 'none'
                : 'none',
              transition: 'filter 0.2s ease',
            }}
          >
            {/* [Lv.10 ~ Lv.50+] 궁극의 각성 아우라 이펙트 레이어 (부유 파티클, 충격파, 흑염, 황금 번개) */}
            <GodzillaAuraEffect tier={aura.tier} />

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
            {/* 슈퍼 포효 레벨 3 (PERFECT ATOMIC ROAR) 전체 화면 아토믹 에너지 방사 */}
            {isShootingBeam && roarPower?.level === 'PERFECT' && (
              <div
                style={{
                  position: 'absolute',
                  inset: '-25px -40px',
                  background:
                    'radial-gradient(ellipse at 40% 50%, rgba(0, 242, 255, 0.3) 0%, rgba(56, 189, 248, 0.18) 50%, transparent 80%)',
                  pointerEvents: 'none',
                  zIndex: 22,
                  animation: 'beamPulse 0.1s infinite alternate',
                }}
              />
            )}

            {/* [정답 시] 고질라 5단계 특화 열선 (고질라 입 cx=282 cy=132 -> 기도라 흉부 직격) */}
            {isShootingBeam && (
              <div
                style={{
                  position: 'absolute',
                  left: '-14px', // 고질라 입술 끝 오버랩
                  right: '-20px', // 킹 기도라 흉곽 오버랩
                  bottom: '46%', // 고질라 입과 기도라 중심부 수직 정렬
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
                        width: isFever ? '20px' : '16px',
                        height: isFever ? '20px' : '16px',
                        borderRadius: '9999px',
                        background: 'radial-gradient(circle, #ffffff 30%, #86efac 60%, #00f0ff 100%)',
                        boxShadow: '0 0 12px #00f0ff, 0 0 20px #4ade80',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                      }}
                    >
                      ✨
                    </div>
                    <div
                      className="animate-pulse"
                      style={{
                        width: isFever ? '22px' : '18px',
                        height: isFever ? '22px' : '18px',
                        borderRadius: '9999px',
                        background: 'radial-gradient(circle, #ffffff 30%, #38bdf8 65%, #0284c7 100%)',
                        boxShadow: '0 0 14px #38bdf8, 0 0 24px #00f0ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                      }}
                    >
                      💫
                    </div>
                    <div
                      className="animate-bounce"
                      style={{
                        width: isFever ? '24px' : '20px',
                        height: isFever ? '24px' : '20px',
                        borderRadius: '9999px',
                        background: 'radial-gradient(circle, #ffffff 35%, #67e8f9 60%, #06b6d4 100%)',
                        boxShadow: '0 0 16px #06b6d4, 0 0 28px #22d3ee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                      }}
                    >
                      ⭐
                    </div>
                    <div
                      className="animate-pulse"
                      style={{
                        width: isFever ? '26px' : '22px',
                        height: isFever ? '26px' : '22px',
                        borderRadius: '9999px',
                        background: 'radial-gradient(circle, #ffffff 40%, #a7f3d0 70%, #00f0ff 100%)',
                        boxShadow: '0 0 18px #00f2ff, 0 0 30px #38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                      }}
                    >
                      🔥
                    </div>
                  </div>
                ) : (
                  /* 2~5단계: 날렵한 고에너지 아토믹 레이저 빔 */
                  <div
                    className="animate-beam-glow"
                    style={{
                      width: '100%',
                      height: '100%',
                      background: beamGradient,
                      borderRadius: '9999px',
                      boxShadow: beamShadow,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {/* 중심 레이저 하이라이트 코어 (날렵한 고밀도 코어 라인) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '4px',
                        right: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: isFever ? '6px' : '5px',
                        backgroundColor: innerCoreColor,
                        borderRadius: '9999px',
                        boxShadow: innerCoreShadow,
                      }}
                    />

                    {/* 3단계 (고질라 -1.0): 팽창하는 충격파 고리 이펙트 */}
                    {evo.tier === 'minusone' && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: '-4px 0',
                          pointerEvents: 'none',
                          display: 'flex',
                          justifyContent: 'space-around',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '8px',
                            height: '130%',
                            border: '2px solid #ffffff',
                            borderRadius: '9999px',
                            boxShadow: '0 0 10px #38bdf8',
                          }}
                          className="animate-ping"
                        />
                        <div
                          style={{
                            width: '12px',
                            height: '130%',
                            border: '2px solid #ffffff',
                            borderRadius: '9999px',
                            boxShadow: '0 0 14px #0284c7',
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
                          inset: '-3px 0',
                          pointerEvents: 'none',
                          zIndex: 32,
                          display: 'flex',
                          justifyContent: 'space-around',
                          alignItems: 'center',
                        }}
                      >
                        <span className="animate-bounce" style={{ fontSize: '13px', filter: 'drop-shadow(0 0 6px #a855f7)' }}>
                          ⚡
                        </span>
                        <span className="animate-pulse" style={{ fontSize: '11px', filter: 'drop-shadow(0 0 6px #38bdf8)' }}>
                          🟣
                        </span>
                        <span className="animate-bounce" style={{ fontSize: '14px', filter: 'drop-shadow(0 0 6px #a855f7)' }}>
                          ⚡
                        </span>
                      </div>
                    )}

                    {/* 5단계 (버닝 고질라): 초대형 나선 화염 회오리 (Infinite Spiral Heat Ray) */}
                    {evo.tier === 'burning' && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: '-4px 0',
                          pointerEvents: 'none',
                          zIndex: 32,
                        }}
                      >
                        {/* 회전하는 나선 화염 파티클 */}
                        <span
                          className="animate-pulse"
                          style={{ position: 'absolute', left: '15%', top: '-6px', fontSize: '13px' }}
                        >
                          🔥
                        </span>
                        <span
                          className="animate-pulse"
                          style={{ position: 'absolute', left: '50%', bottom: '-6px', fontSize: '13px' }}
                        >
                          🔥
                        </span>
                        <span
                          className="animate-pulse"
                          style={{ position: 'absolute', left: '80%', top: '-6px', fontSize: '13px' }}
                        >
                          🔥
                        </span>
                        {/* 나선형 와류 오버레이 */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255, 238, 85, 0.4) 8px, rgba(255, 238, 85, 0.4) 16px)',
                            borderRadius: '9999px',
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
                    fontSize: isFever ? '30px' : '26px',
                    filter: 'drop-shadow(0 0 10px #ef4444) drop-shadow(0 0 18px #facc15)',
                    zIndex: 35,
                    pointerEvents: 'none',
                  }}
                >
                  {evo.tier === 'chibi' ? '💥✨' : '💥'}
                </div>

                {/* [공격 멘트 & 판정 배지 통합 컨테이너] */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 'calc(100% + 4px)',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    zIndex: 50,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {/* 1) 리듬게임식 파워 판정 배너 (음성 포효 활성화 시 상단 팝업) */}
                  {roarPower && (
                    <div
                      key={`power-badge-${roarPower.level}`}
                      style={{
                        animation: 'judgmentSlam 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                      }}
                    >
                      <div
                        style={{
                          padding:
                            roarPower.level === 'PERFECT'
                              ? '3px 12px'
                              : roarPower.level === 'GREAT'
                              ? '2.5px 10px'
                              : '2px 8px',
                          borderRadius: '9999px',
                          background:
                            roarPower.level === 'PERFECT'
                              ? 'linear-gradient(90deg, #b91c1c 0%, #ea580c 50%, #eab308 100%)'
                              : roarPower.level === 'GREAT'
                              ? 'linear-gradient(90deg, #0284c7 0%, #06b6d4 50%, #f59e0b 100%)'
                              : 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                          border:
                            roarPower.level === 'PERFECT' ? '1.5px solid #fef08a' : '1.5px solid #ffffff',
                          boxShadow:
                            roarPower.level === 'PERFECT'
                              ? '0 0 16px rgba(239, 68, 68, 0.9), 0 0 28px rgba(245, 158, 11, 0.7)'
                              : roarPower.level === 'GREAT'
                              ? '0 0 14px rgba(6, 182, 212, 0.8), 0 0 20px rgba(245, 158, 11, 0.6)'
                              : '0 0 10px rgba(16, 185, 129, 0.7)',
                          color: '#ffffff',
                          fontWeight: 900,
                          fontSize:
                            roarPower.level === 'PERFECT' ? '12px' : roarPower.level === 'GREAT' ? '11px' : '10px',
                          letterSpacing: '-0.02em',
                          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.2',
                        }}
                      >
                        {roarPower.label}
                      </div>
                    </div>
                  )}

                  {/* 2) EXP 및 열선 발사 공격 멘트 팝업 배지 */}
                  <div
                    className="animate-badge-float"
                    style={{
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
                      padding: isCriticalHit ? '2.5px 10px' : isFever ? '2px 8px' : '1.5px 7px',
                      borderRadius: '9999px',
                      border: isCriticalHit || isFever ? '1.2px solid #fef08a' : '1.2px solid #ffffff',
                      boxShadow: isCriticalHit
                        ? '0 0 14px rgba(239, 68, 68, 0.85), 0 0 22px rgba(245, 158, 11, 0.65)'
                        : isFever
                        ? '0 0 12px rgba(239, 68, 68, 0.75), 0 0 18px rgba(245, 158, 11, 0.55)'
                        : '0 0 10px rgba(6, 182, 212, 0.75)',
                      whiteSpace: 'nowrap',
                      fontSize: isCriticalHit ? '10px' : '9.5px',
                      lineHeight: '1.2',
                    }}
                  >
                    {isCriticalHit
                      ? '💥 CRITICAL ROAR 2배 치명타! (+60 EXP)'
                      : isFever
                      ? '⚡ FEVER EXP 2배 획득! (+50 EXP)'
                      : `⚡ ${evo.beamName} (+25 EXP)`}
                  </div>
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

        {/* 3. 승리 화면 오버레이 (모든 단어 100% 클리어 및 1.8초 배틀 연출 완료 시에만 표시 - 3단 컴팩트 룩) */}
        {shouldShowClearOverlay && (
          <div
            className="absolute inset-0 bg-slate-950/92 backdrop-blur-md flex flex-col items-center justify-center text-center p-3 sm:p-4 z-50 animate-fadeIn"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.92)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
          >
            {/* [1단: 타이틀 + 클리어 뱃지 인라인 결합] */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap mb-1 sm:mb-1.5">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-bounce shrink-0" />
              <h2 className="text-sm sm:text-base md:text-lg font-black text-amber-300 tracking-tight">
                {isReviewMode
                  ? `🎉 ${raidBoss?.name || '약점 괴수'} 완전 퇴치!`
                  : '🎉 킹 기도라 격퇴!'}
              </h2>
              {/* 스테이지 뱃지 인라인 결합 */}
              {isReviewMode ? (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black border shadow-sm shrink-0"
                  style={{
                    background: 'linear-gradient(90deg, #9333ea, #c026d3, #ea580c)',
                    color: '#ffffff',
                    borderColor: '#fde047',
                  }}
                >
                  🏆 오답 마스터
                </span>
              ) : currentStageNum !== undefined ? (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border shadow-sm shrink-0"
                  style={{
                    background: isInfiniteMode
                      ? 'linear-gradient(90deg, #9333ea, #c026d3, #f59e0b)'
                      : currentStageNum < (totalStages ?? 34)
                      ? 'linear-gradient(90deg, #0369a1, #06b6d4)'
                      : 'linear-gradient(90deg, #d97706, #f59e0b)',
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.4)',
                  }}
                >
                  {isInfiniteMode
                    ? `👑 마스터 STAGE ${currentStageNum} (${cycleCount ?? 1}회독)`
                    : totalStages !== undefined && currentStageNum >= totalStages
                    ? '🏆 200단어 완전 정복'
                    : `STAGE ${currentStageNum} 클리어`}
                </span>
              ) : null}
            </div>

            {/* [2단: 보상 알약 뱃지 슬림화] */}
            {isReviewMode ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-emerald-500/70 text-emerald-300 text-[10px] sm:text-xs font-bold mb-2.5 sm:mb-3 shadow-sm">
                <span>🎁 토벌 보너스:</span>
                <span className="text-white font-black">🥚 괴수 알 1개 + ⚡ 100 EXP 획득!</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/80 text-cyan-300 text-[10px] sm:text-xs font-black mb-2.5 sm:mb-3 shadow-sm">
                <Zap size={13} className="fill-cyan-400 text-cyan-400 shrink-0" />
                <span>승리 보상:</span>
                <span className="text-yellow-300 font-black">⚡ EXP 획득 &amp; 레벨업!</span>
              </div>
            )}

            {/* [3단: 액션 버튼 1줄 가로 배치 (Flex row)] */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 w-full max-w-md px-1 sm:px-2">
              {/* 왼쪽: 당일 산수 훈련 미완료 시 산수 모드 이동 버튼 (주황/골드 강조) */}
              {!isReviewMode && !isMathDoneToday && onGoToMath && (
                <button
                  type="button"
                  onClick={onGoToMath}
                  className="flex-1 max-w-[210px] flex items-center justify-center gap-1 px-3 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-[13px] border border-yellow-200 shadow-lg cursor-pointer animate-pulse active:scale-95 whitespace-nowrap"
                >
                  <span>🔥 산수 훈련 가기 (1/2 완료)</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              )}

              {/* 오른쪽 (또는 단일): 다음 스테이지 시작 버튼 (시안 블루) */}
              <button
                type="button"
                onClick={onResetGame}
                className={`${
                  !isReviewMode && !isMathDoneToday && onGoToMath ? 'flex-1 max-w-[210px]' : 'px-6 max-w-xs'
                } flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl text-slate-950 font-black text-xs sm:text-[13px] border border-white/80 shadow-lg transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                  isReviewMode
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-400 hover:brightness-110'
                    : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isReviewMode
                    ? '✅ 보상 수령 & 복귀'
                    : isInfiniteMode
                    ? `⚔️ 다음 STAGE ${(currentStageNum ?? 1) % (totalStages ?? 34) + 1}`
                    : currentStageNum !== undefined && totalStages !== undefined && currentStageNum < totalStages
                    ? `⚔️ 다음 STAGE ${currentStageNum + 1} 시작`
                    : '🏆 200단어 완주 세리머니!'}
                </span>
              </button>

              {/* 복습 모드 보조 나가기 버튼 */}
              {isReviewMode && onExitReviewMode && (
                <button
                  type="button"
                  onClick={onExitReviewMode}
                  className="px-2.5 py-2 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                >
                  나가기
                </button>
              )}
            </div>
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
