import React, { useState, useEffect, useCallback, useRef } from "react";
import { Type } from "@google/genai";
import { Extracted, JudgeAppraisal, StatBlock } from "../../types";
import { generateContent } from "../../lib/gemini.ts";

const PROMPT_TEXT = `
CRITICAL GOAL: Analyze Pokémon summary screen image(s) and output a single, valid JSON object that conforms to the provided schema. No other text, formatting, or explanations are allowed.

**CRITICAL RULES:**
- **JSON ONLY:** Your entire response must be a single, raw JSON object. Do not wrap it in markdown \`\`\`json ... \`\`\`.
- **Accuracy is Paramount:** Be extremely precise with numbers (stats, level, PP). Double-check your work.
- **Use \`null\` for Unknowns:** If any piece of information is missing, obscured, or cannot be determined from the image(s), you MUST use \`null\` for that field. Do not invent data.

**HIGH-PRIORITY EXTRACTION CHECKLIST (MANDATORY FIELDS):**

1.  **\`level\` (REQUIRED):** This field is mandatory. Find the Pokémon's level. If you cannot find it, the task is a failure.
2.  **\`ivs_inferred\` (Judge System - CRITICAL):** This section is extremely important. You must analyze the Judge/IV appraisal screen (often a hexagon graph or list).
    *   For EACH of the six stats (hp, attack, defense, sp_atk, sp_def, speed), find the appraisal phrase ("Best", "Decent", etc.) and populate the \`phrase\` field.
    *   Based on the phrase, you MUST also provide the corresponding numeric IV value or range:
        *   "Best": \`"iv_value": 31\`
        *   "Fantastic": \`"iv_value": 30\`
        *   "Very Good": \`"iv_range": [26, 29]\`
        *   "Pretty Good": \`"iv_range": [16, 25]\`
        *   "Decent": \`"iv_range": [1, 15]\`
        *   "No Good": \`"iv_value": 0\`
    *   You must also capture the overall summary phrase (e.g., "Amazing stats!") in \`ivs_inferred.overall\`.

3.  **\`pokemon\` and \`nature\` (REQUIRED):** Extract the Pokémon's name and its Nature.
4.  **\`stats\` (REQUIRED):** Extract all six stat values. Include \`hp_current\` if it's visible.
5.  **\`evs\` (Effort Values - IMPORTANT):** If an EV graph is present (often a yellow or blue overlay on the stat hexagon), you MUST extract the numerical value for each of the six stats into the \`evs\` object. If no EVs are visible, use \`null\` for the \`evs\` field.
6.  **\`characteristic\` and \`pokeball\` (IMPORTANT):** These are often missed.
    *   Find the **characteristic** text (e.g., "Loves to eat", "Proud of its power"). This is usually a short sentence on one of the summary pages.
    *   Identify the type of **Pokéball** the Pokémon was caught in. The ball icon is usually displayed near the Pokémon's name or OT information.

**STANDARD EXTRACTION CHECKLIST (Fill if visible):**
- **Core Info:** \`pokedex_number\`, \`form\` (e.g., "Alolan"), \`gender\` ('Male', 'Female', or 'Genderless'), \`isShiny\` (true/false).
- **Combat Details:** \`types\` (as an array of strings), \`ability\` (name), \`ability_description\`, \`heldItem\`.
- **Moves:** Extract all four moves into the \`moves\` array, including \`name\`, \`pp_current\`, \`pp_max\`, \`type\`, and \`category\` (Physical/Special/Status).


**FINAL TASKS:**
- **\`summary_analysis\`:** Write a short, expert analysis of the Pokémon's build potential based on the extracted data.
- **\`confidence\` (REQUIRED):** Provide a 0-1 confidence score for the overall accuracy of the extraction.

**NUMERICAL PRECISION (CRITICAL):**
- Pay extreme attention to numbers.
- '5' is not 'S'. '8' is not 'B'. '0' is not 'O'.
- Stats, IVs, Level, and PP values MUST be numbers. If you read a letter, re-evaluate the image segment. If it's truly illegible, use \`null\`.

Remember: Your final output must be only the JSON object.
`.trim();

const statBlockSchema = {
  type: Type.OBJECT, nullable: true,
  properties: {
    hp: { type: Type.INTEGER, nullable: true },
    attack: { type: Type.INTEGER, nullable: true },
    defense: { type: Type.INTEGER, nullable: true },
    sp_atk: { type: Type.INTEGER, nullable: true },
    sp_def: { type: Type.INTEGER, nullable: true },
    speed: { type: Type.INTEGER, nullable: true },
  },
};

const judgeAppraisalSchema = {
    type: Type.OBJECT, nullable: true,
    properties: {
        phrase: { type: Type.STRING, nullable: true },
        iv_value: { type: Type.INTEGER, nullable: true },
        iv_range: { type: Type.ARRAY, items: { type: Type.INTEGER }, nullable: true },
    }
};

