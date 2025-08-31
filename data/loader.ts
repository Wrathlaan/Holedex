/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Pokemon } from '../types.ts';

export const regionLoaders: Record<string, () => Promise<{ default: Pokemon[] }>> = {
  'Kanto': () => import('./regions/kanto.ts'),
  'Johto': () => import('./regions/johto.ts'),
  'Hoenn': () => import('./regions/hoenn.ts'),
  'Sinnoh': () => import('./regions/sinnoh.ts'),
  'Unova': () => import('./regions/unova.ts'),
  'Kalos': () => import('./regions/kalos.ts'),
  'Alola': () => import('./regions/alola.ts'),
  'Galar': () => import('./regions/galar.ts'),
  'Hisui': () => import('./regions/hisui.ts'),
  'Paldea': () => import('./regions/paldea.ts'),
};