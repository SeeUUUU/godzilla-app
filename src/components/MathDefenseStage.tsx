import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Heart, Trophy, RotateCcw, Zap, ArrowRight, Calculator, Flame, Crown, Search, Award, Sparkles } from 'lucide-react';
import type { MathProblemItem } from '../types';
import { getGodzillaEvolution, getGodzillaAura } from '../types';
import {
  getMathProblemsForStage,
  TOTAL_MATH_STAGES,
  PROBLEMS_PER_MATH_STAGE,
  getChildName,
  readSino,
  readEnglish,
  readJapanese,
  getMathQuickTip,
  getProblemHintFormula,
} from '../data/mathData';
import { recordMathAttempt } from '../data/learningAnalytics';
import { useSpeech } from '../hooks/useSpeech';
import { MathBlockHintModal } from './MathBlockHintModal';
import { AtomicHangarModal } from './AtomicHangarModal';
import {
  evaluateStageClearRewards,
  getEquippedGear,
  ATOMIC_PARTS,
  ATOMIC_TITLES,
  type EquippedAtomicGear,
  type ClearRewardResult,
} from '../data/atomicPartsData';
import {
  playLaserPewPew,
  playFeverBeamSound,
  playComboSound,
  playCriticalRoarSound,
  playPerfectAtomicRoarSound,
  playMeteorExplosionSound,
  playWarningSirenSound,
  playErrorBuzzer,
  playVictoryFanfare,
  playCardTapSound,
  playBaseDamageSound,
} from '../utils/soundEffects';

interface MathDefenseStageProps {
  stageNum: number; // 1 ~ 12
  level?: number;
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
const FALL_DURATION_MS = 14000; // 14초 (초등 2학년 두 자리 수 암산 및 TTS 청취 시간 넉넉히 확보)

// 괴수별 이모지 매핑
const MONSTER_EMOJIS: Record<string, string> = {
  '고질라': '🦖',
  '모스라': '🦋',
  '메카고질라': '🤖',
  '킹기도라': '⚡',
  '라돈': '🦅',
  '치비고질라': '🦖',
};

// 서술형 지문 강조: 아이 이름(시우), 고질라 캐릭터, 숫자+단위 및 핵심 연산 조건어
const renderHighlightedText = (text: string, currentChildName = '시우'): React.ReactNode => {
  const safeName = currentChildName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `(${safeName}(?: 대장|네)?|고질라|모스라|메카고질라|킹기도라|라돈|치비고질라|\\d+\\s?(?:개|장|명|권|쪽|번|자루|cm|원|마리|송이|대|발|세트)|남은|남아|모두|더 많이|더 적게|더 많|더 적|내렸|탔|더 넣|더 땄|더 왔|더 받|먹었|주었|팔았|사용|읽었|꺼냈|배치)`,
    'g'
  );

  return text.split(regex).map((part, i) => {
    if (i % 2 === 0) {
      return <React.Fragment key={i}>{part}</React.Fragment>;
    }

    // 1) 아이 이름 매칭 (시우, 시우 대장, 시우네 등)
    if (part.startsWith(currentChildName)) {
      return (
        <span
          key={i}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md bg-cyan-950/90 border border-cyan-400 text-cyan-200 font-black shadow-[0_0_12px_rgba(6,182,212,0.6)] animate-pulse"
        >
          <span className="text-yellow-300">⭐</span>
          <span>{part}</span>
        </span>
      );
    }

    // 2) 괴수 캐릭터 매칭 (고질라, 모스라, 메카고질라 등)
    if (MONSTER_EMOJIS[part]) {
      return (
        <span
          key={i}
          className="inline-flex items-center gap-0.5 px-1 py-0.5 mx-0.5 rounded-md bg-amber-950/80 border border-amber-500/60 text-amber-300 font-extrabold shadow-sm"
        >
          <span>{MONSTER_EMOJIS[part]}</span>
          <span>{part}</span>
        </span>
      );
    }

    // 3) 숫자+단위 또는 핵심 연산 조건어
    return (
      <span
        key={i}
        className="text-yellow-300 font-bold underline decoration-yellow-400/50 decoration-2 underline-offset-2"
      >
        {part}
      </span>
    );
  });
};

