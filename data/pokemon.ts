/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { KANTO_POKEMON } from './regions/kanto';
import { JOHTO_POKEMON } from './regions/johto';
import { HOENN_POKEMON } from './regions/hoenn';
import { SINNOH_POKEMON } from './regions/sinnoh';
import { UNOVA_POKEMON } from './regions/unova';
import { KALOS_POKEMON } from './regions/kalos';
import { ALOLA_POKEMON } from './regions/alola';
import { GALAR_POKEMON } from './regions/galar';
import { HISUI_POKEMON } from './regions/hisui';
import { PALDEA_POKEMON } from './regions/paldea';

export const POKEMON_LIST_KANTO = KANTO_POKEMON;

export const POKEMON_LIST_ALL = [
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
