import type { MathProblemItem, MathHintFormula, MathSkillCategory } from '../types';

// =================================================================
// 초등(소학교) 2학년 산수 데이터셋 (총 160문제, 16스테이지)
// =================================================================
//   STAGE 1~3   : 두 자리 수 ± 두 자리 수 (받아올림/내림 없음)
//   STAGE 4~6   : 두 자리 수 ± 두 자리 수 (받아올림/내림 1회)
//   STAGE 7~8   : 세 수의 덧셈과 뺄셈
//   STAGE 9~10  : 100 이하 두 자리 수 종합 덧셈·뺄셈 (혼합)
//   STAGE 11~12 : 서술형(문장제) 문제 - 운석 낙하 없음, 시간제한 없음
//   STAGE 13    : 구구단 기초 (2~5단 곱셈 + 빈칸 + 서술형)
//   STAGE 14    : 구구단 심화 (6~9단 곱셈 + 빈칸 + 서술형)
//   STAGE 15    : 길이·들이 단위 변환 (cm/mm, m/cm, L/dL/mL)
//   STAGE 16    : 초2 2학기 종합 마스터 (구구단·단위·시계·서술형)
// =================================================================

export const TOTAL_MATH_STAGES = 16;
export const PROBLEMS_PER_MATH_STAGE = 10;

// ---------- 유틸 ----------

export const DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];

/** 0~1000 한자어 한국어 수 읽기 (예: 34 → 삼십사, 200 → 이백) */
export const readSino = (n: number): string => {
  if (n === 0) return '영';
  if (n === 1000) return '천';
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const hundredsStr = hundreds === 0 ? '' : hundreds === 1 ? '백' : `${DIGITS[hundreds]}백`;
  const tens = Math.floor(rest / 10);
  const ones = rest % 10;
  const tensStr = tens === 0 ? '' : tens === 1 ? '십' : `${DIGITS[tens]}십`;
  return `${hundredsStr}${tensStr}${DIGITS[ones]}`;
};

const EN_ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 0~1000 영어 수 읽기 (예: 34 → thirty-four) */
export const readEnglish = (n: number): string => {
  if (n < 0 || n > 1000) return String(n);
  if (n < 20) return EN_ONES[n];
  if (n === 1000) return 'one thousand';
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const hPart = hundreds > 0 ? `${EN_ONES[hundreds]} hundred` : '';
  if (rest === 0) return hPart;
  const tens = Math.floor(rest / 10);
  const ones = rest % 10;
  const rPart =
    rest < 20
      ? EN_ONES[rest]
      : ones === 0
      ? EN_TENS[tens]
      : `${EN_TENS[tens]}-${EN_ONES[ones]}`;
  return hPart ? `${hPart} ${rPart}` : rPart;
};

const JP_DIGITS = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];

/** 0~1000 일본어 수 읽기 (예: 34 → さんじゅうよん) */
export const readJapanese = (n: number): string => {
  if (n === 0) return 'ぜろ';
  if (n === 1000) return 'せん';
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const hMap: Record<number, string> = {
    0: '',
    1: 'ひゃく',
    2: 'にひゃく',
    3: 'さんびゃく',
    4: 'よんひゃく',
    5: 'ごひゃく',
    6: 'ろっぴゃく',
    7: 'ななひゃく',
    8: 'はっぴゃく',
    9: 'きゅうひゃく',
  };
  const tens = Math.floor(rest / 10);
  const ones = rest % 10;
  const tensStr = tens === 0 ? '' : tens === 1 ? 'じゅう' : `${JP_DIGITS[tens]}じゅう`;
  return `${hMap[hundreds] ?? ''}${tensStr}${JP_DIGITS[ones]}`;
};

/** 시드 고정 난수 (매번 같은 문제가 나오도록) */
const makeRng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const randInt = (rng: () => number, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));

/**
 * 정답 + 그럴듯한 오답 3개로 4지선다 구성
 * - 초등 2학년의 대표적인 연산 실수 패턴을 반영 (받아올림/받아내림 실수, 일의 자리 계산 실수, 자릿수 전치 등)
 * - 정답보다 큰 수와 작은 수가 균형 있게 섞이고, 정답의 크기 순위(작은 쪽에서 몇 번째)가 무작위화되어 보기만 보고 찍을 수 없도록 방지
 */
