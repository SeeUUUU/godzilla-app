import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Heart, Trophy, RotateCcw, Zap, ArrowRight, Calculator } from 'lucide-react';
import type { MathProblemItem } from '../types';
import { getMathProblemsForStage, TOTAL_MATH_STAGES, PROBLEMS_PER_MATH_STAGE } from '../data/mathData';
import { useSpeech } from '../hooks/useSpeech';
import {
  playLaserPewPew,
  playMeteorExplosionSound,
  playWarningSirenSound,
  playErrorBuzzer,
  playVictoryFanfare,
  playCardTapSound,
} from '../utils/soundEffects';

interface MathDefenseStageProps {
  stageNum: number; // 1 ~ 12
  equippedPartnerId?: string | null;
  onClear: (bonusExp: number) => void;
  onFail?: () => void;
  onPartnerNotice?: (message: string, icon: string) => void;
  onGoToLanguage?: () => void;
  isLanguageDoneToday?: boolean;
  onNextMathStage?: () => void;
}

type GamePhase = 'WARNING' | 'PLAYING' | 'INTERCEPTING' | 'IMPACT' | 'VICTORY' | 'GAME_OVER';

const TOTAL_ROUNDS = PROBLEMS_PER_MATH_STAGE; // 10문제
const FALL_DURATION_MS = 8000; // 8초 (초등 2학년 산수 계산 여유 시간 확보)

