export type RankTier = 'all' | 'epic' | 'legend' | 'mythic' | 'honor' | 'glory';
export type TimeWindow = '1d' | '3d' | '7d' | '15d' | '30d';
export type Tier = 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';
export type Lane = 'Gold Lane' | 'EXP Lane' | 'Mid Lane' | 'Roam' | 'Jungle';
export type LaneFilter = 'All' | 'Gold' | 'EXP' | 'Mid' | 'Roam' | 'Jungle';
export type Role = 'Tank' | 'Fighter' | 'Assassin' | 'Mage' | 'Marksman' | 'Support';

export interface SynergyPartner {
  heroId: number;
  name: string;
  avatarUrl: string;
  winRateDelta: number; // e.g. 0.0637 (+6.37%)
}

export type CounterStrength = 'Very Strong' | 'Strong' | 'Moderate' | 'Slight';

export interface CounterMatchup {
  heroId: number;
  name: string;
  avatarUrl: string;
  roles: (Role | string)[];
  lanes: Lane[];
  winRateDelta: number; // e.g. 0.0637 (+6.37% advantage against target hero)
  advantageFormatted: string; // e.g. "+6.4% WR"
  strength: CounterStrength;
}

export interface PowerScoreWeights {
  wr: number; // 0 - 100
  pr: number; // 0 - 100
  br: number; // 0 - 100
  dampenNiche: boolean; // default true
}

export type WeightPresetKey = 'default' | 'pure_winrate' | 'ban_priority' | 'popularity';

export interface NormalizedHero {
  id: number;
  name: string;
  avatarUrl: string;
  roles: (Role | string)[];
  lanes: Lane[];
  winRate: number; // e.g. 0.5795
  pickRate: number; // e.g. 0.0089
  banRate: number; // e.g. 0.1091
  powerScore: number; // e.g. 88.4
  tier: Tier;
  synergies: SynergyPartner[];
  counters?: CounterMatchup[];
}

export interface TierListDataset {
  updatedAt: string; // ISO 8601 UTC
  patchVersion: string; // e.g. "2.1.41"
  rankTier: RankTier;
  timeWindow: TimeWindow;
  heroes: NormalizedHero[];
}

export interface RawSubHero {
  heroid: number;
  hero?: {
    data?: {
      head?: string;
    };
  };
  hero_channel?: {
    id?: number;
  };
  increase_win_rate: number;
}

export interface RawGmsRecordData {
  main_hero?: {
    data?: {
      name?: string;
      head?: string;
    };
  };
  main_heroid: number;
  main_hero_win_rate: number;
  main_hero_appearance_rate: number;
  main_hero_ban_rate: number;
  main_hero_channel?: {
    id?: number;
  };
  match_type?: number;
  camp_type?: number;
  sub_hero?: RawSubHero[];
  sub_hero_last?: RawSubHero[];
}

export interface RawGmsRecord {
  _updatedAt?: number | string;
  data: RawGmsRecordData;
}

export interface RawGmsResponse {
  code: number;
  message: string;
  data?: {
    records: RawGmsRecord[];
    total?: number;
  };
}

export interface RawCatalogHero {
  heroid: number;
  name: string;
  story?: string;
  head: string;
  squarehead?: string;
  squareheadbig?: string;
  sortid?: string[];
  sortlabel?: string[];
  roadsort?: string[];
  roadsortlabel?: string[];
}

export interface RawCatalogResponse {
  type?: string;
  lan?: string;
  hero_list: RawCatalogHero[];
}
