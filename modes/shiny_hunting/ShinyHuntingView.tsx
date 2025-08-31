/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useEffect } from 'react';
import { Pokemon, ShinyPokemon, Hunt } from '../../types.ts';
import ProbabilityGraph from './ProbabilityGraph.tsx';
import { ShareShinyModal } from '../../components/ShinyCard.tsx';

const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
const SHINY_SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/';
const SHINY_STORAGE_KEY = 'holodex-shiny-collection';

const HUNT_METHODS: Record<string, { odds: number; charmOdds: number; name: string }> = {
  'full-odds': { odds: 4096, charmOdds: 1365, name: 'Full Odds' },
  'masuda': { odds: 683, charmOdds: 512, name: 'Masuda Method' },
  'sos-chain': { odds: 315, charmOdds: 273, name: 'SOS Chaining (Max)' },
  'mass-outbreak-sv': { odds: 1024, charmOdds: 819, name: 'Mass Outbreak (SV, 60+)' },
  'dynamax-adv': { odds: 300, charmOdds: 100, name: 'Dynamax Adventure' },
};

interface ModalState {
  isOpen: boolean;
  initialData?: Partial<ShinyPokemon> & { pokemon?: Pokemon };
  fromHuntId?: number | null;
}

const calculateCumulativeProbability = (odds: number, encounters: number): number => {
  if (encounters === 0) return 0;
  const probabilityOfNoShiny = Math.pow(1 - (1 / odds), encounters);
  const probabilityOfShiny = 1 - probabilityOfNoShiny;
  return probabilityOfShiny * 100;
};

const MilestoneSparkles = () => {
  const sparkles = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    style: {
      transform: `translate(${80 * Math.cos(i * 30 * (Math.PI / 180))}px, ${80 * Math.sin(i * 30 * (Math.PI / 180))}px)`,
      animationDelay: `${Math.random() * 0.3}s`,
      animationDuration: `${0.6 + Math.random() * 0.5}s`,
    }
  })), []);

  return (
    <div className="milestone-sparkles-container">
      {sparkles.map(({ id, style }) => <div key={id} className="sparkle" style={style} />)}
    </div>
  );
};

interface ShinyHuntingViewProps {
  pokemonList: Pokemon[];
  hunts: Hunt[];
  activeHuntId: number | null;
  hasShinyCharm: boolean;
  onAddHunt: (pokemon: Pokemon) => void;
  onDeleteHunt: (huntId: number) => void;
  onUpdateHunt: (huntId: number, updates: Partial<Omit<Hunt, 'id' | 'target'>>) => void;
  onSetActiveHunt: (huntId: number | null) => void;
  onSetHasShinyCharm: (hasCharm: boolean) => void;
}

