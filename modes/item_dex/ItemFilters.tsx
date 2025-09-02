/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { fetchAllItemCategories } from './itemApi.ts';
import type { ItemCategory } from './itemSchema.ts';

interface ItemFiltersProps {
    activeCategories: string[];
    setActiveCategories: React.Dispatch<React.SetStateAction<string[]>>;
    searchQuery: string;
}

export default function ItemFilters({ activeCategories, setActiveCategories, searchQuery }: ItemFiltersProps) {
    const [allCategories, setAllCategories] = useState<ItemCategory[]>([]);
    
    useEffect(() => {
        fetchAllItemCategories().then(setAllCategories).catch(console.error);
    }, []);

    function toggleCat(catName: string) {
        setActiveCategories(prev => {
            const newCats = new Set(prev);
            if (newCats.has(catName)) {
                newCats.delete(catName);
            } else {
                newCats.add(catName);
            }
            return Array.from(newCats);
        });
    }

    const isSearchActive = searchQuery.trim().length > 0;

    return (
        <div className="item-dex-filters">
            <div className={`category-filters ${isSearchActive ? 'disabled' : ''}`}>
                {allCategories.map((cat) => (
                    <button
                        key={cat.name}
                        onClick={() => toggleCat(cat.name)}
                        className={`item-filter-cat-btn ${activeCategories.includes(cat.name) ? "active" : ""}`}
                        disabled={isSearchActive}
                    >{cat.name.replace(/-/g, ' ')}</button>
                ))}
            </div>
        </div>
    );
}
