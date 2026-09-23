import type { MonsterCardData, MonsterRarity, UnlockedMonsterRecord } from '../types';
import { savePlayerDataToFirestore } from '../firebase';

export const STORAGE_KEY_UNLOCKED_MONSTERS = 'godzilla_unlocked_monsters';

// 등급별 스타일 메타데이터 (브론즈, 실버, 골드, 퍼플, 레드)
export const RARITY_METADATA: Record<
  MonsterRarity,
  {
    label: string;
    stars: number;
    borderColor: string;
    neonColor: string;
    badgeBg: string;
    titleColor: string;
    cardBg: string;
    shadowColor: string;
    starColor: string;
  }
> = {
  normal: {
    label: '노멀',
    stars: 1,
    borderColor: '#b45309', // 브론즈
    neonColor: '#d97706',
    badgeBg: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
    titleColor: '#fde68a',
    cardBg: 'linear-gradient(180deg, #1e1b18 0%, #0f172a 100%)',
    shadowColor: 'rgba(180, 83, 9, 0.5)',
    starColor: '#fbbf24',
  },
  rare: {
    label: '레어',
    stars: 2,
    borderColor: '#94a3b8', // 실버
    neonColor: '#38bdf8',
    badgeBg: 'linear-gradient(135deg, #334155 0%, #64748b 50%, #94a3b8 100%)',
    titleColor: '#bae6fd',
    cardBg: 'linear-gradient(180deg, #0f172a 0%, #082f49 100%)',
    shadowColor: 'rgba(56, 189, 248, 0.6)',
    starColor: '#38bdf8',
  },
  super_rare: {
    label: '슈퍼레어',
    stars: 3,
    borderColor: '#f59e0b', // 골드
    neonColor: '#facc15',
    badgeBg: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
    titleColor: '#fef08a',
    cardBg: 'linear-gradient(180deg, #1c1917 0%, #451a03 100%)',
    shadowColor: 'rgba(245, 158, 11, 0.8)',
    starColor: '#facc15',
  },
  legendary: {
    label: '전설',
    stars: 4,
    borderColor: '#a855f7', // 퍼플
    neonColor: '#c084fc',
    badgeBg: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #a855f7 100%)',
    titleColor: '#f3e8ff',
    cardBg: 'linear-gradient(180deg, #1e112a 0%, #3b0764 100%)',
    shadowColor: 'rgba(168, 85, 247, 0.9)',
    starColor: '#e9d5ff',
  },
  mythic: {
    label: '신화',
    stars: 5,
    borderColor: '#ef4444', // 레드
    neonColor: '#f43f5e',
    badgeBg: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #f97316 100%)',
    titleColor: '#ffe4e6',
    cardBg: 'linear-gradient(180deg, #2a0808 0%, #4c0519 100%)',
    shadowColor: 'rgba(239, 68, 68, 0.95)',
    starColor: '#f43f5e',
  },
};

