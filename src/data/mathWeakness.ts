import type { LearningAnalyticsData, MathProblemItem, MathSkillCategory } from '../types';
import { generateProblemsForSkillCategory } from './mathData';
import { savePlayerDataToFirestore } from '../firebase';
import { getTodayDateStr } from '../hooks/useAttendance';

export const STORAGE_KEY_WRONG_MATH = 'godzilla_wrong_math_v1';
export const STORAGE_KEY_MATH_WEAKNESS_EGG_DATE = 'godzilla_math_weakness_egg_date_v1';

const MAX_WRONG_MATH_PROBLEMS = 30;
const FALLBACK_DRILL_CATEGORIES: MathSkillCategory[] = [
  'add_carry',
  'sub_borrow',
  'missing_number',
  'clock',
];

export interface WrongMathRecord {
  id: string;
  questionKey: string;
  category: MathSkillCategory;
  problem: MathProblemItem;
  wrongCount: number;
  lastWrongAt: number;
}

export interface MathWeakSkillSummary {
  category: MathSkillCategory;
  attempts: number;
  correct: number;
  accuracy: number;
}

export interface MathWeaknessRoundPlan {
  problems: MathProblemItem[];
  weakestCategory: MathSkillCategory | null;
  storedWrongCount: number;
}

const buildQuestionKey = (problem: MathProblemItem): string => {
  if (problem.clockQuestion) {
    const { hour, minute, deltaMinutes = 0 } = problem.clockQuestion;
    return `clock:${hour}:${minute}:${deltaMinutes}`;
  }
  const text = (problem.problemText || problem.question || '').trim();
  return `${problem.stage}:${text}`;
};

const isValidMathProblem = (raw: unknown): raw is MathProblemItem => {
  if (!raw || typeof raw !== 'object') return false;
  const p = raw as Partial<MathProblemItem>;
  return (
    typeof p.id === 'string' &&
    typeof p.question === 'string' &&
    (typeof p.answer === 'string' || typeof p.answer === 'number') &&
    Array.isArray(p.options) &&
    p.options.length >= 2 &&
    typeof p.readKr === 'string'
  );
};

export const normalizeWrongMathProblems = (raw: unknown): WrongMathRecord[] => {
  if (!Array.isArray(raw)) return [];
  const deduped = new Map<string, WrongMathRecord>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Partial<WrongMathRecord>;
    if (!isValidMathProblem(rec.problem)) continue;
    const questionKey =
      typeof rec.questionKey === 'string' && rec.questionKey
        ? rec.questionKey
        : buildQuestionKey(rec.problem);
    const category = (rec.category as MathSkillCategory) || 'add_basic';
    const wrongCount = Math.max(1, Math.floor(Number(rec.wrongCount) || 1));
    const lastWrongAt = Math.max(0, Number(rec.lastWrongAt) || Date.now());
    const existing = deduped.get(questionKey);
    if (!existing || lastWrongAt > existing.lastWrongAt) {
      deduped.set(questionKey, {
        id: typeof rec.id === 'string' && rec.id ? rec.id : rec.problem.id,
        questionKey,
        category,
        problem: rec.problem,
        wrongCount: existing ? Math.max(existing.wrongCount, wrongCount) : wrongCount,
        lastWrongAt,
      });
    }
  }
  return Array.from(deduped.values())
    .sort((a, b) => b.lastWrongAt - a.lastWrongAt)
    .slice(0, MAX_WRONG_MATH_PROBLEMS);
};

export const loadWrongMathProblems = (): WrongMathRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WRONG_MATH);
    if (saved) {
      return normalizeWrongMathProblems(JSON.parse(saved));
    }
  } catch (e) {
    console.warn('Failed to load wrong math problems:', e);
  }
  return [];
};

export const saveWrongMathProblems = (
  records: WrongMathRecord[],
  syncFirestore = true
): void => {
  const normalized = normalizeWrongMathProblems(records);
  try {
    localStorage.setItem(STORAGE_KEY_WRONG_MATH, JSON.stringify(normalized));
  } catch (e) {
    console.warn('Failed to save wrong math problems:', e);
  }
  if (syncFirestore) {
    void savePlayerDataToFirestore({ wrongMathList: normalized });
  }
};

export const recordWrongMathProblem = (
  problem: MathProblemItem,
  category: MathSkillCategory,
  syncFirestore = true
): WrongMathRecord[] => {
  const list = loadWrongMathProblems();
  const questionKey = buildQuestionKey(problem);
  const now = Date.now();
  const idx = list.findIndex((r) => r.questionKey === questionKey || r.id === problem.id);

  let next: WrongMathRecord[];
  if (idx >= 0) {
    const prev = list[idx];
    const updated: WrongMathRecord = {
      ...prev,
      category,
      problem,
      wrongCount: prev.wrongCount + 1,
      lastWrongAt: now,
    };
    next = [updated, ...list.filter((_, i) => i !== idx)];
  } else {
    next = [
      {
        id: problem.id,
        questionKey,
        category,
        problem,
        wrongCount: 1,
        lastWrongAt: now,
      },
      ...list,
    ];
  }

  const trimmed = next.slice(0, MAX_WRONG_MATH_PROBLEMS);
  saveWrongMathProblems(trimmed, syncFirestore);
  return trimmed;
};

