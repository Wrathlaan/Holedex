/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useMemo } from 'react';
import Navigation from '../../components/Navigation.tsx';
import PokemonGrid from '../../components/PokemonGrid.tsx';
import NewsFeed from '../../components/NewsFeed.tsx';
import { Pokemon } from '../../types.ts';
import './pokedex.css';

interface PokedexViewProps {
  currentRegion: string;
  onRegionChange: (region: string) => void;
  activeTypes: string[];
  onTypeToggle: (type: string) => void;
  favoritePokemon: Pokemon[];
  totalInRegion: number;
  caughtInRegion: number;
  searchQuery: string;
  pokemonStatuses: Record<number, 'seen' | 'caught'>;
  onToggleStatus: (pokemonId: number) => void;
  pokemonList: Pokemon[];
  regionRanges: { [key: string]: { start: number; end: number } };
  favorites: number[];
  onToggleFavorite: (pokemonId: number) => void;
  isShinyMode: boolean;
  onToggleShinyMode: () => void;
  onPokemonSelect: (pokemon: Pokemon) => void;
}

const PokedexView = (props: PokedexViewProps) => {
  const {
    currentRegion,
    activeTypes,
    searchQuery,
    pokemonList,
    regionRanges,
  } = props;

  const filteredPokemon = useMemo(() => {
    const trimmedQuery = searchQuery.toLowerCase().trim();
    if (trimmedQuery) {
      // If there is a search query, search all loaded pokemon.
      return pokemonList.filter(pokemon => {
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
      return activeTypes.length > 0
        ? regionPokemon.filter(pokemon =>
            pokemon.types.some(type => activeTypes.includes(type))
          )
        : regionPokemon;
    }
  }, [searchQuery, pokemonList, regionRanges, currentRegion, activeTypes]);

  return (
    <div className="app-content">
      <Navigation
        currentRegion={props.currentRegion}
        onRegionChange={props.onRegionChange}
        favoritePokemon={props.favoritePokemon}
        totalInRegion={props.totalInRegion}
        caughtInRegion={props.caughtInRegion}
        searchQuery={props.searchQuery}
        onPokemonSelect={props.onPokemonSelect}
      />
      <PokemonGrid
        region={props.currentRegion}
        filteredPokemon={filteredPokemon}
        pokemonStatuses={props.pokemonStatuses}
        onToggleStatus={props.onToggleStatus}
        favorites={props.favorites}
        onToggleFavorite={props.onToggleFavorite}
        searchQuery={props.searchQuery}
        isShinyMode={props.isShinyMode}
        onToggleShinyMode={props.onToggleShinyMode}
        isFetchingAll={false} // No longer fetching
        onPokemonSelect={props.onPokemonSelect}
        activeTypes={props.activeTypes}
        onTypeToggle={props.onTypeToggle}
      />
      <NewsFeed />
    </div>
  );
};

export default PokedexView;