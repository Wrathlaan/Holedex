/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Type } from "@google/genai";
import { Pokemon, Team, TeamPokemon, PokemonDetails } from '../../types.ts';
import { SPRITE_BASE_URL, TYPE_ICON_BASE_URL } from '../../constants.ts';
import { generateContent } from '../../lib/gemini.ts';
import './team_builder.css';

const detailsCache = new Map<number, PokemonDetails['abilities']>();

const buildSchema = {
  type: Type.OBJECT,
  properties: {
    buildName: { type: Type.STRING, description: "A creative name for the build, e.g., 'Swords Dance Sweeper'." },
    ability: { type: Type.STRING, description: "The recommended ability for this build." },
    heldItem: { type: Type.STRING, description: "The recommended held item." },
    nature: { type: Type.STRING, description: "The recommended nature (e.g., 'Adamant', 'Timid')." },
    evs: {
      type: Type.OBJECT,
      description: "The EV spread for this build. The sum must not exceed 510.",
      properties: {
        hp: { type: Type.INTEGER },
        atk: { type: Type.INTEGER },
        def: { type: Type.INTEGER },
        spa: { type: Type.INTEGER },
        spd: { type: Type.INTEGER },
        spe: { type: Type.INTEGER },
      },
      required: ["hp", "atk", "def", "spa", "spd", "spe"],
    },
    moves: {
      type: Type.ARRAY,
      description: "An array of exactly four recommended move names.",
      items: { type: Type.STRING },
    },
    analysis: {
      type: Type.STRING,
      description: "A concise, expert analysis (2-3 sentences) explaining the strategy of this build.",
    },
  },
  required: ["buildName", "ability", "heldItem", "nature", "evs", "moves", "analysis"],
};

// --- Helper Components (defined inside to keep it a single file) ---

const EmptyTeamSlot = ({ onAddClick }: { onAddClick: () => void }) => (
  <button className="tb-empty-slot" onClick={onAddClick}>
    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>
    <span>Add Pokémon</span>
  </button>
);

