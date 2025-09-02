/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import type { MoveRecord, MoveListItem } from './moveSchema.ts';
import { fetchMoveDetails } from './moveApi.ts';
// FIX: Corrected function name from enrichMoveWithGemini to enrichMovesWithGemini.
import { enrichMovesWithGemini } from './geminiMoves.ts';
import { TYPE_ICON_BASE_URL, SPRITE_BASE_URL } from '../../constants.ts';

interface MoveDetailPanelProps {
    move: MoveListItem | null;
    onClose: () => void;
}

const formatName = (name: string) => {
    if (!name) return '';
    return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const notableUsersCache = new Map<string, MoveRecord['notableUsers']>();

export default function MoveDetailPanel({ move, onClose }: MoveDetailPanelProps) {
    const [details, setDetails] = useState<MoveRecord | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDetails = async () => {
            if (!move) {
                setDetails(null);
                return;
            };

            setIsLoading(true);
            setError(null);
            try {
                // Fetch base details from PokeAPI
                let fetchedDetails = await fetchMoveDetails(move.url);
                setDetails(fetchedDetails); // Show base details immediately

                // Then, enrich with Gemini data (if not cached)
                if (notableUsersCache.has(fetchedDetails.id)) {
                    fetchedDetails.notableUsers = notableUsersCache.get(fetchedDetails.id);
                } else {
                    const [enrichedMove] = await enrichMovesWithGemini([fetchedDetails]);
                    if (enrichedMove) {
                        fetchedDetails.notableUsers = enrichedMove.notableUsers;
                        notableUsersCache.set(fetchedDetails.id, enrichedMove.notableUsers);
                    }
                }
                
                setDetails({ ...fetchedDetails });

            } catch (e) {
                setError("Could not load move details.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadDetails();
    }, [move]);
    
    if (!move) {
        return (
            <section className="panel move-dex-detail-panel">
                <div className="placeholder-container">
                     <svg viewBox="0 0 24 24"><path fill="currentColor" d="M14.07,14.28L13.09,15.25L14.08,16.25L15.06,15.27M18,3H6C4.89,3 4,3.89 4,5V19C4,20.11 4.89,21 6,21H18C19.11,21 20,20.11 20,19V5C20,3.89 19.11,3 18,3M18,19H6V5H18V19M8.94,15.27L9.92,16.25L8.93,14.28L9.92,15.25M11,11.5L12,10.5L13,11.5L12,12.5M12,9.47L13,8.5L12,7.5L11,8.5M8.5,8.97L9.5,8L8.5,7L7.5,8M15.5,8.97L14.5,8L15.5,7L16.5,8M8.5,12L7.5,11L8.5,10L9.5,11M15.5,12L16.5,11L15.5,10L14.5,11Z" /></svg>
                    <p>Select a move to see its details.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="panel move-dex-detail-panel">
            {details && <button className="move-detail-close-btn" onClick={onClose} aria-label="Close move details">&times;</button>}
            
            {(isLoading && !details) && <div className="suspense-loader" />}
            {error && <div className="placeholder-container">{error}</div>}
            
            {details && (
                <>
                    <div className="move-detail-header" style={{'--type-color': `var(--type-${details.type})`} as React.CSSProperties}>
                        <div className="move-detail-title-group">
                            <div className="move-detail-name">{formatName(details.name)}</div>
                            <div className="move-detail-pills">
                                <div className="move-detail-pill">
                                    <img src={`${TYPE_ICON_BASE_URL}${details.type}.svg`} alt={details.type} className="type-icon"/>
                                    <span>{formatName(details.type)}</span>
                                </div>
                                <div className="move-detail-pill">
                                    <img src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/categories/${details.damage_class}.png`} alt={details.damage_class} />
                                    <span>{formatName(details.damage_class)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="move-detail-body">
                        <section>
                            <h3 className="move-detail-section-title">Effect</h3>
                            <p className="move-detail-text">{details.effect}</p>
                        </section>

                        <section>
                            <h3 className="move-detail-section-title">Stats</h3>
                            <div className="move-detail-stats-grid">
                                <div className="move-detail-stat-item"><label>Power</label><span>{details.power ?? '—'}</span></div>
                                <div className="move-detail-stat-item"><label>Accuracy</label><span>{details.accuracy ? `${details.accuracy}%` : '—'}</span></div>
                                <div className="move-detail-stat-item"><label>PP</label><span>{details.pp}</span></div>
                            </div>
                        </section>
                        
                        <section>
                            <h3 className="move-detail-section-title">Notable Users</h3>
                             {(isLoading && !details.notableUsers) ? <div className="suspense-loader" /> : (details.notableUsers && details.notableUsers.length > 0) ? (
                                <div className="move-detail-user-grid">
                                    {details.notableUsers.map(user => (
                                        <div key={user.pokemonId} className="move-detail-user-item" title={formatName(user.pokemonName)}>
                                            <img src={`${SPRITE_BASE_URL}${user.pokemonId}.png`} alt={user.pokemonName}/>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="move-detail-text">No specific notable users found.</p>}
                        </section>

                        {details.learned_by_pokemon && details.learned_by_pokemon.length > 0 && (
                            <section>
                                <h3 className="move-detail-section-title">Learnable By ({details.learned_by_pokemon.length})</h3>
                                <div className="move-detail-user-grid">
                                    {details.learned_by_pokemon.map(user => (
                                        <div key={user.id} className="move-detail-user-item" title={formatName(user.name)}>
                                            <img src={`${SPRITE_BASE_URL}${user.id}.png`} alt={user.name}/>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </>
            )}
        </aside>
    );
}