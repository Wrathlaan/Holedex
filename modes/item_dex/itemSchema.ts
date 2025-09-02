/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// These types align with the data structure from PokéAPI v2.
// See types.ts for the full ItemDetails interface.
import type { ItemDetails as PokeApiItemDetails } from '../../types.ts';

/** A record for an item in the main list, fetched from `api/v2/item`. */
export interface ItemListItem {
  name: string;
  url: string;
}

/** A record for an item category, fetched from `api/v2/item-category`. */
export interface ItemCategory {
    name: string;
    url: string;
}

// FIX: Added exported ItemAvailability interface
export interface ItemAvailability {
    game: string;
    generation: number;
    methods: string[];
}

export interface ItemPricing {
    buy?: number | null;
    sell?: number | null;
    currency?: string | null;
}

/** The full, detailed record for a single item, combining seed, PokeAPI, and Gemini data. */
// FIX: Replaced ItemRecord alias with a full interface to support seed, PokeAPI, and Gemini fields.
export interface ItemRecord extends Omit<PokeApiItemDetails, 'id' | 'category'> {
    id: string | number;
    category: string | { name: string; };
    icon?: string;
    
    effect?: {
        summary: string;
        battle?: string | null;
        field?: string | null;
        perGeneration?: Record<string, string> | null;
    };
    
    availability?: ItemAvailability[];
    pricing?: ItemPricing;
    pricingByGame?: Record<string, ItemPricing>;
    tags?: string[];
    relatedPokemon?: string[];
    relatedItems?: string[];
}
