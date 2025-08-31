/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Pokemon } from '../../types.ts';

export const HISUI_POKEMON: Pokemon[] = [
  { id: 899, name: 'wyrdeer', types: ['normal', 'psychic'] },
  { id: 900, name: 'kleavor', types: ['bug', 'rock'] },
  { id: 901, name: 'ursaluna', types: ['ground', 'normal'] },
  { id: 902, name: 'basculegion-male', types: ['water', 'ghost'] },
  { id: 903, name: 'sneasler', types: ['fighting', 'poison'] },
  { id: 904, name: 'overqwil', types: ['dark', 'poison'] },
  { id: 905, name: 'enamorus-incarnate', types: ['fairy', 'flying'] },
];

// FIX: Add default export to be compatible with dynamic import in data/loader.ts
export default HISUI_POKEMON;