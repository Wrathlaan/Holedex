/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useMemo } from 'react';
import MoveFilters from './MoveFilters.tsx';
import MoveListItem from './MoveListItem.tsx';
import MoveDetailPanel from './MoveDetailPanel.tsx';
import type { MoveListItem as MoveListType, MoveSearchParams } from './moveSchema.ts';
import { fetchAllMoves, buildMoveFilterData } from './moveApi.ts';
import './move_dex.css';

const MoveDexView = ({ searchQuery }: { searchQuery: string }) => {
    const [allMoves, setAllMoves] = useState<MoveListType[]>([]);
    const [filterData, setFilterData] = useState<{typeMap: Map<string, string>, classMap: Map<string, string>}>({ typeMap: new Map(), classMap: new Map() });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMove, setSelectedMove] = useState<MoveListType | null>(null);
    const [params, setParams] = useState<MoveSearchParams>({ q: searchQuery, types: [], damageClasses: [] });

    useEffect(() => {
        setParams(p => ({ ...p, q: searchQuery }));
    }, [searchQuery]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const [moves, { typeMap, classMap }] = await Promise.all([
                    fetchAllMoves(),
                    buildMoveFilterData()
                ]);
                setAllMoves(moves);
                setFilterData({ typeMap: new Map(typeMap), classMap: new Map(classMap) });
            } catch (e) {
                setError('Failed to load move data. Please try again later.');
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredMoves = useMemo(() => {
        const lowerQ = (params.q || "").toLowerCase().trim();
        const isSearchActive = lowerQ !== '';

        return allMoves.filter(move => {
            const nameMatch = isSearchActive ? move.name.includes(lowerQ) : true;
            if (!nameMatch) return false;
            
            if (isSearchActive) return true; // Don't apply filters when searching

            const moveType = filterData.typeMap.get(move.name);
            const moveClass = filterData.classMap.get(move.name);

            const typeMatch = params.types!.length === 0 || (moveType && params.types!.includes(moveType));
            const classMatch = params.damageClasses!.length === 0 || (moveClass && params.damageClasses!.includes(moveClass as any));
            
            return typeMatch && classMatch;
        });
    }, [params, allMoves, filterData]);

    return (
        <div className="app-content move-dex-view">
            <aside className="panel move-dex-list-panel">
                <h2>All Moves</h2>
                <MoveFilters params={params} setParams={setParams} />
                <div className="move-dex-list">
                    {isLoading && <div className="suspense-loader" />}
                    {error && <div className="placeholder-container">{error}</div>}
                    {!isLoading && !error && filteredMoves.map(move => {
                        const moveType = filterData.typeMap.get(move.name);
                        const moveClass = filterData.classMap.get(move.name);
                        if (!moveType || !moveClass) return null;
                        return (
                            <MoveListItem
                                key={move.name}
                                move={{ ...move, type: moveType, damage_class: moveClass as any }}
                                onSelect={setSelectedMove}
                                isSelected={selectedMove?.name === move.name}
                            />
                        )
                    })}
                </div>
            </aside>
            <MoveDetailPanel
                move={selectedMove}
                onClose={() => setSelectedMove(null)}
            />
        </div>
    );
};

export default MoveDexView;