const TeamPokemonCard = ({
  teamPokemon,
  basePokemon,
  onUpdate,
  onRemove,
  onSuggestBuild,
  isLoadingSuggestion,
}: {
  teamPokemon: TeamPokemon;
  basePokemon: Pokemon;
  onUpdate: (updates: Partial<TeamPokemon>) => void;
  onRemove: () => void;
  onSuggestBuild: () => void;
  isLoadingSuggestion: boolean;
}) => {
  if (!basePokemon) return null; // Should not happen

  const spriteUrl = `${SPRITE_BASE_URL}${basePokemon.spriteId || basePokemon.id}.png`;
  const totalEVs = Object.values(teamPokemon.evs).reduce((a, b) => a + b, 0);

  return (
    <div className="tb-pokemon-card">
      <button className="tb-pokemon-remove-btn" onClick={onRemove} title="Remove from team">&times;</button>
      <div className="tb-pokemon-card-header">
        <img src={spriteUrl} alt={basePokemon.name} className="tb-pokemon-sprite" />
        <div className="tb-pokemon-info">
          <input
            type="text"
            className="tb-pokemon-nickname"
            value={teamPokemon.nickname}
            placeholder={basePokemon.name}
            onChange={(e) => onUpdate({ nickname: e.target.value })}
          />
          <div className="tb-pokemon-types">
            {basePokemon.types.map(type => (
              <img key={type} src={`${TYPE_ICON_BASE_URL}${type}.svg`} alt={type} className={`type-icon type-${type}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="tb-pokemon-card-body">
        <button className="tb-suggest-btn" onClick={onSuggestBuild} disabled={isLoadingSuggestion}>
            {isLoadingSuggestion ? 'Analyzing...' : <>
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z" /></svg>
                Suggest Build
            </>}
        </button>
        <div className="tb-form-group">
          <label>Ability</label>
          <select
            className="tb-select"
            value={teamPokemon.ability}
            onChange={e => onUpdate({ ability: e.target.value })}
            disabled={!teamPokemon.fetchedDetails?.abilities}
          >
            {teamPokemon.fetchedDetails?.abilities ? (
              teamPokemon.fetchedDetails.abilities.map(a => (
                <option key={a.name} value={a.name}>{a.name}{a.isHidden ? ' (H)' : ''}</option>
              ))
            ) : <option>Loading...</option>}
          </select>
        </div>
        <div className="tb-form-group">
          <label>Held Item</label>
          <input
            type="text"
            className="tb-input"
            placeholder="e.g., Leftovers"
            value={teamPokemon.heldItem}
            onChange={e => onUpdate({ heldItem: e.target.value })}
          />
        </div>
        <div className="tb-form-group">
          <label>Moves</label>
          <div className="tb-moves-grid">
            {teamPokemon.moves.map((move, i) => (
              <input
                key={i}
                type="text"
                className="tb-input"
                placeholder={`Move ${i + 1}`}
                value={move || ''}
                onChange={e => {
                  const newMoves = [...teamPokemon.moves];
                  newMoves[i] = e.target.value || null;
                  onUpdate({ moves: newMoves });
                }}
              />
            ))}
          </div>
        </div>
        <div className="tb-form-group-condensed">
            <label>Nature</label>
            <span>{teamPokemon.nature}</span>
        </div>
        <div className="tb-form-group-condensed">
            <label>EV Spread ({totalEVs})</label>
            <div className="tb-ev-spread-display">
                {Object.entries(teamPokemon.evs).map(([stat, value]) =>
                    value > 0 && <span key={stat}>{value} {stat.toUpperCase()}</span>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};


// --- Main View Component ---

interface TeamBuilderViewProps {
  pokemonList: Pokemon[];
  teams: Team[];
  onSetTeams: React.Dispatch<React.SetStateAction<Team[]>>;
}

const TeamBuilderView = ({ pokemonList, teams, onSetTeams }: TeamBuilderViewProps) => {
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [isFinderModalOpen, setIsFinderModalOpen] = useState(false);
  const [finderSearch, setFinderSearch] = useState('');
  const [loadingSuggestionId, setLoadingSuggestionId] = useState<string | null>(null);
  const [suggestionState, setSuggestionState] = useState<{
    isOpen: boolean;
    build: any | null;
    pokemon: Pokemon | null;
    instanceId: string | null;
    error: string | null;
  }>({ isOpen: false, build: null, pokemon: null, instanceId: null, error: null });

  // Set active team on initial load or when teams change
  useEffect(() => {
    if (!activeTeamId && teams.length > 0) {
      setActiveTeamId(teams[0].id);
    } else if (teams.length === 0) {
      setActiveTeamId(null);
    }
  }, [teams, activeTeamId]);

  const activeTeam = useMemo(() => teams.find(t => t.id === activeTeamId), [teams, activeTeamId]);

  const finderResults = useMemo(() => {
    if (finderSearch.trim().length < 2) return [];
    const query = finderSearch.trim().toLowerCase();
    return pokemonList.filter(p => p.name.toLowerCase().includes(query) || String(p.id) === query).slice(0, 50);
  }, [finderSearch, pokemonList]);

  const fetchPokemonAbilities = useCallback(async (pokemonId: number): Promise<PokemonDetails['abilities']> => {
    if (detailsCache.has(pokemonId)) {
      return detailsCache.get(pokemonId)!;
    }
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const abilities = data.abilities.map((a: any) => ({
        name: a.ability.name.replace(/-/g, ' '),
        isHidden: a.is_hidden,
      }));
      detailsCache.set(pokemonId, abilities);
      return abilities;
    } catch (e) {
      console.error(`Failed to fetch abilities for ${pokemonId}`, e);
      return [];
    }
  }, []);

  const handleCreateTeam = () => {
    const name = prompt("Enter new team name:", `Team ${teams.length + 1}`);
    if (name) {
      const newTeam: Team = { id: `${Date.now()}`, name, pokemon: [] };
      const newTeams = [...teams, newTeam];
      onSetTeams(newTeams);
      setActiveTeamId(newTeam.id);
    }
  };

  const handleRenameTeam = () => {
    if (!activeTeam) return;
    const newName = prompt("Enter new name for this team:", activeTeam.name);
    if (newName && newName !== activeTeam.name) {
      onSetTeams(teams.map(t => t.id === activeTeamId ? { ...t, name: newName } : t));
    }
  };

  const handleDeleteTeam = () => {
    if (!activeTeam) return;
    if (confirm(`Are you sure you want to delete "${activeTeam.name}"?`)) {
      onSetTeams(teams.filter(t => t.id !== activeTeamId));
      setActiveTeamId(teams.length > 1 ? teams.find(t => t.id !== activeTeamId)!.id : null);
    }
  };
  
  const handleAddPokemonToTeam = useCallback(async (pokemon: Pokemon) => {
    if (!activeTeam || activeTeam.pokemon.length >= 6) return;
    
    const abilities = await fetchPokemonAbilities(pokemon.id);
    const defaultAbility = abilities.find(a => !a.isHidden)?.name || abilities[0]?.name || '';

    const newTeamPokemon: TeamPokemon = {
      instanceId: `${Date.now()}`,
      pokemonId: pokemon.id,
      nickname: '',
      ability: defaultAbility,
      heldItem: '',
      moves: [null, null, null, null],
      nature: 'Serious',
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      fetchedDetails: { abilities },
    };

    onSetTeams(teams.map(t =>
      t.id === activeTeamId
        ? { ...t, pokemon: [...t.pokemon, newTeamPokemon] }
        : t
    ));
    setFinderSearch('');
  }, [activeTeam, teams, onSetTeams, fetchPokemonAbilities]);

  // Re-fetch details for pokemon on active team if they don't have them
  useEffect(() => {
    if (!activeTeam) return;
    let wasUpdated = false;
    const updatePromises = activeTeam.pokemon.map(async (p, index) => {
      if (!p.fetchedDetails) {
        const abilities = await fetchPokemonAbilities(p.pokemonId);
        wasUpdated = true;
        return { index, abilities };
      }
      return null;
    });

    Promise.all(updatePromises).then(updates => {
      const validUpdates = updates.filter(u => u !== null);
      if (wasUpdated && validUpdates.length > 0) {
        onSetTeams(currentTeams => currentTeams.map(team => {
          if (team.id === activeTeamId) {
            const newPokemonList = [...team.pokemon];
            validUpdates.forEach(update => {
              if (update) {
                newPokemonList[update.index] = {
                  ...newPokemonList[update.index],
                  fetchedDetails: { abilities: update.abilities },
                  ability: newPokemonList[update.index].ability || update.abilities.find(a=>!a.isHidden)?.name || update.abilities[0]?.name || ''
                };
              }
            });
            return { ...team, pokemon: newPokemonList };
          }
          return team;
        }));
      }
    });
  }, [activeTeam, fetchPokemonAbilities, onSetTeams, activeTeamId]);


  const handleUpdateTeamPokemon = (instanceId: string, updates: Partial<TeamPokemon>) => {
    if (!activeTeam) return;
    const updatedPokemonList = activeTeam.pokemon.map(p =>
      p.instanceId === instanceId ? { ...p, ...updates } : p
    );
    onSetTeams(teams.map(t =>
      t.id === activeTeamId ? { ...t, pokemon: updatedPokemonList } : t
    ));
  };

  const handleRemovePokemonFromTeam = (instanceId: string) => {
    if (!activeTeam) return;
    const updatedPokemonList = activeTeam.pokemon.filter(p => p.instanceId !== instanceId);
    onSetTeams(teams.map(t =>
      t.id === activeTeamId ? { ...t, pokemon: updatedPokemonList } : t
    ));
  };

  const handleSuggestBuild = async (teamPokemon: TeamPokemon, basePokemon: Pokemon) => {
    setLoadingSuggestionId(teamPokemon.instanceId);
    setSuggestionState({ isOpen: false, build: null, pokemon: basePokemon, instanceId: teamPokemon.instanceId, error: null });

    try {
        const prompt = `Act as a competitive Pokémon expert from Smogon. Provide a popular, effective competitive build for ${basePokemon.name}. Your response must be a single, valid JSON object conforming to the provided schema. Do not include any text outside the JSON. The analysis should be concise and explain the role and strategy of the build.`;

        const response = await generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: buildSchema,
                temperature: 0.7,
            },
        });
        
        const build = JSON.parse(response.text);
        setSuggestionState({ isOpen: true, build, pokemon: basePokemon, instanceId: teamPokemon.instanceId, error: null });

    } catch(e) {
        console.error("Failed to get build suggestion:", e);
        setSuggestionState({ isOpen: true, build: null, pokemon: basePokemon, instanceId: teamPokemon.instanceId, error: (e as Error).message || 'Could not generate a build. Please check your API settings and try again.' });
    } finally {
        setLoadingSuggestionId(null);
    }
};

  const handleApplyBuild = () => {
    const { build, instanceId } = suggestionState;
    if (!build || !instanceId) return;

    handleUpdateTeamPokemon(instanceId, {
      ability: build.ability,
      heldItem: build.heldItem,
      nature: build.nature,
      moves: build.moves.slice(0, 4).concat(Array(4 - build.moves.length).fill(null)),
      evs: build.evs,
    });
    setSuggestionState({ isOpen: false, build: null, pokemon: null, instanceId: null, error: null });
  };


  return (
    <div className="app-content tb-view">
      {/* Left Panel: Team List */}
      <aside className="panel tb-teams-list-panel">
        <h2>My Teams</h2>
        <div className="tb-teams-list">
          {teams.map(team => (
            <button
              key={team.id}
              className={`tb-team-item ${team.id === activeTeamId ? 'active' : ''}`}
              onClick={() => setActiveTeamId(team.id)}
            >
              {team.name}
            </button>
          ))}
        </div>
        <div className="tb-teams-actions">
          <button onClick={handleCreateTeam}>+ New Team</button>
          <button onClick={handleRenameTeam} disabled={!activeTeam}>Rename</button>
          <button onClick={handleDeleteTeam} disabled={!activeTeam}>Delete</button>
        </div>
      </aside>

      {/* Center Panel: Team Display */}
      <main className="panel tb-team-display-panel">
        <h2>{activeTeam ? activeTeam.name : 'No Team Selected'}</h2>
        {activeTeam ? (
          <div className="tb-team-grid">
            {activeTeam.pokemon.map(p => {
              const basePokemon = pokemonList.find(bp => bp.id === p.pokemonId);
              return basePokemon ? (
                <TeamPokemonCard
                  key={p.instanceId}
                  teamPokemon={p}
                  basePokemon={basePokemon}
                  onUpdate={(updates) => handleUpdateTeamPokemon(p.instanceId, updates)}
                  onRemove={() => handleRemovePokemonFromTeam(p.instanceId)}
                  onSuggestBuild={() => handleSuggestBuild(p, basePokemon)}
                  isLoadingSuggestion={loadingSuggestionId === p.instanceId}
                />
              ) : null;
            })}
            {Array.from({ length: 6 - activeTeam.pokemon.length }).map((_, i) => (
              <EmptyTeamSlot key={i} onAddClick={() => setIsFinderModalOpen(true)} />
            ))}
          </div>
        ) : (
          <div className="placeholder-container">
            <p>Create a new team to get started!</p>
          </div>
        )}
      </main>

      {/* Finder Modal */}
      {isFinderModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFinderModalOpen(false)}>
            <div className="modal-container" style={{maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={() => setIsFinderModalOpen(false)}>&times;</button>
                <div className="settings-content">
                    <h2 className="settings-title">Add Pokémon to Team</h2>
                    <input
                        id="finder-search-input"
                        type="text"
                        className="search-input"
                        placeholder="Search for a Pokémon..."
                        value={finderSearch}
                        onChange={(e) => setFinderSearch(e.target.value)}
                        autoFocus
                    />
                    <div className="tb-finder-results">
                        {finderResults.length > 0 ? finderResults.map(p => (
                            <div key={p.id} className="tb-finder-item">
                                <img src={`${SPRITE_BASE_URL}${p.id}.png`} alt={p.name} />
                                <span>{p.name}</span>
                                <button
                                    onClick={() => {
                                        handleAddPokemonToTeam(p);
                                        setIsFinderModalOpen(false);
                                    }}
                                    disabled={!!activeTeam && activeTeam.pokemon.length >= 6}
                                    title={activeTeam && activeTeam.pokemon.length >= 6 ? 'Team is full' : 'Add to team'}
                                >
                                    +
                                </button>
                            </div>
                        )) : (
                            <div className="tb-finder-placeholder" style={{padding: '2rem 0'}}>
                                {finderSearch ? 'No results found.' : 'Start typing to search.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Suggestion Modal */}
      {suggestionState.isOpen && (
        <div className="modal-overlay" onClick={() => setSuggestionState({ ...suggestionState, isOpen: false })}>
            <div className="modal-container" style={{maxWidth: '600px'}} onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={() => setSuggestionState({ ...suggestionState, isOpen: false })}>&times;</button>
                <div className="tb-suggestion-modal-content">
                    <div className="tb-suggestion-header">
                        <h3>{suggestionState.pokemon?.name} Build Suggestion</h3>
                        {suggestionState.build && <p>{suggestionState.build.buildName}</p>}
                    </div>

                    {loadingSuggestionId ? (
                        <div className="suspense-loader" />
                    ) : suggestionState.error ? (
                        <div className="placeholder-container">{suggestionState.error}</div>
                    ) : suggestionState.build && (
                        <>
                            <div className="tb-suggestion-build">
                                <div className="tb-suggestion-item"><label>Ability</label><span>{suggestionState.build.ability}</span></div>
                                <div className="tb-suggestion-item"><label>Nature</label><span>{suggestionState.build.nature}</span></div>
                                <div className="tb-suggestion-item"><label>Item</label><span>{suggestionState.build.heldItem}</span></div>
                                <div className="tb-suggestion-item"><label>EVs</label><span>{Object.entries(suggestionState.build.evs).filter(([, val]) => (val as number) > 0).map(([key, val]) => `${val} ${key.toUpperCase()}`).join(' / ')}</span></div>
                                <div className="tb-suggestion-item full-width"><label>Moves</label>
                                  <ul>{suggestionState.build.moves.map((m: string) => <li key={m}>{m}</li>)}</ul>
                                </div>
                            </div>
                            <div className="tb-suggestion-analysis">
                                <p>{suggestionState.build.analysis}</p>
                            </div>
                        </>
                    )}
                    
                    <div className="tb-suggestion-controls">
                      <button onClick={() => setSuggestionState({ ...suggestionState, isOpen: false })} className="fetch-data-btn" style={{backgroundColor: 'var(--panel-light)'}}>Cancel</button>
                      <button onClick={handleApplyBuild} className="fetch-data-btn" disabled={!suggestionState.build || !!loadingSuggestionId}>Apply Build</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TeamBuilderView;