const schema = {
  type: Type.OBJECT,
  properties: {
    game: { type: Type.STRING, nullable: true },
    pokemon: { type: Type.STRING, nullable: true },
    pokedex_number: { type: Type.INTEGER, nullable: true },
    form: { type: Type.STRING, nullable: true },
    level: { type: Type.INTEGER, nullable: true },
    gender: { type: Type.STRING, nullable: true }, // Male, Female, Genderless
    nature: { type: Type.STRING, nullable: true },
    ability: { type: Type.STRING, nullable: true },
    ability_description: { type: Type.STRING, nullable: true },
    heldItem: { type: Type.STRING, nullable: true },
    characteristic: { type: Type.STRING, nullable: true },
    language: { type: Type.STRING, nullable: true },
    isShiny: { type: Type.BOOLEAN, nullable: true },
    types: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
    pokeball: { type: Type.STRING, nullable: true },
    moves: {
      type: Type.ARRAY, nullable: true,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, nullable: true },
          pp_current: { type: Type.INTEGER, nullable: true },
          pp_max: { type: Type.INTEGER, nullable: true },
          type: { type: Type.STRING, nullable: true },
          category: { type: Type.STRING, nullable: true },
        }
      }
    },
    stats: {
      type: Type.OBJECT, nullable: true,
      properties: {
        ...statBlockSchema.properties,
        hp_current: { type: Type.INTEGER, nullable: true },
      },
    },
    ivs_inferred: {
        type: Type.OBJECT, nullable: true,
        properties: {
            hp: judgeAppraisalSchema,
            attack: judgeAppraisalSchema,
            defense: judgeAppraisalSchema,
            sp_atk: judgeAppraisalSchema,
            sp_def: judgeAppraisalSchema,
            speed: judgeAppraisalSchema,
            overall: { type: Type.STRING, nullable: true },
        }
    },
    evs: statBlockSchema,
    summary_analysis: { type: Type.STRING, nullable: true },
    notes: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
    confidence: { type: Type.NUMBER, nullable: true }
  },
  required: ["pokemon", "level", "nature", "stats", "confidence"],
} as const;

// Helper to convert File to a GoogleGenerativeAI.Part object.
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

interface StatScanProps {
  onScanComplete: (data: Extracted) => void;
}

const renderIV = (appraisal: JudgeAppraisal | null | undefined, statName: string) => {
    if (!appraisal) return 'N/A';
    const value = appraisal.iv_value !== undefined && appraisal.iv_value !== null
        ? appraisal.iv_value
        : appraisal.iv_range ? `${appraisal.iv_range[0]}-${appraisal.iv_range[1]}` : '??';
    return (
        <div className="iv-appraisal-item">
            {statName}: <b>{appraisal.phrase}</b> ({value})
        </div>
    );
};

