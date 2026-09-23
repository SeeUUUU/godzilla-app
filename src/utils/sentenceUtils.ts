import type { WordItem, WordSentenceData } from '../types';

/**
 * 한국어 마지막 글자의 종성(받침) 유무에 따라 서술격 조사(이에요 / 예요)를 자동 판별하여 반환합니다.
 * - 받침 있음 -> '이에요' (공책이에요, 책이에요, 교실이에요, 선생님이에요)
 * - 받침 없음 -> '예요' (학교예요, 친구예요, 의자예요, 모자예요)
 */
export function getKoreanBeParticle(word: string): string {
  if (!word || word.length === 0) return '예요';
  const trimmed = word.trim();
  const lastChar = trimmed.charCodeAt(trimmed.length - 1);
  if (lastChar >= 0xac00 && lastChar <= 0xd7a3) {
    return (lastChar - 0xac00) % 28 > 0 ? '이에요' : '예요';
  }
  return '예요';
}

/**
 * 영어 명사 앞 부정관사 (a / an) 또는 무관사(복수형/불가산) 판별 헬퍼
 */
export function getEnglishArticle(word: string): string {
  if (!word) return 'a';
  const clean = word.trim().toLowerCase();

  // 복수형(쌍) 명사: scissors, glasses 등
  if (clean === 'scissors' || clean === 'glasses' || clean === 'pants') {
    return '';
  }

  // 대표적 셀 수 없는 명사(불가산)
  const uncountables = new Set([
    'water',
    'milk',
    'rice',
    'bread',
    'money',
    'meat',
    'juice',
    'tea',
    'coffee',
    'homework',
    'weather',
    'rain',
    'snow',
    'wind',
    'fire',
    'glue',
  ]);
  if (uncountables.has(clean)) {
    return '';
  }

  // 모음(a, e, i, o, u)으로 발음되는 단어 앞 -> 'an'
  const firstLetter = clean.charAt(0);
  if (['a', 'e', 'i', 'o', 'u'].includes(firstLetter)) {
    return 'an';
  }

  return 'a';
}

export interface SentenceDictionaryEntry {
  kr: string;
  en: string;
  jp: string;
  jpFurigana?: string;
}

/**
 * 초등 2학년 맞춤형 3개 국어 자연스러운 표준 문장 사전
 * - 사물: "이것은 [단어](이)에요!"
 * - 장소: "여기는 [단어](이)에요!"
 * - 인물: "이분은 [단어](이)에요!" 또는 "이쪽은 제 친구예요!"
 */