const ShinyHuntingView = ({ 
  pokemonList,
  hunts,
  activeHuntId,
  hasShinyCharm,
  onAddHunt,
  onDeleteHunt,
  onUpdateHunt,
  onSetActiveHunt,
  onSetHasShinyCharm,
}: ShinyHuntingViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMilestoneEffect, setShowMilestoneEffect] = useState(false);
  const [showLogShinyEffect, setShowLogShinyEffect] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false });
  const [showProbabilityGraph, setShowProbabilityGraph] = useState(false);
  const [shinyToShare, setShinyToShare] = useState<ShinyPokemon | null>(null);
  const [showOverlayUrl, setShowOverlayUrl] = useState(false);
  const [shinyCollection, setShinyCollection] = useState<ShinyPokemon[]>([]);
  const [isPopping, setIsPopping] = useState(false);

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const savedShinies = localStorage.getItem(SHINY_STORAGE_KEY);
      if (savedShinies) {
        setShinyCollection(JSON.parse(savedShinies));
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SHINY_STORAGE_KEY, JSON.stringify(shinyCollection));
    } catch (e) {
      console.error("Failed to save data to localStorage", e);
    }
  }, [shinyCollection]);

  useEffect(() => {
    if (showMilestoneEffect) {
      const timer = setTimeout(() => setShowMilestoneEffect(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [showMilestoneEffect]);

  useEffect(() => {
    if (showLogShinyEffect) {
      const timer = setTimeout(() => setShowLogShinyEffect(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [showLogShinyEffect]);
  
  const activeHunt = useMemo(() => hunts.find(h => h.id === activeHuntId), [activeHuntId, hunts]);
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return pokemonList.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10);
  }, [searchQuery, pokemonList]);
  
  const handleAddHuntFromSearch = (pokemon: Pokemon) => {
    onAddHunt(pokemon);
    setSearchQuery('');
  };

  const handleAddShiny = (shiny: Omit<ShinyPokemon, 'id' | 'name'>) => {
    const pokemon = pokemonList.find(p => p.id === shiny.pokemonId);
    if (!pokemon) return;

    const newShiny: ShinyPokemon = {
      ...shiny,
      id: `${Date.now()}`,
      name: pokemon.name,
    };

    setShinyCollection(prev => [...prev, newShiny].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setShowLogShinyEffect(true);
    setModalState({ isOpen: false });

    if (modalState.fromHuntId) {
      onDeleteHunt(modalState.fromHuntId);
    }
  };
  
  const handleDeleteShiny = (shinyId: string) => {
    if (window.confirm("Are you sure you want to remove this shiny from your collection?")) {
      setShinyCollection(prev => prev.filter(s => s.id !== shinyId));
    }
  }

  const handleOpenLogModal = () => {
    if (!activeHunt) return;
    setModalState({
      isOpen: true,
      initialData: {
        pokemon: activeHunt.target,
        pokemonId: activeHunt.target.id,
        encounters: activeHunt.count,
        method: activeHunt.method,
      },
      fromHuntId: activeHunt.id,
    });
  };

  const handleIncrement = () => {
    if (!activeHunt) return;
    const newCount = activeHunt.count + 1;
    if (newCount > 0 && (newCount === 100 || newCount === 500 || newCount % 1000 === 0)) {
      setShowMilestoneEffect(true);
    }
    onUpdateHunt(activeHunt.id, { count: newCount });
    setIsPopping(true);
    setTimeout(() => setIsPopping(false), 200);
  };
  
  const handleDecrement = () => {
    if (!activeHunt) return;
    onUpdateHunt(activeHunt.id, { count: Math.max(0, activeHunt.count - 1) });
  };
  
  const handleResetCount = () => {
    if (!activeHunt) return;
    if (window.confirm("Are you sure you want to reset the encounter count for this hunt?")) {
      onUpdateHunt(activeHunt.id, { count: 0 });
    }
  };
  
  const currentMethod = activeHunt ? HUNT_METHODS[activeHunt.method] : null;
  const currentOdds = currentMethod ? (hasShinyCharm ? currentMethod.charmOdds : currentMethod.odds) : 4096;
  const cumulativeProbability = activeHunt ? calculateCumulativeProbability(currentOdds, activeHunt.count) : 0;

  return (
    <div className="app-content shiny-view-container">
      {/* Column 1: Hunts List */}
      <aside className="panel current-hunts-panel">
        <h2>Current Hunts</h2>
        <div className="hunt-search">
          <input type="text" placeholder="Search to add a new hunt..." className="search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchResults.length > 0 && <ul className="hunt-search-results">{searchResults.map(p => <li key={p.id} onClick={() => handleAddHuntFromSearch(p)}>{p.name}</li>)}</ul>}
        </div>
        <div className="hunt-list">
          {hunts.length > 0 ? hunts.map(hunt => (
            <div key={hunt.id} className={`hunt-item ${hunt.id === activeHuntId ? 'active' : ''}`} onClick={() => onSetActiveHunt(hunt.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSetActiveHunt(hunt.id); }}>
              <img src={`${SPRITE_BASE_URL}${hunt.target.id}.png`} alt={hunt.target.name} className="hunt-item-sprite" />
              <div className="hunt-item-info">
                <span className="hunt-item-name">{hunt.target.name}</span>
                <span className="hunt-item-count">{hunt.count.toLocaleString()} encounters</span>
              </div>
              <button className="hunt-item-delete-btn" title={`Delete hunt for ${hunt.target.name}`} onClick={(e) => { e.stopPropagation(); onDeleteHunt(hunt.id); }}>&times;</button>
            </div>
          )) : (
            <div className="placeholder-container">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
              <p>Search to add a new hunt.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Column 2: Trophy Case */}
      <main className="panel trophy-case-panel">
        {showLogShinyEffect && <MilestoneSparkles />}
        <div className="trophy-case-header">
            <h2>Trophy Case ({shinyCollection.length})</h2>
            <button className="add-shiny-btn" onClick={() => setModalState({ isOpen: true, initialData: {} })} >+ Add Shiny</button>
        </div>
        <div className="trophy-case-grid">
          {shinyCollection.length > 0 ? shinyCollection.map((shiny) => (
            <div key={shiny.id} className={`trophy-card ${shiny.nickname ? 'has-nickname' : ''}`}>
              <button className="trophy-delete-btn" title="Delete Shiny" onClick={() => handleDeleteShiny(shiny.id)}>&times;</button>
              <button className="trophy-share-btn" title="Share Shiny" onClick={() => setShinyToShare(shiny)}><svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"></path></svg></button>
              <img src={`${SHINY_SPRITE_BASE_URL}${shiny.pokemonId}.png`} alt={`Shiny ${shiny.name}`} className="pokemon-card-sprite" />
              {shiny.nickname && <span className="trophy-nickname">"{shiny.nickname}"</span>}
              <span className="pokemon-card-name">{shiny.name}</span>
              <div className="trophy-card-info">
                <div className="trophy-card-detail-item"><span className="trophy-card-label">Encounters</span><span className="trophy-card-value">{shiny.encounters.toLocaleString()}</span></div>
                <div className="trophy-card-detail-item"><span className="trophy-card-label">Method</span><span className="trophy-card-value">{HUNT_METHODS[shiny.method]?.name || shiny.method}</span></div>
                <div className="trophy-card-detail-item"><span className="trophy-card-label">Date</span><span className="trophy-card-value">{shiny.date}</span></div>
              </div>
            </div>
          )) : <div className="grid-placeholder"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,2H5A3,3 0 0,0 2,5V19A3,3 0 0,0 5,22H19A3,3 0 0,0 22,19V5A3,3 0 0,0 19,2M16.8,16.5L15.4,15.1L12,18.5L8.6,15.1L7.2,16.5L10.6,19.9L7.2,23.3L8.6,24.7L12,21.3L15.4,24.7L16.8,23.3L13.4,19.9L16.8,16.5M12,13.5A4.5,4.5 0 0,1 7.5,9A4.5,4.5 0 0,1 12,4.5A4.5,4.5 0 0,1 16.5,9A4.5,4.5 0 0,1 12,13.5Z"/></svg>Your shiny collection is empty.</div>}
        </div>
      </main>

      {/* Column 3: Hunt Controls */}
      <aside className="panel hunt-manager">
        <h2>Hunt Controls</h2>
        {activeHunt ? (
          <div className="hunt-active-content">
            <div className="hunt-target-display">
              <h3>{activeHunt.target.name}</h3>
              <div className="hunt-sprite-comparison">
                <div className="sprite-container"><img src={`${SPRITE_BASE_URL}${activeHunt.target.id}.png`} alt={`Normal ${activeHunt.target.name}`} className="hunt-sprite" /><span className="sprite-label">Normal</span></div>
                <div className="sprite-container"><img src={`${SHINY_SPRITE_BASE_URL}${activeHunt.target.id}.png`} alt={`Shiny ${activeHunt.target.name}`} className="hunt-sprite shiny" /><span className="sprite-label">Shiny</span></div>
              </div>
            </div>
            <div className="hunt-controls">
              <div className={`encounter-counter-wrapper ${isPopping ? 'popping' : ''}`} onClick={handleIncrement}>
                <div className="encounter-count">{activeHunt.count.toLocaleString()}</div>
                {showMilestoneEffect && <MilestoneSparkles />}
              </div>
              <div className="counter-btn-group">
                <button onClick={(e) => { e.stopPropagation(); handleDecrement(); }}>-</button>
                <button onClick={(e) => { e.stopPropagation(); handleIncrement(); }}>+</button>
              </div>
              <div className="hunt-method-selector">
                <select className="region-select" value={activeHunt.method} onChange={e => onUpdateHunt(activeHunt.id, { method: e.target.value })}>
                  {Object.entries(HUNT_METHODS).map(([key, { name }]) => <option key={key} value={key}>{name}</option>)}
                </select>
              </div>
              <div className="odds-probability-display">
                <div className="shiny-charm-toggle-container">
                  <label htmlFor="shiny-charm-toggle">Shiny Charm</label>
                  <label className="graph-toggle-switch">
                    <input id="shiny-charm-toggle" type="checkbox" checked={hasShinyCharm} onChange={() => onSetHasShinyCharm(!hasShinyCharm)} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="odds-probability-item">
                  <span>Current Odds</span>
                  <span className="value">1 / {currentOdds.toLocaleString()}</span>
                </div>
                <div className="odds-probability-item cumulative">
                  <span>Cumulative Chance</span>
                  <span className="value">{cumulativeProbability.toFixed(2)}%</span>
                </div>
                <div className="graph-toggle-container">
                  <label htmlFor="graph-toggle">Show Probability Graph</label>
                  <label className="graph-toggle-switch"><input id="graph-toggle" type="checkbox" checked={showProbabilityGraph} onChange={() => setShowProbabilityGraph(p => !p)} /><span className="slider"></span></label>
                </div>
                {showProbabilityGraph && <ProbabilityGraph odds={currentOdds} encounters={activeHunt.count} />}
                  <button onClick={() => setShowOverlayUrl(true)} className="theme-editor-btn secondary" style={{marginTop: '0.5rem'}}>Streamer Overlay</button>
              </div>
              <div className="hunt-actions">
                <button onClick={handleOpenLogModal} className="fetch-data-btn">Log Shiny!</button>
                <button onClick={handleResetCount} className="theme-editor-btn secondary">Reset Count</button>
              </div>
            </div>
          </div>
        ) : <div className="placeholder-container"><p>Select a hunt to view controls.</p></div>}
      </aside>
      
      {modalState.isOpen && <AddEditShinyModal {...modalState} pokemonList={pokemonList} onSave={handleAddShiny} onClose={() => setModalState({ isOpen: false })} />}
      {shinyToShare && pokemonList.find(p => p.id === shinyToShare.pokemonId) && <ShareShinyModal shiny={shinyToShare} pokemon={pokemonList.find(p => p.id === shinyToShare.pokemonId)!} onClose={() => setShinyToShare(null)} />}
      {showOverlayUrl && <div className="modal-overlay" onClick={() => setShowOverlayUrl(false)}><div className="modal-container" style={{maxWidth: '500px'}} onClick={e => e.stopPropagation()}><div className="overlay-url-modal-content"><h3>Streamer Overlay URL</h3><p>Add this URL as a Browser Source in OBS. The overlay will update in real-time!</p><div className="overlay-url-display">{`${window.location.origin}/overlay.html`}</div><div className="add-shiny-controls"><button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/overlay.html`)} className="theme-editor-btn primary">Copy URL</button><button onClick={() => setShowOverlayUrl(false)} className="theme-editor-btn secondary">Close</button></div></div></div></div>}
    </div>
  );
};

const AddEditShinyModal = ({ isOpen, initialData, pokemonList, onSave, onClose }: ModalState & { pokemonList: Pokemon[], onSave: (s: Omit<ShinyPokemon, 'id' | 'name'>) => void, onClose: () => void }) => {
    const [pokemon, setPokemon] = useState<Pokemon | null>(initialData?.pokemon || null);
    const [nickname, setNickname] = useState(initialData?.nickname || '');
    const [encounters, setEncounters] = useState(initialData?.encounters?.toString() || '');
    const [method, setMethod] = useState(initialData?.method || 'full-odds');
    const [date, setDate] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [search, setSearch] = useState(initialData?.pokemon?.name || '');
    const [searchResults, setSearchResults] = useState<Pokemon[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        const trimmedSearch = search.trim();
        if (!trimmedSearch || (pokemon && pokemon.name === trimmedSearch)) {
            setSearchResults([]);
            return;
        }
        setSearchResults(pokemonList.filter(p => p.name.toLowerCase().includes(trimmedSearch.toLowerCase())).slice(0, 10));
    }, [search, pokemonList, pokemon, isOpen]);

    const handleSelectPokemon = (p: Pokemon) => {
        setPokemon(p);
        setSearch(p.name);
        setSearchResults([]);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pokemon) return alert('Please select a Pokémon.');
        onSave({ pokemonId: pokemon.id, nickname, date: new Date(date).toLocaleDateString(), encounters: parseInt(encounters, 10) || 0, method });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" style={{maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <form className="add-shiny-form" onSubmit={handleSubmit}>
                    <h3 className="add-shiny-title">{initialData?.pokemonId ? 'Log Shiny' : 'Add Shiny'}</h3>
                    <div className="form-group full-width">
                        <label>Pokémon *</label>
                        <div className="hunt-search">
                            <input type="text" placeholder="Search Pokémon..." value={search} onChange={e => { setSearch(e.target.value); if(pokemon) setPokemon(null); }} required disabled={!!initialData?.pokemonId} />
                            {searchResults.length > 0 && <ul className="hunt-search-results">{searchResults.map(p => <li key={p.id} onClick={() => handleSelectPokemon(p)}>{p.name}</li>)}</ul>}
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group"><label>Nickname</label><input type="text" value={nickname} onChange={e => setNickname(e.target.value)} /></div>
                        <div className="form-group"><label>Encounters</label><input type="number" min="0" value={encounters} onChange={e => setEncounters(e.target.value)} /></div>
                        <div className="form-group"><label>Method</label><select value={method} onChange={e => setMethod(e.target.value)}>{Object.entries(HUNT_METHODS).map(([key, { name }]) => <option key={key} value={key}>{name}</option>)}</select></div>
                        <div className="form-group"><label>Date Caught</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                    </div>
                    <div className="add-shiny-controls">
                        <button type="button" onClick={onClose} className="theme-editor-btn secondary">Cancel</button>
                        <button type="submit" className="theme-editor-btn primary">Save Shiny</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShinyHuntingView;