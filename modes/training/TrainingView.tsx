/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useMemo, useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { Type } from "@google/genai";
import { Pokemon, Extracted, CompetitiveBuild, MoveDetails, TrainingPlan } from "../../types.ts";
import { MODE_PROMPTS } from "../../lib/prompts.ts";
import { generateContent } from "../../lib/gemini.ts";
import StatScan from "./StatScan.tsx";
import './training.css';
import { TYPE_ICON_BASE_URL } from "../../constants.ts";

const moveDetailsCache = new Map<string, MoveDetails>();

/* ---------------------------------------------
 * DATA & CONSTANTS
 * ------------------------------------------- */
const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"];
const STAT_LABELS: Record<string, string> = { hp: "HP", atk: "Attack", def: "Defense", spa: "Sp. Atk", spd: "Sp. Def", spe: "Speed" };
const NATURES: Record<string, { increased: string | null; decreased: string | null }> = {
  Adamant: { increased: 'atk', decreased: 'spa' }, Bashful: { increased: null, decreased: null }, Bold: { increased: 'def', decreased: 'atk' }, Brave: { increased: 'atk', decreased: 'spe' }, Calm: { increased: 'spd', decreased: 'atk' }, Careful: { increased: 'spd', decreased: 'spa' }, Docile: { increased: null, decreased: null }, Gentle: { increased: 'spd', decreased: 'def' }, Hardy: { increased: null, decreased: null }, Hasty: { increased: 'spe', decreased: 'def' }, Impish: { increased: 'def', decreased: 'spa' }, Jolly: { increased: 'spe', decreased: 'spa' }, Lax: { increased: 'def', decreased: 'spd' }, Lonely: { increased: 'atk', decreased: 'def' }, Mild: { increased: 'spa', decreased: 'def' }, Modest: { increased: 'spa', decreased: 'atk' }, Naive: { increased: 'spe', decreased: 'spd' }, Naughty: { increased: 'atk', decreased: 'spd' }, Quiet: { increased: 'spa', decreased: 'spe' }, Quirky: { increased: null, decreased: null }, Rash: { increased: 'spa', decreased: 'spd' }, Relaxed: { increased: 'def', decreased: 'spe' }, Sassy: { increased: 'spd', decreased: 'spe' }, Serious: { increased: null, decreased: null }, Timid: { increased: 'spe', decreased: 'atk' },
};

/* ---------------------------------------------
 * HELPERS & FORMULAS
 * ------------------------------------------- */
const natureFactor = (delta: number) => (delta === -1 ? 0.9 : delta === 1 ? 1.1 : 1.0);
const floor = Math.floor;
const calcHP = ({ b, e }: { b: number; e: number; }) => floor(((2 * b + 31 + floor(e / 4)) * 50) / 100) + 50 + 10;
const calcStat = ({ b, e, nD }: { b: number; e: number; nD: number }) => floor((floor(((2 * b + 31 + floor(e / 4)) * 50) / 100) + 5) * natureFactor(nD));
const formatName = (name: string) => name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

/* ---------------------------------------------
 * SUB-COMPONENTS
 * ------------------------------------------- */