export const WORD_SENTENCE_DICTIONARY: Record<string, SentenceDictionaryEntry> = {
  // 1. 학교 생활 및 학용품 (1~20)
  학교: {
    kr: '여기는 학교예요!',
    en: 'This is my school!',
    jp: 'ここは 学校(がっこう)です！',
    jpFurigana: 'ここは がっこうです！',
  },
  교실: {
    kr: '여기는 교실이에요!',
    en: 'This is our classroom!',
    jp: 'ここは 教室(きょうしつ)です！',
    jpFurigana: 'ここは きょうしつです！',
  },
  선생님: {
    kr: '이분은 선생님이에요!',
    en: 'This is my teacher!',
    jp: 'こちらは 先生(せんせい)です！',
    jpFurigana: 'こちらは せんせいです！',
  },
  친구: {
    kr: '이쪽은 제 친구예요!',
    en: 'This is my friend!',
    jp: 'こちらは 友達(ともだち)です！',
    jpFurigana: 'こちらは ともだちです！',
  },
  책: {
    kr: '이것은 책이에요!',
    en: 'This is a book!',
    jp: 'これは 本(ほん)です！',
    jpFurigana: 'これは ほんです！',
  },
  공책: {
    kr: '이것은 공책이에요!',
    en: 'This is a notebook!',
    jp: 'これは ノートです！',
    jpFurigana: 'これは ノートです！',
  },
  연필: {
    kr: '이것은 연필이에요!',
    en: 'This is a pencil!',
    jp: 'これは 鉛筆(えんぴつ)です！',
    jpFurigana: 'これは えんぴつです！',
  },
  지우개: {
    kr: '이것은 지우개예요!',
    en: 'This is an eraser!',
    jp: 'これは 消しゴム(けしごむ)です！',
    jpFurigana: 'これは けしごむです！',
  },
  필통: {
    kr: '이것은 필통이에요!',
    en: 'This is a pencil case!',
    jp: 'これは 筆箱(ふでばこ)です！',
    jpFurigana: 'これは ふでばこです！',
  },
  가방: {
    kr: '이것은 가방이에요!',
    en: 'This is a bag!',
    jp: 'これは かばんです！',
    jpFurigana: 'これは かばんです！',
  },
  가위: {
    kr: '이것은 가위예요!',
    en: 'These are scissors!',
    jp: 'これは はさみです！',
    jpFurigana: 'これは はさみです！',
  },
  풀: {
    kr: '이것은 풀이에요!',
    en: 'This is glue!',
    jp: 'これは のりです！',
    jpFurigana: 'これは のりです！',
  },
  자: {
    kr: '이것은 자예요!',
    en: 'This is a ruler!',
    jp: 'これは 定規(じょうぎ)です！',
    jpFurigana: 'これは じょうぎです！',
  },
  색연필: {
    kr: '이것은 색연필이에요!',
    en: 'This is a colored pencil!',
    jp: 'これは 色鉛筆(いろえんぴつ)です！',
    jpFurigana: 'これは いろえんぴつです！',
  },
  칠판: {
    kr: '이것은 칠판이에요!',
    en: 'This is the blackboard!',
    jp: 'これは 黒板(こくばん)です！',
    jpFurigana: 'これは こくばんです！',
  },
  책상: {
    kr: '이것은 책상이에요!',
    en: 'This is a desk!',
    jp: 'これは 机(つくえ)です！',
    jpFurigana: 'これは つくえです！',
  },
  의자: {
    kr: '이것은 의자예요!',
    en: 'This is a chair!',
    jp: 'これは 椅子(いす)です！',
    jpFurigana: 'これは いすです！',
  },
  운동장: {
    kr: '여기는 운동장이에요!',
    en: 'This is the playground!',
    jp: 'ここは 校庭(こうてい)です！',
    jpFurigana: 'ここは こうていです！',
  },
  급식: {
    kr: '이것은 급식이에요!',
    en: 'This is our school lunch!',
    jp: 'これは 給食(きゅうしょく)です！',
    jpFurigana: 'これは きゅうしょくです！',
  },
  숙제: {
    kr: '이것은 숙제예요!',
    en: 'This is my homework!',
    jp: 'これは 宿題(しゅくだい)です！',
    jpFurigana: 'これは しゅくだいです！',
  },

  // 2. 가족 및 사람들 (21~35)
  가족: {
    kr: '이쪽은 우리 가족이에요!',
    en: 'This is my family!',
    jp: 'こちらは 家族(かぞく)です！',
    jpFurigana: 'こちらは かぞくです！',
  },
  아빠: {
    kr: '이분은 우리 아빠예요!',
    en: 'This is my dad!',
    jp: 'こちらは お父(とう)さんです！',
    jpFurigana: 'こちらは おとうさんです！',
  },
  엄마: {
    kr: '이분은 우리 엄마예요!',
    en: 'This is my mom!',
    jp: 'こちらは お母(かあ)さんです！',
    jpFurigana: 'こちらは おかあさんです！',
  },
  '형 / 오빠': {
    kr: '이쪽은 우리 오빠예요!',
    en: 'This is my brother!',
    jp: 'こちらは お兄(にい)さんです！',
    jpFurigana: 'こちらは おにいさんです！',
  },
  '누나 / 언니': {
    kr: '이쪽은 우리 언니예요!',
    en: 'This is my sister!',
    jp: 'こちらは お姉(ねえ)さんです！',
    jpFurigana: 'こちらは おねえさんです！',
  },
  남동생: {
    kr: '이쪽은 제 남동생이에요!',
    en: 'This is my little brother!',
    jp: 'こちらは 弟(おとうと)です！',
    jpFurigana: 'こちらは おとうとです！',
  },
  여동생: {
    kr: '이쪽은 제 여동생이에요!',
    en: 'This is my little sister!',
    jp: 'こちらは 妹(いもうと)です！',
    jpFurigana: 'こちらは いもうとです！',
  },
  할아버지: {
    kr: '이분은 우리 할아버지예요!',
    en: 'This is my grandfather!',
    jp: 'こちらは おじいさんです！',
    jpFurigana: 'こちらは おじいさんです！',
  },
  할머니: {
    kr: '이분은 우리 할머니예요!',
    en: 'This is my grandmother!',
    jp: 'こちらは おばあさんです！',
    jpFurigana: 'こちらは おばあさんです！',
  },
  아기: {
    kr: '이쪽은 귀여운 아기예요!',
    en: 'This is a baby!',
    jp: 'こちらは 赤(あか)ちゃんです！',
    jpFurigana: 'こちらは あかちゃんです！',
  },
  아이: {
    kr: '이쪽은 씩씩한 아이예요!',
    en: 'This is a child!',
    jp: 'こちらは 子(こ)どもです！',
    jpFurigana: 'こちらは こどもです！',
  },
  의사: {
    kr: '이분은 의사 선생님이에요!',
    en: 'This is the doctor!',
    jp: 'こちらは お医者(いしゃ)さんです！',
    jpFurigana: 'こちらは おいしゃさんです！',
  },
  경찰관: {
    kr: '이분은 경찰관이에요!',
    en: 'This is a police officer!',
    jp: 'こちらは 警察官(けいさつかん)です！',
    jpFurigana: 'こちらは けいさつかんです！',
  },
  소방관: {
    kr: '이분은 소방관이에요!',
    en: 'This is a firefighter!',
    jp: 'こちらは 消防士(しょうぼうし)です！',
    jpFurigana: 'こちらは しょうぼうしです！',
  },
  요리사: {
    kr: '이분은 요리사예요!',
    en: 'This is a chef!',
    jp: 'こちらは 料理人(りょうりにん)です！',
    jpFurigana: 'こちらは りょうりにんです！',
  },

  // 4. 동물 (공룡, 고질라 등)
  강아지: {
    kr: '이것은 강아지예요!',
    en: 'This is a dog!',
    jp: 'これは 犬(いぬ)です！',
    jpFurigana: 'これは いぬです！',
  },
  고양이: {
    kr: '이것은 고양이예요!',
    en: 'This is a cat!',
    jp: 'これは 猫(ねこ)です！',
    jpFurigana: 'これは ねこです！',
  },
  공룡: {
    kr: '이것은 공룡이에요!',
    en: 'This is a dinosaur!',
    jp: 'これは 恐竜(きょうりゅう)です！',
    jpFurigana: 'これは きょうりゅうです！',
  },
  고질라: {
    kr: '이쪽은 고질라예요!',
    en: 'This is Godzilla!',
    jp: 'こちらは ゴジラです！',
    jpFurigana: 'こちらは ゴジラです！',
  },

  // 8. 집 및 장소
  집: {
    kr: '여기는 집이에요!',
    en: 'This is my home!',
    jp: 'ここは 我(わ)が家(や)です！',
    jpFurigana: 'ここは わがやです！',
  },
  방: {
    kr: '여기는 방이에요!',
    en: 'This is my room!',
    jp: 'ここは 私(わたし)の部屋(へや)です！',
    jpFurigana: 'ここは わたしのへやです！',
  },
  화장실: {
    kr: '여기는 화장실이에요!',
    en: 'This is the restroom!',
    jp: 'ここは トイレです！',
    jpFurigana: 'ここは トイレです！',
  },
  공원: {
    kr: '여기는 공원이에요!',
    en: 'This is the park!',
    jp: 'ここは 公園(こうえん)です！',
    jpFurigana: 'ここは こうえんです！',
  },
  동물원: {
    kr: '여기는 동물원이에요!',
    en: 'This is the zoo!',
    jp: 'ここは 動物園(どうぶつえん)です！',
    jpFurigana: 'ここは どうぶつえんです！',
  },
  병원: {
    kr: '여기는 병원이에요!',
    en: 'This is the hospital!',
    jp: 'ここは 病院(びょういん)です！',
    jpFurigana: 'ここは びょういんです！',
  },
  가게: {
    kr: '여기는 가게예요!',
    en: 'This is a shop!',
    jp: 'ここは お店(みせ)です！',
    jpFurigana: 'ここは おみせです！',
  },
};

