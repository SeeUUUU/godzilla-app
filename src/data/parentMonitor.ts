import { auth, savePlayerDataToFirestore } from '../firebase';
import { getTodayDateStr } from '../hooks/useAttendance';

// ───────────────────────────────────────────────────────────
// 학부모 원격 모니터링 데이터 (email / lastActiveAt / wrongAnswers / studyLogs)
//  - 학생 기기: localStorage 에 누적 → Firestore players/{uid} 문서에 merge 저장
//  - 학부모 관리자 페이지: 위 필드를 읽기 전용으로 조회 (필드가 없는 기존 문서도 fallback 처리)
// ───────────────────────────────────────────────────────────

export const PARENT_ADMIN_EMAIL = 's9230179@gmail.com';
export const CHILD_ACCOUNT_EMAIL = 'kim.yh.premium1@gmail.com';

export const STORAGE_KEY_PARENT_MONITOR = 'godzilla_parent_monitor_v1';

const MAX_WRONG_ANSWERS = 300;
const MAX_STUDY_LOG_DAYS = 90;
const MAX_ACCESS_TIMES_PER_DAY = 30;

export type StudyMode = 'language' | 'math' | 'speed';
export type WrongAnswerType = 'word' | 'math';

export const STUDY_MODES: StudyMode[] = ['language', 'math', 'speed'];

export const STUDY_MODE_LABELS: Record<StudyMode, string> = {
  language: '🦖 언어 배틀',
  math: '☄️ 산수 요격',
  speed: '⚡ 번개 퀴즈',
};

export interface WrongAnswerRecord {
  id: string;
  type: WrongAnswerType;
  question: string;
  correctAnswer: string;
  selectedWrongAnswer: string;
  /** 0 = 스테이지 구분 없음(번개 퀴즈 등) */
  stage: number;
  wrongCount: number;
  /** Unix timestamp (ms) */
  lastWrongAt: number;
}

export interface StudyModeStat {
  solved: number;
  correct: number;
  wrong: number;
}

export interface StudyLogEntry {
  date: string; // 'YYYY-MM-DD'
  accessCount: number;
  solved: number;
  correct: number;
  wrong: number;
  modes: Record<StudyMode, StudyModeStat>;
  /** 접속 시각 목록 (Unix ms, 오래된 순) */
  accessTimes: number[];
  lastActiveAt: number;
}

export interface ParentMonitorData {
  lastActiveAt: number;
  wrongAnswers: Record<string, WrongAnswerRecord>;
  studyLogs: Record<string, StudyLogEntry>;
}

export interface WrongAnswerInput {
  id: string | number;
  type: WrongAnswerType;
  question: string;
  correctAnswer: string;
  selectedWrongAnswer?: string;
  stage?: number;
}

// ─────────────────────────────────────────────
// 안전 변환 유틸 (Firestore Timestamp / ISO 문자열 / 숫자 모두 허용)
// ─────────────────────────────────────────────
export const toMillis = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const t = Date.parse(value);
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof value === 'object') {
    const v = value as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
    if (typeof v.toMillis === 'function') {
      try {
        return v.toMillis();
      } catch {
        return 0;
      }
    }
    if (typeof v.seconds === 'number') {
      return v.seconds * 1000 + Math.floor((v.nanoseconds ?? 0) / 1e6);
    }
  }
  return 0;
};

const toCount = (v: unknown): number => Math.max(0, Math.floor(Number(v) || 0));
const toText = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

/** Firestore 맵 키로 안전하게 사용할 수 있는 문자열로 변환 */
const toSafeKey = (raw: string): string => raw.replace(/[^\w:\-가-힣]/g, '_').slice(0, 120) || '_';

export const createEmptyModeStats = (): Record<StudyMode, StudyModeStat> => ({
  language: { solved: 0, correct: 0, wrong: 0 },
  math: { solved: 0, correct: 0, wrong: 0 },
  speed: { solved: 0, correct: 0, wrong: 0 },
});

export const createEmptyParentMonitor = (): ParentMonitorData => ({
  lastActiveAt: 0,
  wrongAnswers: {},
  studyLogs: {},
});