// 10종 고질라 세계관 괴수 카드 데이터
export const MONSTER_CARDS: MonsterCardData[] = [
  {
    id: 'chibi-godzilla',
    ko: '치비 고질라',
    en: 'Chibi Godzilla',
    ja: 'チビゴジラ',
    jaKana: 'ちびごじら',
    rarity: 'normal',
    rarityLabel: '노멀',
    stars: 1,
    title: '귀여운 아기 괴수',
    description: '호기심 많고 사랑스럽지만, 깜짝 놀라면 파란 미니 파이어볼을 퐁퐁 뿜는 호기심 대장 아기 고질라!',
    color: '#4ade80',
    borderColor: '#b45309',
    badgeBg: 'linear-gradient(135deg, #15803d, #22c55e)',
    glowColor: '#4ade80',
    element: '미니 파이어볼 🫧',
  },
  {
    id: 'classic-godzilla',
    ko: '기본 고질라',
    en: 'Classic Godzilla',
    ja: '初代ゴジラ',
    jaKana: 'しょだいごじら',
    rarity: 'normal',
    rarityLabel: '노멀',
    stars: 1,
    title: '원조 괴수왕',
    description: '깊은 바다속에서 깨어난 전설의 원조 괴수왕! 묵직하고 강력한 푸른 방사열선으로 적들을 물리쳐요.',
    color: '#06b6d4',
    borderColor: '#b45309',
    badgeBg: 'linear-gradient(135deg, #0e7490, #06b6d4)',
    glowColor: '#06b6d4',
    element: '방사열선 🌊',
  },
  {
    id: 'mothra',
    ko: '모스라',
    en: 'Mothra',
    ja: 'モスラ',
    jaKana: 'もすら',
    rarity: 'rare',
    rarityLabel: '레어',
    stars: 2,
    title: '거대 나방의 여신',
    description: '평화와 지구를 사랑하는 거대한 나방의 신! 신비로운 빛을 내는 날개 가루와 눈부신 광선으로 모두를 지켜요.',
    color: '#38bdf8',
    borderColor: '#94a3b8',
    badgeBg: 'linear-gradient(135deg, #0369a1, #38bdf8)',
    glowColor: '#38bdf8',
    element: '수호 날개 가루 🦋',
  },
  {
    id: 'rodan',
    ko: '라돈',
    en: 'Rodan',
    ja: 'ラドン',
    jaKana: 'らどん',
    rarity: 'rare',
    rarityLabel: '레어',
    stars: 2,
    title: '화산의 거대 익룡',
    description: '뜨거운 활화산 마그마 속에서 부화한 불꽃의 익룡! 마하의 속도로 비행하며 거대한 충격파를 뿜어내요.',
    color: '#fb923c',
    borderColor: '#94a3b8',
    badgeBg: 'linear-gradient(135deg, #c2410c, #fb923c)',
    glowColor: '#fb923c',
    element: '마하 충격파 🦅',
  },
  {
    id: 'anguirus',
    ko: '안기라스',
    en: 'Anguirus',
    ja: 'アンギラス',
    jaKana: 'あんぎらす',
    rarity: 'rare',
    rarityLabel: '레어',
    stars: 2,
    title: '가시 갑옷의 용사',
    description: '고질라의 가장 듬직하고 의리 넘치는 전우! 등껍질의 단단한 가시 갑옷으로 적에게 용맹하게 돌진해요.',
    color: '#eab308',
    borderColor: '#94a3b8',
    badgeBg: 'linear-gradient(135deg, #a16207, #eab308)',
    glowColor: '#eab308',
    element: '가시 돌격 🛡️',
  },
  {
    id: 'mechagodzilla',
    ko: '메카 고질라',
    en: 'Mechagodzilla',
    ja: 'メカゴジラ',
    jaKana: 'めかごじら',
    rarity: 'super_rare',
    rarityLabel: '슈퍼레어',
    stars: 3,
    title: '강철의 결전 병기',
    description: '인류 최첨단 우주 합금 과학으로 탄생한 로봇 괴수! 눈에서 메가 빔을 쏘고 전신 미사일을 일제히 퍼부어요.',
    color: '#67e8f9',
    borderColor: '#f59e0b',
    badgeBg: 'linear-gradient(135deg, #0891b2, #06b6d4)',
    glowColor: '#67e8f9',
    element: '하이퍼 메가 빔 🤖',
  },
  {
    id: 'godzilla-minusone',
    ko: '고질라 -1.0',
    en: 'Godzilla Minus One',
    ja: 'ゴジラ-1.0',
    jaKana: 'ごじら まいなすわん',
    rarity: 'super_rare',
    rarityLabel: '슈퍼레어',
    stars: 3,
    title: '절망의 거대 괴수',
    description: '모든 것을 마이너스로 되돌리는 압도적 위압감의 괴수! 날카로운 등지느러미가 발광하며 초고압 폭발 열선을 뿜어요.',
    color: '#38bdf8',
    borderColor: '#f59e0b',
    badgeBg: 'linear-gradient(135deg, #0369a1, #0284c7)',
    glowColor: '#38bdf8',
    element: '초고압 압축열선 ⚡',
  },
  {
    id: 'king-ghidorah',
    ko: '킹 기도라',
    en: 'King Ghidorah',
    ja: 'キングギドラ',
    jaKana: 'きんぐぎどら',
    rarity: 'super_rare',
    rarityLabel: '슈퍼레어',
    stars: 3,
    title: '황금의 우주 삼두룡',
    description: '우주 저편에서 날아온 황금빛 삼두룡! 거대한 박쥐 날개를 펼치고 세 머리에서 눈부신 중력 번개를 난사해요.',
    color: '#facc15',
    borderColor: '#f59e0b',
    badgeBg: 'linear-gradient(135deg, #ca8a04, #eab308)',
    glowColor: '#facc15',
    element: '황금 중력 번개 ⚡',
  },
  {
    id: 'evil-godzilla',
    ko: '이블 고질라',
    en: 'Evil Godzilla',
    ja: 'GMKゴジラ',
    jaKana: 'じーえむけーごじら',
    rarity: 'legendary',
    rarityLabel: '전설',
    stars: 4,
    title: '백안의 파괴신',
    description: '동공이 없는 순백의 눈동자를 지닌 공포의 파괴신! 악령의 보랏빛 원혼 에너지를 폭발시켜 전장을 뒤흔들어요.',
    color: '#c084fc',
    borderColor: '#a855f7',
    badgeBg: 'linear-gradient(135deg, #6b21a8, #9333ea)',
    glowColor: '#c084fc',
    element: '악령 파괴 열선 😈',
  },
  {
    id: 'burning-godzilla',
    ko: '버닝 고질라',
    en: 'Burning Godzilla',
    ja: 'バーニングゴジラ',
    jaKana: 'ばーにんぐごじら',
    rarity: 'mythic',
    rarityLabel: '신화',
    stars: 5,
    title: '붉은 종말의 화신',
    description: '체내 핵 에너지가 극한으로 폭주하여 온몸이 붉게 타오르는 최강 형태! 붉은 나선 열선으로 모든 것을 녹여버려요.',
    color: '#ef4444',
    borderColor: '#ef4444',
    badgeBg: 'linear-gradient(135deg, #b91c1c, #ef4444, #f97316)',
    glowColor: '#ef4444',
    element: '인피니트 나선 열선 🔥',
  },
];

