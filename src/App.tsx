import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { WordItem, GameState, UnlockedMonsterRecord, BattleStatus, RoarPowerResult, DailyDualQuest } from './types';
import { DEFAULT_WORDS, auditAndHealWords } from './data/words';
import { Header } from './components/Header';
import { GodzillaStage } from './components/GodzillaStage';
import { TriMatchingBoard } from './components/TriMatchingBoard';
import { BossMiniGame } from './components/BossMiniGame';
import { MathDefenseStage } from './components/MathDefenseStage';
import { TOTAL_MATH_STAGES } from './data/mathData';
import { ParentModal } from './components/ParentModal';
import { ReviewModal } from './components/ReviewModal';
import { EggGachaModal } from './components/EggGachaModal';
import { MonsterBookModal } from './components/MonsterBookModal';
import { VoiceAttackModal } from './components/VoiceAttackModal';
import { MiniComboModal } from './components/MiniComboModal';
import { AttendanceModal } from './components/AttendanceModal';
import { GoldenChestModal } from './components/LuckyEggGachaModal';
import { useAttendance, setStoredAttendanceRecords, getTodayDateStr } from './hooks/useAttendance';
import {
  getStoredUnlockedMonsters,
  setStoredUnlockedMonsters,
  deductOneEachForCodexExchange,
  MONSTER_CARDS,
  MONSTER_MAP,
  getStoredEquippedPartner,
  setStoredEquippedPartner,
  STORAGE_KEY_EQUIPPED_PARTNER,
} from './data/monsterData';
import confetti from 'canvas-confetti';
import { playVictoryFanfare } from './utils/soundEffects';
import {
  loadCoupons,
  setStoredCoupons,
  setStoredWeeklyRewardClaimed,
  hasClaimedWeeklyReward as checkClaimedWeeklyReward,
  getCurrentWeekKey,
  hasClaimedCodexReward as getStoredHasClaimedCodexReward,
  STORAGE_KEY_CODEX_REWARD,
} from './data/gachaRewards';
import {
  fetchPlayerDataFromFirestore,
  savePlayerDataToFirestore,
  resetAllPlayerDataToFirestore,
} from './firebase';
import { getRandomRaidBoss, type RaidBossInfo } from './data/raidBosses';

const STORAGE_KEY_WORDS = 'godzilla_language_words_v3';
const STORAGE_KEY_STATE = 'godzilla_language_state_v6';
const STORAGE_KEY_WRONG_WORDS = 'godzilla_wrong_words';
const STORAGE_KEY_VOICE_ENABLED = 'godzilla_voice_attack_enabled';
const STORAGE_KEY_EGG_COUNT = 'godzilla_egg_count';
const STORAGE_KEY_TREASURE_BOX = 'godzilla_treasure_box_count';
const STORAGE_KEY_CYCLE_COUNT = 'godzilla_cycle_count';
const STORAGE_KEY_INFINITE_MODE = 'godzilla_is_infinite_mode';
const STORAGE_KEY_STAGE_INDEX = 'godzilla_stage_index';
const STORAGE_KEY_DUAL_QUEST = 'godzilla_daily_dual_quest_v1';
const STORAGE_KEY_MATH_STAGE = 'godzilla_math_stage_index';
const STORAGE_KEY_WORDS_VERSION = 'godzilla_language_words_version';
const STORAGE_VERSION = 'v1.2';

// 한 스테이지(배틀)당 출제 단어 수
const WORDS_PER_ROUND = 6;

// 무한 마스터 모드용: 200개 단어 풀에서 중복 없이 무작위 6개 단어 랜덤 추출
const getRandomSixWords = (pool: WordItem[]): WordItem[] => {
  if (!pool || pool.length <= WORDS_PER_ROUND) return pool || [];
  const copy = [...pool];
  for (let i = copy.length - 1; i > copy.length - 1 - WORDS_PER_ROUND; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(copy.length - WORDS_PER_ROUND);
};

const normalizeWords = (items: unknown): WordItem[] => {
  if (!Array.isArray(items)) return [];
  const uniqueById = new Map<string, WordItem>();
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const word = item as Record<string, unknown>;
    const id = typeof word.id === 'string' ? word.id.trim() : word.id;
    if (!((typeof id === 'string' && id) || (typeof id === 'number' && Number.isFinite(id)))) continue;
    if (typeof word.ko !== 'string' || typeof word.en !== 'string' || typeof word.ja !== 'string') continue;
    const ko = word.ko.trim();
    const en = word.en.trim();
    const ja = word.ja.trim();
    if (!ko || !en || !ja || uniqueById.has(String(id))) continue;
    const jaKana = typeof word.jaKana === 'string' ? word.jaKana.trim() : undefined;
    uniqueById.set(String(id), { id, ko, en, ja, jaKana: jaKana || undefined });
  }
  return Array.from(uniqueById.values());
};

const dedupeWordsById = (items: WordItem[]) => normalizeWords(items);

const safeNonNegativeInteger = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;

const normalizeGameState = (value: unknown): GameState => {
  const saved = value && typeof value === 'object' ? value as Partial<GameState> : {};
  const storedExp = safeNonNegativeInteger(saved.exp);
  return {
    level: Math.max(1, safeNonNegativeInteger(saved.level, 1)) + Math.floor(storedExp / 100),
    exp: storedExp % 100,
    streak: safeNonNegativeInteger(saved.streak),
    cycleCount: safeNonNegativeInteger(saved.cycleCount),
  };
};

