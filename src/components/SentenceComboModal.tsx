import React, { useState, useEffect } from 'react';
import type { WordSentenceData } from '../types';
import { Volume2, CheckCircle2, Sparkles, Zap, Flame } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { playCardTapSound, playDingDongSuccess } from '../utils/soundEffects';
import { getCleanTtsText } from '../utils/sentenceUtils';

// 일본어 한자(후리가나) 괄호 표기를 루비 태그로 변환하여 시각적으로 자연스럽게 렌더링
const renderJapaneseSentence = (sentence: string) => {
  const regex = /([\u4E00-\u9FAF\u3040-\u3096\u30A0-\u30FA々]+)\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sentence)) !== null) {
    if (match.index > lastIndex) {
      parts.push(sentence.substring(lastIndex, match.index));
    }
    const kanji = match[1];
    const kana = match[2];
    parts.push(
      <ruby key={`${match.index}-${kanji}`} className="px-0.5 inline-flex flex-col items-center align-bottom leading-none">
        <rt className="text-[11px] sm:text-xs text-emerald-400 font-bold tracking-normal mb-0.5 select-none">
          {kana}
        </rt>
        <span className="text-lg sm:text-xl font-bold text-green-300">
          {kanji}
        </span>
      </ruby>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < sentence.length) {
    parts.push(sentence.substring(lastIndex));
  }

  return parts.length > 0 ? parts : sentence;
};

interface SentenceComboModalProps {
  isOpen: boolean;
  sentenceData: WordSentenceData | null;
  onAttack: () => void;
  onClose?: () => void;
  isCritical?: boolean;
}

