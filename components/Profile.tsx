/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Pokemon } from '../types';

interface ProfileProps {
  pokemon: Pokemon;
  pokemonContext: Pokemon[];
  pokemonStatuses: Record<number, 'seen' | 'caught'>;
  onToggleStatus: (pokemonId: number) => void;
  favorites: number[];
  onToggleFavorite: (pokemonId: number) => void;
  onPokemonSelect: (pokemon: Pokemon, context: Pokemon[]) => void;
  pokemonList: Pokemon[];
  onClose: () => void;
}

interface Stat {
  name: string;
  base_stat: number;
}

interface EvolutionNode {
  speciesName: string;
  pokemonId: number;
  evolutions: {
    node: EvolutionNode;
    method: string;
  }[];
}

const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];
const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
const SHINY_SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/';
const TYPE_ICON_BASE_URL = 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/';
const POKEBALL_URL = 'https://upload.wikimedia.org/wikipedia/commons/5/53/Pok%C3%A9_Ball_icon.svg';
const STAR_URL = 'https://upload.wikimedia.org/wikipedia/commons/2/29/Gold_Star.svg';
const CRY_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/';

const STAT_NAME_MAP: { [key: string]: string } = {
  'hp': 'HP', 'attack': 'ATK', 'defense': 'DEF',
  'special-attack': 'S.ATK', 'special-defense': 'S.DEF', 'speed': 'SPD',
};
const STAT_ORDER = ['hp', 'attack', 'defense', 'speed', 'special-defense', 'special-attack'];
const MAX_STAT_VALUE = 255;
const typeDataCache = new Map(); // Cache for type effectiveness data

// --- Helper & Sub-components ---

const formatName = (name: string): string => name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const InfoItem: React.FC<{ icon: JSX.Element; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="profile-details-item">
    <div className="profile-details-label">{icon}{label}</div>
    <div className="profile-details-value">{value}</div>
  </div>
);

const GenderRatio: React.FC<{ genderRate: number }> = ({ genderRate }) => {
  if (genderRate === -1) {
    return <span className="gender-text">Genderless</span>;
  }
  const femalePercentage = (genderRate / 8) * 100;
  const malePercentage = 100 - femalePercentage;

  return (
    <div className="gender-ratio-bar" title={`Male: ${malePercentage}%, Female: ${femalePercentage}%`}>
      <div className="gender-male" style={{ width: `${malePercentage}%` }}></div>
      <div className="gender-female" style={{ width: `${femalePercentage}%` }}></div>
    </div>
  );
};