export default function StatScan({ onScanComplete }: StatScanProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [data, setData] = useState<Extracted|null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [rawJsonResponse, setRawJsonResponse] = useState<string|null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
        fileUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [fileUrls]);

  const processFiles = useCallback(async (selectedFiles: File[]) => {
    setData(null);
    setError(null);
    setRawJsonResponse(null);
    setBusy(true);

    fileUrls.forEach(url => URL.revokeObjectURL(url));
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setFileUrls(urls);
    setFiles(selectedFiles);
    
    try {
      const imageParts = await Promise.all(selectedFiles.map(fileToGenerativePart));
      const response = await generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [...imageParts, { text: PROMPT_TEXT }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.1,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      
      let jsonText = response.text;
      setRawJsonResponse(jsonText);

      const match = /```json\s*([\s\S]*?)\s*```/.exec(jsonText);
      if (match) {
        jsonText = match[1];
      }

      const json = JSON.parse(jsonText.trim()) as Extracted;
      setData(json);
      onScanComplete(json);
    } catch (err: any) {
      let errorMessage = "Failed to parse AI response. ";
      if (err instanceof SyntaxError) {
          errorMessage += "The response was not valid JSON. This can happen if the AI is overloaded or if the image is very unclear. You can view the raw response for more details.";
      } else {
          errorMessage += err?.message ?? "An unknown error occurred.";
      }
      setError(errorMessage);
    } finally {
      setBusy(false);
    }
  }, [onScanComplete, fileUrls]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (!newFiles || newFiles.length === 0) return;
    processFiles(Array.from(newFiles).slice(0, 5));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const newFiles = e.dataTransfer.files;
    if (newFiles && newFiles.length > 0) {
      processFiles(Array.from(newFiles).filter(f => f.type.startsWith('image/')).slice(0, 5));
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  };
  
  const handleUploadClick = () => {
      if (busy) return;
      fileInputRef.current?.click();
  }

  return (
    <div className="stat-scan-container">
      <div 
        className={`stat-scan-drop-zone ${isDragging ? 'drag-over' : ''} ${busy ? 'busy' : ''}`}
        onClick={handleUploadClick}
        onDrop={handleDrop}
        onDragOver={handleDragEnter}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          disabled={busy} 
          multiple 
        />
        
        {files.length === 0 && !busy && (
          <div className="stat-scan-prompt">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" /></svg>
            <span>Click to select or drag & drop screenshots</span>
            <small>(Up to 5 images)</small>
          </div>
        )}

        {fileUrls.length > 0 && (
          <div className="multi-preview-container">
            {fileUrls.map((url, i) => (
                <div key={i} className="stat-scan-thumbnail-wrapper">
                    <img src={url} alt={`preview ${i + 1}`} className="stat-scan-preview" />
                </div>
            ))}
          </div>
        )}
        
        {busy && (
            <div className="stat-scan-loading-overlay">
                <div className="suspense-loader"></div>
                <span>Analyzing...</span>
            </div>
        )}
      </div>

      {error && <div className="stat-scan-error">{error}</div>}

      {data && (
        <div className="stat-scan-results">
          <div className="stat-scan-result-card">
            <div className="stat-scan-card-title">{data.pokemon ?? "Unknown"} {data.isShiny ? "★" : ""}</div>
            <div className="stat-scan-card-details">
                Lvl {data.level ?? "?"} {data.gender ? `(${data.gender.slice(0,1)})` : ''} · {data.nature ?? "?"} Nature
            </div>
            <div className="stat-scan-card-details">
                Ability: {data.ability ?? "?"} · Held: {data.heldItem ?? "—"}
            </div>
             <div className="stat-scan-card-subtle">
                #{String(data.pokedex_number || '?').padStart(4, '0')} · Ball: {data.pokeball ?? "—"} · Confidence: {((data.confidence ?? 0) * 100).toFixed(0)}%
            </div>
          </div>

          {data.summary_analysis && (
             <div className="stat-scan-result-card">
                <div className="stat-scan-card-title">AI Summary</div>
                <p className="stat-scan-card-details" style={{fontStyle: 'italic'}}>{data.summary_analysis}</p>
             </div>
          )}

          {data.ivs_inferred && (
            <div className="stat-scan-result-card">
              <div className="stat-scan-card-title">IV Appraisal (Judge)</div>
              <div className="stat-scan-card-details" style={{marginBottom: '0.5rem'}}>
                Overall: <b>{data.ivs_inferred.overall || 'N/A'}</b>
              </div>
              <div className="iv-appraisal-grid">
                  {renderIV(data.ivs_inferred.hp, 'HP')}
                  {renderIV(data.ivs_inferred.attack, 'Atk')}
                  {renderIV(data.ivs_inferred.defense, 'Def')}
                  {renderIV(data.ivs_inferred.sp_atk, 'SpA')}
                  {renderIV(data.ivs_inferred.sp_def, 'SpD')}
                  {renderIV(data.ivs_inferred.speed, 'Spe')}
              </div>
            </div>
          )}

          {data.moves && data.moves.length > 0 && (
            <div className="stat-scan-result-card">
              <div className="stat-scan-card-title">Moves</div>
              <ul className="stat-scan-card-list" style={{ columns: 2 }}>
                {data.moves.map((move, i) => <li key={i}>{move?.name} ({move?.pp_current}/{move?.pp_max})</li>)}
              </ul>
            </div>
          )}

          {data.stats && (
            <div className="stat-scan-result-card">
              <div className="stat-scan-card-title">Stats</div>
              <div className="stat-scan-card-details">HP: <b>{data.stats.hp_current}/{data.stats.hp}</b> | Atk: <b>{data.stats.attack}</b> | Def: <b>{data.stats.defense}</b></div>
              <div className="stat-scan-card-details">SpA: <b>{data.stats.sp_atk}</b> | SpD: <b>{data.stats.sp_def}</b> | Spe: <b>{data.stats.speed}</b></div>
            </div>
          )}
          
          {data.evs && (
            <div className="stat-scan-result-card">
              <div className="stat-scan-card-title">EVs</div>
               <div className="stat-scan-card-details">HP: <b>{data.evs.hp ?? "0"}</b> | Atk: <b>{data.evs.attack ?? "0"}</b> | Def: <b>{data.evs.defense ?? "0"}</b></div>
              <div className="stat-scan-card-details">SpA: <b>{data.evs.sp_atk ?? "0"}</b> | SpD: <b>{data.evs.sp_def ?? "0"}</b> | Spe: <b>{data.evs.speed ?? "0"}</b></div>
            </div>
          )}
        </div>
      )}
      
      {rawJsonResponse && (
        <button className="view-raw-response-btn" onClick={() => setIsResponseModalOpen(true)}>
          View Raw AI Response
        </button>
      )}

      {isResponseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsResponseModalOpen(false)}>
          <div className="modal-container response-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={() => setIsResponseModalOpen(false)}>&times;</button>
            <div className="settings-content">
              <h2 className="settings-title">Raw API Response</h2>
              <pre className="stat-scan-debug-pre">
                {(() => {
                  try {
                    // Make sure rawJsonResponse is not null before parsing
                    return JSON.stringify(JSON.parse(rawJsonResponse || '{}'), null, 2);
                  } catch {
                    return rawJsonResponse;
                  }
                })()}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}