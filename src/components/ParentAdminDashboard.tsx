import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, RefreshCw, Copy, Check, AlertTriangle } from 'lucide-react';
import {
  fetchChildPlayerDocsForParent,
  type ParentViewPlayerDoc,
  type PlayerFirestoreData,
} from '../firebase';
import {
  CHILD_ACCOUNT_EMAIL,
  STUDY_MODES,
  STUDY_MODE_LABELS,
  normalizeStudyLogs,
  normalizeWrongAnswers,
  toMillis,
  type StudyLogEntry,
  type WrongAnswerRecord,
} from '../data/parentMonitor';
import { normalizeLearningAnalytics } from '../data/learningAnalytics';
import { DEFAULT_WORDS } from '../data/words';

// ─────────────────────────────────────────────
// 표시용 유틸 (모든 값은 undefined/null/잘못된 타입이어도 안전하게 처리)
// ─────────────────────────────────────────────
const KST = 'Asia/Seoul'; // 한국/일본 시간대 동일 (UTC+9)

const formatKst = (ms: number, withSeconds = true): string => {
  if (!ms || ms <= 0) return '-';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: KST,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(ms));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
    const base = `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
    return withSeconds ? `${base}:${get('second')}` : base;
  } catch {
    return '-';
  }
};

const formatKstTime = (ms: number): string => {
  const full = formatKst(ms, false);
  return full === '-' ? '-' : full.slice(11);
};

const formatRelative = (ms: number, now: number): string => {
  if (!ms || ms <= 0) return '기록 없음';
  const diff = now - ms;
  if (diff < 0) return '방금 전';
  const min = Math.floor(diff / 60000);
  if (min < 2) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
};

const formatFuture = (ms: number, now: number): string => {
  if (!ms || ms <= 0) return '-';
  const diff = ms - now;
  if (diff <= 0) return '복습 시기 도래';
  const hour = Math.floor(diff / 3600000);
  if (hour < 1) return `${Math.max(1, Math.floor(diff / 60000))}분 후`;
  if (hour < 24) return `${hour}시간 후`;
  return `${Math.floor(hour / 24)}일 후`;
};

const percent = (correct: number, total: number): number =>
  total > 0 ? Math.round((correct / total) * 100) : 0;

const toNumber = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
type DashboardTab = 'wrong' | 'daily' | 'vocab';
type WrongFilter = 'all' | 'word' | 'math';

interface DisplayWrongAnswer extends WrongAnswerRecord {
  /** 신규 wrongAnswers 필드가 없던 시절의 오답노트에서 복원한 추정 데이터 */
  isLegacy?: boolean;
}

interface DisplayDailyLog extends StudyLogEntry {
  isLegacy?: boolean;
  studySeconds?: number;
}

interface VocabRow {
  id: string;
  ko: string;
  en: string;
  ja: string;
  lastReviewedAt: number;
  lastReviewedStage: number | null;
  reviewMastery: number;
  nextReviewAt: number;
}

const WORDS_PER_STAGE = 6;

// ─────────────────────────────────────────────
// 데이터 가공 (필드 누락된 기존 문서도 에러 없이 처리)
// ─────────────────────────────────────────────
const buildWrongAnswers = (data: PlayerFirestoreData): DisplayWrongAnswer[] => {
  const map: Record<string, DisplayWrongAnswer> = { ...normalizeWrongAnswers(data.wrongAnswers) };

  // 기존 문서 폴백: wrongWordList + learningAnalytics.wordErrorCounts 로 단어 오답 복원
  const analytics = normalizeLearningAnalytics(data.learningAnalytics);
  const legacyWords = Array.isArray(data.wrongWordList) ? data.wrongWordList : [];
  for (const w of legacyWords) {
    if (!w || w.id === undefined || w.id === null) continue;
    const key = `word:${String(w.id)}`;
    if (map[key]) continue;
    map[key] = {
      id: key,
      type: 'word',
      question: String(w.ko ?? ''),
      correctAnswer: `${w.en ?? ''} / ${w.ja ?? ''}`,
      selectedWrongAnswer: '',
      stage: 0,
      wrongCount: Math.max(1, analytics.wordErrorCounts[String(w.id)] ?? 1),
      lastWrongAt: toMillis(w.lastReviewedAt),
      isLegacy: true,
    };
  }

  return Object.values(map).sort(
    (a, b) => b.wrongCount - a.wrongCount || b.lastWrongAt - a.lastWrongAt
  );
};

const buildDailyLogs = (data: PlayerFirestoreData): DisplayDailyLog[] => {
  const logs = normalizeStudyLogs(data.studyLogs);
  const result: Record<string, DisplayDailyLog> = { ...logs };

  // 기존 문서 폴백: learningAnalytics.dailyStats / attendanceRecords
  const analytics = normalizeLearningAnalytics(data.learningAnalytics);
  for (const [date, stat] of Object.entries(analytics.dailyStats)) {
    if (result[date]) {
      result[date].studySeconds = stat.studySeconds;
      continue;
    }
    const correct = stat.langCorrect + stat.mathCorrect;
    const wrong = stat.langWrong + stat.mathWrong;
    result[date] = {
      date,
      accessCount: 0,
      solved: correct + wrong,
      correct,
      wrong,
      modes: {
        language: { solved: stat.langCorrect + stat.langWrong, correct: stat.langCorrect, wrong: stat.langWrong },
        math: { solved: stat.mathCorrect + stat.mathWrong, correct: stat.mathCorrect, wrong: stat.mathWrong },
        speed: { solved: 0, correct: 0, wrong: 0 },
      },
      accessTimes: [],
      lastActiveAt: 0,
      studySeconds: stat.studySeconds,
      isLegacy: true,
    };
  }
  const attendance = Array.isArray(data.attendanceRecords) ? data.attendanceRecords : [];
  for (const date of attendance) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || result[date]) continue;
    result[date] = {
      date,
      accessCount: 1,
      solved: 0,
      correct: 0,
      wrong: 0,
      modes: {
        language: { solved: 0, correct: 0, wrong: 0 },
        math: { solved: 0, correct: 0, wrong: 0 },
        speed: { solved: 0, correct: 0, wrong: 0 },
      },
      accessTimes: [],
      lastActiveAt: 0,
      isLegacy: true,
    };
  }

  return Object.values(result).sort((a, b) => (a.date < b.date ? 1 : -1));
};

const buildVocabRows = (data: PlayerFirestoreData): VocabRow[] => {
  const list = Array.isArray(data.wrongWordList) ? data.wrongWordList : [];
  return list
    .filter((w) => w && w.id !== undefined && w.id !== null)
    .map((w) => ({
      id: String(w.id),
      ko: String(w.ko ?? ''),
      en: String(w.en ?? ''),
      ja: String(w.ja ?? ''),
      lastReviewedAt: toMillis(w.lastReviewedAt),
      lastReviewedStage:
        typeof w.lastReviewedStage === 'number' && Number.isFinite(w.lastReviewedStage)
          ? w.lastReviewedStage
          : null,
      reviewMastery: Math.max(0, toNumber(w.reviewMastery)),
      nextReviewAt: toMillis(w.nextReviewAt),
    }))
    .sort((a, b) => {
      // 다음 복습 시각이 이른 순 (미설정은 뒤로)
      const an = a.nextReviewAt || Number.MAX_SAFE_INTEGER;
      const bn = b.nextReviewAt || Number.MAX_SAFE_INTEGER;
      return an - bn;
    });
};

const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy copy
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
interface ParentAdminDashboardProps {
  onClose: () => void;
}

export const ParentAdminDashboard: React.FC<ParentAdminDashboardProps> = ({ onClose }) => {
  const [players, setPlayers] = useState<ParentViewPlayerDoc[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [tab, setTab] = useState<DashboardTab>('wrong');
  const [wrongFilter, setWrongFilter] = useState<WrongFilter>('all');
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'fail'>('idle');
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const docs = await fetchChildPlayerDocsForParent(CHILD_ACCOUNT_EMAIL);
      setPlayers(docs);
      setSelectedUid((prev) => (prev && docs.some((d) => d.uid === prev) ? prev : docs[0]?.uid ?? null));
      setFetchedAt(Date.now());
      setNow(Date.now());
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === 'permission-denied') {
        setErrorMessage(
          'Firestore 접근 권한이 없습니다. 수정된 firestore.rules 를 배포했는지(firebase deploy --only firestore:rules)와 학부모 계정(s9230179@gmail.com)으로 로그인했는지 확인해 주세요.'
        );
      } else {
        setErrorMessage(`데이터를 불러오지 못했습니다. (${(error as Error | null)?.message ?? '알 수 없는 오류'})`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 상대 시간(N분 전) 표시 갱신
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const selected = useMemo(
    () => players.find((p) => p.uid === selectedUid) ?? null,
    [players, selectedUid]
  );
  const data = useMemo<PlayerFirestoreData>(() => selected?.data ?? {}, [selected]);

  const wrongAnswers = useMemo(() => buildWrongAnswers(data), [data]);
  const dailyLogs = useMemo(() => buildDailyLogs(data), [data]);
  const vocabRows = useMemo(() => buildVocabRows(data), [data]);

  const summary = useMemo(() => {
    const lastActiveAt = toMillis(data.lastActiveAt) || toMillis(data.updatedAt);
    const level = Math.max(1, toNumber(data.gameState?.level, 1));
    const cycle = Math.max(1, toNumber(data.cycleCount ?? data.gameState?.cycleCount, 1));
    const stageIndex = Math.max(0, toNumber(data.stageIndex));
    const mathStage = Math.max(0, toNumber(data.mathStageIndex ?? data.gameState?.mathStage)) + 1;
    const totalStages = Math.max(1, Math.ceil(DEFAULT_WORDS.length / WORDS_PER_STAGE));
    const studiedWords = ((cycle - 1) * totalStages + stageIndex) * WORDS_PER_STAGE;

    // 전체 정답률: 신규 studyLogs 우선, 없으면 기존 learningAnalytics 로 폴백
    let correct = 0;
    let solved = 0;
    const logs = normalizeStudyLogs(data.studyLogs);
    for (const log of Object.values(logs)) {
      correct += log.correct;
      solved += log.solved;
    }
    let accuracySource = '일자별 기록 기준';
    if (solved === 0) {
      const analytics = normalizeLearningAnalytics(data.learningAnalytics);
      for (const stat of Object.values(analytics.dailyStats)) {
        correct += stat.langCorrect + stat.mathCorrect;
        solved += stat.langCorrect + stat.langWrong + stat.mathCorrect + stat.mathWrong;
      }
      accuracySource = solved > 0 ? '기존 학습 통계 기준' : '아직 기록 없음';
    }

    return {
      lastActiveAt,
      level,
      cycle,
      stageNum: stageIndex + 1,
      mathStage,
      studiedWords,
      totalStages,
      accuracy: percent(correct, solved),
      solved,
      accuracySource,
    };
  }, [data]);

  const filteredWrong = useMemo(
    () => wrongAnswers.filter((w) => wrongFilter === 'all' || w.type === wrongFilter),
    [wrongAnswers, wrongFilter]
  );

  const handleCopyJson = useCallback(async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      targetEmail: data.email ?? CHILD_ACCOUNT_EMAIL,
      targetUid: selected?.uid ?? null,
      totalWrongItems: wrongAnswers.length,
      wrongAnswers: wrongAnswers.map((w) => ({
        id: w.id,
        type: w.type,
        question: w.question,
        correctAnswer: w.correctAnswer,
        selectedWrongAnswer: w.selectedWrongAnswer,
        stage: w.stage,
        wrongCount: w.wrongCount,
        lastWrongAt: w.lastWrongAt ? new Date(w.lastWrongAt).toISOString() : null,
      })),
    };
    const ok = await copyTextToClipboard(JSON.stringify(payload, null, 2));
    setCopyState(ok ? 'done' : 'fail');
    window.setTimeout(() => setCopyState('idle'), 2200);
  }, [data.email, selected?.uid, wrongAnswers]);

  // ESC 로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const tabButton = (id: DashboardTab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-black border transition-all cursor-pointer whitespace-nowrap ${
        tab === id
          ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-400/60'
      }`}
    >
      {label}
    </button>
  );

  const summaryCard = (label: string, value: React.ReactNode, sub?: React.ReactNode) => (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 min-w-0">
      <div className="text-[10px] sm:text-xs font-bold text-slate-400">{label}</div>
      <div className="mt-1 text-base sm:text-xl font-black text-white break-words">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] sm:text-xs text-slate-400">{sub}</div>}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="학부모 관리자 대시보드"
      className="fixed inset-0 z-[9999] bg-slate-950 text-white flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* 헤더 */}
      <div className="flex-none flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 border-b border-slate-800 bg-slate-900/95">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-black text-amber-300 truncate">📊 학부모 관리 대시보드</h2>
          <p className="text-[10px] sm:text-xs text-slate-400 truncate">
            아들 학습 진행 · 오답 내역 원격 모니터링 (읽기 전용)
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void load()}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white text-xs font-black cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>🔄 새로고침</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-3 select-text">
        <div className="max-w-5xl mx-auto flex flex-col gap-3">
          {/* 1) 대상 계정 선택/표시 */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-xs sm:text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-black text-slate-200">👦 대상 계정</span>
            {players.length > 1 ? (
              <select
                value={selectedUid ?? ''}
                onChange={(e) => setSelectedUid(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1 text-xs text-white"
              >
                {players.map((p) => (
                  <option key={p.uid} value={p.uid}>
                    {(p.data.email as string | undefined) || '(이메일 미등록 기존 문서)'} · {p.uid.slice(0, 8)}…
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-white font-bold break-all">
                {selected ? (selected.data.email as string | undefined) || CHILD_ACCOUNT_EMAIL : CHILD_ACCOUNT_EMAIL}
              </span>
            )}
            {selected && (
              <span className="text-[10px] sm:text-xs text-slate-400">
                UID {selected.uid.slice(0, 10)}…{' '}
                {selected.matchedByEmail
                  ? '(이메일로 확인됨)'
                  : '(이메일 필드가 없는 기존 문서 - 아들이 한 번 접속하면 자동으로 이메일이 기록됩니다)'}
              </span>
            )}
            {fetchedAt > 0 && (
              <span className="ml-auto text-[10px] sm:text-xs text-slate-500">
                조회 {formatKst(fetchedAt)}
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-500/60 bg-rose-950/50 p-3 text-xs sm:text-sm text-rose-200 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading && !selected && !errorMessage && (
            <div className="py-16 text-center text-slate-400 text-sm font-bold">불러오는 중...</div>
          )}

          {!isLoading && !errorMessage && !selected && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6 text-center text-sm text-slate-300">
              <p className="font-black text-white mb-1">
                {CHILD_ACCOUNT_EMAIL} 계정의 문서를 찾지 못했습니다.
              </p>
              <p className="text-xs text-slate-400">
                아들이 해당 계정으로 한 번 이상 로그인해야 문서가 생성됩니다. 이미 로그인했다면 새로고침을 눌러 주세요.
              </p>
            </div>
          )}

          {selected && (
            <>
              {/* 2) 상단 요약 카드 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                {summaryCard(
                  '⏱ 마지막 접속',
                  <span className="text-sm sm:text-base">{formatKst(summary.lastActiveAt)}</span>,
                  <span className="font-bold text-amber-300">{formatRelative(summary.lastActiveAt, now)}</span>
                )}
                {summaryCard(
                  '🦖 현재 레벨',
                  `LV.${summary.level}`,
                  `${summary.cycle}회독 · 언어 STAGE ${summary.stageNum} · 산수 STAGE ${summary.mathStage}`
                )}
                {summaryCard(
                  '📚 총 학습 단어 수',
                  `${summary.studiedWords.toLocaleString()}개`,
                  `클리어 스테이지 × ${WORDS_PER_STAGE}단어 기준 추정 (오답노트 ${vocabRows.length}개)`
                )}
                {summaryCard(
                  '🎯 전체 정답률',
                  `${summary.accuracy}%`,
                  `${summary.solved.toLocaleString()}문제 · ${summary.accuracySource}`
                )}
              </div>

              {/* 탭 */}
              <div className="flex flex-wrap gap-2">
                {tabButton('wrong', '🚨 오답 분석 노트 (취약 문제 TOP)')}
                {tabButton('daily', '📅 일자별 접속 & 학습 기록')}
                {tabButton('vocab', '📖 단어장 복습 현황')}
              </div>

              {/* 탭 1: 오답 분석 노트 */}
              {tab === 'wrong' && (
                <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      {(
                        [
                          ['all', '전체'],
                          ['word', '📝 단어'],
                          ['math', '➗ 산수'],
                        ] as Array<[WrongFilter, string]>
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setWrongFilter(id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold border cursor-pointer ${
                            wrongFilter === id
                              ? 'bg-rose-500 text-white border-rose-300'
                              : 'bg-slate-800 text-slate-300 border-slate-600'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                      <span className="text-xs text-slate-400 ml-1">{filteredWrong.length}건</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCopyJson()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer"
                    >
                      {copyState === 'done' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>
                        {copyState === 'done'
                          ? '복사 완료!'
                          : copyState === 'fail'
                          ? '복사 실패 (브라우저 권한 확인)'
                          : '📋 오답 데이터 복사(JSON)'}
                      </span>
                    </button>
                  </div>

                  {filteredWrong.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-400">
                      아직 기록된 오답이 없어요. 👍
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm border-collapse min-w-[640px]">
                        <thead>
                          <tr className="text-left text-slate-400 border-b border-slate-700">
                            <th className="py-1.5 pr-2 w-8">#</th>
                            <th className="py-1.5 pr-2">문제</th>
                            <th className="py-1.5 pr-2">정답</th>
                            <th className="py-1.5 pr-2">고른 오답</th>
                            <th className="py-1.5 pr-2 text-center whitespace-nowrap">틀린 횟수</th>
                            <th className="py-1.5 whitespace-nowrap">마지막 오답</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredWrong.map((w, idx) => (
                            <tr key={w.id} className="border-b border-slate-800 align-top">
                              <td className="py-2 pr-2 text-slate-500 font-bold">{idx + 1}</td>
                              <td className="py-2 pr-2">
                                <span
                                  className={`mr-1 px-1.5 py-0.5 rounded text-[10px] font-black ${
                                    w.type === 'math'
                                      ? 'bg-sky-900 text-sky-200'
                                      : 'bg-emerald-900 text-emerald-200'
                                  }`}
                                >
                                  {w.type === 'math' ? '산수' : '단어'}
                                </span>
                                <span className="font-bold text-white break-words">{w.question || '-'}</span>
                                {w.stage > 0 && (
                                  <span className="ml-1 text-[10px] text-slate-500">STAGE {w.stage}</span>
                                )}
                                {w.isLegacy && (
                                  <span className="ml-1 text-[10px] text-amber-400">(기존 오답노트)</span>
                                )}
                              </td>
                              <td className="py-2 pr-2 text-emerald-300 font-bold break-words">
                                {w.correctAnswer || '-'}
                              </td>
                              <td className="py-2 pr-2 text-rose-300 break-words">
                                {w.selectedWrongAnswer || '-'}
                              </td>
                              <td className="py-2 pr-2 text-center">
                                <span className="inline-block min-w-[2rem] px-2 py-0.5 rounded-full bg-rose-600 text-white font-black">
                                  {w.wrongCount}
                                </span>
                              </td>
                              <td className="py-2 text-slate-300 whitespace-nowrap">
                                {formatKst(w.lastWrongAt, false)}
                                <div className="text-[10px] text-slate-500">
                                  {formatRelative(w.lastWrongAt, now)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {/* 탭 2: 일자별 접속 & 학습 기록 */}
              {tab === 'daily' && (
                <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  {dailyLogs.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-400">
                      아직 기록된 접속/학습 내역이 없어요.
                    </p>
                  ) : (
                    <ol className="relative border-l-2 border-slate-700 ml-2 flex flex-col gap-3">
                      {dailyLogs.map((log) => {
                        const acc = percent(log.correct, log.solved);
                        const playedModes = STUDY_MODES.filter((m) => log.modes[m].solved > 0);
                        return (
                          <li key={log.date} className="ml-4 relative">
                            <span className="absolute -left-[1.4rem] top-1.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-950" />
                            <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="font-black text-amber-300">{log.date}</span>
                                {log.accessCount > 0 && (
                                  <span className="text-xs text-slate-300">접속 {log.accessCount}회</span>
                                )}
                                {log.accessTimes.length > 0 && (
                                  <span className="text-[10px] sm:text-xs text-slate-500">
                                    ({log.accessTimes.map(formatKstTime).join(', ')})
                                  </span>
                                )}
                                {log.isLegacy && (
                                  <span className="text-[10px] text-amber-400">(이전 기록 기반)</span>
                                )}
                              </div>
                              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm">
                                <span>
                                  푼 문제 <b className="text-white">{log.solved}</b>
                                </span>
                                <span>
                                  정답 <b className="text-emerald-300">{log.correct}</b>
                                </span>
                                <span>
                                  오답 <b className="text-rose-300">{log.wrong}</b>
                                </span>
                                <span>
                                  정답률 <b className="text-cyan-300">{log.solved > 0 ? `${acc}%` : '-'}</b>
                                </span>
                                {typeof log.studySeconds === 'number' && log.studySeconds > 0 && (
                                  <span>
                                    학습 시간 <b className="text-white">{Math.round(log.studySeconds / 60)}분</b>
                                  </span>
                                )}
                              </div>
                              {log.solved > 0 && (
                                <div className="mt-2 h-1.5 w-full rounded-full bg-rose-900/70 overflow-hidden">
                                  <div className="h-full bg-emerald-400" style={{ width: `${acc}%` }} />
                                </div>
                              )}
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {playedModes.length === 0 ? (
                                  <span className="text-[11px] text-slate-500">플레이한 모드 기록 없음</span>
                                ) : (
                                  playedModes.map((m) => (
                                    <span
                                      key={m}
                                      className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-[11px] text-slate-200"
                                    >
                                      {STUDY_MODE_LABELS[m]} · {log.modes[m].correct}/{log.modes[m].solved}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </section>
              )}

              {/* 탭 3: 단어장 복습 현황 */}
              {tab === 'vocab' && (
                <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  {vocabRows.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-400">
                      복습 대기 중인 단어가 없어요. 🎉
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm border-collapse min-w-[640px]">
                        <thead>
                          <tr className="text-left text-slate-400 border-b border-slate-700">
                            <th className="py-1.5 pr-2">단어 (한 / 영 / 일)</th>
                            <th className="py-1.5 pr-2 whitespace-nowrap">마지막 복습</th>
                            <th className="py-1.5 pr-2 text-center whitespace-nowrap">복습 스테이지</th>
                            <th className="py-1.5 pr-2 text-center whitespace-nowrap">복습 숙련도</th>
                            <th className="py-1.5 whitespace-nowrap">다음 복습 예정</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vocabRows.map((row) => {
                            const due = row.nextReviewAt > 0 && row.nextReviewAt <= now;
                            return (
                              <tr key={row.id} className="border-b border-slate-800 align-top">
                                <td className="py-2 pr-2 font-bold text-white break-words">
                                  {row.ko || '-'} / {row.en || '-'} / {row.ja || '-'}
                                </td>
                                <td className="py-2 pr-2 text-slate-300 whitespace-nowrap">
                                  {formatKst(row.lastReviewedAt, false)}
                                  <div className="text-[10px] text-slate-500">
                                    {formatRelative(row.lastReviewedAt, now)}
                                  </div>
                                </td>
                                <td className="py-2 pr-2 text-center text-slate-300">
                                  {row.lastReviewedStage !== null ? `STAGE ${row.lastReviewedStage}` : '-'}
                                </td>
                                <td className="py-2 pr-2 text-center whitespace-nowrap">
                                  <span className="text-amber-300">
                                    {'★'.repeat(Math.min(3, row.reviewMastery))}
                                    {'☆'.repeat(Math.max(0, 3 - Math.min(3, row.reviewMastery)))}
                                  </span>
                                  <span className="ml-1 text-[10px] text-slate-500">({row.reviewMastery}/3)</span>
                                </td>
                                <td className="py-2 text-slate-300 whitespace-nowrap">
                                  {formatKst(row.nextReviewAt, false)}
                                  <div
                                    className={`text-[10px] ${
                                      due ? 'text-rose-300 font-bold' : 'text-slate-500'
                                    }`}
                                  >
                                    {formatFuture(row.nextReviewAt, now)}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
