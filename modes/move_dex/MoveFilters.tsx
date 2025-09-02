/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import type { MoveSearchParams } from './moveSchema.ts';
import { POKEMON_TYPES, TYPE_ICON_BASE_URL } from '../../constants.ts';

interface MoveFiltersProps {
    params: MoveSearchParams;
    setParams: React.Dispatch<React.SetStateAction<MoveSearchParams>>;
}

const DAMAGE_CLASSES = ['physical', 'special', 'status'] as const;

export default function MoveFilters({ params, setParams }: MoveFiltersProps) {

    function toggleType(type: string) {
        setParams(prev => {
            const curr = new Set(prev.types || []);
            if (curr.has(type)) {
                curr.delete(type);
            } else {
                curr.add(type);
            }
            // Clear search on filter change
            return { ...prev, types: Array.from(curr), q: '' };
        });
    }
    
    function toggleDamageClass(damageClass: typeof DAMAGE_CLASSES[number]) {
        setParams(prev => {
            const curr = new Set(prev.damageClasses || []);
            if (curr.has(damageClass)) {
                curr.delete(damageClass);
            } else {
                curr.add(damageClass);
            }
            // Clear search on filter change
            return { ...prev, damageClasses: Array.from(curr), q: '' };
        });
    }

    const isSearchActive = (params.q || "").trim().length > 0;

    return (
        <div className={`move-dex-filters ${isSearchActive ? 'disabled' : ''}`}>
            <div className="move-filter-group">
                <span className="move-filter-label">Type</span>
                <div className="move-type-filters">
                    {POKEMON_TYPES.map((type) => (
                        <button
                            key={type}
                            onClick={() => toggleType(type)}
                            className={`type-filter-icon-btn ${params.types?.includes(type) ? "active" : ""}`}
                            title={type}
                            style={{'--type-color': `var(--type-${type})`} as React.CSSProperties}
                            disabled={isSearchActive}
                        >
                             <img src={`${TYPE_ICON_BASE_URL}${type}.svg`} alt={type} className={`type-icon type-${type}`} />
                        </button>
                    ))}
                </div>
            </div>
            <div className="move-filter-group">
                 <span className="move-filter-label">Category</span>
                 <div className="move-damage-class-filters">
                    {DAMAGE_CLASSES.map((dc) => (
                        <button
                            key={dc}
                            onClick={() => toggleDamageClass(dc)}
                            className={`move-dc-btn ${params.damageClasses?.includes(dc) ? "active" : ""}`}
                            disabled={isSearchActive}
                        >
                            <img src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/categories/${dc}.png`} alt={dc} />
                            <span>{dc}</span>
                        </button>
                    ))}
                 </div>
            </div>
        </div>
    );
}