/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Pokemon } from '../types';

const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
const SHINY_SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/';
const TYPE_ICON_BASE_URL = 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/';
const POKEBALL_URL = 'https://upload.wikimedia.org/wikipedia/commons/5/53/Pok%C3%A9_Ball_icon.svg';
const STAR_URL = 'https://upload.wikimedia.org/wikipedia/commons/2/29/Gold_Star.svg';

interface PokemonGridProps {
  region: string;
  filteredPokemon: Pokemon[];
  onPokemonSelect: (pokemon: Pokemon) => void;
  pokemonStatuses: Record<number, 'seen' | 'caught'>;
  onToggleStatus: (pokemonId: number) => void;
  favorites: number[];
  onToggleFavorite: (pokemonId: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
  isShinyMode: boolean;
}

const PokemonGrid = ({
  region,
  filteredPokemon,
  onPokemonSelect,
  pokemonStatuses,
  onToggleStatus,
  favorites,
  onToggleFavorite,
  searchQuery,
  onSearchChange,
  isLoading,
  isShinyMode
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
        {isLoading ? (
          <div className="grid-placeholder">Loading Pokémon...</div>
        ) : filteredPokemon.length > 0 ? (
          filteredPokemon.map((pokemon) => {
            const status = pokemonStatuses[pokemon.id] || 'seen';
            const isCaught = status === 'caught';
            const isFavorite = favorites.includes(pokemon.id);
            const spriteUrl = isShinyMode
              ? `${SHINY_SPRITE_BASE_URL}${pokemon.id}.png`
              : `${SPRITE_BASE_URL}${pokemon.id}.png`;

            // Define custom properties for type colors used in the new hover effect
            // FIX: Cast to React.CSSProperties to allow for CSS custom properties.
            const typeStyles = {
                '--type-color-1': `var(--type-${pokemon.types[0]})`,
                '--type-color-2': `var(--type-${pokemon.types[1] || pokemon.types[0]})`
            } as React.CSSProperties;
            
            return (
              <div
                key={pokemon.id}
                className="pokemon-card"
                style={typeStyles}
                data-type-count={pokemon.types.length}
                role="button"
                tabIndex={0}
                onClick={() => onPokemonSelect(pokemon)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onPokemonSelect(pokemon);
                  }
                }}
              >
                <img
                  src={STAR_URL}
                  alt={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  className={`favorite-icon-card ${isFavorite ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    onToggleFavorite(pokemon.id);
                  }}
                />
                <img
                  src={POKEBALL_URL}
                  alt={isCaught ? 'Caught' : 'Seen'}
                  title={`Status: ${isCaught ? 'Caught' : 'Seen'} (Click to toggle)`}
                  className={`status-icon-card ${!isCaught ? 'seen' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    onToggleStatus(pokemon.id);
                  }}
                />
                <img
                  src={spriteUrl}
                  alt={pokemon.name}
                  className="pokemon-card-sprite"
                  loading="lazy"
                />
                <span className="pokemon-card-id">
                  #{String(pokemon.id).padStart(3, '0')}
                </span>
                <span className="pokemon-card-name">{pokemon.name}</span>
                <div className="pokemon-card-types">
                  {pokemon.types.map((type) => (
                    <img
                      key={type}
                      src={`${TYPE_ICON_BASE_URL}${type}.svg`}
                      alt={`${type} type`}
                      className={`type-icon type-${type}`}
                      title={type.charAt(0).toUpperCase() + type.slice(1)}
                    />
                  ))}
                </div>
              </div>
            )
          })
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