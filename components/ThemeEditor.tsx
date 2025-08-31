/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Theme } from '../types';

interface ThemeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: Theme;
  onApplyTheme: (newTheme: Theme) => void;
}

interface ThemeProperty {
  key: string;
  label: string;
  type?: 'text' | 'color';
}

const THEME_STRUCTURE: { title: string; properties: ThemeProperty[] }[] = [
  {
    title: 'General',
    properties: [
      { key: '--font-family', label: 'Font Family', type: 'text' },
      { key: '--background-image-url', label: 'Background Image (URL)', type: 'text' },
    ],
  },
  {
    title: 'Core Colors',
    properties: [
      { key: '--background-dark', label: 'Main Background' },
      { key: '--panel-dark', label: 'Panel Background' },
      { key: '--panel-light', label: 'Panel Hover' },
      { key: '--border-color', label: 'Borders & Lines' },
    ],
  },
  {
    title: 'Text Colors',
    properties: [
      { key: '--text-primary', label: 'Primary Text' },
      { key: '--text-secondary', label: 'Secondary Text' },
    ],
  },
  {
    title: 'Accent Colors',
    properties: [
      { key: '--accent-color', label: 'Primary Accent' },
      { key: '--accent-color-translucent', label: 'Translucent Accent' },
    ],
  },
  {
    title: 'Glows & Shadows',
    properties: [
      { key: '--glow-color', label: 'Panel Glow' },
      { key: '--modal-glow-color', label: 'Modal Glow' },
      { key: '--shiny-glow-color', label: 'Shiny Icon Glow' },
    ],
  },
];

