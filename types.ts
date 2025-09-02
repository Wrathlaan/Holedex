/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  spriteId?: number;
  base_stats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
}

export interface EvolutionNode {
  speciesName: string;
  pokemonId: number;
  evolutions: {
    node: EvolutionNode;
    method: string;
  }[];
}

export interface Move {
  name: string;
  type: string;
  damage_class: 'physical' | 'special' | 'status';
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  level?: number;
}

export interface PokemonDetails {
  id: number;
  name: string;
  types: string[];
  height: number;
  weight: number;
  category: string;
  abilities: {
    name: string;
    description: string;
    isHidden: boolean;
  }[];
  pokedexEntries: { version: string; text: string }[];
  habitat: string | null;
  captureRate: number;
  evolutionChain: EvolutionNode | null;
  stats: {
    name: string;
    base_stat: number;
    ev_yield: number;
  }[];
  growthRate: string;
  moves?: {
    [versionGroup: string]: {
      'level-up'?: Move[];
      'machine'?: Move[];
      'egg'?: Move[];
      'tutor'?: Move[];
    }
  };
  versionGroups?: string[];
  varieties?: {
    is_default: boolean;
    pokemon: {
      name: string;
      url: string;
    };
  }[];
}

export interface Hunt {
  id: number;
  target: Pokemon;
  count: number;
  method: string;
}

export interface ShinyPokemon {
  id: string;
  pokemonId: number;
  name: string;
  nickname?: string;
  date: string;
  encounters: number;
  method: string;
}

export interface SharedShinyPayload {
  shiny: ShinyPokemon;
  pokemon: Pokemon;
}

export interface NewsItem {
  category: string;
  title: string;
  description: string;
  timestamp: string;
  image: string;
  imageAlt: string;
  link: string;
}

export type Theme = {
  [key: string]: string;
};

export type AppMode = 'pokedex' | 'training' | 'shiny-hunting' | 'team-builder' | 'battle-sim' | 'item-dex' | 'move-dex';

export interface RegionFetchState {
  isFetched: boolean;
  isFetching: boolean;
}

export interface TeamPokemon {
  instanceId: string; // Unique identifier for this specific instance in the team
  pokemonId: number;
  nickname: string;
  ability: string;
  heldItem: string;
  moves: (string | null)[];
  nature: string;
  evs: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  fetchedDetails?: { // To store fetched data like abilities
    abilities: { name: string; isHidden: boolean }[];
  }
}

export interface Team {
  id: string;
  name: string;
  pokemon: TeamPokemon[];
}

export const FETCHABLE_REGIONS = ['Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Hisui', 'Paldea'];

// --- Item Dex Types ---
export interface ItemListItem {
  name: string;
  url: string;
}

export interface ItemCategory {
  name: string;
  url: string;
}

export interface ItemDetails {
  id: number;
  name: string;
  cost: number;
  sprites: {
    default: string | null;
  };
  category: {
    name: string;
  };
  effect_entries: {
    effect: string;
    short_effect: string;
    language: { name: string; url: string };
  }[];
  flavor_text_entries: {
    text: string;
    language: { name: string; url: string };
    version_group: { name: string; url: string };
  }[];
  fling_power: number | null;
  attributes: {
    name: string;
    url: string;
  }[];
}

// --- Stat Scanner Types ---
export type StatBlock = {
  hp: number | null;
  attack: number | null;
  defense: number | null;
  sp_atk: number | null;
  sp_def: number | null;
  speed: number | null;
};

export type MoveInfo = {
  name: string | null;
  pp_current?: number | null;
  pp_max?: number | null;
  type?: string | null;
  category?: 'Physical' | 'Special' | 'Status' | null;
};

export type JudgeAppraisal = {
  phrase: string | null;
  iv_value?: number | null;
  iv_range?: [number, number] | null;
};

export type JudgeBlock = {
  hp: JudgeAppraisal | null;
  attack: JudgeAppraisal | null;
  defense: JudgeAppraisal | null;
  sp_atk: JudgeAppraisal | null;
  sp_def: JudgeAppraisal | null;
  speed: JudgeAppraisal | null;
  overall?: string | null;
};

export type Extracted = {
  game: string | null;
  pokemon: string | null;
  pokedex_number?: number | null;
  form: string | null;
  level: number | null;
  gender?: 'Male' | 'Female' | 'Genderless' | null;
  nature: string | null;
  ability: string | null;
  ability_description?: string | null;
  heldItem: string | null;
  characteristic: string | null;
  language: string | null;
  isShiny: boolean | null;
  types?: string[] | null;
  pokeball?: string | null;
  moves?: MoveInfo[] | null;
  stats: (StatBlock & { hp_current?: number | null; }) | null;
  ivs_inferred?: JudgeBlock | null;
  evs?: StatBlock | null;
  summary_analysis?: string | null;
  notes?: string[];
  confidence: number | null;
};

// --- Training Mode Types ---
export interface CompetitiveBuild {
  buildName: string;
  ability: string;
  heldItem: string;
  nature: string;
  evs: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  moves: string[];
  analysis: string;
}

export interface TrainingGuide {
  game: string;
  vitaminLocation: string;
  evHotspots: {
    hp: string;
    atk: string;
    def: string;
    spa: string;
    spd: string;
    spe: string;
  };
  consumables: {
    vitamins: string[];
    powerItems: string[];
  };
}

export interface CompetitiveAnalysis {
  grade: string;
  summary: string;
}

export interface TrainingPlan {
  build: CompetitiveBuild;
  trainingGuide: TrainingGuide;
  competitiveAnalysis: CompetitiveAnalysis;
}


export interface MoveDetails {
  name: string;
  type: string;
  damage_class: 'physical' | 'special' | 'status';
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  effect: string;
}