const buildOptions = (
  answer: number,
  indexOrSeed: number,
  spec?: { hintFormula?: MathHintFormula }
): number[] => {
  const h = spec?.hintFormula;
  const pool = new Set<number>();

  // 1) 수식 분석을 통한 초등 2학년 맞춤형 실수 패턴 후보군
  if (h) {
    const a = h.a;
    const b = h.b;
    const op = h.op;

    if (op === '+') {
      // 덧셈 실수: 받아올림을 누락한 경우 (10이 덜 더해짐)
      if (answer >= 10) pool.add(answer - 10);
      // 받아올림을 중복으로 더한 경우
      if (answer + 10 <= 100) pool.add(answer + 10);
      // 덧셈 대신 뺄셈을 해버린 실수
      if (a >= b && a - b !== answer) pool.add(a - b);
      // 일의 자리 합만 적고 십의 자리를 빠뜨린 경우 등
    } else if (op === '-') {
      // 뺄셈 실수: 받아내림을 하지 않고 큰 수에서 작은 수를 뺀 경우
      const aO = a % 10;
      const bO = b % 10;
      if (aO < bO) {
        // 일의 자리에서 작은 수 - 큰 수가 안 되어 그냥 bO - aO를 한 대표적 실수
        const noBorrowMistake = Math.floor(a / 10 - b / 10) * 10 + (bO - aO);
        if (noBorrowMistake >= 0 && noBorrowMistake <= 100) pool.add(noBorrowMistake);
      }
      // 받아내림 후 십의 자리를 1 줄이지 않은 실수 (+10)
      if (answer + 10 <= 100) pool.add(answer + 10);
      // 10을 더 깎아버린 실수 (-10)
      if (answer >= 10) pool.add(answer - 10);
      // 뺄셈 대신 덧셈을 한 실수
      if (a + b <= 100) pool.add(a + b);
    }
  }

  // 2) 십의 자리 / 일의 자리 숫자 전치(뒤바뀜) 실수 (예: 42 ↔ 24)
  if (answer >= 12 && answer <= 98) {
    const tens = Math.floor(answer / 10);
    const ones = answer % 10;
    if (tens !== ones && ones > 0) {
      const swapped = ones * 10 + tens;
      if (swapped <= 100) pool.add(swapped);
    }
  }

  // 3) 계산 근접 실수 (일의 자리 ±1, ±2, ±3)
  const nearOffsets = [1, -1, 2, -2, 3, -3, 10, -10, 9, -9, 11, -11];
  for (const off of nearOffsets) {
    const val = answer + off;
    if (val >= 0 && val <= 100) pool.add(val);
  }

  // 4) 정답 제거 및 배열화
  pool.delete(answer);
  const candidateList = Array.from(pool);

  // 시드 난수화 (indexOrSeed 기반 일관성 + 무작위성 확보)
  let seed = ((indexOrSeed + 1) * 314159 + answer * 7919) >>> 0;
  const pseudoRand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // 정답보다 작은 후보와 큰 후보 분리
  const smaller = candidateList.filter((n) => n < answer);
  const larger = candidateList.filter((n) => n > answer);

  // 셔플
  const shuffleArray = (arr: number[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };
  shuffleArray(smaller);
  shuffleArray(larger);

  // 정답이 항상 작은 쪽 2번째가 되지 않도록, 정답보다 작은 오답 개수를 0~3개 중 균형 있게 무작위 추출
  // (가능한 경우 작은 수 1~2개, 큰 수 1~2개로 정답이 중간 또는 양 끝에 고르게 분포)
  const wrongs: number[] = [];
  const targetSmallerCount = Math.floor(pseudoRand() * 3); // 0, 1, 2 중 하나

  // 작은 수에서 추출
  for (const s of smaller) {
    if (wrongs.length >= targetSmallerCount) break;
    wrongs.push(s);
  }

  // 큰 수에서 추출
  for (const l of larger) {
    if (wrongs.length >= 3) break;
    wrongs.push(l);
  }

  // 모자라면 남은 후보군 전체에서 충원
  if (wrongs.length < 3) {
    const remaining = candidateList.filter((n) => !wrongs.includes(n));
    shuffleArray(remaining);
    for (const r of remaining) {
      wrongs.push(r);
      if (wrongs.length === 3) break;
    }
  }

  // 극단적인 경우(후보 부족) 안전장치
  let fallbackDelta = 4;
  while (wrongs.length < 3) {
    const cand = answer + fallbackDelta;
    if (cand >= 0 && cand <= 100 && cand !== answer && !wrongs.includes(cand)) {
      wrongs.push(cand);
    }
    fallbackDelta = fallbackDelta > 0 ? -fallbackDelta : -fallbackDelta + 1;
  }

  // 5) 정답을 무작위 위치(0~3)에 삽입
  const insertPos = Math.floor(pseudoRand() * 4);
  const result = [...wrongs];
  result.splice(insertPos, 0, answer);
  return result;
};

interface Spec {
  question: string;
  readKr: string;
  answer: number;
  hintFormula?: MathHintFormula;
  isMissingNumber?: boolean;
  missingPosition?: 'first' | 'second';
}

const addSpec = (a: number, b: number): Spec => ({
  question: `${a} + ${b}`,
  readKr: `${readSino(a)} 더하기 ${readSino(b)}`,
  answer: a + b,
  hintFormula: { a, op: '+', b },
});

const subSpec = (a: number, b: number): Spec => ({
  question: `${a} - ${b}`,
  readKr: `${readSino(a)} 빼기 ${readSino(b)}`,
  answer: a - b,
  hintFormula: { a, op: '-', b },
});

/** 빈칸 채우기(거꾸로 셈) 문제 변환 함수 (초등 2학년 덧셈·뺄셈 관계 학습) */
const makeMissingNumberSpec = (base: Spec, useFirstPosition = false): Spec => {
  if (!base.hintFormula || base.hintFormula.op2) return base;
  const { a, b, op } = base.hintFormula;
  const result = base.answer;

  if (op === '+') {
    // a + b = result
    if (useFirstPosition) {
      // □ + b = result (정답: a)
      return {
        question: `□ + ${b} = ${result}`,
        readKr: `어떤 수 더하기 ${readSino(b)}는 ${readSino(result)}`,
        answer: a,
        isMissingNumber: true,
        missingPosition: 'first',
        hintFormula: { a: result, op: '-', b, c: a },
      };
    }
    // a + □ = result (정답: b)
    return {
      question: `${a} + □ = ${result}`,
      readKr: `${readSino(a)} 더하기 어떤 수는 ${readSino(result)}`,
      answer: b,
      isMissingNumber: true,
      missingPosition: 'second',
      hintFormula: { a: result, op: '-', b: a, c: b },
    };
  }

  // a - b = result
  if (useFirstPosition) {
    // □ - b = result (정답: a)
    return {
      question: `□ - ${b} = ${result}`,
      readKr: `어떤 수 빼기 ${readSino(b)}는 ${readSino(result)}`,
      answer: a,
      isMissingNumber: true,
      missingPosition: 'first',
      hintFormula: { a: result, op: '+', b, c: a },
    };
  }
  // a - □ = result (정답: b)
  return {
    question: `${a} - □ = ${result}`,
    readKr: `${readSino(a)} 빼기 어떤 수는 ${readSino(result)}`,
    answer: b,
    isMissingNumber: true,
    missingPosition: 'second',
    hintFormula: { a, op: '-', b: result, c: b },
  };
};

/** 세 수 계산: ops는 두 연산자 */
const tripleSpec = (a: number, op1: '+' | '-', b: number, op2: '+' | '-', c: number): Spec => {
  const step = op1 === '+' ? a + b : a - b;
  const answer = op2 === '+' ? step + c : step - c;
  const word = (op: '+' | '-') => (op === '+' ? '더하기' : '빼기');
  return {
    question: `${a} ${op1} ${b} ${op2} ${c}`,
    readKr: `${readSino(a)} ${word(op1)} ${readSino(b)} ${word(op2)} ${readSino(c)}`,
    answer,
    hintFormula: { a, op: op1, b, op2, c },
  };
};

type SpecMaker = (rng: () => number) => Spec;

// 받아올림/내림 없는 두 자리 수 덧셈
const addNoCarry: SpecMaker = (rng) => {
  const aT = randInt(rng, 1, 7);
  const aO = randInt(rng, 1, 8);
  const bT = randInt(rng, 1, 9 - aT);
  const bO = randInt(rng, 1, 9 - aO);
  return addSpec(aT * 10 + aO, bT * 10 + bO);
};


// 받아내림 없는 두 자리 수 뺄셈
const subNoBorrow: SpecMaker = (rng) => {
  const aT = randInt(rng, 3, 9);
  const aO = randInt(rng, 1, 9);
  const bT = randInt(rng, 1, aT - 1);
  const bO = randInt(rng, 0, aO);
  return subSpec(aT * 10 + aO, bT * 10 + bO);
};

// 받아올림 1회 두 자리 수 덧셈 (일의 자리 합 ≥ 10, 합 ≤ 100)
const addCarry: SpecMaker = (rng) => {
  const aT = randInt(rng, 1, 7);
  const aO = randInt(rng, 2, 9);
  const bO = randInt(rng, 10 - aO, 9);
  const bT = randInt(rng, 1, 8 - aT);
  return addSpec(aT * 10 + aO, bT * 10 + bO);
};

// 받아내림 1회 두 자리 수 뺄셈 (일의 자리 a < b)
const subBorrow: SpecMaker = (rng) => {
  const aT = randInt(rng, 3, 9);
  const aO = randInt(rng, 0, 7);
  const bO = randInt(rng, aO + 1, 9);
  const bT = randInt(rng, 1, aT - 1);
  return subSpec(aT * 10 + aO, bT * 10 + bO);
};

// 세 수 덧셈 (합 ≤ 100)
const tripleAdd: SpecMaker = (rng) => {
  const a = randInt(rng, 5, 40);
  const b = randInt(rng, 5, 30);
  const c = randInt(rng, 5, Math.min(40, 99 - a - b));
  return tripleSpec(a, '+', b, '+', c);
};

// 세 수 덧셈·뺄셈 혼합 (중간 결과가 음수가 되지 않음)
const tripleMixed: SpecMaker = (rng) => {
  if (rng() < 0.5) {
    const a = randInt(rng, 30, 80);
    const b = randInt(rng, 5, 25);
    const c = randInt(rng, 5, Math.min(30, 99 - (a - b)));
    return tripleSpec(a, '-', b, '+', c);
  }
  const a = randInt(rng, 10, 50);
  const b = randInt(rng, 10, 30);
  const c = randInt(rng, 5, Math.min(a + b - 1, 40));
  return tripleSpec(a, '+', b, '-', c);
};

// 100 이하 종합 (덧셈/뺄셈 섞기, 받아올림·내림 자유)
const mixedTwoDigit: SpecMaker = (rng) => {
  if (rng() < 0.5) {
    const a = randInt(rng, 21, 78);
    const b = randInt(rng, 12, 99 - a);
    return addSpec(a, b);
  }
  const a = randInt(rng, 41, 99);
  const b = randInt(rng, 12, a - 11);
  return subSpec(a, b);
};

const generateStage = (
  stage: number,
  maker: SpecMaker,
  count = 8,
  onlyKind?: 'add' | 'sub',
  seedOffset = 0
): MathProblemItem[] => {
  const rng = makeRng(stage * 7919 + 13 + seedOffset * 9973);
  const seen = new Set<string>();
  const items: MathProblemItem[] = [];
  let guard = 0;
  while (items.length < count && guard < 2000) {
    guard += 1;
    const spec = maker(rng);
    if (onlyKind === 'add' && !spec.question.includes('+')) continue;
    if (onlyKind === 'sub' && !spec.question.includes('-')) continue;
    if (spec.answer < 0 || spec.answer > 100) continue;
    if (seen.has(spec.question)) continue;
    seen.add(spec.question);
    const n = items.length;
    // 7번, 8번 문제는 빈칸 채우기(거꾸로 셈) 문제로 전환 (세 수 연산인 7~8 스테이지 제외)
    const isMissingCandidate = stage !== 7 && stage !== 8 && (n === 6 || n === 7);
    const finalSpec = isMissingCandidate ? makeMissingNumberSpec(spec, n === 6) : spec;

    items.push({
      id: `math_s${stage}_p${n + 1}_${seedOffset}`,
      stage,
      question: finalSpec.question,
      answer: String(finalSpec.answer),
      options: buildOptions(finalSpec.answer, n + stage + seedOffset * 17, finalSpec).map(String),
      readKr: finalSpec.readKr,
      hintFormula: finalSpec.hintFormula,
      isMissingNumber: finalSpec.isMissingNumber,
      missingPosition: finalSpec.missingPosition,
    });
  }
  return items;
};

/** 두 maker를 번갈아 사용 (예: 덧셈/뺄셈 혼합 스테이지) */
const alternate = (a: SpecMaker, b: SpecMaker): SpecMaker => {
  let flag = false;
  return (rng) => {
    flag = !flag;
    return flag ? a(rng) : b(rng);
  };
};

// ---------- 서술형(문장제) & 아이 이름 커스텀 ----------

export const DEFAULT_CHILD_NAME = '시우';
export const STORAGE_KEY_CHILD_NAME = 'godzilla_child_name';

/** 아이 이름 불러오기 (기본값: '시우') */
export const getChildName = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHILD_NAME);
      if (saved && saved.trim()) return saved.trim();
    } catch {
      // ignore
    }
  }
  return DEFAULT_CHILD_NAME;
};

/** 아이 이름 저장하기 */
export const setChildName = (name: string): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CHILD_NAME, name.trim());
    } catch {
      // ignore
    }
  }
};

/** 한글 받침 유무 확인 (이름 뒤 자연스러운 조사 처리) */
export const hasBatchim = (name: string): boolean => {
  if (!name) return false;
  const lastChar = name.charCodeAt(name.length - 1);
  if (lastChar < 0xac00 || lastChar > 0xd7a3) return false;
  return (lastChar - 0xac00) % 28 > 0;
};

/**
 * 아이 이름에 맞는 자연스러운 한국어 조사 붙이기
 * 예 (시우): 시우가, 시우는, 시우를, 시우와, 시우의, 시우에게, 시우보다, 시우네
 * 예 (하은): 하은이가, 하은이는, 하은이를, 하은이와, 하은이의, 하은이에게, 하은이보다, 하은이네
 */
export const formatNameWithParticle = (
  name: string,
  particle: '이가' | '은는' | '을를' | '와과' | '의' | '에게' | '보다' | '네'
): string => {
  const batchim = hasBatchim(name);
  switch (particle) {
    case '이가':
      return batchim ? `${name}이가` : `${name}가`;
    case '은는':
      return batchim ? `${name}이는` : `${name}는`;
    case '을를':
      return batchim ? `${name}이를` : `${name}를`;
    case '와과':
      return batchim ? `${name}이와` : `${name}와`;
    case '의':
      return `${name}의`;
    case '에게':
      return `${name}에게`;
    case '보다':
      return batchim ? `${name}이보다` : `${name}보다`;
    case '네':
      return batchim ? `${name}이네` : `${name}네`;
    default:
      return name;
  }
};

