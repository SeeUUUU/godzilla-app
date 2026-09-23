import React, { useState, useMemo } from 'react';
import type { WordItem, Language, SelectedCards } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import type { SpeechLang } from '../hooks/useSpeech';
import { playCardTapSound, playDingDongSuccess, playErrorBuzzer } from '../utils/soundEffects';
import { CheckCircle2, Volume2, Sparkles } from 'lucide-react';

interface TriMatchingBoardProps {
  words: WordItem[];
  clearedIds: (string | number)[];
  onMatchSuccess: (matched: WordItem | string | number) => void;
  onMatchFail: (failedIds?: (string | number)[]) => void;
  stageLabel?: string;
  stageRangeLabel?: string;
}

interface ShuffledCard {
  id: string | number;
  text: string;
  subText?: string;
  lang: Language;
}

// 1. 순수 Fisher-Yates 무작위 셔플 함수
export const fisherYatesShuffle = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 2. 언어별 독립 랜덤 셔플 & 동일 행(수평 정렬) 일치 최소화 디얼라인먼트
export const createIndependentShuffledColumns = (words: WordItem[]): {
  ko: ShuffledCard[];
  en: ShuffledCard[];
  ja: ShuffledCard[];
} => {
  if (!words || words.length === 0) {
    return { ko: [], en: [], ja: [] };
  }

  const baseKo: ShuffledCard[] = words.map((w) => ({
    id: w.id,
    text: w.ko || '',
    lang: 'ko',
  }));

  const baseEn: ShuffledCard[] = words.map((w) => ({
    id: w.id,
    text: w.en || '',
    lang: 'en',
  }));

  const baseJa: ShuffledCard[] = words.map((w) => ({
    id: w.id,
    text: w.ja || '',
    subText: w.jaKana || '',
    lang: 'ja',
  }));

  // 1) 🇰🇷 한국어 열: 순수 Fisher-Yates 독립 셔플
  const ko = fisherYatesShuffle(baseKo);

  // 2) 🇺🇸 영어 열: 독립 Fisher-Yates 셔플 + 한국어와 같은 행(수평 정렬) 중복 배치 최소화
  const en = fisherYatesShuffle(baseEn);
  if (en.length > 1) {
    for (let i = 0; i < en.length; i++) {
      if (en[i].id === ko[i].id) {
        // 같은 행에 배치된 경우, 충돌하지 않는 다른 인덱스와 위치 스왑
        const swapIdx = en.findIndex(
          (item, idx) => idx !== i && item.id !== ko[i].id && en[i].id !== ko[idx].id
        );
        if (swapIdx !== -1) {
          [en[i], en[swapIdx]] = [en[swapIdx], en[i]];
        }
      }
    }
  }

  // 3) 🇯🇵 일본어 열: 독립 Fisher-Yates 셔플 + 한국어/영어와 같은 행 중복 배치 최소화
  const ja = fisherYatesShuffle(baseJa);
  if (ja.length > 1) {
    for (let i = 0; i < ja.length; i++) {
      if (ja[i].id === ko[i].id || ja[i].id === en[i].id) {
        // ko, en 둘 다와 겹치지 않는 슬롯과 위치 스왑
        const swapIdx = ja.findIndex(
          (item, idx) =>
            idx !== i &&
            item.id !== ko[i].id &&
            item.id !== en[i].id &&
            ja[i].id !== ko[idx].id &&
            ja[i].id !== en[idx].id
        );
        if (swapIdx !== -1) {
          [ja[i], ja[swapIdx]] = [ja[swapIdx], ja[i]];
        }
      }
    }
  }

  return { ko, en, ja };
};

