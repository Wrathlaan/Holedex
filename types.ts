/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
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

export const FETCHABLE_REGIONS = ['Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Hisui', 'Paldea'];