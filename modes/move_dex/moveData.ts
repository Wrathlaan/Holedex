/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import type { MoveRecord } from './moveSchema.ts';

export const SEED_MOVES: MoveRecord[] = [
  {
    id: 'flamethrower',
    name: 'Flamethrower',
    type: 'fire',
    damage_class: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    effect: '10% chance to burn the target.',
    priority: 0,
    target: 'selected-pokemon',
  },
  {
    id: 'swords-dance',
    name: 'Swords Dance',
    type: 'normal',
    damage_class: 'status',
    power: null,
    accuracy: null,
    pp: 20,
    effect: 'Sharply raises the user\'s Attack stat by two stages.',
    priority: 0,
    target: 'user',
  },
  {
    id: 'close-combat',
    name: 'Close Combat',
    type: 'fighting',
    damage_class: 'physical',
    power: 120,
    accuracy: 100,
    pp: 5,
    effect: 'Lowers the user\'s Defense and Special Defense by one stage.',
    priority: 0,
    target: 'selected-pokemon',
  },
   {
    id: 'thunderbolt',
    name: 'Thunderbolt',
    type: 'electric',
    damage_class: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    effect: '10% chance to paralyze the target.',
    priority: 0,
    target: 'selected-pokemon',
  },
];