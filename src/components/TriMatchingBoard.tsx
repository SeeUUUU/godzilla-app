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

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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

  // 안전장치: words prop으로 들어온 배열의 길이가 6개를 초과할 경우를 대비하여 정확히 6개만 슬라이스
  const displayWords = useMemo(() => words.slice(0, 6), [words]);

  const koList = useMemo(
    () =>
      shuffleArray(
        displayWords.map((w) => ({
          id: w.id,
          text: w.ko,
          lang: 'ko' as Language,
        }))
      ),
    [displayWords]
  );

  const enList = useMemo(
    () =>
      shuffleArray(
        displayWords.map((w) => ({
          id: w.id,
          text: w.en,
          lang: 'en' as Language,
        }))
      ),
    [displayWords]
  );

  const jaList = useMemo(
    () =>
      shuffleArray(
        displayWords.map((w) => ({
          id: w.id,
          text: w.ja,
          subText: w.jaKana,
          lang: 'ja' as Language,
        }))
      ),
    [displayWords]
  );

  const [selected, setSelected] = useState<SelectedCards>({
    ko: null,
    en: null,
    ja: null,
  });

  const [isShaking, setIsShaking] = useState(false);

  const handleCardClick = (card: ShuffledCard) => {
    if (clearedIds.includes(card.id) || isShaking) return;

    playCardTapSound();

    const langMap: Record<Language, SpeechLang> = {
      ko: 'ko-KR',
      en: 'en-US',
      ja: 'ja-JP',
    };
    speak(card.text, langMap[card.lang]);

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
        playDingDongSuccess();
        const matchedId = newSelected.ko;
        const matchedWord = displayWords.find((w) => String(w.id) === String(matchedId));
        setSelected({ ko: null, en: null, ja: null });
        onMatchSuccess(matchedWord || matchedId);
      } else {
        playErrorBuzzer();
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

      {/* 3열 그리드: 어떤 너비에서도 균등 3등분(1fr 1fr 1fr) 100% 핏 */}
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
              className="rounded-xl sm:rounded-2xl bg-slate-900 border p-1 sm:p-2 md:p-2.5 flex flex-col h-full min-h-0 justify-between shadow-md overflow-hidden"
              style={{
                backgroundColor: '#0f172a',
                borderColor: `${borderColor}55`,
                borderWidth: '1.5px',
              }}
            >
              {/* 슬림 열 헤더 */}
              <div
                className="flex items-center justify-between px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1.5 rounded-lg sm:rounded-xl mb-0.5 sm:mb-1 md:mb-1.5 flex-none"
                style={{
                  backgroundColor: headerBg,
                  border: `1px solid ${borderColor}66`,
                }}
              >
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className="font-black text-[11px] sm:text-xs md:text-base lg:text-lg truncate"
                    style={{ color: headerTextColor }}
                  >
                    <span className="hidden xs:inline sm:inline">{title}</span>
                    <span className="inline xs:hidden sm:hidden">{sub}</span>
                  </span>
                </div>
                <div
                  className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] md:text-xs font-black px-1 sm:px-1.5 md:px-2 py-0.2 sm:py-0.5 rounded-full bg-slate-950 border border-white/20 text-slate-200 flex-shrink-0"
                >
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-amber-400" />
                  <span>{clearedIds.length}/{displayWords.length}</span>
                </div>
              </div>

              {/* 카드 리스트: 6개 카드가 잔여 높이를 균등 배분 */}
              <div
                className="flex-1 min-h-0 flex flex-col justify-between gap-1 sm:gap-1.5 md:gap-2"
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
                    if (isShaking) {
                      bgStyle = '#450a0a';
                      borderStyle = '1.5px solid #ef4444';
                      colorStyle = '#fecaca';
                    } else {
                      bgStyle = activeBgColor;
                      borderStyle = `1.5px solid ${activeBorderColor}`;
                      colorStyle = '#ffffff';
                    }
                  }

                  return (
                    <button
                      key={`${lang}-${card.id}`}
                      type="button"
                      disabled={isCleared}
                      onClick={() => handleCardClick(card)}
                      className={`group flex-1 min-h-0 w-full px-1.5 sm:px-2.5 md:px-4 py-0.5 sm:py-1 md:py-2 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-between font-black transition-all cursor-pointer min-h-[30px] sm:min-h-[42px] md:min-h-[50px] lg:min-h-[56px] landscape-short:min-h-[26px] landscape-short:py-0.5 ${
                        isSelected && isShaking ? 'animate-mismatch-shake' : ''
                      }`}
                      style={{
                        backgroundColor: bgStyle,
                        border: borderStyle,
                        color: colorStyle,
                        opacity: opacityStyle,
                        textDecoration: textDeco,
                        boxShadow: isSelected ? `0 0 10px ${activeBorderColor}` : 'none',
                        cursor: isCleared ? 'default' : 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div className="flex flex-col min-w-0 flex-1 justify-center overflow-hidden pr-0.5 sm:pr-1 md:pr-2">
                        <span
                          className="truncate text-xs sm:text-base md:text-xl lg:text-2xl font-bold sm:font-black tracking-tight landscape-short:text-[10px]"
                          style={{
                            lineHeight: '1.2',
                          }}
                        >
                          {card.text}
                        </span>
                        {card.subText && (
                          <span
                            className="truncate text-[7px] xs:text-[8px] sm:text-[10px] md:text-xs lg:text-sm text-emerald-300 font-semibold md:font-bold mt-0.5 leading-none landscape-short:text-[7px]"
                          >
                            {card.subText}
                          </span>
                        )}
                      </div>

                      <div className="ml-1 sm:ml-1.5 md:ml-2 flex-shrink-0 flex items-center">
                        {isCleared ? (
                          <div className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-9 lg:h-9 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-emerald-400" />
                          </div>
                        ) : (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              playCardTapSound();
                              const langMap: Record<Language, SpeechLang> = {
                                ko: 'ko-KR',
                                en: 'en-US',
                                ja: 'ja-JP',
                              };
                              speak(card.text, langMap[card.lang]);
                            }}
                            className={`w-4 h-4 xs:w-5 xs:h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer shadow-sm hover:scale-110 active:scale-90 landscape-short:w-4 landscape-short:h-4 ${
                              isSelected
                                ? 'bg-cyan-400 text-slate-950 shadow-cyan-400/50'
                                : 'bg-slate-950/70 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white'
                            }`}
                            title="발음 듣기"
                            aria-label={`${card.text} 발음 듣기`}
                          >
                            <Volume2 className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 transition-transform group-hover:scale-105" />
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
    </div>
  );
};
