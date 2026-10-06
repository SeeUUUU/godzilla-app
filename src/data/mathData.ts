import type { MathProblemItem, MathHintFormula } from '../types';

// =================================================================
// 초등 2학년 덧셈·뺄셈 전용 데이터셋 (총 120문제, 12스테이지) - 곱셈 없음
// =================================================================
//   STAGE 1~3   : 두 자리 수 ± 두 자리 수 (받아올림/내림 없음)
//   STAGE 4~6   : 두 자리 수 ± 두 자리 수 (받아올림/내림 1회)
//   STAGE 7~8   : 세 수의 덧셈과 뺄셈
//   STAGE 9~10  : 100 이하 두 자리 수 종합 덧셈·뺄셈 (혼합)
//   STAGE 11~12 : 서술형(문장제) 문제 - 운석 낙하 없음, 시간제한 없음
// =================================================================

export const TOTAL_MATH_STAGES = 12;
export const PROBLEMS_PER_MATH_STAGE = 10;

// ---------- 유틸 ----------

const DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];

/** 0~100 한자어 수 읽기 (예: 34 → 삼십사) */
const readSino = (n: number): string => {
  if (n === 0) return '영';
  if (n === 100) return '백';
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const tensStr = tens === 0 ? '' : tens === 1 ? '십' : `${DIGITS[tens]}십`;
  return `${tensStr}${DIGITS[ones]}`;
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

/** 정답 + 그럴듯한 오답 3개로 4지선다 구성 (정답 위치는 문제마다 달라짐) */
const buildOptions = (answer: number, index: number): number[] => {
  const candidates = [answer + 1, answer - 1, answer + 10, answer - 10, answer + 2, answer - 2, answer + 9, answer + 11];
  const wrongs: number[] = [];
  for (const c of candidates) {
    if (c >= 0 && c !== answer && !wrongs.includes(c)) wrongs.push(c);
    if (wrongs.length === 3) break;
  }
  const result = [...wrongs];
  result.splice(index % 4, 0, answer);
  return result;
};

interface Spec {
  question: string;
  readKr: string;
  answer: number;
  hintFormula?: MathHintFormula;
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

const generateStage = (stage: number, maker: SpecMaker, count = 8, onlyKind?: 'add' | 'sub'): MathProblemItem[] => {
  const rng = makeRng(stage * 7919 + 13);
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
    items.push({
      id: `math_s${stage}_p${n + 1}`,
      stage,
      question: spec.question,
      answer: String(spec.answer),
      options: buildOptions(spec.answer, n + stage).map(String),
      readKr: spec.readKr,
      hintFormula: spec.hintFormula,
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
    const rawOptions = buildOptions(answer, Math.floor(Math.random() * 4));
    const roundNumber = startRound + idx;
    return {
      id: `math_s${stageNum}_r${roundNumber}_${Date.now()}_${idx + 1}`,
      stage: stageNum,
      isWordProblem: true,
      question: text,
      problemText: text,
      answer,
      options: rawOptions,
      readKr: text,
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

/**
 * 특정 스테이지(1~12)에 해당하는 10개 수학 문제를 반환합니다.
 * - 모든 스테이지(1~12)의 9번, 10번 문제는 서술형 문장제(시간제한 없음)로 랜덤 출제됩니다!
 * - STAGE 11, 12는 10문제 전체가 서술형 문장제로 랜덤 출제됩니다.
 */
export const getMathProblemsForStage = (stageNum: number, customChildName?: string): MathProblemItem[] => {
  const normalizedStage = ((stageNum - 1) % TOTAL_MATH_STAGES) + 1;
  const name = customChildName || getChildName();

  // 11, 12 스테이지: 10문제 전체 서술형 랜덤 출제
  if (normalizedStage === 11 || normalizedStage === 12) {
    return generateRandomWordProblems(normalizedStage, PROBLEMS_PER_MATH_STAGE, 1, name);
  }

  // 1~10 스테이지: 1~8번 계산 수식 문제 + 9~10번(마지막 2문제) 서술형 랜덤 문제
  const baseCalcs = MATH_BASE_PROBLEMS.filter((p) => p.stage === normalizedStage).slice(0, 8);
  const wordProblems = generateRandomWordProblems(normalizedStage, 2, 9, name);

  return [...baseCalcs, ...wordProblems];
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
