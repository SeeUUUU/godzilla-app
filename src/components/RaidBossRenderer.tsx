import React from 'react';
import type { RaidBossId } from '../data/raidBosses';
import { Hedorah } from './Hedorah';
import { Mechagodzilla } from './Mechagodzilla';
import { Destoroyah } from './Destoroyah';
import { Gigan } from './Gigan';
import { SpaceGodzilla } from './SpaceGodzilla';

interface RaidBossRendererProps {
  bossId: RaidBossId;
  isHit: boolean;
  isDefeated: boolean;
  hp?: number;
  className?: string;
}

export const RaidBossRenderer: React.FC<RaidBossRendererProps> = ({
  bossId,
  isHit,
  isDefeated,
  hp = 100,
  className = '',
}) => {
  switch (bossId) {
    case 'hedorah':
      return <Hedorah isHit={isHit} isDefeated={isDefeated} hp={hp} className={className} />;
    case 'mechagodzilla':
      return <Mechagodzilla isHit={isHit} isDefeated={isDefeated} hp={hp} className={className} />;
    case 'destoroyah':
      return <Destoroyah isHit={isHit} isDefeated={isDefeated} hp={hp} className={className} />;
    case 'gigan':
      return <Gigan isHit={isHit} isDefeated={isDefeated} hp={hp} className={className} />;
    case 'spacegodzilla':
      return <SpaceGodzilla isHit={isHit} isDefeated={isDefeated} hp={hp} className={className} />;
    default:
      return <Hedorah isHit={isHit} isDefeated={isDefeated} hp={hp} className={className} />;
  }
};
