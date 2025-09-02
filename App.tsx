/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useMemo } from 'react';
import TopBar from './components/TopBar.tsx';
import PokedexView from './modes/pokedex/PokedexView.tsx';
import ShinyHuntingView from './modes/shiny_hunting/ShinyHuntingView.tsx';
import TeamBuilderView from './modes/team_builder/TeamBuilderView.tsx';
import BattleSimView from './modes/battle_sim/BattleSimView.tsx';
import ItemDexView from './modes/item_dex/ItemDexView.tsx';
import MoveDexView from './modes/move_dex/MoveDexView.tsx';
import TrainingView from './modes/training/TrainingView.tsx';
import PokedexEntryPage from './components/PokedexEntryPage.tsx';
import Settings from './components/Settings.tsx';
import { Pokemon, AppMode, SharedShinyPayload, Hunt, Team } from './types.ts';
import { ALL_POKEMON } from './data/pokemon.ts';
import { SharedShinyCardView } from './components/ShinyCard.tsx';
import useLocalStorage from './hooks/useLocalStorage.ts';
import { REGIONS } from './constants.ts';
import { KANTO_POKEMON } from './data/regions/kanto.ts';
import { JOHTO_POKEMON } from './data/regions/johto.ts';
import { HOENN_POKEMON } from './data/regions/hoenn.ts';
import { SINNOH_POKEMON } from './data/regions/sinnoh.ts';
import { UNOVA_POKEMON } from './data/regions/unova.ts';
import { KALOS_POKEMON } from './data/regions/kalos.ts';
import { ALOLA_POKEMON } from './data/regions/alola.ts';
import { GALAR_POKEMON } from './data/regions/galar.ts';
import { HISUI_POKEMON } from './data/regions/hisui.ts';
import { PALDEA_POKEMON } from './data/regions/paldea.ts';
import InspectorHighlight from './components/InspectorHighlight.tsx';

const REGION_DATA: Record<string, Pokemon[]> = {
  Kanto: KANTO_POKEMON,
  Johto: JOHTO_POKEMON,
  Hoenn: HOENN_POKEMON,
  Sinnoh: SINNOH_POKEMON,
  Unova: UNOVA_POKEMON,
  Kalos: KALOS_POKEMON,
  Alola: ALOLA_POKEMON,
  Galar: GALAR_POKEMON,
  Hisui: HISUI_POKEMON,
  Paldea: PALDEA_POKEMON,
};


