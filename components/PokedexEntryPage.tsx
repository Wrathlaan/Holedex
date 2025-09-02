/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Pokemon, PokemonDetails, EvolutionNode, Move } from '../types.ts';
import { TYPE_ICON_BASE_URL, SPRITE_BASE_URL, SHINY_SPRITE_BASE_URL, STAT_NAME_MAP, STAT_ORDER, MAX_STAT_VALUE, POKEBALL_URL, CRY_BASE_URL } from '../constants.ts';

const moveCache = new Map();

interface PokedexEntryPageProps {
  pokemon: Pokemon;
  onClose: () => void;
  favorites: number[];
  onToggleFavorite: (pokemonId: number) => void;
  isShinyMode: boolean;
  onPokemonSelect: (pokemon: Pokemon) => void;
  pokemonList: Pokemon[];
  pokemonStatuses: Record<number, 'seen' | 'caught'>;
  onToggleStatus: (pokemonId: number) => void;
}

const getEvolutionMethod = (details: any[]): string => {
  if (!details || details.length === 0) return 'Special';
  const d = details[0];
  const conditions: string[] = [];

  const formattedName = (name: string) => name.replace(/-/g, ' ');

  switch (d.trigger?.name) {
    case 'level-up':
      conditions.push(d.min_level ? `Lvl ${d.min_level}` : 'Level Up');
      break;
    case 'use-item':
      conditions.push(d.item?.name ? `Use ${formattedName(d.item.name)}` : 'Use Item');
      break;
    case 'trade':
      conditions.push('Trade');
      break;
    default:
      conditions.push(d.trigger?.name ? formattedName(d.trigger.name) : 'Special');
      break;
  }

  if (d.held_item?.name) conditions.push(`w/ ${formattedName(d.held_item.name)}`);
  if (d.known_move?.name) conditions.push(`knowing ${formattedName(d.known_move.name)}`);
  if (d.min_happiness) conditions.push(`w/ Friendship`);
  if (d.time_of_day) conditions.push(`at ${d.time_of_day}`);
  if (d.gender === 1) conditions.push('(♀)');
  if (d.gender === 2) conditions.push('(♂)');

  return conditions.join(' ');
};

const formatFormName = (name: string) => {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};


