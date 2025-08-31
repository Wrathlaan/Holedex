/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import TopBar from './components/TopBar.tsx';
import PokedexView from './modes/pokedex/PokedexView.tsx';
import ShinyHuntingView from './modes/shiny_hunting/ShinyHuntingView.tsx';
import TeamBuilderView from './modes/team_builder/TeamBuilderView.tsx';
import BattleSimView from './modes/battle_sim/BattleSimView.tsx';
import ItemDexView from './modes/item_dex/ItemDexView.tsx';
import MoveDexView from './modes/move_dex/MoveDexView.tsx';
import TrainingView from './modes/training/TrainingView.tsx';
import PokedexEntryPage from './components/PokedexEntryPage.tsx';
import { Pokemon, Theme, AppMode, ShinyPokemon, Hunt, SharedShinyPayload, FETCHABLE_REGIONS } from './types.ts';
import { KANTO_POKEMON } from './data/regions/kanto.ts';
import { SharedShinyCardView } from './components/ShinyCard.tsx';
import { regionLoaders } from './data/loader.ts';

const Settings = lazy(() => import('./components/Settings.tsx'));

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

const HUNTS_STORAGE_KEY = 'holodex-shiny-hunts';

const findRegionForPokemon = (pokemonId: number): string | null => {
  for (const [region, range] of Object.entries(REGION_RANGES)) {
    if (pokemonId >= range.start && pokemonId <= range.end) {
      return region;
    }
  }
  return null;
};

