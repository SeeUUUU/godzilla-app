import { useState, useEffect, useRef, useCallback } from 'react';
import type { WordItem } from '../types';

export type VoiceLang = 'ko-KR' | 'en-US' | 'ja-JP';

// Web Speech API 타입 정의 (브라우저 호환성 확보)
interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: {
      isFinal?: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

// 텍스트 정규화 (공백/특수문자 제거 및 소문자 변환)
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '')
    .trim();
};

// 유연 발음 매칭 (Fuzzy Match) 헬퍼 함수
export const checkVoiceMatch = (
  spokenText: string,
  word: WordItem
): { isMatch: boolean; matchedLang: 'ko' | 'en' | 'ja' | null } => {
  const normSpoken = normalizeText(spokenText);
  if (!normSpoken) {
    return { isMatch: false, matchedLang: null };
  }

  const normKo = normalizeText(word.ko);
  const normEn = normalizeText(word.en);
  const normJa = normalizeText(word.ja);
  const normJaKana = word.jaKana ? normalizeText(word.jaKana) : '';

  // 1. 한국어 검사 (정확 일치 또는 부분 포함)
  if (
    normSpoken === normKo ||
    (normKo.length >= 2 && normSpoken.includes(normKo)) ||
    (normSpoken.length >= 2 && normKo.includes(normSpoken))
  ) {
    return { isMatch: true, matchedLang: 'ko' };
  }

  // 2. 영어 검사 (대소문자 무시, 접미사/단수복수 오차 허용)
  if (
    normSpoken === normEn ||
    normSpoken.startsWith(normEn) ||
    normEn.startsWith(normSpoken) ||
    (normEn.length >= 3 && normSpoken.includes(normEn))
  ) {
    return { isMatch: true, matchedLang: 'en' };
  }

  // 3. 일본어 (한자/가나/후리가나) 검사
  if (
    (normJa && (normSpoken === normJa || normSpoken.includes(normJa) || normJa.includes(normSpoken))) ||
    (normJaKana &&
      (normSpoken === normJaKana || normSpoken.includes(normJaKana) || normJaKana.includes(normSpoken)))
  ) {
    return { isMatch: true, matchedLang: 'ja' };
  }

  // 4. 아이들의 언어 혼용 인식 보정:
  // 예를 들어 영어 "Godzilla"를 한국어 음성인식 엔진이 "고질라"로 들었을 때도 허용
  if (normKo && normSpoken.includes(normKo)) {
    return { isMatch: true, matchedLang: 'ko' };
  }

  return { isMatch: false, matchedLang: null };
};

export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    );

  // 음성 인식 인스턴스 정리
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (targetLang: VoiceLang = 'ko-KR', onResultCallback?: (resultText: string) => void) => {
      if (!isSupported) {
        setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
        return;
      }

      stopListening();
      setTranscript('');
      setError(null);

      try {
        const SpeechRecognitionClass =
          (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
          (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

        if (!SpeechRecognitionClass) return;

        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = targetLang;
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          if (onResultCallback && currentTranscript) {
            onResultCallback(currentTranscript);
          }
        };

        recognition.onerror = (event: { error: string }) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error !== 'no-speech') {
            setError(event.error);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setError('음성 인식을 시작할 수 없습니다.');
        setIsListening(false);
      }
    },
    [isSupported, stopListening]
  );

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
  };
};
