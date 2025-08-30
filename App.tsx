/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import PokedexView from './modes/pokedex/PokedexView';
import ShinyHuntingView from './modes/shiny_hunting/ShinyHuntingView';
import TeamBuilderView from './modes/team_builder/TeamBuilderView';
import BattleSimView from './modes/battle_sim/BattleSimView';
import Profile from './components/Profile';
import Settings from './components/Settings';
import ThemeEditor from './components/ThemeEditor';
import { Pokemon, Theme, AppMode } from './types';
import { POKEMON_LIST_KANTO, POKEMON_LIST_ALL } from './data/pokemon';

const REGION_RANGES: { [key: string]: { start: number; end: number } } = {
  'Kanto': { start: 1, end: 151 },
  'Johto': { start: 152, end: 251 },
  'Hoenn': { start: 252, end: 386 },
  'Sinnoh': { start: 387, end: 493 },
  'Unova': { start: 494, end: 649 },
  'Kalos': { start: 650, end: 721 },
  'Alola': { start: 722, end: 809 },
  'Galar': { start: 810, end: 898 },
  'Hisui': { start: 899, end: 905 },
  'Paldea': { start: 906, end: 1025 },
};

export const FETCHABLE_REGIONS = ['Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Hisui', 'Paldea'];

const DEFAULT_THEME: Theme = {
  '--font-family': `'Roboto', sans-serif`,
  '--background-image-url': `url('https://www.transparenttextures.com/patterns/cubes.png')`,
  '--background-dark': '#0d1117',
  '--panel-dark': '#161b22',
  '--panel-light': '#21262d',
  '--text-primary': '#e6edf3',
  '--text-secondary': '#8b949e',
  '--border-color': '#30363d',
  '--accent-color': '#58a6ff',
  '--accent-color-translucent': 'rgba(88, 166, 255, 0.3)',
  '--glow-color': 'rgba(88, 166, 255, 0.225)',
  '--modal-glow-color': 'rgba(88, 166, 255, 0.3)',
  '--shiny-glow-color': '#FFD700',
  '--type-normal': '#A8A77A',
  '--type-fire': '#EE8130',
  '--type-water': '#6390F0',
  '--type-electric': '#F7D02C',
  '--type-grass': '#7AC74C',
  '--type-ice': '#96D9D6',
  '--type-fighting': '#C22E28',
  '--type-poison': '#A33EA1',
  '--type-ground': '#E2BF65',
  '--type-flying': '#A98FF3',
  '--type-psychic': '#F95587',
  '--type-bug': '#A6B91A',
  '--type-rock': '#B6A136',
  '--type-ghost': '#735797',
  '--type-dragon': '#6F35FC',
  '--type-dark': '#705746',
  '--type-steel': '#B7B7CE',
  '--type-fairy': '#D685AD',
};

interface RegionFetchState {
  isFetched: boolean;
  isFetching: boolean;
}

