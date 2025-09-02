/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Type } from "@google/genai";
import { generateContent } from '../../lib/gemini.ts';
import type { MoveRecord } from "./moveSchema.ts";

const systemPrompt = `
You are Professor Cypress, a world-renowned Pokémon strategist. Your task is to provide detailed, accurate data about Pokémon moves. Your response must be a single, valid JSON object that conforms to the provided schema. Do not include any markdown, comments, or extraneous text.

- **Data Rules**: Provide factual data based on the most recent Pokémon games. For "notableUsers", list 2-4 iconic Pokémon known for using the move effectively in battle.
- **Critical**: Your entire response MUST be only the JSON object.
`;

const moveRecordSchema = {
    type: Type.OBJECT,
    properties: {
        // FIX: Added 'id' to the schema for consistency.
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        type: { type: Type.STRING },
        damage_class: { type: Type.STRING },
        power: { type: Type.INTEGER, nullable: true },
        accuracy: { type: Type.INTEGER, nullable: true },
        pp: { type: Type.INTEGER },
        effect: { type: Type.STRING },
        priority: { type: Type.INTEGER },
        target: { type: Type.STRING },
        notableUsers: {
            type: Type.ARRAY,
            nullable: true,
            items: {
                type: Type.OBJECT,
                properties: {
                    pokemonName: { type: Type.STRING },
                    pokemonId: { type: Type.INTEGER },
                },
            },
        },
    },
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        moves: {
            type: Type.ARRAY,
            items: moveRecordSchema,
        },
    },
};

export async function enrichMovesWithGemini(seed: MoveRecord[]): Promise<MoveRecord[]> {
    const prompt = `
Enrich the provided Pokémon move objects. For each move, add the "notableUsers" field, listing 2-4 iconic Pokémon known for using the move effectively in competitive battle. Your response should contain an array with only the moves provided in the seed data, but enriched with this information.

Seed moves (JSON): ${JSON.stringify({ moves: seed })}
    `.trim();

    try {
        const response = await generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const text = response.text;
        const parsed = JSON.parse(text);

        if (Array.isArray(parsed.moves)) {
            // Combine seed and new moves, removing duplicates
            const moveMap = new Map<string, MoveRecord>();
            seed.forEach(move => moveMap.set(move.id, move));
            (parsed.moves as MoveRecord[]).forEach(move => moveMap.set(move.id, move));
            return Array.from(moveMap.values());
        }
    } catch (e) {
        console.warn("Gemini move enrichment failed, returning seed data.", e);
    }
    return seed;
}