export const MathDefenseStage: React.FC<MathDefenseStageProps> = ({
  stageNum,
  level = 1,
  equippedPartnerId,
  onClear,
  onPartnerNotice,
  onGoToLanguage,
  isLanguageDoneToday = false,
  onNextMathStage,
}) => {
  // 언어 배틀 고질라 성장 레벨 및 진화 형태 연동
  const godzillaEvo = useMemo(() => getGodzillaEvolution(level), [level]);
  const godzillaAura = useMemo(() => getGodzillaAura(level), [level]);

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

  // 방어선 충돌 및 피격 연출 상태
  const [isRedFlash, setIsRedFlash] = useState(false);
  const [damagedHeartIdx, setDamagedHeartIdx] = useState<number | null>(null);
  const [defenseDamageAlert, setDefenseDamageAlert] = useState<string | null>(null);

  // 🔢 산수 피격 시 '1초 연산 풀이 팁' 즉시 노출 상태 및 타이머
  const [mathQuickTip, setMathQuickTip] = useState<string | null>(null);
  const mathQuickTipTimerRef = useRef<number | null>(null);

  // 🧠 실시간 적응형 난이도 엔진 (Adaptive ZPD: 10초 ~ 18초 동적 낙하 속도 & 징검다리 힌트)
  const [adaptiveFallDurationMs, setAdaptiveFallDurationMs] = useState<number>(FALL_DURATION_MS);
  const adaptiveFallDurationRef = useRef<number>(FALL_DURATION_MS);
  const problemStartTimeRef = useRef<number>(performance.now());
  const recentPerfRef = useRef<Array<{ isCorrect: boolean; responseTimeMs: number }>>([]);
  const [consecutiveFailures, setConsecutiveFailures] = useState<number>(0);

  const updateAdaptiveZpd = useCallback((isCorrect: boolean, responseTimeMs: number) => {
    const clampedTime = Math.max(300, Math.min(25000, responseTimeMs));
    const nextHistory = [...recentPerfRef.current, { isCorrect, responseTimeMs: clampedTime }].slice(-4);
    recentPerfRef.current = nextHistory;

    if (isCorrect) {
      setConsecutiveFailures(0);
      const lastThree = nextHistory.slice(-3);
      const allThreeCorrect = lastThree.length === 3 && lastThree.every((r) => r.isCorrect);
      const avgResponseMs =
        lastThree.reduce((sum, r) => sum + r.responseTimeMs, 0) / Math.max(1, lastThree.length);

      setAdaptiveFallDurationMs((prev) => {
        let next = prev;
        if (allThreeCorrect && avgResponseMs <= 4500) {
          // 고속 요격 마스터 구간: 낙하 시간 1.5초 단축 (최소 10초)
          next = Math.max(10000, prev - 1500);
        } else if (clampedTime >= 9500) {
          // 정답이지만 시간이 오래 걸린 경우: 1초 여유 추가 (최대 18초)
          next = Math.min(18000, prev + 1000);
        } else if (prev > FALL_DURATION_MS && lastThree.filter((r) => r.isCorrect).length >= 2) {
          // 감속 상태에서 안정화되면 기본 속도(14초)로 서서히 복귀
          next = Math.max(FALL_DURATION_MS, prev - 1000);
        }
        adaptiveFallDurationRef.current = next;
        return next;
      });
    } else {
      setConsecutiveFailures((prev) => prev + 1);
      setAdaptiveFallDurationMs((prev) => {
        // 오답 또는 충돌 발생 시: 낙하 시간을 2초 늦추어 충분한 사고 시간 보장 (최대 18초)
        const next = Math.min(18000, prev + 2000);
        adaptiveFallDurationRef.current = next;
        return next;
      });
    }
  }, []);

  const animFrameRef = useRef<number | null>(null);
  const accumulatedElapsedRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const timeoutTimerRef = useRef<number | null>(null);
  const nextRoundTimerRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);
  const speechTimerRef = useRef<number | null>(null);
  const clockSpeechSafetyTimerRef = useRef<number | null>(null);
  const speechSessionRef = useRef<number>(0);
  const answerSpeechFallbackRef = useRef<number | null>(null);
  const transitionVersionRef = useRef(0);
  const lastSpokenProblemIdRef = useRef<string | null>(null);

  // 🕰️ 킹 기도라 시한폭탄: 문제 전부 말해주고 나서 낙하 시작하는 상태
  const [isClockReading, setIsClockReading] = useState(false);

  // 콤보 및 버닝 피버(Fever) 모드 상태
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  // 정답 맞춤 시 3개 국어(한국어·영어·일본어) 숫자 낭독 & 팝업 연출 상태
  const [solvedAnswerDisplay, setSolvedAnswerDisplay] = useState<{
    num: number | string;
    kr: string;
    en: string;
    ja: string;
  } | null>(null);
  const isFever = combo >= 3;

  // 아이 이름 상태 (기본값: '시우')
  const [childName] = useState(() => getChildName());
  // 수 모형 돋보기 힌트 모달 상태
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  // 아토믹 격납고 및 커스텀 장비 상태
  const [isHangarOpen, setIsHangarOpen] = useState(false);
  const [equippedGear, setEquippedGearState] = useState<EquippedAtomicGear>(() => getEquippedGear());
  const [newRewardResult, setNewRewardResult] = useState<ClearRewardResult | null>(null);

  // 현재 장착 중인 파츠 정보
  const equippedHead = ATOMIC_PARTS.find((p) => p.id === equippedGear.head);
  const equippedFin = ATOMIC_PARTS.find((p) => p.id === equippedGear.fin);
  const equippedWeapon = ATOMIC_PARTS.find((p) => p.id === equippedGear.weapon);
  const equippedTitle = ATOMIC_TITLES.find((t) => t.id === equippedGear.title) || ATOMIC_TITLES[0];

  const [gameSession, setGameSession] = useState(0);

  // 1. 해당 스테이지의 10문제 가져오기
  const stageProblems = useMemo<MathProblemItem[]>(() => {
    return getMathProblemsForStage(stageNum, childName, gameSession);
  }, [stageNum, gameSession, childName]);

  const currentProblem = stageProblems[roundIndex] || stageProblems[0];
  const isWordProblem = currentProblem?.isWordProblem === true;

  // 🪜 위기 시(오답 선택 또는 직전 연속 실패) 자동 개입하는 징검다리 분해 힌트(Stepping-Stone Scaffolding)
  const steppingStoneHint = useMemo<string | null>(() => {
    if (!currentProblem || currentProblem.clockQuestion) return null;
    if (selectedWrongChoices.length === 0 && consecutiveFailures < 1) return null;

    if (currentProblem.isMissingNumber) {
      return '🪜 징검다리 힌트: 결과 수와 알고 있는 수의 차이를 구해 빈칸(□)을 찾아보세요!';
    }

    const formula = getProblemHintFormula(currentProblem);
    if (!formula) return null;

    if (formula.c !== undefined && formula.op2) {
      const firstStep = formula.op === '+' ? formula.a + formula.b : formula.a - formula.b;
      return `🪜 징검다리 힌트: 앞의 두 수(${formula.a} ${formula.op} ${formula.b} = ${firstStep})를 먼저 계산한 뒤 ${formula.op2} ${formula.c}을(를) 해보세요!`;
    }

    const bTens = Math.floor(formula.b / 10) * 10;
    const bOnes = formula.b % 10;
    if (bTens > 0 && bOnes > 0) {
      const midVal = formula.op === '+' ? formula.a + bTens : formula.a - bTens;
      return `🪜 징검다리 힌트: ${formula.a} ${formula.op} ${bTens} = ${midVal} 먼저 하고, 이어서 ${formula.op} ${bOnes}을(를) 계산해 보세요!`;
    }

    return `🪜 징검다리 힌트: 일의 자리(${formula.a % 10} ${formula.op} ${formula.b % 10})부터 먼저 계산해 보세요!`;
  }, [currentProblem, selectedWrongChoices.length, consecutiveFailures]);

  // M10: 스테이지당 1회 황금 보너스 운석 라운드 (1~6 라운드 중 하나)
  const goldenRoundIndex = useMemo(() => {
    return ((gameSession * 5 + stageNum * 3) % 6) + 1;
  }, [gameSession, stageNum]);
  const isGoldenMeteor = !isWordProblem && roundIndex === goldenRoundIndex;

  // M3: 정답 크기에 비례한 운석 크기 스케일 (0.88 ~ 1.25)
  const meteorScale = useMemo(() => {
    if (isWordProblem) return 1;
    const rawAnswer =
      typeof currentProblem?.answer === 'number'
        ? currentProblem.answer
        : parseInt(String(currentProblem?.answer || '10'), 10) || 10;
    return Math.min(1.25, Math.max(0.88, 0.88 + (rawAnswer / 100) * 0.37));
  }, [isWordProblem, currentProblem]);

  // M3: 뺄셈 운석 여부 (수 분할/쪼개짐 시각화)
  const isSubtraction =
    !isWordProblem &&
    ((currentProblem?.question && currentProblem.question.includes('-')) ||
      currentProblem?.hintFormula?.op === '-');

  // 숫자/문자 혼용 보기를 문자열로 통일
  const currentOptions = useMemo<string[]>(
    () => (currentProblem ? currentProblem.options.map((opt) => String(opt)) : []),
    [currentProblem]
  );

  // 1-2. 위기 시(하트 1개) 50:50 정답 후보 압축: 오답 2개 안정적 제거
  const eliminatedChoices = useMemo<string[]>(() => {
    if (lives !== 1 || !currentProblem) return [];
    const wrongOptions = currentOptions.filter((opt) => opt !== String(currentProblem.answer));
    return wrongOptions.slice(0, 2);
  }, [lives, currentProblem, currentOptions]);

  const clearAllTimers = useCallback(() => {
    transitionVersionRef.current += 1;
    speechSessionRef.current += 1;
    setIsClockReading(false);
    if (clockSpeechSafetyTimerRef.current !== null) {
      window.clearTimeout(clockSpeechSafetyTimerRef.current);
      clockSpeechSafetyTimerRef.current = null;
    }
    if (answerSpeechFallbackRef.current !== null) {
      window.clearTimeout(answerSpeechFallbackRef.current);
      answerSpeechFallbackRef.current = null;
    }
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
    if (mathQuickTipTimerRef.current !== null) {
      window.clearTimeout(mathQuickTipTimerRef.current);
      mathQuickTipTimerRef.current = null;
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

  // 2-2. 방어선 충돌 및 피격 연출 (붉은 플래시 + 화면 쉐이크 + 충돌음 + 하트 펄스 + 플로팅 경고)
  const triggerDamageFeedback = useCallback((lostHeartIdx: number, message = '⚠️ 기지 방어막 손상! 하트 -1') => {
    setIsRedFlash(true);
    setIsImpactShaking(true);
    setDamagedHeartIdx(lostHeartIdx);
    setDefenseDamageAlert(message);
    playBaseDamageSound();

    window.setTimeout(() => setIsRedFlash(false), 350);
    window.setTimeout(() => setIsImpactShaking(false), 450);
    window.setTimeout(() => setDamagedHeartIdx(null), 1200);
    window.setTimeout(() => setDefenseDamageAlert(null), 1200);
  }, []);

  // 2-3. 🔢 산수 피격 및 오답 시 '1초 연산 풀이 팁' 즉시 노출 헬퍼 (선택한 오답 역추적 지원)
  const showQuickTip = useCallback(
    (problem?: MathProblemItem | null, selectedWrongChoice?: string | number) => {
      if (!problem) return;
      const tip = getMathQuickTip(problem, selectedWrongChoice);
      setMathQuickTip(tip);
      if (mathQuickTipTimerRef.current !== null) {
        window.clearTimeout(mathQuickTipTimerRef.current);
      }
      mathQuickTipTimerRef.current = window.setTimeout(() => {
        setMathQuickTip(null);
        mathQuickTipTimerRef.current = null;
      }, 4500);
    },
    []
  );

  // 3. 지면 방어선 충돌 처리 (시간 초과 운석 충돌)
  const handleImpact = useCallback(() => {
    // 서술형은 낙하 충돌/하트 감소 100% 비활성화
    if (isWordProblem) return;
    clearAllTimers();
    cancel();
    setPhase('IMPACT');
    playMeteorExplosionSound();
    setCombo(0);
    showQuickTip(currentProblem);
    if (currentProblem) {
      recordMathAttempt(currentProblem, false);
    }
    updateAdaptiveZpd(false, adaptiveFallDurationRef.current);

    if (mothraShieldActive) {
      setMothraShieldActive(false);
      onPartnerNotice?.('모스라의 수호 쉴드! 충돌 데미지 1회 무효화!', '🛡️');
      setIsImpactShaking(true);
      setDefenseDamageAlert('🦋 모스라 수호 쉴드! 충돌 1회 무효화!');
      window.setTimeout(() => setIsImpactShaking(false), 400);
      window.setTimeout(() => setDefenseDamageAlert(null), 1200);

      nextRoundTimerRef.current = window.setTimeout(() => {
        setIsImpactShaking(false);
        cancel();
        setRoundIndex((curr) => (curr + 1 < TOTAL_ROUNDS ? curr + 1 : curr));
        setPhase('PLAYING');
      }, 1400);
      return;
    }

    setLives((prev) => {
      triggerDamageFeedback(prev, '⚠️ 기지 방어막 손상! 하트 -1');
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
  }, [clearAllTimers, cancel, mothraShieldActive, onPartnerNotice, triggerDamageFeedback, isWordProblem, showQuickTip, currentProblem, updateAdaptiveZpd]);

  const isPageHiddenRef = useRef<boolean>(false);
  const hasSubmittedClearRef = useRef<boolean>(false);

  // 3-1. 화면 꺼짐, 탭 전환, 백그라운드 이동 시 루프 일시정지 및 복귀 시 Time-Delta 폭탄 방어
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        isPageHiddenRef.current = true;
        cancel();
      } else {
        isPageHiddenRef.current = false;
        lastTickTimeRef.current = performance.now();
      }
    };
    const handleBlur = () => {
      isPageHiddenRef.current = true;
    };
    const handleFocus = () => {
      isPageHiddenRef.current = false;
      lastTickTimeRef.current = performance.now();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [cancel]);

  // 3-2. 수 모형 힌트 모달 / 아토믹 격납고 오픈 시 게임 루프 일시 정지 (PAUSE) 처리
  useEffect(() => {
    const isPaused = isHintModalOpen || isHangarOpen;
    isPausedRef.current = isPaused;
    if (isPaused) {
      // 모달이 열리면 수식 TTS 즉시 정지 (소리 겹침 방지 및 집중 환경 제공)
      cancel();
    } else {
      // 모달을 닫고 게임으로 복귀할 때: 정지 동안 흐른 시간이 delta로 합산되지 않도록 기준 시점 리셋
      lastTickTimeRef.current = performance.now();
    }
  }, [isHintModalOpen, isHangarOpen, cancel]);

  // 4. 운석 낙하 애니메이션 루프 시작 (일시정지 및 실시간 적응형 ZPD 낙하 속도 지원)
  const startMeteorFall = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setMeteorProgress(0);
    accumulatedElapsedRef.current = 0;
    const now = performance.now();
    lastTickTimeRef.current = now;
    problemStartTimeRef.current = now;
    setSelectedWrongChoices([]);
    setIsShootingBeam(false);
    setIsExploding(false);
    setIsImpactShaking(false);

    // 서술형 문제: 낙하 루프/타이머 없이 상단에 고정 (시간제한 및 충돌 없음)
    if (isWordProblem) {
      return;
    }

    // 🕰️ 킹 기도라의 시한폭탄(시계 문제): 최소 16초 이상 보장, 일반 문제는 실시간 적응형 ZPD 속도(10초~18초) 적용
    const isClock = Boolean(currentProblem?.clockQuestion);
    const fallDuration = isClock
      ? Math.max(16000, adaptiveFallDurationRef.current)
      : adaptiveFallDurationRef.current;

    const loop = (time: number) => {
      // 모달(수모형 / 격납고)이 열려있거나 화면이 백그라운드 상태면 일시정지 유지 (운석 고정 & 시간 정지)
      if (isPausedRef.current || isPageHiddenRef.current || document.visibilityState === 'hidden') {
        lastTickTimeRef.current = time; // 정지 중 흐른 시간을 스킵
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const rawDelta = lastTickTimeRef.current > 0 ? time - lastTickTimeRef.current : 0;
      const delta = Math.min(Math.max(0, rawDelta), 100);
      lastTickTimeRef.current = time;
      accumulatedElapsedRef.current += delta;

      const progress = Math.min(100, (accumulatedElapsedRef.current / fallDuration) * 100);
      setMeteorProgress(progress);

      if (progress < 100) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        handleImpact();
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [handleImpact, isWordProblem, currentProblem]);

  // 5. 문제 시작 및 변경 시: 운석 낙하 & TTS 낭독 연계 제어 (isStarted가 true이고 PLAYING일 때만)
  useEffect(() => {
    if (!isStarted || phase !== 'PLAYING' || !currentProblem || !currentProblem.id) {
      return;
    }

    const currentSession = ++speechSessionRef.current;

    // 문제가 실제로 바뀌었을 때만 초기화 및 안내 실행
    if (lastSpokenProblemIdRef.current !== currentProblem.id) {
      lastSpokenProblemIdRef.current = currentProblem.id;

      // 보스 운석 라운드(서술형) 진입 시 긴장감 넘치는 보스 출현 경고음!
      if (isWordProblem) {
        playCriticalRoarSound();
      }

      // 이전 TTS 및 힌트 모달 정리
      cancel();
      setIsHintModalOpen(false);

      if (speechTimerRef.current !== null) {
        window.clearTimeout(speechTimerRef.current);
        speechTimerRef.current = null;
      }
      if (clockSpeechSafetyTimerRef.current !== null) {
        window.clearTimeout(clockSpeechSafetyTimerRef.current);
        clockSpeechSafetyTimerRef.current = null;
      }

      const isClock = Boolean(currentProblem.clockQuestion);

      // 📖 문제 카드 즉시 노출: 이전 라운드의 폭발/빔 연출 상태를 음성 시작 전에 즉시 해제
      // (이전에는 startMeteorFall()에서만 리셋되어, 시한폭탄 문제는 TTS가 끝날 때까지 카드가 opacity-0으로 숨겨져 있었음)
      setIsExploding(false);
      setIsShootingBeam(false);
      setIsImpactShaking(false);
      setSelectedWrongChoices([]);
      setSolvedAnswerDisplay(null);
      setMeteorProgress(0);

      if (isClock) {
        // 🕰️ 킹 기도라의 시한폭탄: TTS가 문제를 전부 낭독할 때까지 낙하하지 않고 대기!
        setIsClockReading(true);
        setMeteorProgress(0);

        // 음성 낭독 시작 및 완료 콜백 처리
        speechTimerRef.current = window.setTimeout(() => {
          if (speechSessionRef.current !== currentSession) return;

          // TTS 완료 시 낙하 시작하는 함수
          const beginFallAfterSpeech = () => {
            if (speechSessionRef.current !== currentSession) return;
            if (clockSpeechSafetyTimerRef.current !== null) {
              window.clearTimeout(clockSpeechSafetyTimerRef.current);
              clockSpeechSafetyTimerRef.current = null;
            }
            setIsClockReading(false);
            // 듣기가 끝난 후 약 350ms의 자연스러운 버퍼를 두고 시한폭탄 낙하 시작
            window.setTimeout(() => {
              if (speechSessionRef.current === currentSession) {
                startMeteorFall();
              }
            }, 350);
          };

          // 안전장치: 혹시 브라우저 TTS 이벤트가 유실되더라도 최대 6.5초 후에는 낙하 시작
          clockSpeechSafetyTimerRef.current = window.setTimeout(() => {
            beginFallAfterSpeech();
          }, 6500);

          speak(currentProblem.readKr, 'ko-KR')
            .then(() => {
              beginFallAfterSpeech();
            })
            .catch(() => {
              beginFallAfterSpeech();
            });
        }, 120);
      } else {
        // 일반 문제 및 서술형: 즉시 낙하(서술형은 상단 고정) 시작 및 음성 병행
        setIsClockReading(false);
        startMeteorFall();

        speechTimerRef.current = window.setTimeout(() => {
          if (speechSessionRef.current === currentSession) {
            speak(currentProblem.readKr, 'ko-KR');
          }
        }, 80);
      }
    }
  }, [isStarted, phase, roundIndex, currentProblem, isWordProblem, speak, cancel, startMeteorFall]);

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

      // 조기 선택 시 읽기 상태 즉시 해제 및 TTS/안전 타이머 취소
      setIsClockReading(false);
      if (clockSpeechSafetyTimerRef.current !== null) {
        window.clearTimeout(clockSpeechSafetyTimerRef.current);
        clockSpeechSafetyTimerRef.current = null;
      }
      speechSessionRef.current++;
      cancel();

      setIsHintModalOpen(false);
      playCardTapSound();

      const responseTimeMs = Math.max(300, performance.now() - problemStartTimeRef.current);

      if (choice === String(currentProblem.answer)) {
        // [정답] 애널리틱스 및 실시간 적응형 ZPD 기록
        recordMathAttempt(currentProblem, true);
        updateAdaptiveZpd(true, responseTimeMs);

        // [정답] 콤보 누적 및 버닝 피버 판정
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        setMaxCombo((prev) => Math.max(prev, nextCombo));
        const currentIsFever = nextCombo >= 3;


        // [정답] 고질라 대각선 아토믹 레이저 빔 발사 & 운석 공중 요격 폭발
        clearAllTimers();
        // 정답을 맞춘 즉시 진행 중인 문제 낭독 취소
        cancel();
        setPhase('INTERCEPTING');
        setIsShootingBeam(true);

        // 3개 국어(한국어·영어·일본어) 숫자 또는 시계 정답 낭독 & 피드백 정보 생성
        const transitionVersion = transitionVersionRef.current;
        let answerSpeechFinished: Promise<number> = Promise.resolve(performance.now());
        if (currentProblem.clockQuestion) {
          const { targetHour, targetMinute } = currentProblem.clockQuestion;
          const ansText = String(currentProblem.answer);
          setSolvedAnswerDisplay({
            num: ansText,
            kr: ansText,
            en: `${targetHour}:${String(targetMinute).padStart(2, '0')}`,
            ja: `${targetHour}じ ${targetMinute === 0 ? 'ちょうど' : `${targetMinute}ふん`}`,
          });
          answerSpeechFinished = new Promise<number>((resolve) => {
            let finished = false;
            const finish = () => {
              if (finished || transitionVersionRef.current !== transitionVersion) return;
              finished = true;
              if (answerSpeechFallbackRef.current !== null) {
                window.clearTimeout(answerSpeechFallbackRef.current);
                answerSpeechFallbackRef.current = null;
              }
              resolve(performance.now());
            };
            answerSpeechFallbackRef.current = window.setTimeout(finish, 4500);
            speechTimerRef.current = window.setTimeout(() => {
              speechTimerRef.current = null;
              void speak(`시한폭탄 해체 성공! ${ansText}!`, 'ko-KR').then(finish);
            }, 350);
          });
        } else {
          const ansNum = parseInt(String(currentProblem.answer), 10);
          if (!isNaN(ansNum) && ansNum >= 0 && ansNum <= 100) {
            const krStr = readSino(ansNum);
            const enStr = readEnglish(ansNum);
            const jaStr = readJapanese(ansNum);
            setSolvedAnswerDisplay({
              num: ansNum,
              kr: krStr,
              en: enStr,
              ja: jaStr,
            });

            // 정답 음성: 한국어 또는 영어로 정답 수치 낭독 (짝수 콤보는 영어, 홀수는 한국어)
            answerSpeechFinished = new Promise<number>((resolve) => {
              let finished = false;
              const finish = () => {
                if (finished || transitionVersionRef.current !== transitionVersion) return;
                finished = true;
                if (answerSpeechFallbackRef.current !== null) {
                  window.clearTimeout(answerSpeechFallbackRef.current);
                  answerSpeechFallbackRef.current = null;
                }
                resolve(performance.now());
              };
              answerSpeechFallbackRef.current = window.setTimeout(finish, 4500);
              speechTimerRef.current = window.setTimeout(() => {
                speechTimerRef.current = null;
                void speak(
                  nextCombo % 2 === 0 ? enStr : `${krStr}!`,
                  nextCombo % 2 === 0 ? 'en-US' : 'ko-KR'
                ).then(finish);
              }, 350);
            });
          }
        }

        setMathQuickTip(null);
        if (mathQuickTipTimerRef.current !== null) {
          window.clearTimeout(mathQuickTipTimerRef.current);
          mathQuickTipTimerRef.current = null;
        }

        // 사운드: 보스 운석 격파 시에는 하이퍼 아토믹 피니시 사운드!
        if (isWordProblem) {
          playPerfectAtomicRoarSound();
          setIsImpactShaking(true);
          window.setTimeout(() => setIsImpactShaking(false), 450);
        } else if (currentIsFever) {
          playFeverBeamSound();
          if (nextCombo === 3) {
            playCriticalRoarSound();
          }
        } else {
          playLaserPewPew();
          if (nextCombo >= 2) {
            playComboSound(nextCombo);
          }
        }

        // 0.25초 후 운석 요격 명중 폭발
        timeoutTimerRef.current = window.setTimeout(() => {
          setIsExploding(true);
          playMeteorExplosionSound();

          // 폭죽 파티클 (황금 운석 또는 보스 격파 시 화려한 폭죽)
          confetti({
            particleCount: isGoldenMeteor ? 130 : isWordProblem ? 140 : currentIsFever ? 100 : 60,
            spread: isGoldenMeteor ? 120 : isWordProblem ? 130 : currentIsFever ? 120 : 90,
            origin: {
              x: 0.5,
              y: isWordProblem ? 0.38 : Math.min(0.7, Math.max(0.15, (meteorProgress * 0.78) / 100)),
            },
            colors: isGoldenMeteor
              ? ['#fbbf24', '#facc15', '#eab308', '#ffffff', '#f59e0b']
              : isWordProblem
              ? ['#a855f7', '#ec4899', '#facc15', '#f97316', '#38bdf8', '#ffffff']
              : currentIsFever
              ? ['#ea580c', '#ef4444', '#facc15', '#f43f5e', '#ffffff', '#38bdf8']
              : ['#f59e0b', '#ef4444', '#38bdf8', '#ffffff', '#10b981'],
          });

          // M10: 황금 운석 요격 보너스 피드백
          if (isGoldenMeteor) {
            setDefenseDamageAlert('🌟 황금 보너스 운석 격파! 알 조각 & 보너스 획득! 🌟');
            window.setTimeout(() => setDefenseDamageAlert(null), 1800);
            onPartnerNotice?.('⭐ 황금 운석 요격 성공! 보너스 알 조각을 획득했어요! ⭐', '🌟');
          }

          // 레이저 소멸
          window.setTimeout(() => {
            setIsShootingBeam(false);
          }, 350);

          // 다음 라운드 진행 또는 클리어 판정
          nextRoundTimerRef.current = window.setTimeout(async () => {
            nextRoundTimerRef.current = null;
            const speechFinishedAt = await answerSpeechFinished;
            if (transitionVersionRef.current !== transitionVersion) return;
            // Preserve the animation duration and leave 300ms after the answer voice.
            const remainingPause = Math.max(0, speechFinishedAt + 300 - performance.now());
            nextRoundTimerRef.current = window.setTimeout(() => {
              nextRoundTimerRef.current = null;
              cancel();
              if (roundIndex + 1 >= TOTAL_ROUNDS) {
                setPhase('VICTORY');
                playVictoryFanfare();

                // 아토믹 파츠 및 칭호 해금 평가 & 지급
                const rewards = evaluateStageClearRewards({
                  stageNum,
                  isPerfect: reviveCount === 0,
                  maxCombo: Math.max(maxCombo, nextCombo),
                  hasDefeatedBoss: true,
                });
                if (rewards.newlyUnlockedParts.length > 0 || rewards.newlyUnlockedTitles.length > 0) {
                  setNewRewardResult(rewards);
                }

                confetti({
                  particleCount: isWordProblem || currentIsFever ? 160 : 120,
                  spread: 120,
                  origin: { y: 0.5 },
                  colors: ['#a855f7', '#facc15', '#f97316', '#ef4444', '#38bdf8', '#ffffff'],
                });
              } else {
                setSolvedAnswerDisplay(null);
                setRoundIndex((r) => r + 1);
                setPhase('PLAYING');
              }
            }, remainingPause);
          }, 1100);
        }, 250);
      } else {
        // [오답] 진동 & 체력 감소 및 시각 피드백 (콤보 리셋 & 애널리틱스/ZPD 반영)
        playErrorBuzzer();
        recordMathAttempt(currentProblem, false);
        updateAdaptiveZpd(false, responseTimeMs);
        setSelectedWrongChoices((prev) => [...prev, choice]);
        setCombo(0);
        showQuickTip(currentProblem, choice);

        if (mothraShieldActive) {
          setMothraShieldActive(false);
          setIsImpactShaking(true);
          setDefenseDamageAlert('🦋 모스라 수호의 날개! 오답 1회 방어!');
          window.setTimeout(() => setIsImpactShaking(false), 400);
          window.setTimeout(() => setDefenseDamageAlert(null), 1200);
          onPartnerNotice?.('모스라의 수호의 날개! 오답 1회 무료 방어!', '🛡️');
          return;
        }

        setLives((prev) => {
          triggerDamageFeedback(prev, '⚠️ 오답 요격 실패! 하트 -1');
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
      isStarted,
      phase,
      isShootingBeam,
      isExploding,
      currentProblem,
      speak,
      isWordProblem,
      stageNum,
      reviveCount,
      maxCombo,
      clearAllTimers,
      cancel,
      roundIndex,
      meteorProgress,
      mothraShieldActive,
      onPartnerNotice,
      triggerDamageFeedback,
      combo,
      isGoldenMeteor,
      showQuickTip,
      updateAdaptiveZpd,
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
    setCombo(0);
    setMaxCombo(0);
    setMathQuickTip(null);
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
    setCombo(0);
    setMathQuickTip(null);
    setIsStarted(true);
    setPhase('PLAYING');
  }, [clearAllTimers, cancel]);

  // 10-2. 처음부터 다시 시작하기 (1번 문제 리셋)
  const handleRestart = useCallback(() => {
    clearAllTimers();
    cancel();
    hasSubmittedClearRef.current = false;
    lastSpokenProblemIdRef.current = null;
    setSelectedWrongChoices([]);
    setMeteorProgress(0);
    setIsShootingBeam(false);
    setIsExploding(false);
    setIsImpactShaking(false);
    setLives(3);
    setRoundIndex(0);
    setReviveCount(0);
    setGameSession((prev) => prev + 1);
    setCombo(0);
    setMaxCombo(0);
    setMathQuickTip(null);
    setIsStarted(true);
    setPhase('PLAYING');
    setMothraShieldActive(equippedPartnerId === 'mothra');
  }, [clearAllTimers, cancel, equippedPartnerId]);

  // 11. 경험치 계산 (퍼펙트 완주 보너스 +20 EXP, 피버 모드 달성 보너스 +15 EXP, 메카고질라 +20%)
  const isPerfect = reviveCount === 0;
  const feverBonusExp = maxCombo >= 3 ? 15 : 0;
  const baseExp = (isPerfect ? 95 : 75) + feverBonusExp; // 무결점 95 EXP, 부활 완주 75 EXP, 피버 달성시 +15 EXP
  const isMecha = equippedPartnerId === 'mechagodzilla';
  const earnedExp = isMecha ? Math.round(baseExp * 1.2) : baseExp;

  // 11-2. 클리어 확인 버튼 (연타 시 중복 보상 지급 방어)
  const handleConfirmClear = (): boolean => {
    if (hasSubmittedClearRef.current) return false;
    hasSubmittedClearRef.current = true;
    clearAllTimers();
    cancel();
    onClear(earnedExp);
    return true;
  };

  return (
    <div
      className={`relative w-full flex-1 min-h-0 h-full flex flex-col rounded-2xl overflow-hidden bg-slate-950 border-2 transition-all duration-300 ${
        isRedFlash
          ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.8)]'
          : isFever
          ? 'border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.6)]'
          : 'border-amber-500/60 shadow-2xl'
      } ${isImpactShaking ? 'animate-screen-shake' : ''}`}
      style={{
        boxShadow: isRedFlash
          ? '0 0 50px rgba(239, 68, 68, 0.8), inset 0 0 35px rgba(239, 68, 68, 0.5)'
          : isFever
          ? '0 0 40px rgba(249, 115, 22, 0.6), inset 0 0 25px rgba(234, 88, 12, 0.25)'
          : '0 0 35px rgba(245, 158, 11, 0.4), inset 0 0 30px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* 화면 전체 붉은색 피격 플래시 오버레이 */}
      {isRedFlash && (
        <div className="absolute inset-0 bg-red-600/30 z-40 pointer-events-none animate-pulse" />
      )}

      {/* 1. 상단 HUD 배너 */}
      <div
        className={`flex-none flex items-center justify-between px-3 py-1.5 transition-colors duration-300 ${
          isFever ? 'bg-orange-950/90 border-b border-orange-500/60' : 'bg-slate-900/90 border-b border-amber-500/40'
        } z-20`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`px-2 py-0.5 rounded-md text-white font-black text-[10px] sm:text-xs tracking-wider flex items-center gap-1 shadow-sm transition-colors ${
              isFever ? 'bg-orange-600 animate-pulse' : 'bg-amber-600/90'
            }`}
          >
            <Calculator size={13} />
            STAGE {stageNum} 산수
          </span>
          <span
            className={`font-extrabold text-xs sm:text-sm truncate transition-colors ${
              isFever ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]' : 'text-amber-300'
            }`}
          >
            수식 운석 요격 디펜스
          </span>

          {/* 콤보 배지 (서술형/보스전 및 1콤보 미만일 때는 숨김) */}
          {combo >= 2 && !isWordProblem && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-sm transition-all animate-bounce ${
                isFever
                  ? 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white border border-yellow-300 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                  : 'bg-amber-500/20 border border-amber-400/60 text-amber-300'
              }`}
            >
              <Flame size={12} className={isFever ? 'text-yellow-200 fill-yellow-300' : 'text-amber-400'} />
              <span>
                {combo} COMBO{isFever ? ' FEVER!' : ''}
              </span>
            </span>
          )}

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

          {/* 아이 대장 및 장착 칭호 뱃지 (클릭 시 아토믹 격납고 열기) */}
          <button
            type="button"
            onClick={() => {
              playCardTapSound();
              setIsHangarOpen(true);
            }}
            title="아토믹 격납고 열기"
            className="px-2 py-0.5 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400 text-cyan-200 text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <span>{equippedTitle.badgeIcon}</span>
            <span>{equippedTitle.title}</span>
          </button>

          {/* 아토믹 격납고 바로가기 버튼 */}
          <button
            type="button"
            onClick={() => {
              playCardTapSound();
              setIsHangarOpen(true);
            }}
            title="아토믹 파츠 장착실 열기"
            className="px-2 py-0.5 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-400 text-yellow-300 text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Award size={12} className="text-yellow-400" />
            <span className="hidden sm:inline">격납고</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* 라운드 진행도 */}
          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-amber-300">
            <span>요격:</span>
            <span className="text-white">
              {Math.min(TOTAL_ROUNDS, roundIndex + (phase === 'VICTORY' ? 1 : 0))} / {TOTAL_ROUNDS}
            </span>
          </div>

          {/* 고질라 쉴드 하트 (피격 시 깨진 하트 💔 전환 및 팝업 펄스 연출) */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((heartIdx) => {
              const isLost = heartIdx > lives;
              const isDamaged = heartIdx === damagedHeartIdx;
              return (
                <div
                  key={heartIdx}
                  className={`relative flex items-center justify-center transition-all duration-300 ${
                    isDamaged ? 'animate-bounce scale-125' : ''
                  }`}
                >
                  {isLost ? (
                    <span
                      className="text-sm select-none inline-block filter grayscale opacity-45 transition-transform"
                      title="파괴된 하트"
                    >
                      💔
                    </span>
                  ) : (
                    <Heart
                      size={17}
                      className="text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                    />
                  )}
                  {isDamaged && (
                    <span className="absolute -inset-1 rounded-full bg-red-500/50 animate-ping pointer-events-none" />
                  )}
                </div>
              );
            })}
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
        <div className="relative z-10 w-full flex items-center justify-center pt-1.5 pb-1 flex-none">
          {!isStarted ? (
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/80 border border-amber-500/40 text-[10px] sm:text-xs text-amber-300/70 font-extrabold shadow-sm">
              <span>⚡</span>
              <span>{godzillaEvo.shortName} 요격 개시 대기 중</span>
              <span>{godzillaEvo.icon}</span>
            </div>
          ) : isWordProblem && phase === 'PLAYING' ? (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 my-1 rounded-full bg-gradient-to-r from-purple-950/95 via-indigo-950/95 to-slate-900/95 border-2 border-purple-400 text-[11px] sm:text-xs text-purple-200 font-black shadow-[0_0_20px_rgba(168,85,247,0.7)] animate-pulse">
              <span className="text-sm">{roundIndex === 9 ? '👑' : '👾'}</span>
              <span>
                {roundIndex === 9
                  ? `최종 보스 출현! ${childName} 대장님, 식을 세워 요격하세요! (시간제한 없음 ⏳)`
                  : `거대 보스 출현! ${childName} 대장님, 식을 세워 요격하세요! (시간제한 없음 ⏳)`}
              </span>
              <span className="text-yellow-300">⚔️</span>
            </div>
          ) : lives === 1 && phase === 'PLAYING' ? (
            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-950/90 border-2 border-red-500 text-[11px] sm:text-xs text-red-200 font-black shadow-[0_0_20px_rgba(239,68,68,0.85)] animate-pulse">
              <span className="text-sm">🚨</span>
              <span>긴급 서포트 발동! 정답 후보 압축! (50:50)</span>
              <span className="text-amber-300">⚡</span>
            </div>
          ) : isFever && phase === 'PLAYING' ? (
            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-red-950/90 via-orange-950/90 to-amber-950/90 border-2 border-orange-500 text-[11px] sm:text-xs text-yellow-200 font-black shadow-[0_0_20px_rgba(249,115,22,0.85)] animate-pulse">
              <span className="text-sm">🔥</span>
              <span>고질라 버닝 피버 발동 중! ({combo}연속 정답 · 메가 빔 강화!)</span>
              <span className="text-orange-400">⚡</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/80 border border-amber-500/40 text-[10px] sm:text-xs text-amber-300 font-extrabold shadow-sm">
              <span>🔥</span>
              <span>초등 2학년 수식 운석 낙하 중</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border ${
                  adaptiveFallDurationMs <= 12500
                    ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300'
                    : adaptiveFallDurationMs >= 16000
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                    : 'bg-slate-800 border-amber-500/40 text-amber-200'
                }`}
              >
                {adaptiveFallDurationMs <= 12500
                  ? `⚡ 고속 요격 ${(adaptiveFallDurationMs / 1000).toFixed(1)}초`
                  : adaptiveFallDurationMs >= 16000
                  ? `🌿 안심 감속 ${(adaptiveFallDurationMs / 1000).toFixed(1)}초`
                  : `🛡️ 표준 ${(adaptiveFallDurationMs / 1000).toFixed(0)}초`}
              </span>
            </div>
          )}
        </div>

        {/* 중앙: 운석 낙하 트랙 영역 */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden">
          {/* 방어선 피격 / 쉴드 방어 경고 플로팅 텍스트 */}
          {defenseDamageAlert && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-8 z-35 animate-bounce pointer-events-none whitespace-nowrap">
              <span className="px-3 py-1 rounded-full bg-red-950/95 border-2 border-red-500 text-red-100 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(239,68,68,0.9)] flex items-center gap-1.5">
                {defenseDamageAlert}
              </span>
            </div>
          )}

          {/* 🔢 산수 피격 및 오답 시 '1초 연산 풀이 팁' 즉시 노출 배너 */}
          {mathQuickTip && (
            <div className="absolute left-1/2 -translate-x-1/2 top-2 sm:top-3.5 z-40 w-[94%] max-w-lg pointer-events-auto transition-all animate-bounce">
              <div className="p-2 sm:p-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-amber-950/95 border-2 border-amber-400 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.7)] backdrop-blur-md flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-lg flex-shrink-0 shadow-inner">
                  💡
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                      <span>⚡</span> 1초 연산 풀이 팁!
                    </span>
                    <span className="text-[9px] text-yellow-300/80 font-bold">
                      (오답 극복 치트키)
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-white leading-tight break-keep mt-0.5 drop-shadow">
                    {mathQuickTip}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMathQuickTip(null)}
                  className="text-amber-400/70 hover:text-amber-200 text-xs p-1 rounded hover:bg-white/10 cursor-pointer"
                  title="팁 닫기"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* 지면 방어선 레이저 라인 */}
          <div
            className="absolute left-4 right-4 bottom-2 h-1 rounded-full z-10"
            style={{
              background: isFever
                ? 'linear-gradient(90deg, transparent, #ef4444 20%, #f97316 50%, #ef4444 80%, transparent)'
                : 'linear-gradient(90deg, transparent, #f59e0b 20%, #f59e0b 80%, transparent)',
              boxShadow: isFever ? '0 0 14px #ea580c' : '0 0 10px #f59e0b',
            }}
          >
            <span
              className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-black tracking-widest uppercase ${
                isFever ? 'text-orange-400 drop-shadow-[0_0_6px_#ea580c]' : 'text-amber-400/80'
              }`}
            >
              DEFENSE LINE
            </span>
          </div>

          {/* 고질라 아토믹 요격 포탑 (언어 배틀 고질라 성장 레벨 & 진화 형태 연동 - 1.5배 확대) */}
          <div className="absolute left-3 sm:left-6 bottom-1 z-30 flex items-center gap-2.5 pointer-events-none">
            <div
              className={`relative flex items-center justify-center w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-2xl border-2 transition-all duration-300 ${
                isWordProblem
                  ? isShootingBeam
                    ? 'bg-purple-600/40 border-yellow-300 scale-115 shadow-[0_0_40px_#c084fc]'
                    : 'bg-gradient-to-br from-purple-950/95 to-indigo-950/95 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.7)] animate-pulse'
                  : isFever
                  ? isShootingBeam
                    ? 'bg-red-500/40 border-yellow-300 scale-115 shadow-[0_0_35px_#ef4444]'
                    : 'bg-gradient-to-br from-orange-950/90 to-red-950/90 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.7)] animate-pulse'
                  : isShootingBeam
                  ? 'bg-amber-500/30 border-amber-300 scale-110 shadow-[0_0_25px_#f59e0b]'
                  : 'bg-slate-900/95 border-amber-500/50 shadow-[0_0_14px_rgba(245,158,11,0.4)]'
              }`}
              style={{
                borderColor: isShootingBeam ? godzillaEvo.themeColor : undefined,
                boxShadow: isShootingBeam ? `0 0 35px ${godzillaEvo.themeColor}` : undefined,
              }}
            >
              {/* 고질라 성장 레벨 뱃지 (좌측 상단 오버레이) */}
              <div
                className="absolute -top-2.5 -left-1 px-1.5 py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-black tracking-tight text-white shadow-md z-30 flex items-center gap-0.5 border border-white/40"
                style={{ background: godzillaEvo.badgeBg }}
                title={`${godzillaEvo.name} (LV.${level})`}
              >
                <span>{godzillaEvo.icon}</span>
                <span>LV.{level}</span>
              </div>

              {/* 고질라 10레벨 단위 궁극의 각성 아우라 (Lv.10+) */}
              {godzillaAura.tier !== 'none' && (
                <div
                  className="absolute -inset-2 rounded-2xl opacity-80 animate-pulse pointer-events-none z-0"
                  style={{
                    boxShadow: godzillaAura.glowShadow,
                    border: `1.5px solid ${godzillaAura.themeColor}88`,
                  }}
                  title={godzillaAura.name}
                />
              )}

              {/* 등지느러미 아우라 (파츠 장착 시) */}
              {equippedFin && equippedFin.id !== 'fin-default' && (
                <div
                  className="absolute -inset-1.5 rounded-2xl opacity-75 animate-pulse pointer-events-none z-0"
                  style={{
                    boxShadow:
                      equippedFin.rarity === 'LEGENDARY'
                        ? '0 0 18px #eab308'
                        : equippedFin.rarity === 'EPIC'
                        ? '0 0 16px #a855f7'
                        : '0 0 14px #38bdf8',
                  }}
                />
              )}

              {/* 헤드기어 착용 비주얼 */}
              {equippedHead && equippedHead.id !== 'head-default' && (
                <span className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 text-sm sm:text-base drop-shadow-md select-none z-30 animate-bounce">
                  {equippedHead.turretEmoji || equippedHead.icon}
                </span>
              )}

              {/* 고질라 진화 형태 캐릭터 이미지 (1.5배 확대 적용) */}
              <div className="relative w-full h-full flex items-center justify-center p-0.5 select-none pointer-events-none">
                <img
                  src={godzillaEvo.imageSrc}
                  alt={godzillaEvo.name}
                  className={`w-full h-full object-contain transition-transform duration-200 ${
                    isShootingBeam
                      ? 'scale-120 brightness-125'
                      : isWordProblem
                      ? 'scale-110 drop-shadow-[0_0_10px_#c084fc]'
                      : isFever
                      ? 'scale-110 drop-shadow-[0_0_10px_#ea580c]'
                      : 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]'
                  }`}
                  style={{
                    filter: isShootingBeam
                      ? `drop-shadow(0 0 14px ${godzillaEvo.themeColor}) brightness(1.25)`
                      : undefined,
                  }}
                />
              </div>

              {/* 무기 파츠 아이콘 (포탑 모서리 뱃지) */}
              {equippedWeapon && equippedWeapon.id !== 'wp-default' && (
                <span className="absolute -bottom-1.5 -right-1.5 text-sm select-none drop-shadow z-30">
                  {equippedWeapon.icon}
                </span>
              )}

              {isShootingBeam && (
                <>
                  <div
                    className="absolute -inset-1.5 rounded-2xl border-2 pointer-events-none animate-ping"
                    style={{ borderColor: godzillaEvo.themeColor }}
                  />
                  <div className="absolute -top-3 -right-1 text-yellow-300 text-sm font-black animate-bounce pointer-events-none z-30">
                    ⚡
                  </div>
                </>
              )}

              <div
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full z-20 ${
                  isWordProblem
                    ? 'bg-purple-400 shadow-[0_0_8px_#c084fc]'
                    : isFever
                    ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                    : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                } border-2 border-white`}
              />
            </div>

            <div className="hidden sm:flex flex-col text-[10px] font-black select-none">
              <span
                className={`leading-tight ${
                  isWordProblem
                    ? 'text-purple-300 animate-pulse'
                    : isFever
                    ? 'text-orange-300 animate-pulse'
                    : 'text-amber-300'
                }`}
              >
                {isWordProblem
                  ? `👑 ${godzillaEvo.shortName} FINISHER`
                  : isFever
                  ? `🔥 버닝 ${godzillaEvo.shortName}`
                  : `${godzillaEvo.name}`}
              </span>
              <span className="text-[8.5px] text-slate-400 font-bold">
                {isShootingBeam
                  ? isWordProblem
                    ? `💥 ${godzillaEvo.beamName}!`
                    : isFever
                    ? '🔥 메가 버닝 빔 발사!'
                    : `🔥 ${godzillaEvo.beamName}!`
                  : isWordProblem
                  ? '⚡ 필살기 장전 완료!'
                  : isFever
                  ? '⚡ 피버 장전 완료!'
                  : `READY (${equippedWeapon && equippedWeapon.id !== 'wp-default' ? equippedWeapon.name : '아토믹 캐논'})`}
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
                  <stop
                    offset="0%"
                    stopColor={isWordProblem ? '#9333ea' : isFever ? '#dc2626' : '#d97706'}
                    stopOpacity="0.95"
                  />
                  <stop
                    offset="40%"
                    stopColor={isWordProblem ? '#ec4899' : isFever ? '#ea580c' : '#f59e0b'}
                    stopOpacity="1"
                  />
                  <stop
                    offset="80%"
                    stopColor={isWordProblem ? '#38bdf8' : isFever ? '#fbbf24' : '#fde047'}
                    stopOpacity="1"
                  />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </linearGradient>
                <filter id="mathBeamGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation={isWordProblem ? '3' : isFever ? '2.5' : '1.5'} result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. 외부 오렌지/레드/바이올렛 버닝 네온 글로우 */}
              <line
                x1={14}
                y1={88}
                x2={50}
                y2={isWordProblem ? 38 : Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                stroke={isWordProblem ? '#c084fc' : isFever ? '#ef4444' : '#f59e0b'}
                strokeWidth={isWordProblem ? '12' : isFever ? '9' : '5'}
                strokeLinecap="round"
                opacity={isWordProblem ? '0.9' : isFever ? '0.85' : '0.6'}
                filter="url(#mathBeamGlow)"
              />

              {/* 2. 주 열선 레이저 */}
              <line
                x1={14}
                y1={88}
                x2={50}
                y2={isWordProblem ? 38 : Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                stroke="url(#mathBeamGrad)"
                strokeWidth={isWordProblem ? '6.5' : isFever ? '5.5' : '3.0'}
                strokeLinecap="round"
                filter="url(#mathBeamGlow)"
              />

              {/* 3. 코어 화이트 고출력 빔 */}
              <line
                x1={14}
                y1={88}
                x2={50}
                y2={isWordProblem ? 38 : Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                stroke="#ffffff"
                strokeWidth={isWordProblem ? '2.8' : isFever ? '2.2' : '1.4'}
                strokeLinecap="round"
              />

              {/* 4. 머즐 플래시 */}
              <circle cx={14} cy={88} r={isWordProblem ? '6' : isFever ? '5' : '3'} fill="#ffffff" filter="url(#mathBeamGlow)" />
              <circle
                cx={14}
                cy={88}
                r={isWordProblem ? '11' : isFever ? '9' : '5.5'}
                fill={isWordProblem ? '#a855f7' : isFever ? '#ef4444' : '#f59e0b'}
                opacity="0.85"
              />

              {/* 5. 명중 임팩트 스파크 */}
              <circle
                cx={50}
                cy={isWordProblem ? 38 : Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                r={isWordProblem ? '9' : isFever ? '7' : '4'}
                fill="#ffffff"
                filter="url(#mathBeamGlow)"
              />
              <circle
                cx={50}
                cy={isWordProblem ? 38 : Math.min(76, Math.max(12, meteorProgress * 0.78 + 6))}
                r={isWordProblem ? '16' : isFever ? '13' : '7'}
                fill={isWordProblem ? '#f43f5e' : isFever ? '#f97316' : '#fde047'}
                opacity="0.9"
              />
            </svg>
          )}

          {/* 낙하하는 수식 운석 (Meteor) / 서술형은 상단 중앙 고정 카드 */}
          {isStarted && phase !== 'WARNING' && phase !== 'VICTORY' && phase !== 'GAME_OVER' && (
            <div
              className={`absolute flex flex-col items-center pointer-events-none z-20 ${
                isWordProblem
                  ? 'left-1/2 -translate-x-1/2 w-[94%] max-w-xl top-2 sm:top-[25%]'
                  : currentProblem.clockQuestion
                  ? 'w-[94vw] max-w-2xl transition-transform duration-75'
                  : 'w-fit max-w-[92vw] transition-transform duration-75'
              } ${isExploding ? 'animate-ping opacity-0 scale-150 duration-300' : ''}`}
              style={
                isWordProblem
                  ? undefined
                  : {
                      left: '50%',
                      top: `${meteorProgress * 0.78}%`,
                      transform: `translate(-50%, 0) scale(${meteorScale})`,
                      transformOrigin: 'center top',
                    }
              }
            >
              {/* M10: 황금 보너스 운석 안내 뱃지 */}
              {isGoldenMeteor && (
                <div className="mb-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 border border-yellow-100 text-slate-950 text-[10px] sm:text-xs font-black shadow-[0_0_15px_#facc15] animate-bounce flex items-center justify-center gap-1 select-none whitespace-nowrap">
                  <span>⭐ 황금 보너스 운석! 알 조각 획득 찬스 ⭐</span>
                </div>
              )}

              {/* 운석 불꽃 꼬리 (낙하 문제 전용) */}
              {!isWordProblem && (
                <div
                  className="w-4 h-10 -mb-2 rounded-full opacity-80 animate-pulse"
                  style={{
                    background: isGoldenMeteor
                      ? 'linear-gradient(to bottom, transparent, #eab308, #fef08a)'
                      : 'linear-gradient(to bottom, transparent, #ea580c, #f59e0b)',
                    filter: 'blur(2px)',
                  }}
                />
              )}

              {/* 운석 구체 본체 / 보스 운석 카드 */}
              <div
                className={`relative rounded-2xl border-2 shadow-2xl transition-all ${
                  isWordProblem
                    ? 'w-full h-auto px-6 py-4 flex flex-col gap-3 overflow-hidden'
                    : currentProblem.clockQuestion
                    ? 'w-[94vw] max-w-2xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 overflow-hidden'
                    : 'w-fit max-w-[92vw] sm:max-w-md px-3.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-center gap-2'
                } ${
                  isShootingBeam
                    ? isWordProblem
                      ? 'bg-purple-950/90 border-yellow-300 shadow-[0_0_35px_#c084fc]'
                      : isGoldenMeteor
                      ? 'bg-yellow-400/70 border-white shadow-[0_0_40px_#facc15] scale-110'
                      : 'bg-amber-500/40 border-yellow-300 shadow-[0_0_30px_#f59e0b] scale-110'
                    : isWordProblem
                    ? 'bg-gradient-to-b from-slate-900/98 via-purple-950/85 to-slate-900/98 border-purple-500/90 shadow-[0_0_30px_rgba(168,85,247,0.45)]'
                    : isGoldenMeteor
                    ? 'bg-gradient-to-br from-amber-900/95 via-yellow-700/95 to-amber-950/95 border-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.85)] animate-pulse'
                    : !isWordProblem && meteorProgress > 70
                    ? 'bg-red-950/90 border-red-500 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                    : 'bg-slate-900/95 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                }`}
              >
                {/* 붉은/보라 화염 이펙트 */}
                <div
                  className={`absolute -inset-1 rounded-2xl blur-sm pointer-events-none ${
                    isWordProblem ? 'bg-purple-500/25' : isGoldenMeteor ? 'bg-yellow-400/30' : 'bg-amber-500/20'
                  }`}
                />

                {/* 보스 헤더: 보스 네임태그 & 체력 바 (HP GAUGE) */}
                {isWordProblem && (
                  <div className="relative w-full min-w-0 flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-500/30 select-none">
                    <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-purple-900/90 border border-purple-400 text-purple-200 font-black text-[10px] sm:text-xs flex items-center gap-1 shadow-sm animate-pulse">
                        <Crown size={12} className="text-yellow-400" />
                        <span>{roundIndex === 9 ? 'FINAL BOSS' : 'STAGE BOSS'}</span>
                      </span>
                      <span className="min-w-0 break-keep text-[11px] sm:text-xs font-black text-purple-200">
                        {roundIndex === 9 ? '황금 우주괴수 킹기도라 운석' : '거대 외계 비행체 메카 보스'}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                      <span
                        className={`text-[10px] sm:text-xs font-black transition-colors ${
                          isShootingBeam || isExploding ? 'text-emerald-400 animate-bounce' : 'text-red-400'
                        }`}
                      >
                        {isShootingBeam || isExploding ? 'HP 0% (격파!)' : 'HP 100%'}
                      </span>
                      <div className="w-16 sm:w-24 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-red-500/50 p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isShootingBeam || isExploding
                              ? 'w-0 bg-slate-600'
                              : 'w-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 animate-pulse'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className={`relative w-full min-w-0 flex gap-2.5 sm:gap-4 ${
                  isWordProblem
                    ? 'flex-wrap items-start sm:flex-nowrap'
                    : currentProblem.clockQuestion
                    ? 'items-center justify-between'
                    : 'items-center justify-center'
                }`}>
                  <span
                    className={`text-xl sm:text-2xl flex-none ${
                      isWordProblem ? 'animate-pulse' : 'animate-bounce'
                    }`}
                  >
                    {isGoldenMeteor ? '🌟' : isWordProblem ? (roundIndex === 9 ? '👑' : '👾') : '☄️'}
                  </span>

                  {isWordProblem ? (
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <p className="relative text-base sm:text-xl font-bold text-white leading-relaxed break-keep whitespace-pre-line [overflow-wrap:anywhere] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {renderHighlightedText(currentProblem.problemText ?? currentProblem.question, childName)}
                      </p>
                      {steppingStoneHint && !solvedAnswerDisplay && (
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-400/80 text-emerald-200 text-xs font-extrabold shadow-sm animate-fadeIn">
                          {steppingStoneHint}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 min-w-0 max-w-full text-center">
                      {solvedAnswerDisplay ? (
                        <div className="flex flex-col items-center gap-1 animate-fadeIn">
                          <span className="text-2xl sm:text-4xl font-black text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]">
                            정답: {solvedAnswerDisplay.num}!
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap justify-center mt-0.5">
                            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-400 text-amber-200 text-[10px] sm:text-xs font-black shadow-sm whitespace-nowrap">
                              🇰🇷 {solvedAnswerDisplay.kr}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-400 text-blue-200 text-[10px] sm:text-xs font-black shadow-sm whitespace-nowrap">
                              🇺🇸 {solvedAnswerDisplay.en}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-400 text-red-200 text-[10px] sm:text-xs font-black shadow-sm whitespace-nowrap">
                              🇯🇵 {solvedAnswerDisplay.ja}
                            </span>
                          </div>
                        </div>
                      ) : currentProblem.clockQuestion ? (
                        <div className="flex flex-row items-center gap-3 sm:gap-4 justify-center w-full text-center">
                          {/* 아날로그 시계 시한폭탄 SVG 다이어그램 */}
                          {(() => {
                            const { hour, minute, deltaMinutes } = currentProblem.clockQuestion;
                            const hourAngle = ((hour % 12) + minute / 60) * 30;
                            const minuteAngle = minute * 6;
                            return (
                              <div className="relative flex items-center justify-center flex-shrink-0">
                                <svg
                                  viewBox="0 0 100 100"
                                  className="w-[78px] h-[78px] sm:w-[92px] sm:h-[92px] drop-shadow-[0_0_12px_rgba(244,63,94,0.65)]"
                                >
                                  {/* 시계 외곽 테두리 */}
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="46"
                                    fill="#0f172a"
                                    stroke={deltaMinutes ? '#f43f5e' : '#38bdf8'}
                                    strokeWidth="3.5"
                                  />
                                  {/* 12개 숫자 눈금 */}
                                  {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, idx) => {
                                    const rad = ((idx * 30 - 90) * Math.PI) / 180;
                                    const tx = 50 + 35 * Math.cos(rad);
                                    const ty = 50 + 35 * Math.sin(rad);
                                    return (
                                      <text
                                        key={num}
                                        x={tx}
                                        y={ty}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fill={num % 3 === 0 ? '#fde047' : '#e2e8f0'}
                                        fontSize={num % 3 === 0 ? '10.5' : '8.5'}
                                        fontWeight="900"
                                      >
                                        {num}
                                      </text>
                                    );
                                  })}
                                  {/* 긴 바늘 (분침 - 노란색) */}
                                  <line
                                    x1="50"
                                    y1="50"
                                    x2={50 + 28 * Math.cos(((minuteAngle - 90) * Math.PI) / 180)}
                                    y2={50 + 28 * Math.sin(((minuteAngle - 90) * Math.PI) / 180)}
                                    stroke="#facc15"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                  />
                                  {/* 짧은 바늘 (시침 - 하늘색) */}
                                  <line
                                    x1="50"
                                    y1="50"
                                    x2={50 + 18 * Math.cos(((hourAngle - 90) * Math.PI) / 180)}
                                    y2={50 + 18 * Math.sin(((hourAngle - 90) * Math.PI) / 180)}
                                    stroke="#38bdf8"
                                    strokeWidth="4.5"
                                    strokeLinecap="round"
                                  />
                                  {/* 중심점 */}
                                  <circle cx="50" cy="50" r="3.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
                                </svg>
                              </div>
                            );
                          })()}
                          <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0 sm:min-w-[260px]">
                            <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start mb-1">
                              <span className="px-2 py-0.5 rounded bg-rose-950/90 border border-rose-400 text-rose-200 text-[10px] sm:text-xs font-black animate-pulse whitespace-normal break-keep">
                                🕰️ 킹 기도라의 시한폭탄 해체!
                              </span>
                              {isClockReading ? (
                                <span className="px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-[10px] sm:text-xs font-black animate-pulse flex items-center gap-1 shadow-[0_0_10px_#22d3ee] whitespace-normal break-keep">
                                  <span>🔊 문제 듣는 중... (다 읽으면 낙하 시작!)</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-amber-950/90 border border-amber-400 text-amber-200 text-[10px] sm:text-xs font-black animate-pulse flex items-center gap-1 whitespace-normal break-keep">
                                  <span>💣 시한폭탄 낙하 중! 빠르게 해체하세요!</span>
                                </span>
                              )}
                            </div>
                            <span className="text-base sm:text-xl font-black text-yellow-300 tracking-tight break-keep whitespace-normal leading-snug">
                              {currentProblem.question}
                            </span>
                            <span className="text-[10px] text-slate-300 font-bold mt-0.5 whitespace-normal break-keep">
                              🔹짧은바늘(시) · 🔸긴바늘(5분 단위)
                            </span>
                          </div>

                        </div>
                      ) : currentProblem.isMissingNumber ? (
                        <div className="flex items-center gap-1.5 flex-wrap justify-center text-center">
                          <span className="px-2 py-0.5 rounded bg-purple-900/80 border border-purple-400 text-purple-200 text-[10px] sm:text-xs font-black animate-pulse whitespace-nowrap">
                            🔍 빈칸 채우기
                          </span>
                          <span className="text-xl sm:text-3xl font-black text-yellow-300 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] whitespace-nowrap">
                            {currentProblem.question.split('□').map((part, pIdx, arr) => (
                              <React.Fragment key={pIdx}>
                                <span>{part}</span>
                                {pIdx < arr.length - 1 && (
                                  <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 mx-1 rounded-lg bg-purple-950/90 border-2 border-yellow-300 text-yellow-200 font-black shadow-[0_0_12px_rgba(250,204,21,0.6)] animate-bounce text-lg sm:text-2xl">
                                    ?
                                  </span>
                                )}
                              </React.Fragment>
                            ))}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap justify-center text-center">
                          <span className="text-xl sm:text-3xl font-black text-yellow-300 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] whitespace-nowrap">
                            {currentProblem.question} = ?
                          </span>
                          {isSubtraction && (
                            <span className="text-[10px] text-sky-300 font-extrabold bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-400/40 whitespace-nowrap">
                              ⚡ 쪼개지는 뺄셈
                            </span>
                          )}
                        </div>
                      )}
                      {!solvedAnswerDisplay && !currentProblem.clockQuestion && (
                        <span className="text-[10px] text-amber-200/90 font-bold truncate max-w-full">{currentProblem.readKr}</span>
                      )}
                      {steppingStoneHint && !solvedAnswerDisplay && (
                        <span className="mt-1 px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-400/80 text-emerald-200 text-[10px] sm:text-xs font-extrabold shadow-sm animate-fadeIn">
                          {steppingStoneHint}
                        </span>
                      )}
                    </div>
                  )}

                  <div className={`flex shrink-0 items-center gap-2 ${isWordProblem ? 'w-full justify-end sm:w-auto' : ''}`}>
                    {/* TTS 낭독 다시 듣기 버튼 */}
                    <button
                      type="button"
                      onClick={handleReplayTts}
                      title={isWordProblem ? '문제 다시 듣기' : '수식 소리 다시 듣기'}
                      className="relative pointer-events-auto flex-none p-1.5 sm:p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/50 text-amber-300 cursor-pointer active:scale-90 transition-transform"
                    >
                      {isWordProblem ? <span className="text-lg leading-none">🔊</span> : <Volume2 size={16} />}
                    </button>

                    {/* 수 모형(10개 묶음과 낱개) 또는 시계 읽기 힌트 돋보기 버튼 */}
                    <button
                      type="button"
                      onClick={() => {
                        playCardTapSound();
                        if (currentProblem.clockQuestion) {
                          showQuickTip(currentProblem);
                        } else {
                          setIsHintModalOpen(true);
                        }
                      }}
                      title={currentProblem.clockQuestion ? '시계 읽기 힌트 보기' : '수 모형 힌트 보기 (10개 묶음과 낱개)'}
                      className="relative pointer-events-auto flex-none p-1.5 sm:p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/60 text-cyan-300 cursor-pointer active:scale-90 transition-transform flex items-center gap-1 shadow-sm"
                    >
                      <Search size={16} className="text-cyan-300" />
                      <span className="hidden sm:inline text-xs font-black">
                        {currentProblem.clockQuestion ? '시계 힌트' : '수 모형'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단: 4지선다 숫자 보기 카드 */}
        <div className="flex-none p-2 sm:p-3 bg-slate-950/95 border-t border-amber-500/40 z-30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto">
            {currentOptions.map((choice, idx) => {
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
                ⭐ {childName} 대장님의 무결점 퍼펙트 요격! 보너스 EXP +20!
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 mb-1">
                퍼펙트 요격 클리어!
              </h2>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs sm:text-sm font-black mb-1.5 shadow-sm">
                🎉 {childName} 대장님, 멋진 완주 성공!
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
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4 max-w-sm">
            <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 text-xs sm:text-sm font-black flex items-center gap-1 shadow-sm">
              <Zap size={14} className="fill-cyan-400" />
              <span>EXP +{earnedExp} 획득</span>
            </span>
            {maxCombo >= 2 && (
              <span className="px-2.5 py-1 rounded-full bg-orange-950/80 border border-orange-400 text-yellow-300 text-xs font-black shadow-sm flex items-center gap-1 animate-pulse">
                <Flame size={13} className="text-orange-400 fill-orange-400" />
                <span>최대 {maxCombo} COMBO 달성!</span>
                {maxCombo >= 3 && <span className="text-orange-300">(피버 +15 EXP)</span>}
              </span>
            )}
            {reviveCount === 0 && (
              <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-400 text-amber-300 text-xs font-black shadow-sm">
                🏆 퍼펙트 보너스 포함!
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-400 text-purple-200 text-xs font-black shadow-sm flex items-center gap-1">
              <span>👑</span>
              <span>거대 보스 격파 완료!</span>
            </span>
            {isMecha && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 text-[11px] font-black">
                🤖 메카고질라 +20%
              </span>
            )}
          </div>

          {/* 신규 아토믹 파츠 / 칭호 획득 배너 */}
          {newRewardResult &&
            (newRewardResult.newlyUnlockedParts.length > 0 || newRewardResult.newlyUnlockedTitles.length > 0) && (
              <div className="w-full max-w-sm mb-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-amber-950/90 border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] animate-pulse text-center">
                <div className="text-[11px] font-black text-yellow-300 flex items-center justify-center gap-1 mb-1.5">
                  <Sparkles size={14} className="text-yellow-400 animate-spin" />
                  <span>✨ 신규 아토믹 보상 획득! ✨</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-bold">
                  {newRewardResult.newlyUnlockedParts.map((p) => (
                    <span
                      key={p.id}
                      className="px-2 py-0.5 rounded-md bg-yellow-500/20 border border-yellow-300 text-yellow-200 flex items-center gap-1 shadow-sm"
                    >
                      <span>{p.icon}</span>
                      <span>{p.name}</span>
                    </span>
                  ))}
                  {newRewardResult.newlyUnlockedTitles.map((t) => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-300 text-purple-200 flex items-center gap-1 shadow-sm"
                    >
                      <span>{t.badgeIcon}</span>
                      <span>[{t.title}]</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* 바톤 터치 액션 버튼 */}
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {/* 아토믹 격납고 바로가기 버튼 */}
            <button
              type="button"
              onClick={() => setIsHangarOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-600 hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-yellow-300/80 cursor-pointer"
            >
              <Trophy size={15} className="text-yellow-300" />
              <span>🏆 아토믹 격납고 (스킨/칭호 장착)</span>
            </button>

            {/* 언어 배틀이 아직 안 끝났다면: 바톤 터치 안내 버튼 */}
            {!isLanguageDoneToday && onGoToLanguage && (
              <button
                type="button"
                onClick={() => {
                  if (handleConfirmClear()) {
                    onGoToLanguage();
                  }
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
                if (handleConfirmClear() && onNextMathStage) {
                  onNextMathStage();
                }
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
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center p-2 shadow-xl shadow-amber-500/40">
              <img
                src={godzillaEvo.imageSrc}
                alt={godzillaEvo.name}
                className="w-full h-full object-contain grayscale opacity-75 animate-pulse"
              />
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
            ⚡ {godzillaEvo.shortName}에게 다시 힘을 줄까요?
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

      {/* 6. 수 모형(10개 묶음과 낱개) 힌트 모달 */}
      <MathBlockHintModal
        isOpen={isHintModalOpen}
        onClose={() => setIsHintModalOpen(false)}
        problem={currentProblem}
        childName={childName}
      />

      {/* 7. 아토믹 격납고 모달 */}
      <AtomicHangarModal
        isOpen={isHangarOpen}
        onClose={() => setIsHangarOpen(false)}
        childName={childName}
        onGearChanged={setEquippedGearState}
      />
    </div>
  );
};
