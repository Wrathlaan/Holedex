/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Pokemon } from '../types';

const REGIONS = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Hisui', 'Paldea'];
const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];
const TYPE_ICON_BASE_URL = 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/';

interface NavigationProps {
  currentRegion: string;
  onRegionChange: (region: string) => void;
  activeTypes: string[];
  onTypeToggle: (type: string) => void;
  favoritePokemon: Pokemon[];
  onPokemonSelect: (pokemon: Pokemon) => void;
  totalInRegion: number;
  caughtInRegion: number;
  searchQuery: string;
}

const Navigation = ({
  currentRegion,
  onRegionChange,
  activeTypes,
  onTypeToggle,
  favoritePokemon,
  onPokemonSelect,
  totalInRegion,
  caughtInRegion,
  searchQuery,
}: NavigationProps) => {

  const caughtPercentage = totalInRegion > 0 ? (caughtInRegion / totalInRegion) * 100 : 0;
  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <aside className="panel nav-panel" aria-labelledby="nav-title">
      <h2 id="nav-title">Navigation</h2>
      {isSearchActive && (
        <p className="search-active-info">Clear search to use filters.</p>
      )}
      
      <div className={`region-selector-container ${isSearchActive ? 'disabled' : ''}`}>
        <label htmlFor="region-select" className="sr-only">Select Region</label>
        <select
          id="region-select"
          className="region-select"
          value={currentRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          aria-label="Select Pokémon Region"
          disabled={isSearchActive}
        >
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div className="progress-tracker">
        <div className="progress-header">
          <h3 className="progress-title">{currentRegion} Progress</h3>
          <span className="progress-text">
            {caughtInRegion} / {totalInRegion}
          </span>
        </div>
        <div className="progress-bar-container" title={`${caughtPercentage.toFixed(1)}% Caught`}>
          <div
            className="progress-bar-fill"
            style={{ width: `${caughtPercentage}%` }}
            role="progressbar"
            aria-valuenow={caughtPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
      </div>

      <div className={`nav-panel-scrollable-content ${isSearchActive ? 'disabled' : ''}`}>
        <h3 className="filter-title">Filter by Type</h3>
        <div className="type-filter-grid">
          {POKEMON_TYPES.map(type => (
            <img
              key={type}
              src={`${TYPE_ICON_BASE_URL}${type}.svg`}
              alt={`Filter by ${type} type`}
              title={type.charAt(0).toUpperCase() + type.slice(1)}
              className={`type-icon type-filter-icon type-${type} ${activeTypes.includes(type) ? 'active' : ''}`}
              role="checkbox"
              aria-checked={activeTypes.includes(type)}
              tabIndex={isSearchActive ? -1 : 0}
              onClick={isSearchActive ? undefined : () => onTypeToggle(type)}
              onKeyDown={(e) => {
                if (!isSearchActive && (e.key === 'Enter' || e.key === ' ')) {
                  onTypeToggle(type);
                }
              }}
            />
          ))}
        </div>

        <h3 className="favorites-title">Favorites</h3>
        <div className="favorites-list">
          {favoritePokemon.length > 0 ? (
            favoritePokemon.map(pokemon => (
              <div
                key={pokemon.id}
                className="favorite-item"
                role="button"
                tabIndex={0}
                onClick={() => onPokemonSelect(pokemon)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onPokemonSelect(pokemon);
                  }
                }}
              >
                {pokemon.name}
              </div>
            ))
          ) : (
            <div className="favorites-placeholder">No favorites yet.</div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Navigation;