const App = () => {
  // Global State
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [pokemonStatuses, setPokemonStatuses] = useState<Record<number, 'seen' | 'caught'>>({});
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isShinyMode, setIsShinyMode] = useState(false);
  
  // App Mode State
  const [currentMode, setCurrentMode] = useState<AppMode>('pokedex');

  // Pokedex-specific State
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [currentRegion, setCurrentRegion] = useState<string>('Kanto');
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Loading State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data Fetching State
  const [isAllDataFetched, setIsAllDataFetched] = useState(false);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const initialRegionFetchStates = FETCHABLE_REGIONS.reduce((acc, region) => {
    acc[region] = { isFetched: false, isFetching: false };
    return acc;
  }, {} as Record<string, RegionFetchState>);
  const [regionFetchStates, setRegionFetchStates] = useState<Record<string, RegionFetchState>>(initialRegionFetchStates);

  // Effect to apply the current theme to the document root
  useEffect(() => {
    for (const [key, value] of Object.entries(theme)) {
      document.documentElement.style.setProperty(key, value);
    }
  }, [theme]);

  // Effect for initial data load
  useEffect(() => {
    setIsLoading(true);
    // Initialize with local Kanto data
    const kantoPokemon = POKEMON_LIST_KANTO;
    setPokemonList(kantoPokemon);

    const initialStatuses: Record<number, 'seen' | 'caught'> = {};
    kantoPokemon.forEach(p => {
      initialStatuses[p.id] = 'seen';
    });
    setPokemonStatuses(initialStatuses);
    setIsLoading(false);
  }, []);

  const handlePokemonSelect = (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon);
  };

  const handleCloseProfile = () => {
    setSelectedPokemon(null);
  }

  const handleRegionChange = (region: string) => {
    setCurrentRegion(region);
    setSelectedPokemon(null); // Reset profile when region changes
  };

  const handleToggleStatus = (pokemonId: number) => {
    setPokemonStatuses(prevStatuses => {
      const currentStatus = prevStatuses[pokemonId] || 'seen';
      const newStatus = currentStatus === 'seen' ? 'caught' : 'seen';
      return { ...prevStatuses, [pokemonId]: newStatus };
    });
  };

  const handleTypeToggle = (type: string) => {
    setActiveTypes(prevTypes => {
      if (prevTypes.includes(type)) {
        return prevTypes.filter(t => t !== type);
      } else {
        return [...prevTypes, type];
      }
    });
  };

  const handleToggleFavorite = (pokemonId: number) => {
    setFavorites(prevFavorites => {
      if (prevFavorites.includes(pokemonId)) {
        return prevFavorites.filter(id => id !== pokemonId);
      } else {
        return [...prevFavorites, pokemonId];
      }
    });
  };
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleToggleShinyMode = () => {
    setIsShinyMode(prev => !prev);
  };

  const handleApplyTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  // Core data fetching logic. It's idempotent and can be safely called multiple times.
  const fetchRegionData = (regionName: string): Promise<void> => {
    return new Promise((resolve) => {
      setRegionFetchStates(currentStates => {
        if (currentStates[regionName]?.isFetched || currentStates[regionName]?.isFetching) {
          resolve();
          return currentStates;
        }
  
        setTimeout(() => {
          const regionRange = REGION_RANGES[regionName];
          const newPokemon = POKEMON_LIST_ALL.filter(p => p.id >= regionRange.start && p.id <= regionRange.end);
  
          setPokemonList(prevList => {
            const existingIds = new Set(prevList.map(p => p.id));
            const uniqueNewPokemon = newPokemon.filter(p => !existingIds.has(p.id));
            return [...prevList, ...uniqueNewPokemon].sort((a, b) => a.id - b.id);
          });
  
          setPokemonStatuses(prevStatuses => {
            const newStatuses = { ...prevStatuses };
            newPokemon.forEach(p => {
              if (!newStatuses[p.id]) {
                newStatuses[p.id] = 'seen';
              }
            });
            return newStatuses;
          });
  
          setRegionFetchStates(prev => ({
            ...prev,
            [regionName]: { isFetched: true, isFetching: false }
          }));
          
          resolve();
        }, 500);
  
        return {
          ...currentStates,
          [regionName]: { ...currentStates[regionName], isFetching: true }
        };
      });
    });
  };

  // Effect to automatically fetch all region data sequentially on app launch.
  useEffect(() => {
    if (isLoading) {
      return;
    }
    const autoFetchAllRegions = async () => {
      for (const region of FETCHABLE_REGIONS) {
        await fetchRegionData(region);
      }
      setIsAllDataFetched(true);
    };
    autoFetchAllRegions();
  }, [isLoading]);

  const handleFetchRegionData = (regionName: string) => {
    fetchRegionData(regionName);
  };

  const handleFetchAllData = async () => {
    setIsFetchingAll(true);
    for (const region of FETCHABLE_REGIONS) {
      await fetchRegionData(region);
    }
    setIsAllDataFetched(true);
    setIsFetchingAll(false);
    setIsSettingsOpen(false);
  };

  const favoritePokemon = pokemonList.filter(p => favorites.includes(p.id));

  // Progress Tracking Calculation
  const range = REGION_RANGES[currentRegion] || { start: 0, end: 0 };
  const regionPokemon = pokemonList.filter(
    (pokemon) => pokemon.id >= range.start && pokemon.id <= range.end
  );
  const totalInRegion = regionPokemon.length;
  const caughtInRegion = regionPokemon.filter(p => pokemonStatuses[p.id] === 'caught').length;

  const renderCurrentMode = () => {
    switch (currentMode) {
      case 'pokedex':
        return (
          <PokedexView
            currentRegion={currentRegion}
            onRegionChange={handleRegionChange}
            activeTypes={activeTypes}
            onTypeToggle={handleTypeToggle}
            favoritePokemon={favoritePokemon}
            onPokemonSelect={handlePokemonSelect}
            totalInRegion={totalInRegion}
            caughtInRegion={caughtInRegion}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            pokemonStatuses={pokemonStatuses}
            onToggleStatus={handleToggleStatus}
            pokemonList={pokemonList}
            regionRanges={REGION_RANGES}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            isLoading={isLoading}
            isShinyMode={isShinyMode}
          />
        );
      case 'shiny-hunting':
        return <ShinyHuntingView />;
      case 'team-builder':
        return <TeamBuilderView />;
      case 'battle-sim':
        return <BattleSimView />;
      default:
        return <PokedexView
          currentRegion={currentRegion}
          onRegionChange={handleRegionChange}
          activeTypes={activeTypes}
          onTypeToggle={handleTypeToggle}
          favoritePokemon={favoritePokemon}
          onPokemonSelect={handlePokemonSelect}
          totalInRegion={totalInRegion}
          caughtInRegion={caughtInRegion}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          pokemonStatuses={pokemonStatuses}
          onToggleStatus={handleToggleStatus}
          pokemonList={pokemonList}
          regionRanges={REGION_RANGES}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          isLoading={isLoading}
          isShinyMode={isShinyMode}
        />;
    }
  };

  return (
    <>
      <TopBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenThemeEditor={() => setIsThemeEditorOpen(true)}
        isShinyMode={isShinyMode}
        onToggleShinyMode={handleToggleShinyMode}
        currentMode={currentMode}
        onSetMode={setCurrentMode}
      />
      
      {renderCurrentMode()}

      {selectedPokemon && (
        <Profile
          pokemon={selectedPokemon}
          pokemonStatuses={pokemonStatuses}
          onToggleStatus={handleToggleStatus}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onPokemonSelect={handlePokemonSelect}
          pokemonList={pokemonList}
          onClose={handleCloseProfile}
        />
      )}
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onFetchAllData={handleFetchAllData}
        isAllDataFetched={isAllDataFetched}
        isFetchingAll={isFetchingAll}
        onFetchRegionData={handleFetchRegionData}
        regionFetchStates={regionFetchStates}
      />
      <ThemeEditor
        isOpen={isThemeEditorOpen}
        onClose={() => setIsThemeEditorOpen(false)}
        currentTheme={theme}
        onApplyTheme={handleApplyTheme}
      />
    </>
  );
};

export default App;
