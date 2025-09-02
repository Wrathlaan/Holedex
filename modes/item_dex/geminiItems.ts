/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Type } from "@google/genai";
import { generateContent } from '../../lib/gemini.ts';
// FIX: Correctly import ItemAvailability and ItemRecord
import type { ItemRecord, ItemAvailability } from "./itemSchema.ts";

const systemPrompt = `
You are a Pokémon Item data normalizer. Your sole purpose is to return a single, valid JSON object matching the provided schema. Do not include any markdown, comments, or extraneous text.

- **Data Rules**: Use concise text. If you are unsure about a specific detail, leave the field as null or an empty array.
- **Pricing**: Populate the \`pricingByGame\` field whenever you have confident, game-specific pricing data. Use canonical game titles for keys (e.g., "Scarlet/Violet", "Legends: Arceus", "BDSP").
- **Relations**: Populate \`relatedPokemon\` with species names and \`tags\` with relevant keywords like \`type:*\` or \`role:*\` when confident.
- **Critical**: Your entire response MUST be only the JSON object.
`;

const pricingSchema = {
    type: Type.OBJECT,
    nullable: true,
    properties: {
        buy: { type: Type.INTEGER, nullable: true },
        sell: { type: Type.INTEGER, nullable: true },
        currency: { type: Type.STRING, nullable: true },
    },
};

const itemRecordSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        category: { type: Type.STRING },
        icon: { type: Type.STRING },
        effect: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                battle: { type: Type.STRING, nullable: true },
                field: { type: Type.STRING, nullable: true },
                perGeneration: { type: Type.OBJECT, nullable: true, description: "A record where keys are game titles or 'genX' and values are override notes." },
            },
        },
        availability: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    game: { type: Type.STRING },
                    generation: { type: Type.INTEGER },
                    methods: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
            },
        },
        pricing: pricingSchema,
        pricingByGame: { type: Type.OBJECT, nullable: true, description: "A record where keys are game titles and values are pricing objects." },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
        relatedPokemon: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
        relatedItems: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
    },
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        items: {
            type: Type.ARRAY,
            items: itemRecordSchema,
        },
    },
};

function dedupeAvailability(list: ItemAvailability[]): ItemAvailability[] {
    const key = (a: ItemAvailability) => `${a.game}|${a.generation}|${(a.methods || []).join(',')}`;
    const seen = new Set<string>();
    const out: ItemAvailability[] = [];
    for (const a of list) {
        const k = key(a);
        if (!seen.has(k)) {
            seen.add(k);
            out.push(a);
        }
    }
    return out;
}

function mergeById(seed: ItemRecord[], incoming: ItemRecord[]): ItemRecord[] {
    const map = new Map<string, ItemRecord>();
    // FIX: Coerce ID to string for map key, as it can be number from PokeAPI
    for (const s of seed) map.set(String(s.id), s);
    for (const i of incoming) {
        // FIX: Coerce ID to string for map key
        const curr = map.get(String(i.id));
        if (!curr) {
            // FIX: Coerce ID to string for map key
            map.set(String(i.id), i);
            continue;
        }
        // FIX: Coerce ID to string for map key and handle potentially undefined properties on merge
        map.set(String(i.id), {
            ...curr,
            ...i,
            effect: {
                summary: i.effect?.summary ?? curr.effect?.summary ?? '',
                battle: i.effect?.battle ?? curr.effect?.battle,
                field: i.effect?.field ?? curr.effect?.field,
                perGeneration: { ...(curr.effect?.perGeneration || {}), ...(i.effect?.perGeneration || {}) },
            },
            availability: dedupeAvailability([...(curr.availability || []), ...(i.availability || [])]),
            pricing: i.pricing ?? curr.pricing,
            pricingByGame: { ...(curr.pricingByGame || {}), ...(i.pricingByGame || {}) },
            tags: Array.from(new Set([...(curr.tags || []), ...(i.tags || [])])),
            relatedPokemon: Array.from(new Set([...(curr.relatedPokemon || []), ...(i.relatedPokemon || [])])),
            relatedItems: Array.from(new Set([...(curr.relatedItems || []), ...(i.relatedItems || [])])),
        });
    }
    return Array.from(map.values());
}


export async function enrichItemsWithGemini(seed: ItemRecord[]): Promise<ItemRecord[]> {
    const prompt = `
Seed items (JSON): ${JSON.stringify({ items: seed })}

Expand upon this seed data. Fill in any missing availability, pricing (including the 'pricingByGame' field where known), tags, and related Pokémon.
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

        if (Array.isArray(parsed.items)) {
            return mergeById(seed, parsed.items as ItemRecord[]);
        }
    } catch (e) {
        console.warn("Gemini enrichment failed, returning seed data.", e);
    }
    return seed;
}