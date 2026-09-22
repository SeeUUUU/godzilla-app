export type RaidBossId = 'hedorah' | 'mechagodzilla' | 'destoroyah' | 'gigan' | 'spacegodzilla';

export interface RaidBossInfo {
  id: RaidBossId;
  name: string;
  title: string;
  shortTitle: string;
  icon: string;
  themeColor: string;
  accentColor: string;
  auraGradient: string;
  description: string;
}

export const RAID_BOSSES: Record<RaidBossId, RaidBossInfo> = {
  hedorah: {
    id: 'hedorah',
    name: '헤도라',
    title: '스모그 괴수 헤도라',
    shortTitle: '헤도라',
    icon: '👾',
    themeColor: '#a855f7',
    accentColor: '#84cc16',
    auraGradient: 'radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(34, 197, 94, 0.3) 50%, transparent 85%)',
    description: '틀렸던 약점 단어들이 뭉쳐 끈적한 오염 슬라임 괴수 헤도라가 나타났어요!',
  },
  mechagodzilla: {
    id: 'mechagodzilla',
    name: '메카고질라',
    title: '기계 괴수 메카고질라',
    shortTitle: '메카고질라',
    icon: '🤖',
    themeColor: '#38bdf8',
    accentColor: '#ef4444',
    auraGradient: 'radial-gradient(circle, rgba(56, 189, 248, 0.5) 0%, rgba(239, 68, 68, 0.3) 50%, transparent 85%)',
    description: '초합금 장갑과 어깨 미사일 포드를 장착한 대괴수 결전병기 메카고질라 출현!',
  },
  destoroyah: {
    id: 'destoroyah',
    name: '데스토로이아',
    title: '완전체 괴수 데스토로이아',
    shortTitle: '데스토로이아',
    icon: '😈',
    themeColor: '#ef4444',
    accentColor: '#facc15',
    auraGradient: 'radial-gradient(circle, rgba(239, 68, 68, 0.55) 0%, rgba(245, 158, 11, 0.35) 50%, transparent 85%)',
    description: '옥시전 디스트로이어에서 탄생한 거대 박쥐 날개와 레이저 뿔의 악마 괴수!',
  },
  gigan: {
    id: 'gigan',
    name: '가이강',
    title: '사이보그 괴수 가이강',
    shortTitle: '가이강',
    icon: '🪓',
    themeColor: '#eab308',
    accentColor: '#ef4444',
    auraGradient: 'radial-gradient(circle, rgba(234, 179, 8, 0.5) 0%, rgba(239, 68, 68, 0.35) 50%, transparent 85%)',
    description: '양손의 강철 낫 블레이드와 붉은 외눈 바이저를 지닌 흉포한 우주 사이보그!',
  },
  spacegodzilla: {
    id: 'spacegodzilla',
    name: '스페이스 고질라',
    title: '우주 괴수 스페이스 고질라',
    shortTitle: '스페이스 고질라',
    icon: '💎',
    themeColor: '#8b5cf6',
    accentColor: '#38bdf8',
    auraGradient: 'radial-gradient(circle, rgba(139, 92, 246, 0.55) 0%, rgba(56, 189, 248, 0.35) 50%, transparent 85%)',
    description: '양 어깨에 거대한 코로나 크리스털을 뿜어내는 우주의 사악한 분신 강림!',
  },
};

export const RAID_BOSS_LIST: RaidBossInfo[] = Object.values(RAID_BOSSES);

export const getRandomRaidBoss = (): RaidBossInfo => {
  const index = Math.floor(Math.random() * RAID_BOSS_LIST.length);
  return RAID_BOSS_LIST[index];
};
