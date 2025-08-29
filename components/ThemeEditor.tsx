/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
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
    title: 'Pokémon Type Colors',
    properties: [
      { key: '--type-normal', label: 'Normal' },
      { key: '--type-fire', label: 'Fire' },
      { key: '--type-water', label: 'Water' },
      { key: '--type-electric', label: 'Electric' },
      { key: '--type-grass', label: 'Grass' },
      { key: '--type-ice', label: 'Ice' },
      { key: '--type-fighting', label: 'Fighting' },
      { key: '--type-poison', label: 'Poison' },
      { key: '--type-ground', label: 'Ground' },
      { key: '--type-flying', label: 'Flying' },
      { key: '--type-psychic', label: 'Psychic' },
      { key: '--type-bug', label: 'Bug' },
      { key: '--type-rock', label: 'Rock' },
      { key: '--type-ghost', label: 'Ghost' },
      { key: '--type-dragon', label: 'Dragon' },
      { key: '--type-dark', label: 'Dark' },
      { key: '--type-steel', label: 'Steel' },
      { key: '--type-fairy', label: 'Fairy' },
    ]
  }
];


const ThemeEditor: React.FC<ThemeEditorProps> = ({ isOpen, onClose, currentTheme, onApplyTheme }) => {
  const [draftTheme, setDraftTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    if (isOpen) {
      setDraftTheme(currentTheme);
    }
  }, [isOpen, currentTheme]);

  if (!isOpen) {
    return null;
  }

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

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="theme-editor-title">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose} aria-label="Close Theme Editor">&times;</button>
        
        <div className="theme-editor-content">
          <h2 id="theme-editor-title" className="theme-editor-title">Theme Editor</h2>
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
                      <div className="theme-color-input-wrapper">
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
          <button onClick={handleExport} className="theme-editor-btn secondary">
            Export JSON
          </button>
          <button onClick={handleApply} className="theme-editor-btn primary">
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeEditor;