import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Volume2, Zap, Sparkles, RotateCcw, HelpCircle, CheckCircle2, Flame, Puzzle, Headphones } from 'lucide-react';
import type { WordItem } from '../types';
import { buildMiniComboSentences, type MiniComboSentences } from '../utils/miniComboSentences';
import { playCardTapSound, playDingDongSuccess } from '../utils/soundEffects';

interface MiniComboModalProps {
  word: WordItem;
  onComplete: () => void;
}

interface BlockToken {
  id: number;
  text: string;
}

type PuzzleLang = 'en' | 'ja' | 'ko';

function getTokensForLang(lang: PuzzleLang, sentences: MiniComboSentences): string[] {
  if (lang === 'en') {
    return sentences.en.trim().split(/\s+/).filter(Boolean);
  }
  if (lang === 'ja') {
    const parts = [
      sentences.ja.before.trim(),
      sentences.ja.term || sentences.ja.reading,
      sentences.ja.after.trim(),
    ].filter(Boolean);
    return parts.length > 0 ? parts : sentences.ja.spoken.trim().split(/\s+/).filter(Boolean);
  }
  return sentences.ko.trim().split(/\s+/).filter(Boolean);
}

function createShuffledTokens(tokens: string[]): BlockToken[] {
  const items: BlockToken[] = tokens.map((text, id) => ({ id, text }));
  if (items.length <= 1) return items;
  const shuffled = [...items];
  let tries = 0;
  while (tries < 10) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const isDifferent = shuffled.some((item, idx) => item.id !== items[idx].id);
    if (isDifferent) break;
    tries++;
  }
  return shuffled;
}

