import { useCallback, useRef, useEffect } from 'react';
import { DEFAULT_WORDS, getJapaneseReading } from '../data/defaultWords';

export type SpeechLang = 'ko-KR' | 'en-US' | 'ja-JP';

// 일본어 한자 -> 히라가나 독음 보정 매핑 사전 (브라우저 TTS의 음독 오류 방지)
const JAPANESE_READING_MAP: Record<string, string> = {
  雲: 'くも',
  雨: 'あめ',
  空: 'そら',
  月: 'つき',
  星: 'ほし',
  海: 'うみ',
  山: 'やま',
  川: 'かわ',
  木: 'き',
  森: 'もり',
  花: 'はな',
  草: 'くさ',
  石: 'いし',
  火: 'ひ',
  春: 'はる',
  夏: 'なつ',
  秋: 'あき',
  冬: 'ふゆ',
  雪: 'ゆき',
  風: 'かぜ',
  虹: 'にじ',
  赤: 'あか',
  青: 'あお',
  白: 'しろ',
  黒: 'くろ',
  犬: 'いぬ',
  猫: 'ねこ',
  熊: 'くま',
  鳥: 'とり',
  魚: 'さかな',
  手: 'て',
  足: 'あし',
  目: 'め',
  耳: 'みみ',
  口: 'くち',
  鼻: 'はな',
  車: 'くるま',
  本: 'ほん',
  家: 'いえ',
  朝: 'あさ',
  昼: 'ひる',
  夕: 'ゆう',
  夜: 'よる',
  今日: 'きょう',
  明日: 'あした',
  昨日: 'きのう',
  夢: 'ゆめ',
  歌: 'うた',
  絵: 'え',
  道: 'みち',
};

// 200개 기본 단어집 전체로부터 일본어 한자 -> 후리가나/히라가나 독음 사전 동기화
DEFAULT_WORDS.forEach((w) => {
  const reading = getJapaneseReading(w);
  if (w.ja && reading) {
    JAPANESE_READING_MAP[w.ja.trim()] = reading.trim();
  }
});

/**
 * 일본어 단어 TTS 발화 시 한자 독음 오류(예: '雲'을 '운(うん)'으로 읽는 문제)를 방지하고
 * 후리가나/히라가나 독음을 우선적으로 적용합니다.
 */
export const getSpokenText = (
  text: string,
  lang: SpeechLang,
  reading?: string
): string => {
  if (!text) return '';
  if (lang !== 'ja-JP') return text;
  if (reading && reading.trim()) return reading.trim();
  const trimmed = text.trim();
  return JAPANESE_READING_MAP[trimmed] || text;
};

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
    (
      text: string,
      lang: SpeechLang,
      onEnd?: () => void,
      reading?: string
    ): Promise<void> => {
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

          const targetText = getSpokenText(text, lang, reading);
          const utterance = new SpeechSynthesisUtterance(targetText);
          utterance.lang = lang;
          // 언어별 최적 발화 속도 분기: 일본어 0.8, 한국어는 문장 길이에 맞춰 자연스럽고 또박또박한 속도(0.75~0.82)
          utterance.rate = lang === 'ja-JP' ? 0.8 : targetText.length > 20 ? 0.82 : 0.72;
          utterance.pitch = 1.05;

          // 브라우저에서 해당 언어 음성 선택 최적화
          const availableVoices =
            voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
          const matchedVoice = availableVoices.find(
            (v) => v.lang === lang || v.lang.replace('_', '-').startsWith(lang.slice(0, 2))
          );
          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }

          // 안전 폴백 타이머: 문장 길이에 맞춰 여유 있게 책정 (최소 4.5초 ~ 글자 수 비례)
          const fallbackDuration = Math.max(4500, Math.ceil(targetText.length * 280));
          fallbackTimerRef.current = window.setTimeout(() => {
            finish();
          }, fallbackDuration);

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
