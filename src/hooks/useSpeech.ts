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
      // 초등학교 2학년 아이가 또박또박 들을 수 있도록 또렷한 재생 속도(0.85)
      utterance.rate = 0.85;
      utterance.pitch = 1.05;

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
