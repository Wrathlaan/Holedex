/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Pokemon } from '../types';

interface ProfileProps {
  pokemon: Pokemon;
  pokemonStatuses: Record<number, 'seen' | 'caught'>;
  onToggleStatus: (pokemonId: number) => void;
  favorites: number[];
  onToggleFavorite: (pokemonId: number) => void;
  onPokemonSelect: (pokemon: Pokemon) => void;
  pokemonList: Pokemon[];
  onClose: () => void;
}

interface Stat {
  name: string;
  base_stat: number;
}

// Updated interface to include evolution method for each subsequent node
interface EvolutionNode {
  speciesName: string;
  pokemonId: number;
  evolutions: {
    node: EvolutionNode;
    method: string;
  }[];
}

const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
const SHINY_SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/';
const TYPE_ICON_BASE_URL = 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/';
const POKEBALL_URL = 'https://upload.wikimedia.org/wikipedia/commons/5/53/Pok%C3%A9_Ball_icon.svg';
const STAR_URL = 'https://upload.wikimedia.org/wikipedia/commons/2/29/Gold_Star.svg';
const CRY_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/';
const CORS_PROXY = 'https://corsproxy.io/?';

const STAT_NAME_MAP: { [key: string]: string } = {
  'hp': 'HP',
  'attack': 'ATK',
  'defense': 'DEF',
  'special-attack': 'S.ATK',
  'special-defense': 'S.DEF',
  'speed': 'SPD',
};

const STAT_ORDER = ['hp', 'attack', 'defense', 'speed', 'special-defense', 'special-attack'];
const MAX_STAT_VALUE = 255;

interface StatsRadarProps {
  stats: Stat[];
  typeColor: string;
}

