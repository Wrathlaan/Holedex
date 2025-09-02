/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Pokemon } from '../types.ts';
import PokemonCard from './PokemonCard.tsx';
import { POKEMON_TYPES, TYPE_ICON_BASE_URL } from '../constants.ts';

interface PokemonGridProps {
  region: string;
  filteredPokemon: Pokemon[];
  pokemonStatuses: Record<number, 'seen' | 'caught'>;
  onToggleStatus: (pokemonId: number) => void;
  favorites: number[];
  onToggleFavorite: (pokemonId: number) => void;
  searchQuery: string;
  isShinyMode: boolean;
  onToggleShinyMode: () => void;
  isFetchingAll: boolean;
  onPokemonSelect: (pokemon: Pokemon) => void;
  activeTypes: string[];
  onTypeToggle: (type: string) => void;
}

const PokemonGrid = ({
  region,
  filteredPokemon,
  pokemonStatuses,
  onToggleStatus,
  favorites,
  onToggleFavorite,
  searchQuery,
  isShinyMode,
  onToggleShinyMode,
  isFetchingAll,
  onPokemonSelect,
  activeTypes,
  onTypeToggle,
}: PokemonGridProps) => {
  const trimmedQuery = searchQuery.toLowerCase().trim();
  const isSearchActive = trimmedQuery.length > 0;

  return (
    <main className="panel grid-panel" aria-labelledby="grid-title">
      <div className="grid-header">
        <button
          onClick={onToggleShinyMode}
          className={`shiny-toggle-btn ${isShinyMode ? 'active' : ''}`}
          aria-pressed={isShinyMode}
          aria-label="Toggle Shiny Pokémon Sprites"
          title="Toggle Shiny Sprites"
        >
          <svg className="shiny-toggle-svg" viewBox="0 0 24 24">
            <title>Toggle Shiny Sprites</title>
            <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
          </svg>
        </button>
        <h2 id="grid-title">{trimmedQuery ? 'Search Results' : `Pokémon Grid - ${region}`}</h2>
      </div>
      <div className={`type-filter-bar ${isSearchActive ? 'disabled' : ''}`}>
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
      <div className="pokemon-grid">
        {isFetchingAll ? (
          <div className="grid-placeholder">Loading all Pokémon for search...</div>
        ) : filteredPokemon.length > 0 ? (
          filteredPokemon.map((pokemon) => (
            <PokemonCard
              key={pokemon.name}
              pokemon={pokemon}
              status={pokemonStatuses[pokemon.id] || 'seen'}
              isFavorite={favorites.includes(pokemon.id)}
              isShinyMode={isShinyMode}
              onToggleStatus={onToggleStatus}
              onToggleFavorite={onToggleFavorite}
              onSelect={() => onPokemonSelect(pokemon)}
            />
          ))
        ) : (
          <div className="grid-placeholder">
            {trimmedQuery
              ? `No Pokémon found for "${searchQuery.trim()}".`
              : 'No Pokémon match the current filters.'}
          </div>
        )}
      </div>
    </main>
  );
};

export default PokemonGrid;