/**
 * 스테이지별 난이도에 맞춘 서술형 수치 생성기
 * - stage 1~3: 받아올림/내림 없는 두 자리 수 (합 ≤ 99, 차 ≥ 0)
 * - stage 4~6: 받아올림/내림 1회 포함 두 자리 수 (합 ≤ 99, 차 ≥ 0)
 * - stage 7~8: 세 수 덧셈/뺄셈 (합 ≤ 99)
 * - stage 9~10: 두 자리 종합 혼합 (100 이하)
 * - stage 11: 덧셈 서술형 마스터 (다양한 난이도 골고루)
 * - stage 12: 뺄셈/혼합 서술형 마스터 (다양한 난이도 골고루)
 */
interface WordNumbers {
  a: number;
  b: number;
  c?: number;
}

const getWordNumbers = (stageNum: number, op: '+' | '-' | 'triple'): WordNumbers => {
  if (op === '+') {
    // 1) 받아올림 없는 덧셈 (Stage 1~3)
    if (stageNum >= 1 && stageNum <= 3) {
      const aT = randInt(Math.random, 1, 6);
      const aO = randInt(Math.random, 1, 8);
      const bT = randInt(Math.random, 1, 8 - aT);
      const bO = randInt(Math.random, 1, 9 - aO);
      return { a: aT * 10 + aO, b: bT * 10 + bO };
    }
    // 2) 받아올림 1회 덧셈 (Stage 4~6)
    if (stageNum >= 4 && stageNum <= 6) {
      const aT = randInt(Math.random, 1, 6);
      const aO = randInt(Math.random, 2, 9);
      const bO = randInt(Math.random, 10 - aO, 9);
      const bT = randInt(Math.random, 1, 7 - aT);
      return { a: aT * 10 + aO, b: bT * 10 + bO };
    }
    // 3) 그 외 (Stage 9, 10, 11 등): 두 자리 수 혼합 덧셈
    const a = randInt(Math.random, 15, 58);
    const b = randInt(Math.random, 12, 95 - a);
    return { a, b };
  }

  if (op === '-') {
    // 1) 받아내림 없는 뺄셈 (Stage 1~3)
    if (stageNum >= 1 && stageNum <= 3) {
      const aT = randInt(Math.random, 3, 9);
      const aO = randInt(Math.random, 2, 9);
      const bT = randInt(Math.random, 1, aT - 1);
      const bO = randInt(Math.random, 0, aO);
      return { a: aT * 10 + aO, b: bT * 10 + bO };
    }
    // 2) 받아내림 1회 뺄셈 (Stage 4~6)
    if (stageNum >= 4 && stageNum <= 6) {
      const aT = randInt(Math.random, 3, 9);
      const aO = randInt(Math.random, 0, 7);
      const bO = randInt(Math.random, aO + 1, 9);
      const bT = randInt(Math.random, 1, aT - 1);
      return { a: aT * 10 + aO, b: bT * 10 + bO };
    }
    // 3) 그 외 (Stage 9, 10, 12 등): 두 자리 수 혼합 뺄셈
    const a = randInt(Math.random, 35, 95);
    const b = randInt(Math.random, 12, a - 11);
    return { a, b };
  }

  // triple (세 수 계산 - 합 ≤ 99)
  const a = randInt(Math.random, 12, 36);
  const b = randInt(Math.random, 8, 24);
  const c = randInt(Math.random, 6, Math.min(25, 95 - a - b));
  return { a, b, c };
};

// 서술형 문제 풀 (다양한 지문과 랜덤 수치 생성을 위한 템플릿)
interface WordTemplate {
  op: '+' | '-' | 'triple';
  generate: (name: string, stageNum: number) => { text: string; answer: number };
}

// -------------------------------------------------------------
// 덧셈 템플릿 풀: 시우 & 고질라 괴수 친구들과의 기지 방어 이야기
// -------------------------------------------------------------
const WORD_TEMPLATES_ADD: WordTemplate[] = [
  {
    op: '+',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      const siwooGa = formatNameWithParticle(name, '이가');
      return {
        text: `${siwooGa} 기지에서 파워 큐브를 ${a}개 모았고, 모스라가 ${b}개를 더 가져왔습니다. 파워 큐브는 모두 몇 개일까요?`,
        answer: a + b,
      };
    },
  },
  {
    op: '+',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      const siwooWa = formatNameWithParticle(name, '와과');
      return {
        text: `${siwooWa} 고질라가 어제는 열선 훈련을 ${a}번 했고, 오늘은 어제보다 ${b}번 더 많이 했습니다. 오늘 열선 훈련을 몇 번 했을까요?`,
        answer: a + b,
      };
    },
  },
  {
    op: '+',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      const siwooGa = formatNameWithParticle(name, '이가');
      return {
        text: `${siwooGa} 소행성 운석 ${a}개를 요격했고, 메카고질라는 ${b}개를 요격했습니다. 둘이 요격한 운석은 모두 몇 개일까요?`,
        answer: a + b,
      };
    },
  },
  {
    op: '+',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      const siwooNeun = formatNameWithParticle(name, '은는');
      const siwooBoda = formatNameWithParticle(name, '보다');
      return {
        text: `${siwooNeun} 괴수 카드를 ${a}장 가지고 있고, 지호는 ${siwooBoda} ${b}장 더 많이 가지고 있습니다. 지호의 괴수 카드는 몇 장일까요?`,
        answer: a + b,
      };
    },
  },
  {
    op: '+',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      const siwooUi = formatNameWithParticle(name, '의');
      return {
        text: `${siwooUi} 방어 기지 1구역에 쉴드 배터리가 ${a}개, 2구역에 ${b}개 보관되어 있습니다. 배터리는 모두 몇 개일까요?`,
        answer: a + b,
      };
    },
  },
  {
    op: '+',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      const siwooGa = formatNameWithParticle(name, '이가');
      return {
        text: `${siwooGa} 바구니에 사과를 ${a}개 담았고, 치비고질라가 귤 ${b}개를 더 넣었습니다. 바구니에 있는 과일은 모두 몇 개일까요?`,
        answer: a + b,
      };
    },
  },
  {
    op: '+',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      const siwooUi = formatNameWithParticle(name, '의');
      return {
        text: `${siwooUi} 책장 위 칸에 공룡 도감이 ${a}권, 아래 칸에 우주 과학 책이 ${b}권 꽂혀 있습니다. 책은 모두 몇 권일까요?`,
        answer: a + b,
      };
    },
  },
  {
    op: '+',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      const siwooUi = formatNameWithParticle(name, '의');
      return {
        text: `${siwooUi} 탐사 기지에 대원이 ${a}명 있었습니다. 잠시 후 지원 대원 ${b}명이 더 합류했습니다. 기지에 있는 대원은 모두 몇 명일까요?`,
        answer: a + b,
      };
    },
  },
  {
    op: '+',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      const siwooUi = formatNameWithParticle(name, '의');
      return {
        text: `${siwooUi} 필통에 색연필이 ${a}자루 있었는데 어머니께서 ${b}자루를 더 넣어 주셨습니다. 색연필은 모두 몇 자루일까요?`,
        answer: a + b,
      };
    },
  },
  {
    op: '+',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      const siwooGa = formatNameWithParticle(name, '이가');
      return {
        text: `${siwooGa} 줄넘기를 1세트에 ${a}번 했고, 2세트에는 1세트보다 ${b}번 더 많이 했습니다. 2세트에 줄넘기를 몇 번 했을까요?`,
        answer: a + b,
      };
    },
  },
  {
    op: '+',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      const siwooGa = formatNameWithParticle(name, '이가');
      return {
        text: `${siwooGa} 과수원에서 배를 ${a}개, 사과를 ${b}개 땄습니다. ${siwooGa} 딴 과일은 모두 몇 개일까요?`,
        answer: a + b,
      };
    },
  },
  {
    op: '+',
    generate: (_name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      return {
        text: `고질라 기지에 에너지 볼트가 ${a}발 장전되어 있었는데, 보급선이 와서 ${b}발을 더 채웠습니다. 에너지 볼트는 모두 몇 발일까요?`,
        answer: a + b,
      };
    },
  },
  {
    op: '+',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      const siwooGa = formatNameWithParticle(name, '이가');
      return {
        text: `${siwooGa} 빨간 풍선을 ${a}개, 파란 풍선을 ${b}개 가지고 있습니다. 풍선은 모두 몇 개일까요?`,
        answer: a + b,
      };
    },
  },
  {
    op: '+',
    generate: (_name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '+');
      return {
        text: `고질라 연구소에 연구원 ${a}명이 있었는데, 새로운 지원 연구원 ${b}명이 더 왔습니다. 연구원은 모두 몇 명일까요?`,
        answer: a + b,
      };
    },
  },
];

