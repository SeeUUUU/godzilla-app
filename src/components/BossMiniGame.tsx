import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, ShieldAlert, Heart, Trophy, RotateCcw, Zap, ArrowRight, Flame } from 'lucide-react';
import type { WordItem } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import {
  playLaserPewPew,
  playMeteorExplosionSound,
  playWarningSirenSound,
  playErrorBuzzer,
  playVictoryFanfare,
  playCardTapSound,
} from '../utils/soundEffects';

interface BossMiniGameProps {
  stageNum: number;
  stageWords: WordItem[];
  allWords: WordItem[];
  level: number;
  equippedPartnerId?: string | null;
  onClear: (bonusExp: number, bonusEggs: number) => void;
  onWrongWord?: (word: WordItem) => void;
  onPartnerNotice?: (message: string, icon: string) => void;
  onFail?: () => void;
  onGoToMath?: () => void;
  isMathDoneToday?: boolean;
}

type GamePhase = 'WARNING' | 'PLAYING' | 'INTERCEPTING' | 'IMPACT' | 'VICTORY' | 'GAME_OVER';

interface MeteorRoundData {
  targetWord: WordItem;
  questionLang: 'en' | 'ja';
  questionText: string;
  subText?: string;
  correctAnswer: string;
  choices: string[];
}

const TOTAL_ROUNDS = 5;
const FALL_DURATION_MS = 7500; // 7.5초 (초등 2학년 맞춤 충분한 여유 시간)