const normalizeModeStats = (raw: unknown): Record<StudyMode, StudyModeStat> => {
  const base = createEmptyModeStats();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, unknown>;
  for (const mode of STUDY_MODES) {
    const s = obj[mode];
    if (s && typeof s === 'object') {
      const st = s as Partial<StudyModeStat>;
      base[mode] = { solved: toCount(st.solved), correct: toCount(st.correct), wrong: toCount(st.wrong) };
    }
  }
  return base;
};

export const normalizeWrongAnswer = (key: string, raw: unknown): WrongAnswerRecord | null => {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const wrongCount = toCount(r.wrongCount);
  if (wrongCount <= 0) return null;
  return {
    id: toText(r.id) || key,
    type: r.type === 'math' ? 'math' : 'word',
    question: toText(r.question),
    correctAnswer: toText(r.correctAnswer),
    selectedWrongAnswer: toText(r.selectedWrongAnswer),
    stage: toCount(r.stage),
    wrongCount,
    lastWrongAt: toMillis(r.lastWrongAt),
  };
};

/** wrongAnswers 가 배열 또는 맵 어느 형태로 저장되어 있어도 맵으로 정규화 */
export const normalizeWrongAnswers = (raw: unknown): Record<string, WrongAnswerRecord> => {
  const result: Record<string, WrongAnswerRecord> = {};
  if (!raw || typeof raw !== 'object') return result;
  const entries: Array<[string, unknown]> = Array.isArray(raw)
    ? raw.map((item, idx) => [toText((item as { id?: unknown } | null)?.id) || String(idx), item])
    : Object.entries(raw as Record<string, unknown>);
  for (const [key, value] of entries) {
    const rec = normalizeWrongAnswer(key, value);
    if (rec) result[toSafeKey(rec.id)] = { ...rec, id: toSafeKey(rec.id) };
  }
  return result;
};

export const normalizeStudyLogEntry = (date: string, raw: unknown): StudyLogEntry | null => {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const accessTimes = Array.isArray(r.accessTimes)
    ? r.accessTimes.map(toMillis).filter((t) => t > 0).sort((a, b) => a - b).slice(-MAX_ACCESS_TIMES_PER_DAY)
    : [];
  return {
    date,
    accessCount: toCount(r.accessCount),
    solved: toCount(r.solved),
    correct: toCount(r.correct),
    wrong: toCount(r.wrong),
    modes: normalizeModeStats(r.modes),
    accessTimes,
    lastActiveAt: toMillis(r.lastActiveAt),
  };
};

