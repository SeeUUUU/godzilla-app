import type {
  DailyLearningStat,
  LearningAnalyticsData,
  MathProblemItem,
  MathSkillCategory,
  SkillStat,
} from '../types';
import { getProblemHintFormula } from './mathData';
import { savePlayerDataToFirestore } from '../firebase';
import { getTodayDateStr } from '../hooks/useAttendance';

export const STORAGE_KEY_LEARNING_ANALYTICS = 'godzilla_learning_analytics_v1';

export const MATH_SKILL_CATEGORIES: MathSkillCategory[] = [
  'add_basic',
  'sub_basic',
  'add_carry',
  'sub_borrow',
  'three_numbers',
  'missing_number',
  'clock',
  'word_problem',
];

export const MATH_SKILL_LABELS: Record<MathSkillCategory, { label: string; icon: string }> = {
  add_basic: { label: '받아올림 없는 덧셈', icon: '➕' },
  sub_basic: { label: '받아내림 없는 뺄셈', icon: '➖' },
  add_carry: { label: '받아올림 있는 덧셈', icon: '🔥' },
  sub_borrow: { label: '받아내림 있는 뺄셈', icon: '⚡' },
  three_numbers: { label: '세 수의 연속 연산', icon: '🔢' },
  missing_number: { label: '빈칸(□) 거꾸로 셈', icon: '🔍' },
  clock: { label: '시계 읽기·시간 계산', icon: '🕰️' },
  word_problem: { label: '서술형(문장제) 사고력', icon: '📖' },
};

export const createDefaultAnalytics = (): LearningAnalyticsData => {
  const mathSkillStats = {} as Record<MathSkillCategory, SkillStat>;
  for (const cat of MATH_SKILL_CATEGORIES) {
    mathSkillStats[cat] = { attempts: 0, correct: 0 };
  }
  return {
    dailyStats: {},
    mathSkillStats,
    wordErrorCounts: {},
    weeklyCouponLimitMinutes: 60, // 기본 권장: 주 60분
  };
};

export const normalizeLearningAnalytics = (raw: unknown): LearningAnalyticsData => {
  const base = createDefaultAnalytics();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Partial<LearningAnalyticsData>;

  if (obj.dailyStats && typeof obj.dailyStats === 'object') {
    for (const [date, stat] of Object.entries(obj.dailyStats)) {
      if (stat && typeof stat === 'object') {
        base.dailyStats[date] = {
          date,
          studySeconds: Math.max(0, Number(stat.studySeconds) || 0),
          langCorrect: Math.max(0, Number(stat.langCorrect) || 0),
          langWrong: Math.max(0, Number(stat.langWrong) || 0),
          mathCorrect: Math.max(0, Number(stat.mathCorrect) || 0),
          mathWrong: Math.max(0, Number(stat.mathWrong) || 0),
        };
      }
    }
  }

  if (obj.mathSkillStats && typeof obj.mathSkillStats === 'object') {
    for (const cat of MATH_SKILL_CATEGORIES) {
      const s = obj.mathSkillStats[cat];
      if (s && typeof s === 'object') {
        base.mathSkillStats[cat] = {
          attempts: Math.max(0, Number(s.attempts) || 0),
          correct: Math.max(0, Number(s.correct) || 0),
        };
      }
    }
  }

  if (obj.wordErrorCounts && typeof obj.wordErrorCounts === 'object') {
    for (const [id, count] of Object.entries(obj.wordErrorCounts)) {
      const num = Math.max(0, Number(count) || 0);
      if (num > 0) {
        base.wordErrorCounts[String(id)] = num;
      }
    }
  }

  if (typeof obj.weeklyCouponLimitMinutes === 'number' && !isNaN(obj.weeklyCouponLimitMinutes)) {
    base.weeklyCouponLimitMinutes = Math.max(0, Math.floor(obj.weeklyCouponLimitMinutes));
  }

  return base;
};

export const loadLearningAnalytics = (): LearningAnalyticsData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LEARNING_ANALYTICS);
    if (saved) {
      return normalizeLearningAnalytics(JSON.parse(saved));
    }
  } catch (e) {
    console.warn('Failed to load learning analytics:', e);
  }
  return createDefaultAnalytics();
};

