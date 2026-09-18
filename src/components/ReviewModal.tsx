import React from 'react';
import type { WordItem } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import {
  X,
  Volume2,
  Trash2,
  Swords,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { playCardTapSound } from '../utils/soundEffects';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  wrongWords: WordItem[];
  onClearWrongWords: () => void;
  onRemoveWord: (id: number) => void;
  onStartReviewBattle: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  wrongWords,
  onClearWrongWords,
  onRemoveWord,
  onStartReviewBattle,
}) => {
  const { speak } = useSpeech();

  if (!isOpen) {
    return null;
  }

  const handleSpeak = (text: string, lang: 'ko-KR' | 'en-US' | 'ja-JP') => {
    playCardTapSound();
    speak(text, lang);
  };

  const handleStartBattle = () => {
    playCardTapSound();
    onStartReviewBattle();
  };

  const handleClearAll = () => {
    playCardTapSound();
    if (window.confirm('오답노트에 저장된 모든 단어를 삭제할까요?')) {
      onClearWrongWords();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
      }}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border-2 border-red-500/50 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-fadeIn"
        style={{
          maxHeight: '90vh',
          boxShadow: '0 0 35px rgba(239, 68, 68, 0.25), 0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* 모달 상단 헤더 */}
        <div
          className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  오답노트 & 복습 특훈
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40">
                  {wrongWords.length}단어
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                틀렸던 단어들을 듣고 복습하여 보스전에서 격파해 보세요!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 (단어 리스트 영역) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {wrongWords.length === 0 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-3xl mb-3 shadow-inner">
                🦖✨
              </div>
              <h3 className="text-base font-black text-slate-200 mb-1">
                오답노트가 깨끗해요!
              </h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                현재 틀린 단어가 없습니다. 매칭 게임에서 오답이 발생하면 이곳에 자동으로 기억되어 언제든 다시 복습할 수 있어요!
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-bold">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  스피커 아이콘을 눌러 각 언어 발음을 들어보세요
                </span>
                <span>총 {wrongWords.length}개</span>
              </div>

              <div className="space-y-2">
                {wrongWords.map((word, idx) => (
                  <div
                    key={`${word.id}-${word.ko}-${idx}`}
                    className="group bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl p-2.5 transition-all flex items-center justify-between gap-2 shadow-sm"
                  >
                    {/* 번호 뱃지 */}
                    <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 flex-none flex items-center justify-center text-[11px] font-black text-slate-400">
                      {idx + 1}
                    </div>

                    {/* 3개 국어 단어 그리드 */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {/* 1. 한국어 */}
                      <div className="flex items-center justify-between bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-cyan-500/20">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-[10px] text-cyan-400 font-bold flex-none">🇰🇷</span>
                          <span className="text-xs font-black text-slate-100 truncate">
                            {word.ko}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSpeak(word.ko, 'ko-KR')}
                          title="한국어 발음 듣기"
                          className="p-1 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/40 rounded transition-colors flex-none cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* 2. 영어 */}
                      <div className="flex items-center justify-between bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-[10px] text-amber-400 font-bold flex-none">🇺🇸</span>
                          <span className="text-xs font-black text-amber-200 truncate">
                            {word.en}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSpeak(word.en, 'en-US')}
                          title="영어 발음 듣기"
                          className="p-1 text-amber-400 hover:text-amber-200 hover:bg-amber-950/40 rounded transition-colors flex-none cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* 3. 일본어 */}
                      <div className="flex items-center justify-between bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                        <div className="flex flex-col min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="text-[10px] text-emerald-400 font-bold flex-none">🇯🇵</span>
                            <span className="text-xs font-black text-emerald-200 truncate">
                              {word.ja}
                            </span>
                          </div>
                          {word.jaKana && (
                            <span className="text-[9px] text-emerald-400/80 font-medium pl-4 truncate">
                              {word.jaKana}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSpeak(word.ja, 'ja-JP')}
                          title="일본어 발음 듣기"
                          className="p-1 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/40 rounded transition-colors flex-none cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 개별 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={() => {
                        playCardTapSound();
                        onRemoveWord(word.id);
                      }}
                      title="이 단어 오답노트에서 제거"
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors flex-none cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 모달 하단 버튼 바 */}
        <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2 flex-none">
          {/* 좌측: 전체 삭제 */}
          {wrongWords.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-slate-700 hover:border-red-500/40 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>전체 삭제</span>
            </button>
          ) : (
            <div />
          )}

          {/* 우측: 닫기 & 오답 복습 배틀 시작 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
            >
              닫기
            </button>

            {wrongWords.length > 0 && (
              <button
                type="button"
                onClick={handleStartBattle}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:brightness-110 active:scale-95 shadow-lg shadow-orange-500/25 border border-amber-200 transition-all cursor-pointer"
              >
                <Swords className="w-4 h-4 fill-slate-950" />
                <span>⚡ 오답 복습 배틀 시작! ({wrongWords.length}단어)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