export const BossMiniGame: React.FC<BossMiniGameProps> = ({
  stageNum,
  stageWords,
  allWords,
  level: _level,
  equippedPartnerId,
  onClear,
  onWrongWord,
  onPartnerNotice,
  onGoToMath,
  isMathDoneToday = false,
}) => {
  const { speak, cancel } = useSpeech();

  const [phase, setPhase] = useState<GamePhase>('WARNING');
  const [roundIndex, setRoundIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [mothraShieldActive, setMothraShieldActive] = useState(() => equippedPartnerId === 'mothra');
  const hasUsedMothraShieldRef = useRef(false);
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

  // 1. 유효 단어 목록 구성 (최소 5개 확보)
  const poolWords = useMemo<WordItem[]>(() => {
    const combined = [...stageWords];
    for (const w of allWords) {
      if (!combined.some((item) => item.id === w.id)) {
        combined.push(w);
      }
    }
    return combined.length >= 5 ? combined : allWords;
  }, [stageWords, allWords]);

  // 2. 5개 라운드 문제 데이터 사전 생성
  const roundsData = useMemo<MeteorRoundData[]>(() => {
    const list: MeteorRoundData[] = [];
    const usedIds = new Set<string | number>();

    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      // 중복 최소화하여 문제 단어 선정
      let target = poolWords.find((w) => !usedIds.has(w.id));
      if (!target) target = poolWords[i % poolWords.length];
      usedIds.add(target.id);

      // 영어(en)와 일본어(ja) 번갈아 출제
      const questionLang: 'en' | 'ja' = i % 2 === 0 ? 'en' : 'ja';
      const questionText = questionLang === 'en' ? target.en : target.ja;
      const subText = questionLang === 'ja' && target.jaKana ? target.jaKana : undefined;
      const correctAnswer = target.ko;

      // 오답 보기 3개 무작위 추출
      const distractors = poolWords
        .filter((w) => w.id !== target!.id && w.ko !== correctAnswer)
        .map((w) => w.ko)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // 4개 보기 셔플
      const choices = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

      list.push({
        targetWord: target,
        questionLang,
        questionText,
        subText,
        correctAnswer,
        choices,
      });
    }
    return list;
  }, [poolWords]);

  const currentRound = roundsData[roundIndex] || roundsData[0];

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
    cancel();
  }, [cancel]);

  // 3. 운석 낙하 애니메이션 시작
  const startMeteorFall = useCallback(() => {
    clearAllTimers();
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
        // 운석 지면 충돌 (타임아웃)
        handleImpact();
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [clearAllTimers]);

  // 4. 지면 충돌 처리 (시간 초과)
  const handleImpact = useCallback(() => {
    clearAllTimers();
    setIsImpactShaking(true);
    setPhase('IMPACT');
    playMeteorExplosionSound();

    if (currentRound?.targetWord) {
      onWrongWord?.(currentRound.targetWord);
    }

    if (mothraShieldActive) {
      hasUsedMothraShieldRef.current = true;
      setMothraShieldActive(false);
      onPartnerNotice?.('모스라의 수호의 날개! 운석 충돌 1회 무료 방어!', '🛡️');
      nextRoundTimerRef.current = window.setTimeout(() => {
        setRoundIndex((curr) => (curr + 1 < TOTAL_ROUNDS ? curr + 1 : curr));
        setPhase('PLAYING');
        startMeteorFall();
      }, 1500);
      return;
    }

    setLives((prev) => {
      const nextLives = Math.max(0, prev - 1);
      if (nextLives <= 0) {
        // 게임 오버
        nextRoundTimerRef.current = window.setTimeout(() => {
          setPhase('GAME_OVER');
        }, 1200);
      } else {
        // 다음 운석 준비
        nextRoundTimerRef.current = window.setTimeout(() => {
          setRoundIndex((curr) => (curr + 1 < TOTAL_ROUNDS ? curr + 1 : curr));
          setPhase('PLAYING');
          startMeteorFall();
        }, 1500);
      }
      return nextLives;
    });
  }, [clearAllTimers, currentRound, mothraShieldActive, onPartnerNotice, onWrongWord, startMeteorFall]);

  // 5. 보기 선택 처리 (정답 / 오답)
  const handleSelectChoice = useCallback(
    (choice: string) => {
      if (phase !== 'PLAYING' || isShootingBeam || isExploding) return;

      playCardTapSound();

      if (choice === currentRound.correctAnswer) {
        // [정답] 고질라 대각선 아토믹 레이저 빔 발사 & 운석 공중 요격 폭발
        clearAllTimers();
        setPhase('INTERCEPTING');
        setIsShootingBeam(true);
        playLaserPewPew();

        // 0.25초 후 운석 요격 명중 폭발
        timeoutTimerRef.current = window.setTimeout(() => {
          setIsExploding(true);
          playMeteorExplosionSound();

          // 폭죽 파티클 (운석 명중 위치)
          confetti({
            particleCount: 65,
            spread: 90,
            origin: { x: 0.5, y: Math.min(0.7, Math.max(0.15, (meteorProgress * 0.78) / 100)) },
            colors: ['#f59e0b', '#ef4444', '#38bdf8', '#ffffff', '#fde047'],
          });

          // TTS 단어 발음
          if (currentRound.questionLang === 'en') {
            speak(currentRound.targetWord.en, 'en-US');
          } else {
            speak(currentRound.targetWord.jaKana || currentRound.targetWord.ja, 'ja-JP');
          }

          // 발사 0.35초 후 레이저 빔 자연스럽게 소멸 (발사 여운 유지)
          window.setTimeout(() => {
            setIsShootingBeam(false);
          }, 350);

          // 다음 라운드 진행 또는 클리어 판정
          nextRoundTimerRef.current = window.setTimeout(() => {
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
              startMeteorFall();
            }
          }, 1100);
        }, 250);
      } else {
        // [오답] 진동 & 체력 감소 & 오답노트 수집
        playErrorBuzzer();
        setSelectedWrongChoices((prev) => [...prev, choice]);
        setIsImpactShaking(true);
        window.setTimeout(() => setIsImpactShaking(false), 400);

        if (currentRound?.targetWord) {
          onWrongWord?.(currentRound.targetWord);
        }

        if (mothraShieldActive) {
          hasUsedMothraShieldRef.current = true;
          setMothraShieldActive(false);
          onPartnerNotice?.('모스라의 수호의 날개! 오답 1회 무료 방어!', '🛡️');
          return;
        }

        setLives((prev) => {
          const nextLives = Math.max(0, prev - 1);
          if (nextLives <= 0) {
            clearAllTimers();
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
      currentRound,
      clearAllTimers,
      roundIndex,
      startMeteorFall,
      speak,
      mothraShieldActive,
      onPartnerNotice,
      onWrongWord,
    ]
  );

  // 6. 경고 연출 후 자동 게임 시작
  useEffect(() => {
    playWarningSirenSound();
    warningTimerRef.current = window.setTimeout(() => {
      setPhase('PLAYING');
      startMeteorFall();
    }, 2000);

    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers, startMeteorFall]);

  // 7. 다시 시작하기 (부활 / 재도전)
  const handleRestart = () => {
    clearAllTimers();
    setLives(3);
    setRoundIndex(0);
    setPhase('PLAYING');
    setMothraShieldActive(equippedPartnerId === 'mothra');
    hasUsedMothraShieldRef.current = false;
    startMeteorFall();
  };

  // 8. 클리어 확인 버튼 클릭 (다음 스테이지로 복귀)
  const handleConfirmClear = () => {
    clearAllTimers();
    const isMecha = equippedPartnerId === 'mechagodzilla';
    const bonusExp = isMecha ? 90 : 75; // 메카고질라 20% 보너스
    const isBurning = equippedPartnerId === 'burning-godzilla';
    const bonusEggs = isBurning ? 2 : 1; // 버닝고질라 알 +1 추가
    onClear(bonusExp, bonusEggs);
  };

  return (
    <div
      className={`relative w-full flex-1 min-h-0 h-full flex flex-col rounded-2xl overflow-hidden bg-slate-950 border-2 border-red-500/60 shadow-2xl ${
        isImpactShaking ? 'animate-screen-shake' : ''
      }`}
      style={{
        boxShadow: '0 0 35px rgba(239, 68, 68, 0.4), inset 0 0 30px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* 1. 상단 보스 HUD 배너 */}
      <div className="flex-none flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-red-500/40 z-20">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white font-black text-[10px] sm:text-xs tracking-wider animate-pulse flex items-center gap-1">
            <ShieldAlert size={13} />
            STAGE {stageNum} BOSS
          </span>
          <span className="text-white font-extrabold text-xs sm:text-sm truncate">
            단어 운석 요격 디펜스
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
          {equippedPartnerId === 'burning-godzilla' && (
            <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500 text-red-300 text-[10px] font-black flex items-center gap-1 shadow-sm">
              <span>🔥</span>
              <span>알 +1 추가</span>
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

      {/* 2. WARNING 인트로 연출 오버레이 */}
      {phase === 'WARNING' && (
        <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col items-center justify-center text-center p-4">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-red-500/50 animate-bounce">
            ⚠️
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-red-500 tracking-wider mb-2 animate-pulse">
            WARNING! 보스 출현!
          </h2>
          <p className="text-sm sm:text-base font-bold text-amber-300 mb-1">
            👑 킹 기도라가 단어 운석을 소환했습니다!
          </p>
          <p className="text-xs sm:text-sm text-slate-300 mb-4 max-w-sm">
            낙하하는 운석의 뜻에 맞는 한국어 단어를 골라 고질라의 열선으로 요격하세요!
          </p>
          <button
            type="button"
            onClick={() => {
              clearAllTimers();
              setPhase('PLAYING');
              startMeteorFall();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:brightness-110 active:scale-95 text-white font-black text-sm border border-yellow-300 shadow-xl cursor-pointer"
          >
            ⚔️ 요격 전투 개시!
          </button>
        </div>
      )}

      {/* 3. 메인 배틀 아레나 (상단: 우주 하늘 & 운석 낙하, 하단: 선택 보기) */}
      <div className="flex-1 min-h-0 relative flex flex-col justify-between overflow-hidden">
        {/* 하늘 배경 & 그리드 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 50% 20%, rgba(239, 68, 68, 0.25) 0%, rgba(15, 23, 42, 0.95) 75%)',
          }}
        />

        {/* 상단: 킹 기도라 소환사 실루엣 */}
        <div className="relative z-10 w-full flex items-center justify-center pt-1 flex-none">
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-[10px] sm:text-xs text-amber-300 font-extrabold shadow-sm">
            <span>👑</span>
            <span>킹 기도라 단어 운석 소환 중</span>
            <span className="animate-ping text-red-400">☄️</span>
          </div>
        </div>

        {/* 중앙: 운석 낙하 트랙 영역 */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden">
          {/* 지면 방어선 레이저 라인 */}
          <div
            className="absolute left-4 right-4 bottom-2 h-1 rounded-full z-10"
            style={{
              background: 'linear-gradient(90deg, transparent, #ef4444 20%, #ef4444 80%, transparent)',
              boxShadow: '0 0 10px #ef4444',
            }}
          >
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-black text-red-400/80 tracking-widest uppercase">
              DEFENSE LINE
            </span>
          </div>

          {/* 고질라 아토믹 요격 포탑 (Defense Turret / Godzilla Cannon) */}
          <div className="absolute left-3 sm:left-6 bottom-1 z-30 flex items-center gap-1.5 pointer-events-none">
            <div
              className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl border-2 transition-all duration-300 ${
                isShootingBeam
                  ? 'bg-cyan-500/30 border-cyan-300 scale-110 shadow-[0_0_25px_#00f2ff]'
                  : 'bg-slate-900/90 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              }`}
            >
              {/* 고질라 발사대 아이콘 */}
              <span className={`text-2xl select-none transition-transform ${isShootingBeam ? 'scale-125' : ''}`}>
                🦖
              </span>

              {/* 발사 시 머즐 플래시 네온 링 */}
              {isShootingBeam && (
                <>
                  <div className="absolute -inset-1 rounded-xl border-2 border-cyan-400 animate-ping pointer-events-none" />
                  <div className="absolute -top-2.5 -right-1 text-yellow-300 text-xs font-black animate-bounce pointer-events-none">
                    ⚡
                  </div>
                </>
              )}

              {/* 포탑 네온 레디 램프 */}
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white shadow-[0_0_8px_#00f2ff]" />
            </div>

            <div className="hidden sm:flex flex-col text-[9px] font-black text-cyan-300 select-none">
              <span className="leading-tight">ATOMIC CANNON</span>
              <span className="text-[8px] text-slate-400 font-bold">
                {isShootingBeam ? '🔥 요격 발사 중!' : 'READY'}
              </span>
            </div>
          </div>

          {/* 고질라 대각선 아토믹 레이저 빔 (발사대 -> 운석 실시간 위치) */}
          {isShootingBeam && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-25 overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="beamGrad" x1="0%" y1="100%" x2="50%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#38bdf8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </linearGradient>
                <filter id="beamGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. 외부 아토믹 블루 네온 글로우 */}
              <line
                x1={12}
                y1={90}
                x2={50}
                y2={Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                stroke="#00f2ff"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.5"
                filter="url(#beamGlow)"
              />

              {/* 2. 주 열선 레이저 (사이언 블루 그라데이션) */}
              <line
                x1={12}
                y1={90}
                x2={50}
                y2={Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                stroke="url(#beamGrad)"
                strokeWidth="2.8"
                strokeLinecap="round"
                filter="url(#beamGlow)"
              />

              {/* 3. 코어 화이트 고출력 레이저 빔 */}
              <line
                x1={12}
                y1={90}
                x2={50}
                y2={Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                stroke="#ffffff"
                strokeWidth="1.3"
                strokeLinecap="round"
              />

              {/* 4. 발사구 머즐 플래시 */}
              <circle cx={12} cy={90} r="3" fill="#ffffff" filter="url(#beamGlow)" />
              <circle cx={12} cy={90} r="5.5" fill="#38bdf8" opacity="0.75" />

              {/* 5. 운석 명중 임팩트 스파크 */}
              <circle
                cx={50}
                cy={Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                r="4"
                fill="#ffffff"
                filter="url(#beamGlow)"
              />
              <circle
                cx={50}
                cy={Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                r="7"
                fill="#facc15"
                opacity="0.85"
              />
            </svg>
          )}

          {/* 낙하하는 단어 운석 (Meteor) */}
          {phase !== 'WARNING' && phase !== 'VICTORY' && phase !== 'GAME_OVER' && (
            <div
              className={`absolute left-1/2 -translate-x-1/2 transition-all ease-linear z-30 ${
                isExploding ? 'scale-150 opacity-0 duration-300' : 'duration-100'
              }`}
              style={{
                top: `${Math.min(78, Math.max(5, meteorProgress * 0.78))}%`,
              }}
            >
              {isExploding ? (
                // 폭발 이펙트
                <div className="text-4xl sm:text-5xl animate-ping">💥✨</div>
              ) : (
                // 단어 운석 본체
                <div
                  className="relative flex flex-col items-center group cursor-pointer"
                  onClick={() => {
                    // 운석 클릭 시 발음 힌트 재생
                    if (currentRound.questionLang === 'en') {
                      speak(currentRound.targetWord.en, 'en-US');
                    } else {
                      speak(currentRound.targetWord.jaKana || currentRound.targetWord.ja, 'ja-JP');
                    }
                  }}
                  title="터치하여 발음 듣기"
                >
                  {/* 운석 상단 불꽃 화염 */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center justify-center text-red-500 animate-bounce">
                    <Flame size={26} className="text-amber-400 fill-orange-500" />
                  </div>

                  {/* 운석 단어 캡슐 */}
                  <div
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-2 border-amber-400 text-white shadow-2xl shadow-red-500/50"
                    style={{
                      boxShadow: '0 0 25px rgba(245, 158, 11, 0.7), inset 0 0 15px rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    <span className="text-base sm:text-lg">
                      {currentRound.questionLang === 'en' ? '🇺🇸' : '🇯🇵'}
                    </span>
                    <div className="flex flex-col items-start">
                      <span className="font-black text-base sm:text-lg md:text-xl text-yellow-300 tracking-tight leading-tight">
                        {currentRound.questionText}
                      </span>
                      {currentRound.subText && (
                        <span className="text-[10px] sm:text-xs text-slate-300 font-bold leading-none">
                          [{currentRound.subText}]
                        </span>
                      )}
                    </div>
                    {/* 발음 힌트 스피커 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentRound.questionLang === 'en') {
                          speak(currentRound.targetWord.en, 'en-US');
                        } else {
                          speak(currentRound.targetWord.jaKana || currentRound.targetWord.ja, 'ja-JP');
                        }
                      }}
                      className="ml-1 p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 transition-colors"
                      title="발음 듣기"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  {/* 낙하 잔여 시간 프로그레스 미니 바 */}
                  <div className="w-24 h-1.5 bg-slate-900 rounded-full mt-1 overflow-hidden border border-white/20">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-100"
                      style={{ width: `${Math.min(100, meteorProgress)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. 하단 한국어 4지선다 객관식 카드 선택 영역 */}
        <div className="relative z-20 flex-none px-2 sm:px-3 pb-2 pt-1 bg-slate-900/95 border-t border-white/10 backdrop-blur-md">
          <div className="text-center mb-1">
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-300">
              👇 운석의 올바른 한국어 뜻을 맞춰 요격하세요!
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 max-w-xl mx-auto">
            {currentRound.choices.map((choice, idx) => {
              const isWrong = selectedWrongChoices.includes(choice);
              const isCorrectIntercept =
                phase === 'INTERCEPTING' && choice === currentRound.correctAnswer;

              return (
                <button
                  key={`${choice}-${idx}`}
                  type="button"
                  disabled={isWrong || phase !== 'PLAYING'}
                  onClick={() => handleSelectChoice(choice)}
                  className={`relative flex items-center justify-center px-2 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm md:text-base font-black transition-all cursor-pointer ${
                    isCorrectIntercept
                      ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white scale-102 border-2 border-green-300 shadow-lg shadow-green-500/50'
                      : isWrong
                      ? 'bg-slate-800/50 text-slate-500 border border-slate-700/50 line-through opacity-40 cursor-not-allowed'
                      : 'bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 active:scale-95 text-white border border-slate-700 shadow-md hover:border-amber-400/80 hover:text-amber-300'
                  }`}
                >
                  <span className="truncate">{choice}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. VICTORY 클리어 모달 오버레이 */}
      {phase === 'VICTORY' && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center text-center p-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-2 shadow-xl shadow-amber-500/50 animate-bounce">
            <Trophy className="w-9 h-9 text-amber-400" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-amber-300 mb-1">
            STAGE CLEAR! 보스 완전 격파!
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-200 mb-3 max-w-sm">
            단어 운석 5개를 완벽하게 요격하여 킹 기도라의 공습을 물리쳤습니다!
          </p>

          {/* 보상 카드 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-400/40 mb-2 shadow-inner">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-cyan-300">
              <Zap size={16} className="text-cyan-400 fill-cyan-400" />
              <span>
                {equippedPartnerId === 'mechagodzilla'
                  ? '보너스 EXP +90 (메카고질라 +20%)'
                  : '보너스 EXP +75 (1.5배)'}
              </span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-slate-700" />
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-300">
              <span className="text-base sm:text-lg animate-bounce">🥚</span>
              <span>
                {equippedPartnerId === 'burning-godzilla'
                  ? '괴수 알 +2개 (버닝 고질라 +1 보너스!)'
                  : '신비한 괴수 알 +1개 획득!'}
              </span>
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-amber-200/90 font-bold mb-4">
            알을 모아 부화기에서 새로운 괴수를 깨워보세요!
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            {!isMathDoneToday && onGoToMath && (
              <button
                type="button"
                onClick={() => {
                  handleConfirmClear();
                  onGoToMath();
                }}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm border border-yellow-200 shadow-xl cursor-pointer animate-pulse"
              >
                <span>🔥 산수 에너지 충전하러 가기! (1/2 완료)</span>
                <ArrowRight size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirmClear}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:brightness-110 active:scale-95 text-white font-black text-xs sm:text-sm border border-emerald-300 shadow-xl cursor-pointer"
            >
              <span>다음 스테이지로 이동</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 6. GAME OVER 패배 모달 오버레이 */}
      {phase === 'GAME_OVER' && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center text-center p-4 animate-fadeIn">
          <div className="text-4xl mb-2 animate-pulse">⚡💔</div>
          <h2 className="text-xl sm:text-2xl font-black text-red-400 mb-1">
            방어선 돌파!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mb-4 max-w-xs">
            고질라의 에너지가 소진되었습니다. 다시 한번 힘을 내어 도전할까요?
          </p>
          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm border border-white shadow-xl cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>에너지 재충전 후 다시 도전</span>
          </button>
        </div>
      )}
    </div>
  );
};