const App = () => {
  // Global State
  const [pokemonList] = useState<Pokemon[]>(ALL_POKEMON);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInspectorMode, setIsInspectorMode] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  
  // App Mode State
  const [currentMode, setCurrentMode] = useState<AppMode>('pokedex');

  // Pokedex-specific State
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentRegion, setCurrentRegion] = useState<string>('Kanto');
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [pokemonStatuses, setPokemonStatuses] = useLocalStorage<Record<number, 'seen' | 'caught'>>('holodex-statuses', {});
  const [favorites, setFavorites] = useLocalStorage<number[]>('holodex-favorites', []);
  const [isShinyMode, setIsShinyMode] = useState(false);

  // Shiny Hunting State
  const [hunts, setHunts] = useLocalStorage<Hunt[]>('holodex-shiny-hunts', []);
  const [activeHuntId, setActiveHuntId] = useLocalStorage<number | null>('holodex-active-hunt', null);
  const [hasShinyCharm, setHasShinyCharm] = useLocalStorage<boolean>('holodex-shiny-charm', false);

  // Team Builder State
  const [teams, setTeams] = useLocalStorage<Team[]>('holodex-teams', []);
  
  // Training Mode State
  const [selectedTrainingPokemon, setSelectedTrainingPokemon] = useState<Pokemon | null>(null);
  
  // Shared view state
  const [sharedShinyData, setSharedShinyData] = useState<SharedShinyPayload | null>(null);
  const [isResolvingSharedView, setIsResolvingSharedView] = useState(true);

  // Derived state for Pokedex
  const regionRanges = useMemo(() => {
    const ranges: { [key: string]: { start: number; end: number } } = {};
    REGIONS.forEach(region => {
      const pokemonInRegion = REGION_DATA[region];
      if (pokemonInRegion && pokemonInRegion.length > 0) {
        ranges[region] = { start: pokemonInRegion[0].id, end: pokemonInRegion[pokemonInRegion.length - 1].id };
      }
    });
    return ranges;
  }, []);

  const favoritePokemon = useMemo(() => {
    return pokemonList.filter(p => favorites.includes(p.id));
  }, [favorites, pokemonList]);

  const { totalInRegion, caughtInRegion } = useMemo(() => {
    const range = regionRanges[currentRegion];
    if (!range) return { totalInRegion: 0, caughtInRegion: 0 };

    const regionPokemon = pokemonList.filter(p => p.id >= range.start && p.id <= range.end);
    const total = regionPokemon.length;
    
    const caught = regionPokemon.filter(p => pokemonStatuses[p.id] === 'caught').length;
    
    return { totalInRegion: total, caughtInRegion: caught };
  }, [currentRegion, pokemonList, pokemonStatuses, regionRanges]);
  
  // Handlers for Pokedex
  const handleToggleStatus = (pokemonId: number) => {
    setPokemonStatuses(prev => {
      const newStatuses = { ...prev };
      if (newStatuses[pokemonId] === 'caught') {
        delete newStatuses[pokemonId];
      } else {
        newStatuses[pokemonId] = 'caught';
      }
      // FIX: The updater function for a state setter must return the new state.
      return newStatuses;
    });
  };
  
  const handleToggleFavorite = (pokemonId: number) => {
    setFavorites(prev => 
      prev.includes(pokemonId) 
        ? prev.filter(id => id !== pokemonId) 
        : [...prev, pokemonId]
    );
  };

  const handleTypeToggle = (type: string) => {
    setActiveTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };
  
  const handlePokemonSelect = (pokemon: Pokemon | null) => {
    setSelectedTrainingPokemon(null);
    setSelectedPokemon(pokemon);
  };
  
  const handleRegionChange = (region: string) => {
    setCurrentRegion(region);
    setActiveTypes([]);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() !== '') {
      setActiveTypes([]);
    }
  };
  
  const handleSelectForTraining = (pokemon: Pokemon) => {
    setSelectedPokemon(null); // Deselect from Pokedex entry view
    setSearchQuery(''); // Clear search query
    setSelectedTrainingPokemon(pokemon);
    setCurrentMode('training');
  };

  // Handlers for Shiny Hunting
  const handleStartShinyHunt = (pokemon: Pokemon) => {
    if (hunts.some(hunt => hunt.target.id === pokemon.id)) {
      const existingHunt = hunts.find(hunt => hunt.target.id === pokemon.id);
      if (existingHunt) setActiveHuntId(existingHunt.id);
      return;
    }

    const newHunt: Hunt = {
      id: Date.now(),
      target: pokemon,
      count: 0,
      method: 'full-odds',
    };
    setHunts(prev => [...prev, newHunt]);
    setActiveHuntId(newHunt.id);
  };
  
  const handleDeleteHunt = (huntId: number) => {
    setHunts(prev => prev.filter(hunt => hunt.id !== huntId));
    if (activeHuntId === huntId) {
      setActiveHuntId(null);
    }
  };

  const handleUpdateHunt = (huntId: number, updates: Partial<Omit<Hunt, 'id' | 'target'>>) => {
    setHunts(prev => prev.map(hunt => hunt.id === huntId ? { ...hunt, ...updates } : hunt));
  };
  
  // Handle shared shiny card view from URL
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const view = urlParams.get('view');
      const data = urlParams.get('data');

      if (view === 'shiny-card' && data) {
        const shinyData = JSON.parse(atob(data));
        const pokemon = pokemonList.find(p => p.id === shinyData.pokemonId);
        if (pokemon) {
          setSharedShinyData({ shiny: shinyData, pokemon });
        }
      }
    } catch (e) {
      console.error("Failed to parse shared shiny data from URL", e);
    } finally {
      setIsResolvingSharedView(false);
    }
  }, [pokemonList]);

  // Handle inspector mode highlighting
  useEffect(() => {
    if (!isInspectorMode) {
      if (highlightedElement) {
        setHighlightedElement(null);
      }
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setHighlightedElement(e.target as HTMLElement);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isInspectorMode, highlightedElement]);

  const renderCurrentMode = () => {
    if (isResolvingSharedView) {
      return <div className="placeholder-view">Loading...</div>;
    }
  
    if (sharedShinyData) {
      return <SharedShinyCardView shiny={sharedShinyData.shiny} pokemon={sharedShinyData.pokemon} />;
    }
  
    if (selectedPokemon) {
      return (
        <PokedexEntryPage
          pokemon={selectedPokemon}
          onClose={() => handlePokemonSelect(null)}
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
            pokemonStatuses={pokemonStatuses}
            onToggleStatus={handleToggleStatus}
            pokemonList={pokemonList}
            regionRanges={regionRanges}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            isShinyMode={isShinyMode}
            onToggleShinyMode={() => setIsShinyMode(!isShinyMode)}
            onPokemonSelect={handlePokemonSelect}
          />
        );
      case 'training':
        return (
          <TrainingView
            pokemonToTrain={selectedTrainingPokemon}
            pokemonList={pokemonList}
            onPokemonSelect={handleSelectForTraining}
          />
        );
      case 'shiny-hunting':
        return (
          <ShinyHuntingView
            pokemonList={pokemonList}
            hunts={hunts}
            activeHuntId={activeHuntId}
            hasShinyCharm={hasShinyCharm}
            onDeleteHunt={handleDeleteHunt}
            onUpdateHunt={handleUpdateHunt}
            onSetActiveHunt={setActiveHuntId}
            onSetHasShinyCharm={setHasShinyCharm}
          />
        );
      case 'team-builder':
        return (
          <TeamBuilderView
            pokemonList={pokemonList}
            teams={teams}
            onSetTeams={setTeams}
          />
        );
      case 'battle-sim':
        return <BattleSimView />;
      case 'item-dex':
        return <ItemDexView searchQuery={searchQuery} />;
      case 'move-dex':
        return <MoveDexView searchQuery={searchQuery} />;
      default:
        return null;
    }
  };

  return (
    <>
      <TopBar
        currentMode={currentMode}
        onSetMode={setCurrentMode}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        pokemonList={pokemonList}
        onStartShinyHunt={handleStartShinyHunt}
        onSelectForTraining={handleSelectForTraining}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isInspectorMode={isInspectorMode}
        onToggleInspectorMode={() => setIsInspectorMode(!isInspectorMode)}
      />
      {renderCurrentMode()}
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      {isInspectorMode && highlightedElement && <InspectorHighlight element={highlightedElement} />}
    </>
  );
};

// FIX: Added default export for the App component to be properly imported in index.tsx.
export default App;