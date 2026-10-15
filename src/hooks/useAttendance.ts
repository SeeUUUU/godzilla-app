import { useState, useCallback, useMemo } from 'react';
import type { AttendanceStampSlot } from '../types';
import { savePlayerDataToFirestore } from '../firebase';

export const STORAGE_KEY_ATTENDANCE = 'godzilla_attendance_records';
export const STORAGE_KEY_STAMP_COUNT = 'godzilla_attendance_stamp_count';
export const STORAGE_KEY_CUMULATIVE_DAYS = 'godzilla_cumulative_attendance_days';

// localStorage 헬퍼 함수들
export const setStoredAttendanceRecords = (records: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save attendance records:', e);
  }
};

export const setStoredStampCount = (count: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY_STAMP_COUNT, String(Math.max(0, Math.min(7, count))));
  } catch (e) {
    console.error('Failed to save stamp count:', e);
  }
};

export const setStoredCumulativeDays = (days: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CUMULATIVE_DAYS, String(Math.max(0, days)));
  } catch (e) {
    console.error('Failed to save cumulative attendance days:', e);
  }
};

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

// 7일 누적 순환 스탬프 슬롯 정보 생성 (1일차 ~ 7일차)
export const getAttendanceStampSlots = (stampCount: number): AttendanceStampSlot[] => {
  const normalizedCount = Math.max(0, Math.min(7, stampCount));
  return Array.from({ length: 7 }).map((_, i) => {
    const dayIndex = i + 1;
    const isStamped = normalizedCount >= dayIndex;
    const isCurrentTarget = normalizedCount < 7 && dayIndex === normalizedCount + 1;
    const isRewardSlot = dayIndex === 7;

    return {
      dayIndex,
      label: `${dayIndex}일차`,
      isStamped,
      isCurrentTarget,
      isRewardSlot,
    };
  });
};

// 하위 호환성을 위한 AttendanceDayInfo 타입 정의
export interface AttendanceDayInfo {
  dateStr: string;
  dayName: string;
  month: number;
  day: number;
  isToday: boolean;
  isAttended: boolean;
  isFuture: boolean;
  isPast: boolean;
}

