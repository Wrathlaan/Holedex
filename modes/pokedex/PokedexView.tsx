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
  onPokemonSelect: (pokemon: Pokemon) => void;
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
  return (
    <div className="app-content">
      <Navigation
        currentRegion={props.currentRegion}
        onRegionChange={props.onRegionChange}
        activeTypes={props.activeTypes}
        onTypeToggle={props.onTypeToggle}
        favoritePokemon={props.favoritePokemon}
        onPokemonSelect={props.onPokemonSelect}
        totalInRegion={props.totalInRegion}
        caughtInRegion={props.caughtInRegion}
        searchQuery={props.searchQuery}
      />
      <PokemonGrid
        region={props.currentRegion}
        activeTypes={props.activeTypes}
        onPokemonSelect={props.onPokemonSelect}
        pokemonStatuses={props.pokemonStatuses}
        onToggleStatus={props.onToggleStatus}
        pokemonList={props.pokemonList}
        regionRanges={props.regionRanges}
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