export const MONSTER_MAP = new Map<string, MonsterCardData>(
  MONSTER_CARDS.map((m) => [m.id, m])
);

// 가챠 확률 테이블 및 랜덤 뽑기 함수 (10종 모으기 전까지 미보유 괴수 100% 우선 추첨)
export const rollRandomMonster = (
  unlockedRecords?: Record<string, UnlockedMonsterRecord>
): MonsterCardData => {
  const records = unlockedRecords !== undefined ? unlockedRecords : getStoredUnlockedMonsters();

  // 1) 전체 10종 괴수 중 플레이어가 아직 보유하지 않은(수량 0장 또는 미발견 상태인) 괴수 목록 필터링
  const uncollectedMonsters = MONSTER_CARDS.filter((m) => {
    const rec = records[m.id];
    return !rec || (rec.count || 0) <= 0;
  });

  // 2) 미보유 괴수가 남아있다면, 미보유 목록 내에서만 랜덤 1종 추첨 (중복 방지 100% 보장)
  if (uncollectedMonsters.length > 0) {
    const pickedIndex = Math.floor(Math.random() * uncollectedMonsters.length);
    return uncollectedMonsters[pickedIndex];
  }

  // 3) 10종이 이미 다 모인 상태(10/10)에서 추가로 알을 까는 경우: 전체 10종 풀에서 가중치/희귀도 기반 자유 추첨
  const rand = Math.random() * 100;
  // mythic: 3% (97~100)
  // legendary: 7% (90~97)
  // super_rare: 20% (70~90)
  // rare: 35% (35~70)
  // normal: 35% (0~35)
  let targetRarity: MonsterRarity = 'normal';
  if (rand >= 97) {
    targetRarity = 'mythic';
  } else if (rand >= 90) {
    targetRarity = 'legendary';
  } else if (rand >= 70) {
    targetRarity = 'super_rare';
  } else if (rand >= 35) {
    targetRarity = 'rare';
  } else {
    targetRarity = 'normal';
  }

  const candidateMonsters = MONSTER_CARDS.filter((m) => m.rarity === targetRarity);
  if (candidateMonsters.length === 0) {
    return MONSTER_CARDS[0];
  }
  const pickedIndex = Math.floor(Math.random() * candidateMonsters.length);
  return candidateMonsters[pickedIndex];
};