export const MiniComboModal = ({ word, onComplete }: MiniComboModalProps) => {
  const [activeTab, setActiveTab] = useState<'listen' | 'puzzle'>('listen');
  const [heardCount, setHeardCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [speechError, setSpeechError] = useState('');
  const [canReadFallback, setCanReadFallback] = useState(false);
  const heardCountRef = useRef(0);
  const isPlayingRef = useRef(false);
  const sessionRef = useRef(0);
  const nextTimerRef = useRef<number | null>(null);
  const watchdogRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // 문장 블록 조립 퍼즐 (L3) 상태
  const [puzzleLang, setPuzzleLang] = useState<PuzzleLang>('en');
  const [placedTokens, setPlacedTokens] = useState<BlockToken[]>([]);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [puzzleShake, setPuzzleShake] = useState(false);

  const sentences = useMemo(() => buildMiniComboSentences(word), [word]);
  const lines = useMemo(() => [
    { label: '한국어', flag: '🇰🇷', lang: 'ko-KR', text: sentences.ko, color: '#fbbf24' },
    { label: '영어', flag: '🇺🇸', lang: 'en-US', text: sentences.en, color: '#67e8f9' },
    { label: '일본어', flag: '🇯🇵', lang: 'ja-JP', text: sentences.ja.spoken, color: '#c4b5fd' },
  ], [sentences]);

  // 퍼즐 정답 토큰 목록
  const targetTokens = useMemo(() => getTokensForLang(puzzleLang, sentences), [puzzleLang, sentences]);

  // 섞인 블록 목록
  const initialPoolTokens = useMemo(() => createShuffledTokens(targetTokens), [targetTokens]);

  // 언어나 단어가 바뀔 때 퍼즐 상태 초기화
  useEffect(() => {
    setPlacedTokens([]);
    setIsPuzzleSolved(false);
  }, [puzzleLang, word]);

  // 남아있는 선택 가능 풀 토큰
  const availablePoolTokens = useMemo(() => {
    const placedIds = new Set(placedTokens.map((p) => p.id));
    return initialPoolTokens.filter((token) => !placedIds.has(token.id));
  }, [initialPoolTokens, placedTokens]);

  const stopSpeech = useCallback(() => {
    sessionRef.current += 1;
    isPlayingRef.current = false;
    if (nextTimerRef.current !== null) window.clearTimeout(nextTimerRef.current);
    if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current);
    nextTimerRef.current = null;
    watchdogRef.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => () => stopSpeech(), [stopSpeech]);

  const playSentences = () => {
    if (isPlayingRef.current) return;
    const startIndex = heardCountRef.current === lines.length ? 0 : heardCountRef.current;
    stopSpeech();
    setActiveIndex(null);
    setSpeechError('');
    setCanReadFallback(false);
    if (startIndex === 0 && heardCountRef.current === lines.length) {
      heardCountRef.current = 0;
      setHeardCount(0);
    }
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setCanReadFallback(true);
      setSpeechError('이 브라우저에서는 음성을 재생할 수 없어요. 문장을 직접 읽고 진행해 주세요.');
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const session = sessionRef.current;
    const fail = () => {
      if (session !== sessionRef.current) return;
      stopSpeech();
      setActiveIndex(null);
      setIsSpeaking(false);
      setCanReadFallback(true);
      setSpeechError('음성이 끝나지 않았어요. 다시 듣거나 문장을 직접 읽고 진행해 주세요.');
    };

    const playLine = (index: number) => {
      if (session !== sessionRef.current) return;
      const line = lines[index];
      setActiveIndex(index);
      let settled = false;
      const failLine = () => {
        if (settled) return;
        settled = true;
        fail();
      };
      try {
        const utterance = new SpeechSynthesisUtterance(line.text);
        utterance.lang = line.lang;
        utterance.rate = 0.85;
        utterance.onend = () => {
          if (settled || session !== sessionRef.current) return;
          settled = true;
          if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current);
          watchdogRef.current = null;
          setActiveIndex(null);
          heardCountRef.current = index + 1;
          setHeardCount(index + 1);
          if (index + 1 === lines.length) {
            isPlayingRef.current = false;
            setIsSpeaking(false);
          } else {
            nextTimerRef.current = window.setTimeout(() => {
              nextTimerRef.current = null;
              playLine(index + 1);
            }, 180);
          }
        };
        utterance.onerror = failLine;
        watchdogRef.current = window.setTimeout(failLine, 15000);
        window.speechSynthesis.speak(utterance);
      } catch {
        failLine();
      }
    };
    playLine(startIndex);
  };

  // 블록 추가
  const handleAddToken = (token: BlockToken) => {
    if (isPuzzleSolved) return;
    playCardTapSound();
    const nextPlaced = [...placedTokens, token];
    setPlacedTokens(nextPlaced);

    if (nextPlaced.length === targetTokens.length) {
      const isCorrect = nextPlaced.every((t, i) => t.text === targetTokens[i]);
      if (isCorrect) {
        setIsPuzzleSolved(true);
        playDingDongSuccess();
        setHeardCount(lines.length);
        heardCountRef.current = lines.length;
      } else {
        setPuzzleShake(true);
        window.setTimeout(() => setPuzzleShake(false), 500);
      }
    }
  };

  // 슬롯에 놓인 블록 회수
  const handleRemoveToken = (index: number) => {
    if (isPuzzleSolved) return;
    playCardTapSound();
    setPlacedTokens((prev) => prev.filter((_, i) => i !== index));
  };

  // 힌트 소리 재생
  const handlePlayPuzzleHintAudio = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const textToSpeak =
      puzzleLang === 'en'
        ? sentences.en
        : puzzleLang === 'ja'
        ? sentences.ja.spoken
        : sentences.ko;
    const langCode = puzzleLang === 'en' ? 'en-US' : puzzleLang === 'ja' ? 'ja-JP' : 'ko-KR';
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langCode;
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // 다음 올바른 블록 힌트 자동 배치
  const handleAutoHintNext = () => {
    if (isPuzzleSolved) return;
    const nextIdx = placedTokens.length;
    if (nextIdx >= targetTokens.length) return;
    const neededText = targetTokens[nextIdx];
    const candidate = availablePoolTokens.find((t) => t.text === neededText);
    if (candidate) {
      handleAddToken(candidate);
    }
  };

  const handleResetPuzzle = () => {
    if (isPuzzleSolved) return;
    playCardTapSound();
    setPlacedTokens([]);
  };

  const finish = () => {
    if (completedRef.current || isPlayingRef.current) return;
    const canFinish = heardCountRef.current === lines.length || canReadFallback || isPuzzleSolved;
    if (!canFinish) return;
    completedRef.current = true;
    stopSpeech();
    onComplete();
  };

  const canFire = heardCount === lines.length || canReadFallback || isPuzzleSolved;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="미니 콤보 회화"
      style={{
        position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(2, 6, 23, 0.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '520px', maxHeight: '92dvh', overflowY: 'auto',
        background: 'linear-gradient(160deg, #172554, #0f172a 60%)',
        border: '2px solid #38bdf8', borderRadius: '24px', padding: '18px sm:22px',
        boxShadow: '0 0 32px rgba(56, 189, 248, 0.3)', color: '#f8fafc',
      }}>
        {/* 상단 헤더 & 단어 이모지 */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '28px', lineHeight: 1.2 }}>
            🦖💬 {word.emoji && <span style={{ marginLeft: '4px' }}>{word.emoji}</span>}
          </div>
          <h2 style={{ fontSize: '21px', fontWeight: 900, margin: '4px 0' }}>
            미니 콤보 회화 <span style={{ color: '#facc15' }}>({word.ko})</span>
          </h2>
          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0 }}>
            {activeTab === 'listen'
              ? '세 나라의 한 줄 문장을 듣고 열선을 발사해요!'
              : '문장 블록을 순서대로 맞춰 어순을 완성해 보세요!'}
          </p>

          {/* 모드 전환 탭 (듣기 vs 블록 조립) */}
          <div style={{
            display: 'inline-flex',
            marginTop: '12px',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '4px',
            borderRadius: '16px',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            gap: '4px',
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('listen')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'listen' ? '#0284c7' : 'transparent',
                color: activeTab === 'listen' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              <Headphones size={15} /> 3개 국어 듣기
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('puzzle')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'puzzle' ? 'linear-gradient(to right, #ea580c, #f59e0b)' : 'transparent',
                color: activeTab === 'puzzle' ? '#ffffff' : '#94a3b8',
                boxShadow: activeTab === 'puzzle' ? '0 0 12px rgba(245, 158, 11, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Puzzle size={15} /> 🧩 블록 조립 {isPuzzleSolved && '✓'}
            </button>
          </div>
        </div>

        {/* 탭 1: 기존 3개 국어 듣기 모드 */}
        {activeTab === 'listen' ? (
          <>
            <div style={{ display: 'grid', gap: '10px' }}>
              {lines.map((line, index) => (
                <div key={line.lang} aria-current={activeIndex === index ? 'step' : undefined} style={{
                  padding: '12px 14px', borderRadius: '14px',
                  background: activeIndex === index ? '#1e3a8a' : '#0f172a',
                  border: activeIndex === index
                    ? `2px solid ${line.color}`
                    : `1px solid ${index < heardCount ? '#4ade80' : '#334155'}`,
                  boxShadow: activeIndex === index ? `0 0 15px ${line.color}66` : 'none',
                  transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  overflowWrap: 'anywhere',
                }}>
                  <div style={{ color: line.color, fontSize: '12px', fontWeight: 800, marginBottom: '5px' }}>
                    {line.flag} {line.label} {activeIndex === index ? '🔊 지금 듣는 중' : index < heardCount ? '✓ 들었어요' : ''}
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.6 }}>
                    {line.lang === 'ja-JP' ? (
                      <>{sentences.ja.before}<ruby>{sentences.ja.term}{sentences.ja.reading !== sentences.ja.term && <rt>{sentences.ja.reading}</rt>}</ruby>{sentences.ja.after}</>
                    ) : line.text}
                  </div>
                </div>
              ))}
            </div>

            <p role="status" style={{ minHeight: '20px', fontSize: '12px', color: speechError ? '#fca5a5' : '#a7f3d0', margin: '12px 0' }}>
              {speechError || (isSpeaking && activeIndex !== null
                ? `${activeIndex + 1}/3 문장 재생 중...`
                : heardCount === lines.length ? '세 문장을 모두 들었어요!' : `${heardCount}/3 문장 듣기 완료`)}
            </p>

            <button type="button" onClick={playSentences} disabled={isSpeaking}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #67e8f9',
                background: '#0369a1', color: 'white', fontSize: '15px', fontWeight: 900,
                cursor: isSpeaking ? 'default' : 'pointer', opacity: isSpeaking ? 0.65 : 1,
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={18} /> {isSpeaking ? '재생 중...' : heardCount === lines.length ? '처음부터 다시 듣기' : heardCount > 0 ? '남은 문장 듣기' : '3개 국어 문장 듣기'}
            </button>

            {/* 퍼즐 모드로 바로가기 추천 버튼 */}
            {!isPuzzleSolved && (
              <button
                type="button"
                onClick={() => setActiveTab('puzzle')}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: '12px',
                  marginTop: '8px',
                  border: '1px dashed #f59e0b',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#fbbf24',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Puzzle size={15} /> 🧩 직접 단어 블록을 조립해 볼까요? (+보너스 파워!)
              </button>
            )}
          </>
        ) : (
          /* 탭 2: L3 문장 블록 조립 챌린지 모드 */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="flex flex-col">
            {/* 언어 선택 탭 */}
            <div className="flex items-center justify-between gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-700/80">
              <span className="text-xs font-bold text-slate-300">조립할 언어:</span>
              <div className="flex items-center gap-1.5">
                {(['en', 'ja', 'ko'] as const).map((lang) => {
                  const flag = lang === 'en' ? '🇺🇸 영어' : lang === 'ja' ? '🇯🇵 일본어' : '🇰🇷 한국어';
                  const isSelected = puzzleLang === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setPuzzleLang(lang)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold scale-105'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {flag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 뜻 안내 배너 */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/30 text-left">
              <div className="text-[11px] font-bold text-amber-400 mb-0.5">🇰🇷 우리말 뜻</div>
              <div className="text-base font-extrabold text-amber-200">{sentences.ko}</div>
            </div>

            {/* 정답 조립 슬롯 영역 */}
            <div
              className={`p-3.5 rounded-2xl bg-slate-950/90 border-2 transition-all min-h-[90px] flex flex-col justify-center ${
                isPuzzleSolved
                  ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)] bg-emerald-950/30'
                  : puzzleShake
                  ? 'border-red-400 animate-shake'
                  : 'border-cyan-500/50'
              }`}
            >
              <div className="text-[11px] font-bold text-cyan-400 mb-2 flex items-center justify-between">
                <span>{isPuzzleSolved ? '🎉 문장 완성!' : '조립된 문장 (터치하면 취소)'}</span>
                <span className="text-[10px] text-slate-400">
                  {placedTokens.length} / {targetTokens.length} 블록
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
                {placedTokens.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">
                    아래 블록을 순서대로 눌러 문장을 완성해 보세요! 👆
                  </span>
                ) : (
                  placedTokens.map((token, idx) => (
                    <button
                      key={`placed-${token.id}-${idx}`}
                      type="button"
                      onClick={() => handleRemoveToken(idx)}
                      disabled={isPuzzleSolved}
                      className={`px-3 py-1.5 rounded-xl font-black text-sm flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
                        isPuzzleSolved
                          ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-300 animate-pulse'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer'
                      }`}
                    >
                      <span>{token.text}</span>
                      {!isPuzzleSolved && <span className="text-[10px] opacity-70">✕</span>}
                    </button>
                  ))
                )}

                {/* 빈 슬롯 가이드 */}
                {!isPuzzleSolved &&
                  Array.from({ length: Math.max(0, targetTokens.length - placedTokens.length) }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="px-3 py-1.5 rounded-xl border border-dashed border-slate-600 text-slate-600 text-xs font-bold"
                    >
                      ___
                    </div>
                  ))}
              </div>
            </div>

            {/* 성공 배너 연출 */}
            {isPuzzleSolved && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-amber-950/80 border border-emerald-400/80 flex items-center justify-between text-left animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-black text-emerald-300">어순 마스터 성공! (+보너스 파워)</div>
                    <div className="text-[10px] text-slate-300">열선 공격이 즉시 해금되었어요!</div>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
              </div>
            )}

            {/* 선택 가능한 단어 블록 풀 */}
            {!isPuzzleSolved && (
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80">
                <div className="text-[11px] font-bold text-slate-400 mb-2 text-left">선택할 블록 풀</div>
                <div className="flex flex-wrap items-center gap-2 justify-center min-h-[46px]">
                  {availablePoolTokens.map((token) => (
                    <button
                      key={`pool-${token.id}`}
                      type="button"
                      onClick={() => handleAddToken(token)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 hover:from-amber-500 hover:to-orange-500 text-white hover:text-slate-950 font-black text-sm border border-slate-600 hover:border-amber-300 shadow-md active:scale-95 transition-all cursor-pointer animate-fadeIn"
                    >
                      {token.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 퍼즐 보조 툴바 (소리 힌트, 힌트 블록, 다시 하기) */}
            <div className="flex items-center justify-between gap-2 mt-1">
              <button
                type="button"
                onClick={handlePlayPuzzleHintAudio}
                className="flex-1 py-2 px-2.5 rounded-xl bg-sky-950 border border-sky-400/60 hover:bg-sky-900 text-sky-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Volume2 size={14} /> 소리 힌트
              </button>

              {!isPuzzleSolved && (
                <>
                  <button
                    type="button"
                    onClick={handleAutoHintNext}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-amber-950 border border-amber-400/60 hover:bg-amber-900 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                  >
                    <HelpCircle size={14} /> 힌트 넣기
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPuzzle}
                    disabled={placedTokens.length === 0}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      placedTokens.length > 0
                        ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 cursor-pointer'
                        : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <RotateCcw size={13} /> 리셋
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* 열선 발사 하단 버튼 */}
        <button
          type="button"
          onClick={finish}
          disabled={!canFire || isSpeaking}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '14px',
            marginTop: '12px',
            border: canFire ? '2px solid #facc15' : '1px solid #475569',
            background: isPuzzleSolved
              ? 'linear-gradient(to right, #ea580c, #f59e0b)'
              : canFire
              ? '#b45309'
              : '#334155',
            color: 'white',
            fontSize: '15px',
            fontWeight: 900,
            cursor: canFire && !isSpeaking ? 'pointer' : 'not-allowed',
            opacity: canFire && !isSpeaking ? 1 : 0.55,
            boxShadow: isPuzzleSolved ? '0 0 20px rgba(245, 158, 11, 0.5)' : 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          {isPuzzleSolved ? (
            <>
              <Flame size={19} className="text-yellow-300 animate-bounce" />
              <span>🔥 퍼즐 마스터 보너스 열선 발사! 💥</span>
            </>
          ) : (
            <>
              <Zap size={18} />
              <span>
                {canReadFallback && heardCount !== lines.length
                  ? '직접 읽고 열선 발사하기'
                  : '열선 발사하고 계속하기'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