const StatsRadar = ({ stats, typeColor }: StatsRadarProps) => {
  const size = 240;
  const center = size / 2;
  const radius = size * 0.35;

  const orderedStats = STAT_ORDER.map(statName => {
    const stat = stats.find(s => s.name === statName);
    return stat || { name: statName, base_stat: 0 };
  });

  const getPoint = (value: number, index: number) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2; // Start from top (HP)
    const x = center + (radius * value / MAX_STAT_VALUE) * Math.cos(angle);
    const y = center + (radius * value / MAX_STAT_VALUE) * Math.sin(angle);
    return { x, y };
  };

  const statPoints = orderedStats.map((stat, i) => getPoint(stat.base_stat, i));
  const statPath = statPoints.map(p => `${p.x},${p.y}`).join(' ');

  const gridLevels = 4;

  return (
    <div className="stats-radar-container">
      <svg className="stats-radar-svg" viewBox={`0 0 ${size} ${size}`}>
        <g>
          {[...Array(gridLevels)].map((_, level) => {
            const levelValue = MAX_STAT_VALUE * ((level + 1) / gridLevels);
            const points = STAT_ORDER.map((_, i) => getPoint(levelValue, i));
            const path = points.map(p => `${p.x},${p.y}`).join(' ');
            return <polygon key={level} className="radar-grid-line" points={path} />;
          })}
          {STAT_ORDER.map((_, i) => {
            const endPoint = getPoint(MAX_STAT_VALUE, i);
            return <line key={i} className="radar-axis-line" x1={center} y1={center} x2={endPoint.x} y2={endPoint.y} />;
          })}
          <polygon className="radar-stat-shape" points={statPath} style={{ fill: typeColor, stroke: typeColor }} />
          
          {orderedStats.map((stat, i) => {
            const labelPoint = getPoint(MAX_STAT_VALUE * 1.3, i);
            return (
              <text
                key={stat.name}
                x={labelPoint.x}
                y={labelPoint.y}
                className="radar-label"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                <tspan className="radar-label-name">{STAT_NAME_MAP[stat.name] || stat.name}</tspan>
                <tspan className="radar-label-value">{` [${stat.base_stat}]`}</tspan>
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

// Rewritten EvolutionChainNode component for detailed, branching chains
const EvolutionChainNode: React.FC<{
  node: EvolutionNode;
  currentPokemonId: number;
  onPokemonSelect: (pokemon: Pokemon) => void;
  pokemonList: Pokemon[];
}> = ({ node, currentPokemonId, onPokemonSelect, pokemonList }) => {
  const pokemonForNode = pokemonList.find(p => p.id === node.pokemonId);
  if (!pokemonForNode) return null;

  const handleSelect = () => {
    if (pokemonForNode.id !== currentPokemonId) {
      onPokemonSelect(pokemonForNode);
    }
  };

  return (
    <div className="evolution-stage-group">
      <div
        className={`evolution-stage ${currentPokemonId === node.pokemonId ? 'active' : ''}`}
        onClick={handleSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(); }}
        aria-label={`Select ${node.speciesName}`}
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
                <svg className="evolution-arrow" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                </svg>
              </div>
              <EvolutionChainNode
                node={evoNode}
                currentPokemonId={currentPokemonId}
                onPokemonSelect={onPokemonSelect}
                pokemonList={pokemonList}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to format API names into human-readable strings
const formatName = (name: string): string =>
  name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

// Helper function to parse evolution details into a concise string
const getEvolutionMethod = (details: any[]): string => {
  if (!details || details.length === 0) return '';
  const detail = details[0];

  const trigger = detail.trigger.name;
  const parts: string[] = [];

  switch (trigger) {
    case 'level-up':
      if (detail.min_level) {
        parts.push(`Lvl ${detail.min_level}`);
      } else {
        parts.push('Level Up');
      }
      break;
    case 'use-item':
      parts.push(`Use ${formatName(detail.item.name)}`);
      break;
    case 'trade':
      parts.push('Trade');
      break;
    case 'shed':
      return 'Special';
    default:
      parts.push(formatName(trigger));
  }
  
  if (detail.held_item) {
    parts.push(`w/ ${formatName(detail.held_item.name)}`);
  }
  if (detail.min_happiness) {
    parts.push('w/ Friendship');
  }
  if (detail.time_of_day) {
    parts.push(`at ${detail.time_of_day}`);
  }

  return parts.join(' ');
};

const Profile = ({ pokemon, pokemonStatuses, onToggleStatus, favorites, onToggleFavorite, onPokemonSelect, pokemonList, onClose }: ProfileProps) => {
  // State for the Pokémon currently being displayed and animated
  const [currentPokemon, setCurrentPokemon] = useState(pokemon);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isShiny, setIsShiny] = useState(false);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');

  // Data states for the displayed Pokémon
  const [pokedexEntry, setPokedexEntry] = useState<string | null>(null);
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [evolutionChain, setEvolutionChain] = useState<EvolutionNode | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // New states for handling forms
  const [types, setTypes] = useState<string[]>([]);
  const [spriteUrl, setSpriteUrl] = useState<string>('');
  const [forms, setForms] = useState<{ name: string, url: string }[]>([]);
  const [selectedFormUrl, setSelectedFormUrl] = useState<string>('');

  const status = pokemonStatuses[currentPokemon.id] || 'seen';
  const isCaught = status === 'caught';
  const isFavorite = favorites.includes(currentPokemon.id);

  // Effect to trigger the fade-out animation when the external `pokemon` prop changes
  useEffect(() => {
    if (pokemon.id !== currentPokemon.id) {
      if (contentWrapperRef.current) {
        setContentHeight(contentWrapperRef.current.offsetHeight);
      }
      setIsTransitioning(true);
      setIsShiny(false);
    }
  }, [pokemon, currentPokemon.id]);

  useEffect(() => {
    if (contentHeight !== 'auto' && !isTransitioning && !isLoadingData) {
      setContentHeight('auto');
    }
  }, [isTransitioning, isLoadingData, contentHeight]);


  const handleAnimationEnd = () => {
    if (isTransitioning) {
      setCurrentPokemon(pokemon);
      setIsTransitioning(false);
    }
  };

  // Data fetching for species-level data (Pokedex entry, evolution, forms)
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setIsLoadingData(true);
    setPokedexEntry(null);
    setStats(null);
    setEvolutionChain(null);
    setForms([]);

    const fetchAllData = async () => {
      try {
        const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${currentPokemon.id}/`;
        const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${currentPokemon.id}/`;

        const [speciesResponse, pokemonResponse] = await Promise.all([
          fetch(`${CORS_PROXY}${speciesUrl}`, { signal }),
          fetch(`${CORS_PROXY}${pokemonUrl}`, { signal })
        ]);

        if (signal.aborted) return;
        if (!speciesResponse.ok || !pokemonResponse.ok) throw new Error('Could not fetch Pokémon data.');

        const speciesData = await speciesResponse.json();
        const pokemonData = await pokemonResponse.json();
        
        const englishEntry = speciesData.flavor_text_entries.find((e: any) => e.language.name === 'en');
        const cleanedText = englishEntry ? englishEntry.flavor_text.replace(/[\n\f]/g, ' ').trim() : 'No English Pokédex entry available.';
        
        let parsedChain: EvolutionNode | null = null;
        if (speciesData.evolution_chain?.url) {
          const evolutionResponse = await fetch(`${CORS_PROXY}${speciesData.evolution_chain.url}`, { signal });
          if (evolutionResponse.ok && !signal.aborted) {
            const evolutionData = await evolutionResponse.json();
            const parseNode = (node: any): EvolutionNode | null => {
              const name = node.species.name;
              let foundPokemon = pokemonList.find(p => p.name === name) || pokemonList.find(p => p.name.startsWith(name + '-'));
              if (!foundPokemon) return null;
              return {
                speciesName: name,
                pokemonId: foundPokemon.id,
                evolutions: node.evolves_to.map((evo: any) => {
                  const nextNode = parseNode(evo);
                  if (!nextNode) return null;
                  return { node: nextNode, method: getEvolutionMethod(evo.evolution_details) };
                }).filter((n): n is { node: EvolutionNode; method: string } => n !== null),
              };
            };
            parsedChain = parseNode(evolutionData.chain);
          }
        }
        
        if (signal.aborted) return;

        setPokedexEntry(cleanedText);
        setEvolutionChain(parsedChain);
        setStats(pokemonData.stats.map((s: any) => ({ name: s.stat.name, base_stat: s.base_stat })));
        setTypes(pokemonData.types.map((t: any) => t.type.name));

        const currentVariety = speciesData.varieties.find((v: any) => v.pokemon.name === currentPokemon.name);
        const initialFormUrl = currentVariety ? currentVariety.pokemon.url : pokemonUrl;
        setSelectedFormUrl(initialFormUrl);

        if (speciesData.varieties && speciesData.varieties.length > 1) {
          const fetchedForms = speciesData.varieties.map((v: any) => {
            const formName = v.pokemon.name.replace(/-/g, ' ').replace(speciesData.name, ' ').trim();
            const capitalized = formName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return { name: capitalized || 'Default', url: v.pokemon.url };
          });
          setForms(fetchedForms);
        }

      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error("Error fetching Pokémon data:", error);
          if (!signal.aborted) setPokedexEntry('Could not load profile data.');
        }
      } finally {
        if (!signal.aborted) setIsLoadingData(false);
      }
    };

    fetchAllData();
    return () => controller.abort();
  }, [currentPokemon, pokemonList]);
  
  // Effect to update data when form or shiny is changed
  useEffect(() => {
    if (!selectedFormUrl) return;

    const controller = new AbortController();
    const { signal } = controller;

    const fetchFormData = async () => {
      try {
        const response = await fetch(`${CORS_PROXY}${selectedFormUrl}`, { signal });
        if (!response.ok) throw new Error('Failed to fetch form data');
        const formData = await response.json();

        if (!signal.aborted) {
          setStats(formData.stats.map((s: any) => ({ name: s.stat.name, base_stat: s.base_stat })));
          setTypes(formData.types.map((t: any) => t.type.name));
          
          const artwork = formData.sprites.other['official-artwork'];
          let newSprite = isShiny ? artwork.front_shiny : artwork.front_default;
          if (!newSprite) { // Fallback to pixel sprites if official art is missing for the form
            newSprite = isShiny ? formData.sprites.front_shiny : formData.sprites.front_default;
          }
          setSpriteUrl(newSprite || '');
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error("Error fetching form data:", error);
        }
      }
    };

    const formIdMatch = selectedFormUrl.match(/pokemon\/(\d+)\/$/);
    const formId = formIdMatch ? parseInt(formIdMatch[1], 10) : null;

    if (formId === currentPokemon.id) {
      // It's the default form, use high-res sprites from the repo
      const newSprite = isShiny
        ? `${SHINY_SPRITE_BASE_URL}${currentPokemon.id}.png`
        : `${SPRITE_BASE_URL}${currentPokemon.id}.png`;
      setSpriteUrl(newSprite);
    } else {
      fetchFormData();
    }

    return () => controller.abort();
  }, [selectedFormUrl, isShiny, currentPokemon.id]);


  const handlePlayCry = (pokemonId: number) => {
    const cryUrl = `${CRY_BASE_URL}${pokemonId}.ogg`;
    const audio = new Audio(cryUrl);
    audio.play().catch(error => console.error("Error playing audio:", error));
  };

  const handleToggleShiny = () => setIsShiny(prev => !prev);

  const primaryType = types[0] || currentPokemon?.types[0] || 'normal';

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="profile-modal-name">
      <div className="modal-container profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose} aria-label="Close Pokémon Profile">&times;</button>
        <div
          className={`profile-content ${contentHeight !== 'auto' ? 'is-transitioning' : ''}`}
          style={{ minHeight: contentHeight === 'auto' ? 'auto' : `${contentHeight}px` }}
        >
          <div
            key={currentPokemon.id}
            ref={contentWrapperRef}
            className={`profile-content-inner ${isTransitioning ? 'transitioning-out' : ''}`}
            onAnimationEnd={handleAnimationEnd}
          >
            <img
              key={spriteUrl}
              src={spriteUrl}
              alt={currentPokemon.name}
              className="profile-sprite"
            />
            <div className="profile-header">
              <img
                src={STAR_URL}
                alt={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                className={`favorite-icon-profile ${isFavorite ? 'active' : ''}`}
                onClick={() => onToggleFavorite(currentPokemon.id)}
              />
              <div id="profile-modal-name" className="profile-name">{currentPokemon.name}</div>
              <svg
                viewBox="0 0 24 24"
                aria-label="Toggle Shiny View"
                className={`shiny-icon-profile ${isShiny ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={handleToggleShiny}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleShiny(); }}
              >
                  <title>Toggle Shiny</title>
                  <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
              </svg>
              <svg
                viewBox="0 0 24 24"
                aria-label="Play Pokémon Cry"
                className="cry-icon-profile"
                role="button"
                tabIndex={0}
                onClick={() => handlePlayCry(currentPokemon.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePlayCry(currentPokemon.id); }}
              >
                <title>Play Cry</title>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
              <img
                src={POKEBALL_URL}
                alt={isCaught ? 'Caught' : 'Seen'}
                title={`Status: ${isCaught ? 'Caught' : 'Seen'} (Click to toggle)`}
                className={`status-icon-profile ${!isCaught ? 'seen' : ''}`}
                onClick={() => onToggleStatus(currentPokemon.id)}
              />
            </div>
            <div className="profile-id">
              #{String(currentPokemon.id).padStart(3, '0')}
            </div>
            {forms.length > 0 && (
              <div className="profile-form-selector">
                <label htmlFor="form-select">Form:</label>
                <select
                    id="form-select"
                    value={selectedFormUrl}
                    onChange={(e) => setSelectedFormUrl(e.target.value)}
                    aria-label="Select Pokémon Form"
                >
                    {forms.map(form => (
                        <option key={form.url} value={form.url}>
                            {form.name}
                        </option>
                    ))}
                </select>
              </div>
            )}
            <div className="profile-types">
              {(types.length > 0 ? types : currentPokemon.types).map((type) => (
                <img
                  key={type}
                  src={`${TYPE_ICON_BASE_URL}${type}.svg`}
                  alt={`${type} type`}
                  className={`type-icon type-${type}`}
                  title={type.charAt(0).toUpperCase() + type.slice(1)}
                />
              ))}
            </div>

            {isLoadingData ? (
              <div className="profile-dex-entry">Loading data...</div>
            ) : (
              <>
                <div className="profile-dex-entry">
                  {pokedexEntry}
                </div>

                {stats && (
                  <div className="stats-section">
                    <h3 className="stats-title">Base Stats</h3>
                    <StatsRadar stats={stats} typeColor={`var(--type-${primaryType})`} />
                  </div>
                )}

                {evolutionChain && (evolutionChain.evolutions.length > 0 || currentPokemon.id !== evolutionChain.pokemonId) && (
                   <div className="evolution-section">
                     <h3 className="evolution-title">Evolution Chain</h3>
                     <div className="evolution-chain-container">
                       <EvolutionChainNode
                          node={evolutionChain}
                          currentPokemonId={currentPokemon.id}
                          onPokemonSelect={onPokemonSelect}
                          pokemonList={pokemonList}
                       />
                     </div>
                   </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;