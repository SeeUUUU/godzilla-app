// =================================================================
// 아토믹 파츠 & 칭호 데이터 및 로컬스토리지 보존 시스템
// =================================================================

export type PartSlot = 'head' | 'fin' | 'weapon';

export interface AtomicPart {
  id: string;
  name: string;
  slot: PartSlot;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  description: string;
  unlockCondition: string;
  turretEmoji: string; // 포탑에 표시될 이모지 데코레이션
}

export interface AtomicTitle {
  id: string;
  title: string;
  badgeIcon: string;
  description: string;
  unlockCondition: string;
}

export interface EquippedAtomicGear {
  head: string | null;   // partId
  fin: string | null;    // partId
  weapon: string | null; // partId
  title: string;         // titleId
}

// -------------------------------------------------------------
// 1. 아토믹 파츠 마스터 데이터 (12종)
// -------------------------------------------------------------
export const ATOMIC_PARTS: AtomicPart[] = [
  // [Head 슬롯]
  {
    id: 'part_head_crown',
    name: '황금 사령관 왕관',
    slot: 'head',
    icon: '👑',
    rarity: 'LEGENDARY',
    description: '우주 괴수 운석을 완벽하게 요격한 시우 대장에게 수여되는 황금 왕관!',
    unlockCondition: '퍼펙트(무결점) 요격 1회 달성 시 해금',
    turretEmoji: '👑',
  },
  {
    id: 'part_head_visor',
    name: '메카 사이버 바이저',
    slot: 'head',
    icon: '🥽',
    rarity: 'RARE',
    description: '수식 운석의 궤도를 정밀하게 조준하는 최첨단 홀로그램 바이저.',
    unlockCondition: 'STAGE 1 클리어 시 기본 지급',
    turretEmoji: '🥽',
  },
  {
    id: 'part_head_helmet',
    name: '방위군 티타늄 헬멧',
    slot: 'head',
    icon: '⛑️',
    rarity: 'COMMON',
    description: '운석 파편으로부터 고질라를 보호하는 방위군 정규 헬멧.',
    unlockCondition: '기본 보유 파츠',
    turretEmoji: '⛑️',
  },
  {
    id: 'part_head_horns',
    name: '황금 킹기도라 뿔 투구',
    slot: 'head',
    icon: '⚡',
    rarity: 'EPIC',
    description: '킹기도라의 황금 번개 에너지가 깃든 용맹한 뿔 장식 투구.',
    unlockCondition: '거대 보스 운석 2회 격파 시 해금',
    turretEmoji: '⚡',
  },

  // [Fin 등지느러미 슬롯]
  {
    id: 'part_fin_classic',
    name: '클래식 네온 블루 등지느러미',
    slot: 'fin',
    icon: '🔷',
    rarity: 'COMMON',
    description: '푸른 아토믹 에너지가 은은하게 맥동하는 전통의 등지느러미.',
    unlockCondition: '기본 보유 파츠',
    turretEmoji: '🔷',
  },
  {
    id: 'part_fin_burning',
    name: '버닝 플레임 등지느러미',
    slot: 'fin',
    icon: '🔥',
    rarity: 'EPIC',
    description: '섭씨 1만 도의 초고열 화염이 활활 타오르는 진홍빛 지느러미.',
    unlockCondition: '버닝 피버(3콤보 이상) 달성 시 해금',
    turretEmoji: '🔥',
  },
  {
    id: 'part_fin_thunder',
    name: '썬더 골드 등지느러미',
    slot: 'fin',
    icon: '⚡',
    rarity: 'RARE',
    description: '번개 스파크가 찌릿찌릿 튀는 황금빛 지느러미.',
    unlockCondition: 'STAGE 5 클리어 시 해금',
    turretEmoji: '⚡',
  },
  {
    id: 'part_fin_crystal',
    name: '절대 방어 스페이스 크리스털',
    slot: 'fin',
    icon: '💎',
    rarity: 'LEGENDARY',
    description: '우주 크리스털의 신비로운 힘으로 방어력을 극대화한 보석 지느러미.',
    unlockCondition: 'STAGE 10 클리어 시 해금',
    turretEmoji: '💎',
  },

  // [Weapon 캐논 슬롯]
  {
    id: 'part_weapon_standard',
    name: '스탠다드 아토믹 캐논',
    slot: 'weapon',
    icon: '🦖',
    rarity: 'COMMON',
    description: '안정적인 출력으로 운석을 요격하는 표준 아토믹 포탑.',
    unlockCondition: '기본 보유 파츠',
    turretEmoji: '🦖',
  },
  {
    id: 'part_weapon_mega',
    name: '하이퍼 버닝 메가 빔포',
    slot: 'weapon',
    icon: '💥',
    rarity: 'EPIC',
    description: '운석을 단숨에 증발시키는 초고출력 트윈 버닝 빔포.',
    unlockCondition: '5 COMBO 이상 달성 시 해금',
    turretEmoji: '💥',
  },
  {
    id: 'part_weapon_mecha',
    name: '메카고질라 플라즈마 그레네이드',
    slot: 'weapon',
    icon: '🤖',
    rarity: 'RARE',
    description: '메카고질라의 기술을 집약한 쾌속 레이저 발사대.',
    unlockCondition: 'STAGE 3 클리어 시 해금',
    turretEmoji: '🤖',
  },
  {
    id: 'part_weapon_infinity',
    name: '인피니티 아토믹 스파이럴포',
    slot: 'weapon',
    icon: '🌌',
    rarity: 'LEGENDARY',
    description: '나선형 은하 빔을 발사하는 우주 최강의 궁극 요격 병기.',
    unlockCondition: 'STAGE 12(최종장) 클리어 시 해금',
    turretEmoji: '🌌',
  },
];