const StatWheel = ({ title, finalStats, baseStats, finalColor, baseColor, maxStatValue, showCenterDot }: { title?: string, finalStats: any, baseStats?: any, finalColor: string, baseColor?: string, maxStatValue?: number, showCenterDot?: boolean }) => {
    const size = 300;
    const center = size / 2;
    const radius = size * 0.4;
    const statOrder = ['hp', 'atk', 'def', 'spe', 'spd', 'spa'];
  
    const maxStat = useMemo(() => maxStatValue || Math.max(
      ...(baseStats ? Object.values(baseStats).map(v => v as number) : [0]),
      ...Object.values(finalStats).map(v => v as number),
      150
    ), [finalStats, baseStats, maxStatValue]);
    
    const calculatePoints = (stats: Record<string, number>) => statOrder.map((key, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const value = stats[key] || 0;
      const length = (value / maxStat) * radius;
      return `${center + length * Math.cos(angle)},${center + length * Math.sin(angle)}`;
    }).join(' ');
  
    const finalPoints = calculatePoints(finalStats);
    const basePoints = baseStats ? calculatePoints(baseStats) : '';
  
    const gridLines = [0.25, 0.5, 0.75, 1].map(scale => statOrder.map((_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return `${center + scale * radius * Math.cos(angle)},${center + scale * radius * Math.sin(angle)}`;
    }).join(' '));
  
    return (
      <div className="stat-wheel-container">
        {title && <h4 className="stat-wheel-title">{title}</h4>}
        <svg className="stat-wheel-svg" viewBox={`0 0 ${size} ${size}`}>
          <g>
            {gridLines.map((line, i) => <polygon key={i} className="stat-wheel-grid-line" points={line} />)}
            {statOrder.map((_, i) => {
               const angle = (Math.PI / 3) * i - Math.PI / 2;
               return <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)} className="stat-wheel-grid-spoke" />;
            })}
          </g>
          <polygon className="stat-wheel-polygon-final" points={finalPoints} style={{ fill: finalColor, '--polygon-glow-color': 'rgba(255,255,255,0.5)' } as React.CSSProperties} />
          {baseStats && <polygon className="stat-wheel-polygon-base" points={basePoints} style={{ '--polygon-color': baseColor, '--polygon-stroke-color': baseColor, '--polygon-glow-color': baseColor } as React.CSSProperties} />}
          {showCenterDot && <circle cx={center} cy={center} r={3} className="stat-wheel-center-dot" />}
          {statOrder.map((key, i) => {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const labelRadius = radius * 1.2;
            const x = center + labelRadius * Math.cos(angle);
            const y = center + labelRadius * Math.sin(angle);
            return (
              <React.Fragment key={key}>
                <text x={x} y={y} className="stat-wheel-label">{STAT_LABELS[key]}</text>
                <text x={x} y={y + 14} className="stat-wheel-value">
                  {finalStats[key]}
                  {baseStats && <tspan className="stat-wheel-value-base">({baseStats[key]})</tspan>}
                </text>
              </React.Fragment>
            );
          })}
        </svg>
      </div>
    );
};

