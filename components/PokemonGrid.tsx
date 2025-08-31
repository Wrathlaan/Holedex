/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Pokemon } from '../types.ts';
import PokemonCard from './PokemonCard.tsx';

interface PokemonGridProps {
  region: string;
  filteredPokemon: Pokemon[];
  pokemonStatuses: Record<number, 'seen' | 'caught'>;
  onToggleStatus: (pokemonId: number) => void;
  favorites: number[];
  onToggleFavorite: (pokemonId: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isShinyMode: boolean;
  isFetchingAll: boolean;
  onPokemonSelect: (pokemon: Pokemon) => void;
}

const PokemonGrid = ({
  region,
  filteredPokemon,
  pokemonStatuses,
  onToggleStatus,
  favorites,
  onToggleFavorite,
  searchQuery,
  onSearchChange,
  isShinyMode,
  isFetchingAll,
  onPokemonSelect,
}: PokemonGridProps) => {
  const trimmedQuery = searchQuery.toLowerCase().trim();

  return (
    <main className="panel grid-panel" aria-labelledby="grid-title">
      <h2 id="grid-title">{trimmedQuery ? 'Search Results' : `Pokémon Grid - ${region}`}</h2>
      <input
        type="text"
        placeholder="Search all Pokémon by name or #"
        className="search-input"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search all Pokémon by name or number"
      />
      <div className="pokemon-grid">
        {isFetchingAll ? (
          <div className="grid-placeholder">Loading all Pokémon for search...</div>
        ) : filteredPokemon.length > 0 ? (
          filteredPokemon.map((pokemon) => (
            <PokemonCard
              key={pokemon.id}
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