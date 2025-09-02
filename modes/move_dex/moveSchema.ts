/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// These types align with the data structure from PokéAPI v2.

/** A record for a move in the main list, fetched from `api/v2/move`. */
export interface MoveListItem {
  name: string;
  url: string;
}

/** The full, detailed record for a single move, fetched from its specific URL. */
export interface MoveRecord {
  // FIX: Add 'id' property to align with seed data and Gemini schema.
  id: string;
  name: string;
  type: string;
  damage_class: 'physical' | 'special' | 'status';
  power: number | null;
  accuracy: number | null;
  pp: number;
  effect: string;
  // FIX: Make 'learned_by_pokemon' optional as it's not present in seed data.
  learned_by_pokemon?: { name: string; id: number }[];
  // FIX: Add optional properties from Gemini/seed data for consistency.
  priority?: number;
  target?: string;
  notableUsers?: { pokemonName: string; pokemonId: number; }[];
}

export interface MoveSearchParams {
  q?: string;
  types?: string[];
  damageClasses?: ('physical' | 'special' | 'status')[];
}