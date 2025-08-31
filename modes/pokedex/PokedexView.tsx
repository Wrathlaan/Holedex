/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useMemo, useEffect } from 'react';
import Navigation from '../../components/Navigation.tsx';
import PokemonGrid from '../../components/PokemonGrid.tsx';
import NewsFeed from '../../components/NewsFeed.tsx';
import { Pokemon } from '../../types.ts';

interface PokedexViewProps {
  currentRegion: string;
  onRegionChange: (region: string) => void;
  activeTypes: string[];
  onTypeToggle: (type: string) => void;
  favoritePokemon: Pokemon[];
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
  isShinyMode: boolean;
  onInitiateSearch: () => void;
  isAllDataFetched: boolean;
  isFetchingAll: boolean;
  onPokemonSelect: (pokemon: Pokemon) => void;
}

const PokedexView = (props: PokedexViewProps) => {
  const {
    currentRegion,
    activeTypes,
    searchQuery,
    pokemonList,
    regionRanges,
    onInitiateSearch,
    isAllDataFetched,
  } = props;

  useEffect(() => {
    if (searchQuery.trim() && !isAllDataFetched) {
      onInitiateSearch();
    }
  }, [searchQuery, isAllDataFetched, onInitiateSearch]);

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
        activeTypes={props.activeTypes}
        onTypeToggle={props.onTypeToggle}
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
        onSearchChange={props.onSearchChange}
        isShinyMode={props.isShinyMode}
        isFetchingAll={props.isFetchingAll}
        onPokemonSelect={props.onPokemonSelect}
      />
      <NewsFeed />
    </div>
  );
};

export default PokedexView;