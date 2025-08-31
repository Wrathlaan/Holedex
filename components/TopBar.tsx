/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { AppMode } from '../types.ts';

interface TopBarProps {
  onOpenSettings: () => void;
  isShinyMode: boolean;
  onToggleShinyMode: () => void;
  currentMode: AppMode;
  onSetMode: (mode: AppMode) => void;
}

const TopBar = ({
  onOpenSettings,
  isShinyMode,
  onToggleShinyMode,
  currentMode,
  onSetMode,
}: TopBarProps) => {
  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <svg className="top-bar-logo" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
        </svg>
        <h1 className="top-bar-title">
          <span className="top-bar-title-text">Holodex</span>
        </h1>
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
        <div className="top-bar-divider"></div>
        <div className="top-bar-tools">
          <button
            onClick={onToggleShinyMode}
            className={`shiny-toggle-btn ${isShinyMode ? 'active' : ''}`}
            aria-pressed={isShinyMode}
            aria-label="Toggle Shiny Pokémon Sprites"
            title="Toggle Shiny Sprites"
          >
            <svg className="shiny-toggle-svg" viewBox="0 0 24 24">
              <title>Toggle Shiny Sprites</title>
              <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
            </svg>
          </button>
          <button onClick={onOpenSettings} className="icon-btn" aria-label="Open Settings" title="Settings">
            <svg className="settings-icon-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.47,13.24c0.04-0.3,0.07-0.61,0.07-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.44,0.17-0.48,0.41L9.12,5.25C8.53,5.5,8,5.82,7.5,6.2l-2.39-0.96c-0.22-0.08-0.47,0-0.59,0.22L2.6,8.77 c-0.11,0.2-0.06,0.47,0.12,0.61l2.03,1.58C4.7,11.36,4.68,11.68,4.68,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.48,2.44 c0.04,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17-0.48,0.41l0.48-2.44c0.59-0.24,1.12-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.11-0.2,0.06-0.47-0.12-0.61L19.47,13.24z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;