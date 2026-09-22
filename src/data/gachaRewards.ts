import { savePlayerDataToFirestore } from '../firebase';

// 게임 보너스 시간 쿠폰 가챠 보상 테이블 (가중치 기반 확률 시스템)

export type GachaRewardRarity = 'legendary' | 'special' | 'regular' | 'basic' | 'miss';

export interface GachaReward {
  id: GachaRewardRarity;
  label: string;         // 예: '30분 보너스'
  minutes: number;       // 보너스 시간 (분). 0 = 꽝
  emoji: string;
  description: string;
  color: string;         // 테마 컬러
  bgGradient: string;   // 카드 배경 그라데이션
  borderColor: string;
  shadowColor: string;
  badgeLabel: string;
  weight: number;        // 가중치 (합계 100)
  bonusExp: number;      // 꽝 위로 EXP
}

export const GACHA_REWARDS: GachaReward[] = [
  {
    id: 'legendary',
    label: '30분 게임 & 유튜브 보너스 쿠폰',
    minutes: 30,
    emoji: '👑',
    description: '대박! 게임 또는 유튜브를 30분 더 즐길 수 있는 최고 보상 쿠폰 당첨!',
    color: '#fbbf24',
    bgGradient: 'linear-gradient(135deg, #92400e 0%, #78350f 40%, #451a03 100%)',
    borderColor: '#fbbf24',
    shadowColor: 'rgba(251, 191, 36, 0.85)',
    badgeLabel: '전설의 황금 쿠폰!',
    weight: 5,
    bonusExp: 0,
  },
  {
    id: 'special',
    label: '20분 보너스',
    minutes: 20,
    emoji: '🟣',
    description: '스페셜! 보너스 20분 쿠폰 당첨!',
    color: '#a855f7',
    bgGradient: 'linear-gradient(135deg, #4a044e 0%, #3b0764 60%, #1e1b4b 100%)',
    borderColor: '#a855f7',
    shadowColor: 'rgba(168, 85, 247, 0.8)',
    badgeLabel: '스페셜 네온 쿠폰!',
    weight: 15,
    bonusExp: 0,
  },
  {
    id: 'regular',
    label: '10분 보너스',
    minutes: 10,
    emoji: '🔵',
    description: '레귤러 당첨! 보너스 10분 쿠폰이에요!',
    color: '#38bdf8',
    bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #082f49 60%, #020617 100%)',
    borderColor: '#38bdf8',
    shadowColor: 'rgba(56, 189, 248, 0.75)',
    badgeLabel: '레귤러 쿠폰!',
    weight: 35,
    bonusExp: 0,
  },
  {
    id: 'basic',
    label: '5분 보너스',
    minutes: 5,
    emoji: '🟢',
    description: '보너스 5분 쿠폰! 잘 활용해봐요!',
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 60%, #020617 100%)',
    borderColor: '#10b981',
    shadowColor: 'rgba(16, 185, 129, 0.7)',
    badgeLabel: '기본 초록 쿠폰!',
    weight: 30,
    bonusExp: 0,
  },
  {
    id: 'miss',
    label: '꽝',
    minutes: 0,
    emoji: '💨',
    description: '아쉽지만 꽝! 다음 주에 다시 노려보자! 대신 보너스 EXP +50 지급!',
    color: '#64748b',
    bgGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderColor: '#475569',
    shadowColor: 'rgba(100, 116, 139, 0.5)',
    badgeLabel: '고질라 방귀... 💨',
    weight: 15,
    bonusExp: 50,
  },
];

// 가중치 기반 랜덤 뽑기
export const rollGachaReward = (): GachaReward => {
  const totalWeight = GACHA_REWARDS.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;

  for (const reward of GACHA_REWARDS) {
    random -= reward.weight;
    if (random <= 0) return reward;
  }

  return GACHA_REWARDS[GACHA_REWARDS.length - 1];
};

// ───────────────────────────────────────────────────────────
// 쿠폰 저장소 (localStorage: 'godzilla_earned_coupons')
// ───────────────────────────────────────────────────────────

export const STORAGE_KEY_COUPONS = 'godzilla_earned_coupons';
export const STORAGE_KEY_WEEKLY_REWARD = 'godzilla_weekly_reward_claimed_week';

export interface EarnedCoupon {
  id: string;             // uuid 대신 timestamp-based
  rewardId: GachaRewardRarity;
  label: string;
  minutes: number;
  emoji: string;
  earnedAt: string;       // ISO timestamp
  isUsed: boolean;
}

export const loadCoupons = (): EarnedCoupon[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COUPONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
};

export const setStoredCoupons = (coupons: EarnedCoupon[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(coupons));
  } catch {
    // ignore
  }
};

