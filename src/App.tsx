import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { WordItem, GameState, UnlockedMonsterRecord } from './types';
import { DEFAULT_WORDS } from './data/defaultWords';
import { Header } from './components/Header';
import { GodzillaStage } from './components/GodzillaStage';
import { TriMatchingBoard } from './components/TriMatchingBoard';
import { ParentModal } from './components/ParentModal';
import { ReviewModal } from './components/ReviewModal';
import { EggGachaModal } from './components/EggGachaModal';
import { MonsterBookModal } from './components/MonsterBookModal';
import { VoiceAttackModal } from './components/VoiceAttackModal';
import { AttendanceModal } from './components/AttendanceModal';
import { LuckyEggGachaModal } from './components/LuckyEggGachaModal';
import { useAttendance, setStoredAttendanceRecords } from './hooks/useAttendance';
import { getStoredUnlockedMonsters, setStoredUnlockedMonsters, MONSTER_CARDS } from './data/monsterData';
import {
  loadCoupons,
  setStoredCoupons,
  setStoredWeeklyRewardClaimed,
  hasClaimedWeeklyReward as checkClaimedWeeklyReward,
  getCurrentWeekKey,
} from './data/gachaRewards';
import { fetchPlayerDataFromFirestore, savePlayerDataToFirestore } from './firebase';

const STORAGE_KEY_WORDS = 'godzilla_language_words_v3';
const STORAGE_KEY_STATE = 'godzilla_language_state_v6';
const STORAGE_KEY_WRONG_WORDS = 'godzilla_wrong_words';
const STORAGE_KEY_VOICE_ENABLED = 'godzilla_voice_attack_enabled';
const STORAGE_KEY_EGG_COUNT = 'godzilla_egg_count';

// 한 스테이지(배틀)당 출제 단어 수
const WORDS_PER_ROUND = 6;

const dedupeWordsById = (items: WordItem[]) => {
  const uniqueById = new Map<string | number, WordItem>();
  items.forEach((word) => {
    if (!uniqueById.has(word.id)) {
      uniqueById.set(word.id, word);
    }
  });
  return Array.from(uniqueById.values());
};

