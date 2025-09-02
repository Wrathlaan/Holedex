/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useMemo } from 'react';
import ItemFilters from './ItemFilters.tsx';
import ItemListItem from './ItemListItem.tsx';
import ItemDetailPanel from './ItemDetailPanel.tsx';
import type { ItemListItem as ItemListType } from './itemSchema.ts';
import { fetchAllItems, buildItemCategoryMap } from './itemApi.ts';
import './item_dex.css';

const ItemDexView = ({ searchQuery }: { searchQuery: string }) => {
    const [allItems, setAllItems] = useState<ItemListType[]>([]);
    const [itemCategoryMap, setItemCategoryMap] = useState<Map<string, string>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<ItemListType | null>(null);
    const [activeCategories, setActiveCategories] = useState<string[]>([]);
    
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const [items, categoryMap] = await Promise.all([
                    fetchAllItems(),
                    buildItemCategoryMap()
                ]);
                setAllItems(items);
                setItemCategoryMap(categoryMap);
            } catch (e) {
                setError('Failed to load item data from PokéAPI. Please try again later.');
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredItems = useMemo(() => {
        const lowerQ = searchQuery.toLowerCase().trim();
        return allItems.filter(item => {
            const nameMatch = lowerQ === '' || item.name.includes(lowerQ);
            if (!nameMatch) return false;

            if (lowerQ !== '') return true;

            const category = itemCategoryMap.get(item.name);
            const categoryMatch = activeCategories.length === 0 || (category && activeCategories.includes(category));
            
            return categoryMatch;
        });
    }, [searchQuery, allItems, activeCategories, itemCategoryMap]);
    
    return (
        <div className="app-content item-dex-view">
            <aside className="panel item-dex-list-panel">
                <h2>All Items</h2>
                <ItemFilters
                    activeCategories={activeCategories}
                    setActiveCategories={setActiveCategories}
                    searchQuery={searchQuery}
                />
                <div className="item-dex-list">
                    {isLoading && <div className="suspense-loader" />}
                    {error && <div className="placeholder-container">{error}</div>}
                    {!isLoading && !error && filteredItems.map(item => (
                        <ItemListItem
                            key={item.name}
                            item={item}
                            category={itemCategoryMap.get(item.name)}
                            isSelected={selectedItem?.name === item.name}
                            onSelect={setSelectedItem}
                        />
                    ))}
                </div>
            </aside>
            <ItemDetailPanel
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </div>
    );
};

export default ItemDexView;