export const saveLearningAnalytics = (
  data: LearningAnalyticsData,
  syncFirestore = true
): void => {
  try {
    localStorage.setItem(STORAGE_KEY_LEARNING_ANALYTICS, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save learning analytics:', e);
  }
  if (syncFirestore) {
    savePlayerDataToFirestore({ learningAnalytics: data });
  }
};

export const mergeLearningAnalytics = (
  local: LearningAnalyticsData,
  remote?: LearningAnalyticsData
): LearningAnalyticsData => {
  if (!remote) return local;
  const rNorm = normalizeLearningAnalytics(remote);
  const merged = createDefaultAnalytics();

  // 1. 일별 통계 병합 (최근 30일 유지, 각 필드 최댓값)
  const allDates = Array.from(
    new Set([...Object.keys(local.dailyStats), ...Object.keys(rNorm.dailyStats)])
  )
    .sort()
    .slice(-30);

  for (const date of allDates) {
    const lStat = local.dailyStats[date];
    const rStat = rNorm.dailyStats[date];
    merged.dailyStats[date] = {
      date,
      studySeconds: Math.max(lStat?.studySeconds ?? 0, rStat?.studySeconds ?? 0),
      langCorrect: Math.max(lStat?.langCorrect ?? 0, rStat?.langCorrect ?? 0),
      langWrong: Math.max(lStat?.langWrong ?? 0, rStat?.langWrong ?? 0),
      mathCorrect: Math.max(lStat?.mathCorrect ?? 0, rStat?.mathCorrect ?? 0),
      mathWrong: Math.max(lStat?.mathWrong ?? 0, rStat?.mathWrong ?? 0),
    };
  }

  // 2. 산수 연산 유형별 통계 병합
  for (const cat of MATH_SKILL_CATEGORIES) {
    const lSkill = local.mathSkillStats[cat];
    const rSkill = rNorm.mathSkillStats[cat];
    merged.mathSkillStats[cat] = {
      attempts: Math.max(lSkill?.attempts ?? 0, rSkill?.attempts ?? 0),
      correct: Math.max(lSkill?.correct ?? 0, rSkill?.correct ?? 0),
    };
  }

  // 3. 단어 오답 횟수 병합
  const allWordIds = new Set([
    ...Object.keys(local.wordErrorCounts),
    ...Object.keys(rNorm.wordErrorCounts),
  ]);
  for (const id of allWordIds) {
    merged.wordErrorCounts[id] = Math.max(
      local.wordErrorCounts[id] ?? 0,
      rNorm.wordErrorCounts[id] ?? 0
    );
  }

  // 4. 주간 쿠폰 상한선: 원격 값이 명시되어 있으면 원격 우선, 아니면 로컬 유지
  merged.weeklyCouponLimitMinutes =
    typeof remote.weeklyCouponLimitMinutes === 'number'
      ? rNorm.weeklyCouponLimitMinutes
      : local.weeklyCouponLimitMinutes;

  return merged;
};

/**
 * 산수 문제를 8대 핵심 연산 유형으로 자동 분류
 */
export const classifyMathProblem = (problem: MathProblemItem): MathSkillCategory => {
  if (problem.clockQuestion) return 'clock';
  if (problem.isWordProblem) return 'word_problem';
  if (problem.isMissingNumber) return 'missing_number';

  const formula = getProblemHintFormula(problem);
  if (!formula) return 'add_basic';

  if (formula.c !== undefined && formula.op2) {
    return 'three_numbers';
  }

  const onesA = formula.a % 10;
  const onesB = formula.b % 10;

  if (formula.op === '+') {
    return onesA + onesB >= 10 ? 'add_carry' : 'add_basic';
  } else {
    return onesA < onesB ? 'sub_borrow' : 'sub_basic';
  }
};

const ensureTodayStat = (data: LearningAnalyticsData, today = getTodayDateStr()): DailyLearningStat => {
  if (!data.dailyStats[today]) {
    data.dailyStats[today] = {
      date: today,
      studySeconds: 0,
      langCorrect: 0,
      langWrong: 0,
      mathCorrect: 0,
      mathWrong: 0,
    };
  }
  return data.dailyStats[today];
};

/**
 * 일일 활성 학습 시간(초) 누적 기록
 */
export const addDailyStudySeconds = (seconds: number, syncFirestore = false): LearningAnalyticsData => {
  const data = loadLearningAnalytics();
  const todayStat = ensureTodayStat(data);
  todayStat.studySeconds = Math.max(0, todayStat.studySeconds + seconds);
  saveLearningAnalytics(data, syncFirestore);
  return data;
};

/**
 * 3개 국어 매칭 정답/오답 기록 및 단어별 누적 오답 횟수 카운트
 */
export const recordLanguageAttempt = (
  isCorrect: boolean,
  failedWordId?: string | number
): LearningAnalyticsData => {
  const data = loadLearningAnalytics();
  const todayStat = ensureTodayStat(data);
  if (isCorrect) {
    todayStat.langCorrect += 1;
  } else {
    todayStat.langWrong += 1;
    if (failedWordId !== undefined && failedWordId !== null) {
      const key = String(failedWordId);
      data.wordErrorCounts[key] = (data.wordErrorCounts[key] || 0) + 1;
    }
  }
  saveLearningAnalytics(data, true);
  return data;
};

/**
 * 산수 디펜스 정답/오답 기록 및 연산 유형별 성취도 카운트
 */
export const recordMathAttempt = (
  problem: MathProblemItem,
  isCorrect: boolean
): LearningAnalyticsData => {
  const data = loadLearningAnalytics();
  const todayStat = ensureTodayStat(data);
  if (isCorrect) {
    todayStat.mathCorrect += 1;
  } else {
    todayStat.mathWrong += 1;
  }

  const category = classifyMathProblem(problem);
  const stat = data.mathSkillStats[category] || { attempts: 0, correct: 0 };
  stat.attempts += 1;
  if (isCorrect) {
    stat.correct += 1;
  }
  data.mathSkillStats[category] = stat;

  saveLearningAnalytics(data, true);
  return data;
};

/**
 * 주간 미디어 쿠폰 상한선(분) 업데이트 (0 = 무제한)
 */
export const setWeeklyCouponLimitMinutes = (limitMinutes: number): LearningAnalyticsData => {
  const data = loadLearningAnalytics();
  data.weeklyCouponLimitMinutes = Math.max(0, Math.floor(limitMinutes));
  saveLearningAnalytics(data, true);
  return data;
};