export const resolveWrongMathProblem = (
  problem: MathProblemItem,
  syncFirestore = true
): WrongMathRecord[] => {
  const list = loadWrongMathProblems();
  const questionKey = buildQuestionKey(problem);
  const next = list.filter((r) => r.questionKey !== questionKey && r.id !== problem.id);
  if (next.length !== list.length) {
    saveWrongMathProblems(next, syncFirestore);
  }
  return next;
};

export const mergeWrongMathProblems = (
  local: WrongMathRecord[],
  remote?: unknown
): WrongMathRecord[] => {
  const rNorm = normalizeWrongMathProblems(remote);
  if (rNorm.length === 0) return local;
  const merged = new Map<string, WrongMathRecord>();
  for (const rec of local) {
    merged.set(rec.questionKey, rec);
  }
  for (const rec of rNorm) {
    const prev = merged.get(rec.questionKey);
    if (!prev || rec.lastWrongAt > prev.lastWrongAt) {
      merged.set(rec.questionKey, {
        ...rec,
        wrongCount: prev ? Math.max(prev.wrongCount, rec.wrongCount) : rec.wrongCount,
      });
    }
  }
  return Array.from(merged.values())
    .sort((a, b) => b.lastWrongAt - a.lastWrongAt)
    .slice(0, MAX_WRONG_MATH_PROBLEMS);
};

/**
 * 학습 애널리틱스 기반 가장 취약한 산수 영역 순위 반환
 */
export const getWeakestMathSkills = (
  analytics: LearningAnalyticsData,
  limit = 3
): MathWeakSkillSummary[] => {
  const entries = Object.entries(analytics.mathSkillStats || {}) as Array<
    [MathSkillCategory, { attempts: number; correct: number }]
  >;

  const attempted = entries
    .filter(([, stat]) => stat && stat.attempts > 0)
    .map(([category, stat]) => ({
      category,
      attempts: stat.attempts,
      correct: stat.correct,
      accuracy: Math.round((stat.correct / stat.attempts) * 100),
    }))
    .sort((a, b) => {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return b.attempts - a.attempts;
    });

  return attempted.slice(0, limit);
};

/**
 * 산수 약점 집중 요격(6문제) 라운드 구성:
 * 1) 최근 틀렸던 산수 오답 문제 우선 배치 (최대 4문제)
 * 2) 부족한 슬롯은 가장 정답률이 낮은 취약 영역 신규 생성 문제로 보충
 */
export const buildMathWeaknessRound = (
  analytics: LearningAnalyticsData,
  childName: string,
  sessionSeed = 0,
  count = 6
): MathWeaknessRoundPlan => {
  const storedWrong = loadWrongMathProblems();
  const weakSkills = getWeakestMathSkills(analytics, 3);
  const weakestCategory =
    weakSkills[0]?.category || storedWrong[0]?.category || FALLBACK_DRILL_CATEGORIES[0];

  const prioritizedWrong = [...storedWrong].sort((a, b) => {
    if (b.wrongCount !== a.wrongCount) return b.wrongCount - a.wrongCount;
    return b.lastWrongAt - a.lastWrongAt;
  });

  const selected: MathProblemItem[] = [];
  const usedQuestions = new Set<string>();
  let wordProblemCount = 0;

  for (const rec of prioritizedWrong) {
    if (selected.length >= Math.min(4, count)) break;
    if (rec.problem.isWordProblem && wordProblemCount >= 2) continue;
    const key = buildQuestionKey(rec.problem);
    if (usedQuestions.has(key)) continue;
    usedQuestions.add(key);
    if (rec.problem.isWordProblem) wordProblemCount += 1;
    selected.push(rec.problem);
  }

  const targetCategories: MathSkillCategory[] =
    weakSkills.length > 0
      ? weakSkills.map((s) => s.category)
      : storedWrong.length > 0
      ? Array.from(new Set([...storedWrong.map((w) => w.category), ...FALLBACK_DRILL_CATEGORIES]))
      : FALLBACK_DRILL_CATEGORIES;

  let catCursor = 0;
  let guard = 0;
  while (selected.length < count && guard < 20) {
    guard += 1;
    const cat = targetCategories[catCursor % targetCategories.length];
    catCursor += 1;
    if (cat === 'word_problem' && wordProblemCount >= 2 && targetCategories.length > 1) {
      continue;
    }
    const generated = generateProblemsForSkillCategory(
      cat,
      2,
      childName,
      sessionSeed + guard * 13
    );
    for (const item of generated) {
      if (selected.length >= count) break;
      const key = buildQuestionKey(item);
      if (usedQuestions.has(key)) continue;
      usedQuestions.add(key);
      if (item.isWordProblem) wordProblemCount += 1;
      selected.push(item);
    }
  }

  return {
    problems: selected.slice(0, count),
    weakestCategory,
    storedWrongCount: storedWrong.length,
  };
};

export const hasClaimedDailyMathWeaknessEgg = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY_MATH_WEAKNESS_EGG_DATE) === getTodayDateStr();
  } catch {
    return false;
  }
};

export const markDailyMathWeaknessEggClaimed = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY_MATH_WEAKNESS_EGG_DATE, getTodayDateStr());
  } catch {
    // ignore
  }
};