export const useAttendance = () => {
  // 1. 날짜별 출석 기록 목록 ('YYYY-MM-DD')
  const [records, setRecords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const today = getTodayDateStr();
          const cleaned = Array.from(
            new Set(
              parsed.filter(
                (date): date is string =>
                  typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today
              )
            )
          );
          return cleaned;
        }
      }
    } catch (e) {
      console.error('Failed to load attendance records:', e);
    }
    return [];
  });

  // 2. 총 누적 출석일수 (기존 사용자 자동 마이그레이션: records.length)
  const [cumulativeAttendanceDays, setCumulativeAttendanceDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUMULATIVE_DAYS);
      if (saved !== null) {
        const num = Number(saved);
        if (!isNaN(num) && num >= 0) return num;
      }
      // 마이그레이션: 기존 출석 기록 개수로 보존
      const initialCumulative = records.length;
      try {
        localStorage.setItem(STORAGE_KEY_CUMULATIVE_DAYS, String(initialCumulative));
      } catch {}
      return initialCumulative;
    } catch {
      return records.length;
    }
  });

  // 3. 현재 7일 스탬프 판에 찍힌 개수 (0 ~ 7)
  // (기존 사용자 자동 마이그레이션: records.length % 7)
  const [stampCount, setStampCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STAMP_COUNT);
      if (saved !== null) {
        const num = Number(saved);
        if (!isNaN(num) && num >= 0 && num <= 7) return num;
      }
      // 마이그레이션
      const migratedStamps = records.length % 7;
      try {
        localStorage.setItem(STORAGE_KEY_STAMP_COUNT, String(migratedStamps));
      } catch {}
      return migratedStamps;
    } catch {
      return records.length % 7;
    }
  });

  const todayStr = getTodayDateStr();
  const isTodayAttended = useMemo(() => records.includes(todayStr), [records, todayStr]);
  const currentStreak = useMemo(() => calculateCurrentStreak(records), [records]);
  const maxStreak = useMemo(() => calculateMaxStreak(records), [records]);

  // 7일 스탬프 슬롯 배열 (DAY 1 ~ DAY 7)
  const stampSlots = useMemo(() => getAttendanceStampSlots(stampCount), [stampCount]);

  // 하위 호환성: weekDays와 weekAttendedCount
  const weekDays = useMemo<AttendanceDayInfo[]>(() => {
    return stampSlots.map((slot) => ({
      dateStr: `day-${slot.dayIndex}`,
      dayName: slot.label,
      month: 0,
      day: slot.dayIndex,
      isToday: slot.isCurrentTarget,
      isAttended: slot.isStamped,
      isFuture: !slot.isStamped && !slot.isCurrentTarget,
      isPast: slot.isStamped,
    }));
  }, [stampSlots]);

  const weekAttendedCount = stampCount;

  // 7일 순환 스탬프 판 초기화 (0으로 리셋하여 다음 7일 모으기 시작)
  const resetStampCycle = useCallback(() => {
    setStampCount(0);
    setStoredStampCount(0);
    savePlayerDataToFirestore({ stampCount: 0 });
  }, []);

  // 오늘 1회 출석 체크 실행 함수 (누적 7일 스탬프 무한 순환 시스템)
  const checkTodayAttendance = useCallback((): {
    isNewlyAttended: boolean;
    streak: number;
    cumulativeAttendanceDays: number;
    stampCount: number;
    isSevenDaysCompleted: boolean;
    shouldRewardEgg: boolean;
    shouldRewardChest: boolean;
  } => {
    const today = getTodayDateStr();

    // 오늘 이미 출석 체크를 완료한 경우 중복 처리 방지
    if (records.includes(today)) {
      return {
        isNewlyAttended: false,
        streak: calculateCurrentStreak(records),
        cumulativeAttendanceDays,
        stampCount,
        isSevenDaysCompleted: stampCount >= 7,
        shouldRewardEgg: false,
        shouldRewardChest: false,
      };
    }

    const updatedRecords = [...records, today];
    const updatedCumulative = cumulativeAttendanceDays + 1;

    // 만약 이전 스탬프 판이 이미 7개로 완성된 상태였다면 새로운 판(0에서 +1 = 1일차)으로 순환 시작
    const baseStamp = stampCount >= 7 ? 0 : stampCount;
    const nextStampCount = baseStamp + 1;

    // 스탬프가 7개에 도달했는지 판정 (황금 보물상자 지급 조건)
    const isSevenDaysCompleted = nextStampCount === 7;
    const shouldRewardChest = isSevenDaysCompleted;

    setRecords(updatedRecords);
    setCumulativeAttendanceDays(updatedCumulative);
    setStampCount(nextStampCount);

    setStoredAttendanceRecords(updatedRecords);
    setStoredCumulativeDays(updatedCumulative);
    setStoredStampCount(nextStampCount);

    savePlayerDataToFirestore({
      attendanceRecords: updatedRecords,
      cumulativeAttendanceDays: updatedCumulative,
      stampCount: nextStampCount,
    });

    return {
      isNewlyAttended: true,
      streak: calculateCurrentStreak(updatedRecords),
      cumulativeAttendanceDays: updatedCumulative,
      stampCount: nextStampCount,
      isSevenDaysCompleted,
      shouldRewardEgg: true,
      shouldRewardChest,
    };
  }, [records, cumulativeAttendanceDays, stampCount]);

  // 테스트용: 7일 스탬프 강제 완성
  const forceFillSevenStamps = useCallback(() => {
    const nextStamp = 7;
    const nextCumulative = cumulativeAttendanceDays + (7 - stampCount);
    setStampCount(nextStamp);
    setCumulativeAttendanceDays(nextCumulative);
    setStoredStampCount(nextStamp);
    setStoredCumulativeDays(nextCumulative);
    savePlayerDataToFirestore({
      stampCount: nextStamp,
      cumulativeAttendanceDays: nextCumulative,
    });
    return nextStamp;
  }, [cumulativeAttendanceDays, stampCount]);

  // 출석 데이터 전체 초기화 (학부모 관리자 모드용)
  const resetAllAttendance = useCallback(() => {
    setRecords([]);
    setCumulativeAttendanceDays(0);
    setStampCount(0);
    setStoredAttendanceRecords([]);
    setStoredCumulativeDays(0);
    setStoredStampCount(0);
    savePlayerDataToFirestore({
      attendanceRecords: [],
      cumulativeAttendanceDays: 0,
      stampCount: 0,
      weeklyRewardClaimedWeek: null,
    });
  }, []);

  return {
    records,
    setRecords,
    cumulativeAttendanceDays,
    setCumulativeAttendanceDays,
    stampCount,
    setStampCount,
    stampSlots,
    isTodayAttended,
    currentStreak,
    maxStreak,
    checkTodayAttendance,
    resetStampCycle,
    forceFillSevenStamps,
    resetAllAttendance,
    // 하위 호환성 유지용 프로퍼티
    weekDays,
    weekAttendedCount,
    hasClaimedWeeklyReward: stampCount < 7,
    setHasClaimedWeeklyReward: () => {},
    claimWeeklyReward: resetStampCycle,
    resetWeeklyReward: resetStampCycle,
  };
};