const TypeDefenses: React.FC<{ defenses: Record<string, number> }> = ({ defenses }) => {
  const weaknesses: string[] = [];
  const resistances: string[] = [];
  const immunities: string[] = [];

  POKEMON_TYPES.forEach(type => {
    const multiplier = defenses[type];
    if (multiplier > 1) weaknesses.push(type);
    else if (multiplier < 1 && multiplier > 0) resistances.push(type);
    else if (multiplier === 0) immunities.push(type);
  });

  return (
    <div className="type-defenses">
      <h3 className="stats-title">Type Defenses</h3>
      <p className="type-defenses-description">Effectiveness of attacks against this Pokémon.</p>
      {weaknesses.length > 0 && (
        <div className="type-defenses-category">
          <h4 className="type-defenses-title">Weaknesses</h4>
          <div className="type-defenses-grid">
            {weaknesses.map(type => (
              <img key={type} src={`${TYPE_ICON_BASE_URL}${type}.svg`} alt={type} className={`type-icon type-${type}`} title={formatName(type)} />
            ))}
          </div>
        </div>
      )}
      {resistances.length > 0 && (
         <div className="type-defenses-category">
          <h4 className="type-defenses-title">Resistances</h4>
          <div className="type-defenses-grid">
            {resistances.map(type => (
              <img key={type} src={`${TYPE_ICON_BASE_URL}${type}.svg`} alt={type} className={`type-icon type-${type}`} title={formatName(type)} />
            ))}
          </div>
        </div>
      )}
       {immunities.length > 0 && (
         <div className="type-defenses-category">
          <h4 className="type-defenses-title">Immunities</h4>
          <div className="type-defenses-grid">
            {immunities.map(type => (
              <img key={type} src={`${TYPE_ICON_BASE_URL}${type}.svg`} alt={type} className={`type-icon type-${type}`} title={formatName(type)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatsRadar = ({ stats, typeColor }: { stats: Stat[], typeColor: string }) => {
  const size = 240, center = size / 2, radius = size * 0.35;
  const orderedStats = STAT_ORDER.map(statName => stats.find(s => s.name === statName) || { name: statName, base_stat: 0 });
  const getPoint = (value: number, index: number) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    return {
      x: center + (radius * value / MAX_STAT_VALUE) * Math.cos(angle),
      y: center + (radius * value / MAX_STAT_VALUE) * Math.sin(angle)
    };
  };
  const statPoints = orderedStats.map((stat, i) => getPoint(stat.base_stat, i));
  const statPath = statPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="stats-radar-container">
      <svg className="stats-radar-svg" viewBox={`0 0 ${size} ${size}`}>
        <g>
          {[...Array(4)].map((_, level) => {
            const path = STAT_ORDER.map((_, i) => getPoint(MAX_STAT_VALUE * ((level + 1) / 4), i)).map(p => `${p.x},${p.y}`).join(' ');
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
              <text key={stat.name} x={labelPoint.x} y={labelPoint.y} className="radar-label" textAnchor="middle" dominantBaseline="middle">
                <tspan className="radar-label-name">{STAT_NAME_MAP[stat.name]}</tspan>
                <tspan className="radar-label-value">{` [${stat.base_stat}]`}</tspan>
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

const EvolutionChainNode: React.FC<{
  node: EvolutionNode; currentPokemonId: number;
  onPokemonSelect: (pokemon: Pokemon) => void; pokemonList: Pokemon[];
}> = ({ node, currentPokemonId, onPokemonSelect, pokemonList }) => {
  const pokemonForNode = pokemonList.find(p => p.id === node.pokemonId);
  if (!pokemonForNode) return null;

  const handleSelect = () => {
    if (pokemonForNode.id !== currentPokemonId) onPokemonSelect(pokemonForNode);
  };

  return (
    <div className="evolution-stage-group">
      <div className={`evolution-stage ${currentPokemonId === node.pokemonId ? 'active' : ''}`} onClick={handleSelect} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(); }} aria-label={`Select ${node.speciesName}`}>
        <img src={`${SPRITE_BASE_URL}${node.pokemonId}.png`} alt={node.speciesName} className="evolution-sprite" />
        <span className="evolution-name">{node.speciesName}</span>
      </div>
      {node.evolutions.length > 0 && (
        <div className="evolution-connector-group">
          {node.evolutions.map(({ node: evoNode, method }) => (
            <div className="evolution-path" key={evoNode.pokemonId}>
              <div className="evolution-connector">
                <div className="evolution-method">{method}</div>
                <svg className="evolution-arrow" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>
              </div>
              <EvolutionChainNode node={evoNode} currentPokemonId={currentPokemonId} onPokemonSelect={onPokemonSelect} pokemonList={pokemonList} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getEvolutionMethod = (details: any[]): string => {
  if (!details || details.length === 0) return '';
  const d = details[0], trigger = d.trigger.name, parts: string[] = [];
  switch (trigger) {
    case 'level-up': parts.push(d.min_level ? `Lvl ${d.min_level}` : 'Level Up'); break;
    case 'use-item': parts.push(`Use ${formatName(d.item.name)}`); break;
    case 'trade': parts.push('Trade'); break;
    case 'shed': return 'Special';
    default: parts.push(formatName(trigger));
  }
  if (d.held_item) parts.push(`w/ ${formatName(d.held_item.name)}`);
  if (d.min_happiness) parts.push('w/ Friendship');
  if (d.time_of_day) parts.push(`at ${d.time_of_day}`);
  return parts.join(' ');
};

const Profile = ({ pokemon, pokemonContext, pokemonStatuses, onToggleStatus, favorites, onToggleFavorite, onPokemonSelect, pokemonList, onClose }: ProfileProps) => {
  const [currentPokemon, setCurrentPokemon] = useState(pokemon);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isShiny, setIsShiny] = useState(false);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  // Data states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (pokemon.id !== currentPokemon.id) {
      setIsTransitioning(true);
      setIsShiny(false);
    }
  }, [pokemon, currentPokemon.id]);

  const handleAnimationEnd = () => {
    if (isTransitioning) {
      setCurrentPokemon(pokemon);
      setIsTransitioning(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchAllData = async () => {
      setIsLoadingData(true);
      setError(null);
      setProfileData(null);
      try {
        const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${currentPokemon.id}/`;
        const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${currentPokemon.id}/`;

        const [speciesRes, pokemonRes] = await Promise.all([
          fetch(speciesUrl, { signal }),
          fetch(pokemonUrl, { signal })
        ]);

        if (signal.aborted) return;
        if (!speciesRes.ok || !pokemonRes.ok) throw new Error('Could not fetch Pokémon data.');

        const speciesData = await speciesRes.json();
        const pokemonData = await pokemonRes.json();

        const englishEntry = speciesData.flavor_text_entries.find((e: any) => e.language.name === 'en');
        const cleanedText = englishEntry ? englishEntry.flavor_text.replace(/[\n\f]/g, ' ').trim() : 'No English Pokédex entry available.';
        
        const types = pokemonData.types.map((t: any) => t.type.name);
        const typeDefenses: Record<string, number> = {};
        POKEMON_TYPES.forEach(t => typeDefenses[t] = 1);

        const typePromises = types.map(async (type: string) => {
          if (typeDataCache.has(type)) return typeDataCache.get(type);
          const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`, { signal });
          if (!res.ok) throw new Error(`Failed to fetch type data for ${type}`);
          const data = await res.json();
          typeDataCache.set(type, data);
          return data;
        });

        const typeResults = await Promise.all(typePromises);

        for (const typeResult of typeResults) {
          typeResult.damage_relations.double_damage_from.forEach((t: any) => typeDefenses[t.name] *= 2);
          typeResult.damage_relations.half_damage_from.forEach((t: any) => typeDefenses[t.name] *= 0.5);
          typeResult.damage_relations.no_damage_from.forEach((t: any) => typeDefenses[t.name] = 0);
        }
        
        let parsedChain: EvolutionNode | null = null;
        if (speciesData.evolution_chain?.url) {
          const evoRes = await fetch(speciesData.evolution_chain.url, { signal });
          if (evoRes.ok && !signal.aborted) {
            const evoData = await evoRes.json();
            const parseNode = (node: any): EvolutionNode | null => {
              const name = node.species.name;
              let foundPokemon = pokemonList.find(p => p.name === name || p.name.startsWith(name + '-'));
              if (!foundPokemon) return null;
              return {
                speciesName: name, pokemonId: foundPokemon.id,
                evolutions: node.evolves_to.map((evo: any) => {
                  const nextNode = parseNode(evo);
                  return nextNode ? { node: nextNode, method: getEvolutionMethod(evo.evolution_details) } : null;
                }).filter((n): n is { node: EvolutionNode; method: string } => n !== null),
              };
            };
            parsedChain = parseNode(evoData.chain);
          }
        }
        
        if (signal.aborted) return;

        setProfileData({
          pokedexEntry: cleanedText,
          stats: pokemonData.stats.map((s: any) => ({ name: s.stat.name, base_stat: s.base_stat })),
          evolutionChain: parsedChain,
          types: types,
          spriteUrl: pokemonData.sprites.other['official-artwork'].front_default,
          shinySpriteUrl: pokemonData.sprites.other['official-artwork'].front_shiny,
          height: pokemonData.height / 10, // decimeters to meters
          weight: pokemonData.weight / 10, // hectograms to kilograms
          abilities: pokemonData.abilities.map((a: any) => ({ name: formatName(a.ability.name), isHidden: a.is_hidden })),
          genderRate: speciesData.gender_rate,
          eggGroups: speciesData.egg_groups.map((g: any) => formatName(g.name)),
          catchRate: speciesData.capture_rate,
          baseFriendship: speciesData.base_happiness,
          baseExp: pokemonData.base_experience,
          growthRate: formatName(speciesData.growth_rate.name),
          typeDefenses,
        });

      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          console.error("Error fetching Pokémon data:", err);
          if (!signal.aborted) setError('Could not load profile data.');
        }
      } finally {
        if (!signal.aborted) setIsLoadingData(false);
      }
    };

    fetchAllData();
    return () => controller.abort();
  }, [currentPokemon, pokemonList]);

  const handlePlayCry = (pokemonId: number) => {
    const audio = new Audio(`${CRY_BASE_URL}${pokemonId}.ogg`);
    audio.play().catch(e => console.error("Error playing audio:", e));
  };
  
  const { currentIndex, prevPokemon, nextPokemon } = useMemo(() => {
    if (!pokemonContext || pokemonContext.length === 0) return { currentIndex: -1, prevPokemon: null, nextPokemon: null };
    const idx = pokemonContext.findIndex(p => p.id === currentPokemon.id);
    return {
      currentIndex: idx,
      prevPokemon: idx > 0 ? pokemonContext[idx - 1] : null,
      nextPokemon: idx > -1 && idx < pokemonContext.length - 1 ? pokemonContext[idx + 1] : null,
    };
  }, [currentPokemon, pokemonContext]);

  const handleNav = (targetPokemon: Pokemon | null) => {
    if (targetPokemon) {
      onPokemonSelect(targetPokemon, pokemonContext);
    }
  };

  const status = pokemonStatuses[currentPokemon.id] || 'seen';
  const isCaught = status === 'caught';
  const isFavorite = favorites.includes(currentPokemon.id);
  const displaySprite = isShiny ? (profileData?.shinySpriteUrl || `${SHINY_SPRITE_BASE_URL}${currentPokemon.id}.png`) : (profileData?.spriteUrl || `${SPRITE_BASE_URL}${currentPokemon.id}.png`);
  const primaryType = profileData?.types[0] || currentPokemon.types[0] || 'normal';

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="profile-modal-name">
      <div className="modal-container profile-modal" onClick={(e) => e.stopPropagation()}>
        {prevPokemon && <button className="modal-nav-arrow prev" onClick={() => handleNav(prevPokemon)} aria-label={`Previous Pokémon: ${prevPokemon.name}`}>‹</button>}
        {nextPokemon && <button className="modal-nav-arrow next" onClick={() => handleNav(nextPokemon)} aria-label={`Next Pokémon: ${nextPokemon.name}`}>›</button>}
        <button className="modal-close-button" onClick={onClose} aria-label="Close Pokémon Profile">&times;</button>
        <div className="profile-content">
          <div key={currentPokemon.id} ref={contentWrapperRef} className={`profile-content-inner ${isTransitioning ? 'transitioning-out' : ''}`} onAnimationEnd={handleAnimationEnd}>
            <div className="profile-main-grid">
              <div className="profile-sprite-container">
                <img key={displaySprite} src={displaySprite} alt={currentPokemon.name} className="profile-sprite" />
                <div className="profile-header">
                  <img src={STAR_URL} alt="Favorite" title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} className={`favorite-icon-profile ${isFavorite ? 'active' : ''}`} onClick={() => onToggleFavorite(currentPokemon.id)} />
                  <div id="profile-modal-name" className="profile-name">{currentPokemon.name}</div>
                  <svg viewBox="0 0 24 24" aria-label="Toggle Shiny View" className={`shiny-icon-profile ${isShiny ? 'active' : ''}`} role="button" tabIndex={0} onClick={() => setIsShiny(p => !p)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsShiny(p => !p); }}><title>Toggle Shiny</title><path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" /></svg>
                  <svg viewBox="0 0 24 24" aria-label="Play Pokémon Cry" className="cry-icon-profile" role="button" tabIndex={0} onClick={() => handlePlayCry(currentPokemon.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePlayCry(currentPokemon.id); }}><title>Play Cry</title><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                  <img src={POKEBALL_URL} alt="Status" title={`Status: ${isCaught ? 'Caught' : 'Seen'}`} className={`status-icon-profile ${!isCaught ? 'seen' : ''}`} onClick={() => onToggleStatus(currentPokemon.id)} />
                </div>
                <div className="profile-id">#{String(currentPokemon.id).padStart(3, '0')}</div>
                <div className="profile-types">
                  {(profileData?.types || currentPokemon.types).map((type: string) => <img key={type} src={`${TYPE_ICON_BASE_URL}${type}.svg`} alt={`${type} type`} className={`type-icon type-${type}`} title={formatName(type)} />)}
                </div>
              </div>
              <div className="profile-info-container">
                <div className="profile-dex-entry">
                  {isLoadingData ? 'Loading entry...' : error || profileData.pokedexEntry}
                </div>
                {profileData && (
                  <div className="profile-details-grid">
                    <InfoItem icon={<svg viewBox="0 0 24 24"><path d="M9 20h6v-2H9v2M5 18h14v-2H5v2m0-4h14v-2H5v2m4-4h6V8H9v2m0-4h6V4H9v2m0-4h6V0H9v2z"/></svg>} label="Height" value={`${profileData.height} m`} />
                    <InfoItem icon={<svg viewBox="0 0 24 24"><path d="M12 2C9.2 2 7 4.2 7 7c0 1.5.6 2.8 1.5 3.7L12 14l3.5-3.3C16.4 9.8 17 8.5 17 7c0-2.8-2.2-5-5-5m0 16c-3.3 0-6-2.7-6-6h12c0 3.3-2.7 6-6 6z"/></svg>} label="Weight" value={`${profileData.weight} kg`} />
                    <InfoItem icon={<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>} label="Gender" value={<GenderRatio genderRate={profileData.genderRate} />} />
                    <InfoItem icon={<svg viewBox="0 0 24 24"><path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v4h-1.5c-.83 0-1.5.67-1.5 1.5v4c0 .83.67 1.5 1.5 1.5H14v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V18h1.5c.83 0 1.5-.67 1.5-1.5v-4c0-.83-.67-1.5-1.5-1.5zM15 7h2v4h-2V7z"/></svg>} label="Egg Groups" value={profileData.eggGroups.join(', ')} />
                    <div className="profile-abilities">
                      <div className="profile-details-label"><svg viewBox="0 0 24 24"><path d="M21.1 12.5l-3.2 4.3-1.3-1.6 3.2-4.2zm-5.1 2.2l-1.3-1.6-4.5 6-1.5-1.9L12 11l-2-2.6-6 7.6-1.6-1.2 7.2-9 2.1 2.7L16 6l5 6.7-1.6 1.2z"/></svg>Abilities</div>
                      <div className="profile-details-value">{profileData.abilities.map((a: any) => `${a.name}${a.isHidden ? ' (H)' : ''}`).join(', ')}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {isLoadingData ? (
              <div className="profile-placeholder">Loading details...</div>
            ) : error ? (
              <div className="profile-placeholder">{error}</div>
            ) : (
              <>
                {profileData.evolutionChain && (profileData.evolutionChain.evolutions.length > 0 || currentPokemon.id !== profileData.evolutionChain.pokemonId) && (
                   <div className="evolution-section">
                     <h3 className="evolution-title">Evolution Chain</h3>
                     <div className="evolution-chain-container">
                       <EvolutionChainNode node={profileData.evolutionChain} currentPokemonId={currentPokemon.id} onPokemonSelect={(p) => handleNav(p)} pokemonList={pokemonList} />
                     </div>
                   </div>
                )}
                <div className="profile-content-section">
                  <div className="profile-secondary-grid">
                    <div>
                      <h3 className="stats-title">Base Stats</h3>
                      <StatsRadar stats={profileData.stats} typeColor={`var(--type-${primaryType})`} />
                    </div>
                    <TypeDefenses defenses={profileData.typeDefenses} />
                  </div>
                </div>
                <div className="profile-content-section">
                  <div className="training-details">
                    <h3 className="stats-title">Training</h3>
                    <InfoItem icon={<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-12h2v4h-2zm0 6h2v2h-2z"/></svg>} label="Base EXP" value={profileData.baseExp} />
                    <InfoItem icon={<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51c.66-1.23 1.03-2.65 1.03-4.15 0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>} label="Catch Rate" value={profileData.catchRate} />
                    <InfoItem icon={<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>} label="Base Friendship" value={profileData.baseFriendship} />
                    <InfoItem icon={<svg viewBox="0 -2 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/></svg>} label="Growth Rate" value={profileData.growthRate} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;