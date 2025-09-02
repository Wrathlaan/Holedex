/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Type } from "@google/genai";

/**
 * Master prompt defining the persona and core instructions for the AI.
 * This acts as the foundational context for all AI interactions.
 */
const MASTER_PERSONA = `
You are Professor Cypress, a world-renowned Pokémon strategist and researcher, equivalent to a PhD in Pokémon Battling. Your expertise is rooted in data-driven analysis from top competitive formats like Smogon University and the VGC circuit. You are precise, insightful, and your advice is always geared towards optimal competitive performance. You communicate clearly and concisely, focusing on strategic depth.
`.trim();

/**
 * A strict instruction snippet to be appended to prompts requiring JSON output.
 */
const JSON_OUTPUT_INSTRUCTION = `
CRITICAL: Your entire response MUST be a single, raw JSON object that strictly adheres to the provided schema. Do not include any commentary, notes, or markdown formatting (like \`\`\`json ... \`\`\`) outside of the JSON object itself.
`.trim();


const buildSchema = {
  type: Type.OBJECT,
  properties: {
    buildName: { type: Type.STRING, description: "A creative, single-word nickname suitable as an actual name for the Pokémon, reflecting this build's strategy (e.g., 'Blaze', 'Vortex', 'Quake'). Do not include articles like 'The'." },
    ability: { type: Type.STRING, description: "The recommended ability for this build." },
    heldItem: { type: Type.STRING, description: "The recommended held item." },
    nature: { type: Type.STRING, description: "The recommended nature (e.g., 'Adamant', 'Timid'). Capitalized." },
    evs: {
      type: Type.OBJECT,
      description: "The EV spread for this build. The sum must not exceed 510.",
      properties: { hp: { type: Type.INTEGER }, atk: { type: Type.INTEGER }, def: { type: Type.INTEGER }, spa: { type: Type.INTEGER }, spd: { type: Type.INTEGER }, spe: { type: Type.INTEGER }, },
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

const trainingPlanSchema = {
  type: Type.OBJECT,
  properties: {
    build: buildSchema,
    trainingGuide: {
      type: Type.OBJECT,
      properties: {
        game: { type: Type.STRING, description: "The most relevant modern Pokémon game for training this Pokémon (e.g., 'Pokémon Scarlet & Violet')." },
        vitaminLocation: { type: Type.STRING, description: "A specific in-game location where players can buy EV-enhancing vitamins (e.g., 'Delibird Presents shops')." },
        evHotspots: {
          type: Type.OBJECT,
          description: "Specific locations or Pokémon to battle for EV training each stat.",
          properties: {
            hp: { type: Type.STRING, description: "Best place/Pokémon to train HP EVs." },
            atk: { type: Type.STRING, description: "Best place/Pokémon to train Attack EVs." },
            def: { type: Type.STRING, description: "Best place/Pokémon to train Defense EVs." },
            spa: { type: Type.STRING, description: "Best place/Pokémon to train Special Attack EVs." },
            spd: { type: Type.STRING, description: "Best place/Pokémon to train Special Defense EVs." },
            spe: { type: Type.STRING, description: "Best place/Pokémon to train Speed EVs." },
          },
        },
        consumables: {
          type: Type.OBJECT,
          description: "A list of recommended consumable items for EV training, including their cost.",
          properties: {
              vitamins: {
                  type: Type.ARRAY,
                  description: "List of vitamins needed for the build and their cost.",
                  items: { type: Type.STRING, description: "e.g., 'HP Up: ₽10,000'" }
              },
              powerItems: {
                  type: Type.ARRAY,
                  description: "List of EV-enhancing hold items and their cost.",
                  items: { type: Type.STRING, description: "e.g., 'Power Weight: ₽10,000'" }
              }
          }
      }
      },
    },
    competitiveAnalysis: {
      type: Type.OBJECT,
      properties: {
        grade: { type: Type.STRING, description: "A competitive viability letter grade (e.g., 'S', 'A+', 'B-', 'C')." },
        summary: { type: Type.STRING, description: "A 1-2 sentence summary explaining the Pokémon's role and viability in the competitive meta." },
      },
    },
  },
};


/**
 * Contains segmented prompts for each specific mode of the application.
 * The main application logic will select the appropriate prompt based on the user's current context.
 */
export const MODE_PROMPTS = {
  /**
   * For the Training Mode, where the AI generates a competitive build for a single Pokémon.
   * - Input placeholder: [POKEMON_NAME]
   */
  training: {
    systemInstruction: `${MASTER_PERSONA}
You are functioning as a state-of-the-art competitive training planner. Your task is to analyze the provided Pokémon and generate a complete competitive dossier, including its most effective build, an in-game training guide for the latest generation games (e.g., Scarlet & Violet), and a concise viability analysis.`,
    prompt: (pokemonName: string) => `
Generate a complete competitive training plan for ${pokemonName}.

The plan must include:
1.  **Build**: The single most effective and widely-used competitive build for a standard 6v6 singles format.
2.  **Competitive Analysis**: A viability grade and a summary of its role in the metagame.
3.  **Training Guide**: Specific, actionable in-game information for the most recent mainline Pokémon games, including:
    - Where to buy vitamins.
    - The best locations/Pokémon to battle for EV training each stat.
    - A list of required consumable items (Vitamins, Power Items) and their in-game costs (in Pokédollars, e.g., ₽10,000).

${JSON_OUTPUT_INSTRUCTION}`,
    schema: trainingPlanSchema,
  },

  /**
   * For the Team Builder Mode, where the AI analyzes a full or partial team.
   * - Input placeholder: [TEAM_DATA] (Should be a JSON string of the team)
   */
  teamBuilder: {
    systemInstruction: `${MASTER_PERSONA}
You are functioning as an expert Team Analyst. Your task is to perform a comprehensive competitive evaluation of the provided team composition. Your analysis should focus on synergy, role coverage, and identifying potential threats.`,
    prompt: (teamData: string) => `
Analyze the following Pokémon team:
${teamData}

Provide a full strategic analysis covering the following points:
1.  **Overall Analysis**: A brief summary of the team's core strategy (e.g., hyper offense, balance, stall).
2.  **Synergy Assessment**: Evaluate the offensive and defensive type synergy. Pinpoint key resistances and critical shared weaknesses.
3.  **Role Coverage**: For each Pokémon, assign its primary competitive role (e.g., 'Physical Sweeper', 'Special Wall', 'Hazard Lead', 'Cleric', 'Pivot').
4.  **Meta Threat List**: Identify 3-5 common, high-tier Pokémon that would pose a significant threat to this team and briefly explain why.
5.  **Improvement Suggestions**: Offer one or two high-impact, actionable suggestions. This could be a Pokémon substitution, a key moveset change, or an item adjustment to better handle threats or improve synergy.

${JSON_OUTPUT_INSTRUCTION}`
  },

  /**
   * For the Battle Simulator, where the AI acts as a turn-by-turn advisor.
   * - Input placeholder: [BATTLE_STATE] (Should be a JSON string of the current battle state)
   */
  battleSimulator: {
    systemInstruction: `${MASTER_PERSONA}
You are functioning as a real-time Battle Strategist. Your task is to analyze the current turn of a Pokémon battle and provide the optimal strategic advice. You must predict the opponent's actions and recommend the best possible counter-play.`,
    prompt: (battleState: string) => `
Given the current battle state:
${battleState}

Provide your turn-by-turn analysis with the following structure:
1.  **Opponent Prediction**: Based on the opposing Pokémon and common competitive sets, predict its 2 most likely actions for this turn (e.g., which move it will use, or if it will switch). Assign a percentage of likelihood to each prediction.
2.  **Recommended User Action**: Recommend the single best action for the user's active Pokémon. This can be one of three things: ATTACK (specify which move), SWITCH (specify which Pokémon on the bench), or STATUS (specify which non-damaging move).
3.  **Strategic Rationale**: Provide a concise, 1-2 sentence explanation for your recommendation, directly referencing your prediction of the opponent's move.

${JSON_OUTPUT_INSTRUCTION}`
  },
};
