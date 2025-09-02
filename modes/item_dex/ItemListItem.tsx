/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import type { ItemListItem } from './itemSchema.ts';

interface ItemListItemProps {
    item: ItemListItem;
    category?: string;
    isSelected: boolean;
    onSelect: (item: ItemListItem) => void;
}

const ItemListItemComponent = ({ item, category, isSelected, onSelect }: ItemListItemProps) => {
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item.name}.png`;

    return (
        <div 
            className={`item-list-item ${isSelected ? 'active' : ''}`}
            onClick={() => onSelect(item)} 
            role="button" 
            tabIndex={0} 
            onKeyDown={(e) => {if(e.key === 'Enter' || e.key === ' ') onSelect(item)}}
        >
            <img 
                src={spriteUrl} 
                alt={item.name} 
                className="item-list-sprite" 
                loading="lazy" 
                onError={(e) => { e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png` }}
            />
            <div className="item-list-info">
                <div className="item-list-name">{item.name.replace(/-/g, ' ')}</div>
                {category && <div className="item-list-category">{category.replace(/-/g, ' ')}</div>}
            </div>
        </div>
    );
};

export default React.memo(ItemListItemComponent);