// -------------------------------------------------------------
// 2. 명예의 칭호 마스터 데이터 (7종)
// -------------------------------------------------------------
export const ATOMIC_TITLES: AtomicTitle[] = [
  {
    id: 'title_default',
    title: '⭐ 시우 대장',
    badgeIcon: '⭐',
    description: '기지의 신뢰를 한 몸에 받는 든든한 총사령관!',
    unlockCondition: '기본 보유 칭호',
  },
  {
    id: 'title_marksman',
    title: '🎯 백발백중 요격 사령관',
    badgeIcon: '🎯',
    description: '단 한 발의 오차도 없이 운석을 요격하는 명사수!',
    unlockCondition: '산수 1개 스테이지 클리어 시 해금',
  },
  {
    id: 'title_fever_master',
    title: '🔥 버닝 피버 마스터',
    badgeIcon: '🔥',
    description: '연속 정답의 리듬을 지배하는 불꽃의 연산 마스터!',
    unlockCondition: '버닝 피버(3콤보 이상) 달성 시 해금',
  },
  {
    id: 'title_boss_slayer',
    title: '👑 괴수 보스 슬레이어',
    badgeIcon: '👑',
    description: '거대 보스 운석을 시원하게 격파한 전설의 용사!',
    unlockCondition: '거대 보스 수식 운석 격파 시 해금',
  },
  {
    id: 'title_perfect_legend',
    title: '🏆 무결점 퍼펙트 레전드',
    badgeIcon: '🏆',
    description: '하트 1개도 잃지 않고 퍼펙트로 전장을 수호한 챔피언!',
    unlockCondition: '무결점 퍼펙트 요격 달성 시 해금',
  },
  {
    id: 'title_grade2_conqueror',
    title: '🧮 초등 2학년 연산 정복자',
    badgeIcon: '🧮',
    description: '두 자리 수 덧셈·뺄셈을 완벽하게 마스터한 수학 천재!',
    unlockCondition: 'STAGE 6 이상 클리어 시 해금',
  },
  {
    id: 'title_cosmic_marshal',
    title: '🌌 전우주 절대방위대 원수',
    badgeIcon: '🌌',
    description: '지구와 우주의 모든 수학 운석을 평정한 최고의 대원수!',
    unlockCondition: 'STAGE 12 클리어 시 해금',
  },
];

// -------------------------------------------------------------
// 3. 로컬스토리지 저장 키 및 기본값
// -------------------------------------------------------------
const STORAGE_KEY_UNLOCKED_PARTS = 'godzilla_atomic_unlocked_parts';
const STORAGE_KEY_UNLOCKED_TITLES = 'godzilla_atomic_unlocked_titles';
const STORAGE_KEY_EQUIPPED_GEAR = 'godzilla_atomic_equipped_gear';

const DEFAULT_UNLOCKED_PARTS = ['part_head_helmet', 'part_fin_classic', 'part_weapon_standard'];
const DEFAULT_UNLOCKED_TITLES = ['title_default'];

export const DEFAULT_EQUIPPED_GEAR: EquippedAtomicGear = {
  head: null,
  fin: 'part_fin_classic',
  weapon: 'part_weapon_standard',
  title: 'title_default',
};

// -------------------------------------------------------------
// 4. 로컬스토리지 헬퍼 함수
// -------------------------------------------------------------

/** 해금된 파츠 ID 목록 가져오기 */
export const getUnlockedPartIds = (): string[] => {
  if (typeof window === 'undefined') return DEFAULT_UNLOCKED_PARTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNLOCKED_PARTS);
    if (!raw) return DEFAULT_UNLOCKED_PARTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? Array.from(new Set([...DEFAULT_UNLOCKED_PARTS, ...parsed])) : DEFAULT_UNLOCKED_PARTS;
  } catch {
    return DEFAULT_UNLOCKED_PARTS;
  }
};

