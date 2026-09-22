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

  // 안전장치: words prop으로 들어온 배열의 유효성을 검증하고 정확히 6개만 슬라이스 (undefined 방어)
  const displayWords = useMemo<WordItem[]>(() => {
    if (!Array.isArray(words) || words.length === 0) return [];
    return words.filter((w): w is WordItem => !!w && typeof w === 'object' && 'id' in w).slice(0, 6);
  }, [words]);

  const koList = useMemo(
    () =>
      shuffleArray(
        displayWords.map((w) => ({
          id: w.id,
          text: w.ko || '',
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
          text: w.en || '',
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
          text: w.ja || '',
          subText: w.jaKana || '',
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
                  className="flex items-center justify-between px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 rounded-lg sm:rounded-xl mb-1 sm:mb-1 flex-none"
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

                {/* 카드 리스트: 6개 카드가 잔여 높이를 균등 배분 (큼직한 폰트 유지, 세로 패딩 미세 축소) */}
                <div
                  className="flex-1 min-h-0 flex flex-col justify-between gap-1 sm:gap-1.5 md:gap-1.5"
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

                    return (
                      <button
                        key={`${card.lang}-${card.id}`}
                        type="button"
                        onClick={() => handleCardClick(card)}
                        disabled={isCleared}
                        className={`w-full flex-1 min-h-[34px] sm:min-h-[40px] md:min-h-[46px] rounded-xl sm:rounded-2xl px-2 sm:px-3 md:px-3.5 py-0.5 sm:py-1 flex items-center justify-between transition-all duration-150 relative overflow-hidden group select-none ${
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
                        {/* 큼직하고 시원시원한 단어 텍스트 (초등 2학년 맞춤) */}
                        <div className="flex flex-col min-w-0 flex-1 text-left py-0.5 justify-center">
                          <span
                            className="font-bold sm:font-black text-base sm:text-lg md:text-xl lg:text-2xl leading-tight sm:leading-snug truncate tracking-tight"
                            style={{ textDecoration: textDeco }}
                          >
                            {card.text}
                          </span>
                          {card.subText && (
                            <span
                              className="text-xs sm:text-sm font-bold text-emerald-400 leading-tight truncate mt-0.5"
                              style={{ textDecoration: textDeco }}
                            >
                              {card.subText}
                            </span>
                          )}
                        </div>

                        {/* 스피커 발음 청취 아이콘 (중앙 정렬 및 적정 크기) */}
                        <div className="ml-1 sm:ml-2 md:ml-2.5 flex-shrink-0 flex items-center justify-center">
                          {isCleared ? (
                            <div className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-emerald-400" />
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
                              className={`w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer shadow-sm hover:scale-110 active:scale-90 ${
                                isSelected
                                  ? 'bg-cyan-400 text-slate-950 shadow-cyan-400/50'
                                  : 'bg-slate-950/70 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white'
                              }`}
                              title="발음 듣기"
                              aria-label={`${card.text} 발음 듣기`}
                            >
                              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-current transition-transform group-hover:scale-105" />
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