const POKEMON_ZA_THEME: Theme = {
  '--font-family': `'Roboto', sans-serif`,
  '--background-image-url': `url('https://www.transparenttextures.com/patterns/az-subtle.png')`,
  '--background-dark': '#0a192f',
  '--panel-dark': '#112240',
  '--panel-light': '#172a45',
  '--text-primary': '#ccd6f6',
  '--text-secondary': '#8892b0',
  '--border-color': '#233554',
  '--accent-color': '#64ffda',
  '--accent-color-translucent': 'rgba(100, 255, 218, 0.1)',
  '--glow-color': 'rgba(100, 255, 218, 0.1)',
  '--modal-glow-color': 'rgba(100, 255, 218, 0.15)',
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

const BUILT_IN_PRESETS: Record<string, Theme> = {
  'Pokémon Legends: Z-A': POKEMON_ZA_THEME,
};

const PRESETS_STORAGE_KEY = 'holodex-theme-presets';

const ThemeEditor: React.FC<ThemeEditorProps> = ({ isOpen, onClose, currentTheme, onApplyTheme }) => {
  const [draftTheme, setDraftTheme] = useState<Theme>(currentTheme);
  const [userPresets, setUserPresets] = useState<Record<string, Theme>>({});
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const storedPresets = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (storedPresets) {
        setUserPresets(JSON.parse(storedPresets));
      }
    } catch (error) {
      console.error("Failed to load theme presets from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(userPresets));
    } catch (error) {
      console.error("Failed to save theme presets to localStorage:", error);
    }
  }, [userPresets]);

  useEffect(() => {
    if (isOpen) {
      setDraftTheme(currentTheme);
      setSelectedPreset('');
    }
  }, [isOpen, currentTheme]);

  if (!isOpen) {
    return null;
  }
  
  const allPresets = { ...BUILT_IN_PRESETS, ...userPresets };

  const handleValueChange = (key: string, value: string) => {
    setDraftTheme(prevTheme => ({
      ...prevTheme,
      [key]: value
    }));
  };

  const handleApply = () => {
    onApplyTheme(draftTheme);
    onClose();
  };

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(draftTheme, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "holodex-theme.json";
    link.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const importedTheme = JSON.parse(text);
          if (typeof importedTheme === 'object' && importedTheme !== null) {
            setDraftTheme(importedTheme);
            alert('Theme imported successfully!');
          } else {
            throw new Error('Invalid theme format.');
          }
        }
      } catch (error) {
        console.error('Failed to import theme:', error);
        alert('Error: Could not import theme. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleSavePreset = () => {
    const trimmedName = newPresetName.trim();
    if (!trimmedName) {
      alert('Please enter a name for the preset.');
      return;
    }
    if (BUILT_IN_PRESETS[trimmedName]) {
      alert(`Cannot overwrite the built-in preset "${trimmedName}". Please choose a different name.`);
      return;
    }
    if (userPresets[trimmedName] && !window.confirm(`A preset named "${trimmedName}" already exists. Overwrite it?`)) {
      return;
    }
    const newUserPresets = { ...userPresets, [trimmedName]: draftTheme };
    setUserPresets(newUserPresets);
    setNewPresetName('');
    setSelectedPreset(trimmedName);
    alert('Preset saved!');
  };

  const handleLoadPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    if (presetName && allPresets[presetName]) {
      setDraftTheme(allPresets[presetName]);
    }
  };

  const handleDeletePreset = () => {
    if (!selectedPreset) {
      alert('Please select a preset to delete.');
      return;
    }
    if (BUILT_IN_PRESETS[selectedPreset]) {
      alert('Cannot delete a built-in preset.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the "${selectedPreset}" preset?`)) {
      const newUserPresets = { ...userPresets };
      delete newUserPresets[selectedPreset];
      setUserPresets(newUserPresets);
      setSelectedPreset('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="theme-editor-title">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          style={{ display: 'none' }}
          aria-hidden="true"
        />
        <button className="modal-close-button" onClick={onClose} aria-label="Close Theme Editor">&times;</button>
        
        <div className="theme-editor-content">
          <h2 id="theme-editor-title" className="theme-editor-title">Theme Editor</h2>
          
          <section className="theme-editor-section theme-presets-section">
            <h3 className="theme-editor-section-title">Theme Presets</h3>
            <div className="theme-presets-controls">
              <select 
                className="theme-preset-select" 
                value={selectedPreset} 
                onChange={(e) => handleLoadPreset(e.target.value)}
                aria-label="Load a theme preset"
              >
                <option value="">-- Load a Preset --</option>
                {Object.keys(allPresets).sort().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button 
                onClick={handleDeletePreset} 
                className="theme-editor-btn secondary theme-preset-action-btn" 
                disabled={!selectedPreset || !!BUILT_IN_PRESETS[selectedPreset]}
              >
                Delete
              </button>
            </div>
            <div className="theme-presets-controls">
              <input
                type="text"
                className="theme-preset-input-name"
                placeholder="New Preset Name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                aria-label="New Preset Name"
              />
              <button onClick={handleSavePreset} className="theme-editor-btn secondary theme-preset-action-btn">
                Save Current
              </button>
            </div>
          </section>

          {THEME_STRUCTURE.map(section => (
            <section key={section.title} className="theme-editor-section">
              <h3 className="theme-editor-section-title">{section.title}</h3>
              <div className="theme-property-list">
                {section.properties.map(({ key, label, type = 'color' }) => (
                  <div key={key} className="theme-property-item">
                    <label htmlFor={key} className="theme-property-label">{label}</label>
                    {type === 'text' ? (
                       <input
                        type="text"
                        id={key}
                        className="theme-property-input-text"
                        value={draftTheme[key] || ''}
                        onChange={(e) => handleValueChange(key, e.target.value)}
                      />
                    ) : (
                      <div className="theme-color-input-wrapper" title={label}>
                        <input
                          type="color"
                          id={key}
                          className="theme-property-input"
                          value={draftTheme[key]?.startsWith('rgba') ? '#000000' : draftTheme[key] || '#000000'}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                        />
                        <input
                          type="text"
                          aria-label={`${label} hex value`}
                          className="theme-property-input-hex"
                          value={draftTheme[key] || ''}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="theme-editor-controls">
          <div className="theme-editor-controls-left">
            <button onClick={handleImportClick} className="theme-editor-btn secondary">
              Import JSON
            </button>
            <button onClick={handleExport} className="theme-editor-btn secondary">
              Export JSON
            </button>
          </div>
          <div className="theme-editor-controls-right">
            <button onClick={handleApply} className="theme-editor-btn primary">
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeEditor;