export const TriMatchingBoard: React.FC<TriMatchingBoardProps> = ({
  words,
  clearedIds,
  onMatchSuccess,
  onMatchFail,
  stageLabel,
  stageRangeLabel,
}) => {
  const { speak } = useSpeech();

  // 안전장치: words prop으로 들어온 배열의 유효성을 검증하고 정확히 6개만 슬라이스 (undefined 방어)
  const displayWords = useMemo<WordItem[]>(() => {
    if (!Array.isArray(words) || words.length === 0) return [];
    return words.filter((w): w is WordItem => !!w && typeof w === 'object' && 'id' in w).slice(0, 6);
  }, [words]);

  // 셔플된 카드 열 상태 (State로 관리하여 단어 매칭/선택 시 카드 위치가 변하지 않도록 고정 유지)
  const [shuffledColumns, setShuffledColumns] = useState(() =>
    createIndependentShuffledColumns(displayWords)
  );

  const wordsSignature = useMemo(
    () => displayWords.map((w) => w.id).join('-'),
    [displayWords]
  );
  const prevWordsSigRef = React.useRef(wordsSignature);
  const hadClearedCardsRef = React.useRef(false);

  // 1) 단어 세트 자체가 달라지면 새로운 독립 셔플 생성
  React.useEffect(() => {
    if (prevWordsSigRef.current !== wordsSignature) {
      prevWordsSigRef.current = wordsSignature;
      setShuffledColumns(createIndependentShuffledColumns(displayWords));
      hadClearedCardsRef.current = false;
    }
  }, [wordsSignature, displayWords]);

  // 2) 이미 맞춘 카드가 있던 상태에서 clearedIds가 0으로 리셋된 경우 ([다시하기]/재도전) 새 셔플 갱신
  React.useEffect(() => {
    if (clearedIds.length > 0) {
      hadClearedCardsRef.current = true;
    } else if (hadClearedCardsRef.current) {
      hadClearedCardsRef.current = false;
      setShuffledColumns(createIndependentShuffledColumns(displayWords));
    }
  }, [clearedIds.length, displayWords]);

  const { ko: koList, en: enList, ja: jaList } = shuffledColumns;

  const [selected, setSelected] = useState<SelectedCards>({
    ko: null,
    en: null,
    ja: null,
  });

  const [isShaking, setIsShaking] = useState(false);
  const [isMatchingSuccess, setIsMatchingSuccess] = useState(false);

  const handleCardClick = (card: ShuffledCard) => {
    if (clearedIds.includes(card.id) || isShaking || isMatchingSuccess) return;

    playCardTapSound();

    const langMap: Record<Language, SpeechLang> = {
      ko: 'ko-KR',
      en: 'en-US',
      ja: 'ja-JP',
    };
    const speechPromise = speak(card.text, langMap[card.lang]);

    const currentSelectedId = selected[card.lang];
    const newSelectedId = currentSelectedId === card.id ? null : card.id;

    const newSelected: SelectedCards = {
      ...selected,
      [card.lang]: newSelectedId,
    };
    setSelected(newSelected);

    if (
      newSelected.ko !== null &&
      newSelected.en !== null &&
      newSelected.ja !== null
    ) {
      if (
        newSelected.ko === newSelected.en &&
        newSelected.en === newSelected.ja
      ) {
        setIsMatchingSuccess(true);
        playDingDongSuccess();
        const matchedId = newSelected.ko;
        const matchedWord = displayWords.find((w) => String(w.id) === String(matchedId));

        let isCompleted = false;
        const complete = () => {
          if (isCompleted) return;
          isCompleted = true;
          setSelected({ ko: null, en: null, ja: null });
          setIsMatchingSuccess(false);
          onMatchSuccess(matchedWord || matchedId);
        };

        // 안전 폴백 타이머 (음성 합성 미지원/에러/지연 시 최대 2.8초 후 강제 완료)
        const fallbackTimer = window.setTimeout(complete, 2800);

        // 마지막 단어(일본어 등) 발음 onend 이벤트 완료 대기
        speechPromise
          .then(() => {
            // 발음 종료 후 약 400ms(300~500ms 여유) 대기 후 정답 처리 및 모달 오픈
            window.setTimeout(() => {
              clearTimeout(fallbackTimer);
              complete();
            }, 400);
          })
          .catch(() => {
            clearTimeout(fallbackTimer);
            complete();
          });
      } else {
        playErrorBuzzer();
        setIsShaking(true);
        const failedIds = [newSelected.ko, newSelected.en, newSelected.ja].filter(
          (id): id is string | number => id !== null
        );
        onMatchFail(failedIds);
        setTimeout(() => {
          setSelected({ ko: null, en: null, ja: null });
          setIsShaking(false);
        }, 550);
      }
    }
  };

  const columns: {
    lang: Language;
    title: string;
    sub: string;
    list: ShuffledCard[];
    borderColor: string;
    headerBg: string;
    headerTextColor: string;
    activeBorderColor: string;
    activeBgColor: string;
  }[] = [
    {
      lang: 'ko',
      title: '🇰🇷 한국어',
      sub: 'KR',
      list: koList,
      borderColor: '#f59e0b',
      headerBg: 'rgba(245, 158, 11, 0.15)',
      headerTextColor: '#fbbf24',
      activeBorderColor: '#f59e0b',
      activeBgColor: 'rgba(120, 53, 15, 0.85)',
    },
    {
      lang: 'en',
      title: '🇺🇸 English',
      sub: 'EN',
      list: enList,
      borderColor: '#06b6d4',
      headerBg: 'rgba(6, 182, 212, 0.15)',
      headerTextColor: '#22d3ee',
      activeBorderColor: '#06b6d4',
      activeBgColor: 'rgba(22, 78, 99, 0.85)',
    },
    {
      lang: 'ja',
      title: '🇯🇵 日本語',
      sub: 'JP',
      list: jaList,
      borderColor: '#10b981',
      headerBg: 'rgba(16, 185, 129, 0.15)',
      headerTextColor: '#34d399',
      activeBorderColor: '#10b981',
      activeBgColor: 'rgba(6, 78, 59, 0.85)',
    },
  ];

  return (
    <div
      className="w-full flex-1 min-h-0 h-full flex flex-col px-1 sm:px-2 md:px-3 pb-0.5 sm:pb-1 md:pb-2"
    >
      {/* 스테이지 라벨 바 (출제 범위 안내) */}
      {(stageLabel || stageRangeLabel) && (
        <div
          className="flex items-center justify-center gap-1.5 sm:gap-2 pb-0.5 sm:pb-1 flex-shrink-0"
        >
          {stageLabel && (
            <span
              className="text-[9px] sm:text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/35 tracking-wider"
            >
              ⚔️ {stageLabel}
            </span>
          )}
          {stageRangeLabel && (
            <span className="text-[8px] sm:text-[9px] md:text-xs font-bold text-slate-400 tracking-tight">
              {stageRangeLabel}
            </span>
          )}
        </div>
      )}

      {/* 3열 그리드 또는 클리어/빈 상태 폴백 UI */}
      {displayWords.length === 0 ? (
        <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-900/90 border border-slate-700 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-3xl mb-3 shadow-inner animate-bounce">
            🎉✨
          </div>
          <h3 className="text-lg sm:text-xl font-black text-emerald-300 mb-1">
            모든 단어를 클리어했어요!
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-sm leading-relaxed mb-3">
            모든 약점 단어를 성공적으로 맞혔습니다. 다음 스테이지나 메인 배틀로 복귀합니다!
          </p>
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div
          className="w-full grid grid-cols-3 gap-1.5 sm:gap-2.5 md:gap-3 lg:gap-4 flex-1 min-h-0 h-full"
        >
          {columns.map(
            ({
              lang,
              title,
              sub,
              list,
              borderColor,
              headerBg,
              headerTextColor,
              activeBorderColor,
              activeBgColor,
            }) => (
              <div
                key={lang}
                className="rounded-xl sm:rounded-2xl bg-slate-900 border p-1 sm:p-1.5 md:p-2 flex flex-col h-full min-h-0 justify-between shadow-md overflow-hidden"
                style={{
                  backgroundColor: '#0f172a',
                  borderColor: `${borderColor}55`,
                  borderWidth: '1.5px',
                }}
              >
                {/* 슬림 열 헤더 */}
                <div
                  className="flex items-center justify-between px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 rounded-lg sm:rounded-xl mb-1.5 sm:mb-2 md:mb-2.5 flex-none"
                  style={{
                    backgroundColor: headerBg,
                    border: `1px solid ${borderColor}66`,
                  }}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span
                      className="font-black text-xs sm:text-sm md:text-base lg:text-lg truncate"
                      style={{ color: headerTextColor }}
                    >
                      <span className="hidden xs:inline sm:inline">{title}</span>
                      <span className="inline xs:hidden sm:hidden">{sub}</span>
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs md:text-sm font-black px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-950 border border-white/20 text-slate-200 flex-shrink-0"
                  >
                    <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-400" />
                    <span>{clearedIds.length}/{displayWords.length}</span>
                  </div>
                </div>

                {/* 카드 리스트: 6개 카드가 잔여 높이를 균등 배분 (여유 간격 확보 및 오버플로우 방지) */}
                <div
                  className="flex-1 min-h-0 flex flex-col justify-between gap-1.5 sm:gap-2 md:gap-2.5"
                >
                  {list.map((card) => {
                    const isCleared = clearedIds.includes(card.id);
                    const isSelected = selected[lang] === card.id;

                    let borderStyle = '1px solid #334155';
                    let bgStyle = '#1e293b';
                    let colorStyle = '#ffffff';
                    let opacityStyle = 1;
                    let textDeco = 'none';

                    if (isCleared) {
                      bgStyle = '#0b1120';
                      borderStyle = '1px solid #1e293b';
                      colorStyle = '#64748b';
                      opacityStyle = 0.4;
                      textDeco = 'line-through';
                    } else if (isSelected) {
                      bgStyle = activeBgColor;
                      borderStyle = `2px solid ${activeBorderColor}`;
                      colorStyle = '#ffffff';
                    }

                    // 텍스트 길이 및 일본어 여부에 따른 반응형 최적 폰트 크기 계산
                    const textLen = (card.text || '').length;
                    const isLongText = textLen >= 9;
                    const isMediumText = textLen >= 7;

                    let mainTextSizeClass = 'text-base sm:text-lg md:text-xl font-bold sm:font-black';
                    if (card.lang === 'ja') {
                      mainTextSizeClass = card.subText
                        ? 'text-sm sm:text-base md:text-lg font-bold sm:font-black'
                        : isLongText
                        ? 'text-xs sm:text-sm md:text-base font-bold sm:font-black'
                        : 'text-sm sm:text-base md:text-lg font-bold sm:font-black';
                    } else if (isLongText) {
                      mainTextSizeClass = 'text-xs sm:text-sm md:text-base font-bold sm:font-black';
                    } else if (isMediumText) {
                      mainTextSizeClass = 'text-sm sm:text-base md:text-lg font-bold sm:font-black';
                    }

                    return (
                      <button
                        key={`${card.lang}-${card.id}`}
                        type="button"
                        onClick={() => handleCardClick(card)}
                        disabled={isCleared}
                        className={`w-full flex-1 min-h-[36px] sm:min-h-[46px] md:min-h-[52px] rounded-xl sm:rounded-2xl px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 flex items-center justify-between transition-all duration-150 relative overflow-hidden group select-none ${
                          isCleared
                            ? 'cursor-default'
                            : 'cursor-pointer hover:brightness-110 active:scale-[0.98]'
                        } ${isSelected ? 'ring-2 ring-white/70 shadow-lg scale-[1.01]' : ''}`}
                        style={{
                          backgroundColor: bgStyle,
                          border: borderStyle,
                          color: colorStyle,
                          opacity: opacityStyle,
                        }}
                      >
                        {/* 큼직하고 시원시원한 단어 텍스트 (수직 중앙 정렬 및 일본어 2줄 밸런스 유지) */}
                        <div className="flex flex-col min-w-0 flex-1 text-left justify-center pr-1 overflow-hidden">
                          <span
                            className={`${mainTextSizeClass} leading-tight sm:leading-snug truncate tracking-tight`}
                            style={{ textDecoration: textDeco }}
                          >
                            {card.text}
                          </span>
                          {card.subText && (
                            <span
                              className="text-[10px] sm:text-xs md:text-sm font-semibold text-emerald-400 leading-tight truncate mt-0.5"
                              style={{ textDecoration: textDeco }}
                            >
                              {card.subText}
                            </span>
                          )}
                        </div>

                        {/* 스피커 발음 청취 아이콘 (수직 중앙 정렬 및 여유 크기) */}
                        <div className="ml-1 sm:ml-1.5 md:ml-2 flex-shrink-0 flex items-center justify-center">
                          {isCleared ? (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-emerald-400" />
                            </div>
                          ) : (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isMatchingSuccess) return;
                                playCardTapSound();
                                const langMap: Record<Language, SpeechLang> = {
                                  ko: 'ko-KR',
                                  en: 'en-US',
                                  ja: 'ja-JP',
                                };
                                speak(card.text, langMap[card.lang]);
                              }}
                              className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer shadow-sm hover:scale-110 active:scale-90 ${
                                isSelected
                                  ? 'bg-cyan-400 text-slate-950 shadow-cyan-400/50'
                                  : 'bg-slate-950/70 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white'
                              }`}
                              title="발음 듣기"
                              aria-label={`${card.text} 발음 듣기`}
                            >
                              <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-current transition-transform group-hover:scale-105" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
