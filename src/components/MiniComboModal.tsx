import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Volume2, Zap } from 'lucide-react';
import type { WordItem } from '../types';
import { buildMiniComboSentences } from '../utils/miniComboSentences';

interface MiniComboModalProps {
  word: WordItem;
  onComplete: () => void;
}

export const MiniComboModal = ({ word, onComplete }: MiniComboModalProps) => {
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

  const sentences = useMemo(() => buildMiniComboSentences(word), [word]);
  const lines = useMemo(() => [
    { label: '한국어', flag: '🇰🇷', lang: 'ko-KR', text: sentences.ko, color: '#fbbf24' },
    { label: '영어', flag: '🇺🇸', lang: 'en-US', text: sentences.en, color: '#67e8f9' },
    { label: '일본어', flag: '🇯🇵', lang: 'ja-JP', text: sentences.ja.spoken, color: '#c4b5fd' },
  ], [sentences]);

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

  const finish = () => {
    if (completedRef.current || isPlayingRef.current || (heardCountRef.current !== lines.length && !canReadFallback)) return;
    completedRef.current = true;
    stopSpeech();
    onComplete();
  };

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
        width: '100%', maxWidth: '490px', maxHeight: '90dvh', overflowY: 'auto',
        background: 'linear-gradient(160deg, #172554, #0f172a 60%)',
        border: '2px solid #38bdf8', borderRadius: '22px', padding: '20px',
        boxShadow: '0 0 32px rgba(56, 189, 248, 0.3)', color: '#f8fafc',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '26px' }}>🦖💬</div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '4px 0' }}>미니 콤보 회화</h2>
          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0 }}>
            세 나라의 한 줄 문장을 듣고 열선을 발사해요!
          </p>
        </div>

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
        <button type="button" onClick={finish} disabled={isSpeaking || (heardCount !== lines.length && !canReadFallback)}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', marginTop: '9px',
            border: '1px solid #facc15', background: heardCount === lines.length || canReadFallback ? '#b45309' : '#334155',
            color: 'white', fontSize: '15px', fontWeight: 900,
            cursor: !isSpeaking && (heardCount === lines.length || canReadFallback) ? 'pointer' : 'not-allowed',
            opacity: !isSpeaking && (heardCount === lines.length || canReadFallback) ? 1 : 0.55,
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} /> {canReadFallback && heardCount !== lines.length ? '직접 읽고 열선 발사하기' : '열선 발사하고 계속하기'}
        </button>
      </div>
    </div>
  );
};
