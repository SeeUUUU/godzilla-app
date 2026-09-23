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

export interface GameState {
  level: number;
  exp: number;
  streak: number;
}

export type Language = 'ko' | 'en' | 'ja';

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

export type MonsterRarity = 'normal' | 'rare' | 'super_rare' | 'legendary' | 'mythic';

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
}

export interface UnlockedMonsterRecord {
  unlockedAt: string;
  count: number;
}
