import type { WordItem } from '../types';
import { defaultWords, DEFAULT_WORDS } from './defaultWords';

export * from './defaultWords';
export { defaultWords as words, DEFAULT_WORDS as WORDS_200 };

/**
 * 200개 단어 사전 데이터 무결성 검증용 정규식 규칙
 * 1) kr: 반드시 한글(가-힣) 포함
 * 2) en: 영문 알파벳([a-zA-Z]) 포함, 한글 및 일본어 제외
 * 3) ja: 일본어(한자, 히라가나, 가타카나) 포함, 영문 알파벳 제외
 * 4) jaKana: 순수 히라가나/가타카나(장음 부호 포함)
 */
export const REGEX_KOREAN = /[가-힣]/;
export const REGEX_JAPANESE = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
export const REGEX_ENGLISH = /[a-zA-Z]/;
export const REGEX_KANA_ONLY = /^[\u3040-\u309F\u30A0-\u30FF\s・ー〜]+$/;

/**
 * 단일 단어 항목의 유효성 검사 (오류 메시지 목록 반환)
 */
export function validateWordItem(w: Partial<WordItem>): string[] {
  const errors: string[] = [];

  // 1) kr/ko 검증: 반드시 한글이 포함되어야 함
  if (!w.ko || typeof w.ko !== 'string' || !REGEX_KOREAN.test(w.ko)) {
    errors.push(`[한국어(ko)] 한글이 포함되어야 합니다: "${w.ko}"`);
  }
  if (w.ko && REGEX_ENGLISH.test(w.ko)) {
    errors.push(`[한국어(ko)] 영어가 포함되어 있습니다: "${w.ko}"`);
  }
  if (w.ko && REGEX_JAPANESE.test(w.ko)) {
    errors.push(`[한국어(ko)] 일본어가 포함되어 있습니다: "${w.ko}"`);
  }

  // 2) en 검증: 반드시 영문이어야 하며, 한글이나 일본어가 포함되지 않아야 함
  if (!w.en || typeof w.en !== 'string' || !REGEX_ENGLISH.test(w.en)) {
    errors.push(`[영어(en)] 영문이 포함되어야 합니다: "${w.en}"`);
  }
  if (w.en && REGEX_KOREAN.test(w.en)) {
    errors.push(`[영어(en)] 한글이 포함되어 있습니다: "${w.en}"`);
  }
  if (w.en && REGEX_JAPANESE.test(w.en)) {
    errors.push(`[영어(en)] 일본어가 포함되어 있습니다: "${w.en}"`);
  }

  // 3) ja 검증: 반드시 일본어가 포함되어야 하며, 영어가 들어가지 않아야 함
  if (!w.ja || typeof w.ja !== 'string' || !REGEX_JAPANESE.test(w.ja)) {
    errors.push(`[일본어(ja)] 일본어가 포함되어야 합니다: "${w.ja}"`);
  }
  if (w.ja && REGEX_ENGLISH.test(w.ja)) {
    errors.push(`[일본어(ja)] 영어가 포함되어 있습니다: "${w.ja}"`);
  }
  if (w.ja && REGEX_KOREAN.test(w.ja)) {
    errors.push(`[일본어(ja)] 한글이 포함되어 있습니다: "${w.ja}"`);
  }

  // 4) jaKana 검증: 발음은 순수 히라가나/가타카나여야 함
  if (w.jaKana && typeof w.jaKana === 'string') {
    if (!REGEX_KANA_ONLY.test(w.jaKana)) {
      errors.push(`[일본어 발음(jaKana)] 순수 가나 발음이어야 합니다: "${w.jaKana}"`);
    }
    if (REGEX_ENGLISH.test(w.jaKana)) {
      errors.push(`[일본어 발음(jaKana)] 영어가 포함되어 있습니다: "${w.jaKana}"`);
    }
    if (REGEX_KOREAN.test(w.jaKana)) {
      errors.push(`[일본어 발음(jaKana)] 한글이 포함되어 있습니다: "${w.jaKana}"`);
    }
  }

  return errors;
}