export const normalizeStudyLogs = (raw: unknown): Record<string, StudyLogEntry> => {
  const result: Record<string, StudyLogEntry> = {};
  if (!raw || typeof raw !== 'object') return result;
  for (const [date, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const entry = normalizeStudyLogEntry(date, value);
    if (entry) result[date] = entry;
  }
  return result;
};

export const normalizeParentMonitor = (raw: unknown): ParentMonitorData => {
  if (!raw || typeof raw !== 'object') return createEmptyParentMonitor();
  const r = raw as Record<string, unknown>;
  return {
    lastActiveAt: toMillis(r.lastActiveAt),
    wrongAnswers: normalizeWrongAnswers(r.wrongAnswers),
    studyLogs: normalizeStudyLogs(r.studyLogs),
  };
};

const trimMonitor = (data: ParentMonitorData): ParentMonitorData => {
  // 오답: 틀린 횟수/최근 순으로 상위 N개만 유지 (Firestore 문서 용량 보호)
  const wrongEntries = Object.entries(data.wrongAnswers);
  if (wrongEntries.length > MAX_WRONG_ANSWERS) {
    wrongEntries.sort(
      (a, b) => b[1].wrongCount - a[1].wrongCount || b[1].lastWrongAt - a[1].lastWrongAt
    );
    data.wrongAnswers = Object.fromEntries(wrongEntries.slice(0, MAX_WRONG_ANSWERS));
  }
  // 일자별 기록: 최근 N일만 유지
  const dates = Object.keys(data.studyLogs).sort();
  if (dates.length > MAX_STUDY_LOG_DAYS) {
    for (const d of dates.slice(0, dates.length - MAX_STUDY_LOG_DAYS)) {
      delete data.studyLogs[d];
    }
  }
  return data;
};

// ─────────────────────────────────────────────
// 병합 (기기 간 동기화 시 값이 줄어들지 않도록 최댓값 기준)
// ─────────────────────────────────────────────
export const mergeParentMonitor = (
  local: ParentMonitorData,
  remoteRaw: unknown
): ParentMonitorData => {
  if (!remoteRaw || typeof remoteRaw !== 'object') return local;
  const remote = normalizeParentMonitor(remoteRaw);
  const merged = createEmptyParentMonitor();
  merged.lastActiveAt = Math.max(local.lastActiveAt, remote.lastActiveAt);

  const wrongKeys = new Set([...Object.keys(local.wrongAnswers), ...Object.keys(remote.wrongAnswers)]);
  for (const key of wrongKeys) {
    const l = local.wrongAnswers[key];
    const r = remote.wrongAnswers[key];
    if (l && r) {
      const latest = l.lastWrongAt >= r.lastWrongAt ? l : r;
      merged.wrongAnswers[key] = {
        ...latest,
        wrongCount: Math.max(l.wrongCount, r.wrongCount),
        lastWrongAt: Math.max(l.lastWrongAt, r.lastWrongAt),
      };
    } else {
      merged.wrongAnswers[key] = (l || r) as WrongAnswerRecord;
    }
  }

  const dates = new Set([...Object.keys(local.studyLogs), ...Object.keys(remote.studyLogs)]);
  for (const date of dates) {
    const l = local.studyLogs[date];
    const r = remote.studyLogs[date];
    if (l && r) {
      const modes = createEmptyModeStats();
      for (const mode of STUDY_MODES) {
        modes[mode] = {
          solved: Math.max(l.modes[mode].solved, r.modes[mode].solved),
          correct: Math.max(l.modes[mode].correct, r.modes[mode].correct),
          wrong: Math.max(l.modes[mode].wrong, r.modes[mode].wrong),
        };
      }
      merged.studyLogs[date] = {
        date,
        accessCount: Math.max(l.accessCount, r.accessCount),
        solved: Math.max(l.solved, r.solved),
        correct: Math.max(l.correct, r.correct),
        wrong: Math.max(l.wrong, r.wrong),
        modes,
        accessTimes: Array.from(new Set([...l.accessTimes, ...r.accessTimes]))
          .sort((a, b) => a - b)
          .slice(-MAX_ACCESS_TIMES_PER_DAY),
        lastActiveAt: Math.max(l.lastActiveAt, r.lastActiveAt),
      };
    } else {
      merged.studyLogs[date] = (l || r) as StudyLogEntry;
    }
  }

  return trimMonitor(merged);
};

// ─────────────────────────────────────────────
// 로컬 저장소
// ─────────────────────────────────────────────
export const loadParentMonitor = (): ParentMonitorData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PARENT_MONITOR);
    if (saved) return normalizeParentMonitor(JSON.parse(saved));
  } catch (e) {
    console.warn('Failed to load parent monitor data:', e);
  }
  return createEmptyParentMonitor();
};

const saveParentMonitorLocal = (data: ParentMonitorData): void => {
  try {
    localStorage.setItem(STORAGE_KEY_PARENT_MONITOR, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save parent monitor data:', e);
  }
};

// ─────────────────────────────────────────────
// Firestore 동기화 (짧은 디바운스로 쓰기 횟수 절감)
// ─────────────────────────────────────────────
let syncTimer: number | null = null;

/** 즉시 Firestore 에 email / lastActiveAt / wrongAnswers / studyLogs 저장 */
export const flushParentMonitorToFirestore = (): void => {
  if (syncTimer !== null) {
    window.clearTimeout(syncTimer);
    syncTimer = null;
  }
  const user = auth.currentUser;
  if (!user || user.isAnonymous) return;
  const data = loadParentMonitor();
  const email = user.email ? user.email.trim().toLowerCase() : '';
  void savePlayerDataToFirestore({
    ...(email ? { email } : {}),
    lastActiveAt: data.lastActiveAt || Date.now(),
    wrongAnswers: data.wrongAnswers,
    studyLogs: data.studyLogs,
  });
};

const scheduleSync = (delayMs = 800): void => {
  if (typeof window === 'undefined') return;
  if (syncTimer !== null) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(flushParentMonitorToFirestore, delayMs);
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && syncTimer !== null) {
      flushParentMonitorToFirestore();
    }
  });
}

