/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { fetchItemDetails } from './itemApi.ts';
import type { ItemRecord, ItemListItem } from './itemSchema.ts';

interface ItemDetailPanelProps {
    item: ItemListItem | null;
    onClose: () => void;
}

export default function ItemDetailPanel({ item, onClose }: ItemDetailPanelProps) {
    const [details, setDetails] = useState<ItemRecord | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDetails = async () => {
            if (!item) {
                setDetails(null);
                return;
            };
            setIsLoading(true);
            setError(null);
            try {
                const fetchedDetails = await fetchItemDetails(item.url);
                setDetails(fetchedDetails);
            } catch (e) {
                setError("Could not load item details.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadDetails();
    }, [item]);
    
    if (!item) {
        return (
            <section className="panel item-dex-detail-panel">
                <div className="placeholder-container">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z" /></svg>
                    <p>Select an item to see its details.</p>
                </div>
            </section>
        );
    }
    
    const englishFlavorText = details?.flavor_text_entries?.find(e => e.language.name === 'en')?.text;
    const englishEffect = details?.effect_entries?.find(e => e.language.name === 'en')?.short_effect;
    const categoryName = details ? (typeof details.category === 'string' ? details.category : details.category.name) : '';

    return (
        <section className="panel item-dex-detail-panel">
            <button className="item-detail-close-btn" onClick={onClose} aria-label="Close item details">&times;</button>
            {isLoading && <div className="suspense-loader" />}
            {error && <div className="placeholder-container">{error}</div>}
            {details && (
                 <>
                    <div className="item-detail-header">
                        <img src={details.sprites?.default || ''} alt={details.name} className="item-detail-icon" />
                        <div>
                            <div className="item-detail-name">{details.name.replace(/-/g, ' ')}</div>
                            <div className="item-detail-category">{categoryName.replace(/-/g, ' ')}</div>
                        </div>
                    </div>
                    <div className="item-detail-body">
                        {englishFlavorText && (
                            <section>
                                <p className="item-detail-text item-flavor-text">{englishFlavorText.replace(/[\n\f]/g, ' ')}</p>
                            </section>
                        )}
                        <section>
                            <h3 className="item-detail-section-title">Effect</h3>
                            <p className="item-detail-text">{englishEffect || 'No effect description available.'}</p>
                        </section>
                        <section>
                            <h3 className="item-detail-section-title">Data</h3>
                            <div className="item-detail-data-grid">
                                <div className="item-detail-data-item"><label>Cost</label><span>{details.cost && details.cost > 0 ? `${details.cost.toLocaleString()} ₽` : 'Not for sale'}</span></div>
                                <div className="item-detail-data-item"><label>Fling Power</label><span>{details.fling_power ?? 'N/A'}</span></div>
                                {details.attributes && details.attributes.length > 0 && (
                                     <div className="item-detail-data-item full-span">
                                         <label>Attributes</label>
                                         <div className="item-attributes-list">
                                             {details.attributes.map(attr => <span key={attr.name} className="item-attribute-tag">{attr.name.replace(/-/g, ' ')}</span>)}
                                         </div>
                                     </div>
                                )}
                            </div>
                        </section>
                    </div>
                 </>
            )}
        </aside>
    );
}