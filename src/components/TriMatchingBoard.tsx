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
      sub: 'KO',
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
      sub: 'JA',
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
      className="w-full max-w-5xl mx-auto flex-1 min-h-0 h-full flex flex-col px-1.5 sm:px-2 pb-1"
      style={{
        width: '100%',
        maxWidth: '1024px',
        margin: '0 auto',
        flex: 1,
        minHeight: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '2px',
      }}
    >
      {/* 스테이지 라벨 바 (출제 범위 안내) */}
      {(stageLabel || stageRangeLabel) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            paddingBottom: '4px',
            flexShrink: 0,
          }}
        >
          {stageLabel && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 900,
                padding: '1px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(6, 182, 212, 0.12)',
                color: '#22d3ee',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                letterSpacing: '0.05em',
              }}
            >
              ⚔️ {stageLabel}
            </span>
          )}
          {stageRangeLabel && (
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#475569', letterSpacing: '0.02em' }}>
              {stageRangeLabel}
            </span>
          )}
        </div>
      )}

      {/* 3열 그리드 (화면 세로 잔여 높이 100% 꽉 채움) */}
      <div
        className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 flex-1 min-h-0 h-full"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          flex: 1,
          minHeight: 0,
          height: '100%',
        }}
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
              className="rounded-2xl bg-slate-900 border p-1.5 sm:p-2 flex flex-col h-full min-h-0 justify-between shadow-lg"
              style={{
                backgroundColor: '#0f172a',
                border: `1.5px solid ${borderColor}55`,
                borderRadius: '16px',
                padding: '6px 8px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
                justifyContent: 'space-between',
              }}
            >
              {/* 슬림 열 헤더 */}
              <div
                className="flex items-center justify-between p-1 sm:p-1.5 rounded-xl mb-1 flex-none"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '3px 8px',
                  backgroundColor: headerBg,
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}66`,
                  marginBottom: '4px',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: headerTextColor }}>
                    {title}
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
                    ({sub})
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    backgroundColor: '#020617',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#e2e8f0',
                  }}
                >
                  <Sparkles style={{ width: '10px', height: '10px', color: '#facc15' }} />
                  <span>{clearedIds.length}/{displayWords.length}</span>
                </div>
              </div>

              {/* 카드 리스트: N개 카드가 잔여 높이를 균등 1/N 배분 (flex-1) */}
              <div
                className="flex-1 min-h-0 flex flex-col justify-between gap-1"
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '4px',
                }}
              >
                {list.map((card) => {
                  const isCleared = clearedIds.includes(card.id);
                  const isSelected = selected[lang] === card.id;

                  let borderStyle = '1.5px solid #334155';
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
                      borderStyle = '2px solid #ef4444';
                      colorStyle = '#fecaca';
                    } else {
                      bgStyle = activeBgColor;
                      borderStyle = `2px solid ${activeBorderColor}`;
                      colorStyle = '#ffffff';
                    }
                  }

                  return (
                    <button
                      key={`${lang}-${card.id}`}
                      type="button"
                      disabled={isCleared}
                      onClick={() => handleCardClick(card)}
                      className={`group flex-1 min-h-0 w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center justify-between font-black transition-all cursor-pointer ${
                        isSelected && isShaking ? 'animate-mismatch-shake' : ''
                      }`}
                      style={{
                        flex: 1,
                        minHeight: 0,
                        width: '100%',
                        padding: '6px 12px',
                        borderRadius: '14px',
                        backgroundColor: bgStyle,
                        border: borderStyle,
                        color: colorStyle,
                        opacity: opacityStyle,
                        textDecoration: textDeco,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: 900,
                        cursor: isCleared ? 'default' : 'pointer',
                        transition: 'all 0.12s ease',
                        boxShadow: isSelected ? `0 0 12px ${activeBorderColor}` : 'none',
                        textAlign: 'left',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          minWidth: 0,
                          flex: 1,
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        <span
                          className="truncate text-xl sm:text-2xl lg:text-3xl font-black"
                          style={{
                            lineHeight: '1.2',
                            letterSpacing: '0.01em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {card.text}
                        </span>
                        {card.subText && (
                          <span
                            className="truncate text-xs sm:text-sm md:text-base text-emerald-300 font-bold"
                            style={{
                              lineHeight: '1.15',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: '2px',
                            }}
                          >
                            {card.subText}
                          </span>
                        )}
                      </div>

                      <div style={{ marginLeft: '8px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        {isCleared ? (
                          <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
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
                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-150 cursor-pointer shadow-sm hover:scale-110 active:scale-95 ${
                              isSelected
                                ? 'bg-cyan-400 text-slate-950 shadow-cyan-400/50'
                                : 'bg-slate-950/70 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white'
                            }`}
                            title="발음 듣기"
                            aria-label={`${card.text} 발음 듣기`}
                          >
                            <Volume2 className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:scale-105" />
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