/** 원격 문서의 모니터링 필드를 로컬에 병합 (로그인 직후 1회, Firestore 재저장 없음) */
export const applyRemoteParentMonitor = (remote: {
  lastActiveAt?: unknown;
  wrongAnswers?: unknown;
  studyLogs?: unknown;
}): void => {
  const merged = mergeParentMonitor(loadParentMonitor(), remote);
  saveParentMonitorLocal(merged);
};

// ─────────────────────────────────────────────
// 기록 API
// ─────────────────────────────────────────────
const ensureTodayLog = (data: ParentMonitorData, now: number): StudyLogEntry => {
  const today = getTodayDateStr();
  if (!data.studyLogs[today]) {
    data.studyLogs[today] = {
      date: today,
      accessCount: 0,
      solved: 0,
      correct: 0,
      wrong: 0,
      modes: createEmptyModeStats(),
      accessTimes: [],
      lastActiveAt: now,
    };
  }
  return data.studyLogs[today];
};

let accessRecordedInThisSession = false;

/** 앱 접속 1회 기록 (세션당 1번): 접속 횟수 +1, 접속 시각, lastActiveAt, email 갱신 */
export const recordAppAccess = (): void => {
  if (accessRecordedInThisSession) return;
  accessRecordedInThisSession = true;
  const now = Date.now();
  const data = loadParentMonitor();
  const log = ensureTodayLog(data, now);
  log.accessCount += 1;
  log.accessTimes = [...log.accessTimes, now].slice(-MAX_ACCESS_TIMES_PER_DAY);
  log.lastActiveAt = now;
  data.lastActiveAt = now;
  saveParentMonitorLocal(trimMonitor(data));
  flushParentMonitorToFirestore();
};

/** 로그아웃 후 재로그인 시 다시 접속 1회로 기록할 수 있도록 세션 플래그 초기화 */
export const resetAppAccessSession = (): void => {
  accessRecordedInThisSession = false;
};

/**
 * 문제 풀이 1건 기록 (정답/오답 공통)
 *  - studyLogs: 오늘 날짜의 푼 문제/정답/오답 + 모드별 합계
 *  - wrongAnswers: 오답일 때 동일 문제는 wrongCount +1, lastWrongAt 갱신
 *  - lastActiveAt 갱신
 */
export const recordStudyAttempt = (params: {
  mode: StudyMode;
  isCorrect: boolean;
  wrong?: WrongAnswerInput;
}): void => {
  const { mode, isCorrect, wrong } = params;
  const now = Date.now();
  const data = loadParentMonitor();
  const log = ensureTodayLog(data, now);

  log.solved += 1;
  log.modes[mode].solved += 1;
  if (isCorrect) {
    log.correct += 1;
    log.modes[mode].correct += 1;
  } else {
    log.wrong += 1;
    log.modes[mode].wrong += 1;
  }
  log.lastActiveAt = now;
  data.lastActiveAt = now;

  if (!isCorrect && wrong) {
    const key = toSafeKey(`${wrong.type}:${wrong.id}`);
    const prev = data.wrongAnswers[key];
    const selected = toText(wrong.selectedWrongAnswer);
    data.wrongAnswers[key] = {
      id: key,
      type: wrong.type,
      question: toText(wrong.question),
      correctAnswer: toText(wrong.correctAnswer),
      selectedWrongAnswer: selected || prev?.selectedWrongAnswer || '',
      stage: toCount(wrong.stage ?? prev?.stage ?? 0),
      wrongCount: (prev?.wrongCount ?? 0) + 1,
      lastWrongAt: now,
    };
  }

  saveParentMonitorLocal(trimMonitor(data));
  scheduleSync();
};