export function App() {
  // ─────────────────────────────────────────────
  // 1. 전체 단어 풀 (localStorage 우선, 없으면 DEFAULT_WORDS)
  // ─────────────────────────────────────────────
  const [words, setWords] = useState<WordItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 구버전 단어 52개 캐시가 남아있는 경우 신규 200개 어휘 세트로 자동 갱신
          if (parsed.length === 52) {
            localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(DEFAULT_WORDS));
            return DEFAULT_WORDS;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load words:', e);
    }
    return DEFAULT_WORDS;
  });

  // ─────────────────────────────────────────────
  // 2. 스테이지(라운드) 인덱스 – 0부터 시작
  // ─────────────────────────────────────────────
  const [stageIndex, setStageIndex] = useState(0);

  // 부모 입력 단어인지 여부: DEFAULT_WORDS의 id 집합과 다르면 "커스텀(숙제) 모드"
  const isCustomWords = useMemo(() => {
    const defaultIds = new Set(DEFAULT_WORDS.map((w) => w.id));
    return words.some((w) => !defaultIds.has(w.id)) || words.length !== DEFAULT_WORDS.length;
  }, [words]);

  // 전체 스테이지 수 (숙제 모드나 일반 모드 모두 6개씩 분할)
  const totalStages = Math.max(1, Math.ceil(words.length / WORDS_PER_ROUND));

  // 현재 스테이지 번호 (1-based)
  const currentStageNum = (stageIndex % totalStages) + 1;

  // [중요] 숙제 모드나 일반 모드 모두 현재 라운드/페이지에 맞는 6개만 추출
  const stageWords = useMemo<WordItem[]>(() => {
    if (words.length === 0) return [];
    const safeIndex = stageIndex % totalStages;
    const startIndex = safeIndex * WORDS_PER_ROUND;
    return words.slice(startIndex, startIndex + WORDS_PER_ROUND);
  }, [words, stageIndex, totalStages]);

  // ─────────────────────────────────────────────
  // 3. 오답 단어 목록 (localStorage 연동 & 중복 제거)
  // ─────────────────────────────────────────────
  const [wrongWordList, setWrongWordList] = useState<WordItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WRONG_WORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return dedupeWordsById(parsed);
      }
    } catch (e) {
      console.error('Failed to load wrong words:', e);
    }
    return [];
  });

  const normalizedWrongWords = useMemo(() => dedupeWordsById(wrongWordList), [wrongWordList]);

  // ─────────────────────────────────────────────
  // 4. 오답 복습 배틀 모드 상태
  // ─────────────────────────────────────────────
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewWords, setReviewWords] = useState<WordItem[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // 현재 활성화된 단어 세트 (복습 모드/일반 모드 모두 정확히 6개만 슬라이스 보장)
  const activeWords = useMemo<WordItem[]>(() => {
    const list = isReviewMode ? reviewWords : stageWords;
    return list.slice(0, WORDS_PER_ROUND);
  }, [isReviewMode, reviewWords, stageWords]);

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
        if (typeof parsed?.level === 'number') return parsed;
      }
    } catch (e) {
      console.error('Failed to load gameState:', e);
    }
    return { level: 1, exp: 0, streak: 0 };
  });

  // ─────────────────────────────────────────────
  // 5-2. 괴수 도감 & 가챠 모달 상태 및 알 보유 수량
  // ─────────────────────────────────────────────
  const [unlockedMonsters, setUnlockedMonsters] = useState<Record<string, UnlockedMonsterRecord>>(() =>
    getStoredUnlockedMonsters()
  );
  const [isGachaOpen, setIsGachaOpen] = useState(false);
  const [isMonsterBookOpen, setIsMonsterBookOpen] = useState(false);
  // 한 스테이지당 알 깨기 보상 1회 제한 상태
  const [hasClaimedStageReward, setHasClaimedStageReward] = useState(false);

  // 알 보유 개수 (localStorage 연동, 미설정 시 기본 6개 충전)
  const [eggCount, setEggCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EGG_COUNT);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) return parsed;
      }
    } catch {}
    try {
      localStorage.setItem(STORAGE_KEY_EGG_COUNT, '6');
    } catch {}
    return 6;
  });

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
  const [isCriticalHit, setIsCriticalHit] = useState(false);

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
  const [isLuckyGachaOpen, setIsLuckyGachaOpen] = useState(false);

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
          // 4-1. 괴수 도감 반영 (기존 로컬 도감과 안전하게 병합)
          if (remoteData.unlockedMonsters && typeof remoteData.unlockedMonsters === 'object') {
            const localMonsters = getStoredUnlockedMonsters();
            const mergedMonsters = { ...localMonsters, ...remoteData.unlockedMonsters };
            setStoredUnlockedMonsters(mergedMonsters);
            setUnlockedMonsters(mergedMonsters);
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
        } else {
          // Firestore 문서가 아직 없으면 현재 로컬스토리지 데이터를 최초 백업
          const localMonsters = getStoredUnlockedMonsters();
          const localCoupons = loadCoupons();
          const currentWeekClaimed = checkClaimedWeeklyReward() ? getCurrentWeekKey() : null;
          await savePlayerDataToFirestore({
            gameState,
            eggCount,
            attendanceRecords: records,
            weeklyRewardClaimedWeek: currentWeekClaimed,
            unlockedMonsters: localMonsters,
            coupons: localCoupons,
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

  // 스테이지 번호가 변경되거나 모드가 바뀔 때 보상 수령 상태 초기화
  useEffect(() => {
    setHasClaimedStageReward(false);
  }, [stageIndex, isReviewMode]);

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
    const nextState: GameState = { level: Math.max(1, newLevel), exp: 0, streak: 0 };
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
  const [isShootingBeam, setIsShootingBeam] = useState(false);
  const [isGhidorahAttacking, setIsGhidorahAttacking] = useState(false);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);

  // 킹 기도라 HP: 활성 단어 진행률에 1:1 비례
  const ghidorahHp = activeWords.length > 0
    ? Math.max(0, Math.round(((activeWords.length - clearedIds.length) / activeWords.length) * 100))
    : 0;

  // 오답 데미지
  const damagePerHit = activeWords.length > 0 ? Math.ceil(100 / activeWords.length) : 20;

  // ─────────────────────────────────────────────
  // 7. 새 단어 저장 (부모 모달)
  // ─────────────────────────────────────────────
  const handleSaveWords = useCallback((newWords: WordItem[]) => {
    setWords(newWords);
    setStageIndex(0);
    setIsReviewMode(false);
    setClearedIds([]);
    setGodzillaHp(100);
    try {
      localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(newWords));
    } catch (e) {
      console.error('Failed to save words:', e);
    }
  }, []);

  // ─────────────────────────────────────────────
  // 8. 실제 공격 실행 (일반 공격 또는 음성 포효 크리티컬 공격)
  // ─────────────────────────────────────────────
  const executeAttack = useCallback(
    (matchedId: string | number, isCritical: boolean) => {
      const isFeverHit = gameState.streak >= 2;
      // 일반 공격: 기본 25 EXP (피버 50 EXP)
      // 음성 포효 크리티컬 공격: 기본 60 EXP (피버 85 EXP)
      const expReward = isCritical ? (isFeverHit ? 85 : 60) : isFeverHit ? 50 : 25;

      setIsCriticalHit(isCritical);
      setIsShootingBeam(true);
      setTimeout(() => {
        setIsShootingBeam(false);
        setIsCriticalHit(false);
      }, isCritical ? 1500 : 1200);

      setClearedIds((prev) => (prev.includes(matchedId) ? prev : [...prev, matchedId]));

      // 복습 모드에서 정답 단어는 오답노트에서 자동 제거
      if (isReviewMode) {
        setWrongWordList((prev) => {
          const updated = prev.filter((w) => w.id !== matchedId);
          try {
            localStorage.setItem(STORAGE_KEY_WRONG_WORDS, JSON.stringify(updated));
          } catch (e) {
            console.error('Failed to update wrong words:', e);
          }
          return updated;
        });
      }

      setGameState((prev) => {
        const totalExp = prev.exp + expReward;
        const levelGain = Math.floor(totalExp / 100);
        return {
          level: prev.level + levelGain,
          exp: totalExp % 100,
          streak: prev.streak + 1,
        };
      });
    },
    [gameState.streak, isReviewMode]
  );

  // 일반 데미지 공격 발사
  const executeNormalAttack = useCallback(
    (item?: WordItem | null) => {
      const wordObj = item || targetWord;
      if (wordObj) {
        executeAttack(wordObj.id, false);
      }
    },
    [targetWord, executeAttack]
  );

  // 크리티컬 2배 데미지 및 강화 열선 발사
  const executeCriticalAttack = useCallback(
    (item?: WordItem | null) => {
      const wordObj = item || targetWord;
      if (wordObj) {
        executeAttack(wordObj.id, true);
      }
    },
    [targetWord, executeAttack]
  );

  // ─────────────────────────────────────────────
  // 8-2. 정답 매칭 완료 핸들러 (음성 공격 모달 분기)
  // ─────────────────────────────────────────────
  const handleMatchComplete = useCallback(
    (matched: WordItem | string | number) => {
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
        executeAttack(matched as string | number, false);
        return;
      }

      if (isVoiceAttackEnabled) {
        // 포효 ON이면: 공격을 잠시 멈추고 음성인식 모달 오픈
        setTargetWord(wordObj);
        setIsVoiceModalOpen(true);
      } else {
        // 포효 OFF면: 기존처럼 즉시 일반 공격 실행
        executeAttack(wordObj.id, false);
      }
    },
    [isVoiceAttackEnabled, activeWords, stageWords, reviewWords, words, executeAttack]
  );

  // ─────────────────────────────────────────────
  // 9. 오답 핸들러 (오답노트 자동 수집)
  // ─────────────────────────────────────────────
  const handleMatchFail = useCallback((failedIds?: (string | number)[]) => {
    setIsGhidorahAttacking(true);
    setTimeout(() => setIsGhidorahAttacking(false), 1200);

    setGodzillaHp((prev) => Math.max(0, prev - damagePerHit));
    setGameState((prev) => ({ ...prev, streak: 0 }));

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
  }, [damagePerHit, isReviewMode, reviewWords, stageWords]);

  // ─────────────────────────────────────────────
  // 10. 게임 리셋 / 스테이지 진행
  // ─────────────────────────────────────────────
  const handleReviveGame = useCallback(() => {
    setGodzillaHp(100);
    setClearedIds([]);
    setGameState((prev) => ({ ...prev, streak: 0 }));
  }, []);

  /** 다음 스테이지로 진행 */
  const handleNextStage = useCallback(() => {
    setGodzillaHp(100);
    setClearedIds([]);
    setGameState((prev) => ({ ...prev, streak: 0 }));
    setStageIndex((prev) => prev + 1);
  }, []);

  // ─────────────────────────────────────────────
  // 11. 오답 복습 배틀
  // ─────────────────────────────────────────────
  const handleStartReviewBattle = useCallback(() => {
    if (normalizedWrongWords.length === 0) return;
    const deduped = dedupeWordsById(normalizedWrongWords);
    setReviewWords(deduped);
    setIsReviewMode(true);
    setClearedIds([]);
    setGodzillaHp(100);
    setGameState((prev) => ({ ...prev, streak: 0 }));
    setIsReviewModalOpen(false);
  }, [normalizedWrongWords]);

  const handleExitReviewMode = useCallback(() => {
    setIsReviewMode(false);
    setReviewWords([]);
    setClearedIds([]);
    setGodzillaHp(100);
    setGameState((prev) => ({ ...prev, streak: 0 }));
    setIsReviewModalOpen(false);
  }, []);

  // 오답 복습 완료 후 일반 모드 복귀 (오답노트 클리어 포함)
  const handleReviewComplete = useCallback(() => {
    setIsReviewMode(false);
    setReviewWords([]);
    setClearedIds([]);
    setGodzillaHp(100);
    setGameState((prev) => ({ ...prev, streak: 0 }));
    setIsReviewModalOpen(false);
    // 정답 처리된 단어는 이미 handleMatchSuccess에서 제거됨
    // wrongWordList가 완전히 비었을 수 있으므로 localStorage도 동기화
    setWrongWordList((prev) => {
      const deduped = dedupeWordsById(prev);
      try {
        localStorage.setItem(STORAGE_KEY_WRONG_WORDS, JSON.stringify(deduped));
      } catch (e) {
        console.error('Failed to sync wrong words on review complete:', e);
      }
      return deduped;
    });
  }, []);

  const handleClearWrongWords = useCallback(() => {
    setWrongWordList([]);
    try {
      localStorage.removeItem(STORAGE_KEY_WRONG_WORDS);
    } catch (e) {
      console.error('Failed to clear wrong words:', e);
    }
  }, []);

  const handleRemoveWrongWord = useCallback((id: string | number) => {
    setWrongWordList((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_WRONG_WORDS, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update wrong words:', e);
      }
      return updated;
    });
  }, []);

  // ─────────────────────────────────────────────
  // 12. 승리 / 게임오버 판정
  // ─────────────────────────────────────────────
  const isAllCleared = activeWords.length > 0 && clearedIds.length === activeWords.length;
  const isGameOver = godzillaHp <= 0;

  // 스테이지 클리어(승리) 시 오늘의 출석 체크 자동 처리 & 스탬프 모달 연동
  useEffect(() => {
    if (isAllCleared && !isGameOver) {
      const result = checkTodayAttendance();
      if (result.isNewlyAttended) {
        setIsNewlyAttendedToday(true);

        // 7일 출석 완료 시 황금 럭키 알(보너스 알) 1개 즉시 자동 지급
        if (result.shouldRewardEgg) {
          setEggCount((prev) => {
            const next = prev + 1;
            try {
              localStorage.setItem(STORAGE_KEY_EGG_COUNT, String(next));
            } catch {}
            savePlayerDataToFirestore({ eggCount: next });
            return next;
          });
        }

        const timer = setTimeout(() => {
          setIsAttendanceModalOpen(true);
        }, 650);
        return () => clearTimeout(timer);
      }
    }
  }, [isAllCleared, isGameOver, checkTodayAttendance]);

  // ─────────────────────────────────────────────
  // 스테이지 레이블 (승리 화면 & HUD에 표시)
  // ─────────────────────────────────────────────
  const stageLabel = isReviewMode
    ? `오답 복습 특훈`
    : isCustomWords
    ? `숙제 배틀 ${currentStageNum}/${totalStages}`
    : `STAGE ${currentStageNum} / ${totalStages}`;

  // 현재 스테이지 단어 범위 표시
  const currentStart = (stageIndex % totalStages) * WORDS_PER_ROUND + 1;
  const currentEnd = Math.min(currentStart + activeWords.length - 1, words.length);
  const stageRangeLabel = !isReviewMode
    ? `전체 ${words.length}개 중 ${currentStart}~${currentEnd}번 단어`
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
        onOpenReviewModal={() => setIsReviewModalOpen(true)}
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
        unlockedMonsterCount={Object.keys(unlockedMonsters).length}
        totalMonsterCount={MONSTER_CARDS.length}
        onExitReviewMode={isReviewMode ? handleExitReviewMode : undefined}
        isVoiceAttackEnabled={isVoiceAttackEnabled}
        onToggleVoiceAttack={handleToggleVoiceAttack}
        eggCount={eggCount}
        onOpenGacha={() => setIsGachaOpen(true)}
      />

      {/* 2. 메인 게임 영역 (가로 모드에서는 좌우 2단 분할, 세로 모드에서는 상하 배치) */}
      <main
        className="flex-1 min-h-0 w-full max-w-5xl lg:max-w-6xl mx-auto px-1.5 sm:px-3 md:px-4 flex flex-col landscape-short:flex-row landscape-short:items-stretch overflow-hidden gap-1 sm:gap-1.5 md:gap-2"
      >
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
            isGameOver={isGameOver}
            onResetGame={isReviewMode ? handleReviewComplete : handleNextStage}
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
          />
        </div>

        {/* 3개 국어 카드 보드 (세로 모드: 하단, 가로 단축 모드: 우측 58%) */}
        <div
          className="flex-1 min-h-0 w-full landscape-short:w-[58%] flex flex-col overflow-hidden"
          style={{
            pointerEvents: isGameOver ? 'none' : 'auto',
          }}
        >
          <TriMatchingBoard
            key={
              isReviewMode
                ? `review-${reviewWords.map((w) => w.id).join('-')}`
                : `stage-${stageIndex}-${stageWords.map((w) => w.id).join('-')}`
            }
            words={activeWords}
            clearedIds={clearedIds}
            onMatchSuccess={handleMatchComplete}
            onMatchFail={handleMatchFail}
            stageLabel={stageLabel}
            stageRangeLabel={stageRangeLabel}
          />
        </div>
      </main>

      {/* 3. 하단 푸터 (가로 단축 모드에서는 공간 확보를 위해 숨김) */}
      <footer
        className="w-full text-center py-0.5 text-[9px] sm:text-[10px] text-slate-500 flex-none landscape-short:hidden"
      >
        🦖 고질라 3개 국어 배틀 모험 (초등 2학년 맞춤) · 한국어 🇰🇷 / 영어 🇺🇸 / 일본어 🇯🇵
      </footer>

      {/* 4. 학부모 단어 숙제 관리 모달 */}
      <ParentModal
        isOpen={isParentModalOpen}
        onClose={() => setIsParentModalOpen(false)}
        currentWords={words}
        onSaveWords={handleSaveWords}
        currentLevel={gameState.level}
        onSetLevel={handleSetLevel}
      />

      {/* 5. 오답노트 & 복습 특훈 모달 */}
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
        onBonusExp={handleAddBonusExp}
        onMonsterUnlocked={refreshUnlockedMonsters}
        onRewardCollected={handleRewardCollected}
      />

      {/* 7. 괴수 카드 도감 모달 */}
      <MonsterBookModal
        isOpen={isMonsterBookOpen}
        onClose={() => setIsMonsterBookOpen(false)}
        unlockedRecords={unlockedMonsters}
      />

      {/* 8. 음성 인식 포효 공격 모달 */}
      {isVoiceModalOpen && targetWord && (
        <VoiceAttackModal
          isOpen={isVoiceModalOpen}
          word={targetWord}
          onClose={() => {
            setIsVoiceModalOpen(false);
            setTargetWord(null);
          }}
          onAttackSuccess={() => {
            // 음성 3개 국어 완독 성공 시 -> 크리티컬 2배 데미지 및 강화 열선 발사!
            setIsVoiceModalOpen(false);
            executeCriticalAttack(targetWord);
            setTargetWord(null);
          }}
          onSkip={() => {
            // 그냥 공격하기(건너뛰기) 클릭 시 -> 일반 데미지 공격 발사
            setIsVoiceModalOpen(false);
            executeNormalAttack(targetWord);
            setTargetWord(null);
          }}
        />
      )}

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
        onOpenLuckyGacha={() => setIsLuckyGachaOpen(true)}
        hasClaimedWeeklyReward={hasClaimedWeeklyReward}
        initialShowCoupons={attendanceInitialShowCoupons}
        onCouponsChanged={refreshCouponCount}
      />

      {/* 10. 주간 스탬프 7개 달성 럭키 알 깨기 & 쿠폰 보상 가챠 모달 */}
      <LuckyEggGachaModal
        isOpen={isLuckyGachaOpen}
        onClose={() => {
          setIsLuckyGachaOpen(false);
          refreshCouponCount();
        }}
        eggCount={eggCount}
        onConsumeEgg={consumeEgg}
        onWeeklyRewardClaimed={claimWeeklyReward}
        onBonusExp={(amount) => {
          setGameState((prev) => ({ ...prev, exp: prev.exp + amount }));
        }}
      />
    </div>
  );
}

export default App;
