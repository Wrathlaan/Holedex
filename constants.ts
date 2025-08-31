/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// URLs
export const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
export const SHINY_SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/';
export const TYPE_ICON_BASE_URL = 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/';
export const POKEBALL_URL = 'https://upload.wikimedia.org/wikipedia/commons/5/53/Pok%C3%A9_Ball_icon.svg';
export const STAR_URL = 'https://upload.wikimedia.org/wikipedia/commons/2/29/Gold_Star.svg';
export const CRY_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/';

// Data
export const POKEMON_TYPES = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
export const REGIONS = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Hisui', 'Paldea'];

// Profile Component Constants
export const STAT_NAME_MAP: { [key: string]: string } = { 'hp': 'HP', 'attack': 'ATK', 'defense': 'DEF', 'special-attack': 'S.ATK', 'special-defense': 'S.DEF', 'speed': 'SPD' };
export const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
export const MAX_STAT_VALUE = 255;

// Shiny Hunting Constants
export const HUNT_METHODS: Record<string, { odds: number; charmOdds: number; name: string }> = {
  'full-odds': { odds: 4096, charmOdds: 1365, name: 'Full Odds' },
  'masuda': { odds: 683, charmOdds: 512, name: 'Masuda Method' },
  'sos-chain': { odds: 315, charmOdds: 273, name: 'SOS Chaining (Max)' },
  'mass-outbreak-sv': { odds: 1024, charmOdds: 819, name: 'Mass Outbreak (SV, 60+)' },
  'dynamax-adv': { odds: 300, charmOdds: 100, name: 'Dynamax Adventure' },
};