export const setStoredWeeklyRewardClaimed = (weekKey: string | null): void => {
  try {
    if (weekKey) {
      localStorage.setItem(STORAGE_KEY_WEEKLY_REWARD, JSON.stringify(weekKey));
      localStorage.setItem('godzilla_weekly_reward_claimed', JSON.stringify(weekKey));
    } else {
      localStorage.removeItem(STORAGE_KEY_WEEKLY_REWARD);
      localStorage.removeItem('godzilla_weekly_reward_claimed');
    }
  } catch {
    // ignore
  }
};

export const saveCoupon = (reward: GachaReward): EarnedCoupon => {
  const newCoupon: EarnedCoupon = {
    id: `coupon-${Date.now()}`,
    rewardId: reward.id,
    label: reward.label,
    minutes: reward.minutes,
    emoji: reward.emoji,
    earnedAt: new Date().toISOString(),
    isUsed: false,
  };

  const existing = loadCoupons();
  const updated = [...existing, newCoupon];

  try {
    localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(updated));
  } catch {
    // ignore
  }

  // Firestore 자동 백업 (비동기)
  savePlayerDataToFirestore({ coupons: updated });

  return newCoupon;
};

export const markCouponUsed = (couponId: string): void => {
  const existing = loadCoupons();
  const updated = existing.map((c) => (c.id === couponId ? { ...c, isUsed: true } : c));
  try {
    localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(updated));
  } catch {
    // ignore
  }

  // Firestore 자동 백업 (비동기)
  savePlayerDataToFirestore({ coupons: updated });
};

// 이번 주 월요일 날짜 문자열 ('YYYY-MM-DD') 계산
export const getThisWeekMondayStr = (targetDate: Date = new Date()): string => {
  const day = targetDate.getDay();
  const mondayOffset = (day + 6) % 7;
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() - mondayOffset);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// 이번 주 주차 고유 키 ('week-YYYY-MM-DD', 월요일 00시 기준 정확히 갱신)
export const getCurrentWeekKey = (): string => {
  return `week-${getThisWeekMondayStr()}`;
};

export const hasClaimedWeeklyReward = (): boolean => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WEEKLY_REWARD) || localStorage.getItem('godzilla_weekly_reward_claimed');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed === getCurrentWeekKey();
    }
  } catch {
    // ignore
  }
  return false;
};

export const markWeeklyRewardClaimed = (): void => {
  try {
    const weekKey = getCurrentWeekKey();
    localStorage.setItem(STORAGE_KEY_WEEKLY_REWARD, JSON.stringify(weekKey));
    localStorage.setItem('godzilla_weekly_reward_claimed', JSON.stringify(weekKey));
    savePlayerDataToFirestore({ weeklyRewardClaimedWeek: weekKey });
  } catch {
    // ignore
  }
};

export const resetWeeklyRewardClaimed = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_WEEKLY_REWARD);
    localStorage.removeItem('godzilla_weekly_reward_claimed');
    savePlayerDataToFirestore({ weeklyRewardClaimedWeek: null });
  } catch {
    // ignore
  }
};

// ───────────────────────────────────────────────────────────
// 도감 10종 완성 최고 보상 (황금 보물상자) 영구 저장소
// ───────────────────────────────────────────────────────────
export const STORAGE_KEY_CODEX_REWARD = 'godzilla_codex_reward_claimed';

export const hasClaimedCodexReward = (): boolean => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CODEX_REWARD);
    return saved === 'true';
  } catch {
    return false;
  }
};

export const markCodexRewardClaimed = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CODEX_REWARD, 'true');
    savePlayerDataToFirestore({ hasClaimedCodexReward: true });
  } catch (e) {
    console.error('Failed to mark codex reward claimed:', e);
  }
};

// 황금 보물상자 최고 보상 쿠폰 (30분 게임 & 유튜브 보너스 쿠폰) 생성
export const createGoldenChestReward = (source: 'attendance' | 'codex'): GachaReward => {
  return {
    id: 'legendary',
    label: '30분 게임 & 유튜브 보너스 쿠폰',
    minutes: 30,
    emoji: '👑',
    description:
      source === 'codex'
        ? '🎉 10종 괴수 도감 완전 정복 최고 보상! 게임 또는 유튜브 30분 자유 이용권!'
        : '🎉 7일 연속 출석 달성 최고 보상! 게임 또는 유튜브 30분 자유 이용권!',
    color: '#fbbf24',
    bgGradient: 'linear-gradient(135deg, #92400e 0%, #78350f 40%, #451a03 100%)',
    borderColor: '#fbbf24',
    shadowColor: 'rgba(251, 191, 36, 0.85)',
    badgeLabel: '🎁 최고 등급 전설 쿠폰!',
    weight: 100,
    bonusExp: 100,
  };
};