/**
 * 단어의 사람(인물), 장소, 복수사물, 일반사물 카테고리 자동 판별
 */
export function getWordCategory(
  word: WordItem
): 'person' | 'place' | 'plural_object' | 'object' {
  const ko = word.ko.trim();
  const en = word.en.trim().toLowerCase();

  // 1. 사람 / 인물
  const personKeywordsKo = [
    '선생님',
    '친구',
    '가족',
    '아빠',
    '엄마',
    '형',
    '오빠',
    '누나',
    '언니',
    '남동생',
    '여동생',
    '동생',
    '할아버지',
    '할머니',
    '아기',
    '아이',
    '의사',
    '경찰관',
    '소방관',
    '요리사',
    '사람',
    '학생',
    '고질라',
  ];
  if (personKeywordsKo.some((k) => ko.includes(k))) {
    return 'person';
  }
  const personKeywordsEn = [
    'teacher',
    'friend',
    'family',
    'dad',
    'father',
    'mom',
    'mother',
    'brother',
    'sister',
    'grandfather',
    'grandmother',
    'baby',
    'child',
    'doctor',
    'police',
    'firefighter',
    'chef',
    'person',
    'godzilla',
  ];
  if (personKeywordsEn.some((k) => en.includes(k))) {
    return 'person';
  }

  // 2. 장소
  const placeKeywordsKo = [
    '학교',
    '교실',
    '운동장',
    '집',
    '방',
    '화장실',
    '공원',
    '동물원',
    '병원',
    '가게',
    '도서관',
    '놀이터',
    '바다',
    '산',
    '강',
    '숲',
  ];
  if (placeKeywordsKo.some((k) => ko.includes(k))) {
    return 'place';
  }
  const placeKeywordsEn = [
    'school',
    'classroom',
    'playground',
    'house',
    'home',
    'room',
    'toilet',
    'restroom',
    'bathroom',
    'park',
    'zoo',
    'hospital',
    'shop',
    'store',
    'library',
  ];
  if (placeKeywordsEn.some((k) => en.includes(k))) {
    return 'place';
  }

  // 3. 복수형 사물
  if (en === 'scissors' || en === 'glasses' || en === 'pants') {
    return 'plural_object';
  }

  return 'object';
}