/**
 * 단일 단어 항목의 위치 뒤바뀜/오류 자동 감지 및 교정 (Auto Healing)
 */
export function auditAndHealWord(
  item: WordItem,
  defaultList: WordItem[] = defaultWords
): { healed: WordItem; isFixed: boolean; reason?: string } {
  const errs = validateWordItem(item);
  if (errs.length === 0) {
    return { healed: item, isFixed: false };
  }

  const idStr = String(item.id || '').trim();
  const def = defaultList.find((d) => {
    const dIdStr = String(d.id).trim();
    return (
      dIdStr === idStr ||
      dIdStr === `w${idStr}` ||
      dIdStr.replace(/^w/, '') === idStr.replace(/^w/, '') ||
      (d.en && d.en.toLowerCase() === item.en?.toLowerCase()) ||
      (d.en && d.en.toLowerCase() === item.ja?.toLowerCase()) ||
      (d.ja && d.ja === item.ja) ||
      (d.ja && d.ja === item.jaKana)
    );
  });

  // 특수 케이스: 필드 순서 밀림 (예: en에 한글 '오빠', ja에 영어 'Older brother', jaKana에 일본어 'お兄さん')
  if (REGEX_KOREAN.test(item.en) && REGEX_ENGLISH.test(item.ja)) {
    const fixedKo = def ? def.ko : item.ko && item.en ? `${item.ko} / ${item.en}` : item.ko || item.en;
    const fixedEn = def ? def.en : item.ja;
    const fixedJa = def ? def.ja : (item.jaKana && REGEX_JAPANESE.test(item.jaKana) ? item.jaKana : 'お兄さん');
    const fixedJaKana = def ? def.jaKana : (REGEX_KANA_ONLY.test(item.jaKana || '') ? item.jaKana : 'おにいさん');

    const healed: WordItem = {
      ...item,
      id: def ? def.id : (item.id || 'w24'),
      ko: fixedKo,
      en: fixedEn,
      ja: fixedJa,
      jaKana: fixedJaKana,
      krSentence: def?.krSentence || item.krSentence,
      enSentence: def?.enSentence || item.enSentence,
      jpSentence: def?.jpSentence || item.jpSentence,
      jpFurigana: def?.jpFurigana || item.jpFurigana,
    };

    return {
      healed,
      isFixed: true,
      reason: `언어 필드 밀림 교정 (en 한글 "${item.en}" -> "${fixedEn}", ja 영어 "${item.ja}" -> "${fixedJa}")`,
    };
  }

  // 기본 템플릿과 매칭되는 경우 안전하게 표준 데이터로 복구
  if (def) {
    const healed: WordItem = {
      ...item,
      id: def.id,
      ko: def.ko,
      en: def.en,
      ja: def.ja,
      jaKana: def.jaKana,
      krSentence: def.krSentence || item.krSentence,
      enSentence: def.enSentence || item.enSentence,
      jpSentence: def.jpSentence || item.jpSentence,
      jpFurigana: def.jpFurigana || item.jpFurigana,
    };
    return {
      healed,
      isFixed: true,
      reason: `표준 단어 사전 템플릿 기반 복구: ${def.ko} (${def.en} / ${def.ja})`,
    };
  }

  return { healed: item, isFixed: false };
}

/**
 * 전체 단어 배열 전수 검수 및 자동 교정 (Auto Audit & Batch Healing)
 */
export function auditAndHealWords(
  items: WordItem[],
  defaultList: WordItem[] = defaultWords
): {
  healedWords: WordItem[];
  fixedCount: number;
  fixedDetails: string[];
} {
  let fixedCount = 0;
  const fixedDetails: string[] = [];

  const healedWords = items.map((word, idx) => {
    const result = auditAndHealWord(word, defaultList);
    if (result.isFixed) {
      fixedCount++;
      const stage = Math.floor(idx / 6) + 1;
      fixedDetails.push(
        `[Stage ${stage} | ID: ${word.id} -> ${result.healed.id}] ${result.reason || '단어 데이터 교정 완료'}`
      );
      return result.healed;
    }
    return word;
  });

  return {
    healedWords,
    fixedCount,
    fixedDetails,
  };
}
