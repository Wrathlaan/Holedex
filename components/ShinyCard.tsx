/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { Pokemon, ShinyPokemon } from '../types';

const SHINY_SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/';

const HUNT_METHODS: Record<string, { name: string }> = {
  'full-odds': { name: 'Full Odds' },
  'masuda': { name: 'Masuda Method' },
  'sos-chain': { name: 'SOS Chaining' },
  'mass-outbreak': { name: 'Mass Outbreak' },
  'dynamax-adv': { name: 'Dynamax Adventure' },
  'shiny-charm': { name: 'Shiny Charm' },
};

// This is the visual component for the card itself.
export const ShinyCard: React.FC<{ shiny: ShinyPokemon, pokemon: Pokemon }> = ({ shiny, pokemon }) => {
    const primaryType = pokemon.types[0] || 'normal';
    const secondaryType = pokemon.types[1] || primaryType;
  
    const cardStyle = {
      '--bg-gradient': `linear-gradient(135deg, var(--type-${primaryType}) 30%, var(--type-${secondaryType}) 100%)`
    } as React.CSSProperties;
  
    return (
      <div id="shiny-card-to-export" className="shiny-card" style={cardStyle}>
        <div className="shiny-card-header">
          <img src={`${SHINY_SPRITE_BASE_URL}${shiny.pokemonId}.png`} alt={`Shiny ${shiny.name}`} className="shiny-card-sprite" />
          <div className="shiny-card-name-block">
            {shiny.nickname && <div className="shiny-card-nickname">"{shiny.nickname}"</div>}
            <div className="shiny-card-pokemon-name">{shiny.name}</div>
          </div>
        </div>
        <div className="shiny-card-details">
          <div className="shiny-card-detail">
            <span className="shiny-card-detail-label">Encounters</span>
            <span className="shiny-card-detail-value">{shiny.encounters.toLocaleString()}</span>
          </div>
          <div className="shiny-card-detail">
            <span className="shiny-card-detail-label">Method</span>
            <span className="shiny-card-detail-value">{HUNT_METHODS[shiny.method]?.name || shiny.method}</span>
          </div>
          <div className="shiny-card-detail">
            <span className="shiny-card-detail-label">Date Caught</span>
            <span className="shiny-card-detail-value">{shiny.date}</span>
          </div>
           <div className="shiny-card-detail">
            <span className="shiny-card-detail-label">Pokédex No.</span>
            <span className="shiny-card-detail-value">#{String(shiny.pokemonId).padStart(3, '0')}</span>
          </div>
        </div>
      </div>
    );
};

// This is the modal that appears when a user clicks the share button.
export const ShareShinyModal: React.FC<{ shiny: ShinyPokemon, pokemon: Pokemon, onClose: () => void }> = ({ shiny, pokemon, onClose }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copy Link');

    const handleDownload = () => {
        const cardElement = document.getElementById('shiny-card-to-export');
        if (cardElement && (window as any).html2canvas) {
            (window as any).html2canvas(cardElement, {
                backgroundColor: null, // Use transparent background
                scale: 2 // Increase resolution
            }).then((canvas: HTMLCanvasElement) => {
                const link = document.createElement('a');
                link.download = `shiny-${shiny.name.toLowerCase()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    };
    
    const handleCopyLink = () => {
        const data = btoa(JSON.stringify(shiny));
        const url = `${window.location.origin}${window.location.pathname}?view=shiny-card&data=${data}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Copy Link'), 2000);
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" style={{maxWidth: '480px'}} onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose} aria-label="Close">&times;</button>
                <div className="share-shiny-modal-content">
                    <ShinyCard shiny={shiny} pokemon={pokemon} />
                    <div className="share-shiny-controls">
                        <button onClick={handleDownload} className="theme-editor-btn primary">Download as Image</button>
                        <button onClick={handleCopyLink} className="theme-editor-btn secondary">{copyButtonText}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// This is the view for displaying a shared card via a URL.
export const SharedShinyCardView: React.FC<{ shiny: ShinyPokemon, pokemon: Pokemon }> = ({ shiny, pokemon }) => {
  useEffect(() => {
    // Clean up URL after loading the card data
    window.history.replaceState(null, '', window.location.pathname);
  }, []);
  
  return (
    <div className="shared-shiny-card-view">
        <ShinyCard shiny={shiny} pokemon={pokemon} />
    </div>
  );
};