/**
 * 인물 중 존칭/어른에 해당하는지 판별 ('이분은 ~이에요/예요!' vs '이쪽은 ~예요!')
 */
function isRespectedPerson(ko: string): boolean {
  return [
    '선생님',
    '의사',
    '경찰관',
    '소방관',
    '요리사',
    '할아버지',
    '할머니',
    '아빠',
    '엄마',
    '아버지',
    '어머니',
  ].some((k) => ko.includes(k));
}

/**
 * 단어 객체에서 3개 국어 예문 데이터를 추출하거나,
 * 데이터가 없을 경우 불필요한 수식어를 뺀 표준 문법(이것은 / 여기는 / 이분은 / 이쪽은)을 적용하여 반환합니다.
 */
export function getWordSentenceData(word: WordItem): WordSentenceData {
  // 1순위: 표준 문장 딕셔너리에 정의된 단어인 경우 1:1 완벽한 문장 반환
  const dict = WORD_SENTENCE_DICTIONARY[word.ko] || WORD_SENTENCE_DICTIONARY[String(word.id)];
  if (dict) {
    return {
      krSentence: dict.kr,
      enSentence: dict.en,
      jpSentence: dict.jp,
      jpFurigana: dict.jpFurigana,
      word,
    };
  }

  // 단어 자체에 수식어가 없는 정갈한 예문이 기재된 경우
  if (word.krSentence && word.enSentence && word.jpSentence) {
    return {
      krSentence: word.krSentence.trim(),
      enSentence: word.enSentence.trim(),
      jpSentence: word.jpSentence.trim(),
      jpFurigana: word.jpFurigana?.trim(),
      word,
    };
  }

  // 2순위: 미등록 단어용 문법 세이프가드 Fallback 로직 (불필요한 꾸밈말 일절 배제)
  const category = getWordCategory(word);
  const koBe = getKoreanBeParticle(word.ko);
  const cleanEn = word.en.trim();
  const cleanJa = word.ja.trim();

  let krSentence = '';
  let enSentence = '';
  let jpSentence = '';
  let jpFurigana: string | undefined = undefined;

  if (category === 'person') {
    // 인물: 존칭이면 '이분은 [단어](이)에요!', 또래나 친근한 관계는 '이쪽은 [단어](이)에요!'
    if (word.ko === '친구') {
      krSentence = '이쪽은 제 친구예요!';
    } else if (isRespectedPerson(word.ko)) {
      krSentence = `이분은 ${word.ko}${koBe}!`;
    } else {
      krSentence = `이쪽은 ${word.ko}${koBe}!`;
    }
    enSentence = `This is ${word.ko === '친구' ? 'my friend' : cleanEn.toLowerCase()}!`;
    jpSentence = `こちらは ${cleanJa}です！`;
    if (word.jaKana) {
      jpFurigana = `こちらは ${word.jaKana}です！`;
    }
  } else if (category === 'place') {
    // 장소: "여기는 [단어](이)에요!"
    krSentence = `여기는 ${word.ko}${koBe}!`;
    enSentence = `This is the ${cleanEn.toLowerCase()}!`;
    jpSentence = `ここは ${cleanJa}です！`;
    if (word.jaKana) {
      jpFurigana = `ここは ${word.jaKana}です！`;
    }
  } else if (category === 'plural_object') {
    // 복수 사물: "이것은 [단어](이)에요!" / "These are [단어]!"
    krSentence = `이것은 ${word.ko}${koBe}!`;
    enSentence = `These are ${cleanEn.toLowerCase()}!`;
    jpSentence = `これは ${cleanJa}です！`;
    if (word.jaKana) {
      jpFurigana = `これは ${word.jaKana}です！`;
    }
  } else {
    // 사물 / 일반: "이것은 [단어](이)에요!" / 관사 결합
    const article = getEnglishArticle(cleanEn);
    krSentence = `이것은 ${word.ko}${koBe}!`;
    enSentence = article
      ? `This is ${article} ${cleanEn.toLowerCase()}!`
      : `This is ${cleanEn.toLowerCase()}!`;
    jpSentence = `これは ${cleanJa}です！`;
    if (word.jaKana) {
      jpFurigana = `これは ${word.jaKana}です！`;
    }
  }

  return {
    krSentence,
    enSentence,
    jpSentence,
    jpFurigana,
    word,
  };
}

/**
 * TTS 음성 읽기 시 괄호 후리가나나 불필요한 기호를 제거하여
 * 네이티브 음성 합성 엔진이 정확하고 유창하게 발음할 수 있도록 정제합니다.
 */
export function getCleanTtsText(
  sentence: string,
  lang: 'ko-KR' | 'en-US' | 'ja-JP'
): string {
  if (!sentence) return '';

  if (lang === 'ja-JP') {
    // 일본어: "ここは 学校(がっこう)です！" -> "ここは 学校です！"
    return sentence
      .replace(/\([^)]*\)/g, '')
      .replace(/（[^）]*）/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 한국어 & 영어: 원문 그대로 읽음
  return sentence.trim();
}