// -------------------------------------------------------------
// 뺄셈 템플릿 풀: 시우 & 고질라 괴수 친구들과의 기지 방어 이야기
// -------------------------------------------------------------
const WORD_TEMPLATES_SUB: WordTemplate[] = [
  {
    op: '-',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      const siwooUi = formatNameWithParticle(name, '의');
      return {
        text: `${siwooUi} 기지에 쉴드 배터리가 ${a}개 있었는데, 킹기도라의 번개를 막느라 ${b}개를 사용했습니다. 남은 배터리는 몇 개일까요?`,
        answer: a - b,
      };
    },
  },
  {
    op: '-',
    generate: (_name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      return {
        text: `메카고질라가 미사일을 ${a}발 장착하고 출동했는데, 운석을 향해 ${b}발을 발사했습니다. 남은 미사일은 몇 발일까요?`,
        answer: a - b,
      };
    },
  },
  {
    op: '-',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      const siwooGa = formatNameWithParticle(name, '이가');
      return {
        text: `${siwooGa} 색종이 ${a}장 중에서 고질라 가면을 만드는 데 ${b}장을 사용했습니다. 남은 색종이는 몇 장일까요?`,
        answer: a - b,
      };
    },
  },
  {
    op: '-',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      const siwooNeun = formatNameWithParticle(name, '은는');
      const siwooBoda = formatNameWithParticle(name, '보다');
      return {
        text: `${siwooNeun} 파워 구슬을 ${a}개 가지고 있고, 친구 민우는 ${siwooBoda} ${b}개 더 적게 가지고 있습니다. 민우의 구슬은 몇 개일까요?`,
        answer: a - b,
      };
    },
  },
  {
    op: '-',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      const siwooGa = formatNameWithParticle(name, '이가');
      return {
        text: `${siwooGa} 괴수 도감 ${a}쪽 중에서 ${b}쪽을 읽었습니다. 아직 읽지 않은 쪽은 몇 쪽일까요?`,
        answer: a - b,
      };
    },
  },
  {
    op: '-',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      const siwooGa = formatNameWithParticle(name, '이가');
      return {
        text: `${siwooGa} 탄 버스에 승객이 ${a}명 타고 있었습니다. 정류장에서 ${b}명이 내렸습니다. 지금 버스에는 몇 명이 남아 있을까요?`,
        answer: a - b,
      };
    },
  },
  {
    op: '-',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      const siwooUi = formatNameWithParticle(name, '의');
      return {
        text: `${siwooUi} 간식 상자에 별사탕이 ${a}개 있었는데 친구들에게 ${b}개를 나누어 주었습니다. 남은 별사탕은 몇 개일까요?`,
        answer: a - b,
      };
    },
  },
  {
    op: '-',
    generate: (_name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      return {
        text: `모스라는 비행 순찰을 ${a}번 돌았고, 라돈은 모스라보다 ${b}번 더 적게 돌았습니다. 라돈은 순찰을 몇 번 돌았을까요?`,
        answer: a - b,
      };
    },
  },
  {
    op: '-',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      const siwooUi = formatNameWithParticle(name, '의');
      return {
        text: `${siwooUi} 고질라 저금통에 백 원짜리 동전이 ${a}개 들어 있었습니다. 그중 ${b}개를 꺼냈습니다. 저금통에 남은 동전은 몇 개일까요?`,
        answer: a - b,
      };
    },
  },
  {
    op: '-',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      const siwooGa = formatNameWithParticle(name, '이가');
      return {
        text: `${siwooGa} 튼튼한 테이프 ${a}cm 중에서 기지 창문을 보강하는 데 ${b}cm를 사용했습니다. 남은 테이프는 몇 cm일까요?`,
        answer: a - b,
      };
    },
  },
  {
    op: '-',
    generate: (_name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      return {
        text: `기지에 방어 로봇이 ${a}대 있었습니다. 그중 ${b}대가 정비를 위해 격납고로 들어갔습니다. 지금 작전 중인 로봇은 몇 대일까요?`,
        answer: a - b,
      };
    },
  },
  {
    op: '-',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      const siwooNe = formatNameWithParticle(name, '네');
      return {
        text: `${siwooNe} 반 학생은 모두 ${a}명이고, 그중 남학생은 ${b}명입니다. 여학생은 몇 명일까요?`,
        answer: a - b,
      };
    },
  },
  {
    op: '-',
    generate: (name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      const siwooUi = formatNameWithParticle(name, '의');
      return {
        text: `${siwooUi} 과자 상자에 초코 과자가 ${a}개 있었는데 그중 ${b}개를 먹었습니다. 남은 과자는 몇 개일까요?`,
        answer: a - b,
      };
    },
  },
  {
    op: '-',
    generate: (_name, stageNum) => {
      const { a, b } = getWordNumbers(stageNum, '-');
      return {
        text: `나무에 참새가 ${a}마리 앉아 있었는데 ${b}마리가 날아갔습니다. 남은 참새는 몇 마리일까요?`,
        answer: a - b,
      };
    },
  },
];

// -------------------------------------------------------------
// 세 수 연산 템플릿 풀: Stage 7, 8 전용
// -------------------------------------------------------------
const WORD_TEMPLATES_TRIPLE: WordTemplate[] = [
  {
    op: 'triple',
    generate: (name, stageNum) => {
      const { a, b, c = 10 } = getWordNumbers(stageNum, 'triple');
      const siwooGa = formatNameWithParticle(name, '이가');
      return {
        text: `${siwooGa} 별사탕을 ${a}개, 모스라가 ${b}개, 고질라가 ${c}개를 모았습니다. 셋이 모은 별사탕은 모두 몇 개일까요?`,
        answer: a + b + c,
      };
    },
  },
  {
    op: 'triple',
    generate: (name, stageNum) => {
      const { a, b, c = 10 } = getWordNumbers(stageNum, 'triple');
      const siwooUi = formatNameWithParticle(name, '의');
      return {
        text: `${siwooUi} 기지 1구역에 로봇 ${a}대, 2구역에 ${b}대, 3구역에 ${c}대가 배치되었습니다. 로봇은 모두 몇 대일까요?`,
        answer: a + b + c,
      };
    },
  },
  {
    op: 'triple',
    generate: (name, stageNum) => {
      const { a, b, c = 10 } = getWordNumbers(stageNum, 'triple');
      const siwooGa = formatNameWithParticle(name, '이가');
      const siwooUi = formatNameWithParticle(name, '의');
      return {
        text: `${siwooGa} 파워 큐브를 ${a}개 가지고 있었는데 고질라에게 ${b}개를 주고, 모스라에게 ${c}개를 더 받았습니다. ${siwooUi} 파워 큐브는 몇 개일까요?`,
        answer: a - b + c,
      };
    },
  },
  {
    op: 'triple',
    generate: (name, stageNum) => {
      const { a, b, c = 10 } = getWordNumbers(stageNum, 'triple');
      const siwooGa = formatNameWithParticle(name, '이가');
      return {
        text: `${siwooGa} 탄 탐사선에 승객이 ${a}명 있었습니다. 첫 정류장에서 ${b}명이 더 탔고, 다음 정류장에서 ${c}명이 내렸습니다. 탐사선에는 지금 몇 명이 타고 있을까요?`,
        answer: a + b - c,
      };
    },
  },
];

/**
 * 셔플 유틸 함수 (Fisher-Yates)
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 서술형 문제를 매번 랜덤으로 count개 생성 및 추출
 * - stage 1~3: 받아올림/내림 없는 쉬운 덧셈·뺄셈 문장제
 * - stage 4~6: 받아올림/내림 1회 포함 덧셈·뺄셈 문장제
 * - stage 7~8: 세 수 또는 혼합 문장제
 * - stage 9~10: 두 자리 종합 문장제
 * - stage 11: 덧셈 서술형 마스터 (10문제 전체 서술형)
 * - stage 12: 뺄셈/혼합 서술형 마스터 (10문제 전체 서술형)
 */
export const generateRandomWordProblems = (
  stageNum: number,
  count = PROBLEMS_PER_MATH_STAGE,
  startRound = 1,
  customChildName?: string
): MathProblemItem[] => {
  const childName = customChildName || getChildName();
  let templatePool: WordTemplate[];

  if (stageNum === 1 || stageNum === 4 || stageNum === 11) {
    templatePool = [...WORD_TEMPLATES_ADD];
  } else if (stageNum === 2 || stageNum === 5 || stageNum === 12) {
    templatePool = [...WORD_TEMPLATES_SUB];
  } else if (stageNum === 7 || stageNum === 8) {
    templatePool = [...WORD_TEMPLATES_TRIPLE, ...WORD_TEMPLATES_ADD, ...WORD_TEMPLATES_SUB];
  } else {
    // 혼합
    templatePool = [...WORD_TEMPLATES_ADD, ...WORD_TEMPLATES_SUB];
  }

  const shuffled = shuffle(templatePool);
  const selected: WordTemplate[] = [];
  for (let i = 0; i < count; i++) {
    selected.push(shuffled[i % shuffled.length]);
  }

  return selected.map((tmpl, idx) => {
    const { text, answer } = tmpl.generate(childName, stageNum);
    const roundNumber = startRound + idx;
    const tempItem: MathProblemItem = {
      id: '',
      stage: stageNum,
      question: text,
      answer,
      options: [],
      readKr: text,
      problemText: text,
    };
    const inferredHint = getProblemHintFormula(tempItem);
    const rawOptions = buildOptions(
      answer,
      Math.floor(Math.random() * 100000) + idx,
      inferredHint ? { hintFormula: inferredHint } : undefined
    );
    return {
      id: `math_s${stageNum}_r${roundNumber}_${Date.now()}_${idx + 1}`,
      stage: stageNum,
      isWordProblem: true,
      question: text,
      problemText: text,
      answer,
      options: rawOptions,
      readKr: text,
      hintFormula: inferredHint || undefined,
    };
  });
};



// ---------- 기본 고정 계산 문제 (스테이지당 8문제) ----------