// 10종 전체 해금 테스트용 레코드 생성기
export const createAllUnlockedMonstersRecord = (): Record<string, UnlockedMonsterRecord> => {
  const records: Record<string, UnlockedMonsterRecord> = {};
  const todayStr = new Date().toISOString().slice(0, 10);
  MONSTER_CARDS.forEach((m) => {
    records[m.id] = {
      unlockedAt: todayStr,
      count: 1,
    };
  });
  return records;
};

// localStorage 연동 헬퍼
export const getStoredUnlockedMonsters = (): Record<string, UnlockedMonsterRecord> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNLOCKED_MONSTERS);
    let records: Record<string, UnlockedMonsterRecord> = {};
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        records = parsed;
      }
    }
    return records;
  } catch (e) {
    console.error('Failed to load unlocked monsters:', e);
  }
  return {};
};

export const setStoredUnlockedMonsters = (records: Record<string, UnlockedMonsterRecord>): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_UNLOCKED_MONSTERS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to set unlocked monsters in storage:', e);
  }
};

// 도감 10종 완성 후 황금 보물상자 교환 시 10종 괴수 카드를 각 1장씩 차감 (0장이 되면 도감에서 제거/미발견 처리)
export const deductOneEachForCodexExchange = (): Record<string, UnlockedMonsterRecord> => {
  const current = getStoredUnlockedMonsters();
  const next: Record<string, UnlockedMonsterRecord> = {};

  MONSTER_CARDS.forEach((monster) => {
    const rec = current[monster.id];
    if (rec) {
      const newCount = (rec.count || 1) - 1;
      if (newCount > 0) {
        next[monster.id] = {
          ...rec,
          count: newCount,
        };
      }
      // newCount <= 0 이면 next에 넣지 않음 -> 자동으로 미발견(?) 상태로 복귀
    }
  });

  // 로컬스토리지 및 Firestore에 영구 동기화
  setStoredUnlockedMonsters(next);
  savePlayerDataToFirestore({ unlockedMonsters: next });

  return next;
};

export const saveMonsterToStorage = (
  monsterId: string
): { isNew: boolean; updatedRecords: Record<string, UnlockedMonsterRecord> } => {
  const records = getStoredUnlockedMonsters();
  const isNew = !records[monsterId];

  const nowStr = new Date().toISOString().slice(0, 10);
  if (isNew) {
    records[monsterId] = {
      unlockedAt: nowStr,
      count: 1,
    };
  } else {
    records[monsterId] = {
      ...records[monsterId],
      count: (records[monsterId].count || 1) + 1,
    };
  }

  try {
    localStorage.setItem(STORAGE_KEY_UNLOCKED_MONSTERS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save monster to storage:', e);
  }

  // Firestore에 자동 백업 (비동기)
  savePlayerDataToFirestore({ unlockedMonsters: records });

  return { isNew, updatedRecords: records };
};

// SVG 일러스트 컴포넌트 re-export
export { MonsterSvgIllustration } from '../components/MonsterSvgIllustration';
