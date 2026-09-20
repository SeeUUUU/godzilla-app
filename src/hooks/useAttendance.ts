import { useState, useCallback, useMemo } from 'react';
import {
  hasClaimedWeeklyReward as checkClaimedWeeklyReward,
  markWeeklyRewardClaimed as saveWeeklyRewardClaimed,
  resetWeeklyRewardClaimed as clearWeeklyRewardClaimed,
} from '../data/gachaRewards';
import { savePlayerDataToFirestore } from '../firebase';

export const STORAGE_KEY_ATTENDANCE = 'godzilla_attendance_records';

export const setStoredAttendanceRecords = (records: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save attendance records:', e);
  }
};

export interface AttendanceDayInfo {
  dateStr: string;
  dayName: '월' | '화' | '수' | '목' | '금' | '토' | '일';
  month: number;
  day: number;
  isToday: boolean;
  isAttended: boolean;
  isFuture: boolean;
  isPast: boolean;
}

// 오늘 날짜 문자열 ('YYYY-MM-DD')
export const getTodayDateStr = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// 날짜 객체를 'YYYY-MM-DD'로 변환
export const formatDateToStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// 어제 날짜 문자열
const getYesterdayDateStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateToStr(d);
};

// 이전 날짜 ('YYYY-MM-DD') 계산
const getPrevDateStr = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return formatDateToStr(date);
};

// 연속 출석 일수 (현재 스트릭) 계산
export const calculateCurrentStreak = (records: string[]): number => {
  if (!records || records.length === 0) return 0;
  const set = new Set(records);
  const today = getTodayDateStr();
  const yesterday = getYesterdayDateStr();

  // 오늘 이미 출석했으면 오늘부터 카운트, 아직 안 했으면 어제부터 이어지는지 확인
  let checkDate = set.has(today) ? today : set.has(yesterday) ? yesterday : null;
  if (!checkDate) return 0;

  let streak = 0;
  while (set.has(checkDate)) {
    streak += 1;
    checkDate = getPrevDateStr(checkDate);
  }
  return streak;
};

// 역대 최장 연속 출석 일수 (Max Streak) 계산
export const calculateMaxStreak = (records: string[]): number => {
  if (!records || records.length === 0) return 0;
  const uniqueSorted = Array.from(new Set(records)).sort();
  if (uniqueSorted.length === 0) return 0;

  let max = 1;
  let current = 1;

  for (let i = 1; i < uniqueSorted.length; i++) {
    const prev = uniqueSorted[i - 1];
    const curr = uniqueSorted[i];

    const [py, pm, pd] = prev.split('-').map(Number);
    const expectedNext = new Date(py, pm - 1, pd);
    expectedNext.setDate(expectedNext.getDate() + 1);
    const expectedStr = formatDateToStr(expectedNext);

    if (curr === expectedStr) {
      current += 1;
      if (current > max) max = current;
    } else {
      current = 1;
    }
  }

  return max;
};

// 이번 주 월~일 7개 날짜 문자열 ('YYYY-MM-DD') 반환
export const getThisWeekDates = (): string[] => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return formatDateToStr(d);
  });
};

// 이번 주 월~일 7개 날짜 정보 생성
export const getThisWeekDays = (records: string[]): AttendanceDayInfo[] => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0(일) ~ 6(토)
  // 월요일 인덱스 (월=0, 화=1, ... 일=6)
  const mondayOffset = (dayOfWeek + 6) % 7;

  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const todayStr = getTodayDateStr();
  const recordSet = new Set(records);
  const dayNames: ('월' | '화' | '수' | '목' | '금' | '토' | '일')[] = [
    '월',
    '화',
    '수',
    '목',
    '금',
    '토',
    '일',
  ];

  return Array.from({ length: 7 }).map((_, i) => {
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + i);

    const dateStr = formatDateToStr(targetDate);
    const isToday = dateStr === todayStr;
    const isAttended = recordSet.has(dateStr);
    const isFuture = dateStr > todayStr;
    const isPast = dateStr < todayStr;

    return {
      dateStr,
      dayName: dayNames[i],
      month: targetDate.getMonth() + 1,
      day: targetDate.getDate(),
      isToday,
      isAttended,
      isFuture,
      isPast,
    };
  });
};

export const useAttendance = () => {
  const [records, setRecords] = useState<string[]>(() => {
    const weekDates = getThisWeekDates();
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // 출석 7일 달성 테스트를 위해 이번 주 7일 강제 포함
          const merged = Array.from(new Set([...parsed, ...weekDates]));
          try {
            localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(merged));
          } catch {}
          return merged;
        }
      }
    } catch (e) {
      console.error('Failed to load attendance records:', e);
    }
    try {
      localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(weekDates));
    } catch {}
    return weekDates;
  });

  const todayStr = getTodayDateStr();
  const isTodayAttended = useMemo(() => records.includes(todayStr), [records, todayStr]);
  const currentStreak = useMemo(() => calculateCurrentStreak(records), [records]);
  const maxStreak = useMemo(() => calculateMaxStreak(records), [records]);
  const weekDays = useMemo(() => getThisWeekDays(records), [records]);
  const weekAttendedCount = useMemo(
    () => weekDays.filter((d) => d.isAttended).length,
    [weekDays]
  );

  // 이번 주 럭키 알 수령 상태 관리
  const [hasClaimedWeeklyReward, setHasClaimedWeeklyReward] = useState<boolean>(() =>
    checkClaimedWeeklyReward()
  );

  const claimWeeklyReward = useCallback(() => {
    saveWeeklyRewardClaimed();
    setHasClaimedWeeklyReward(true);
  }, []);

  const resetWeeklyReward = useCallback(() => {
    clearWeeklyRewardClaimed();
    setHasClaimedWeeklyReward(false);
  }, []);

  // 오늘 출석 체크 실행 함수
  const checkTodayAttendance = useCallback((): {
    isNewlyAttended: boolean;
    streak: number;
  } => {
    const today = getTodayDateStr();
    if (records.includes(today)) {
      return { isNewlyAttended: false, streak: calculateCurrentStreak(records) };
    }

    const updated = [...records, today];
    setRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save attendance record:', e);
    }

    const nextStreak = calculateCurrentStreak(updated);
    savePlayerDataToFirestore({ attendanceRecords: updated });
    return { isNewlyAttended: true, streak: nextStreak };
  }, [records]);

  // 테스트용: 이번 주 7일 출석 강제 완료
  const forceFillWeekAttendance = useCallback(() => {
    const weekDates = getThisWeekDates();
    const updated = Array.from(new Set([...records, ...weekDates]));
    setRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to force fill attendance:', e);
    }
    savePlayerDataToFirestore({ attendanceRecords: updated });
    return updated;
  }, [records]);

  return {
    records,
    setRecords,
    isTodayAttended,
    currentStreak,
    maxStreak,
    weekDays,
    weekAttendedCount,
    checkTodayAttendance,
    forceFillWeekAttendance,
    hasClaimedWeeklyReward,
    setHasClaimedWeeklyReward,
    claimWeeklyReward,
    resetWeeklyReward,
  };
};