export const SentenceComboModal: React.FC<SentenceComboModalProps> = ({
  isOpen,
  sentenceData,
  onAttack,
  isCritical = false,
}) => {
  const { speak } = useSpeech();
  const [hasListened, setHasListened] = useState({
    kr: false,
    en: false,
    jp: false,
  });
  const [playingLang, setPlayingLang] = useState<'kr' | 'en' | 'jp' | null>(null);

  // 모달이 열리거나 새로운 단어가 주어질 때 청취 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setHasListened({ kr: false, en: false, jp: false });
      setPlayingLang(null);
    } else {
      // 모달이 닫히면 재생 중인 음성 정지
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen, sentenceData?.word?.id]);

  if (!isOpen || !sentenceData) {
    return null;
  }

  const listenedCount =
    (hasListened.kr ? 1 : 0) + (hasListened.en ? 1 : 0) + (hasListened.jp ? 1 : 0);
  const allListened = listenedCount === 3;
  const isAnyPlaying = playingLang !== null;
  const canAttack = allListened && !isAnyPlaying;

  const handleListen = async (lang: 'kr' | 'en' | 'jp') => {
    // 재생 도중 다른 음성 버튼 난타 방어
    if (isAnyPlaying) return;

    playCardTapSound();
    setPlayingLang(lang);

    try {
      let cleanText = '';
      let speechLang: 'ko-KR' | 'en-US' | 'ja-JP' = 'ko-KR';

      if (lang === 'kr') {
        cleanText = getCleanTtsText(sentenceData.krSentence, 'ko-KR');
        speechLang = 'ko-KR';
      } else if (lang === 'en') {
        cleanText = getCleanTtsText(sentenceData.enSentence, 'en-US');
        speechLang = 'en-US';
      } else if (lang === 'jp') {
        // 괄호 및 후리가나 기호를 제거한 순수 한자/가나 텍스트로 TTS 재생
        cleanText = getCleanTtsText(sentenceData.jpSentence, 'ja-JP');
        speechLang = 'ja-JP';
      }

      // 브라우저 음성 재생 종료(utterance.onend / onerror / fallback timer)까지 완료 대기
      await speak(cleanText, speechLang);
    } catch (e) {
      console.warn('Speech playback failed, safely resolving state:', e);
    } finally {
      setPlayingLang(null);

      // 음성 재생이 실제로 끝난 시점에 청취 완료 상태 갱신
      setHasListened((prev) => {
        const next = { ...prev, [lang]: true };
        const nextCount = (next.kr ? 1 : 0) + (next.en ? 1 : 0) + (next.jp ? 1 : 0);
        if (nextCount === 3 && !prev[lang]) {
          playDingDongSuccess();
        }
        return next;
      });
    }
  };

  const handleAttackClick = () => {
    if (!canAttack) return;
    playCardTapSound();
    onAttack();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
    >
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-amber-500/20 flex flex-col relative overflow-hidden">
        {/* 상단 장식 불꽃 그라데이션 라인 */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-300" />

        {/* 상단 헤더: 고질라 테마 배너 타이틀 */}
        <div className="flex flex-col items-center text-center mb-4 sm:mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/70 border border-amber-400/60 text-amber-300 text-xs sm:text-sm font-black mb-2 shadow-inner">
            {isCritical ? (
              <>
                <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
                <span>🔥 파워 포효 성공! 크리티컬 콤보 회화</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>✨ 3단어 매칭 성공! 미니 콤보 회화</span>
              </>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white flex items-center gap-2">
            <span>고질라 한 줄 문장 파워!</span>
            <span className="text-amber-400 text-lg sm:text-xl font-bold">
              ({sentenceData.word?.ko || '단어'})
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            3개 국어 소리를 끝까지 모두 듣고 고질라의 강력한 열선 공격을 발사하세요!
          </p>
        </div>

        {/* 3개 국어 문장 카드 리스트 (초등 2학년 맞춤형 큼직한 레이아웃) */}
        <div className="flex flex-col gap-2.5 sm:gap-3.5 mb-5 sm:mb-6">
          {/* 1. 한국어 카드 */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
              playingLang === 'kr'
                ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/20'
                : hasListened.kr
                ? 'bg-amber-950/30 border-amber-400/90 shadow-md shadow-amber-500/10'
                : 'bg-slate-950/70 border-slate-700/80 hover:border-amber-400/50'
            }`}
          >
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-xs font-black text-amber-400 mb-1 flex items-center gap-1.5">
                <span>🇰🇷 한국어</span>
                {playingLang === 'kr' ? (
                  <span className="text-[10px] text-amber-200 font-black bg-amber-500/30 px-2 py-0.5 rounded-full animate-pulse border border-amber-400/50">
                    재생 중... 🔊
                  </span>
                ) : hasListened.kr ? (
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-400/20 px-2 py-0.5 rounded-full">
                    청취 완료
                  </span>
                ) : null}
              </span>
              <p className="text-xl sm:text-2xl font-bold text-amber-200 leading-snug break-words">
                {sentenceData.krSentence}
              </p>
            </div>

            <button
              type="button"
              disabled={isAnyPlaying}
              onClick={() => handleListen('kr')}
              className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md ${
                playingLang === 'kr'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 animate-pulse scale-[1.03] cursor-wait'
                  : hasListened.kr
                  ? isAnyPlaying
                    ? 'bg-amber-400/50 text-slate-950/60 cursor-not-allowed'
                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer active:scale-95'
                  : isAnyPlaying
                  ? 'bg-amber-500/40 text-slate-950/50 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse hover:scale-105 active:scale-95 cursor-pointer'
              }`}
            >
              {playingLang === 'kr' ? (
                <>
                  <Volume2 className="w-4 h-4 text-slate-950 animate-bounce" />
                  <span>재생 중... 🔊</span>
                </>
              ) : hasListened.kr ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>다시 듣기</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-slate-950" />
                  <span>소리 듣기</span>
                </>
              )}
            </button>
          </div>

          {/* 2. 영어 카드 */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
              playingLang === 'en'
                ? 'bg-cyan-950/50 border-cyan-400 ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-500/20'
                : hasListened.en
                ? 'bg-cyan-950/30 border-cyan-400/90 shadow-md shadow-cyan-500/10'
                : 'bg-slate-950/70 border-slate-700/80 hover:border-cyan-400/50'
            }`}
          >
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-xs font-black text-cyan-400 mb-1 flex items-center gap-1.5">
                <span>🇺🇸 English</span>
                {playingLang === 'en' ? (
                  <span className="text-[10px] text-cyan-200 font-black bg-cyan-500/30 px-2 py-0.5 rounded-full animate-pulse border border-cyan-400/50">
                    재생 중... 🔊
                  </span>
                ) : hasListened.en ? (
                  <span className="text-[10px] text-cyan-300 font-bold bg-cyan-400/20 px-2 py-0.5 rounded-full">
                    청취 완료
                  </span>
                ) : null}
              </span>
              <p className="text-lg sm:text-xl font-semibold text-blue-300 leading-snug break-words">
                {sentenceData.enSentence}
              </p>
            </div>

            <button
              type="button"
              disabled={isAnyPlaying}
              onClick={() => handleListen('en')}
              className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md ${
                playingLang === 'en'
                  ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-300 animate-pulse scale-[1.03] cursor-wait'
                  : hasListened.en
                  ? isAnyPlaying
                    ? 'bg-cyan-400/50 text-slate-950/60 cursor-not-allowed'
                    : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 cursor-pointer active:scale-95'
                  : isAnyPlaying
                  ? 'bg-cyan-500/40 text-slate-950/50 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 animate-pulse hover:scale-105 active:scale-95 cursor-pointer'
              }`}
            >
              {playingLang === 'en' ? (
                <>
                  <Volume2 className="w-4 h-4 text-slate-950 animate-bounce" />
                  <span>재생 중... 🔊</span>
                </>
              ) : hasListened.en ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>다시 듣기</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-slate-950" />
                  <span>소리 듣기</span>
                </>
              )}
            </button>
          </div>

          {/* 3. 일본어 카드 */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
              playingLang === 'jp'
                ? 'bg-emerald-950/50 border-emerald-400 ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-500/20'
                : hasListened.jp
                ? 'bg-emerald-950/30 border-emerald-400/90 shadow-md shadow-emerald-500/10'
                : 'bg-slate-950/70 border-slate-700/80 hover:border-emerald-400/50'
            }`}
          >
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-xs font-black text-emerald-400 mb-1 flex items-center gap-1.5">
                <span>🇯🇵 日本語</span>
                {playingLang === 'jp' ? (
                  <span className="text-[10px] text-emerald-200 font-black bg-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse border border-emerald-400/50">
                    재생 중... 🔊
                  </span>
                ) : hasListened.jp ? (
                  <span className="text-[10px] text-emerald-300 font-bold bg-emerald-400/20 px-2 py-0.5 rounded-full">
                    청취 완료
                  </span>
                ) : null}
              </span>

              {/* 인라인 후리가나(괄호)가 없을 때만 별도 jpFurigana 라인 출력 */}
              {!/\([^)]+\)/.test(sentenceData.jpSentence) &&
                sentenceData.jpFurigana &&
                sentenceData.jpFurigana !== sentenceData.jpSentence && (
                  <span className="text-xs sm:text-sm text-emerald-400/90 font-bold tracking-wide mb-0.5">
                    {sentenceData.jpFurigana}
                  </span>
                )}

              <div className="text-lg sm:text-xl font-medium text-green-300 leading-snug break-words flex flex-wrap items-end gap-x-1">
                {renderJapaneseSentence(sentenceData.jpSentence)}
              </div>
            </div>

            <button
              type="button"
              disabled={isAnyPlaying}
              onClick={() => handleListen('jp')}
              className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md ${
                playingLang === 'jp'
                  ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-300 animate-pulse scale-[1.03] cursor-wait'
                  : hasListened.jp
                  ? isAnyPlaying
                    ? 'bg-emerald-400/50 text-slate-950/60 cursor-not-allowed'
                    : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 cursor-pointer active:scale-95'
                  : isAnyPlaying
                  ? 'bg-emerald-500/40 text-slate-950/50 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 animate-pulse hover:scale-105 active:scale-95 cursor-pointer'
              }`}
            >
              {playingLang === 'jp' ? (
                <>
                  <Volume2 className="w-4 h-4 text-slate-950 animate-bounce" />
                  <span>재생 중... 🔊</span>
                </>
              ) : hasListened.jp ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>다시 듣기</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-slate-950" />
                  <span>소리 듣기</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 하단 버튼: 3개 언어 음성 필수 청취 후 활성화 */}
        <div className="w-full flex flex-col items-center gap-2">
          <button
            type="button"
            disabled={!canAttack}
            onClick={handleAttackClick}
            className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg transition-all flex items-center justify-center gap-2 ${
              canAttack
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 shadow-xl shadow-amber-500/40 hover:scale-[1.02] active:scale-95 cursor-pointer ring-2 ring-amber-300 animate-pulse'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            {canAttack ? (
              <>
                <Zap className="w-5 h-5 fill-current" />
                <span>{isCritical ? '🔥 크리티컬 광선 발사! 💥' : '⚡ 다음 단어 공격하기! 💥'}</span>
              </>
            ) : isAnyPlaying ? (
              <span>🔊 음성을 끝까지 귀 기울여 듣고 있어요...</span>
            ) : (
              <span>🔒 3개 소리를 모두 들어보세요! ({listenedCount}/3)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