export const MathDefenseStage: React.FC<MathDefenseStageProps> = ({
  stageNum,
  equippedPartnerId,
  onClear,
  onPartnerNotice,
  onGoToLanguage,
  isLanguageDoneToday = false,
  onNextMathStage,
}) => {
  const { speak, cancel } = useSpeech();

  const [phase, setPhase] = useState<GamePhase>('WARNING');
  const [isStarted, setIsStarted] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [reviveCount, setReviveCount] = useState(0);
  const [mothraShieldActive, setMothraShieldActive] = useState(() => equippedPartnerId === 'mothra');
  const [meteorProgress, setMeteorProgress] = useState(0); // 0 ~ 100%
  const [selectedWrongChoices, setSelectedWrongChoices] = useState<string[]>([]);
  const [isShootingBeam, setIsShootingBeam] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [isImpactShaking, setIsImpactShaking] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timeoutTimerRef = useRef<number | null>(null);
  const nextRoundTimerRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);
  const speechTimerRef = useRef<number | null>(null);
  const lastSpokenProblemIdRef = useRef<string | null>(null);

  // 1. 해당 스테이지의 10문제 가져오기
  const stageProblems = useMemo<MathProblemItem[]>(() => {
    return getMathProblemsForStage(stageNum);
  }, [stageNum]);

  const currentProblem = stageProblems[roundIndex] || stageProblems[0];

  // 1-2. 위기 시(하트 1개) 50:50 정답 후보 압축: 오답 2개 안정적 제거
  const eliminatedChoices = useMemo<string[]>(() => {
    if (lives !== 1 || !currentProblem) return [];
    const wrongOptions = currentProblem.options.filter((opt) => opt !== currentProblem.answer);
    return wrongOptions.slice(0, 2);
  }, [lives, currentProblem]);

  const clearAllTimers = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timeoutTimerRef.current !== null) {
      window.clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (nextRoundTimerRef.current !== null) {
      window.clearTimeout(nextRoundTimerRef.current);
      nextRoundTimerRef.current = null;
    }
    if (warningTimerRef.current !== null) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (speechTimerRef.current !== null) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
  }, []);

  // 2. 수식 TTS 다시 듣기 (버튼 클릭용)
  const handleReplayTts = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      cancel();
      if (currentProblem && currentProblem.readKr) {
        speak(currentProblem.readKr, 'ko-KR');
      }
    },
    [cancel, currentProblem, speak]
  );

  // 3. 지면 충돌 처리 (시간 초과)
  const handleImpact = useCallback(() => {
    clearAllTimers();
    cancel();
    setIsImpactShaking(true);
    setPhase('IMPACT');
    playMeteorExplosionSound();

    if (mothraShieldActive) {
      setMothraShieldActive(false);
      onPartnerNotice?.('모스라의 수호 쉴드! 충돌 데미지 1회 무효화!', '🛡️');
      nextRoundTimerRef.current = window.setTimeout(() => {
        setIsImpactShaking(false);
        cancel();
        setRoundIndex((curr) => (curr + 1 < TOTAL_ROUNDS ? curr + 1 : curr));
        setPhase('PLAYING');
      }, 1400);
      return;
    }

    setLives((prev) => {
      const nextLives = Math.max(0, prev - 1);
      if (nextLives <= 0) {
        nextRoundTimerRef.current = window.setTimeout(() => {
          setIsImpactShaking(false);
          cancel();
          setPhase('GAME_OVER');
        }, 800);
      } else {
        nextRoundTimerRef.current = window.setTimeout(() => {
          setIsImpactShaking(false);
          cancel();
          setRoundIndex((curr) => (curr + 1 < TOTAL_ROUNDS ? curr + 1 : curr));
          setPhase('PLAYING');
        }, 1400);
      }
      return nextLives;
    });
  }, [clearAllTimers, cancel, mothraShieldActive, onPartnerNotice]);

  // 4. 운석 낙하 애니메이션 루프 시작
  const startMeteorFall = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setMeteorProgress(0);
    setSelectedWrongChoices([]);
    setIsShootingBeam(false);
    setIsExploding(false);
    setIsImpactShaking(false);
    startTimeRef.current = performance.now();

    const loop = (time: number) => {
      const elapsed = time - startTimeRef.current;
      const progress = Math.min(100, (elapsed / FALL_DURATION_MS) * 100);
      setMeteorProgress(progress);

      if (progress < 100) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        handleImpact();
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [handleImpact]);

  // 5. 문제 시작 및 변경 시: 운석 낙하 애니메이션 시작 (isStarted가 true이고 PLAYING일 때만)
  useEffect(() => {
    if (isStarted && phase === 'PLAYING') {
      startMeteorFall();
    }
  }, [isStarted, phase, roundIndex, startMeteorFall]);

  // 6. 문제 식별자 추적 및 브라우저 TTS 대기열 초기화 후 1회 단독 낭독 (isStarted가 true이고 PLAYING일 때만)
  useEffect(() => {
    if (isStarted && phase === 'PLAYING' && currentProblem && currentProblem.id) {
      // 문제가 실제로 바뀌었을 때만 1회 낭독 실행 (리렌더링 시 중복 발화 원천 차단)
      if (lastSpokenProblemIdRef.current !== currentProblem.id) {
        lastSpokenProblemIdRef.current = currentProblem.id;

        // [핵심] 브라우저 이전 TTS 대기열 즉시 강제 취소
        cancel();

        // 80ms 여유를 두고 새로운 문제만 단독 낭독
        if (speechTimerRef.current !== null) {
          window.clearTimeout(speechTimerRef.current);
        }
        speechTimerRef.current = window.setTimeout(() => {
          if (isStarted && phase === 'PLAYING') {
            speak(currentProblem.readKr, 'ko-KR');
          }
        }, 80);
      }
    }
  }, [isStarted, phase, currentProblem, speak, cancel]);

  // 7. 게임 시작 전이거나 배틀 상태가 PLAYING이 아닐 때, 언마운트 시 브라우저 TTS 즉시 정리
  useEffect(() => {
    if (!isStarted || phase !== 'PLAYING') {
      cancel();
    }
  }, [isStarted, phase, cancel]);

  useEffect(() => {
    return () => {
      cancel();
      clearAllTimers();
    };
  }, [cancel, clearAllTimers]);

  // 8. 보기 클릭 (정답 / 오답)
  const handleSelectChoice = useCallback(
    (choice: string) => {
      if (!isStarted || phase !== 'PLAYING' || isShootingBeam || isExploding) return;

      playCardTapSound();

      if (choice === currentProblem.answer) {
        // [정답] 고질라 대각선 아토믹 레이저 빔 발사 & 운석 공중 요격 폭발
        clearAllTimers();
        // 정답을 맞춘 즉시 진행 중인 문제 낭독 취소
        cancel();
        setPhase('INTERCEPTING');
        setIsShootingBeam(true);
        playLaserPewPew();

        // 0.25초 후 운석 요격 명중 폭발
        timeoutTimerRef.current = window.setTimeout(() => {
          setIsExploding(true);
          playMeteorExplosionSound();

          // 폭죽 파티클
          confetti({
            particleCount: 60,
            spread: 90,
            origin: { x: 0.5, y: Math.min(0.7, Math.max(0.15, (meteorProgress * 0.78) / 100)) },
            colors: ['#f59e0b', '#ef4444', '#38bdf8', '#ffffff', '#10b981'],
          });

          // 레이저 소멸
          window.setTimeout(() => {
            setIsShootingBeam(false);
          }, 350);

          // 다음 라운드 진행 또는 클리어 판정
          nextRoundTimerRef.current = window.setTimeout(() => {
            cancel();
            if (roundIndex + 1 >= TOTAL_ROUNDS) {
              setPhase('VICTORY');
              playVictoryFanfare();
              confetti({
                particleCount: 120,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#facc15', '#f97316', '#38bdf8', '#10b981', '#ffffff'],
              });
            } else {
              setRoundIndex((r) => r + 1);
              setPhase('PLAYING');
            }
          }, 1100);
        }, 250);
      } else {
        // [오답] 진동 & 체력 감소
        playErrorBuzzer();
        setSelectedWrongChoices((prev) => [...prev, choice]);
        setIsImpactShaking(true);
        window.setTimeout(() => setIsImpactShaking(false), 400);

        if (mothraShieldActive) {
          setMothraShieldActive(false);
          onPartnerNotice?.('모스라의 수호의 날개! 오답 1회 무료 방어!', '🛡️');
          return;
        }

        setLives((prev) => {
          const nextLives = Math.max(0, prev - 1);
          if (nextLives <= 0) {
            clearAllTimers();
            cancel();
            nextRoundTimerRef.current = window.setTimeout(() => {
              setPhase('GAME_OVER');
            }, 800);
          }
          return nextLives;
        });
      }
    },
    [
      phase,
      isShootingBeam,
      isExploding,
      currentProblem,
      clearAllTimers,
      cancel,
      roundIndex,
      meteorProgress,
      mothraShieldActive,
      onPartnerNotice,
    ]
  );

  // 9. 인트로 경고 사운드 재생 (자동 시작 타이머 완전 제거: 사용자가 [산수 요격 개시] 클릭 시에만 게임 시작)
  useEffect(() => {
    playWarningSirenSound();

    return () => {
      clearAllTimers();
      cancel();
    };
  }, [clearAllTimers, cancel]);

  // 9-2. 산수 요격 개시 버튼 클릭 핸들러 (사용자가 직접 클릭했을 때 비로소 게임 루프 구동)
  const handleStartGame = useCallback(() => {
    clearAllTimers();
    cancel();
    lastSpokenProblemIdRef.current = null;
    setIsStarted(true);
    setPhase('PLAYING');
  }, [clearAllTimers, cancel]);

  // 10. 고질라 긴급 부활 (이어서 풀기 - 현재 문제 번호 유지, 하트 2개 회복)
  const handleReviveAndContinue = useCallback(() => {
    clearAllTimers();
    cancel();
    lastSpokenProblemIdRef.current = null;
    setSelectedWrongChoices([]);
    setMeteorProgress(0);
    setIsShootingBeam(false);
    setIsExploding(false);
    setIsImpactShaking(false);
    setLives(2);
    setReviveCount((prev) => prev + 1);
    setIsStarted(true);
    setPhase('PLAYING');
  }, [clearAllTimers, cancel]);

  // 10-2. 처음부터 다시 시작하기 (1번 문제 리셋)
  const handleRestart = useCallback(() => {
    clearAllTimers();
    cancel();
    lastSpokenProblemIdRef.current = null;
    setSelectedWrongChoices([]);
    setMeteorProgress(0);
    setIsShootingBeam(false);
    setIsExploding(false);
    setIsImpactShaking(false);
    setLives(3);
    setRoundIndex(0);
    setReviveCount(0);
    setIsStarted(true);
    setPhase('PLAYING');
    setMothraShieldActive(equippedPartnerId === 'mothra');
  }, [clearAllTimers, cancel, equippedPartnerId]);

  // 11. 경험치 계산 (퍼펙트 완주 보너스 +20 EXP, 메카고질라 +20%)
  const isPerfect = reviveCount === 0;
  const baseExp = isPerfect ? 95 : 75; // 무결점 95 EXP, 부활 완주 75 EXP
  const isMecha = equippedPartnerId === 'mechagodzilla';
  const earnedExp = isMecha ? Math.round(baseExp * 1.2) : baseExp; // 114 EXP or 90 EXP

  // 11-2. 클리어 확인 버튼
  const handleConfirmClear = () => {
    clearAllTimers();
    cancel();
    onClear(earnedExp);
  };

  return (
    <div
      className={`relative w-full flex-1 min-h-0 h-full flex flex-col rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-500/60 shadow-2xl ${
        isImpactShaking ? 'animate-screen-shake' : ''
      }`}
      style={{
        boxShadow: '0 0 35px rgba(245, 158, 11, 0.4), inset 0 0 30px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* 1. 상단 HUD 배너 */}
      <div className="flex-none flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-amber-500/40 z-20">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="px-2 py-0.5 rounded-md bg-amber-600/90 text-white font-black text-[10px] sm:text-xs tracking-wider flex items-center gap-1 shadow-sm">
            <Calculator size={13} />
            STAGE {stageNum} 산수
          </span>
          <span className="text-amber-300 font-extrabold text-xs sm:text-sm truncate">
            수식 운석 요격 디펜스
          </span>

          {/* 파트너 스킬 뱃지 */}
          {equippedPartnerId === 'mothra' && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border transition-all ${
                mothraShieldActive
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}
            >
              <span>🦋</span>
              <span>{mothraShieldActive ? '수호 쉴드 (1회 방어)' : '쉴드 사용됨'}</span>
            </span>
          )}
          {equippedPartnerId === 'mechagodzilla' && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 text-[10px] font-black flex items-center gap-1 shadow-sm">
              <span>🤖</span>
              <span>EXP +20%</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* 라운드 진행도 */}
          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-amber-300">
            <span>요격:</span>
            <span className="text-white">
              {Math.min(TOTAL_ROUNDS, roundIndex + (phase === 'VICTORY' ? 1 : 0))} / {TOTAL_ROUNDS}
            </span>
          </div>

          {/* 고질라 쉴드 하트 */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((heartIdx) => (
              <Heart
                key={heartIdx}
                size={16}
                className={`transition-all duration-300 ${
                  heartIdx <= lives
                    ? 'text-red-500 fill-red-500 scale-100'
                    : 'text-slate-600 fill-slate-800 scale-75 opacity-40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2. WARNING 인트로 연출 오버레이 (isStarted가 false이거나 phase가 WARNING일 때 열림) */}
      {(!isStarted || phase === 'WARNING') && (
        <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col items-center justify-center text-center p-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-600/20 border-2 border-amber-500 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-amber-500/50 animate-bounce">
            ⚡
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-wider mb-2 animate-pulse">
            STAGE {stageNum} 산수 운석 요격!
          </h2>
          <p className="text-sm sm:text-base font-bold text-yellow-300 mb-1">
            ☄️ 하늘에서 계산 수식 운석이 떨어집니다!
          </p>
          <p className="text-xs sm:text-sm text-slate-300 mb-4 max-w-sm">
            운석에 적힌 덧셈·뺄셈 문제의 정답을 빠르게 골라 아토믹 열선으로 요격하세요!
          </p>
          <button
            type="button"
            onClick={handleStartGame}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-sm border border-yellow-300 shadow-xl cursor-pointer"
          >
            ⚔️ 산수 요격 개시!
          </button>
        </div>
      )}

      {/* 3. 메인 배틀 아레나 (상단: 우주 하늘 & 운석 낙하, 하단: 선택 보기) */}
      <div className="flex-1 min-h-0 relative flex flex-col justify-between overflow-hidden">
        {/* 하늘 배경 & 오렌지/앰버 네온 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 50% 20%, rgba(245, 158, 11, 0.22) 0%, rgba(15, 23, 42, 0.95) 75%)',
          }}
        />

        {/* 상단: 산수 에너지 스테이션 배너 또는 50:50 긴급 서포트 배너 */}
        <div className="relative z-10 w-full flex items-center justify-center pt-1 flex-none">
          {!isStarted ? (
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/80 border border-amber-500/40 text-[10px] sm:text-xs text-amber-300/70 font-extrabold shadow-sm">
              <span>⚡</span>
              <span>산수 요격 개시 대기 중</span>
              <span>🦖</span>
            </div>
          ) : lives === 1 && phase === 'PLAYING' ? (
            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-950/90 border-2 border-red-500 text-[11px] sm:text-xs text-red-200 font-black shadow-[0_0_20px_rgba(239,68,68,0.85)] animate-pulse">
              <span className="text-sm">🚨</span>
              <span>긴급 서포트 발동! 정답 후보 압축! (50:50)</span>
              <span className="text-amber-300">⚡</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/80 border border-amber-500/40 text-[10px] sm:text-xs text-amber-300 font-extrabold shadow-sm">
              <span>🔥</span>
              <span>초등 2학년 수식 운석 낙하 중</span>
              <span className="animate-ping text-amber-400">☄️</span>
            </div>
          )}
        </div>

        {/* 중앙: 운석 낙하 트랙 영역 */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden">
          {/* 지면 방어선 레이저 라인 */}
          <div
            className="absolute left-4 right-4 bottom-2 h-1 rounded-full z-10"
            style={{
              background: 'linear-gradient(90deg, transparent, #f59e0b 20%, #f59e0b 80%, transparent)',
              boxShadow: '0 0 10px #f59e0b',
            }}
          >
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-black text-amber-400/80 tracking-widest uppercase">
              DEFENSE LINE
            </span>
          </div>

          {/* 고질라 아토믹 요격 포탑 */}
          <div className="absolute left-3 sm:left-6 bottom-1 z-30 flex items-center gap-1.5 pointer-events-none">
            <div
              className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl border-2 transition-all duration-300 ${
                isShootingBeam
                  ? 'bg-amber-500/30 border-amber-300 scale-110 shadow-[0_0_25px_#f59e0b]'
                  : 'bg-slate-900/90 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              }`}
            >
              <span className={`text-2xl select-none transition-transform ${isShootingBeam ? 'scale-125' : ''}`}>
                🦖
              </span>

              {isShootingBeam && (
                <>
                  <div className="absolute -inset-1 rounded-xl border-2 border-amber-400 animate-ping pointer-events-none" />
                  <div className="absolute -top-2.5 -right-1 text-yellow-300 text-xs font-black animate-bounce pointer-events-none">
                    ⚡
                  </div>
                </>
              )}

              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-[0_0_8px_#f59e0b]" />
            </div>

            <div className="hidden sm:flex flex-col text-[9px] font-black text-amber-300 select-none">
              <span className="leading-tight">MATH CANNON</span>
              <span className="text-[8px] text-slate-400 font-bold">
                {isShootingBeam ? '🔥 요격 발사 중!' : 'READY'}
              </span>
            </div>
          </div>

          {/* 고질라 대각선 아토믹 레이저 빔 */}
          {isShootingBeam && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-25 overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="mathBeamGrad" x1="0%" y1="100%" x2="50%" y2="0%">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#f59e0b" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </linearGradient>
                <filter id="mathBeamGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. 외부 오렌지 골드 네온 글로우 */}
              <line
                x1={12}
                y1={90}
                x2={50}
                y2={Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                stroke="#f59e0b"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.6"
                filter="url(#mathBeamGlow)"
              />

              {/* 2. 주 열선 레이저 */}
              <line
                x1={12}
                y1={90}
                x2={50}
                y2={Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                stroke="url(#mathBeamGrad)"
                strokeWidth="3.0"
                strokeLinecap="round"
                filter="url(#mathBeamGlow)"
              />

              {/* 3. 코어 화이트 고출력 빔 */}
              <line
                x1={12}
                y1={90}
                x2={50}
                y2={Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                stroke="#ffffff"
                strokeWidth="1.4"
                strokeLinecap="round"
              />

              {/* 4. 머즐 플래시 */}
              <circle cx={12} cy={90} r="3" fill="#ffffff" filter="url(#mathBeamGlow)" />
              <circle cx={12} cy={90} r="5.5" fill="#f59e0b" opacity="0.8" />

              {/* 5. 명중 임팩트 스파크 */}
              <circle
                cx={50}
                cy={Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                r="4"
                fill="#ffffff"
                filter="url(#mathBeamGlow)"
              />
              <circle
                cx={50}
                cy={Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                r="7"
                fill="#fde047"
                opacity="0.9"
              />
            </svg>
          )}

          {/* 낙하하는 수식 운석 (Meteor) */}
          {isStarted && phase !== 'WARNING' && phase !== 'VICTORY' && phase !== 'GAME_OVER' && (
            <div
              className={`absolute left-1/2 -translate-x-1/2 transition-transform duration-75 flex flex-col items-center pointer-events-none z-20 ${
                isExploding ? 'animate-ping opacity-0 scale-150 duration-300' : ''
              }`}
              style={{
                top: `${meteorProgress * 0.78}%`,
              }}
            >
              {/* 운석 불꽃 꼬리 */}
              <div
                className="w-4 h-10 -mb-2 rounded-full opacity-80 animate-pulse"
                style={{
                  background: 'linear-gradient(to bottom, transparent, #ea580c, #f59e0b)',
                  filter: 'blur(2px)',
                }}
              />

              {/* 운석 구체 본체 */}
              <div
                className={`relative px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl border-2 flex items-center gap-2 shadow-2xl transition-all ${
                  isShootingBeam
                    ? 'bg-amber-500/40 border-yellow-300 scale-110 shadow-[0_0_30px_#f59e0b]'
                    : meteorProgress > 70
                    ? 'bg-red-950/90 border-red-500 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                    : 'bg-slate-900/95 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                }`}
              >
                {/* 붉은 화염 이펙트 */}
                <div className="absolute -inset-1 rounded-2xl bg-amber-500/20 blur-sm pointer-events-none" />

                <span className="text-xl sm:text-2xl animate-bounce">☄️</span>

                <div className="flex flex-col items-center">
                  <span className="text-xl sm:text-3xl font-black text-yellow-300 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {currentProblem.question} = ?
                  </span>
                  <span className="text-[10px] text-amber-200/90 font-bold">
                    {currentProblem.readKr}
                  </span>
                </div>

                {/* TTS 낭독 다시 듣기 버튼 */}
                <button
                  type="button"
                  onClick={handleReplayTts}
                  title="수식 소리 다시 듣기"
                  className="pointer-events-auto p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/50 text-amber-300 cursor-pointer active:scale-90 transition-transform ml-1"
                >
                  <Volume2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 하단: 4지선다 숫자 보기 카드 */}
        <div className="flex-none p-2 sm:p-3 bg-slate-950/95 border-t border-amber-500/40 z-30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto">
            {currentProblem.options.map((choice, idx) => {
              const isWrong = selectedWrongChoices.includes(choice);
              const isEliminated = lives === 1 && eliminatedChoices.includes(choice);
              const isDisabled = !isStarted || isWrong || isEliminated || phase !== 'PLAYING' || isShootingBeam;

              return (
                <button
                  key={`${roundIndex}-${choice}-${idx}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectChoice(choice)}
                  className={`relative py-3 sm:py-4 px-2 rounded-xl font-black text-xl sm:text-2xl transition-all duration-150 border-2 shadow-lg flex items-center justify-center ${
                    !isStarted
                      ? 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-40 cursor-not-allowed'
                      : isEliminated
                      ? 'bg-slate-900/50 border-slate-800 text-slate-600 opacity-25 grayscale pointer-events-none line-through cursor-not-allowed scale-95'
                      : isWrong
                      ? 'bg-slate-900 border-red-500/40 text-red-500/40 opacity-40 cursor-not-allowed scale-95'
                      : 'bg-gradient-to-b from-slate-800 to-slate-900 hover:from-amber-950/50 hover:to-slate-800 border-amber-500/60 hover:border-amber-400 text-amber-300 hover:text-yellow-200 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer'
                  }`}
                >
                  <span className="drop-shadow-md">{choice}</span>
                  {isEliminated && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-red-400 bg-slate-950 px-1.5 py-0.5 rounded border border-red-900/60 shadow">
                      제외됨
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. VICTORY 승리 모달 & 바톤 터치 */}
      {phase === 'VICTORY' && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center text-center p-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-2 shadow-lg shadow-amber-500/40 animate-bounce">
            <Trophy className="text-yellow-400 w-9 h-9" />
          </div>

          {reviveCount === 0 ? (
            <div className="flex flex-col items-center">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-yellow-300 text-yellow-300 text-xs sm:text-sm font-black mb-1.5 shadow-sm animate-pulse">
                ⭐ 무결점 퍼펙트 요격! 보너스 EXP +20!
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 mb-1">
                퍼펙트 요격 클리어!
              </h2>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs sm:text-sm font-black mb-1.5 shadow-sm">
                🎉 끝까지 포기하지 않은 멋진 챔피언!
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-yellow-300 mb-1">
                산수 운석 요격 완주 성공!
              </h2>
            </div>
          )}

          <p className="text-xs sm:text-sm text-slate-300 mb-3 max-w-sm">
            {reviveCount === 0
              ? `STAGE ${stageNum}의 ${TOTAL_ROUNDS}개 수식 운석을 실수 없이 단숨에 모두 격파했습니다!`
              : `위기가 찾아와도 포기하지 않고 ${stageNum}스테이지 ${TOTAL_ROUNDS}문제를 끝까지 모두 풀어냈어요!`}
          </p>

          {/* 보상 정보 뱃지 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 text-xs sm:text-sm font-black flex items-center gap-1 shadow-sm">
              <Zap size={14} className="fill-cyan-400" />
              <span>EXP +{earnedExp} 획득</span>
            </span>
            {reviveCount === 0 && (
              <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-400 text-amber-300 text-xs font-black shadow-sm">
                🏆 퍼펙트 보너스 포함!
              </span>
            )}
            {isMecha && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 text-[11px] font-black">
                🤖 메카고질라 +20%
              </span>
            )}
          </div>

          {/* 바톤 터치 액션 버튼 */}
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {/* 언어 배틀이 아직 안 끝났다면: 바톤 터치 안내 버튼 */}
            {!isLanguageDoneToday && onGoToLanguage && (
              <button
                type="button"
                onClick={() => {
                  handleConfirmClear();
                  onGoToLanguage();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-cyan-300 cursor-pointer animate-pulse"
              >
                <span>⚡ 언어 배틀하러 가기! (1/2 완료)</span>
                <ArrowRight size={16} />
              </button>
            )}

            {/* 다음 산수 스테이지 또는 완료 버튼 */}
            <button
              type="button"
              onClick={() => {
                handleConfirmClear();
                if (onNextMathStage) onNextMathStage();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-yellow-200 cursor-pointer"
            >
              <span>⚔️ 다음 산수 스테이지 (STAGE {(stageNum % TOTAL_MATH_STAGES) + 1})</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. 고질라 긴급 부활 (이어하기) 모달 */}
      {phase === 'GAME_OVER' && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 animate-fadeIn">
          <div className="relative mb-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-amber-500/40 animate-pulse">
              🦖⚡
            </div>
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] border border-red-300 shadow">
              HP 0
            </div>
          </div>

          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-black mb-2 shadow-sm">
            <span>⚡ 긴급 부활 지원</span>
            <span>·</span>
            <span>{roundIndex + 1}번 문제부터 이어서 풀기</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 mb-1">
            ⚡ 고질라에게 다시 힘을 줄까요?
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/90 font-bold mb-1">
            포기하지 마! 고질라가 다시 일어날 수 있어!
          </p>
          <p className="text-[11px] sm:text-xs text-slate-300 mb-5 max-w-xs leading-relaxed">
            하트를 <strong className="text-red-400 font-extrabold">2개 회복</strong>하고 현재 <strong className="text-yellow-300 font-extrabold">{roundIndex + 1}번 문제</strong>부터 바로 이어서 도전합니다!
          </p>

          <div className="flex flex-col gap-2.5 w-full max-w-xs">
            <button
              type="button"
              onClick={handleReviveAndContinue}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-sm sm:text-base border-2 border-yellow-200 shadow-xl shadow-amber-500/40 cursor-pointer flex items-center justify-center gap-2 animate-bounce"
            >
              <span>🔥 에너지 충전하고 이어하기!</span>
            </button>

            <button
              type="button"
              onClick={handleRestart}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>처음 1번 문제부터 다시 도전</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
