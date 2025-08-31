/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import Navigation from '../../components/Navigation';
import PokemonGrid from '../../components/PokemonGrid';
import NewsFeed from '../../components/NewsFeed';
import { Pokemon } from '../../types';

interface PokedexViewProps {
  currentRegion: string;
  onRegionChange: (region: string) => void;
  activeTypes: string[];
  onTypeToggle: (type: string) => void;
  favoritePokemon: Pokemon[];
  onPokemonSelect: (pokemon: Pokemon, context: Pokemon[]) => void;
  totalInRegion: number;
  caughtInRegion: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  pokemonStatuses: Record<number, 'seen' | 'caught'>;
  onToggleStatus: (pokemonId: number) => void;
  pokemonList: Pokemon[];
  regionRanges: { [key: string]: { start: number; end: number } };
  favorites: number[];
  onToggleFavorite: (pokemonId: number) => void;
  isLoading: boolean;
  isShinyMode: boolean;
}

const PokedexView = (props: PokedexViewProps) => {
  const {
    currentRegion,
    activeTypes,
    searchQuery,
    pokemonList,
    regionRanges,
  } = props;

  const trimmedQuery = searchQuery.toLowerCase().trim();
  let filteredPokemon: Pokemon[];

  if (trimmedQuery) {
    // If there is a search query, search all pokemon, ignoring region and type filters.
    filteredPokemon = pokemonList.filter(pokemon => {
      return (
        pokemon.name.toLowerCase().includes(trimmedQuery) ||
        String(pokemon.id) === trimmedQuery
      );
    });
  } else {
    // Otherwise, apply region and type filters as before.
    const range = regionRanges[currentRegion] || { start: 0, end: 0 };
    const regionPokemon = pokemonList.filter(
      (pokemon) => pokemon.id >= range.start && pokemon.id <= range.end
    );
    filteredPokemon = activeTypes.length > 0
      ? regionPokemon.filter(pokemon =>
          pokemon.types.some(type => activeTypes.includes(type))
        )
      : regionPokemon;
  }

  return (
    <div className="app-content">
      <Navigation
        currentRegion={props.currentRegion}
        onRegionChange={props.onRegionChange}
        activeTypes={props.activeTypes}
        onTypeToggle={props.onTypeToggle}
        favoritePokemon={props.favoritePokemon}
        onPokemonSelect={(p) => props.onPokemonSelect(p, filteredPokemon)}
        totalInRegion={props.totalInRegion}
        caughtInRegion={props.caughtInRegion}
        searchQuery={props.searchQuery}
      />
      <PokemonGrid
        region={props.currentRegion}
        filteredPokemon={filteredPokemon}
        onPokemonSelect={(p) => props.onPokemonSelect(p, filteredPokemon)}
        pokemonStatuses={props.pokemonStatuses}
        onToggleStatus={props.onToggleStatus}
        favorites={props.favorites}
        onToggleFavorite={props.onToggleFavorite}
        searchQuery={props.searchQuery}
        onSearchChange={props.onSearchChange}
        isLoading={props.isLoading}
        isShinyMode={props.isShinyMode}
      />
      <NewsFeed />
    </div>
  );
};

export default PokedexView;