export const MATH_BASE_PROBLEMS: MathProblemItem[] = [
  // STAGE 1~3: 받아올림/내림 없음 (8문제씩)
  ...generateStage(1, addNoCarry, 8, 'add'),
  ...generateStage(2, subNoBorrow, 8, 'sub'),
  ...generateStage(3, alternate(addNoCarry, subNoBorrow), 8),
  // STAGE 4~6: 받아올림/내림 1회 (8문제씩)
  ...generateStage(4, addCarry, 8, 'add'),
  ...generateStage(5, subBorrow, 8, 'sub'),
  ...generateStage(6, alternate(addCarry, subBorrow), 8),
  // STAGE 7~8: 세 수 계산 (8문제씩)
  ...generateStage(7, tripleAdd, 8),
  ...generateStage(8, tripleMixed, 8),
  // STAGE 9~10: 100 이하 종합 (8문제씩)
  ...generateStage(9, mixedTwoDigit, 8),
  ...generateStage(10, mixedTwoDigit, 8),
];

export const MATH_PROBLEMS: MathProblemItem[] = MATH_BASE_PROBLEMS;

// 스테이지별 수식 생성기 매핑
const getStageMakerConfig = (stage: number): { maker: SpecMaker; onlyKind?: 'add' | 'sub' } => {
  switch (stage) {
    case 1:
      return { maker: addNoCarry, onlyKind: 'add' };
    case 2:
      return { maker: subNoBorrow, onlyKind: 'sub' };
    case 3:
      return { maker: alternate(addNoCarry, subNoBorrow) };
    case 4:
      return { maker: addCarry, onlyKind: 'add' };
    case 5:
      return { maker: subBorrow, onlyKind: 'sub' };
    case 6:
      return { maker: alternate(addCarry, subBorrow) };
    case 7:
      return { maker: tripleAdd };
    case 8:
      return { maker: tripleMixed };
    case 9:
    case 10:
    default:
      return { maker: mixedTwoDigit };
  }
};

const formatClockLabel = (h: number, m: number): string => {
  const normH = ((h - 1 + 12) % 12) + 1;
  const normM = ((m % 60) + 60) % 60;
  return normM === 0 ? `${normH}시 정각` : `${normH}시 ${normM}분`;
};

/**
 * 초등 2학년 교과 과정 '시각과 시간' 맞춤형 아날로그 시계 폭탄 문제 생성기
 * - mode 'read': 짧은 바늘(시침)과 긴 바늘(5분 단위 분침)을 보고 시각 읽기
 * - mode 'elapsed': 현재 시계 시각에서 15분 / 20분 / 30분 / 1시간 후 시각 구하기
 */
export const generateClockProblem = (
  stageNum: number,
  roundNumber: number,
  sessionSeed = 0,
  mode: 'read' | 'elapsed' = 'read'
): MathProblemItem => {
  const rng = makeRng(stageNum * 9973 + roundNumber * 313 + sessionSeed * 7919);
  const hour = randInt(rng, 1, 12);
  // 5분 단위 (5, 10, 15, ..., 55) 위주로 출제
  const minuteSteps = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const minute = minuteSteps[randInt(rng, 1, minuteSteps.length - 1)];

  const deltaCandidates = stageNum <= 4 ? [10, 20, 30] : [15, 20, 30, 60];
  const deltaMinutes = mode === 'elapsed' ? deltaCandidates[randInt(rng, 0, deltaCandidates.length - 1)] : 0;

  const totalMinutes = hour * 60 + minute + deltaMinutes;
  const targetHour = ((Math.floor(totalMinutes / 60) - 1) % 12) + 1;
  const targetMinute = totalMinutes % 60;

  const answerStr = formatClockLabel(targetHour, targetMinute);

  // 오답 보기 생성 (초2 흔한 실수: 시침이 다음 숫자로 다가갈 때 다음 시로 읽는 실수, 5분 단위 착각, 분침 숫자를 그대로 분으로 읽는 실수 등)
  const wrongSet = new Set<string>();
  // 1) 시침을 1시간 뒤로 잘못 읽은 오답
  wrongSet.add(formatClockLabel(targetHour + 1, targetMinute));
  // 2) 분을 +5분 / -5분 / +10분 착각한 오답
  wrongSet.add(formatClockLabel(targetHour, (targetMinute + 5) % 60));
  wrongSet.add(formatClockLabel(targetHour, (targetMinute + 50) % 60));
  wrongSet.add(formatClockLabel(targetHour, (targetMinute + 10) % 60));
  // 3) 경과 시간 문제일 때 현재 시각을 그대로 고르는 실수
  if (deltaMinutes > 0) {
    wrongSet.add(formatClockLabel(hour, minute));
  }
  wrongSet.delete(answerStr);

  const distractors = Array.from(wrongSet).slice(0, 3);
  while (distractors.length < 3) {
    const fallbackH = ((targetHour + distractors.length) % 12) + 1;
    const fallbackStr = formatClockLabel(fallbackH, targetMinute);
    if (fallbackStr !== answerStr && !distractors.includes(fallbackStr)) {
      distractors.push(fallbackStr);
    } else {
      distractors.push(formatClockLabel(fallbackH, (targetMinute + 15) % 60));
    }
  }

  const allOptions = [answerStr, ...distractors.slice(0, 3)];
  // 시드 기반 셔플
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }

  const deltaLabel = deltaMinutes === 60 ? '1시간' : `${deltaMinutes}분`;
  const question =
    deltaMinutes > 0
      ? `💣 시계에서 [${deltaLabel} 후] 폭발 시각은?`
      : '💣 시한폭탄 시계가 가리키는 시각은?';
  const readKr =
    deltaMinutes > 0
      ? `킹 기도라의 시한폭탄! 지금 시계 시각에서 ${deltaLabel} 뒤의 시각은 몇 시 몇 분일까요?`
      : '킹 기도라의 시한폭탄! 시계의 짧은 바늘과 긴 바늘이 가리키는 시각은 몇 시 몇 분일까요?';

  return {
    id: `math_clock_s${stageNum}_r${roundNumber}_${sessionSeed}`,
    stage: stageNum,
    question,
    answer: answerStr,
    options: allOptions,
    readKr,
    clockQuestion: {
      hour,
      minute,
      deltaMinutes,
      targetHour,
      targetMinute,
    },
  };
};

// ---------- 구구단(2~9단) & 단위 변환(cm/mm, m/cm, L/dL/mL) 생성기 ----------

const buildMultiplicationOptions = (a: number, b: number, answer: number, seed: number): string[] => {
  const rng = makeRng(seed * 7919 + answer * 131);
  const candidates = new Set<number>();
  if (b > 1) candidates.add(a * (b - 1));
  if (b < 9) candidates.add(a * (b + 1));
  if (a > 1) candidates.add((a - 1) * b);
  if (a < 9) candidates.add((a + 1) * b);
  candidates.add(a + b);
  candidates.add(Math.max(2, answer - a));
  candidates.add(answer + a);
  candidates.add(answer + 2);
  if (answer > 3) candidates.add(answer - 2);
  candidates.delete(answer);

  const wrongs = Array.from(candidates).filter((n) => n > 0 && n <= 90);
  for (let i = wrongs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [wrongs[i], wrongs[j]] = [wrongs[j], wrongs[i]];
  }
  const picked = wrongs.slice(0, 3);
  let delta = 1;
  while (picked.length < 3) {
    const cand = answer + delta;
    if (cand > 0 && cand !== answer && !picked.includes(cand)) picked.push(cand);
    delta = delta > 0 ? -delta : -delta + 1;
  }
  const all = [answer, ...picked];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.map(String);
};

const generateMultiplicationWordProblems = (
  stageNum: number,
  minDan: number,
  maxDan: number,
  count: number,
  childName: string,
  sessionSeed: number
): MathProblemItem[] => {
  const rng = makeRng(stageNum * 4099 + sessionSeed * 613 + 77);
  const siwooGa = formatNameWithParticle(childName, '이가');
  const siwooNeun = formatNameWithParticle(childName, '은는');
  const templates = [
    (a: number, b: number) =>
      `${siwooGa} 1상자에 파워 큐브를 ${a}개씩 ${b}상자에 담았습니다. 파워 큐브는 모두 몇 개일까요?`,
    (a: number, b: number) =>
      `고질라가 한 번 열선을 쏠 때 에너지를 ${a}만큼 모읍니다. ${b}번 연속으로 모으면 에너지는 모두 얼마일까요?`,
    (a: number, b: number) =>
      `${siwooNeun} 사탕을 ${a}개씩 ${b}봉지 가지고 있습니다. 사탕은 모두 몇 개일까요?`,
    (a: number, b: number) =>
      `괴수 카드가 1묶음에 ${a}장씩 들어 있습니다. ${b}묶음을 모으면 카드는 모두 몇 장일까요?`,
  ];

  const items: MathProblemItem[] = [];
  for (let i = 0; i < count; i++) {
    const a = randInt(rng, minDan, maxDan);
    const b = randInt(rng, 2, 9);
    const answer = a * b;
    const tmpl = templates[(i + Math.floor(rng() * templates.length)) % templates.length];
    const text = tmpl(a, b);
    items.push({
      id: `math_mul_word_s${stageNum}_${i + 1}_${sessionSeed}`,
      stage: stageNum,
      skillCategory: 'multiplication',
      isWordProblem: true,
      question: text,
      problemText: text,
      answer: String(answer),
      options: buildMultiplicationOptions(a, b, answer, stageNum * 100 + i + sessionSeed),
      readKr: text,
      multiplicationQuestion: { a, b },
    });
  }
  return items;
};

