export interface WordSentenceData {
  krSentence: string;
  enSentence: string;
  jpSentence: string;
  jpFurigana?: string;
  word?: WordItem;
}

export interface WordItem {
  id: string | number;
  ko: string;
  en: string;
  ja: string;
  jaKana?: string;
  krSentence?: string;
  enSentence?: string;
  jpSentence?: string;
  jpFurigana?: string;
}

export interface MathProblemItem {
  id: string;
  stage: number;
  question: string;
  answer: string;
  options: string[];
  readKr: string;
}

export interface DailyDualQuest {
  date: string; // 'YYYY-MM-DD'
  languageDone: boolean;
  mathDone: boolean;
}

export interface GameState {
  level: number;
  exp: number;
  streak: number;
  cycleCount?: number;
  equippedPartnerId?: string | null;
  mathStage?: number;
}

export type BattleStatus = 'PLAYING' | 'FINISHING' | 'CLEARED';

export type Language = 'ko' | 'en' | 'ja';

// 포효 모드 3단계 파워 판정 타입
export type RoarPowerLevel = 'GOOD' | 'GREAT' | 'PERFECT';

export interface RoarPowerResult {
  level: RoarPowerLevel;
  peakVolume: number;
  label: string;
  badge: string;
  stars: number;
  scaleMultiplier: number;
}

export interface SelectedCards {
  ko: string | number | null;
  en: string | number | null;
  ja: string | number | null;
}

// 5단계 고질라 공식 파워 랭킹 진화 단계
export type GodzillaStageTier = 'chibi' | 'classic' | 'minusone' | 'evil' | 'burning';

export interface GodzillaEvolutionInfo {
  tier: GodzillaStageTier;
  levelRange: string;
  name: string;
  shortName: string;
  label: string;
  icon: string;
  themeColor: string;
  badgeBg: string;
  beamName: string;
  imageSrc: string;
}

export const getGodzillaEvolution = (level: number): GodzillaEvolutionInfo => {
  if (level >= 9) {
    return {
      tier: 'burning',
      levelRange: 'LV.9+',
      name: '최강 버닝 고질라',
      shortName: '버닝 고질라',
      label: 'LV.9+ 최강 버닝 고질라',
      icon: '🔥',
      themeColor: '#ff2200',
      badgeBg: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #f97316 100%)',
      beamName: '인피니트 스파이럴 나선 열선',
      imageSrc: '/images/godzilla-burning.png',
    };
  }
  if (level >= 7) {
    return {
      tier: 'evil',
      levelRange: 'LV.7~8',
      name: '이블 고질라',
      shortName: '이블 고질라',
      label: 'LV.7~8 이블 고질라',
      icon: '😈',
      themeColor: '#c084fc',
      badgeBg: 'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #7e22ce 100%)',
      beamName: '악령 파괴 광선',
      imageSrc: '/images/godzilla-evil.png',
    };
  }
  if (level >= 5) {
    return {
      tier: 'minusone',
      levelRange: 'LV.5~6',
      name: '고질라 -1.0',
      shortName: '고질라 -1.0',
      label: 'LV.5~6 고질라 -1.0',
      icon: '⚡',
      themeColor: '#38bdf8',
      badgeBg: 'linear-gradient(135deg, #082f49 0%, #0369a1 50%, #0284c7 100%)',
      beamName: '핵폭발급 초고압 열선',
      imageSrc: '/images/godzilla-minusone.png',
    };
  }
  if (level >= 3) {
    return {
      tier: 'classic',
      levelRange: 'LV.3~4',
      name: '기본 고질라',
      shortName: '기본 고질라',
      label: 'LV.3~4 기본 고질라',
      icon: '🦖',
      themeColor: '#06b6d4',
      badgeBg: 'linear-gradient(135deg, #0e7490 0%, #0284c7 100%)',
      beamName: '네온 블루 방사열선',
      imageSrc: '/images/godzilla-classic.png',
    };
  }
  return {
    tier: 'chibi',
    levelRange: 'LV.1~2',
    name: '치비 고질라',
    shortName: '치비 고질라',
    label: 'LV.1~2 치비 고질라',
    icon: '🐣',
    themeColor: '#4ade80',
    badgeBg: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
    beamName: '블루 파이어볼 팝',
    imageSrc: '/images/godzilla-chibi.png',
  };
};