export function App() {
  // ─────────────────────────────────────────────
  // 1. 전체 단어 풀 (localStorage 우선, 없으면 DEFAULT_WORDS)
  // ─────────────────────────────────────────────
  const [words, setWords] = useState<WordItem[]>(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY_WORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = normalizeWords(parsed);
        if (normalized.length > 0) {
          // 200개 단어 전수 무결성 검수 및 뒤바뀐 언어 필드 자동 교정 (Auto Healing)
          const { healedWords, fixedCount, fixedDetails } = auditAndHealWords(normalized, DEFAULT_WORDS);
          if (fixedCount > 0) {
            console.log(`[Auto Word Audit] ${fixedCount}개 단어 무결성 교정 완료:`, fixedDetails);
          }

          // 기본 단어 맵 구축 (ID 문자열 및 숫자 프리픽스 양방향 매핑)
          const defaultMap = new Map<string, WordItem>();
          DEFAULT_WORDS.forEach((w) => {
            defaultMap.set(String(w.id), w);
            defaultMap.set(String(w.id).replace(/^w/, ''), w);
          });

          // 기본 단어의 표준 데이터 및 교정 예문 병합
          const merged = healedWords.map((item: WordItem) => {
            const idStr = String(item.id);
            const def = defaultMap.get(idStr) || defaultMap.get(idStr.replace(/^w/, ''));
            if (def) {
              return {
                ...def,
                krSentence: def.krSentence || item.krSentence,
                enSentence: def.enSentence || item.enSentence,
                jpSentence: def.jpSentence || item.jpSentence,
                jpFurigana: def.jpFurigana || item.jpFurigana,
              };
            }
            return item;
          });

          try {
            if (
              localStorage.getItem(STORAGE_KEY_WORDS_VERSION) !== STORAGE_VERSION ||
              JSON.stringify(merged) !== saved ||
              fixedCount > 0
            ) {
              localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(merged));
              localStorage.setItem(STORAGE_KEY_WORDS_VERSION, STORAGE_VERSION);
            }
          } catch (e) {
            console.error('Failed to migrate words:', e);
          }
          return merged;
        }
      }
    } catch (e) {
      console.error('Failed to load words:', e);
    }
    if (saved) {
      try {
        localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(DEFAULT_WORDS));
        localStorage.setItem(STORAGE_KEY_WORDS_VERSION, STORAGE_VERSION);
      } catch (e) {
        console.error('Failed to repair words:', e);
      }
    }
    return DEFAULT_WORDS;
  });

  // ─────────────────────────────────────────────
  // 2. 스테이지(라운드) 및 회독(Cycle) 상태
  // ─────────────────────────────────────────────
  const [cycleCount, setCycleCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CYCLE_COUNT);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 1) return parsed;
      }
    } catch {}
    return 1;
  });

  const [isInfiniteMode, setIsInfiniteMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INFINITE_MODE);
      if (saved !== null) return saved === 'true';
      const savedCycle = localStorage.getItem(STORAGE_KEY_CYCLE_COUNT);
      if (savedCycle && parseInt(savedCycle, 10) >= 2) return true;
    } catch {}
    return false;
  });

  const [stageIndex, setStageIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STAGE_INDEX);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch {}
    return 0;
  });

  // ─────────────────────────────────────────────
  // 2-2. 일일 듀얼 훈련(Daily Dual Quest) 및 산수 스테이지 상태
  // ─────────────────────────────────────────────
  const [dailyDualQuest, setDailyDualQuest] = useState<DailyDualQuest>(() => {
    const today = getTodayDateStr();
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DUAL_QUEST);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.date === today) {
          return {
            date: today,
            languageDone: Boolean(parsed.languageDone),
            mathDone: Boolean(parsed.mathDone),
          };
        }
      }
    } catch {}
    return { date: today, languageDone: false, mathDone: false };
  });

  const [activeMode, setActiveMode] = useState<'language' | 'math'>('language');

  const [mathStageIndex, setMathStageIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MATH_STAGE);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch {}
    return 0;
  });

  const [mathSessionId, setMathSessionId] = useState(0);
  const mathStageNum = (mathStageIndex % TOTAL_MATH_STAGES) + 1;

  // 일일 퀘스트 날짜 변경 시 자동 리셋
  useEffect(() => {
    const today = getTodayDateStr();
    if (dailyDualQuest.date !== today) {
      const resetQuest: DailyDualQuest = { date: today, languageDone: false, mathDone: false };
      setDailyDualQuest(resetQuest);
      try {
        localStorage.setItem(STORAGE_KEY_DUAL_QUEST, JSON.stringify(resetQuest));
      } catch {}
    }
  }, [dailyDualQuest.date]);

  // 배틀 세션 고유 ID (스테이지 변경 및 재도전/부활 시 카드 독립 셔플 강제 갱신용)
  const [battleSessionId, setBattleSessionId] = useState(0);

  // 34스테이지(200단어) 1회독 완주 세리머니 & 마스터 보상 모달 상태
  const [isCycleCompletionModalOpen, setIsCycleCompletionModalOpen] = useState(false);
  const [hasAwardedCycleReward, setHasAwardedCycleReward] = useState(false);

  // 부모 입력 단어인지 여부: DEFAULT_WORDS의 id 집합과 다르면 "커스텀(숙제) 모드"
  const isCustomWords = useMemo(() => {
    const defaultIds = new Set(DEFAULT_WORDS.map((w) => w.id));
    return words.some((w) => !defaultIds.has(w.id)) || words.length !== DEFAULT_WORDS.length;
  }, [words]);

  // 0. 안전한 단어 원본 (words가 비었거나 손상되었을 때 DEFAULT_WORDS 즉시 폴백)
  const safeWords = useMemo<WordItem[]>(() => {
    if (Array.isArray(words) && words.length > 0) {
      const valid = words.filter((w) => w && w.id && w.ko && w.en && w.ja);
      if (valid.length > 0) return valid;
    }
    return DEFAULT_WORDS;
  }, [words]);

  // 전체 스테이지 수 (200개 단어 기준 6개씩 분할 시 34스테이지)
  const totalStages = Math.max(1, Math.ceil(safeWords.length / WORDS_PER_ROUND));

  // 현재 스테이지 번호 (1-based)
  const currentStageNum = (stageIndex % totalStages) + 1;

  // [중요] 단어 출제 방식:
  // - 1회독 (순차 진도 모드: cycleCount === 1): 200개 단어 중 6개씩 순차 슬라이싱 ((stage - 1) * 6 ~ stage * 6)
  // - 2회독 이후 (무한 마스터 랜덤 모드: cycleCount >= 2): 200개 전체 단어 풀에서 중복 없이 무작위 6개 단어 랜덤 추출
  const stageWords = useMemo<WordItem[]>(() => {
    if (isInfiniteMode) {
      return getRandomSixWords(safeWords);
    }
    const safeIndex = stageIndex % totalStages;
    const startIndex = safeIndex * WORDS_PER_ROUND;
    const slice = safeWords.slice(startIndex, startIndex + WORDS_PER_ROUND);
    return slice.length > 0 ? slice : safeWords.slice(0, WORDS_PER_ROUND);
  }, [isInfiniteMode, safeWords, stageIndex, totalStages, battleSessionId, cycleCount]);

  // ─────────────────────────────────────────────
  // 3. 오답 단어 목록 (localStorage 연동 & 중복 제거)
  // ─────────────────────────────────────────────
  const [wrongWordList, setWrongWordList] = useState<WordItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WRONG_WORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return normalizeWords(parsed);
      }
    } catch (e) {
      console.error('Failed to load wrong words:', e);
    }
    return [];
  });

  const normalizedWrongWords = useMemo(() => dedupeWordsById(wrongWordList), [wrongWordList]);

  // ─────────────────────────────────────────────
  // 4. 오답 복습 배틀 & 레이드 모드 상태
  // ─────────────────────────────────────────────
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewWords, setReviewWords] = useState<WordItem[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  // 오답 복습 레이드 진입 팝업 및 알림 상태
  const [isRaidConfirmOpen, setIsRaidConfirmOpen] = useState(false);
  const [isEmptyWrongAlertOpen, setIsEmptyWrongAlertOpen] = useState(false);
  // 오답 복습 레이드 승리 결과 모달 오픈 상태
  const [isRaidVictoryModalOpen, setIsRaidVictoryModalOpen] = useState(false);
  // 오답 복습 레이드 승리 보상 중복 수령 방지
  const [hasClaimedReviewRaidReward, setHasClaimedReviewRaidReward] = useState(false);
  // 오답 복습 레이드 출현 보스 (5대 악역 보스 중 랜덤 1마리)
  const [currentRaidBoss, setCurrentRaidBoss] = useState<RaidBossInfo>(() => getRandomRaidBoss());

  // 현재 활성화된 단어 세트:
  // - 복습 모드이고 reviewWords에 단어가 있으면 reviewWords 사용
  // - 오답이 다 비워졌거나 레이드가 끝났거나 reviewWords가 비어있으면:
  //   지체 없이 즉시 메인 스테이지 단어(stageWords)를 정상 재할당하여 빈 화면/undefined 크래시를 원천 차단!
  const activeWords = useMemo<WordItem[]>(() => {
    if (isReviewMode && Array.isArray(reviewWords) && reviewWords.length > 0) {
      return reviewWords.slice(0, WORDS_PER_ROUND);
    }
    return stageWords.length > 0 ? stageWords : safeWords.slice(0, WORDS_PER_ROUND);
  }, [isReviewMode, reviewWords, stageWords, safeWords]);

  // 오답 복습 모드인데 복습 단어가 비워졌다면 isReviewMode 플래그를 자동으로 false 리셋하여 일반 배틀로 안전 복귀
  useEffect(() => {
    if (isReviewMode && (!reviewWords || reviewWords.length === 0)) {
      setIsReviewMode(false);
      setClearedIds([]);
      setGodzillaHp(100);
    }
  }, [isReviewMode, reviewWords]);

  // ─────────────────────────────────────────────
  // 5. 레벨 / EXP / 콤보 (GameState)
  // ─────────────────────────────────────────────
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      localStorage.removeItem('godzilla_language_state_v2');
      localStorage.removeItem('godzilla_language_state_v3');
      localStorage.removeItem('godzilla_language_state_v5');
      localStorage.removeItem('godzilla_language_words_v2');
      const saved = localStorage.getItem(STORAGE_KEY_STATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return normalizeGameState(parsed);
      }
    } catch (e) {
      console.error('Failed to load gameState:', e);
    }
    return normalizeGameState(null);
  });

  // ─────────────────────────────────────────────
  // 5-2. 괴수 도감 & 가챠 모달 상태 및 알 보유 수량
  // ─────────────────────────────────────────────
  const [unlockedMonsters, setUnlockedMonsters] = useState<Record<string, UnlockedMonsterRecord>>(() =>
    getStoredUnlockedMonsters()
  );
  // 서포트 파트너 괴수 상태 및 스킬 발동 연출 알림
  const [equippedPartnerId, setEquippedPartnerId] = useState<string | null>(() => getStoredEquippedPartner());
  const [partnerSkillNotice, setPartnerSkillNotice] = useState<{ message: string; icon: string; id: number } | null>(null);
  const partnerNoticeTimerRef = useRef<number | null>(null);
  const hasUsedPartnerShieldRef = useRef(false);
  const hasShownRodanHintRef = useRef(false);

  const triggerPartnerNotice = useCallback((message: string, icon: string) => {
    if (partnerNoticeTimerRef.current !== null) window.clearTimeout(partnerNoticeTimerRef.current);
    setPartnerSkillNotice({ message, icon, id: Date.now() });
    partnerNoticeTimerRef.current = window.setTimeout(() => {
      setPartnerSkillNotice(null);
      partnerNoticeTimerRef.current = null;
    }, 2200);
  }, []);

  const handleEquipPartner = useCallback((partnerId: string | null) => {
    setEquippedPartnerId(partnerId);
    setStoredEquippedPartner(partnerId);
    if (partnerId) {
      const monster = MONSTER_MAP.get(partnerId);
      if (monster) {
        triggerPartnerNotice(`${monster.ko} 동행 시작! [${monster.partnerSkill.name}]`, monster.partnerSkill.icon);
      }
    }
  }, [triggerPartnerNotice]);

  const [isGachaOpen, setIsGachaOpen] = useState(false);
  const [isMonsterBookOpen, setIsMonsterBookOpen] = useState(false);
  // 한 스테이지당 알 부화 보상 1회 제한 상태
  const [hasClaimedStageReward, setHasClaimedStageReward] = useState(false);
  // 한 스테이지당 괴수 알 자동 지급 1회 제한 상태
  const [hasAwardedStageEgg, setHasAwardedStageEgg] = useState(false);
  // 도감 10종 완성 최고 보상(황금 보물상자) 수령 여부 (테스트 지원)
  const [hasClaimedCodexReward, setHasClaimedCodexReward] = useState<boolean>(() => {
    try {
      const resetDone = localStorage.getItem('godzilla_reset_codex_claimed_for_test_v1');
      if (!resetDone) {
        localStorage.setItem('godzilla_reset_codex_claimed_for_test_v1', 'true');
        localStorage.removeItem(STORAGE_KEY_CODEX_REWARD);
        return false;
      }
    } catch {}
    return getStoredHasClaimedCodexReward();
  });
  // 도감 10종 완성 축하 모달 오픈 상태
  const [isCodexCelebrationOpen, setIsCodexCelebrationOpen] = useState(false);

  // 알 보유 개수 (localStorage 연동, 미설정 시 기본 6개 충전)
  const [eggCount, setEggCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EGG_COUNT);
      if (saved !== null) {
        const parsed = Number(saved);
        if (Number.isSafeInteger(parsed) && parsed >= 0) return parsed;
      }
    } catch {}
    try {
      localStorage.setItem(STORAGE_KEY_EGG_COUNT, '6');
    } catch {}
    return 6;
  });
  const awardedStageEggsRef = useRef(new Set<number>());

  // 알 1개 소모
  const consumeEgg = useCallback(() => {
    setEggCount((prev) => {
      const next = Math.max(0, prev - 1);
      try {
        localStorage.setItem(STORAGE_KEY_EGG_COUNT, String(next));
      } catch {}
      savePlayerDataToFirestore({ eggCount: next });
      return next;
    });
  }, []);

  // 황금 보물상자 보유 개수 (localStorage 연동, 기본값: 1개)
  const [treasureBoxCount, setTreasureBoxCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TREASURE_BOX);
      if (saved !== null) {
        const count = parseInt(saved, 10);
        if (!isNaN(count) && count >= 0) return count;
      }
    } catch {}
    try {
      localStorage.setItem(STORAGE_KEY_TREASURE_BOX, '1');
    } catch {}
    return 1;
  });

  // 황금 보물상자 1개 소모
  const consumeTreasureBox = useCallback(() => {
    setTreasureBoxCount((prev) => {
      const next = Math.max(0, prev - 1);
      try {
        localStorage.setItem(STORAGE_KEY_TREASURE_BOX, String(next));
      } catch {}
      savePlayerDataToFirestore({ treasureBoxCount: next });
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EGG_COUNT, String(eggCount));
    } catch (e) {
      console.error('Failed to save egg count:', e);
    }
  }, [eggCount]);

  // ─────────────────────────────────────────────
  // 5-3. 음성 인식 포효 공격 모드 상태
  // ─────────────────────────────────────────────
  const [isVoiceAttackEnabled, setIsVoiceAttackEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOICE_ENABLED);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [targetWord, setTargetWord] = useState<WordItem | null>(null);
  const [comboWord, setComboWord] = useState<WordItem | null>(null);
  const pendingAttackRef = useRef<{
    id: string | number;
    isCritical: boolean;
    roarPower?: RoarPowerResult | null;
  } | null>(null);
  const [isCriticalHit, setIsCriticalHit] = useState(false);
  const [activeRoarPower, setActiveRoarPower] = useState<RoarPowerResult | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState(false);

  // ─────────────────────────────────────────────
  // 5-4. 주간 출석부 및 스트릭 관리
  // ─────────────────────────────────────────────
  const {
    records,
    setRecords,
    isTodayAttended,
    currentStreak: attendanceStreak,
    maxStreak: maxAttendanceStreak,
    weekDays,
    weekAttendedCount,
    checkTodayAttendance,
    hasClaimedWeeklyReward,
    setHasClaimedWeeklyReward,
    claimWeeklyReward,
  } = useAttendance();
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceInitialShowCoupons, setAttendanceInitialShowCoupons] = useState(false);
  const [unusedCouponCount, setUnusedCouponCount] = useState(() => {
    return loadCoupons().filter((c) => !c.isUsed && c.minutes > 0).length;
  });
  const refreshCouponCount = useCallback(() => {
    setUnusedCouponCount(loadCoupons().filter((c) => !c.isUsed && c.minutes > 0).length);
  }, []);
  const [isNewlyAttendedToday, setIsNewlyAttendedToday] = useState(false);
  const [isGoldenChestOpen, setIsGoldenChestOpen] = useState(false);
  const [goldenChestSource, setGoldenChestSource] = useState<'attendance' | 'codex'>('attendance');

  // ─────────────────────────────────────────────
  // 5-5. Firebase Firestore 연동 & 초기 동기화
  // ─────────────────────────────────────────────
  const isFirestoreInitialized = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const initFirestore = async () => {
      if (isFirestoreInitialized.current) return;
      isFirestoreInitialized.current = true;

      try {
        const remoteData = await fetchPlayerDataFromFirestore();
        if (!isMounted) return;

        if (remoteData) {
          // 1. 레벨 / 경험치 반영
          if (remoteData.gameState && typeof remoteData.gameState.level === 'number') {
            setGameState(remoteData.gameState);
            try {
              localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(remoteData.gameState));
            } catch {}
          }
          // 3. 알 개수 반영
          if (typeof remoteData.eggCount === 'number') {
            setEggCount(remoteData.eggCount);
            try {
              localStorage.setItem(STORAGE_KEY_EGG_COUNT, String(remoteData.eggCount));
            } catch {}
          }
          // 4. 출석 체크 기록 반영 (로컬과 병합)
          if (Array.isArray(remoteData.attendanceRecords)) {
            setRecords(remoteData.attendanceRecords);
            setStoredAttendanceRecords(remoteData.attendanceRecords);
          }
          // 4-1. 괴수 도감 반영
          if (remoteData.unlockedMonsters && typeof remoteData.unlockedMonsters === 'object') {
            setStoredUnlockedMonsters(remoteData.unlockedMonsters);
            setUnlockedMonsters(remoteData.unlockedMonsters);
          }
          // 5. 이번 주 주간 보상 수령 상태 반영
          if (remoteData.weeklyRewardClaimedWeek) {
            setStoredWeeklyRewardClaimed(remoteData.weeklyRewardClaimedWeek);
            const currentWeek = getCurrentWeekKey();
            setHasClaimedWeeklyReward(remoteData.weeklyRewardClaimedWeek === currentWeek);
          }
          // 6. 획득 쿠폰 목록 반영 (ID 기준 병합)
          if (Array.isArray(remoteData.coupons)) {
            const localCoupons = loadCoupons();
            const couponMap = new Map();
            localCoupons.forEach((c) => couponMap.set(c.id, c));
            remoteData.coupons.forEach((c) => couponMap.set(c.id, c));
            const mergedCoupons = Array.from(couponMap.values());
            setStoredCoupons(mergedCoupons);
            refreshCouponCount();
          }
          // 7. 도감 10종 완성 보상 수령 상태 반영
          if (typeof remoteData.hasClaimedCodexReward === 'boolean') {
            const resetDone = localStorage.getItem('godzilla_reset_codex_claimed_for_test_v1');
            const finalClaimed = resetDone ? remoteData.hasClaimedCodexReward : false;
            setHasClaimedCodexReward(finalClaimed);
            try {
              localStorage.setItem(STORAGE_KEY_CODEX_REWARD, String(finalClaimed));
            } catch {}
          }
          // 8. 황금 보물상자 보유량 반영 (기존 테스트로 비정상 부풀려진 6개 이상 등 비정상 값을 1개로 1회 강제 교정)
          if (typeof remoteData.treasureBoxCount === 'number') {
            let count = remoteData.treasureBoxCount;
            const fixApplied = localStorage.getItem('godzilla_force_fix_1_box_welcome_v1');
            if (!fixApplied) {
              count = 1;
              localStorage.setItem('godzilla_force_fix_1_box_welcome_v1', 'true');
              savePlayerDataToFirestore({ treasureBoxCount: 1 });
            }
            setTreasureBoxCount(count);
            try {
              localStorage.setItem(STORAGE_KEY_TREASURE_BOX, String(count));
            } catch {}
          }
          // 9. 회독(cycleCount), 무한 모드(isInfiniteMode), 스테이지(stageIndex) 반영
          if (typeof remoteData.cycleCount === 'number') {
            setCycleCount(remoteData.cycleCount);
            try {
              localStorage.setItem(STORAGE_KEY_CYCLE_COUNT, String(remoteData.cycleCount));
            } catch {}
          }
          if (typeof remoteData.isInfiniteMode === 'boolean') {
            setIsInfiniteMode(remoteData.isInfiniteMode);
            try {
              localStorage.setItem(STORAGE_KEY_INFINITE_MODE, String(remoteData.isInfiniteMode));
            } catch {}
          }
          if (typeof remoteData.stageIndex === 'number') {
            setStageIndex(remoteData.stageIndex);
            try {
              localStorage.setItem(STORAGE_KEY_STAGE_INDEX, String(remoteData.stageIndex));
            } catch {}
          }
          // 10. 서포트 파트너 반영
          if (remoteData.equippedPartnerId !== undefined) {
            setEquippedPartnerId(remoteData.equippedPartnerId);
            setStoredEquippedPartner(remoteData.equippedPartnerId);
          }
          // 11. 일일 듀얼 퀘스트 및 산수 스테이지 반영
          if (remoteData.dailyDualQuest && typeof remoteData.dailyDualQuest === 'object') {
            const today = getTodayDateStr();
            const q = remoteData.dailyDualQuest as Partial<DailyDualQuest>;
            if (q.date === today) {
              setDailyDualQuest((prev) => {
                const merged: DailyDualQuest = {
                  date: today,
                  languageDone: prev.languageDone || Boolean(q.languageDone),
                  mathDone: prev.mathDone || Boolean(q.mathDone),
                };
                try {
                  localStorage.setItem(STORAGE_KEY_DUAL_QUEST, JSON.stringify(merged));
                } catch {}
                return merged;
              });
            }
          }
          if (typeof remoteData.mathStageIndex === 'number') {
            setMathStageIndex(remoteData.mathStageIndex);
            try {
              localStorage.setItem(STORAGE_KEY_MATH_STAGE, String(remoteData.mathStageIndex));
            } catch {}
          }
        } else {
          // Firestore 문서가 아직 없으면 현재 로컬스토리지 데이터를 최초 백업
          const localMonsters = getStoredUnlockedMonsters();
          const localCoupons = loadCoupons();
          const currentWeekClaimed = checkClaimedWeeklyReward() ? getCurrentWeekKey() : null;
          await savePlayerDataToFirestore({
            gameState,
            eggCount,
            treasureBoxCount: 1,
            attendanceRecords: records,
            weeklyRewardClaimedWeek: currentWeekClaimed,
            unlockedMonsters: localMonsters,
            coupons: localCoupons,
            hasClaimedCodexReward: getStoredHasClaimedCodexReward(),
            cycleCount,
            isInfiniteMode,
            stageIndex,
            equippedPartnerId: getStoredEquippedPartner(),
            dailyDualQuest,
            mathStageIndex,
          });
        }
      } catch (err) {
        console.warn('[Firestore] Sync initialization error (fallback to localStorage):', err);
      } finally {
        if (isMounted) {
          isFirestoreInitialized.current = true;
        }
      }
    };

    initFirestore();

    return () => {
      isMounted = false;
    };
  }, []);

  // 음성 공격 모드 ON/OFF 토글
  const handleToggleVoiceAttack = useCallback(() => {
    setIsVoiceAttackEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_VOICE_ENABLED, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save voice attack setting:', e);
      }
      return next;
    });
  }, []);

  // 스테이지 번호가 변경되거나 모드가 바뀔 때 보상 수령 및 알 지급 상태 초기화
  useEffect(() => {
    setHasAwardedStageEgg(false);
    setHasClaimedStageReward(false);
    hasUsedPartnerShieldRef.current = false;
    hasShownRodanHintRef.current = false;
  }, [stageIndex, isReviewMode, battleSessionId]);

  // 도감 상태 최신화 (Header의 괴수 도감 N/10 카운트 즉시 갱신)
  const refreshUnlockedMonsters = useCallback(() => {
    setUnlockedMonsters(getStoredUnlockedMonsters());
  }, []);

  // 중복 획득 시 보너스 EXP 지급 (+30 EXP)
  const handleAddBonusExp = useCallback((amount: number) => {
    setGameState((prev) => {
      const totalExp = prev.exp + amount;
      const levelGain = Math.floor(totalExp / 100);
      const nextState = {
        ...prev,
        level: prev.level + levelGain,
        exp: totalExp % 100,
      };
      if (isFirestoreInitialized.current) {
        savePlayerDataToFirestore({ gameState: nextState });
      }
      return nextState;
    });
  }, []);

  // 알 깨기 가챠 보상 획득 시 실시간 도감 및 EXP 동기화 & 보상 수령 완료 처리
  const handleRewardCollected = useCallback(
    (_monster: unknown, isNew: boolean) => {
      setHasClaimedStageReward(true);
      refreshUnlockedMonsters();
      if (!isNew) {
        handleAddBonusExp(30);
      }
    },
    [refreshUnlockedMonsters, handleAddBonusExp]
  );

  // 보상 중복 획득 방어 오픈 핸들러
  const handleOpenGacha = useCallback(() => {
    if (hasClaimedStageReward) return;
    setIsGachaOpen(true);
  }, [hasClaimedStageReward]);

  const handleSetLevel = useCallback((newLevel: number) => {
    const nextState: GameState = { level: Math.max(1, Math.floor(newLevel)), exp: 0, streak: 0 };
    setGameState(nextState);
    try {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(nextState));
    } catch (e) {
      console.error('Failed to save gameState:', e);
    }
    savePlayerDataToFirestore({ gameState: nextState });
  }, []);

  // gameState → localStorage 및 Firestore 동기화
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(gameState));
    } catch (e) {
      console.error('Failed to save gameState:', e);
    }
    if (isFirestoreInitialized.current) {
      savePlayerDataToFirestore({ gameState });
    }
  }, [gameState]);

  // ─────────────────────────────────────────────
  // 6. 배틀 상태
  // ─────────────────────────────────────────────
  const [godzillaHp, setGodzillaHp] = useState(100);
  const [clearedIds, setClearedIds] = useState<(string | number)[]>([]);
  const [battleStatus, setBattleStatus] = useState<BattleStatus>('PLAYING');
  const battleStatusRef = useRef<BattleStatus>('PLAYING');
  const attackedIdsRef = useRef(new Set<string | number>());
  const [isShootingBeam, setIsShootingBeam] = useState(false);
  const attackTimerRef = useRef<number | null>(null);
  const [isGhidorahAttacking, setIsGhidorahAttacking] = useState(false);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [bonusBossDamage, setBonusBossDamage] = useState(0);

  // 라돈 장착 시 스테이지 시작 직후 첫 단어 힌트 안내
  useEffect(() => {
    if (equippedPartnerId === 'rodan' && !hasShownRodanHintRef.current && activeWords.length > 0 && battleStatus === 'PLAYING') {
      hasShownRodanHintRef.current = true;
      triggerPartnerNotice('라돈의 초음속 비행! 첫 번째 단어 힌트 발동!', '🦅');
    }
  }, [equippedPartnerId, activeWords, battleStatus, stageIndex, triggerPartnerNotice]);

  const resetBattle = useCallback(() => {
    if (attackTimerRef.current !== null) {
      window.clearTimeout(attackTimerRef.current);
      attackTimerRef.current = null;
    }
    battleStatusRef.current = 'PLAYING';
    setBattleStatus('PLAYING');
    setIsShootingBeam(false);
    setIsCriticalHit(false);
    setActiveRoarPower(null);
    setIsScreenShaking(false);
    setIsVoiceModalOpen(false);
    setTargetWord(null);
    setComboWord(null);
    pendingAttackRef.current = null;
    setClearedIds([]);
    attackedIdsRef.current.clear();
    setGodzillaHp(100);
    setBonusBossDamage(0);
  }, []);

  useEffect(() => () => {
    if (attackTimerRef.current !== null) window.clearTimeout(attackTimerRef.current);
  }, []);

  // 킹 기도라 HP: 활성 단어 진행률에 1:1 비례 및 파트너 추가 데미지 반영
  const ghidorahHp = activeWords.length > 0
    ? Math.max(0, Math.round(((activeWords.length - clearedIds.length) / activeWords.length) * 100) - bonusBossDamage)
    : 0;

  // 오답 데미지
  const damagePerHit = activeWords.length > 0 ? Math.ceil(100 / activeWords.length) : 20;

  // ─────────────────────────────────────────────
  // 7. 새 단어 저장 (부모 모달)
  // ─────────────────────────────────────────────
  const handleSaveWords = useCallback((newWords: WordItem[]) => {
    const normalized = normalizeWords(newWords);
    if (normalized.length === 0) return;
    const { healedWords } = auditAndHealWords(normalized, DEFAULT_WORDS);
    setWords(healedWords);
    setStageIndex(0);
    setCycleCount(1);
    setIsInfiniteMode(false);
    setHasAwardedCycleReward(false);
    setIsReviewMode(false);
    resetBattle();
    awardedStageEggsRef.current.clear();
    setClearedIds([]);
    setGodzillaHp(100);
    setBattleSessionId((prev) => prev + 1);
    try {
      localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(healedWords));
      localStorage.setItem(STORAGE_KEY_WORDS_VERSION, STORAGE_VERSION);
      localStorage.setItem(STORAGE_KEY_CYCLE_COUNT, '1');
      localStorage.setItem(STORAGE_KEY_INFINITE_MODE, 'false');
      localStorage.setItem(STORAGE_KEY_STAGE_INDEX, '0');
    } catch (e) {
      console.error('Failed to save words:', e);
    }
    savePlayerDataToFirestore({
      cycleCount: 1,
      isInfiniteMode: false,
      stageIndex: 0,
    });
  }, [resetBattle]);

  // ─────────────────────────────────────────────
  // 7-2. 전체 데이터 초기화 (Ground Zero 리셋)
  // ─────────────────────────────────────────────
  const handleResetAllData = useCallback(async () => {
    const confirmed = window.confirm('정말 모든 학습 기록과 도감을 지우고 처음부터 시작할까요?');
    if (!confirmed) return;

    // 1) localStorage 내 앱 관련 모든 캐시 키 삭제
    try {
      const keysToRemove = [
        STORAGE_KEY_STATE,
        STORAGE_KEY_EGG_COUNT,
        STORAGE_KEY_TREASURE_BOX,
        STORAGE_KEY_CYCLE_COUNT,
        STORAGE_KEY_INFINITE_MODE,
        STORAGE_KEY_STAGE_INDEX,
        STORAGE_KEY_WRONG_WORDS,
        STORAGE_KEY_CODEX_REWARD,
        STORAGE_KEY_EQUIPPED_PARTNER,
        STORAGE_KEY_DUAL_QUEST,
        STORAGE_KEY_MATH_STAGE,
        'godzilla_unlocked_monsters',
        'godzilla_earned_coupons',
        'godzilla_attendance_records',
        'godzilla_weekly_reward_claimed_week',
        'godzilla_weekly_reward_claimed',
        'godzilla_language_state_v2',
        'godzilla_language_state_v3',
        'godzilla_language_state_v5',
        'godzilla_language_words_v2',
        'godzilla_reset_codex_claimed_for_test_v1',
        'godzilla_add_5_boxes_prob_test_v1',
        'godzilla_add_5_boxes_prob_test_remote_v1',
      ];
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // 알(0개), 황금 보물상자(1개 웰컴 선물), 사이클(1), 스테이지(0) 기본값 보장
      localStorage.setItem(STORAGE_KEY_EGG_COUNT, '0');
      localStorage.setItem(STORAGE_KEY_TREASURE_BOX, '1');
      localStorage.setItem(STORAGE_KEY_CYCLE_COUNT, '1');
      localStorage.setItem(STORAGE_KEY_INFINITE_MODE, 'false');
      localStorage.setItem(STORAGE_KEY_STAGE_INDEX, '0');
      localStorage.setItem(STORAGE_KEY_MATH_STAGE, '0');
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify({ level: 1, exp: 0, streak: 0 }));
      localStorage.setItem(STORAGE_KEY_WRONG_WORDS, JSON.stringify([]));
      localStorage.setItem('godzilla_unlocked_monsters', JSON.stringify({}));
      localStorage.setItem('godzilla_earned_coupons', JSON.stringify([]));
      localStorage.setItem('godzilla_attendance_records', JSON.stringify([]));
    } catch (e) {
      console.error('Failed to clear local storage:', e);
    }

    // 2) Firestore 유저 문서(User Document) 필드들을 초기값 객체로 setDoc (덮어쓰기)
    try {
      await resetAllPlayerDataToFirestore({
        gameState: { level: 1, exp: 0, streak: 0 },
        eggCount: 0,
        treasureBoxCount: 1,
        attendanceRecords: [],
        weeklyRewardClaimedWeek: null,
        unlockedMonsters: {},
        coupons: [],
        wrongWordList: [],
        hasClaimedCodexReward: false,
        cycleCount: 1,
        isInfiniteMode: false,
        stageIndex: 0,
        mathStageIndex: 0,
        equippedPartnerId: null,
      });
    } catch (e) {
      console.error('Failed to reset Firestore user document:', e);
    }

    // 3) 앱의 모든 React State를 기본값으로 갱신 후 화면 자동 새로고침
    setGameState({ level: 1, exp: 0, streak: 0 });
    setEggCount(0);
    setTreasureBoxCount(1);
    setUnlockedMonsters({});
    setEquippedPartnerId(null);
    setWrongWordList([]);
    setRecords([]);
    setHasClaimedWeeklyReward(false);
    setHasClaimedCodexReward(false);
    setCycleCount(1);
    setIsInfiniteMode(false);
    setStageIndex(0);
    setClearedIds([]);
    setGodzillaHp(100);

    window.location.reload();
  }, [setRecords, setHasClaimedWeeklyReward]);

  // ─────────────────────────────────────────────
  // 8. 실제 공격 실행 (일반 공격 또는 음성 포효 크리티컬 공격)
  // ─────────────────────────────────────────────
  const executeAttack = useCallback(
    (matchedId: string | number, isCritical: boolean, roarPower?: RoarPowerResult | null) => {
      if (battleStatusRef.current !== 'PLAYING' || !activeWords.some((word) => word.id === matchedId) || attackedIdsRef.current.has(matchedId)) return;
      attackedIdsRef.current.add(matchedId);
      const isFinalHit = attackedIdsRef.current.size === activeWords.length;
      if (isFinalHit) {
        battleStatusRef.current = 'FINISHING';
        setBattleStatus('FINISHING');
      }
      // 일반 공격: 기본 25 EXP (피버 50 EXP)
      // 음성 포효 크리티컬 공격: 기본 60 EXP (피버 85 EXP)
      setIsCriticalHit(isCritical);
      setActiveRoarPower(roarPower || null);
      setIsShootingBeam(true);

      // 슈퍼 포효 레벨 3 (PERFECT ATOMIC ROAR) 시 0.4초간 화면 진동 발동
      if (roarPower?.level === 'PERFECT') {
        setIsScreenShaking(true);
        window.setTimeout(() => {
          setIsScreenShaking(false);
        }, 400);
      }

      if (attackTimerRef.current !== null) window.clearTimeout(attackTimerRef.current);
      attackTimerRef.current = window.setTimeout(() => {
        attackTimerRef.current = null;
        setIsShootingBeam(false);
        setIsCriticalHit(false);
        setActiveRoarPower(null);
        if (isFinalHit && battleStatusRef.current === 'FINISHING') {
          battleStatusRef.current = 'CLEARED';
          setBattleStatus('CLEARED');
        }
      }, isCritical ? 1700 : 1200);

      setClearedIds((prev) => (prev.includes(matchedId) ? prev : [...prev, matchedId]));

      // 복습 모드: SRS 3단계 마스터리 시스템 (3회 성공 시 오답노트에서 완전 봉인/졸업)
      if (isReviewMode) {
        setWrongWordList((prev) => {
          const updated: WordItem[] = [];
          for (const item of prev) {
            if (item.id === matchedId) {
              const currentMastery = item.reviewMastery || 0;
              const nextMastery = currentMastery + 1;
              if (nextMastery < 3) {
                // 아직 3회 미만이면 마스터리 별점 카운트 1 증가 유지
                updated.push({
                  ...item,
                  reviewMastery: nextMastery,
                });
              } else {
                // 3회 달성: 오답노트에서 완전히 졸업/제거!
              }
            } else {
              updated.push(item);
            }
          }
          try {
            localStorage.setItem(STORAGE_KEY_WRONG_WORDS, JSON.stringify(updated));
          } catch (e) {
            console.error('Failed to update wrong words:', e);
          }
          savePlayerDataToFirestore({ wrongWordList: updated });
          return updated;
        });
      }

      // 1) 치비 고질라 패시브: [아기 고질라의 응원] - 매칭 성공 시 HP +5% 회복
      if (equippedPartnerId === 'chibi-godzilla') {
        setGodzillaHp((prev) => Math.min(100, prev + 5));
        triggerPartnerNotice('치비 고질라의 응원! HP +5% 회복!', '🫧');
      }

      // 2) 킹기도라 패시브: [전격 파워] - 3단어 매칭 성공 시 보스 추가 데미지 (+5%)
      if (equippedPartnerId === 'king-ghidorah' && attackedIdsRef.current.size === 3) {
        setBonusBossDamage((prev) => prev + 5);
        triggerPartnerNotice('킹기도라의 전격 파워! 보스 추가 데미지 5%!', '⚡');
      }

      let triggeredEvilGodzilla = false;

      setGameState((prev) => {
        // 3) 기본 고질라 패시브: [원조의 위엄] - 2연속부터 즉시 FEVER 돌입
        const isFeverHit = equippedPartnerId === 'classic-godzilla' ? prev.streak >= 1 : prev.streak >= 2;

        // 3-1) 이블 고질라 패시브: [악령의 일격] - 피버 모드 시 보스 추가 데미지 (+10%)
        if (equippedPartnerId === 'evil-godzilla' && isFeverHit) {
          triggeredEvilGodzilla = true;
        }

        let expReward = isCritical ? (isFeverHit ? 85 : 60) : isFeverHit ? 50 : 25;

        // 4) 고질라 -1.0 패시브: [압축 폭발] - 매칭 시 기본 EXP +10 추가
        if (equippedPartnerId === 'godzilla-minusone') {
          expReward += 10;
        }

        const totalExp = prev.exp + expReward;
        const levelGain = Math.floor(totalExp / 100);
        return {
          ...prev,
          level: prev.level + levelGain,
          exp: totalExp % 100,
          streak: prev.streak + 1,
        };
      });

      // 이블 고질라 보스 추가 데미지 및 토스트 알림 연출
      if (triggeredEvilGodzilla) {
        setBonusBossDamage((prev) => prev + 10);
        triggerPartnerNotice('🔥 이블 고질라: 악령의 일격 발동! 보스 추가 데미지 +10%!', '😈');
      }

      if (equippedPartnerId === 'godzilla-minusone') {
        triggerPartnerNotice('고질라 -1.0 압축 폭발! 보너스 EXP +10!', '💥');
      }
    },
    [activeWords, isReviewMode, equippedPartnerId, triggerPartnerNotice]
  );

  const handleComboComplete = useCallback(() => {
    const pending = pendingAttackRef.current;
    pendingAttackRef.current = null;
    setComboWord(null);
    setTargetWord(null);
    if (pending) executeAttack(pending.id, pending.isCritical, pending.roarPower);
  }, [executeAttack]);

  // ─────────────────────────────────────────────
  // 8-2. 정답 매칭 완료 핸들러 (음성 공격 모달 분기)
  // ─────────────────────────────────────────────
  const handleMatchComplete = useCallback(
    (matched: WordItem | string | number) => {
      if (battleStatusRef.current !== 'PLAYING' || pendingAttackRef.current) return;
      let wordObj: WordItem | undefined;

      if (typeof matched === 'object' && matched !== null && 'id' in matched) {
        wordObj = matched as WordItem;
      } else {
        const idStr = String(matched);
        wordObj =
          activeWords.find((w) => String(w.id) === idStr) ||
          stageWords.find((w) => String(w.id) === idStr) ||
          reviewWords.find((w) => String(w.id) === idStr) ||
          words.find((w) => String(w.id) === idStr);
      }

      if (!wordObj) {
        console.warn('Cannot find matched word for', matched);
        return;
      }

      pendingAttackRef.current = { id: wordObj.id, isCritical: false };
      setTargetWord(wordObj);

      if (isVoiceAttackEnabled) {
        // 포효 ON이면: 공격을 잠시 멈추고 음성인식 모달 오픈
        setIsVoiceModalOpen(true);
      } else {
        // 포효 OFF여도 회화 문장을 들은 뒤 일반 공격을 실행한다.
        setComboWord(wordObj);
      }
    },
    [isVoiceAttackEnabled, activeWords, stageWords, reviewWords, words]
  );

  // ─────────────────────────────────────────────
  // 9. 오답 핸들러 (오답노트 자동 수집 & 파트너 패시브 발동)
  // ─────────────────────────────────────────────
  const handleMatchFail = useCallback((failedIds?: (string | number)[]) => {
    if (battleStatusRef.current !== 'PLAYING') return;
    setIsGhidorahAttacking(true);
    setTimeout(() => setIsGhidorahAttacking(false), 1200);

    // 1) 모스라 패시브: [수호의 날개] - 한 판당 오답 1회 무료 방어 (하트 차감 1회 무효)
    if (equippedPartnerId === 'mothra' && !hasUsedPartnerShieldRef.current) {
      hasUsedPartnerShieldRef.current = true;
      triggerPartnerNotice('모스라의 수호의 날개! (오답 1회 무료 방어)', '🛡️');
      // 체력 차감 무효화
    } else if (equippedPartnerId === 'anguirus') {
      // 2) 안기라스 패시브: [단단한 갑옷] - 오답 시 데미지 50% 경감
      const reducedDamage = Math.max(1, Math.round(damagePerHit * 0.5));
      setGodzillaHp((prev) => Math.max(0, prev - reducedDamage));
      setGameState((prev) => ({ ...prev, streak: 0 }));
      triggerPartnerNotice('안기라스의 단단한 갑옷! 데미지 50% 경감!', '🛡️');
    } else {
      setGodzillaHp((prev) => Math.max(0, prev - damagePerHit));
      setGameState((prev) => ({ ...prev, streak: 0 }));
    }

    if (failedIds && failedIds.length > 0) {
      const currentList = isReviewMode ? reviewWords : stageWords;
      const failedItems = failedIds
        .map((id) => currentList.find((w) => w.id === id))
        .filter((w): w is WordItem => !!w);

      if (failedItems.length > 0) {
        setWrongWordList((prev) => {
          const existingIds = new Set(prev.map((w) => w.id));
          const newAdditions = failedItems.filter((w) => !existingIds.has(w.id));
          if (newAdditions.length === 0) return prev;
          const updated = dedupeWordsById([...prev, ...newAdditions]);
          try {
            localStorage.setItem(STORAGE_KEY_WRONG_WORDS, JSON.stringify(updated));
          } catch (e) {
            console.error('Failed to save wrong words:', e);
          }
          return updated;
        });
      }
    }
  }, [damagePerHit, isReviewMode, reviewWords, stageWords, equippedPartnerId, triggerPartnerNotice]);

  // ─────────────────────────────────────────────
  // 10. 게임 리셋 / 스테이지 진행
  // ─────────────────────────────────────────────
  const handleReviveGame = useCallback(() => {
    resetBattle();
    setGameState((prev) => ({ ...prev, streak: 0 }));
    setBattleSessionId((prev) => prev + 1);
  }, [resetBattle]);

  /** 다음 스테이지로 진행 */
  const handleNextStage = useCallback(() => {
    // 만약 1회독의 마지막 34스테이지를 클리어한 상태라면 완주 모달 오픈
    if (!isInfiniteMode && cycleCount === 1 && currentStageNum >= totalStages) {
      setIsCycleCompletionModalOpen(true);
      return;
    }

    resetBattle();
    setGodzillaHp(100);
    setClearedIds([]);
    setGameState((prev) => ({ ...prev, streak: 0 }));
    setBattleSessionId((prev) => prev + 1);

    if (isInfiniteMode) {
      // 무한 모드에서 34스테이지를 완료하면 회독(cycleCount) 증가 및 STAGE 1로 순환
      if (currentStageNum >= totalStages) {
        setCycleCount((prevCycle) => {
          const nextCycle = prevCycle + 1;
          try {
            localStorage.setItem(STORAGE_KEY_CYCLE_COUNT, String(nextCycle));
            localStorage.setItem(STORAGE_KEY_STAGE_INDEX, '0');
          } catch {}
          savePlayerDataToFirestore({ cycleCount: nextCycle, stageIndex: 0 });
          return nextCycle;
        });
        setStageIndex(0);
      } else {
        setStageIndex((prev) => {
          const next = prev + 1;
          try {
            localStorage.setItem(STORAGE_KEY_STAGE_INDEX, String(next));
          } catch {}
          savePlayerDataToFirestore({ stageIndex: next });
          return next;
        });
      }
    } else {
      setStageIndex((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem(STORAGE_KEY_STAGE_INDEX, String(next));
        } catch {}
        savePlayerDataToFirestore({ stageIndex: next });
        return next;
      });
    }
  }, [isInfiniteMode, cycleCount, currentStageNum, totalStages, resetBattle]);

  // 5스테이지마다 (5, 10, 15, 20, 25, 30, 34 스테이지) 보스 특화 미니게임 모드 활성화 여부
  const isBossStage = useMemo(() => {
    if (isReviewMode) return false;
    return currentStageNum % 5 === 0 || currentStageNum === 34;
  }, [isReviewMode, currentStageNum]);

  // 보스 미니게임 및 배틀 중 발생한 오답 단어 수집 핸들러
  const handleCollectWrongWord = useCallback((wrongItem: WordItem) => {
    if (!wrongItem || !wrongItem.id) return;
    setWrongWordList((prev) => {
      if (prev.some((w) => w.id === wrongItem.id)) return prev;
      const updated = dedupeWordsById([...prev, wrongItem]);
      try {
        localStorage.setItem(STORAGE_KEY_WRONG_WORDS, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save wrong words from boss minigame:', e);
      }
      savePlayerDataToFirestore({ wrongWordList: updated });
      return updated;
    });
  }, []);

  // 보스 특화 미니게임(운석 요격) 클리어 핸들러
  const handleBossMiniGameClear = useCallback(
    (bonusExp: number, bonusEggs: number = 1) => {
      // 1. 일일 듀얼 퀘스트 언어 배틀 완료 기록
      setDailyDualQuest((prev) => {
        if (prev.languageDone) return prev;
        const updated = { ...prev, languageDone: true };
        try {
          localStorage.setItem(STORAGE_KEY_DUAL_QUEST, JSON.stringify(updated));
        } catch {}
        savePlayerDataToFirestore({ dailyDualQuest: updated });
        return updated;
      });

      // 2. 파트너 패시브 버프 적용 (메카고질라: EXP +20%, 버닝고질라: 알 +1개)
      const isMecha = equippedPartnerId === 'mechagodzilla';
      const isBurning = equippedPartnerId === 'burning-godzilla';
      const finalExp = isMecha ? Math.max(bonusExp, Math.round(75 * 1.2)) : bonusExp;
      const finalEggs = isBurning ? Math.max(bonusEggs, 2) : bonusEggs;

      // 3. 보너스 EXP 지급
      setGameState((prev) => {
        const totalExp = prev.exp + finalExp;
        const levelGain = Math.floor(totalExp / 100);
        const nextState = {
          ...prev,
          level: prev.level + levelGain,
          exp: totalExp % 100,
        };
        try {
          localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(nextState));
        } catch {}
        savePlayerDataToFirestore({ gameState: nextState });
        return nextState;
      });

      // 4. 신비한 괴수 알 확정 지급 (황금 보물상자 대신 도감 부화용 알 지급)
      setEggCount((prev) => {
        const next = prev + finalEggs;
        try {
          localStorage.setItem(STORAGE_KEY_EGG_COUNT, String(next));
        } catch {}
        savePlayerDataToFirestore({ eggCount: next });
        return next;
      });

      // 5. 파트너 알림
      let noticeMsg = `보스 완전 격파! EXP +${finalExp}, 🥚 괴수 알 +${finalEggs}개 획득!`;
      if (isMecha && isBurning) {
        noticeMsg += ' (메카고질라 & 버닝고질라 보너스 적용!)';
      } else if (isMecha) {
        noticeMsg += ' (메카고질라 EXP +20% 보너스!)';
      } else if (isBurning) {
        noticeMsg += ' (버닝고질라 알 +1개 보너스!)';
      }
      triggerPartnerNotice(noticeMsg, '👑');

      // 6. 다음 스테이지로 진행
      handleNextStage();
    },
    [handleNextStage, triggerPartnerNotice, equippedPartnerId]
  );

  // 산수 특화 미니게임(운석 요격) 클리어 핸들러
  const handleMathStageClear = useCallback(
    (bonusExp: number) => {
      // 1. 파트너 패시브 버프 적용 (메카고질라: EXP +20% 반영된 bonusExp 수령)
      const isMecha = equippedPartnerId === 'mechagodzilla';
      const finalExp = bonusExp;

      // 2. 보너스 EXP 지급
      setGameState((prev) => {
        const totalExp = prev.exp + finalExp;
        const levelGain = Math.floor(totalExp / 100);
        const nextState = {
          ...prev,
          level: prev.level + levelGain,
          exp: totalExp % 100,
        };
        try {
          localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(nextState));
        } catch {}
        savePlayerDataToFirestore({ gameState: nextState });
        return nextState;
      });

      // 3. 일일 듀얼 퀘스트 산수 완료 기록
      setDailyDualQuest((prev) => {
        if (prev.mathDone) return prev;
        const updated = { ...prev, mathDone: true };
        try {
          localStorage.setItem(STORAGE_KEY_DUAL_QUEST, JSON.stringify(updated));
        } catch {}
        savePlayerDataToFirestore({ dailyDualQuest: updated });
        return updated;
      });

      // 4. 파트너 알림
      let noticeMsg = `산수 요격 완벽 성공! EXP +${finalExp} 획득!`;
      if (isMecha) {
        noticeMsg += ' (메카고질라 EXP +20% 보너스!)';
      }
      triggerPartnerNotice(noticeMsg, '⚡');
    },
    [triggerPartnerNotice, equippedPartnerId]
  );

  const handleNextMathStage = useCallback(() => {
    setMathStageIndex((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem(STORAGE_KEY_MATH_STAGE, String(next));
      } catch {}
      savePlayerDataToFirestore({ mathStageIndex: next });
      return next;
    });
    setMathSessionId((prev) => prev + 1);
  }, []);

  // ─────────────────────────────────────────────
  // 11. 오답 복습 레이드 배틀 핸들러
  // ─────────────────────────────────────────────
  const handleStartReviewBattle = useCallback(() => {
    if (normalizedWrongWords.length === 0) return;
    const deduped = dedupeWordsById(normalizedWrongWords);
    // 오답 목록에 저장되어 있던 단어들 셔플하여 출제
    const shuffled = [...deduped];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setReviewWords(shuffled);
    setIsReviewMode(true);
    setActiveMode('language');
    resetBattle();
    setGameState((prev) => ({ ...prev, streak: 0 }));
    setHasClaimedReviewRaidReward(false);
    setIsReviewModalOpen(false);
    setIsRaidConfirmOpen(false);
    setIsRaidVictoryModalOpen(false);
    setBattleSessionId((prev) => prev + 1);
  }, [normalizedWrongWords, resetBattle]);

  const handleExitReviewMode = useCallback(() => {
    setIsReviewMode(false);
    setReviewWords([]);
    resetBattle();
    setGameState((prev) => ({ ...prev, streak: 0 }));
    setHasClaimedReviewRaidReward(false);
    setIsReviewModalOpen(false);
    setIsRaidConfirmOpen(false);
    setIsRaidVictoryModalOpen(false);
    setBattleSessionId((prev) => prev + 1);
  }, [resetBattle]);

  // 오답 복습 레이드 완료 후 일반 모드 복귀 (오답노트 클리어 및 Firestore 동기화 포함)
  const handleReviewComplete = useCallback(() => {
    setIsReviewMode(false);
    setReviewWords([]);
    resetBattle();
    setGameState((prev) => ({ ...prev, streak: 0 }));
    setHasClaimedReviewRaidReward(false);
    setIsReviewModalOpen(false);
    setIsRaidConfirmOpen(false);
    setIsRaidVictoryModalOpen(false);
    setBattleSessionId((prev) => prev + 1);
    // 정답 처리된 단어는 이미 handleMatchSuccess에서 제거됨
    // wrongWordList가 완전히 비었을 수 있으므로 localStorage 및 Firestore 동기화
    setWrongWordList((prev) => {
      const deduped = dedupeWordsById(prev);
      try {
        localStorage.setItem(STORAGE_KEY_WRONG_WORDS, JSON.stringify(deduped));
      } catch (e) {
        console.error('Failed to sync wrong words on review complete:', e);
      }
      savePlayerDataToFirestore({ wrongWordList: deduped });
      return deduped;
    });
  }, [resetBattle]);

  const handleClearWrongWords = useCallback(() => {
    setWrongWordList([]);
    try {
      localStorage.removeItem(STORAGE_KEY_WRONG_WORDS);
    } catch (e) {
      console.error('Failed to clear wrong words:', e);
    }
    savePlayerDataToFirestore({ wrongWordList: [] });
  }, []);

  const handleRemoveWrongWord = useCallback((id: string | number) => {
    setWrongWordList((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_WRONG_WORDS, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update wrong words:', e);
      }
      savePlayerDataToFirestore({ wrongWordList: updated });
      return updated;
    });
  }, []);

  // ─────────────────────────────────────────────
  // 12. 승리 / 게임오버 판정
  // ─────────────────────────────────────────────
  const isAllCleared = activeWords.length > 0 && battleStatus === 'CLEARED';
  const isGameOver = godzillaHp <= 0;

  // 마지막 6번째 단어 격파 시 배틀 연출(고질라 열선 발사, 보스 피격, 보스 체력 0% 감소, 격파 쓰러짐)을
  // 약 1.8초 동안 온전히 보여준 뒤 스테이지 클리어 결과창 및 보상 효과를 활성화하기 위한 상태
  const [isStageClearReady, setIsStageClearReady] = useState(false);
  const [isFinishingStage, setIsFinishingStage] = useState(false);
  useEffect(() => {
    if (isAllCleared && !isGameOver) {
      setIsFinishingStage(true);
      const timer = setTimeout(() => {
        setIsStageClearReady(true);
        setIsFinishingStage(false);
      }, 1800);
      return () => clearTimeout(timer);
    } else {
      setIsStageClearReady(false);
      setIsFinishingStage(false);
    }
  }, [isAllCleared, isGameOver]);

  // 12-1. 일반 배틀 스테이지 클리어(승리) 시 메카고질라 EXP 보너스 판정 (알 지급은 일일 듀얼 훈련/보스/오답 레이드로 일원화)
  useEffect(() => {
    if (!isReviewMode && isStageClearReady && !isGameOver && !hasAwardedStageEgg) {
      setHasAwardedStageEgg(true);

      // 메카고질라 패시브: [에너지 증폭] - 스테이지 클리어 시 획득 EXP +20% 보너스
      if (equippedPartnerId === 'mechagodzilla') {
        setGameState((prev) => {
          const bonusExp = 30;
          const totalExp = prev.exp + bonusExp;
          const levelGain = Math.floor(totalExp / 100);
          return {
            ...prev,
            level: prev.level + levelGain,
            exp: totalExp % 100,
          };
        });
        triggerPartnerNotice('메카고질라 에너지 증폭! 클리어 보너스 EXP +20%!', '⚡');
      }
    }
  }, [isReviewMode, isStageClearReady, isGameOver, hasAwardedStageEgg, equippedPartnerId, triggerPartnerNotice]);

  // 12-2. 일반 배틀 스테이지 클리어 시 일일 듀얼 퀘스트 언어 배틀 완료 기록
  useEffect(() => {
    if (isStageClearReady && !isGameOver && !isReviewMode) {
      setDailyDualQuest((prev) => {
        if (prev.languageDone) return prev;
        const updated = { ...prev, languageDone: true };
        try {
          localStorage.setItem(STORAGE_KEY_DUAL_QUEST, JSON.stringify(updated));
        } catch {}
        savePlayerDataToFirestore({ dailyDualQuest: updated });
        return updated;
      });
    }
  }, [isStageClearReady, isGameOver, isReviewMode]);

  // 12-2b. 일일 듀얼 퀘스트(언어 + 산수) 2/2 완주 시 오늘의 출석 도장 쾅! & 괴수 알 확정 지급!
  useEffect(() => {
    if (dailyDualQuest.languageDone && dailyDualQuest.mathDone) {
      if (!isTodayAttended) {
        const attendanceResult = checkTodayAttendance();
        if (attendanceResult.isNewlyAttended) {
          setIsNewlyAttendedToday(true);

          // 버닝 고질라 패시브 (알 +1개 추가 버프, 총 2개)
          const isBurning = equippedPartnerId === 'burning-godzilla';
          const eggBonus = isBurning ? 2 : 1;

          setEggCount((prev) => {
            const next = prev + eggBonus;
            try {
              localStorage.setItem(STORAGE_KEY_EGG_COUNT, String(next));
            } catch {}
            savePlayerDataToFirestore({ eggCount: next });
            return next;
          });

          playVictoryFanfare();
          confetti({
            particleCount: 150,
            spread: 120,
            origin: { y: 0.4 },
            colors: ['#38bdf8', '#f59e0b', '#10b981', '#ef4444', '#a855f7'],
          });

          if (isBurning) {
            triggerPartnerNotice('🔥 버닝 고질라: 보너스 알 획득! (총 2개 지급)', '🔥');
          } else {
            triggerPartnerNotice(
              `🏆 일일 듀얼 훈련(언어+산수) 완주! 출석 도장 쾅! 🐾 🥚 알 +${eggBonus}개 획득!`,
              '🎉'
            );
          }

          const timer = window.setTimeout(() => {
            setIsAttendanceModalOpen(true);
          }, 800);
          return () => window.clearTimeout(timer);
        }
      }
    }
  }, [
    dailyDualQuest.languageDone,
    dailyDualQuest.mathDone,
    isTodayAttended,
    checkTodayAttendance,
    equippedPartnerId,
    triggerPartnerNotice,
  ]);

  // 12-3. 오답 복습 레이드 보스 격파 승리 시 괴수 알 +1 및 100 EXP 보상 지급 & Firestore 동기화
  useEffect(() => {
    if (isReviewMode && isStageClearReady && !isGameOver && !hasClaimedReviewRaidReward) {
      setHasClaimedReviewRaidReward(true);

      // 1. 괴수 알 1개 즉시 지급
      let nextEggCount = eggCount + 1;
      setEggCount((prev) => {
        nextEggCount = prev + 1;
        try {
          localStorage.setItem(STORAGE_KEY_EGG_COUNT, String(nextEggCount));
        } catch {}
        return nextEggCount;
      });

      // 2. 보너스 100 EXP 지급 및 레벨업 판정
      let nextLevel = gameState.level;
      let nextExp = gameState.exp;
      setGameState((prev) => {
        const totalExp = prev.exp + 100;
        const levelGain = Math.floor(totalExp / 100);
        nextLevel = prev.level + levelGain;
        nextExp = totalExp % 100;
        const updated = {
          ...prev,
          level: nextLevel,
          exp: nextExp,
        };
        try {
          localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // 3. Firestore 즉시 영구 동기화
      savePlayerDataToFirestore({
        eggCount: nextEggCount,
        gameState: {
          level: nextLevel,
          exp: nextExp,
          streak: gameState.streak,
        },
      });

      // 4. 승리 축하 모달 오픈 (상태 변경으로 인한 타이머 취소 방지)
      setIsRaidVictoryModalOpen(true);
    }
  }, [isReviewMode, isStageClearReady, isGameOver, hasClaimedReviewRaidReward, eggCount, gameState]);

  // 12-4. 도감 10종 완성 최고 보상(황금 보물상자) 교환 핸들러
  const handleClaimCodexReward = useCallback(() => {
    // 1. 황금 보물상자 보유량 +1 증가
    let nextBoxCount = treasureBoxCount + 1;
    setTreasureBoxCount((prev) => {
      nextBoxCount = prev + 1;
      try {
        localStorage.setItem(STORAGE_KEY_TREASURE_BOX, String(nextBoxCount));
      } catch {}
      return nextBoxCount;
    });

    // 2. 10종 괴수 카드의 보유 수량을 각각 1장씩 차감 (0장이 된 카드는 미발견 상태로 리셋)
    const updatedMonsters = deductOneEachForCodexExchange();
    setUnlockedMonsters(updatedMonsters);

    // 2-1. 장착 중인 파트너 괴수의 보유 수량이 0이 되었다면 안전하게 장착 자동 해제
    let nextPartnerId = equippedPartnerId;
    if (equippedPartnerId) {
      const partnerRecord = updatedMonsters[equippedPartnerId];
      if (!partnerRecord || (partnerRecord.count || 0) <= 0) {
        nextPartnerId = null;
        setEquippedPartnerId(null);
        setStoredEquippedPartner(null);
      }
    }

    // 3. 교환 완료 플래그 초기화 (다음번에 또 10종을 모으면 즉시 재교환 가능한 순환 구조)
    setHasClaimedCodexReward(false);
    try {
      localStorage.removeItem(STORAGE_KEY_CODEX_REWARD);
    } catch {}

    // 4. Firestore 영구 저장 (보물상자 증가, 차감된 도감, 교환 플래그 초기화, 파트너 상태)
    savePlayerDataToFirestore({
      treasureBoxCount: nextBoxCount,
      unlockedMonsters: updatedMonsters,
      hasClaimedCodexReward: false,
      equippedPartnerId: nextPartnerId,
    });

    // 5. 축하 사운드 & 콘페티
    playVictoryFanfare();
    confetti({
      particleCount: 160,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#fbbf24', '#f59e0b', '#ffffff', '#fde047', '#10b981', '#06b6d4'],
    });

    // 6. 축하 알림 팝업 오픈
    setIsCodexCelebrationOpen(true);
  }, [treasureBoxCount, equippedPartnerId]);

  // 12-5. 2회독 무한 마스터 모드 시작 핸들러
  const handleStartNextCycle = useCallback(() => {
    setIsCycleCompletionModalOpen(false);
    setIsInfiniteMode(true);
    setCycleCount(2);
    setStageIndex(0);
    setGodzillaHp(100);
    setClearedIds([]);
    setGameState((prev) => ({ ...prev, streak: 0 }));
    setBattleSessionId((prev) => prev + 1);

    try {
      localStorage.setItem(STORAGE_KEY_INFINITE_MODE, 'true');
      localStorage.setItem(STORAGE_KEY_CYCLE_COUNT, '2');
      localStorage.setItem(STORAGE_KEY_STAGE_INDEX, '0');
    } catch (e) {
      console.error('Failed to save next cycle state:', e);
    }

    savePlayerDataToFirestore({
      isInfiniteMode: true,
      cycleCount: 2,
      stageIndex: 0,
    });

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  // 12-6. 34스테이지(200단어 1회독) 최종 완주 세리머니 & 마스터 보상 (+1 황금 보물상자, +3 괴수 알)
  useEffect(() => {
    if (
      !isReviewMode &&
      isStageClearReady &&
      !isGameOver &&
      !isInfiniteMode &&
      cycleCount === 1 &&
      currentStageNum >= totalStages &&
      !hasAwardedCycleReward
    ) {
      setHasAwardedCycleReward(true);

      let nextBoxCount = treasureBoxCount + 1;
      let nextEggCount = eggCount + 3;

      setTreasureBoxCount((prev) => {
        nextBoxCount = prev + 1;
        try {
          localStorage.setItem(STORAGE_KEY_TREASURE_BOX, String(nextBoxCount));
        } catch {}
        return nextBoxCount;
      });

      setEggCount((prev) => {
        nextEggCount = prev + 3;
        try {
          localStorage.setItem(STORAGE_KEY_EGG_COUNT, String(nextEggCount));
        } catch {}
        return nextEggCount;
      });

      savePlayerDataToFirestore({
        treasureBoxCount: nextBoxCount,
        eggCount: nextEggCount,
      });

      playVictoryFanfare();
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#fbbf24', '#f59e0b', '#ffffff', '#38bdf8', '#a855f7', '#10b981'],
      });

      setIsCycleCompletionModalOpen(true);
    }
  }, [
    isReviewMode,
    isStageClearReady,
    isGameOver,
    isInfiniteMode,
    cycleCount,
    currentStageNum,
    totalStages,
    hasAwardedCycleReward,
    treasureBoxCount,
    eggCount,
  ]);

  // ─────────────────────────────────────────────
  // 스테이지 레이블 (승리 화면 & HUD에 표시)
  // ─────────────────────────────────────────────
  const stageLabel = activeMode === 'math'
    ? `산수 요격 STAGE ${mathStageNum}/${TOTAL_MATH_STAGES}`
    : isReviewMode
    ? `오답 괴수 레이드 (${currentRaidBoss.name})`
    : isInfiniteMode
    ? `👑 마스터 배틀 (${cycleCount}회독)`
    : isCustomWords
    ? `숙제 배틀 ${currentStageNum}/${totalStages}`
    : `STAGE ${currentStageNum} / ${totalStages}`;

  // 현재 스테이지 단어 범위 표시
  const currentStart = (stageIndex % totalStages) * WORDS_PER_ROUND + 1;
  const currentEnd = Math.min(currentStart + activeWords.length - 1, safeWords.length);
  const stageRangeLabel = !isReviewMode
    ? isInfiniteMode
      ? `전체 ${safeWords.length}단어 무작위 출제 🎲`
      : `전체 ${safeWords.length}개 중 ${currentStart}~${currentEnd}번 단어`
    : undefined;

  return (
    <div
      className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col select-none bg-slate-900 text-white font-sans"
      style={{
        height: '100dvh',
        maxHeight: '100dvh',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: battleStatus === 'FINISHING' ? 'none' : 'auto',
      }}
    >
      {/* 1. 상단 헤더 */}
      <Header
        level={gameState.level}
        exp={gameState.exp}
        streak={gameState.streak}
        wrongCount={normalizedWrongWords.length}
        isReviewMode={isReviewMode}
        stageLabel={stageLabel}
        onOpenParentModal={() => setIsParentModalOpen(true)}
        onOpenReviewModal={() => {
          if (normalizedWrongWords.length === 0) {
            setIsEmptyWrongAlertOpen(true);
          } else {
            // 오답 레이드 진입 시 5대 악역 보스 중 1종 랜덤 셔플 선택
            setCurrentRaidBoss(getRandomRaidBoss());
            setIsRaidConfirmOpen(true);
          }
        }}
        onOpenMonsterBook={() => setIsMonsterBookOpen(true)}
        onOpenAttendanceModal={() => {
          setIsNewlyAttendedToday(false);
          setAttendanceInitialShowCoupons(false);
          setIsAttendanceModalOpen(true);
        }}
        onOpenCouponModal={() => {
          setIsNewlyAttendedToday(false);
          setAttendanceInitialShowCoupons(true);
          setIsAttendanceModalOpen(true);
        }}
        unusedCouponCount={unusedCouponCount}
        attendanceStreak={attendanceStreak}
        isTodayAttended={isTodayAttended}
        unlockedMonsterCount={MONSTER_CARDS.filter((monster) => (unlockedMonsters[monster.id]?.count ?? 0) >= 1).length}
        totalMonsterCount={MONSTER_CARDS.length}
        onExitReviewMode={isReviewMode ? handleExitReviewMode : undefined}
        isVoiceAttackEnabled={isVoiceAttackEnabled}
        onToggleVoiceAttack={handleToggleVoiceAttack}
        eggCount={eggCount}
        onOpenGacha={() => setIsGachaOpen(true)}
        treasureBoxCount={treasureBoxCount}
        onOpenTreasureBox={() => {
          setGoldenChestSource('attendance');
          setIsGoldenChestOpen(true);
        }}
        equippedPartnerId={equippedPartnerId}
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        dailyDualQuest={dailyDualQuest}
      />

      {/* 2. 메인 게임 영역 (일반 배틀: 2단 분할 / 보스 미니게임 / 산수 요격: 단일 전체화면 확장) */}
      <main
        className="flex-1 min-h-0 w-full max-w-5xl lg:max-w-6xl mx-auto px-1.5 sm:px-3 md:px-4 flex flex-col landscape-short:flex-row landscape-short:items-stretch overflow-hidden gap-1 sm:gap-1.5 md:gap-2"
      >
        {activeMode === 'math' ? (
          /* 산수 특화 운석 요격 디펜스 스테이지 (단일 풀스크린 와이드 아레나) */
          <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden py-0.5 sm:py-1">
            <MathDefenseStage
              key={`math-stage-${mathStageNum}-${mathSessionId}`}
              stageNum={mathStageNum}
              equippedPartnerId={equippedPartnerId}
              onClear={handleMathStageClear}
              onPartnerNotice={triggerPartnerNotice}
              onGoToLanguage={() => setActiveMode('language')}
              isLanguageDoneToday={dailyDualQuest.languageDone}
              onNextMathStage={handleNextMathStage}
            />
          </div>
        ) : isBossStage ? (
          /* 보스 특화 미니게임일 때: 배틀 영역 전체를 단일 풀스크린 와이드 아레나로 시원하게 100% 확장! */
          <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden py-0.5 sm:py-1">
            <BossMiniGame
              key={`boss-stage-${currentStageNum}-${battleSessionId}`}
              stageNum={currentStageNum}
              stageWords={activeWords}
              allWords={safeWords}
              level={gameState.level}
              equippedPartnerId={equippedPartnerId}
              onClear={handleBossMiniGameClear}
              onWrongWord={handleCollectWrongWord}
              onPartnerNotice={triggerPartnerNotice}
              onGoToMath={() => setActiveMode('math')}
              isMathDoneToday={dailyDualQuest.mathDone}
            />
          </div>
        ) : (
          <>
            {/* 배틀 스테이지 (세로 모드: 상단, 가로 단축 모드: 좌측 42%) */}
            <div className="w-full landscape-short:w-[42%] flex-none landscape-short:flex-1 min-h-0 flex flex-col justify-center">
              <GodzillaStage
                level={gameState.level}
                isShootingBeam={isShootingBeam}
                isGhidorahAttacking={isGhidorahAttacking}
                godzillaHp={godzillaHp}
                ghidorahHp={ghidorahHp}
                combo={gameState.streak}
                isAllCleared={isAllCleared}
                isStageClearReady={isStageClearReady}
                isGameOver={isGameOver}
                onResetGame={
                  !isReviewMode && !isInfiniteMode && cycleCount === 1 && currentStageNum >= totalStages
                    ? () => setIsCycleCompletionModalOpen(true)
                    : isReviewMode
                    ? handleReviewComplete
                    : handleNextStage
                }
                onReviveGame={handleReviveGame}
                clearedCount={clearedIds.length}
                totalCount={activeWords.length}
                isReviewMode={isReviewMode}
                onExitReviewMode={handleExitReviewMode}
                stageRangeLabel={stageRangeLabel}
                currentStageNum={currentStageNum}
                totalStages={totalStages}
                onOpenGacha={handleOpenGacha}
                hasClaimedStageReward={hasClaimedStageReward}
                isCriticalHit={isCriticalHit}
                raidBoss={currentRaidBoss}
                isInfiniteMode={isInfiniteMode}
                cycleCount={cycleCount}
                equippedPartnerId={equippedPartnerId}
                partnerSkillNotification={partnerSkillNotice}
                roarPower={activeRoarPower}
                isScreenShaking={isScreenShaking}
                onGoToMath={() => setActiveMode('math')}
                isMathDoneToday={dailyDualQuest.mathDone}
              />
            </div>

            {/* 3개 국어 카드 보드 (세로 모드: 하단, 가로 단축 모드: 우측 58%) */}
            <div
              className="flex-1 min-h-0 w-full landscape-short:w-[58%] flex flex-col overflow-hidden"
              style={{
                pointerEvents: (isGameOver || battleStatus !== 'PLAYING' || isFinishingStage || isStageClearReady || isVoiceModalOpen || !!comboWord) ? 'none' : 'auto',
              }}
            >
              {activeWords && activeWords.length > 0 ? (
                <TriMatchingBoard
                  key={
                    isReviewMode
                      ? `review-${reviewWords.map((w) => w?.id || '').join('-')}-${battleSessionId}`
                      : `stage-${stageIndex}-${stageWords.map((w) => w?.id || '').join('-')}-${battleSessionId}`
                  }
                  words={activeWords}
                  clearedIds={clearedIds}
                  onMatchSuccess={handleMatchComplete}
                  onMatchFail={handleMatchFail}
                  stageLabel={stageLabel}
                  stageRangeLabel={stageRangeLabel}
                  hintWordId={equippedPartnerId === 'rodan' ? activeWords.find((w) => !clearedIds.includes(w.id))?.id : null}
                  isScreenShaking={isScreenShaking}
                />
              ) : (
                // 단어 데이터 준비 중이거나 빈 상태일 때의 안전 폴백 UI (절대 return null이나 빈 화면 방지)
                <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-3xl mb-3 shadow-inner animate-pulse">
                    🦖⚡
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-cyan-300 mb-1">
                    배틀 스테이지 준비 중...
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed mb-4">
                    단어 데이터를 불러오고 있습니다. 잠시만 기다려 주세요!
                  </p>
                  <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* 3. 하단 푸터 (가로 단축 모드에서는 공간 확보를 위해 숨김) */}
      <footer
        className="w-full text-center py-0.5 text-[9px] sm:text-[10px] text-slate-500 flex-none landscape-short:hidden"
      >
        🦖 고질라 3개 국어 배틀 모험 (초등 2학년 맞춤) · 한국어 🇰🇷 / 영어 🇺🇸 / 일본어 🇯🇵
      </footer>

      {/* 4. 학부모 단어 숙제 관리 모달 */}
      {isParentModalOpen && <ParentModal
        isOpen={isParentModalOpen}
        onClose={() => setIsParentModalOpen(false)}
        currentWords={words}
        onSaveWords={handleSaveWords}
        currentLevel={gameState.level}
        onSetLevel={handleSetLevel}
        onResetAllData={handleResetAllData}
      />}

      {/* 5-1. 약점 단어 없음 안내 모달 */}
      {isEmptyWrongAlertOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
        >
          <div className="w-full max-w-sm bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-5 text-center shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-3xl mb-3 shadow-inner">
              🦖✨
            </div>
            <h3 className="text-lg font-black text-cyan-300 mb-1">
              복습할 약점 단어가 없어요! 훌륭해요!
            </h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              틀린 단어가 하나도 없어요. 완벽해요!<br />
              멋진 실력으로 계속 괴수들을 물리쳐 보세요! 🌟
            </p>
            <button
              type="button"
              onClick={() => setIsEmptyWrongAlertOpen(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-black text-sm transition-all cursor-pointer shadow-lg shadow-cyan-500/30"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 5-2. 오답 괴수 레이드 도전 컨펌 팝업 */}
      {isRaidConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
        >
          <div
            className="w-full max-w-md bg-slate-900 border-2 rounded-2xl p-5 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
            style={{
              borderColor: `${currentRaidBoss.themeColor}88`,
              boxShadow: `0 0 30px ${currentRaidBoss.themeColor}33`,
            }}
          >
            {/* 상단 레이드 뱃지 */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border text-xs font-black mb-3"
              style={{
                borderColor: currentRaidBoss.themeColor,
                color: currentRaidBoss.themeColor,
              }}
            >
              <span>⚔️ SPECIAL RAID EVENT</span>
            </div>

            <div
              className="w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl mb-3 shadow-inner animate-pulse"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderColor: `${currentRaidBoss.themeColor}66`,
              }}
            >
              {currentRaidBoss.icon}
            </div>

            <h3
              className="text-lg sm:text-xl font-black mb-1"
              style={{ color: currentRaidBoss.themeColor }}
            >
              {currentRaidBoss.title} 레이드에 도전하시겠습니까?
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {currentRaidBoss.description}<br />
              단어를 맞혀 약점을 극복하고 보스를 물리쳐 보세요!
            </p>

            {/* 레이드 정보 박스 */}
            <div
              className="w-full bg-slate-950/70 border rounded-xl p-3 mb-4 space-y-2 text-xs"
              style={{ borderColor: `${currentRaidBoss.themeColor}44` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">출현 보스</span>
                <span className="font-black" style={{ color: currentRaidBoss.themeColor }}>
                  {currentRaidBoss.icon} {currentRaidBoss.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">약점 단어 수</span>
                <span className="font-black text-amber-300">{normalizedWrongWords.length}개 ({normalizedWrongWords.length}타격 시 처치)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">토벌 보상</span>
                <span className="font-black text-emerald-400">🥚 괴수 알 1개 + ⚡ 100 EXP</span>
              </div>
            </div>

            {/* 버튼 액션 */}
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={handleStartReviewBattle}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:brightness-110 active:scale-95 text-white font-black text-sm sm:text-base transition-all cursor-pointer shadow-lg shadow-purple-500/30 border border-yellow-300 flex items-center justify-center gap-2"
              >
                <span>⚔️ {currentRaidBoss.name} 레이드 출격!</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRaidConfirmOpen(false);
                    setIsReviewModalOpen(true);
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                >
                  📖 오답 단어 목록 보기
                </button>
                <button
                  type="button"
                  onClick={() => setIsRaidConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-bold text-xs border border-slate-700/60 transition-all cursor-pointer"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5-3. 오답 레이드 완벽 클리어 축하 모달 */}
      {isRaidVictoryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div className="w-full max-w-md bg-slate-900 border-2 border-yellow-400/80 rounded-2xl p-5 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            {/* 상단 닫기 X 버튼 */}
            <button
              type="button"
              onClick={handleReviewComplete}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="메인 배틀로 복귀"
            >
              ✕
            </button>

            {/* 승리 트로피 & 보스 격퇴 아이콘 */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 via-purple-500/20 to-emerald-500/20 border border-yellow-400/50 flex items-center justify-center text-3xl mb-3 shadow-lg animate-bounce">
              🏆✨
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-400 text-yellow-300 text-xs font-black mb-2">
              <span>🌟 RAID VICTORY 🌟</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-amber-300 mb-1">
              오답 레이드 완벽 클리어!
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              틀렸던 모든 약점 단어를 극복하여<br />
              <span className="font-black" style={{ color: currentRaidBoss.themeColor }}>
                {currentRaidBoss.icon} {currentRaidBoss.title}
              </span>을(를) 완벽히 퇴치했어요!
            </p>

            {/* 토벌 보상 박스 */}
            <div className="w-full bg-slate-950/80 border border-emerald-500/40 rounded-xl p-3.5 mb-5 space-y-2 text-xs shadow-inner">
              <div className="text-[11px] font-black text-emerald-400 flex items-center justify-center gap-1">
                <span>🎁 레이드 토벌 특별 보너스 지급 완료!</span>
              </div>
              <div className="flex items-center justify-around pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
                  <span className="text-base">🥚</span>
                  <span className="font-black text-emerald-300">괴수 알 +1</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-950/60 border border-yellow-500/30">
                  <span className="text-base">⚡</span>
                  <span className="font-black text-yellow-300">EXP +100</span>
                </div>
              </div>
            </div>

            {/* 메인 배틀로 복귀 CTA 버튼 */}
            <button
              type="button"
              onClick={handleReviewComplete}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:brightness-110 active:scale-95 text-white font-black text-sm sm:text-base transition-all cursor-pointer shadow-xl shadow-cyan-500/25 border border-white flex items-center justify-center gap-2"
            >
              <span>⚔️ 메인 배틀로 돌아가기</span>
            </button>
          </div>
        </div>
      )}

      {/* 5-4. 오답노트 & 복습 특훈 모달 */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        wrongWords={normalizedWrongWords}
        onClearWrongWords={handleClearWrongWords}
        onRemoveWord={handleRemoveWrongWord}
        onStartReviewBattle={handleStartReviewBattle}
      />

      {/* 6. 알 깨기 가챠 모달 */}
      <EggGachaModal
        isOpen={isGachaOpen}
        onClose={() => setIsGachaOpen(false)}
        eggCount={eggCount}
        onConsumeEgg={consumeEgg}
        onRewardCollected={handleRewardCollected}
      />

      {/* 7. 괴수 카드 도감 모달 */}
      <MonsterBookModal
        isOpen={isMonsterBookOpen}
        onClose={() => setIsMonsterBookOpen(false)}
        unlockedRecords={unlockedMonsters}
        hasClaimedCodexReward={hasClaimedCodexReward}
        onClaimCodexReward={handleClaimCodexReward}
        equippedPartnerId={equippedPartnerId}
        onEquipPartner={handleEquipPartner}
        onOpenCodexChest={() => {
          setIsMonsterBookOpen(false);
          setGoldenChestSource('codex');
          setIsGoldenChestOpen(true);
        }}
      />

      {/* 7-1. 도감 10종 완성 축하 & 황금 보물상자 획득 모달 */}
      {isCodexCelebrationOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div className="w-full max-w-md bg-slate-900 border-2 border-yellow-400 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            <button
              type="button"
              onClick={() => setIsCodexCelebrationOpen(false)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-amber-500/30 animate-bounce">
              🏆🎁
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-yellow-400 text-yellow-300 text-xs font-black mb-2">
              <span>🌟 CODEX COMPLETE 🌟</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-amber-300 mb-1">
              도감 완성 축하! 황금 보물상자 획득!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              10종의 모든 괴수를 성공적으로 수집하셨습니다!<br />
              최고 보상으로 <strong className="text-amber-300 font-black">🎁 황금 보물상자 1개</strong>가 보관함에 지급되었습니다!
            </p>

            <div className="w-full bg-slate-950/80 border border-amber-500/40 rounded-xl p-3 mb-5 text-xs text-slate-300 space-y-1">
              <div className="text-amber-400 font-black flex items-center justify-center gap-1">
                <span>🎁 현재 보유 중인 황금 보물상자: {treasureBoxCount}개</span>
              </div>
              <div className="text-[11px] text-slate-400">
                상자 개봉 시 <strong className="text-yellow-300">30분 게임 & 유튜브 보너스 황금 쿠폰</strong>을 획득할 수 있습니다!
              </div>
            </div>

            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsCodexCelebrationOpen(false);
                  setIsMonsterBookOpen(false);
                  setGoldenChestSource('codex');
                  setIsGoldenChestOpen(true);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-sm sm:text-base transition-all cursor-pointer shadow-lg shadow-amber-500/40 border border-yellow-300 flex items-center justify-center gap-2"
              >
                <span>🎁 획득한 황금 보물상자 지금 바로 열기!</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCodexCelebrationOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                도감 계속 보기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7-2. 34스테이지(200단어) 1회독 완주 & 마스터 달성 축하 모달 */}
      {isCycleCompletionModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-2 border-yellow-400 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            <button
              type="button"
              onClick={() => setIsCycleCompletionModalOpen(false)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 border border-yellow-300 flex items-center justify-center text-3xl mb-3 shadow-xl shadow-yellow-500/40 animate-bounce">
              👑🦖
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-yellow-400 text-yellow-300 text-xs font-black mb-2 shadow-sm">
              <span>🌟 200단어 마스터 달성 · 1회독 완주 🌟</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 mb-1">
              🎉 200단어 완주를 축하합니다!
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 mb-4 leading-relaxed">
              고질라와 함께 34개 스테이지를 모두 돌파하여<br />
              <strong className="text-amber-300 font-bold">200개의 필수 단어</strong>를 모두 마스터했어요!
            </p>

            {/* 마스터 특급 보상 카드 */}
            <div className="w-full bg-slate-950/90 border border-yellow-500/50 rounded-xl p-3.5 mb-4 text-xs text-slate-200 space-y-2 shadow-inner">
              <div className="text-yellow-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1">
                <span>🎁 마스터 특급 보상 지급 완료!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2 flex flex-col items-center">
                  <span className="text-xl mb-0.5">🎁</span>
                  <span className="font-bold text-amber-300">황금 보물상자</span>
                  <span className="text-[11px] text-yellow-400 font-black">+1개 획득!</span>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2 flex flex-col items-center">
                  <span className="text-xl mb-0.5">🥚</span>
                  <span className="font-bold text-emerald-300">괴수 알</span>
                  <span className="text-[11px] text-green-400 font-black">+3개 획득!</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                ⚡ 2회독부터는 <strong className="text-cyan-300">전체 200단어 무작위(랜덤) 배틀</strong>로 진행됩니다!
              </div>
            </div>

            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={handleStartNextCycle}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-sm sm:text-base transition-all cursor-pointer shadow-lg shadow-orange-500/40 border border-yellow-300 flex items-center justify-center gap-2"
              >
                <span>👑 2회독 무한 마스터 모드 시작하기! 🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. 음성 인식 포효 공격 모달 */}
      {isVoiceModalOpen && targetWord && (
        <VoiceAttackModal
          isOpen={isVoiceModalOpen}
          word={targetWord}
          onClose={() => {
            setIsVoiceModalOpen(false);
            if (targetWord) setComboWord(targetWord);
          }}
          onAttackSuccess={(roarPower) => {
            // 포효 성공 후 회화 듣기까지 마치면 크리티컬 열선을 발사한다.
            if (!pendingAttackRef.current || !targetWord) return;
            pendingAttackRef.current.isCritical = true;
            pendingAttackRef.current.roarPower = roarPower || null;
            setIsVoiceModalOpen(false);
            setComboWord(targetWord);
          }}
          onSkip={() => {
            // 포효를 건너뛰어도 회화 듣기는 진행한다.
            if (!pendingAttackRef.current || !targetWord) return;
            pendingAttackRef.current.isCritical = false;
            pendingAttackRef.current.roarPower = null;
            setIsVoiceModalOpen(false);
            setComboWord(targetWord);
          }}
        />
      )}

      {comboWord && <MiniComboModal key={String(comboWord.id)} word={comboWord} onComplete={handleComboComplete} />}

      {/* 9. 주간 캘린더 & 고질라 발자국 스탬프 출석부 모달 */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => {
          setIsAttendanceModalOpen(false);
          setIsNewlyAttendedToday(false);
          refreshCouponCount();
        }}
        currentStreak={attendanceStreak}
        maxStreak={maxAttendanceStreak}
        weekDays={weekDays}
        weekAttendedCount={weekAttendedCount}
        isTodayAttended={isTodayAttended}
        isNewlyAttended={isNewlyAttendedToday}
        onOpenLuckyGacha={() => {
          setIsAttendanceModalOpen(false);
          setGoldenChestSource('attendance');
          setIsGoldenChestOpen(true);
        }}
        hasClaimedWeeklyReward={hasClaimedWeeklyReward}
        initialShowCoupons={attendanceInitialShowCoupons}
        onCouponsChanged={refreshCouponCount}
      />

      {/* 10. 7일 출석 & 도감 10종 완성 최고 보상 황금 보물상자 개봉 모달 */}
      <GoldenChestModal
        isOpen={isGoldenChestOpen}
        onClose={() => {
          setIsGoldenChestOpen(false);
          refreshCouponCount();
        }}
        source={goldenChestSource}
        treasureBoxCount={treasureBoxCount}
        onConsumeTreasureBox={consumeTreasureBox}
        onBonusExp={(amount) => {
          setGameState((prev) => {
            const totalExp = prev.exp + amount;
            const levelGain = Math.floor(totalExp / 100);
            const nextState = {
              ...prev,
              level: prev.level + levelGain,
              exp: totalExp % 100,
            };
            try {
              localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(nextState));
            } catch {}
            savePlayerDataToFirestore({ gameState: nextState });
            return nextState;
          });
        }}
        onWeeklyRewardClaimed={() => {
          claimWeeklyReward();
          refreshCouponCount();
        }}
        onCodexRewardClaimed={() => {
          setHasClaimedCodexReward(true);
          refreshCouponCount();
        }}
        onOpenCouponBox={() => {
          setIsGoldenChestOpen(false);
          setAttendanceInitialShowCoupons(true);
          setIsAttendanceModalOpen(true);
          refreshCouponCount();
        }}
      />
    </div>
  );
}

export default App;