export const generateMultiplicationProblems = (
  stageNum: number,
  minDan: number,
  maxDan: number,
  count = 8,
  customChildName?: string,
  sessionSeed = 0,
  includeWordCount = 0
): MathProblemItem[] => {
  const name = customChildName || getChildName();
  const rng = makeRng(stageNum * 8191 + sessionSeed * 9973 + 51);
  const seen = new Set<string>();
  const items: MathProblemItem[] = [];
  let guard = 0;

  while (items.length < count && guard < 1000) {
    guard += 1;
    const a = randInt(rng, minDan, maxDan);
    const b = randInt(rng, 2, 9);
    const key = `${a}x${b}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const idx = items.length;
    const isMissing = count >= 6 && (idx === 6 || idx === 7);
    const product = a * b;

    if (isMissing) {
      const missingFirst = idx === 6;
      const ans = missingFirst ? a : b;
      const question = missingFirst ? `□ × ${b} = ${product}` : `${a} × □ = ${product}`;
      const readKr = missingFirst
        ? `어떤 수 곱하기 ${readSino(b)}는 ${readSino(product)}`
        : `${readSino(a)} 곱하기 어떤 수는 ${readSino(product)}`;
      items.push({
        id: `math_mul_s${stageNum}_p${idx + 1}_${sessionSeed}`,
        stage: stageNum,
        skillCategory: 'multiplication',
        question,
        answer: String(ans),
        options: buildOptions(ans, idx + stageNum + sessionSeed * 11).map(String),
        readKr,
        isMissingNumber: true,
        missingPosition: missingFirst ? 'first' : 'second',
        multiplicationQuestion: { a, b, isMissingFactor: true },
      });
    } else {
      items.push({
        id: `math_mul_s${stageNum}_p${idx + 1}_${sessionSeed}`,
        stage: stageNum,
        skillCategory: 'multiplication',
        question: `${a} × ${b}`,
        answer: String(product),
        options: buildMultiplicationOptions(a, b, product, idx + stageNum + sessionSeed * 13),
        readKr: `${readSino(a)} 곱하기 ${readSino(b)}`,
        multiplicationQuestion: { a, b },
      });
    }
  }

  if (includeWordCount > 0) {
    items.push(
      ...generateMultiplicationWordProblems(stageNum, minDan, maxDan, includeWordCount, name, sessionSeed)
    );
  }
  return items;
};

interface UnitProblemSpec {
  kind: 'length' | 'volume';
  question: string;
  readKr: string;
  answer: number;
  distractors: number[];
  conversionGuide: string;
}

const generateUnitProblemPool = (rng: () => number, childName: string): UnitProblemSpec[] => {
  const siwooGa = formatNameWithParticle(childName, '이가');
  const cmVal = randInt(rng, 2, 9);
  const mmSmall = randInt(rng, 1, 9);
  const mVal = randInt(rng, 1, 4);
  const cmPart = randInt(rng, 10, 85);
  const lVal = randInt(rng, 2, 8);
  const dlPart = randInt(rng, 1, 9);
  const dlRound = randInt(rng, 2, 9) * 10;

  return [
    {
      kind: 'length',
      question: `${cmVal} cm = □ mm`,
      readKr: `${readSino(cmVal)} 센티미터는 몇 밀리미터일까요?`,
      answer: cmVal * 10,
      distractors: [cmVal, cmVal * 100, cmVal + 10],
      conversionGuide: '📏 1 cm = 10 mm! cm를 mm로 바꿀 땐 10배(0을 하나 붙이기) 해요!',
    },
    {
      kind: 'length',
      question: `${cmVal} cm ${mmSmall} mm = □ mm`,
      readKr: `${readSino(cmVal)} 센티미터 ${readSino(mmSmall)} 밀리미터는 모두 몇 밀리미터일까요?`,
      answer: cmVal * 10 + mmSmall,
      distractors: [cmVal + mmSmall, cmVal * 100 + mmSmall, mmSmall * 10 + cmVal],
      conversionGuide: `📏 ${cmVal} cm는 ${cmVal * 10} mm예요! 여기에 ${mmSmall} mm를 더하면 돼요!`,
    },
    {
      kind: 'length',
      question: `${cmVal * 10} mm = □ cm`,
      readKr: `${readSino(cmVal * 10)} 밀리미터는 몇 센티미터일까요?`,
      answer: cmVal,
      distractors: [cmVal * 10, cmVal * 100, cmVal + 1],
      conversionGuide: '📏 10 mm = 1 cm! mm를 cm로 바꿀 땐 끝의 0을 하나 떼어내요!',
    },
    {
      kind: 'length',
      question: `${mVal} m = □ cm`,
      readKr: `${readSino(mVal)} 미터는 몇 센티미터일까요?`,
      answer: mVal * 100,
      distractors: [mVal * 10, mVal, mVal * 100 + 10],
      conversionGuide: '📏 1 m = 100 cm! m를 cm로 바꿀 땐 100배(0을 두 개 붙이기) 해요!',
    },
    {
      kind: 'length',
      question: `${mVal} m ${cmPart} cm = □ cm`,
      readKr: `${readSino(mVal)} 미터 ${readSino(cmPart)} 센티미터는 모두 몇 센티미터일까요?`,
      answer: mVal * 100 + cmPart,
      distractors: [mVal * 10 + cmPart, mVal + cmPart, mVal * 100 + cmPart + 10],
      conversionGuide: `📏 ${mVal} m는 ${mVal * 100} cm예요! ${mVal * 100} + ${cmPart}을 계산해 보세요!`,
    },
    {
      kind: 'volume',
      question: `${lVal} L = □ dL`,
      readKr: `${readSino(lVal)} 리터는 몇 데시리터일까요?`,
      answer: lVal * 10,
      distractors: [lVal, lVal * 100, lVal + 10],
      conversionGuide: '🥛 1 L = 10 dL! L를 dL로 바꿀 땐 10배(0을 하나 붙이기) 해요!',
    },
    {
      kind: 'volume',
      question: `${lVal} L ${dlPart} dL = □ dL`,
      readKr: `${readSino(lVal)} 리터 ${readSino(dlPart)} 데시리터는 모두 몇 데시리터일까요?`,
      answer: lVal * 10 + dlPart,
      distractors: [lVal + dlPart, lVal * 100 + dlPart, dlPart * 10 + lVal],
      conversionGuide: `🥛 ${lVal} L는 ${lVal * 10} dL예요! 여기에 ${dlPart} dL를 더하면 돼요!`,
    },
    {
      kind: 'volume',
      question: `${dlRound} dL = □ L`,
      readKr: `${readSino(dlRound)} 데시리터는 몇 리터일까요?`,
      answer: dlRound / 10,
      distractors: [dlRound, dlRound * 10, dlRound / 10 + 1],
      conversionGuide: '🥛 10 dL = 1 L! dL를 L로 바꿀 땐 0을 하나 떼어내요!',
    },
    {
      kind: 'volume',
      question: `${siwooGa} 물통에 물 ${lVal} L를 담았습니다. 1 dL 컵으로 모두 몇 컵을 채울 수 있을까요?`,
      readKr: `${siwooGa} 물통에 물 ${readSino(lVal)} 리터를 담았습니다. 1 데시리터 컵으로 모두 몇 컵을 채울 수 있을까요?`,
      answer: lVal * 10,
      distractors: [lVal, lVal * 100, lVal + 10],
      conversionGuide: `🥛 1 L는 1 dL 컵 10개 분량(1 L = 10 dL)이에요!`,
    },
    {
      kind: 'length',
      question: `고질라의 등 지느러미 길이는 ${cmVal} cm ${mmSmall} mm입니다. 모두 몇 mm일까요?`,
      readKr: `고질라의 등 지느러미 길이는 ${readSino(cmVal)} 센티미터 ${readSino(mmSmall)} 밀리미터입니다. 모두 몇 밀리미터일까요?`,
      answer: cmVal * 10 + mmSmall,
      distractors: [cmVal + mmSmall, cmVal * 100 + mmSmall, cmVal * 10],
      conversionGuide: `📏 1 cm = 10 mm이므로 ${cmVal} cm = ${cmVal * 10} mm예요!`,
    },
  ];
};

export const generateUnitConversionProblems = (
  stageNum: number,
  count = 8,
  customChildName?: string,
  sessionSeed = 0,
  includeWordCount = 0
): MathProblemItem[] => {
  const name = customChildName || getChildName();
  const rng = makeRng(stageNum * 6553 + sessionSeed * 7919 + 29);
  const pool = generateUnitProblemPool(rng, name);
  const calcPool = pool.slice(0, 8);
  const wordPool = pool.slice(8);

  const shuffledCalc = shuffle(calcPool);
  const items: MathProblemItem[] = [];

  for (let i = 0; i < count; i++) {
    const spec = shuffledCalc[i % shuffledCalc.length];
    const uniqueOpts = Array.from(new Set([spec.answer, ...spec.distractors])).slice(0, 4);
    while (uniqueOpts.length < 4) {
      uniqueOpts.push(spec.answer + uniqueOpts.length * 5);
    }
    const opts = shuffle(uniqueOpts).map(String);
    items.push({
      id: `math_unit_s${stageNum}_p${i + 1}_${sessionSeed}`,
      stage: stageNum,
      skillCategory: 'units',
      question: spec.question,
      answer: String(spec.answer),
      options: opts,
      readKr: spec.readKr,
      isMissingNumber: true,
      unitQuestion: {
        kind: spec.kind,
        conversionGuide: spec.conversionGuide,
      },
    });
  }

  for (let i = 0; i < includeWordCount; i++) {
    const spec = wordPool[i % wordPool.length];
    const uniqueOpts = Array.from(new Set([spec.answer, ...spec.distractors])).slice(0, 4);
    const opts = shuffle(uniqueOpts).map(String);
    items.push({
      id: `math_unit_word_s${stageNum}_${i + 1}_${sessionSeed}`,
      stage: stageNum,
      skillCategory: 'units',
      isWordProblem: true,
      question: spec.question,
      problemText: spec.question,
      answer: String(spec.answer),
      options: opts,
      readKr: spec.readKr,
      unitQuestion: {
        kind: spec.kind,
        conversionGuide: spec.conversionGuide,
      },
    });
  }

  return items;
};

/**
 * 특정 스테이지(1~16)에 해당하는 10개 수학 문제를 반환합니다.
 * - sessionSeed: 게임 재시작, 재도전 또는 세션 변경 시 새로운 수식을 생성하도록 시드 오프셋 지원
 * - STAGE 1~10: 두 자리 수 덧셈·뺄셈 + 4번/8번 시계 폭탄 + 9~10번 서술형
 * - STAGE 11~12: 10문제 전체 서술형 문장제
 * - STAGE 13: 구구단 기초 (2~5단 곱셈 + 빈칸 + 서술형 2문제)
 * - STAGE 14: 구구단 심화 (6~9단 곱셈 + 빈칸 + 서술형 2문제)
 * - STAGE 15: 길이·들이 단위 변환 (cm/mm, m/cm, L/dL + 서술형 2문제)
 * - STAGE 16: 초2 2학기 종합 마스터 (구구단 + 단위 변환 + 시계 + 서술형)
 */
export const getMathProblemsForStage = (
  stageNum: number,
  customChildName?: string,
  sessionSeed = 0
): MathProblemItem[] => {
  const normalizedStage = ((stageNum - 1) % TOTAL_MATH_STAGES) + 1;
  const name = customChildName || getChildName();

  // 11, 12 스테이지: 10문제 전체 서술형 랜덤 출제
  if (normalizedStage === 11 || normalizedStage === 12) {
    return generateRandomWordProblems(normalizedStage, PROBLEMS_PER_MATH_STAGE, 1, name);
  }

  // 13 스테이지: 구구단 기초 (2~5단)
  if (normalizedStage === 13) {
    return generateMultiplicationProblems(13, 2, 5, 8, name, sessionSeed, 2);
  }

  // 14 스테이지: 구구단 심화 (6~9단)
  if (normalizedStage === 14) {
    return generateMultiplicationProblems(14, 6, 9, 8, name, sessionSeed, 2);
  }

  // 15 스테이지: 길이·들이 단위 변환
  if (normalizedStage === 15) {
    return generateUnitConversionProblems(15, 8, name, sessionSeed, 2);
  }

  // 16 스테이지: 2학년 2학기 종합 마스터 (구구단 4문제 + 단위 변환 3문제 + 시계 1문제 + 서술형 2문제)
  if (normalizedStage === 16) {
    const muls = generateMultiplicationProblems(16, 2, 9, 4, name, sessionSeed, 0);
    const units = generateUnitConversionProblems(16, 3, name, sessionSeed, 0);
    const clock = generateClockProblem(16, 8, sessionSeed, 'elapsed');
    const mulWord = generateMultiplicationWordProblems(16, 3, 9, 1, name, sessionSeed);
    const unitWord = generateUnitConversionProblems(16, 0, name, sessionSeed, 1);
    return [...muls, ...units, clock, ...mulWord, ...unitWord];
  }

  // 1~10 스테이지: 1~8번 계산 수식 문제 + 4번/8번 라운드 시계 폭탄 문제 결합
  const config = getStageMakerConfig(normalizedStage);
  const baseCalcs = generateStage(
    normalizedStage,
    config.maker,
    8,
    config.onlyKind,
    sessionSeed
  );
  // 4번 라운드(index 3): 아날로그 시계 바늘 읽기
  baseCalcs[3] = generateClockProblem(normalizedStage, 4, sessionSeed, 'read');
  // 8번 라운드(index 7): 몇 분 후 시간 계산
  baseCalcs[7] = generateClockProblem(normalizedStage, 8, sessionSeed, 'elapsed');

  const wordProblems = generateRandomWordProblems(normalizedStage, 2, 9, name);

  return [...baseCalcs, ...wordProblems];
};

/**
 * 특정 산수 연산/학습 영역(MathSkillCategory)에 맞춘 집중 훈련 문제 생성기
 */
export const generateProblemsForSkillCategory = (
  category: MathSkillCategory,
  count = 1,
  customChildName?: string,
  sessionSeed = 0
): MathProblemItem[] => {
  const name = customChildName || getChildName();
  const safeCount = Math.max(1, count);

  if (category === 'word_problem') {
    return generateRandomWordProblems(11 + (sessionSeed % 2), safeCount, 1, name).map((item, idx) => ({
      ...item,
      id: `math_weak_word_${sessionSeed}_${idx + 1}_${Date.now()}`,
    }));
  }

  if (category === 'clock') {
    return Array.from({ length: safeCount }, (_, idx) => {
      const mode = idx % 2 === 0 ? 'read' : 'elapsed';
      const problem = generateClockProblem(5 + (idx % 6), idx + 1, sessionSeed + idx, mode);
      return {
        ...problem,
        id: `math_weak_clock_${sessionSeed}_${idx + 1}`,
      };
    });
  }

  if (category === 'missing_number') {
    const rng = makeRng(7001 + sessionSeed * 9973);
    const seen = new Set<string>();
    const items: MathProblemItem[] = [];
    const maker = alternate(addCarry, subBorrow);
    let guard = 0;
    while (items.length < safeCount && guard < 1000) {
      guard += 1;
      const base = maker(rng);
      if (base.answer < 0 || base.answer > 100) continue;
      const missing = makeMissingNumberSpec(base, items.length % 2 === 0);
      if (seen.has(missing.question)) continue;
      seen.add(missing.question);
      const idx = items.length;
      items.push({
        id: `math_weak_missing_${sessionSeed}_${idx + 1}`,
        stage: 6,
        question: missing.question,
        answer: String(missing.answer),
        options: buildOptions(missing.answer, idx + sessionSeed * 17, missing).map(String),
        readKr: missing.readKr,
        hintFormula: missing.hintFormula,
        isMissingNumber: true,
        missingPosition: missing.missingPosition,
      });
    }
    return items;
  }

  if (category === 'multiplication') {
    return generateMultiplicationProblems(14, 2, 9, safeCount, name, sessionSeed, 0).map(
      (item, idx) => ({
        ...item,
        id: `math_weak_mul_${sessionSeed}_${idx + 1}`,
      })
    );
  }

  if (category === 'units') {
    return generateUnitConversionProblems(15, safeCount, name, sessionSeed, 0).map(
      (item, idx) => ({
        ...item,
        id: `math_weak_unit_${sessionSeed}_${idx + 1}`,
      })
    );
  }

  const makerMap: Record<
    Exclude<MathSkillCategory, 'word_problem' | 'clock' | 'missing_number' | 'multiplication' | 'units'>,
    { stage: number; maker: SpecMaker; onlyKind?: 'add' | 'sub' }
  > = {
    add_basic: { stage: 1, maker: addNoCarry, onlyKind: 'add' },
    sub_basic: { stage: 2, maker: subNoBorrow, onlyKind: 'sub' },
    add_carry: { stage: 4, maker: addCarry, onlyKind: 'add' },
    sub_borrow: { stage: 5, maker: subBorrow, onlyKind: 'sub' },
    three_numbers: { stage: 8, maker: alternate(tripleAdd, tripleMixed) },
  };

  const cfg = makerMap[category];
  const rng = makeRng(cfg.stage * 7919 + 31 + sessionSeed * 9973);
  const seen = new Set<string>();
  const items: MathProblemItem[] = [];
  let guard = 0;
  while (items.length < safeCount && guard < 1500) {
    guard += 1;
    const spec = cfg.maker(rng);
    if (cfg.onlyKind === 'add' && !spec.question.includes('+')) continue;
    if (cfg.onlyKind === 'sub' && !spec.question.includes('-')) continue;
    if (spec.answer < 0 || spec.answer > 100) continue;
    if (seen.has(spec.question)) continue;
    seen.add(spec.question);
    const idx = items.length;
    items.push({
      id: `math_weak_${category}_${sessionSeed}_${idx + 1}`,
      stage: cfg.stage,
      question: spec.question,
      answer: String(spec.answer),
      options: buildOptions(spec.answer, idx + cfg.stage + sessionSeed * 19, spec).map(String),
      readKr: spec.readKr,
      hintFormula: spec.hintFormula,
    });
  }
  return items;
};

/**
 * 수 모형 힌트를 위한 연산식(피연산자와 연산자) 추출 함수
 * - hintFormula가 명시되어 있으면 그대로 반환
 * - 수식 텍스트 또는 서술형 지문 속 숫자와 정답을 분석하여 연산식 완벽 추론
 */
export const getProblemHintFormula = (item: MathProblemItem): MathHintFormula | null => {
  if (item.hintFormula) return item.hintFormula;

  const ans = typeof item.answer === 'number' ? item.answer : parseInt(item.answer, 10);

  // 1) 수식 문제에서 파싱 (예: "28 + 15", "12 + 8 + 15")
  const q = (item.question || '').trim();
  const tripleMatch = q.match(/^(\d+)\s*([+-])\s*(\d+)\s*([+-])\s*(\d+)$/);
  if (tripleMatch) {
    return {
      a: parseInt(tripleMatch[1], 10),
      op: tripleMatch[2] as '+' | '-',
      b: parseInt(tripleMatch[3], 10),
      op2: tripleMatch[4] as '+' | '-',
      c: parseInt(tripleMatch[5], 10),
    };
  }
  const doubleMatch = q.match(/^(\d+)\s*([+-])\s*(\d+)$/);
  if (doubleMatch) {
    return {
      a: parseInt(doubleMatch[1], 10),
      op: doubleMatch[2] as '+' | '-',
      b: parseInt(doubleMatch[3], 10),
    };
  }

  // 2) 서술형 지문에서 숫자들 추출하여 정답과 대조해 연산 추론
  const text = item.problemText || item.question || '';
  const numbers = (text.match(/\d+/g) || []).map((n) => parseInt(n, 10));

  if (numbers.length >= 3) {
    const [a, b, c] = numbers;
    if (a + b + c === ans) return { a, op: '+', b, op2: '+', c };
    if (a - b + c === ans) return { a, op: '-', b, op2: '+', c };
    if (a + b - c === ans) return { a, op: '+', b, op2: '-', c };
    if (a - b - c === ans) return { a, op: '-', b, op2: '-', c };
  }

  if (numbers.length >= 2) {
    const [a, b] = numbers;
    if (a + b === ans) return { a, op: '+', b };
    if (a - b === ans) return { a, op: '-', b };
    if (b - a === ans) return { a: b, op: '-', b: a };
  }

  return null;
};

/**
 * 산수 오답 및 운석 피격 시 아이에게 직관적인 실마리를 주는 '1초 연산 풀이 팁'
 * - 아이가 선택한 오답(selectedWrongChoice)을 역추적(Error Taxonomy)하여 맞춤형 코칭 제공
 * - 초등 2학년 눈높이 맞춤: 시계 읽기/시간 계산(정답 스포일러 방지), 받아올림, 받아내림 역산, 부호 착각, 자리 전치, 문장제 핵심 원리 요약
 */
export const getMathQuickTip = (
  item: MathProblemItem,
  selectedWrongChoice?: string | number
): string => {
  if (!item) return '일의 자리부터 차근차근 묶음과 낱개로 계산해 보세요!';

  // 0-A. 구구단(곱셈) 문제 팁
  if (item.multiplicationQuestion) {
    const { a, b, isMissingFactor } = item.multiplicationQuestion;
    if (isMissingFactor) {
      return `✖️ ${a}단 또는 ${b}단 구구단에서 ${a * b}가 나오는 짝을 찾아보세요! (${a} × ${b} = ${a * b})`;
    }
    return `✖️ ${a}씩 ${b}묶음이에요! ${a}단 구구단을 외우거나 ${a}를 ${b}번 뛰어 세어 보세요!`;
  }

  // 0-B. 길이·들이 단위 변환 팁
  if (item.unitQuestion) {
    return item.unitQuestion.conversionGuide;
  }

  // 0. 아날로그 시계 시한폭탄 문제 (정답 직접 노출 스포일러 제거 -> 원리 기반 비계 힌트)
  if (item.clockQuestion) {
    const { hour, minute, deltaMinutes, targetHour } = item.clockQuestion;
    const minNum = minute === 0 ? 12 : minute / 5;
    if (deltaMinutes && deltaMinutes > 0) {
      const dLabel = deltaMinutes === 60 ? '1시간(60분)' : `${deltaMinutes}분`;
      const carryHint =
        minute + deltaMinutes >= 60
          ? `분침이 12(60분)를 넘어가면 시침도 [${hour}시]에서 [${targetHour}시]로 1시간 올라가요!`
          : `시는 [${hour}시] 그대로 두고, [${minute}분]에 [${deltaMinutes}분]만 더해 보세요!`;
      return `지금 시계는 [${hour}시 ${minute === 0 ? '정각' : `${minute}분`}]! 여기서 ${dLabel}이 지나면? 👉 ${carryHint}`;
    }
    const nextHour = hour === 12 ? 1 : hour + 1;
    return `짧은 시침이 [${hour}]와 [${nextHour}] 사이에 있으면 [${hour}시]예요! 긴 분침이 가리키는 숫자 [${minNum}]에 5를 곱해 분(5×${minNum})을 읽어 보세요!`;
  }

  const formula = getProblemHintFormula(item);
  const ansNum = typeof item.answer === 'number' ? item.answer : parseInt(String(item.answer), 10);
  const chosenNum =
    selectedWrongChoice !== undefined ? parseInt(String(selectedWrongChoice), 10) : NaN;

  // 0-1. 아이가 선택한 오답(selectedWrongChoice) 역추적 진단 (Error Taxonomy)
  if (!isNaN(chosenNum) && !isNaN(ansNum) && chosenNum !== ansNum) {
    if (formula && !formula.op2 && !item.isMissingNumber) {
      const { a, op, b } = formula;
      const aO = a % 10;
      const bO = b % 10;

      // (1) 덧셈·뺄셈 부호 착각 실수
      if (op === '-' && chosenNum === a + b) {
        return `앗, 부호 함정! 더하기(+)가 아니라 빼기(-) 문제예요! ${a}에서 ${b}만큼 덜어내 볼까요?`;
      }
      if (op === '+' && a >= b && chosenNum === a - b) {
        return `앗, 부호 함정! 빼기(-)가 아니라 더하기(+) 문제예요! ${a}와 ${b}를 합쳐 볼까요?`;
      }

      // (2) 받아내림 역산 실수 (초등 2학년 최다 빈출: 작은 수에서 큰 수를 못 빼서 거꾸로 뺀 경우)
      if (op === '-' && aO < bO) {
        const noBorrowReverse = Math.floor(a / 10 - b / 10) * 10 + (bO - aO);
        if (chosenNum === noBorrowReverse) {
          return `앗! 일의 자리 ${aO}에서 ${bO}를 거꾸로(${bO}-${aO}=${bO - aO}) 빼면 안 돼요! 십의 자리에서 10을 빌려와 (10+${aO})-${bO}=${10 + aO - bO}을 계산해요!`;
        }
        // (3) 받아내림 후 십의 자리를 1 줄이지 않은 실수 (+10)
        if (chosenNum === ansNum + 10) {
          return `일의 자리에 10을 빌려주었으니, 십의 자리 숫자는 1 작아져야(-10) 해요!`;
        }
      }

      // (4) 받아올림 누락 실수 (-10)
      if (op === '+' && aO + bO >= 10 && chosenNum === ansNum - 10) {
        return `일의 자리 ${aO}+${bO}=${aO + bO}에서 새로 만들어진 10묶음 1개를 십의 자리에 꼭 더해줘야(+10) 해요!`;
      }

      // (5) 받아올림이 없는데 10을 더한 실수 (+10)
      if (op === '+' && aO + bO < 10 && chosenNum === ansNum + 10) {
        return `일의 자리 합(${aO}+${bO}=${aO + bO})이 10보다 작아서 받아올림이 없어요! 십의 자리만 다시 더해 볼까요?`;
      }
    }

    // (6) 십의 자리와 일의 자리 숫자 전치 실수 (예: 42 ↔ 24)
    if (ansNum >= 12 && ansNum <= 98) {
      const ansTens = Math.floor(ansNum / 10);
      const ansOnes = ansNum % 10;
      if (ansTens !== ansOnes && chosenNum === ansOnes * 10 + ansTens) {
        return `앗! 십의 자리 숫자와 일의 자리 숫자가 거꾸로 바뀌었어요! 자리를 바꿔서 다시 찾아볼까요?`;
      }
    }

    // (7) 일의 자리 근접 계산 착오 (±1 ~ ±2)
    const diff = Math.abs(chosenNum - ansNum);
    if (diff >= 1 && diff <= 2) {
      return `정말 아까워요! 정답과 딱 ${diff}만큼만 차이 나요! 일의 자리 계산을 한 번만 다시 확인해 보세요!`;
    }
  }

  // 1. 빈칸 채우기 (거꾸로 셈: □)
  if (item.isMissingNumber && formula) {
    const relationMsg = item.question.includes('+')
      ? '덧셈의 반대는 뺄셈!'
      : item.missingPosition === 'first'
      ? '뺄셈의 반대는 덧셈!'
      : '어떤 수를 뺐을까요?';
    return `${relationMsg} □ = ${formula.a} ${formula.op} ${formula.b}를 계산해 보세요!`;
  }

  // 2. 서술형 (문장제) 문제
  if (item.isWordProblem && formula) {
    if (formula.op === '-') {
      return `'남은 것'이나 '차이'를 구할 땐 뺄셈(-)이에요! (${formula.a} - ${formula.b})`;
    }
    if (formula.op === '+') {
      return `'모두'나 '전체'를 구할 땐 덧셈(+)이에요! (${formula.a} + ${formula.b})`;
    }
  }

  if (formula) {
    const { a, op, b, op2, c } = formula;

    // 3. 세 수의 덧셈·뺄셈
    if (op2 && typeof c === 'number') {
      const step1 = op === '+' ? a + b : a - b;
      return `앞의 두 수 먼저! ${a} ${op} ${b} = ${step1} 👉 그다음 ${step1} ${op2} ${c}`;
    }

    // 4. 두 수의 덧셈
    if (op === '+') {
      const aO = a % 10;
      const bO = b % 10;
      const sumO = aO + bO;
      if (sumO >= 10) {
        return `일의 자리 ${aO} + ${bO} = ${sumO}! 일의 자리에 ${sumO % 10}을 쓰고, 10은 십의 자리로 쏙 올라가요(+1)!`;
      }
      return `일의 자리는 일의 자리끼리 (${aO}+${bO}=${sumO}), 십의 자리는 십의 자리끼리 더해요!`;
    }

    // 5. 두 수의 뺄셈
    if (op === '-') {
      const aO = a % 10;
      const bO = b % 10;
      if (aO < bO) {
        const diffO = 10 + aO - bO;
        return `${aO}에서 ${bO}를 못 빼요! 십의 자리에서 10을 빌려와서 (10+${aO}) - ${bO} = ${diffO}!`;
      }
      return `일의 자리는 일의 자리끼리 (${aO}-${bO}=${aO - bO}), 십의 자리는 십의 자리끼리 빼요!`;
    }
  }

  return '일의 자리부터 차근차근 묶음과 낱개로 계산해 보세요!';
};

