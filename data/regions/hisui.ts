/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Pokemon } from '../../types.ts';

export const HISUI_POKEMON: Pokemon[] = [
  { id: 899, name: 'wyrdeer', types: ['normal', 'psychic'], base_stats: { hp: 103, atk: 105, def: 72, spa: 105, spd: 75, spe: 65 } },
  { id: 900, name: 'kleavor', types: ['bug', 'rock'], base_stats: { hp: 70, atk: 135, def: 95, spa: 45, spd: 70, spe: 85 } },
  { id: 901, name: 'ursaluna', types: ['ground', 'normal'], base_stats: { hp: 130, atk: 140, def: 105, spa: 45, spd: 80, spe: 50 } },
  { id: 902, name: 'basculegion-male', types: ['water', 'ghost'], base_stats: { hp: 120, atk: 112, def: 65, spa: 80, spd: 75, spe: 78 } },
  { id: 903, name: 'sneasler', types: ['fighting', 'poison'], base_stats: { hp: 80, atk: 130, def: 60, spa: 40, spd: 80, spe: 120 } },
  { id: 904, name: 'overqwil', types: ['dark', 'poison'], base_stats: { hp: 85, atk: 115, def: 95, spa: 65, spd: 65, spe: 85 } },
  { id: 905, name: 'enamorus-incarnate', types: ['fairy', 'flying'], base_stats: { hp: 74, atk: 115, def: 70, spa: 135, spd: 80, spe: 106 } },
];

export default HISUI_POKEMON;