/** 새로운 파츠 해금 */
export const unlockPartId = (partId: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const current = getUnlockedPartIds();
    if (current.includes(partId)) return false; // 이미 해금됨
    const updated = [...current, partId];
    localStorage.setItem(STORAGE_KEY_UNLOCKED_PARTS, JSON.stringify(updated));
    return true; // 새로 해금 성공!
  } catch {
    return false;
  }
};

/** 해금된 칭호 ID 목록 가져오기 */
export const getUnlockedTitleIds = (): string[] => {
  if (typeof window === 'undefined') return DEFAULT_UNLOCKED_TITLES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNLOCKED_TITLES);
    if (!raw) return DEFAULT_UNLOCKED_TITLES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? Array.from(new Set([...DEFAULT_UNLOCKED_TITLES, ...parsed])) : DEFAULT_UNLOCKED_TITLES;
  } catch {
    return DEFAULT_UNLOCKED_TITLES;
  }
};

/** 새로운 칭호 해금 */
export const unlockTitleId = (titleId: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const current = getUnlockedTitleIds();
    if (current.includes(titleId)) return false;
    const updated = [...current, titleId];
    localStorage.setItem(STORAGE_KEY_UNLOCKED_TITLES, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
};

/** 현재 장착 중인 파츠 및 칭호 가져오기 */
export const getEquippedGear = (): EquippedAtomicGear => {
  if (typeof window === 'undefined') return DEFAULT_EQUIPPED_GEAR;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EQUIPPED_GEAR);
    if (!raw) return DEFAULT_EQUIPPED_GEAR;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_EQUIPPED_GEAR, ...parsed };
  } catch {
    return DEFAULT_EQUIPPED_GEAR;
  }
};

/** 장착 파츠/칭호 저장 */
export const setEquippedGear = (gear: EquippedAtomicGear): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_EQUIPPED_GEAR, JSON.stringify(gear));
  } catch {
    // ignore
  }
};

// -------------------------------------------------------------
// 5. 스테이지 클리어 시 자동 보상 판정 헬퍼
// -------------------------------------------------------------
export interface ClearRewardResult {
  newlyUnlockedParts: AtomicPart[];
  newlyUnlockedTitles: AtomicTitle[];
}

export const evaluateStageClearRewards = (params: {
  stageNum: number;
  isPerfect: boolean;
  maxCombo: number;
  hasDefeatedBoss: boolean;
}): ClearRewardResult => {
  const { stageNum, isPerfect, maxCombo, hasDefeatedBoss } = params;
  const partsToUnlock: string[] = [];
  const titlesToUnlock: string[] = [];

  // 기본 클리어 보상
  titlesToUnlock.push('title_marksman');
  if (stageNum === 1) partsToUnlock.push('part_head_visor');
  if (stageNum >= 3) partsToUnlock.push('part_weapon_mecha');
  if (stageNum >= 5) partsToUnlock.push('part_fin_thunder');
  if (stageNum >= 6) titlesToUnlock.push('title_grade2_conqueror');
  if (stageNum >= 10) partsToUnlock.push('part_fin_crystal');
  if (stageNum >= 12) {
    partsToUnlock.push('part_weapon_infinity');
    titlesToUnlock.push('title_cosmic_marshal');
  }

  // 퍼펙트 클리어 보상
  if (isPerfect) {
    partsToUnlock.push('part_head_crown');
    titlesToUnlock.push('title_perfect_legend');
  }

  // 콤보 & 피버 모드 보상
  if (maxCombo >= 3) {
    partsToUnlock.push('part_fin_burning');
    titlesToUnlock.push('title_fever_master');
  }
  if (maxCombo >= 5) {
    partsToUnlock.push('part_weapon_mega');
  }

  // 보스 격파 보상
  if (hasDefeatedBoss) {
    partsToUnlock.push('part_head_horns');
    titlesToUnlock.push('title_boss_slayer');
  }

  // 실제 신규 해금된 항목 필터링
  const newlyUnlockedParts: AtomicPart[] = [];
  for (const partId of partsToUnlock) {
    if (unlockPartId(partId)) {
      const part = ATOMIC_PARTS.find((p) => p.id === partId);
      if (part) newlyUnlockedParts.push(part);
    }
  }

  const newlyUnlockedTitles: AtomicTitle[] = [];
  for (const titleId of titlesToUnlock) {
    if (unlockTitleId(titleId)) {
      const title = ATOMIC_TITLES.find((t) => t.id === titleId);
      if (title) newlyUnlockedTitles.push(title);
    }
  }

  return { newlyUnlockedParts, newlyUnlockedTitles };
};
