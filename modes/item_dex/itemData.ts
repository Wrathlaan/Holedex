/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import type { ItemRecord } from './itemSchema.ts';

// FIX: Added missing properties to conform to the ItemRecord type.
// This seed data is minimal and will be enriched by API calls.
export const SEED_ITEMS: ItemRecord[] = [
  {
    id: 'potion',
    name: 'Potion',
    category: 'Healing',
    icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',
    effect: { summary: 'Restores 20 HP to a Pokémon.' },
    availability: [
      { game: 'Red/Blue/Yellow', generation: 1, methods: ['Poké Mart'] },
    ],
    pricing: { buy: 200, sell: 100 },
    // Properties required by ItemRecord
    cost: 200,
    sprites: { default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png' },
    effect_entries: [{ effect: 'Restores 20 HP to a Pokémon.', short_effect: 'Restores 20 HP.', language: { name: 'en', url: '' } }],
    flavor_text_entries: [],
    fling_power: null,
    attributes: [],
  },
  {
    id: 'poke-ball',
    name: 'Poké Ball',
    category: 'Poké Ball',
    icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
    effect: { summary: 'A device for catching wild Pokémon.' },
    availability: [
       { game: 'Red/Blue/Yellow', generation: 1, methods: ['Poké Mart'] },
    ],
    pricing: { buy: 200, sell: 100 },
    // Properties required by ItemRecord
    cost: 200,
    sprites: { default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png' },
    effect_entries: [{ effect: 'A device for catching wild Pokémon.', short_effect: 'A device for catching wild Pokémon.', language: { name: 'en', url: '' } }],
    flavor_text_entries: [],
    fling_power: null,
    attributes: [],
  },
  {
    id: 'fire-stone',
    name: 'Fire Stone',
    category: 'Evolution',
    icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-stone.png',
    effect: { summary: 'Causes certain species of Pokémon to evolve.' },
    availability: [
       { game: 'Red/Blue/Yellow', generation: 1, methods: ['Celadon Dept. Store'] },
    ],
    pricing: { buy: 2100, sell: 1050 },
    relatedPokemon: ['Vulpix', 'Growlithe', 'Eevee'],
    // Properties required by ItemRecord
    cost: 2100,
    sprites: { default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-stone.png' },
    effect_entries: [{ effect: 'Causes certain species of Pokémon to evolve.', short_effect: 'Causes certain species of Pokémon to evolve.', language: { name: 'en', url: '' } }],
    flavor_text_entries: [],
    fling_power: null,
    attributes: [],
  },
   {
    id: 'leftovers',
    name: 'Leftovers',
    category: 'Held',
    icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leftovers.png',
    effect: { summary: 'An item to be held by a Pokémon. The holder\'s HP is gradually restored during battle.' },
    availability: [
       { game: 'Gold/Silver', generation: 2, methods: ['Held by wild Snorlax'] },
    ],
    pricing: { sell: 100 },
    // Properties required by ItemRecord
    cost: 0,
    sprites: { default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leftovers.png' },
    effect_entries: [{ effect: 'An item to be held by a Pokémon. The holder\'s HP is gradually restored during battle.', short_effect: 'Restores HP during battle.', language: { name: 'en', url: '' } }],
    flavor_text_entries: [],
    fling_power: 10,
    attributes: [],
  },
  {
    id: 'tm01',
    name: 'TM01 (Focus Punch)',
    category: 'TM/TR/HM',
    icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/tm-normal.png',
    effect: { summary: 'The user focuses its mind before launching a punch. This move fails if the user is hit before it is used.' },
    availability: [],
    // Properties required by ItemRecord
    cost: 0,
    sprites: { default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/tm-normal.png' },
    effect_entries: [{ effect: 'The user focuses its mind before launching a punch. This move fails if the user is hit before it is used.', short_effect: 'Fails if user is hit.', language: { name: 'en', url: '' } }],
    flavor_text_entries: [],
    fling_power: null,
    attributes: [],
  },
];