const App = () => {
  // Global State
  const [pokemonList, setPokemonList] = useState<Pokemon[]>(KANTO_POKEMON);
  const [pokemonStatuses, setPokemonStatuses] = useState<Record<number, 'seen' | 'caught'>>({});
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isShinyMode, setIsShinyMode] = useState(false);
  
  // App Mode State
  const [currentMode, setCurrentMode] = useState<AppMode>('pokedex');

  // Pokedex-specific State
  const [currentRegion, setCurrentRegion] = useState<string>('Kanto');
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  
  // Modal & Loading State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Data Fetching State
  const [isAllDataFetched, setIsAllDataFetched] = useState(false);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const initialRegionFetchStates = FETCHABLE_REGIONS.reduce((acc, region) => {
    acc[region] = { isFetched: false, isFetching: false };
    return acc;
  }, { 'Kanto': { isFetched: true, isFetching: false } } as Record<string, RegionFetchState>);
  const [regionFetchStates, setRegionFetchStates] = useState<Record<string, RegionFetchState>>(initialRegionFetchStates);

  // Shared view state
  const [sharedShinyData, setSharedShinyData] = useState<SharedShinyPayload | null>(null);
  const [isResolvingSharedView, setIsResolvingSharedView] = useState(true);

  // Shiny Hunting State
  const [shinyHunts, setShinyHunts] = useState<Hunt[]>([]);
  const [activeShinyHuntId, setActiveShinyHuntId] = useState<number | null>(null);
  const [hasShinyCharm, setHasShinyCharm] = useState(false);

  // Effect to apply the default theme to the document root
  useEffect(() => {
    for (const [key, value] of Object.entries(DEFAULT_THEME)) {
      document.documentElement.style.setProperty(key, value);
    }
  }, []);

  // Effect for initial data load and shared view routing
  useEffect(() => {
    const resolveView = async () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const data = params.get('data');
      if (view === 'shiny-card' && data) {
        try {
          const shiny: ShinyPokemon = JSON.parse(atob(data));
          if (shiny.pokemonId && shiny.name) {
            const region = findRegionForPokemon(shiny.pokemonId);
            const loader = region ? regionLoaders[region] : null;
            if (loader) {
              const { default: pokemonInRegion } = await loader();
              const fullPokemonData = pokemonInRegion.find(p => p.id === shiny.pokemonId);
              if (fullPokemonData) {
                setSharedShinyData({ shiny, pokemon: fullPokemonData });
              }
            } else {
              throw new Error("Could not find region for shared Pokémon.");
            }
          }
        } catch (e) { 
          console.error("Failed to parse shared shiny data", e);
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
      setIsResolvingSharedView(false);
    }
    resolveView();

    // Initialize with local Kanto data
    const initialStatuses: Record<number, 'seen' | 'caught'> = {};
    KANTO_POKEMON.forEach(p => {
      initialStatuses[p.id] = 'seen';
    });
    setPokemonStatuses(initialStatuses);
    
    // Load hunts
    try {
      const savedHuntsData = localStorage.getItem(HUNTS_STORAGE_KEY);
      if (savedHuntsData) {
        const parsed = JSON.parse(savedHuntsData);
        setShinyHunts(parsed.hunts || []);
        setActiveShinyHuntId(parsed.activeHuntId || null);
        setHasShinyCharm(parsed.hasShinyCharm || false);
      }
    } catch (e) { console.error("Failed to load hunts from localStorage", e); }
  }, []);

  // UseEffect to save hunt data
  useEffect(() => {
    try {
      localStorage.setItem(HUNTS_STORAGE_KEY, JSON.stringify({ hunts: shinyHunts, activeHuntId: activeShinyHuntId, hasShinyCharm }));
    } catch (e) {
      console.error("Failed to save hunts to localStorage", e);
    }
  }, [shinyHunts, activeShinyHuntId, hasShinyCharm]);

  const handleRegionChange = (region: string) => {
    setCurrentRegion(region);
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

  const handlePokemonSelect = (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon);
  };

  const handleCloseEntryPage = () => {
    setSelectedPokemon(null);
  };

  const fetchRegionData = useCallback(async (regionName: string) => {
    if (regionFetchStates[regionName]?.isFetched || regionFetchStates[regionName]?.isFetching) {
      return;
    }
    const loader = regionLoaders[regionName];
    if (!loader) return;

    setRegionFetchStates(prev => ({ ...prev, [regionName]: { ...prev[regionName], isFetching: true }}));
    try {
      const { default: regionPokemon } = await loader();

      setPokemonList(prevList => {
        const existingIds = new Set(prevList.map(p => p.id));
        const uniqueNewPokemon = regionPokemon.filter((p: Pokemon) => !existingIds.has(p.id));
        return [...prevList, ...uniqueNewPokemon].sort((a, b) => a.id - b.id);
      });

      setPokemonStatuses(prevStatuses => {
        const newStatuses = { ...prevStatuses };
        regionPokemon.forEach((p: Pokemon) => {
          if (!newStatuses[p.id]) newStatuses[p.id] = 'seen';
        });
        return newStatuses;
      });

      setRegionFetchStates(prev => ({ ...prev, [regionName]: { isFetched: true, isFetching: false }}));
    } catch (error) {
      console.error(`Failed to load data for ${regionName}`, error);
      setRegionFetchStates(prev => ({ ...prev, [regionName]: { isFetched: false, isFetching: false }}));
    }
  }, [regionFetchStates]);


  const handleFetchAllData = useCallback(async () => {
    if (isAllDataFetched) return;
    setIsFetchingAll(true);
    await Promise.all(FETCHABLE_REGIONS.map(region => fetchRegionData(region)));
    setIsAllDataFetched(true);
    setIsFetchingAll(false);
  }, [isAllDataFetched, fetchRegionData]);


  // --- Shiny Hunt Handlers ---
  const handleUpdateShinyHunt = (huntId: number, updates: Partial<Omit<Hunt, 'id' | 'target'>>) => {
    setShinyHunts(prev => prev.map(h => h.id === huntId ? { ...h, ...updates } : h));
  };

  const handleDeleteShinyHunt = (huntId: number) => {
    if (window.confirm("Are you sure you want to delete this hunt? This action cannot be undone.")) {
      setShinyHunts(prevHunts => {
        const newHunts = prevHunts.filter(h => h.id !== huntId);
        if (activeShinyHuntId === huntId) {
          setActiveShinyHuntId(newHunts[0]?.id ?? null);
        }
        return newHunts;
      });
    }
  };

  const handleAddShinyHunt = (pokemon: Pokemon) => {
    const newHunt: Hunt = { id: Date.now(), target: pokemon, count: 0, method: 'full-odds' };
    const newHunts = [...shinyHunts, newHunt];
    setShinyHunts(newHunts);
    setActiveShinyHuntId(newHunt.id);
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
    if (currentMode === 'pokedex' && selectedPokemon) {
      return (
        <PokedexEntryPage
          pokemon={selectedPokemon}
          onClose={handleCloseEntryPage}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          isShinyMode={isShinyMode}
          onPokemonSelect={handlePokemonSelect}
          pokemonList={pokemonList}
          pokemonStatuses={pokemonStatuses}
          onToggleStatus={handleToggleStatus}
        />
      );
    }

    switch (currentMode) {
      case 'pokedex':
        return (
          <PokedexView
            currentRegion={currentRegion}
            onRegionChange={handleRegionChange}
            activeTypes={activeTypes}
            onTypeToggle={handleTypeToggle}
            favoritePokemon={favoritePokemon}
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
            isShinyMode={isShinyMode}
            onInitiateSearch={handleFetchAllData}
            isAllDataFetched={isAllDataFetched}
            isFetchingAll={isFetchingAll}
            onPokemonSelect={handlePokemonSelect}
          />
        );
      case 'training':
        return <TrainingView />;
      case 'shiny-hunting':
        return <ShinyHuntingView 
          pokemonList={pokemonList}
          hunts={shinyHunts}
          activeHuntId={activeShinyHuntId}
          onAddHunt={handleAddShinyHunt}
          onDeleteHunt={handleDeleteShinyHunt}
          onUpdateHunt={handleUpdateShinyHunt}
          onSetActiveHunt={setActiveShinyHuntId}
          hasShinyCharm={hasShinyCharm}
          onSetHasShinyCharm={setHasShinyCharm}
        />;
      case 'team-builder':
        return <TeamBuilderView />;
      case 'battle-sim':
        return <BattleSimView />;
      case 'item-dex':
        return <ItemDexView />;
      case 'move-dex':
        return <MoveDexView />;
      default:
        return null;
    }
  };

  if (isResolvingSharedView) {
    return <div className="suspense-loader" />;
  }
  
  if (sharedShinyData) {
    return <SharedShinyCardView shiny={sharedShinyData.shiny} pokemon={sharedShinyData.pokemon} />;
  }

  return (
    <>
      <TopBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        isShinyMode={isShinyMode}
        onToggleShinyMode={handleToggleShinyMode}
        currentMode={currentMode}
        onSetMode={setCurrentMode}
      />
      
      {renderCurrentMode()}

      <Suspense fallback={<div className="suspense-loader" />}>
        {isSettingsOpen && <Settings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onFetchAllData={handleFetchAllData}
          isAllDataFetched={isAllDataFetched}
          isFetchingAll={isFetchingAll}
          onFetchRegionData={fetchRegionData}
          regionFetchStates={regionFetchStates}
        />}
      </Suspense>
    </>
  );
};

export default App;