import { useCallback, useRef, useEffect } from 'react';

export type SpeechLang = 'ko-KR' | 'en-US' | 'ja-JP';

export const useSpeech = () => {
  const fallbackTimerRef = useRef<number | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // 모바일 크롬/사파리 비동기 보이스 로딩 리스너
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          voicesRef.current = available;
        }
      } catch {}
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const speak = useCallback(
    (text: string, lang: SpeechLang, onEnd?: () => void): Promise<void> => {
      return new Promise<void>((resolve) => {
        // 이전 폴백 타이머 정리
        if (fallbackTimerRef.current !== null) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }

        let isCompleted = false;
        const finish = () => {
          if (isCompleted) return;
          isCompleted = true;
          if (fallbackTimerRef.current !== null) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }
          onEnd?.();
          resolve();
        };

        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          console.warn('Web Speech API is not supported in this browser.');
          finish();
          return;
        }

        try {
          // 재생 중 중복 호출 방지 및 즉각 반응을 위해 cancel() 후 speak() 호출
          window.speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = lang;
          // 언어별 최적 발화 속도 분기: 일본어는 늘어지지 않게 0.8, 한국어/영어는 또박또박 따라 읽기 좋은 0.6
          utterance.rate = lang === 'ja-JP' ? 0.8 : 0.6;
          utterance.pitch = 1.1;

          // 브라우저에서 해당 언어 음성 선택 최적화
          const availableVoices =
            voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
          const matchedVoice = availableVoices.find(
            (v) => v.lang === lang || v.lang.replace('_', '-').startsWith(lang.slice(0, 2))
          );
          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }

          // 안전 폴백 타이머: 모바일 브라우저/음성 엔진 결함으로 onend 미발생 대비 (최대 3초)
          fallbackTimerRef.current = window.setTimeout(() => {
            finish();
          }, 3000);

          utterance.onend = () => {
            finish();
          };

          utterance.onerror = (e) => {
            console.warn('Speech synthesis error:', e);
            finish();
          };

          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('Speech synthesis error:', error);
          finish();
        }
      });
    },
    []
  );

  const cancel = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Speech synthesis cancel error:', e);
      }
    }
  }, []);

  return { speak, cancel };
};
