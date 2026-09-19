import { useCallback } from 'react';

export type SpeechLang = 'ko-KR' | 'en-US' | 'ja-JP';

export const useSpeech = () => {
  const speak = useCallback((text: string, lang: SpeechLang) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Web Speech API is not supported in this browser.');
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
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) => v.lang === lang || v.lang.startsWith(lang.slice(0, 2)));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  }, []);

  return { speak };
};
