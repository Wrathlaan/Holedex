/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Pokemon } from '../types.ts';

import { KANTO_POKEMON } from './regions/kanto.ts';
import { JOHTO_POKEMON } from './regions/johto.ts';
import { HOENN_POKEMON } from './regions/hoenn.ts';
import { SINNOH_POKEMON } from './regions/sinnoh.ts';
import { UNOVA_POKEMON } from './regions/unova.ts';
import { KALOS_POKEMON } from './regions/kalos.ts';
import { ALOLA_POKEMON } from './regions/alola.ts';
import { GALAR_POKEMON } from './regions/galar.ts';
import { HISUI_POKEMON } from './regions/hisui.ts';
import { PALDEA_POKEMON } from './regions/paldea.ts';

const combinedPokemon: Pokemon[] = [
  ...KANTO_POKEMON,
  ...JOHTO_POKEMON,
  ...HOENN_POKEMON,
  ...SINNOH_POKEMON,
  ...UNOVA_POKEMON,
  ...KALOS_POKEMON,
  ...ALOLA_POKEMON,
  ...GALAR_POKEMON,
  ...HISUI_POKEMON,
  ...PALDEA_POKEMON,
];

// Sort by ID to ensure proper order
combinedPokemon.sort((a, b) => a.id - b.id);

export const ALL_POKEMON: Pokemon[] = combinedPokemon;
