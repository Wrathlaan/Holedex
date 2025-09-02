/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { MoveRecord } from './moveSchema.ts';

interface MoveListItem {
  name: string;
  url: string;
}

const API_BASE = 'https://pokeapi.co/api/v2';
const CACHE_VERSION = 'v1';
const ALL_MOVES_KEY = `holodex-move-list-${CACHE_VERSION}`;
const MOVE_FILTER_DATA_KEY = `holodex-move-filter-data-${CACHE_VERSION}`;

export async function fetchAllMoves(): Promise<MoveListItem[]> {
  const cached = localStorage.getItem(ALL_MOVES_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  const response = await fetch(`${API_BASE}/move?limit=1000`);
  if (!response.ok) {
    throw new Error('Failed to fetch move list from PokéAPI.');
  }
  const data = await response.json();
  const moves: MoveListItem[] = data.results;

  localStorage.setItem(ALL_MOVES_KEY, JSON.stringify(moves));
  return moves;
}

export async function fetchMoveDetails(url: string): Promise<MoveRecord> {
  const cached = sessionStorage.getItem(url);
  if (cached) {
    return JSON.parse(cached);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch move details for: ${url}`);
  }
  const details = await response.json();
  
  const englishEffectEntry = details.effect_entries.find((e: any) => e.language.name === 'en');
  const effect = englishEffectEntry ? englishEffectEntry.short_effect.replace('$effect_chance', `${details.effect_chance}%`) : 'No effect description available.';

  // FIX: Added the 'id' property to conform to the MoveRecord type.
  const formattedDetails: MoveRecord = {
    id: details.name,
    name: details.name,
    type: details.type.name,
    damage_class: details.damage_class.name,
    power: details.power,
    accuracy: details.accuracy,
    pp: details.pp,
    effect: effect,
    learned_by_pokemon: details.learned_by_pokemon.map((p: {name: string, url: string}) => ({
        name: p.name,
        id: parseInt(p.url.split('/').filter(Boolean).pop()!, 10)
    })).sort((a,b) => a.id - b.id),
  };

  sessionStorage.setItem(url, JSON.stringify(formattedDetails));
  return formattedDetails;
}

export async function buildMoveFilterData(): Promise<{typeMap: [string, string][], classMap: [string, string][]}> {
    const cached = localStorage.getItem(MOVE_FILTER_DATA_KEY);
    if (cached) {
        const data = JSON.parse(cached);
        return { typeMap: data.typeMap || [], classMap: data.classMap || [] };
    }

    const typeMap = new Map<string, string>();
    const classMap = new Map<string, string>();

    // Fetch types
    const typeListRes = await fetch(`${API_BASE}/type?limit=20`);
    const typeListData = await typeListRes.json();
    await Promise.all(typeListData.results.map(async (typeRef: { name: string, url: string }) => {
        if (typeRef.name === 'unknown' || typeRef.name === 'shadow') return;
        const res = await fetch(typeRef.url);
        if (!res.ok) return;
        const data = await res.json();
        data.moves.forEach((move: { name: string }) => typeMap.set(move.name, typeRef.name));
    }));

    // Fetch damage classes
    const dcRes = await fetch(`${API_BASE}/move-damage-class?limit=5`);
    const dcData = await dcRes.json();
     await Promise.all(dcData.results.map(async (dcRef: { name: string, url: string }) => {
        const res = await fetch(dcRef.url);
        if (!res.ok) return;
        const data = await res.json();
        data.moves.forEach((move: { name: string }) => classMap.set(move.name, dcRef.name));
    }));

    const data = {
        typeMap: Array.from(typeMap.entries()),
        classMap: Array.from(classMap.entries()),
    };
    localStorage.setItem(MOVE_FILTER_DATA_KEY, JSON.stringify(data));
    return data;
}