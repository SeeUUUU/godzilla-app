import type { WordItem, Language } from '../types';
import { WORD_EMOJIS } from '../data/wordEmojis';

export interface ShuffledCard {
  id: string | number;
  text: string;
  subText?: string;
  emoji?: string;
  lang: Language;
}

const resolveEmoji = (w: WordItem): string | undefined => {
  if (w.emoji && typeof w.emoji === 'string' && w.emoji.trim()) return w.emoji.trim();
  const rawObj = w as unknown as Record<string, unknown>;
  if (typeof rawObj.icon === 'string' && rawObj.icon.trim()) return rawObj.icon.trim();
  const idStr = String(w.id || '');
  return (
    WORD_EMOJIS[idStr] ||
    WORD_EMOJIS[idStr.replace(/^w/, '')] ||
    (w.ko ? WORD_EMOJIS[w.ko] : undefined) ||
    (w.en ? WORD_EMOJIS[w.en] : undefined) ||
    undefined
  );
};

// 1. 순수 Fisher-Yates 무작위 셔플 함수
export const fisherYatesShuffle = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 2. 언어별 독립 랜덤 셔플 & 동일 행(수평 정렬) 일치 최소화 디얼라인먼트
export const createIndependentShuffledColumns = (words: WordItem[]): {
  ko: ShuffledCard[];
  en: ShuffledCard[];
  ja: ShuffledCard[];
} => {
  if (!words || words.length === 0) {
    return { ko: [], en: [], ja: [] };
  }

  const baseKo: ShuffledCard[] = words.map((w) => ({
    id: w.id,
    text: w.ko || '',
    emoji: resolveEmoji(w),
    lang: 'ko',
  }));

  const baseEn: ShuffledCard[] = words.map((w) => ({
    id: w.id,
    text: w.en || '',
    emoji: resolveEmoji(w),
    lang: 'en',
  }));

  const baseJa: ShuffledCard[] = words.map((w) => ({
    id: w.id,
    text: w.ja || '',
    subText: w.jaKana || w.jpKana || w.reading || w.furigana || '',
    emoji: resolveEmoji(w),
    lang: 'ja',
  }));

  // 1) 🇰🇷 한국어 열: 순수 Fisher-Yates 독립 셔플
  const ko = fisherYatesShuffle(baseKo);

  // 2) 🇺🇸 영어 열: 독립 Fisher-Yates 셔플 + 한국어와 같은 행(수평 정렬) 중복 배치 최소화
  const en = fisherYatesShuffle(baseEn);
  if (en.length > 1) {
    for (let i = 0; i < en.length; i++) {
      if (en[i].id === ko[i].id) {
        // 같은 행에 배치된 경우, 충돌하지 않는 다른 인덱스와 위치 스왑
        const swapIdx = en.findIndex(
          (item, idx) => idx !== i && item.id !== ko[i].id && en[i].id !== ko[idx].id
        );
        if (swapIdx !== -1) {
          [en[i], en[swapIdx]] = [en[swapIdx], en[i]];
        }
      }
    }
  }

  // 3) 🇯🇵 일본어 열: 독립 Fisher-Yates 셔플 + 한국어/영어와 같은 행 중복 배치 최소화
  const ja = fisherYatesShuffle(baseJa);
  if (ja.length > 1) {
    for (let i = 0; i < ja.length; i++) {
      if (ja[i].id === ko[i].id || ja[i].id === en[i].id) {
        // ko, en 둘 다와 겹치지 않는 슬롯과 위치 스왑
        const swapIdx = ja.findIndex(
          (item, idx) =>
            idx !== i &&
            item.id !== ko[i].id &&
            item.id !== en[i].id &&
            ja[i].id !== ko[idx].id &&
            ja[i].id !== en[idx].id
        );
        if (swapIdx !== -1) {
          [ja[i], ja[swapIdx]] = [ja[swapIdx], ja[i]];
        }
      }
    }
  }

  return { ko, en, ja };
};