const EvolutionChainNode: React.FC<{
  node: EvolutionNode;
  currentPokemonId: number;
  onSelect: (pokemon: Pokemon) => void;
  pokemonList: Pokemon[];
}> = ({ node, currentPokemonId, onSelect, pokemonList }) => {
  const pokemonForNode = pokemonList.find(p => p.id === node.pokemonId);
  if (!pokemonForNode) return null;

  const handleSelect = () => {
    if (pokemonForNode.id !== currentPokemonId) {
      onSelect(pokemonForNode);
    }
  };

  return (
    <div className="evolution-stage-group">
      <div
        className={`evolution-stage ${currentPokemonId === node.pokemonId ? 'active' : ''}`}
        onClick={handleSelect}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelect()}
        role="button"
        tabIndex={pokemonForNode.id !== currentPokemonId ? 0 : -1}
        aria-label={`View ${node.speciesName}`}
      >
        <img src={`${SPRITE_BASE_URL}${node.pokemonId}.png`} alt={node.speciesName} className="evolution-sprite" />
        <span className="evolution-name">{node.speciesName}</span>
      </div>

      {node.evolutions.length > 0 && (
        <div className="evolution-connector-group">
          {node.evolutions.map(({ node: evoNode, method }) => (
            <div className="evolution-path" key={evoNode.pokemonId}>
              <div className="evolution-connector">
                <div className="evolution-method">{method}</div>
                <svg className="evolution-arrow" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>
              </div>
              <EvolutionChainNode
                node={evoNode}
                currentPokemonId={currentPokemonId}
                onSelect={onSelect}
                pokemonList={pokemonList}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PokedexEntryPage: React.FC<PokedexEntryPageProps> = ({ pokemon, onClose, favorites, onToggleFavorite, isShinyMode, onPokemonSelect, pokemonList, pokemonStatuses, onToggleStatus }) => {
  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFormUrl, setActiveFormUrl] = useState(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}/`);
  
  // Overview Tab State
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  
  // Main Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'moves'>('overview');
  
  // Moves Tab State
  const [selectedVersionGroup, setSelectedVersionGroup] = useState('');
  const [selectedMoveCategory, setSelectedMoveCategory] = useState('level-up');
  const [moveSearchQuery, setMoveSearchQuery] = useState('');

  // Reset active form and tab when the base Pokémon prop changes
  useEffect(() => {
    const newUrl = `https://pokeapi.co/api/v2/pokemon/${pokemon.id}/`;
    if (newUrl !== activeFormUrl) {
        setActiveFormUrl(newUrl);
        setActiveTab('overview');
    }
  }, [pokemon.id]);


  useEffect(() => {
    if (!activeFormUrl) return;

    const controller = new AbortController();
    const { signal } = controller;

    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const pokemonRes = await fetch(activeFormUrl, { signal });
        if (!pokemonRes.ok) throw new Error('Failed to fetch Pokémon form data.');
        const pokemonData = await pokemonRes.json();
        
        const speciesRes = await fetch(pokemonData.species.url, { signal });
        if (!speciesRes.ok) throw new Error('Failed to fetch Pokémon species data.');
        const speciesData = await speciesRes.json();

        if (signal.aborted) return;
        
        // --- Process Abilities ---
        const abilityPromises = pokemonData.abilities.map(async (ability: any) => {
          const abilityRes = await fetch(ability.ability.url, { signal });
          if (!abilityRes.ok) return null;
          const abilityData = await abilityRes.json();
          const englishEffectEntry = abilityData.effect_entries.find((e: any) => e.language.name === 'en');
          return {
            name: ability.ability.name.replace(/-/g, ' '),
            description: englishEffectEntry ? englishEffectEntry.short_effect : 'No description available.',
            isHidden: ability.is_hidden,
          };
        });
        
        // --- Process Species-Level Data ---
        const englishGenus = speciesData.genera.find((g: any) => g.language.name === 'en');
        const category = englishGenus ? englishGenus.genus : 'Unknown';
        
        const pokedexEntries = speciesData.flavor_text_entries
          .filter((e: any) => e.language.name === 'en')
          .map((e: any) => ({ version: e.version.name.replace(/-/g, ' '), text: e.flavor_text.replace(/[\n\f\r]/g, ' ') }))
          .reduce((acc: { version: string; text: string }[], current: { version: string; text: string }) => {
            if (!acc.some(item => item.text === current.text)) acc.push(current);
            return acc;
          }, []);

        let evolutionChain: EvolutionNode | null = null;
        if (speciesData.evolution_chain?.url) {
          const evoRes = await fetch(speciesData.evolution_chain.url, { signal });
          if (evoRes.ok && !signal.aborted) {
            const evoData = await evoRes.json();
            const parseNode = (node: any): EvolutionNode | null => {
              const name = node.species.name;
              const foundPokemon = pokemonList.find(p => p.name.split('-')[0] === name);
              if (!foundPokemon) return null;
              return {
                speciesName: name, pokemonId: foundPokemon.id,
                evolutions: node.evolves_to.map((evo: any) => {
                  const nextNode = parseNode(evo);
                  return nextNode ? { node: nextNode, method: getEvolutionMethod(evo.evolution_details) } : null;
                }).filter((n): n is { node: EvolutionNode; method: string } => n !== null),
              };
            };
            evolutionChain = parseNode(evoData.chain);
          }
        }
        
        // --- Process Moves ---
        const uniqueMoveUrls = new Set(pokemonData.moves.map((m: any) => m.move.url));
        const moveFetchPromises = Array.from(uniqueMoveUrls).filter(url => !moveCache.has(url)).map(url => fetch(url as string, { signal }).then(res => res.json()));
        if (moveFetchPromises.length > 0) {
            const newMoveDetails = await Promise.all(moveFetchPromises);
            newMoveDetails.forEach(moveDetail => {
                const url = `https://pokeapi.co/api/v2/move/${moveDetail.id}/`;
                moveCache.set(url, { name: moveDetail.name, type: moveDetail.type.name, damage_class: moveDetail.damage_class.name, power: moveDetail.power, accuracy: moveDetail.accuracy, pp: moveDetail.pp });
            });
        }
        
        const processedMoves: PokemonDetails['moves'] = {};
        const versionGroupsSet = new Set<string>();
        pokemonData.moves.forEach((pokemonMove: any) => {
            const moveDetail = moveCache.get(pokemonMove.move.url);
            if (!moveDetail) return;
            pokemonMove.version_group_details.forEach((vgd: any) => {
                const vgName = vgd.version_group.name;
                const learnMethod = vgd.move_learn_method.name;
                if (!['level-up', 'machine', 'egg', 'tutor'].includes(learnMethod)) return;
                versionGroupsSet.add(vgName);
                if (!processedMoves![vgName]) processedMoves![vgName] = {};
                if (!processedMoves![vgName][learnMethod as keyof typeof processedMoves]) processedMoves![vgName][learnMethod as keyof typeof processedMoves] = [];
                processedMoves![vgName][learnMethod as keyof typeof processedMoves]!.push({ ...moveDetail, level: vgd.level_learned_at });
            });
        });
        Object.values(processedMoves).forEach(vg => {
            if (vg['level-up']) vg['level-up']!.sort((a, b) => (a.level || 0) - (b.level || 0));
        });
        const sortedVersionGroups = Array.from(versionGroupsSet).sort((a,b) => b.localeCompare(a));
        
        if (signal.aborted) return;
        
        const abilities = (await Promise.all(abilityPromises)).filter(Boolean) as PokemonDetails['abilities'];
        
        if (signal.aborted) return;
        
        setDetails({
            id: pokemonData.id,
            name: pokemonData.name.replace(/-/g, ' '),
            types: pokemonData.types.map((t: any) => t.type.name),
            height: pokemonData.height / 10,
            weight: pokemonData.weight / 10,
            category,
            abilities,
            pokedexEntries,
            habitat: speciesData.habitat?.name || null,
            captureRate: speciesData.capture_rate,
            evolutionChain,
            stats: pokemonData.stats.map((s: any) => ({ name: s.stat.name, base_stat: s.base_stat, ev_yield: s.effort })),
            growthRate: speciesData.growth_rate.name.replace(/-/g, ' '),
            moves: processedMoves,
            versionGroups: sortedVersionGroups,
            varieties: speciesData.varieties,
        });

        if (sortedVersionGroups.length > 0 && (selectedVersionGroup === '' || !sortedVersionGroups.includes(selectedVersionGroup))) {
            setSelectedVersionGroup(sortedVersionGroups[0]);
        }

      } catch (err) {
        if (!signal.aborted) {
          console.error(err);
          setError('Could not load Pokémon details.');
        }
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    };

    fetchDetails();
    return () => controller.abort();
  }, [activeFormUrl, pokemonList]);

  // Use species ID for persistent data, and sprite ID for visual form
  const speciesId = pokemon.id;
  const currentSpriteId = details?.id || pokemon.id;
  
  const currentName = details?.name || pokemon.name;
  const currentTypes = details?.types || pokemon.types;
  const isCaught = pokemonStatuses[speciesId] === 'caught';

  const handlePlayCry = useCallback(() => {
    const cryUrl = `${CRY_BASE_URL}${speciesId}.ogg`;
    new Audio(cryUrl).play().catch(e => console.error("Audio playback failed:", e));
  }, [speciesId]);


  const { prevPokemon, nextPokemon } = useMemo(() => {
    const currentIndex = pokemonList.findIndex(p => p.id === pokemon.id);
    if (currentIndex === -1) return { prevPokemon: null, nextPokemon: null };
    return {
      prevPokemon: currentIndex > 0 ? pokemonList[currentIndex - 1] : null,
      nextPokemon: currentIndex < pokemonList.length - 1 ? pokemonList[currentIndex + 1] : null,
    };
  }, [pokemon.id, pokemonList]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.querySelector('.modal-overlay')) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'ArrowLeft' && prevPokemon) {
        onPokemonSelect(prevPokemon);
      } else if (e.key === 'ArrowRight' && nextPokemon) {
        onPokemonSelect(nextPokemon);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [prevPokemon, nextPokemon, onPokemonSelect, onClose]);

  const isFavorite = favorites.includes(speciesId);
  const spriteUrl = isShinyMode
    ? `${SHINY_SPRITE_BASE_URL}${currentSpriteId}.png`
    : `${SPRITE_BASE_URL}${currentSpriteId}.png`;

  const primaryType = currentTypes[0] || 'normal';
  const secondaryType = currentTypes[1] || primaryType;

  const visualStyle = {
    '--type-color-1': `var(--type-${primaryType})`,
    '--type-color-2': `var(--type-${secondaryType})`,
  } as React.CSSProperties;

  const getEVYield = () => {
    if (!details?.stats) return 'N/A';
    return details.stats
      .filter(stat => stat.ev_yield > 0)
      .map(stat => `${stat.ev_yield} ${STAT_NAME_MAP[stat.name]}`)
      .join(', ');
  };

  const orderedStats = details ? STAT_ORDER.map(statName => details.stats.find(s => s.name === statName)!) : [];

  const movesForVersion = details?.moves?.[selectedVersionGroup] || {};
  const movesForCategory = movesForVersion[selectedMoveCategory as keyof typeof movesForVersion] || [];
  const filteredMoves = useMemo(() => {
    return movesForCategory.filter(move =>
      move.name.toLowerCase().replace(/-/g, ' ').includes(moveSearchQuery.toLowerCase().replace(/-/g, ' '))
    );
  }, [movesForCategory, moveSearchQuery]);

  return (
    <div className="entry-page-container">
      <header className="entry-page-header">
        <button className="entry-page-back-btn" onClick={onClose} title="Back to Pokédex">
            <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
        </button>
        <div className="entry-page-title-group">
          <div className="entry-page-name-wrapper">
            <h1>{currentName}</h1>
            <span className="entry-page-id">#{String(speciesId).padStart(4, '0')}</span>
          </div>
          <div className="entry-page-types">
            {currentTypes.map(type => (
              <img
                key={type}
                src={`${TYPE_ICON_BASE_URL}${type}.svg`}
                alt={`${type} type`}
                className={`type-icon type-${type}`}
                title={type.charAt(0).toUpperCase() + type.slice(1)}
              />
            ))}
          </div>
        </div>
        <div className="entry-page-center-nav">
          <button
            className="header-nav-btn prev"
            onClick={() => prevPokemon && onPokemonSelect(prevPokemon)}
            disabled={!prevPokemon}
            title={prevPokemon ? `Previous: ${prevPokemon.name}` : 'First Pokémon'}
          >
            <span>&#9664; Prev</span>
          </button>
          <button
            className="header-nav-btn next"
            onClick={() => nextPokemon && onPokemonSelect(nextPokemon)}
            disabled={!nextPokemon}
            title={nextPokemon ? `Next: ${nextPokemon.name}` : 'Last Pokémon'}
          >
            <span>Next &#9654;</span>
          </button>
        </div>
        <div className="entry-page-header-actions">
          <button className="icon-action-btn" onClick={() => onToggleStatus(speciesId)} title={`Status: ${isCaught ? 'Caught' : 'Seen'}`}>
            <img src={POKEBALL_URL} alt="Status" className={`status-icon-entry ${!isCaught ? 'seen' : ''}`} />
          </button>
          <button className="icon-action-btn" onClick={handlePlayCry} title="Play Cry">
            <svg className="cry-icon-entry" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
          <button
            className={`favorite-btn-entry ${isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(speciesId)}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        </div>
      </header>
      
      <main className="entry-page-main">
        <section className="entry-page-visual" style={visualStyle}>
          <img
            key={spriteUrl}
            src={spriteUrl}
            alt={currentName}
            className="entry-page-sprite"
          />
        </section>

        <section className="entry-page-info">
          {isLoading && !details && <div className="info-panel-placeholder">Loading details...</div>}
          {error && <div className="info-panel-placeholder">{error}</div>}
          {details && (
            <>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-item-label">Height</span>
                  <span className="info-item-value">{details.height} m</span>
                </div>
                <div className="info-item">
                  <span className="info-item-label">Weight</span>
                  <span className="info-item-value">{details.weight} kg</span>
                </div>
                <div className="info-item">
                  <span className="info-item-label">Category</span>
                  <span className="info-item-value">{details.category.replace(' Pokémon', '')}</span>
                </div>
              </div>
              <div className="abilities-section">
                <h3 className="abilities-section-title">Abilities</h3>
                <div className="abilities-list">
                  {details.abilities.map(ability => (
                    <div
                      key={ability.name}
                      className={`ability-item ${ability.isHidden ? 'hidden' : ''}`}
                      data-description={ability.description}
                      tabIndex={0}
                    >
                      {ability.name}
                    </div>
                  ))}
                </div>
              </div>
              {details.varieties && details.varieties.length > 1 && (
                <div className="forms-section">
                  <h3 className="forms-section-title">Alternate Forms</h3>
                  <div className="forms-toggle-list">
                      {details.varieties.map(variant => {
                          const variantUrl = variant.pokemon.url;
                          const isActive = variantUrl === activeFormUrl;
                          return (
                              <button
                                  key={variant.pokemon.name}
                                  className={`form-toggle-btn ${isActive ? 'active' : ''}`}
                                  onClick={() => setActiveFormUrl(variantUrl)}
                                  disabled={isActive}
                                  aria-pressed={isActive}
                              >
                                  {formatFormName(variant.pokemon.name)}
                              </button>
                          );
                      })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <div className="entry-page-tab-container">
        <nav className="entry-page-tabs">
            <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')} role="tab" aria-selected={activeTab === 'overview'}>Overview</button>
            <button className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')} role="tab" aria-selected={activeTab === 'stats'}>Stats</button>
            <button className={`tab-btn ${activeTab === 'moves' ? 'active' : ''}`} onClick={() => setActiveTab('moves')} role="tab" aria-selected={activeTab === 'moves'}>Moves</button>
        </nav>

        {activeTab === 'overview' && (
             <div className="entry-page-tab-content" role="tabpanel">
             {details ? (
               <>
                 <div className="overview-section flavor-text-section">
                   <h3>Pokédex Entry</h3>
                   {details.pokedexEntries.length > 0 ? (
                    <>
                     <select className="region-select" value={selectedVersionIndex} onChange={e => setSelectedVersionIndex(parseInt(e.target.value))}>
                       {details.pokedexEntries.map((entry, index) => (
                         <option key={entry.version + index} value={index}>
                           Pokémon {entry.version}
                         </option>
                       ))}
                     </select>
                     <p className="flavor-text">
                       {details.pokedexEntries[selectedVersionIndex]?.text}
                     </p>
                    </>
                   ) : <p className="flavor-text">No Pokédex entry found for this Pokémon.</p>}
                 </div>
     
                 <div className="overview-section">
                   <h3>Habitat & Capture</h3>
                   <div className="capture-info-grid">
                     <div>
                       <label>Habitat</label>
                       <span>{details.habitat ? details.habitat.replace(/-/g, ' ') : 'Unknown'}</span>
                     </div>
                     <div>
                       <label>Capture Rate</label>
                       <span>{((details.captureRate / 255) * 100).toFixed(1)}%</span>
                     </div>
                   </div>
                 </div>
                 
                 {details.evolutionChain && (details.evolutionChain.evolutions.length > 0 || speciesId !== details.evolutionChain.pokemonId) && (
                   <div className="overview-section evolution-section">
                     <h3>Evolution Chain</h3>
                     <div className="evolution-chain-container">
                       <EvolutionChainNode
                         node={details.evolutionChain}
                         currentPokemonId={speciesId}
                         onSelect={onPokemonSelect}
                         pokemonList={pokemonList}
                       />
                     </div>
                   </div>
                 )}
               </>
             ) : isLoading ? (
               <div className="info-panel-placeholder">Loading Overview...</div>
             ) : error ? (
               <div className="info-panel-placeholder">{error}</div>
             ) : null}
           </div>
        )}

        {activeTab === 'stats' && (
            <div className="entry-page-tab-content" role="tabpanel">
                {details ? (
                    <div className="stats-tab-content">
                        <div className="stats-section">
                            <h3>Base Stats</h3>
                            <ul className="stats-list">
                                {orderedStats.map(stat => stat && (
                                    <li key={stat.name} className="stat-item">
                                        <span className="stat-name">{STAT_NAME_MAP[stat.name]}</span>
                                        <span className="stat-value">{stat.base_stat}</span>
                                        <div className="stat-bar-container" title={`${stat.base_stat} / ${MAX_STAT_VALUE}`}>
                                            <div
                                                className="stat-bar-fill"
                                                style={{
                                                    width: `${(stat.base_stat / MAX_STAT_VALUE) * 100}%`,
                                                    backgroundColor: `var(--type-${primaryType})`
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="stats-section">
                            <h3>Training</h3>
                            <div className="training-info-grid">
                                <div className="training-info-item">
                                    <label>EV Yield</label>
                                    <span>{getEVYield()}</span>
                                </div>
                                <div className="training-info-item">
                                    <label>Growth Rate</label>
                                    <span>{details.growthRate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : isLoading ? (
                    <div className="info-panel-placeholder">Loading Stats...</div>
                  ) : error ? (
                    <div className="info-panel-placeholder">{error}</div>
                  ) : null}
            </div>
        )}

        {activeTab === 'moves' && (
            <div className="entry-page-tab-content" role="tabpanel">
                {details?.moves && details.versionGroups ? (
                    <>
                        <div className="moves-tab-controls">
                            <select className="region-select move-version-select" value={selectedVersionGroup} onChange={e => setSelectedVersionGroup(e.target.value)}>
                                {details.versionGroups.map(vg => <option key={vg} value={vg}>{vg.replace(/-/g, ' ')}</option>)}
                            </select>
                            <div className="move-category-btns">
                                <button className={`move-category-btn ${selectedMoveCategory === 'level-up' ? 'active' : ''}`} onClick={() => setSelectedMoveCategory('level-up')}>Level-Up</button>
                                <button className={`move-category-btn ${selectedMoveCategory === 'machine' ? 'active' : ''}`} onClick={() => setSelectedMoveCategory('machine')}>Machine</button>
                                <button className={`move-category-btn ${selectedMoveCategory === 'egg' ? 'active' : ''}`} onClick={() => setSelectedMoveCategory('egg')}>Egg</button>
                                <button className={`move-category-btn ${selectedMoveCategory === 'tutor' ? 'active' : ''}`} onClick={() => setSelectedMoveCategory('tutor')}>Tutor</button>
                            </div>
                            <input type="text" placeholder="Search moves..." className="search-input move-search-input" value={moveSearchQuery} onChange={e => setMoveSearchQuery(e.target.value)} />
                        </div>

                        <div className="moves-table-container">
                            <table className="moves-table">
                                <thead>
                                    <tr>
                                        {selectedMoveCategory === 'level-up' && <th>Lvl</th>}
                                        <th>Move</th>
                                        <th>Type</th>
                                        <th>Cat.</th>
                                        <th>Pow.</th>
                                        <th>Acc.</th>
                                        <th>PP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMoves.length > 0 ? filteredMoves.map(move => (
                                        <tr key={move.name}>
                                            {selectedMoveCategory === 'level-up' && <td>{move.level === 0 ? 'Evo' : move.level}</td>}
                                            <td className="move-name-cell">{move.name.replace(/-/g, ' ')}</td>
                                            <td className="move-type-cell">
                                              <img src={`${TYPE_ICON_BASE_URL}${move.type}.svg`} alt={move.type} className={`type-icon type-${move.type}`} title={move.type} />
                                              <span>{move.type}</span>
                                            </td>
                                            <td>
                                                <img 
                                                    src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/categories/${move.damage_class}.png`} 
                                                    alt={move.damage_class}
                                                    title={move.damage_class}
                                                    className="move-damage-class-icon"
                                                />
                                            </td>
                                            <td>{move.power ?? '—'}</td>
                                            <td>{move.accuracy ?? '—'}</td>
                                            <td>{move.pp ?? '—'}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={7} className="info-panel-placeholder" style={{height: '100px'}}>No moves found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : isLoading ? (
                    <div className="info-panel-placeholder">Loading Moves...</div>
                ) : error ? (
                    <div className="info-panel-placeholder">{error}</div>
                ) : <div className="info-panel-placeholder">No move data available for this Pokémon.</div>}
            </div>
        )}
      </div>
    </div>
  );
};

export default PokedexEntryPage;