// 10레벨 단위 [궁극의 각성 아우라 (Lv.10 ~ Lv.50+)]
export type GodzillaAuraTier = 'none' | 'supersonic' | 'volcano' | 'cosmic' | 'abyssal' | 'emperor';

export interface GodzillaAuraInfo {
  tier: GodzillaAuraTier;
  levelRange: string;
  name: string;
  shortName: string;
  icon: string;
  themeColor: string;
  secondaryColor: string;
  glowShadow: string;
  description: string;
}

export const getGodzillaAura = (level: number): GodzillaAuraInfo => {
  if (level >= 50) {
    return {
      tier: 'emperor',
      levelRange: 'LV.50+',
      name: '신화의 지배자 - 골든 엠페러',
      shortName: '골든 엠페러',
      icon: '👑',
      themeColor: '#fbbf24',
      secondaryColor: '#f59e0b',
      glowShadow: '0 0 16px rgba(251, 191, 36, 0.8), 0 0 30px rgba(245, 158, 11, 0.6)',
      description: '황금빛 네온 실루엣과 전신을 뚫고 나오는 황금 번개 스파크',
    };
  }
  if (level >= 40) {
    return {
      tier: 'abyssal',
      levelRange: 'LV.40~49',
      name: '암흑 흑염 (Abyssal Shadow)',
      shortName: '암흑 흑염',
      icon: '🌑',
      themeColor: '#dc2626',
      secondaryColor: '#7f1d1d',
      glowShadow: '0 0 14px rgba(220, 38, 38, 0.8), 0 0 25px rgba(0, 0, 0, 0.9)',
      description: '전신을 휘감는 검붉은 다크 플레임 아우라',
    };
  }
  if (level >= 30) {
    return {
      tier: 'cosmic',
      levelRange: 'LV.30~39',
      name: '스페이스 크리스탈 (Cosmic Energy)',
      shortName: '스페이스 크리스탈',
      icon: '💎',
      themeColor: '#c084fc',
      secondaryColor: '#8b5cf6',
      glowShadow: '0 0 14px rgba(192, 132, 252, 0.8), 0 0 25px rgba(139, 92, 246, 0.6)',
      description: '고질라 주변에 부유하는 보랏빛 크리스탈 다이아몬드 파티클',
    };
  }
  if (level >= 20) {
    return {
      tier: 'volcano',
      levelRange: 'LV.20~29',
      name: '화염 융합로 (Volcano Fusion)',
      shortName: '화염 융합로',
      icon: '🌋',
      themeColor: '#f97316',
      secondaryColor: '#ef4444',
      glowShadow: '0 0 14px rgba(249, 115, 22, 0.8), 0 0 25px rgba(239, 68, 68, 0.6)',
      description: '등 지느러미 주변 붉은 스파크 및 일렁이는 불꽃 파티클',
    };
  }
  if (level >= 10) {
    return {
      tier: 'supersonic',
      levelRange: 'LV.10~19',
      name: '초음속 충격파 (Supersonic Pulse)',
      shortName: '초음속 충격파',
      icon: '💫',
      themeColor: '#00f2ff',
      secondaryColor: '#06b6d4',
      glowShadow: '0 0 12px rgba(0, 242, 255, 0.75), 0 0 22px rgba(6, 182, 212, 0.5)',
      description: '발밑에 일정한 주기로 퍼져나가는 푸른 원형 충격파 링',
    };
  }
  return {
    tier: 'none',
    levelRange: 'LV.1~9',
    name: '기본 모드',
    shortName: '기본',
    icon: '',
    themeColor: 'transparent',
    secondaryColor: 'transparent',
    glowShadow: 'none',
    description: '기본 상태',
  };
};

export type MonsterRarity = 'normal' | 'rare' | 'super_rare' | 'legendary' | 'mythic';

export interface PartnerSkill {
  name: string;
  shortDesc: string;
  description: string;
  icon: string;
}

export interface MonsterCardData {
  id: string;
  ko: string;
  en: string;
  ja: string;
  jaKana: string;
  rarity: MonsterRarity;
  rarityLabel: string;
  stars: number;
  description: string;
  color: string;
  borderColor: string;
  badgeBg: string;
  glowColor: string;
  title: string;
  element: string;
  partnerSkill: PartnerSkill;
}

export interface UnlockedMonsterRecord {
  unlockedAt: string;
  count: number;
}

export interface MonsterCollectionState {
  monsters: Record<string, UnlockedMonsterRecord>;
  treasureBoxes: number;
}
