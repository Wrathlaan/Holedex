/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppMode, Pokemon } from '../types.ts';
import { SPRITE_BASE_URL } from '../constants.ts';

interface SearchBarProps {
  currentMode: AppMode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  pokemonList: Pokemon[];
  onStartShinyHunt: (pokemon: Pokemon) => void;
  onSelectForTraining: (pokemon: Pokemon) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  currentMode,
  searchQuery,
  onSearchChange,
  pokemonList,
  onStartShinyHunt,
  onSelectForTraining,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(() => {
    if (!['shiny-hunting', 'training'].includes(currentMode) || !searchQuery) return [];
    const trimmedQuery = searchQuery.toLowerCase().trim();
    if (trimmedQuery.length < 2) return [];
    return pokemonList.filter(p =>
      p.name.toLowerCase().includes(trimmedQuery) ||
      String(p.id) === trimmedQuery
    ).slice(0, 7);
  }, [searchQuery, pokemonList, currentMode]);

  const showResults = isFocused && searchResults.length > 0;

  const handleSelect = (pokemon: Pokemon) => {
    if (currentMode === 'shiny-hunting') {
      onStartShinyHunt(pokemon);
    } else if (currentMode === 'training') {
      onSelectForTraining(pokemon);
    }
    // Clear search and close dropdown handled by App state change
  };

  // Effect to handle clicks outside of the search bar to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPlaceholderText = () => {
    switch (currentMode) {
      case 'pokedex':
        return 'Search Pokémon by name or #';
      case 'shiny-hunting':
        return 'Search Pokémon to hunt...';
      case 'team-builder':
        return 'Search Pokémon to add...';
      case 'item-dex':
        return 'Search all items...';
      case 'move-dex':
        return 'Search all moves...';
      case 'training':
        return 'Search Pokémon to train...';
      default:
        return 'Search...';
    }
  };

  return (
    <div className="top-bar-search" ref={searchContainerRef}>
      <svg className="top-bar-search-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
      </svg>
      <input
        type="text"
        placeholder={getPlaceholderText()}
        className="top-bar-search-input"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        aria-label="Search Pokémon"
        autoComplete="off"
      />
      {['shiny-hunting', 'training'].includes(currentMode) && showResults && (
        <ul className="search-results-dropdown">
          {searchResults.map(pokemon => (
            <li key={pokemon.id} onClick={() => handleSelect(pokemon)}>
              <img src={`${SPRITE_BASE_URL}${pokemon.id}.png`} alt={pokemon.name} />
              <span>#{String(pokemon.id).padStart(3, '0')}</span>
              <span>{pokemon.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;