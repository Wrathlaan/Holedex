/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import type { ItemListItem, ItemCategory, ItemRecord } from './itemSchema.ts';

const API_BASE = 'https://pokeapi.co/api/v2';
const CACHE_VERSION = 'v1';
const ALL_ITEMS_KEY = `holodex-item-list-${CACHE_VERSION}`;
const ALL_CATEGORIES_KEY = `holodex-item-categories-${CACHE_VERSION}`;
const ITEM_CATEGORY_MAP_KEY = `holodex-item-category-map-${CACHE_VERSION}`;

// Fetch and cache the master list of all items
export async function fetchAllItems(): Promise<ItemListItem[]> {
  const cached = localStorage.getItem(ALL_ITEMS_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  const response = await fetch(`${API_BASE}/item?limit=2100`);
  if (!response.ok) {
    throw new Error('Failed to fetch item list from PokéAPI.');
  }
  const data = await response.json();
  const items: ItemListItem[] = data.results;

  localStorage.setItem(ALL_ITEMS_KEY, JSON.stringify(items));
  return items;
}

// Fetch and cache the details for a single item for the session
export async function fetchItemDetails(url: string): Promise<ItemRecord> {
  const cached = sessionStorage.getItem(url);
  if (cached) {
    return JSON.parse(cached);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch item details for: ${url}`);
  }
  const details: ItemRecord = await response.json();

  sessionStorage.setItem(url, JSON.stringify(details));
  return details;
}

// Fetch and cache the list of all item categories
export async function fetchAllItemCategories(): Promise<ItemCategory[]> {
    const cached = localStorage.getItem(ALL_CATEGORIES_KEY);
    if (cached) {
        return JSON.parse(cached);
    }

    const response = await fetch(`${API_BASE}/item-category?limit=50`);
    if (!response.ok) {
        throw new Error('Failed to fetch item categories from PokéAPI.');
    }
    const data = await response.json();
    const categories: ItemCategory[] = data.results;

    localStorage.setItem(ALL_CATEGORIES_KEY, JSON.stringify(categories));
    return categories;
}

export async function buildItemCategoryMap(): Promise<Map<string, string>> {
    const cached = localStorage.getItem(ITEM_CATEGORY_MAP_KEY);
    if (cached) {
        return new Map(JSON.parse(cached));
    }

    const categories = await fetchAllItemCategories();
    const map = new Map<string, string>();

    await Promise.all(categories.map(async (category) => {
        if (!category.url) return;
        const res = await fetch(category.url);
        if (!res.ok) return;
        const data = await res.json();
        data.items.forEach((item: { name: string }) => {
            map.set(item.name, category.name);
        });
    }));

    localStorage.setItem(ITEM_CATEGORY_MAP_KEY, JSON.stringify(Array.from(map.entries())));
    return map;
}
