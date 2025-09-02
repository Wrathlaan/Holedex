/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { AppMode, Pokemon } from '../types.ts';
import SearchBar from './SearchBar.tsx';

interface TopBarProps {
  currentMode: AppMode;
  onSetMode: (mode: AppMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  pokemonList: Pokemon[];
  onStartShinyHunt: (pokemon: Pokemon) => void;
  onSelectForTraining: (pokemon: Pokemon) => void;
  onOpenSettings: () => void;
  isInspectorMode: boolean;
  onToggleInspectorMode: () => void;
}

const TopBar = ({
  currentMode,
  onSetMode,
  searchQuery,
  onSearchChange,
  pokemonList,
  onStartShinyHunt,
  onSelectForTraining,
  onOpenSettings,
  isInspectorMode,
  onToggleInspectorMode,
}: TopBarProps) => {
  const showSearchBar = !['battle-sim'].includes(currentMode);

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <svg className="top-bar-logo" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
        </svg>
        <h1 className="top-bar-title">
          <span className="top-bar-title-text">Holodex</span>
        </h1>
        {showSearchBar && (
          <SearchBar
            currentMode={currentMode}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            pokemonList={pokemonList}
            // FIX: Pass the correct prop 'onStartShinyHunt' instead of the undefined 'handleStartShinyHunt'.
            onStartShinyHunt={onStartShinyHunt}
            onSelectForTraining={onSelectForTraining}
          />
        )}
      </div>

      <nav className="top-bar-modes" aria-label="Main Navigation">
        <button
          onClick={() => onSetMode('pokedex')}
          className={`mode-btn pokedex ${currentMode === 'pokedex' ? 'active' : ''}`}
          aria-current={currentMode === 'pokedex'}
        >
          Pokédex
        </button>
        <button
          onClick={() => onSetMode('training')}
          className={`mode-btn training ${currentMode === 'training' ? 'active' : ''}`}
          aria-current={currentMode === 'training'}
        >
          Training
        </button>
        <button
          onClick={() => onSetMode('shiny-hunting')}
          className={`mode-btn shiny-hunting ${currentMode === 'shiny-hunting' ? 'active' : ''}`}
          aria-current={currentMode === 'shiny-hunting'}
        >
          Shiny Hunting
        </button>
        <button
          onClick={() => onSetMode('team-builder')}
          className={`mode-btn team-builder ${currentMode === 'team-builder' ? 'active' : ''}`}
          aria-current={currentMode === 'team-builder'}
        >
          Team Builder
        </button>
        <button
          onClick={() => onSetMode('battle-sim')}
          className={`mode-btn battle-sim ${currentMode === 'battle-sim' ? 'active' : ''}`}
          aria-current={currentMode === 'battle-sim'}
        >
          Battle Sim
        </button>
        <button
          onClick={() => onSetMode('item-dex')}
          className={`mode-btn item-dex ${currentMode === 'item-dex' ? 'active' : ''}`}
          aria-current={currentMode === 'item-dex'}
        >
          Item Dex
        </button>
        <button
          onClick={() => onSetMode('move-dex')}
          className={`mode-btn move-dex ${currentMode === 'move-dex' ? 'active' : ''}`}
          aria-current={currentMode === 'move-dex'}
        >
          Move Dex
        </button>
      </nav>
        
      <div className="top-bar-right">
        <div className="top-bar-tools">
          <button
            className={`inspector-toggle-btn ${isInspectorMode ? 'active' : ''}`}
            onClick={onToggleInspectorMode}
            aria-pressed={isInspectorMode}
            aria-label="Toggle Element Inspector"
            title="Toggle Element Inspector"
          >
            <svg className="inspector-icon-svg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            </svg>
          </button>
          <button
            className="icon-btn"
            onClick={onOpenSettings}
            aria-label="Open Settings"
            title="Open Settings"
          >
            <svg className="settings-icon-svg" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12-.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