const MoveTooltip = ({ details, position }: { details: MoveDetails | null; position: { x: number; y: number } }) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ position: 'fixed', opacity: 0, pointerEvents: 'none' });
  
    useLayoutEffect(() => {
      if (!details || !tooltipRef.current) return;
  
      const rect = tooltipRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
  
      let top = position.y + 20;
      let left = position.x;
  
      if (top + rect.height > vh - 20) top = position.y - rect.height - 20;
      if (left + rect.width > vw - 20) left = vw - rect.width - 20;
      if (left < 20) left = 20;
  
      setStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        opacity: 1,
        pointerEvents: 'none',
        transition: 'opacity 0.2s ease',
      });
    }, [details, position]);
  
    if (!details) return null;
  
    return (
      <div ref={tooltipRef} className="move-tooltip" style={style}>
        <div className="move-tooltip-header">
          <h4>{formatName(details.name)}</h4>
          <div className="move-tooltip-types">
            <img src={`${TYPE_ICON_BASE_URL}${details.type}.svg`} alt={details.type} className="type-icon" />
            <img src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/categories/${details.damage_class}.png`} alt={details.damage_class} className="move-damage-class-icon" />
          </div>
        </div>
        <p className="move-tooltip-effect">{details.effect}</p>
        <div className="move-tooltip-stats">
          <div><span>Power</span><b>{details.power ?? '—'}</b></div>
          <div><span>Acc.</span><b>{details.accuracy ?? '—'}</b></div>
          <div><span>PP</span><b>{details.pp ?? '—'}</b></div>
        </div>
      </div>
    );
};

interface TrainingViewProps {
  pokemonToTrain: Pokemon | null;
  pokemonList: Pokemon[];
  onPokemonSelect: (pokemon: Pokemon) => void;
}

/* ---------------------------------------------
 * MAIN VIEW COMPONENT
 * ------------------------------------------- */
export default function TrainingView({ pokemonToTrain, pokemonList, onPokemonSelect }: TrainingViewProps) {
  // Pokémon State
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);
  const [finalStats, setFinalStats] = useState<Record<string, number> | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isRawResponseModalOpen, setIsRawResponseModalOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ visible: boolean; content: MoveDetails | null; x: number; y: number }>({ visible: false, content: null, x: 0, y: 0 });

  const generateTrainingPlan = useCallback(async (pokemon: Pokemon) => {
    setIsLoading(true);
    setError(null);
    setTrainingPlan(null);
    setFinalStats(null);
    setRawResponse(null);
    try {
      const { systemInstruction, prompt, schema } = MODE_PROMPTS.training;
      const response = await generateContent({
        model: "gemini-2.5-flash",
        contents: prompt(pokemon.name),
        config: { 
          systemInstruction,
          responseMimeType: "application/json", 
          responseSchema: schema, 
          temperature: 0.2 
        },
      });
      
      const jsonText = response.text;
      setRawResponse(jsonText);
      const plan: TrainingPlan = JSON.parse(jsonText);
      setTrainingPlan(plan);

      // Calculate final stats based on the build
      const { build } = plan;
      const natureInfo = NATURES[build.nature];
      if (!natureInfo) throw new Error(`Invalid nature received from AI: ${build.nature}`);
      const calculatedStats = STAT_KEYS.reduce((acc, key) => {
        let nD = 0;
        if (natureInfo.increased === key) nD = 1;
        if (natureInfo.decreased === key) nD = -1;
        const params = { b: pokemon.base_stats[key as keyof typeof pokemon.base_stats], e: build.evs[key as keyof typeof build.evs], nD };
        acc[key] = key === "hp" ? calcHP(params) : calcStat(params);
        return acc;
      }, {} as Record<string, number>);
      setFinalStats(calculatedStats);
      
    } catch(e) {
      console.error(e);
      setError((e as Error).message || "Failed to generate a training plan. Please check your API settings and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pokemonToTrain) {
      generateTrainingPlan(pokemonToTrain);
    } else {
      setTrainingPlan(null);
      setFinalStats(null);
      setError(null);
      setRawResponse(null);
    }
  }, [pokemonToTrain, generateTrainingPlan]);

  // Handlers
  const handleScanComplete = (data: Extracted) => {
    setIsScanModalOpen(false);
    if (data.pokemon) {
        const pokemonName = data.pokemon.toLowerCase().replace(/ /g, '-').replace('.', '');
        const foundPokemon = pokemonList.find(p => p.name === pokemonName);
        if (foundPokemon) {
            onPokemonSelect(foundPokemon);
        } else {
            setError(`Scanned Pokémon "${data.pokemon}" could not be found in the Pokédex database.`);
        }
    } else {
        setError("The scanner was unable to identify a Pokémon from the provided image.");
    }
  };

  const handleMoveHover = useCallback(async (moveName: string, event: React.MouseEvent) => {
    const moveId = moveName.toLowerCase().replace(/ /g, '-');
    let details = moveDetailsCache.get(moveId);
  
    if (!details) {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/move/${moveId}/`);
        if (!res.ok) throw new Error('Move not found');
        const data = await res.json();
        const effectEntry = data.effect_entries.find((e: any) => e.language.name === 'en');
        details = {
          name: data.name,
          type: data.type.name,
          damage_class: data.damage_class.name,
          power: data.power,
          accuracy: data.accuracy,
          pp: data.pp,
          effect: effectEntry?.short_effect.replace('$effect_chance', data.effect_chance + '%') || 'No description.',
        };
        moveDetailsCache.set(moveId, details);
      } catch (e) {
        console.error("Failed to fetch move details", e);
        return;
      }
    }
    setTooltip({ visible: true, content: details, x: event.clientX, y: event.clientY });
  }, []);

  const handleMoveLeave = useCallback(() => {
    setTooltip(t => ({ ...t, visible: false }));
  }, []);
  
  const primaryType = pokemonToTrain?.types[0] || 'normal';
  const typeColor = `var(--type-${primaryType})`;
  const build = trainingPlan?.build;

  return (
    <>
      <div className="app-content" style={{ flexDirection: "column", gap: '1rem' }}>
        <div className="training-view-grid">
          {/* Main Column */}
          <div className="panel training-main-column">
            <div className="training-main-section">
              <div className="training-main-header">
                <h2>Pokémon & Info</h2>
                <div className="training-header-buttons">
                  <button className="training-scan-btn" onClick={() => setIsScanModalOpen(true)}>
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M4,6H2V20A2,2 0 0,0 4,22H18V20H4V6M20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M12,14.5A2.5,2.5 0 0,1 9.5,12A2.5,2.5 0 0,1 12,9.5A2.5,2.5 0 0,1 14.5,12A2.5,2.5 0 0,1 12,14.5M12,6A1,1 0 0,1 11,5A1,1 0 0,1 12,4A1,1 0 0,1 13,5A1,1 0 0,1 12,6Z" /></svg>
                    Stat Scanner
                  </button>
                  {rawResponse && <button className="training-scan-btn" onClick={() => setIsRawResponseModalOpen(true)}>View Raw AI Response</button>}
                </div>
              </div>

              <div className="training-main-scrollable">
                {isLoading && <div className="suspense-loader" />}
                {!isLoading && pokemonToTrain && finalStats && trainingPlan && (
                  <>
                    <div className="training-visuals-container">
                      <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonToTrain.id}.png`} alt={pokemonToTrain.name} className="training-pokemon-sprite"/>
                      <StatWheel
                        title="Final Stats (vs. Base)"
                        finalStats={finalStats}
                        baseStats={pokemonToTrain.base_stats}
                        finalColor="rgba(255, 255, 255, 0.9)"
                        baseColor={typeColor}
                      />
                      <StatWheel
                        title="EV Distribution"
                        finalStats={trainingPlan.build.evs}
                        finalColor="rgba(122, 199, 76, 0.7)"
                        maxStatValue={252}
                        showCenterDot
                      />
                    </div>

                    <div className="competitive-analysis-section">
                        <div className="grade-display" style={{'--grade-color': typeColor} as React.CSSProperties}>{trainingPlan.competitiveAnalysis.grade}</div>
                        <div className="analysis-text">
                            <h4>Competitive Analysis</h4>
                            <p>{trainingPlan.competitiveAnalysis.summary}</p>
                        </div>
                    </div>

                    <div className="training-guide-section">
                      <h4>EV Training Guide ({trainingPlan.trainingGuide.game})</h4>
                      <div className="guide-item">
                        <strong>Vitamins:</strong>
                        <span>{trainingPlan.trainingGuide.vitaminLocation}</span>
                      </div>
                      <div className="ev-hotspots-grid">
                        {Object.entries(trainingPlan.trainingGuide.evHotspots).map(([stat, location]) => (
                            <div key={stat} className="hotspot-item">
                                <strong>{STAT_LABELS[stat]}</strong>
                                <span>{location}</span>
                            </div>
                        ))}
                      </div>
                      <div className="consumables-section">
                        <h4>Consumables</h4>
                        <div className="consumables-grid">
                          <div className="consumable-category">
                            <strong>Vitamins</strong>
                            <ul>
                              {trainingPlan.trainingGuide.consumables.vitamins.map(item => <li key={item}>{item}</li>)}
                            </ul>
                          </div>
                          <div className="consumable-category">
                            <strong>Power Items</strong>
                            <ul>
                              {trainingPlan.trainingGuide.consumables.powerItems.map(item => <li key={item}>{item}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {!isLoading && !pokemonToTrain && (
                  <div className="placeholder-container" style={{minHeight: '320px'}}>Search for a Pokémon in the top bar to begin.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="panel">
              <h2>AI-Generated Build & Plan</h2>
              {isLoading && <div className="suspense-loader" />}
              {error && <div className="placeholder-container">{error}</div>}
              {!isLoading && build && pokemonToTrain ? (
                <div className="build-details-container">
                  <div className="build-details-scrollable">
                    <h3 className="build-name">{build.buildName}</h3>
                    <p className="build-analysis">{build.analysis}</p>
                    <div className="build-info-grid">
                        <div><span>Ability</span><p>{build.ability}</p></div>
                        <div><span>Nature</span><p>{build.nature}</p></div>
                        <div><span>Item</span><p>{build.heldItem}</p></div>
                    </div>
                    <h4>Moveset</h4>
                    <div className="build-moveset-interactive">
                        {build.moves.map(move => (
                          <div key={move} className="build-move-item" onMouseEnter={(e) => handleMoveHover(move, e)} onMouseLeave={handleMoveLeave}>
                            {move}
                          </div>
                        ))}
                    </div>
                    <h4>EV Spread</h4>
                    <div className="build-ev-spread">
                        {Object.entries(build.evs).filter(([, val]) => val > 0).map(([key, val]) => <div key={key}><span>{STAT_LABELS[key]}</span><p>{val}</p></div>)}
                    </div>
                  </div>
                </div>
              ) : !isLoading && !error && (
                <div className="placeholder-container">Search for a Pokémon to generate a build.</div>
              )}
          </div>
        </div>
        {/* Modals */}
        {isScanModalOpen && (
          <div className="modal-overlay" onClick={() => setIsScanModalOpen(false)}>
            <div className="modal-container" style={{maxWidth: '550px'}} onClick={e => e.stopPropagation()}>
              <button className="modal-close-button" onClick={() => setIsScanModalOpen(false)}>&times;</button>
              <div className="settings-content">
                  <h2 className="settings-title">Scan Pokémon from Image</h2>
                  <StatScan onScanComplete={handleScanComplete} />
              </div>
            </div>
          </div>
        )}
        {isRawResponseModalOpen && (
          <div className="modal-overlay" onClick={() => setIsRawResponseModalOpen(false)}>
            <div className="modal-container" style={{maxWidth: '600px'}} onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-button" onClick={() => setIsRawResponseModalOpen(false)}>&times;</button>
              <div className="settings-content">
                <h2 className="settings-title">Raw AI Response (JSON)</h2>
                <pre className="stat-scan-debug-pre">
                  {JSON.stringify(JSON.parse(rawResponse || '{}'), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
      {tooltip.visible && <MoveTooltip details={tooltip.content} position={{ x: tooltip.x, y: tooltip.y }} />}
    </>
  );
}