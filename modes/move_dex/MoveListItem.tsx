/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import type { MoveListItem } from './moveSchema.ts';
import { TYPE_ICON_BASE_URL } from '../../constants.ts';

interface MoveListItemProps {
    move: MoveListItem & { type: string; damage_class: 'physical' | 'special' | 'status' };
    isSelected: boolean;
    onSelect: (move: MoveListItem) => void;
}

const formatName = (name: string) => {
    return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const MoveListItemComponent = ({ move, isSelected, onSelect }: MoveListItemProps) => {
    return (
        <div className={`move-list-item ${isSelected ? 'active' : ''}`}
             onClick={() => onSelect(move)} role="button" tabIndex={0}
             onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(move) }}
             style={{ '--type-color': `var(--type-${move.type})` } as React.CSSProperties}>
            <div className="move-list-icons">
                 <img
                    src={`${TYPE_ICON_BASE_URL}${move.type}.svg`}
                    alt={move.type}
                    className="type-icon"
                    title={formatName(move.type)}
                 />
                 <img
                    src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/categories/${move.damage_class}.png`}
                    alt={move.damage_class}
                    className="move-damage-class-icon"
                    title={formatName(move.damage_class)}
                />
            </div>
            <div className="move-list-info">
                <div className="move-list-name">{formatName(move.name)}</div>
            </div>
        </div>
    );
};

export default React.memo(MoveListItemComponent);