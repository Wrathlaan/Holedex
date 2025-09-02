/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Pokemon } from '../types.ts';
import { SPRITE_BASE_URL, SHINY_SPRITE_BASE_URL, TYPE_ICON_BASE_URL, POKEBALL_URL, STAR_URL } from '../constants.ts';

interface PokemonCardProps {
  pokemon: Pokemon;
  status: 'seen' | 'caught';
  isFavorite: boolean;
  isShinyMode: boolean;
  onToggleStatus: (pokemonId: number) => void;
  onToggleFavorite: (pokemonId: number) => void;
  onSelect: () => void;
}

const PokemonCard = ({
  pokemon,
  status,
  isFavorite,
  isShinyMode,
  onToggleStatus,
  onToggleFavorite,
  onSelect,
}: PokemonCardProps) => {
  const isCaught = status === 'caught';
  const spriteId = pokemon.spriteId || pokemon.id;
  const spriteUrl = isShinyMode
    ? `${SHINY_SPRITE_BASE_URL}${spriteId}.png`
    : `${SPRITE_BASE_URL}${spriteId}.png`;

  const typeStyles = {
      '--type-color-1': `var(--type-${pokemon.types[0]})`,
      '--type-color-2': `var(--type-${pokemon.types[1] || pokemon.types[0]})`
  } as React.CSSProperties;
  
  return (
    <div
      className="pokemon-card"
      style={typeStyles}
      data-type-count={pokemon.types.length}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${pokemon.name}`}
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
  );
};

export default React.memo(PokemonCard);