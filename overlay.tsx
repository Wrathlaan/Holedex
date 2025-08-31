/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Pokemon } from './types.ts';

const SHINY_SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/';
const HUNTS_STORAGE_KEY = 'holodex-shiny-hunts';

interface Hunt {
  id: number;
  target: Pokemon;
  count: number;
  method: string;
}

interface StoredHunts {
    hunts: Hunt[];
    activeHuntId: number | null;
}

const OverlayView = () => {
    const [activeHunt, setActiveHunt] = useState<Hunt | null>(null);

    const loadData = () => {
        try {
            const savedHunts = localStorage.getItem(HUNTS_STORAGE_KEY);
            if (savedHunts) {
                const { hunts, activeHuntId } = JSON.parse(savedHunts) as StoredHunts;
                const currentActiveHunt = hunts.find(h => h.id === activeHuntId) || null;
                setActiveHunt(currentActiveHunt);
            } else {
                setActiveHunt(null);
            }
        } catch (e) {
            console.error("Failed to load overlay data from localStorage", e);
            setActiveHunt(null);
        }
    };

    useEffect(() => {
        // Initial load
        loadData();

        // Listen for changes from the main app
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === HUNTS_STORAGE_KEY) {
                loadData();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    if (!activeHunt) {
        return null; // Render nothing if no active hunt
    }

    return (
        <div className="overlay-container">
            <img 
                src={`${SHINY_SPRITE_BASE_URL}${activeHunt.target.id}.png`} 
                alt={activeHunt.target.name}
                className="overlay-sprite"
            />
            <div className="overlay-info">
                <div className="overlay-pokemon-name">{activeHunt.target.name}</div>
                <div className="overlay-encounter-count">{activeHunt.count.toLocaleString()}</div>
            </div>
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <OverlayView />
    </React.StrictMode>
  );
}