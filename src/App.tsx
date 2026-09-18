import { useState, useEffect, useCallback, useMemo } from 'react';
import type { WordItem, GameState } from './types';
import { DEFAULT_WORDS } from './data/defaultWords';
import { Header } from './components/Header';
import { GodzillaStage } from './components/GodzillaStage';
import { TriMatchingBoard } from './components/TriMatchingBoard';
import { ParentModal } from './components/ParentModal';
import { ReviewModal } from './components/ReviewModal';

const STORAGE_KEY_WORDS = 'godzilla_language_words_v2';
const STORAGE_KEY_STATE = 'godzilla_language_state_v6';
const STORAGE_KEY_WRONG_WORDS = 'godzilla_wrong_words';

// 한 스테이지(배틀)당 출제 단어 수
const STAGE_SIZE = 6;

const dedupeWordsById = (items: WordItem[]) => {
  const uniqueById = new Map<number, WordItem>();
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load words:', e);
    }
    return DEFAULT_WORDS;
  });

  // ─────────────────────────────────────────────
  // 2. 스테이지(라운드) 인덱스 – 0부터 시작
  //    부모가 직접 단어를 입력한 경우 항상 스테이지 0 고정
  // ─────────────────────────────────────────────
  const [stageIndex, setStageIndex] = useState(0);

  // 부모 입력 단어인지 여부: DEFAULT_WORDS의 id 집합과 다르면 "커스텀 모드"
  const isCustomWords = useMemo(() => {
    const defaultIds = new Set(DEFAULT_WORDS.map((w) => w.id));
    return words.some((w) => !defaultIds.has(w.id)) || words.length !== DEFAULT_WORDS.length;
  }, [words]);

  // 현재 스테이지에서 출제할 단어 슬라이스
  // - 커스텀 단어: 전체 사용 (부모 입력 우선)
  // - 기본 단어:   6개씩 순환
  const stageWords = useMemo<WordItem[]>(() => {
    if (isCustomWords) return words;
    const totalStages = Math.ceil(words.length / STAGE_SIZE);
    const safeIndex = stageIndex % totalStages;
    return words.slice(safeIndex * STAGE_SIZE, safeIndex * STAGE_SIZE + STAGE_SIZE);
  }, [words, stageIndex, isCustomWords]);

  // 전체 스테이지 수
  const totalStages = isCustomWords ? 1 : Math.ceil(words.length / STAGE_SIZE);

  // 현재 스테이지 번호 (1-based)
  const currentStageNum = (stageIndex % totalStages) + 1;

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

  // 현재 활성화된 단어 세트
  const activeWords = isReviewMode ? reviewWords : stageWords;

  // ─────────────────────────────────────────────
  // 5. 레벨 / EXP / 콤보 (GameState)
  // ─────────────────────────────────────────────
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      localStorage.removeItem('godzilla_language_state_v2');
      localStorage.removeItem('godzilla_language_state_v3');
      localStorage.removeItem('godzilla_language_state_v5');
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

  const handleSetLevel = useCallback((newLevel: number) => {
    const nextState: GameState = { level: Math.max(1, newLevel), exp: 0, streak: 0 };
    setGameState(nextState);
    try {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(nextState));
    } catch (e) {
      console.error('Failed to save gameState:', e);
    }
  }, []);

  // gameState → localStorage 동기화
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(gameState));
    } catch (e) {
      console.error('Failed to save gameState:', e);
    }
  }, [gameState]);

  // ─────────────────────────────────────────────
  // 6. 배틀 상태
  // ─────────────────────────────────────────────
  const [godzillaHp, setGodzillaHp] = useState(100);
  const [clearedIds, setClearedIds] = useState<number[]>([]);
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
  // 8. 정답 핸들러
  // ─────────────────────────────────────────────
  const handleMatchSuccess = useCallback((matchedId: number) => {
    const isFeverHit = gameState.streak >= 2;
    const expReward = isFeverHit ? 50 : 25;

    setIsShootingBeam(true);
    setTimeout(() => setIsShootingBeam(false), 1200);

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
  }, [gameState.streak, isReviewMode]);

  // ─────────────────────────────────────────────
  // 9. 오답 핸들러 (오답노트 자동 수집)
  // ─────────────────────────────────────────────
  const handleMatchFail = useCallback((failedIds?: number[]) => {
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

  /** 다음 스테이지로 진행 (커스텀 단어면 같은 단어 재도전) */
  const handleNextStage = useCallback(() => {
    setGodzillaHp(100);
    setClearedIds([]);
    setGameState((prev) => ({ ...prev, streak: 0 }));
    if (!isCustomWords) {
      setStageIndex((prev) => prev + 1);
    }
  }, [isCustomWords]);

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

  const handleRemoveWrongWord = useCallback((id: number) => {
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

  // ─────────────────────────────────────────────
  // 스테이지 레이블 (승리 화면 & HUD에 표시)
  // ─────────────────────────────────────────────
  const stageLabel = isReviewMode
    ? `오답 복습 특훈`
    : isCustomWords
    ? `숙제 배틀`
    : `STAGE ${currentStageNum} / ${totalStages}`;

  // 현재 스테이지 단어 범위 표시 (기본 단어 모드)
  const stageRangeLabel = !isReviewMode && !isCustomWords
    ? `전체 ${words.length}개 중 ${(stageIndex % totalStages) * STAGE_SIZE + 1}~${Math.min((stageIndex % totalStages + 1) * STAGE_SIZE, words.length)}번 단어`
    : undefined;

  return (
    <div
      className="h-screen h-[100dvh] max-h-screen w-screen overflow-hidden flex flex-col p-1 sm:p-1.5 select-none bg-slate-900 text-white font-sans"
      style={{
        height: '100dvh',
        maxHeight: '100vh',
        width: '100vw',
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
        onExitReviewMode={isReviewMode ? handleExitReviewMode : undefined}
      />

      {/* 2. 메인 게임 영역 */}
      <main
        className="flex-1 min-h-0 flex flex-col items-center w-full max-w-5xl mx-auto overflow-hidden"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '1024px',
          overflow: 'hidden',
        }}
      >
        {/* 배틀 스테이지 */}
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
          currentStageNum={isCustomWords ? undefined : currentStageNum}
          totalStages={isCustomWords ? undefined : totalStages}
        />

        {/* 3개 국어 카드 보드 */}
        <div
          className="flex-1 min-h-0 w-full flex flex-col overflow-hidden"
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
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
            onMatchSuccess={handleMatchSuccess}
            onMatchFail={handleMatchFail}
            stageLabel={stageLabel}
            stageRangeLabel={stageRangeLabel}
          />
        </div>
      </main>

      {/* 3. 하단 푸터 */}
      <footer
        className="w-full text-center py-0.5 text-[10px] text-slate-500 flex-none"
        style={{
          textAlign: 'center',
          padding: '2px',
          color: '#64748b',
          fontSize: '10px',
          flexShrink: 0,
        }}
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
    </div>
  );
}

export default App;
