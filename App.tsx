/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import PokemonGrid from './components/PokemonGrid';
import Profile from './components/Profile';
import Settings from './components/Settings';
import { Pokemon } from './types';
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

const newsItems = [
    {
        category: 'Game Announcement',
        title: 'Pokémon Legends: Z-A Arrives in 2025!',
        description: 'A new adventure awaits in Lumiose City! Pokémon Legends: Z-A, an ambitious new entry to the Pokémon series, will be released on Nintendo Switch in 2025.',
        timestamp: 'Feb 27, 2024',
        image: 'https://pbs.twimg.com/media/GHW-cT0XoAAXlGq?format=jpg&name=large',
        link: 'https://www.youtube.com/watch?v=5_qDb2y06s4',
    },
    {
        category: 'Animation',
        title: 'Pokémon Horizons: The Series Now on Netflix',
        description: 'The new Pokémon animated adventure has arrived! Follow Liko and Roy as they uncover the mysteries of the Pokémon world.',
        timestamp: 'Mar 7, 2024',
        image: 'https://pbs.twimg.com/media/GH_930UWAAAXs1s?format=jpg&name=large',
        link: 'https://www.netflix.com/title/81722339',
    },
    {
        category: 'App Announcement',
        title: 'Introducing Pokémon TCG Pocket',
        description: 'Collect, trade, and battle with digital cards in Pokémon Trading Card Game Pocket, an upcoming app for iOS and Android devices, launching in 2024.',
        timestamp: 'Feb 27, 2024',
        image: 'https://pbs.twimg.com/media/GHXDjBPaMAABqgf?format=jpg&name=large',
        link: 'https://www.youtube.com/watch?v=M53n_v_e7kg',
    },
    {
        category: 'Esports',
        title: 'Worlds 2024 Heads to Honolulu!',
        description: 'The 2024 Pokémon World Championships will be held in Honolulu, Hawaiʻi from August 16–18! Get ready for a heated competition.',
        timestamp: 'Apr 5, 2024',
        image: 'https://pbs.twimg.com/media/GKb0gWKa0AEs9yY?format=jpg&name=large',
        link: 'https://x.com/Pokemon/status/1776261298492063855',
    },
    {
        category: 'Community Event',
        title: 'Pokémon GO Fest 2024: Global Details',
        description: 'Join millions of Trainers for Pokémon GO Fest: Global on July 13 and 14, featuring the debut of the Mythical Pokémon Marshadow!',
        timestamp: 'May 1, 2024',
        image: 'https://pbs.twimg.com/media/GMfV6Q1XoAA2FNo?format=jpg&name=large',
        link: 'https://gofest.pokemongolive.com/',
    },
];

const NewsFeed = () => {
  return (
    <aside className="panel news-panel" aria-labelledby="news-title">
      <h2 id="news-title">Holo-Net News</h2>
      <div className="news-feed-content">
        {newsItems.map((item, index) => (
          <article key={index} className="news-item" aria-labelledby={`news-title-${index}`}>
            <img src={item.image} alt="" className="news-item-image" />
            <div className="news-item-header">
              <span className="news-item-category">{item.category}</span>
              <span className="news-item-timestamp">{item.timestamp}</span>
            </div>
            <h3 id={`news-title-${index}`} className="news-item-title">{item.title}</h3>
            <p className="news-item-description">{item.description}</p>
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="news-item-link">
              Read More &rarr;
            </a>
          </article>
        ))}
      </div>
    </aside>
  );
};

interface TopBarProps {
  onOpenSettings: () => void;
  isShinyMode: boolean;
  onToggleShinyMode: () => void;
}

const TopBar = ({ onOpenSettings, isShinyMode, onToggleShinyMode }: TopBarProps) => {
  return (
    <header className="top-bar">
      <div className="top-bar-actions-left">
        <button
          onClick={onToggleShinyMode}
          className={`shiny-toggle-btn ${isShinyMode ? 'active' : ''}`}
          aria-label="Toggle Shiny Mode for Grid"
          title="Toggle Shiny Mode for Grid"
        >
          <svg className="shiny-toggle-svg" viewBox="0 0 24 24">
            <title>Toggle Shiny Mode</title>
            <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
          </svg>
        </button>
        <button onClick={onOpenSettings} className="settings-icon-btn" aria-label="Open Settings">
          <svg className="settings-icon-svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
          </svg>
        </button>
      </div>
      <h1 className="top-bar-title">Holo-Grid Pokédex</h1>
      <div className="top-bar-actions-right">
        {/* Placeholder for future icons */}
      </div>
    </header>
  );
};

interface RegionFetchState {
  isFetched: boolean;
  isFetching: boolean;
}

const App = () => {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [currentRegion, setCurrentRegion] = useState<string>('Kanto');
  const [pokemonStatuses, setPokemonStatuses] = useState<Record<number, 'seen' | 'caught'>>({});
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [isAllDataFetched, setIsAllDataFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [isShinyMode, setIsShinyMode] = useState(false);

  // Refactored state for regional data fetching
  const initialRegionFetchStates = FETCHABLE_REGIONS.reduce((acc, region) => {
    acc[region] = { isFetched: false, isFetching: false };
    return acc;
  }, {} as Record<string, RegionFetchState>);

  const [regionFetchStates, setRegionFetchStates] = useState<Record<string, RegionFetchState>>(initialRegionFetchStates);

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

  // Core data fetching logic. It's idempotent and can be safely called multiple times.
  // It checks the latest state to avoid redundant fetches.
  const fetchRegionData = (regionName: string): Promise<void> => {
    return new Promise((resolve) => {
      setRegionFetchStates(currentStates => {
        // Using the functional update allows us to get the LATEST state.
        if (currentStates[regionName]?.isFetched || currentStates[regionName]?.isFetching) {
          resolve(); // Already done or in progress, so we resolve immediately.
          return currentStates; // No state change.
        }
  
        // If we get here, it means we need to fetch.
        // We trigger the async operation, which will later update the state again and resolve the promise.
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
          
          resolve(); // Resolve the promise once the data is fetched and state is updated.
        }, 500);
  
        // Return the new state to indicate that fetching has started.
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
      return; // Don't run until initial data is loaded
    }

    const autoFetchAllRegions = async () => {
      for (const region of FETCHABLE_REGIONS) {
        await fetchRegionData(region);
      }
      setIsAllDataFetched(true);
    };

    autoFetchAllRegions();
  }, [isLoading]);


  // Handler for manual fetch from settings modal
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

  return (
    <>
      <TopBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        isShinyMode={isShinyMode}
        onToggleShinyMode={handleToggleShinyMode}
      />
      <div className="app-content">
        <Navigation
          currentRegion={currentRegion}
          onRegionChange={handleRegionChange}
          activeTypes={activeTypes}
          onTypeToggle={handleTypeToggle}
          favoritePokemon={favoritePokemon}
          onPokemonSelect={handlePokemonSelect}
          totalInRegion={totalInRegion}
          caughtInRegion={caughtInRegion}
        />
        <PokemonGrid
          region={currentRegion}
          activeTypes={activeTypes}
          onPokemonSelect={handlePokemonSelect}
          pokemonStatuses={pokemonStatuses}
          onToggleStatus={handleToggleStatus}
          pokemonList={pokemonList}
          regionRanges={REGION_RANGES}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          isLoading={isLoading}
          isShinyMode={isShinyMode}
        />
        <NewsFeed />
      </div>
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
    </>
  );
};

export default App;
