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
import { GoldenChestModal } from './components/LuckyEggGachaModal';
import { useAttendance, setStoredAttendanceRecords } from './hooks/useAttendance';
import {
  getStoredUnlockedMonsters,
  setStoredUnlockedMonsters,
  deductOneEachForCodexExchange,
  MONSTER_CARDS,
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
import { fetchPlayerDataFromFirestore, savePlayerDataToFirestore } from './firebase';
import { getRandomRaidBoss, type RaidBossInfo } from './data/raidBosses';

const STORAGE_KEY_WORDS = 'godzilla_language_words_v3';
const STORAGE_KEY_STATE = 'godzilla_language_state_v6';
const STORAGE_KEY_WRONG_WORDS = 'godzilla_wrong_words';
const STORAGE_KEY_VOICE_ENABLED = 'godzilla_voice_attack_enabled';
const STORAGE_KEY_EGG_COUNT = 'godzilla_egg_count';
const STORAGE_KEY_TREASURE_BOX = 'godzilla_treasure_box_count';

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

  // 0. 안전한 단어 원본 (words가 비었거나 손상되었을 때 DEFAULT_WORDS 즉시 폴백)
  const safeWords = useMemo<WordItem[]>(() => {
    if (Array.isArray(words) && words.length > 0) {
      const valid = words.filter((w) => w && w.id && w.ko && w.en && w.ja);
      if (valid.length > 0) return valid;
    }
    return DEFAULT_WORDS;
  }, [words]);

  // 전체 스테이지 수 (숙제 모드나 일반 모드 모두 6개씩 분할)
  const totalStages = Math.max(1, Math.ceil(safeWords.length / WORDS_PER_ROUND));

  // 현재 스테이지 번호 (1-based)
  const currentStageNum = (stageIndex % totalStages) + 1;

  // [중요] 숙제 모드나 일반 모드 모두 현재 라운드/페이지에 맞는 6개만 추출 (항상 안전 보장)
  const stageWords = useMemo<WordItem[]>(() => {
    const safeIndex = stageIndex % totalStages;
    const startIndex = safeIndex * WORDS_PER_ROUND;
    const slice = safeWords.slice(startIndex, startIndex + WORDS_PER_ROUND);
    return slice.length > 0 ? slice : safeWords.slice(0, WORDS_PER_ROUND);
  }, [safeWords, stageIndex, totalStages]);

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

  // 황금 보물상자 보유 개수 (확률 테스트용 +5개 추가 충전)
  const [treasureBoxCount, setTreasureBoxCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TREASURE_BOX);
      let count = saved !== null ? parseInt(saved, 10) : 0;
      if (isNaN(count) || count < 0) count = 0;

      // 테스트용 +5개 일회성 추가 충전
      const bonusGranted = localStorage.getItem('godzilla_add_5_boxes_prob_test_v1');
      if (!bonusGranted) {
        count = Math.max(5, count + 5);
        localStorage.setItem('godzilla_add_5_boxes_prob_test_v1', 'true');
        localStorage.setItem(STORAGE_KEY_TREASURE_BOX, String(count));
        savePlayerDataToFirestore({ treasureBoxCount: count });
      }
      return count;
    } catch {}
    return 5;
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
          // 8. 황금 보물상자 보유량 반영 (원격 동기화 시 +5개 테스트 보너스 체크)
          if (typeof remoteData.treasureBoxCount === 'number') {
            let count = remoteData.treasureBoxCount;
            const remoteBonusGranted = localStorage.getItem('godzilla_add_5_boxes_prob_test_remote_v1');
            if (!remoteBonusGranted) {
              count = Math.max(5, count + 5);
              localStorage.setItem('godzilla_add_5_boxes_prob_test_remote_v1', 'true');
              savePlayerDataToFirestore({ treasureBoxCount: count });
            }
            setTreasureBoxCount(count);
            try {
              localStorage.setItem(STORAGE_KEY_TREASURE_BOX, String(count));
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
            treasureBoxCount: 5,
            attendanceRecords: records,
            weeklyRewardClaimedWeek: currentWeekClaimed,
            unlockedMonsters: localMonsters,
            coupons: localCoupons,
            hasClaimedCodexReward: getStoredHasClaimedCodexReward(),
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

      // 복습 모드에서 정답 단어는 오답노트에서 자동 제거 및 Firestore 실시간 동기화
      if (isReviewMode) {
        setWrongWordList((prev) => {
          const updated = prev.filter((w) => w.id !== matchedId);
          try {
            localStorage.setItem(STORAGE_KEY_WRONG_WORDS, JSON.stringify(updated));
          } catch (e) {
            console.error('Failed to update wrong words:', e);
          }
          savePlayerDataToFirestore({ wrongWordList: updated });
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
    setClearedIds([]);
    setGodzillaHp(100);
    setGameState((prev) => ({ ...prev, streak: 0 }));
    setHasClaimedReviewRaidReward(false);
    setIsReviewModalOpen(false);
    setIsRaidConfirmOpen(false);
    setIsRaidVictoryModalOpen(false);
  }, [normalizedWrongWords]);

  const handleExitReviewMode = useCallback(() => {
    setIsReviewMode(false);
    setReviewWords([]);
    setClearedIds([]);
    setGodzillaHp(100);
    setGameState((prev) => ({ ...prev, streak: 0 }));
    setHasClaimedReviewRaidReward(false);
    setIsReviewModalOpen(false);
    setIsRaidConfirmOpen(false);
    setIsRaidVictoryModalOpen(false);
  }, []);

  // 오답 복습 레이드 완료 후 일반 모드 복귀 (오답노트 클리어 및 Firestore 동기화 포함)
  const handleReviewComplete = useCallback(() => {
    setIsReviewMode(false);
    setReviewWords([]);
    setClearedIds([]);
    setGodzillaHp(100);
    setGameState((prev) => ({ ...prev, streak: 0 }));
    setHasClaimedReviewRaidReward(false);
    setIsReviewModalOpen(false);
    setIsRaidConfirmOpen(false);
    setIsRaidVictoryModalOpen(false);
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
  }, []);

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
  const isAllCleared = activeWords.length > 0 && clearedIds.length === activeWords.length;
  const isGameOver = godzillaHp <= 0;

  // 12-1. 일반 배틀 스테이지 클리어(승리) 시 🥚 괴수 알 +1 즉시 자동 지급 & Firestore 영구 동기화
  useEffect(() => {
    if (!isReviewMode && isAllCleared && !isGameOver && !hasAwardedStageEgg) {
      setHasAwardedStageEgg(true);

      setEggCount((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem(STORAGE_KEY_EGG_COUNT, String(next));
        } catch (e) {
          console.error('Failed to save eggCount:', e);
        }
        savePlayerDataToFirestore({ eggCount: next });
        return next;
      });
    }
  }, [isReviewMode, isAllCleared, isGameOver, hasAwardedStageEgg]);

  // 12-2. 스테이지 클리어(승리) 시 오늘의 출석 체크 자동 처리 & 스탬프 모달 연동
  useEffect(() => {
    if (isAllCleared && !isGameOver) {
      const result = checkTodayAttendance();
      if (result.isNewlyAttended) {
        setIsNewlyAttendedToday(true);

        const timer = setTimeout(() => {
          setIsAttendanceModalOpen(true);
        }, 650);
        return () => clearTimeout(timer);
      }
    }
  }, [isAllCleared, isGameOver, checkTodayAttendance]);

  // 12-3. 오답 복습 레이드 보스 격파 승리 시 괴수 알 +1 및 100 EXP 보상 지급 & Firestore 동기화
  useEffect(() => {
    if (isReviewMode && isAllCleared && !isGameOver && !hasClaimedReviewRaidReward) {
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
  }, [isReviewMode, isAllCleared, isGameOver, hasClaimedReviewRaidReward, eggCount, gameState]);

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

    // 3. 교환 완료 플래그 초기화 (다음번에 또 10종을 모으면 즉시 재교환 가능한 순환 구조)
    setHasClaimedCodexReward(false);
    try {
      localStorage.removeItem(STORAGE_KEY_CODEX_REWARD);
    } catch {}

    // 4. Firestore 영구 저장 (보물상자 증가, 차감된 도감, 교환 플래그 초기화)
    savePlayerDataToFirestore({
      treasureBoxCount: nextBoxCount,
      unlockedMonsters: updatedMonsters,
      hasClaimedCodexReward: false,
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
  }, [treasureBoxCount]);

  // ─────────────────────────────────────────────
  // 스테이지 레이블 (승리 화면 & HUD에 표시)
  // ─────────────────────────────────────────────
  const stageLabel = isReviewMode
    ? `오답 괴수 레이드 (${currentRaidBoss.name})`
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
        unlockedMonsterCount={Object.keys(unlockedMonsters).length}
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
            raidBoss={currentRaidBoss}
          />
        </div>

        {/* 3개 국어 카드 보드 (세로 모드: 하단, 가로 단축 모드: 우측 58%) */}
        <div
          className="flex-1 min-h-0 w-full landscape-short:w-[58%] flex flex-col overflow-hidden"
          style={{
            pointerEvents: isGameOver ? 'none' : 'auto',
          }}
        >
          {activeWords && activeWords.length > 0 ? (
            <TriMatchingBoard
              key={
                isReviewMode
                  ? `review-${reviewWords.map((w) => w?.id || '').join('-')}`
                  : `stage-${stageIndex}-${stageWords.map((w) => w?.id || '').join('-')}`
              }
              words={activeWords}
              clearedIds={clearedIds}
              onMatchSuccess={handleMatchComplete}
              onMatchFail={handleMatchFail}
              stageLabel={stageLabel}
              stageRangeLabel={stageRangeLabel}
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
        onBonusExp={handleAddBonusExp}
        onMonsterUnlocked={refreshUnlockedMonsters}
        onRewardCollected={handleRewardCollected}
      />

      {/* 7. 괴수 카드 도감 모달 */}
      <MonsterBookModal
        isOpen={isMonsterBookOpen}
        onClose={() => setIsMonsterBookOpen(false)}
        unlockedRecords={unlockedMonsters}
        hasClaimedCodexReward={hasClaimedCodexReward}
        onClaimCodexReward={handleClaimCodexReward}
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
