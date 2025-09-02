/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse, Content } from "@google/genai";

// Define an interface for the expected structure of Google Auth state in localStorage
interface GoogleAuthState {
  accessToken: string;
  expiresAt: number;
  profile: {
    email: string;
    name: string;
    picture: string;
  };
}

// Define the overall authentication configuration structure
interface AuthConfig {
  authMode: 'apiKey' | 'oauth';
  apiKey: string;
  googleAuthState: GoogleAuthState | null;
  googleClientId: string;
  googleProjectId: string;
}

/**
 * Retrieves and parses the current authentication configuration from localStorage.
 * Provides default values to ensure the application remains stable.
 */
function getAuthConfig(): AuthConfig {
  try {
    const authMode = JSON.parse(localStorage.getItem('gemini-auth-mode') || '"apiKey"');
    const apiKey = JSON.parse(localStorage.getItem('gemini-api-key') || '""');
    const googleAuthState = JSON.parse(localStorage.getItem('gemini-auth-state') || 'null');
    const googleClientId = JSON.parse(localStorage.getItem('gemini-client-id') || '""');
    const googleProjectId = JSON.parse(localStorage.getItem('gemini-project-id') || '""');
    return { authMode, apiKey, googleAuthState, googleClientId, googleProjectId };
  } catch (e) {
    console.error("Failed to parse auth config from localStorage", e);
    // Return a safe default if parsing fails
    return { authMode: 'apiKey', apiKey: '', googleAuthState: null, googleClientId: '', googleProjectId: '' };
  }
}

// Global instances to manage the SDK and avoid re-initialization
let ai: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

/**
 * A centralized function to call the Gemini API.
 * It automatically uses the authentication method configured in the app's settings.
 * @param params - The parameters for the generateContent call, matching the @google/genai SDK.
 * @returns A promise that resolves to a GenerateContentResponse, mimicking the SDK's response.
 */
export async function generateContent(params: GenerateContentParameters): Promise<GenerateContentResponse> {
  const config = getAuthConfig();

  if (config.authMode === 'oauth') {
    // --- OAuth 2.0 Flow using the REST API ---
    if (!config.googleAuthState?.accessToken || !config.googleProjectId) {
      throw new Error("OAuth is not configured. Please sign in and set your Project ID in Settings.");
    }

    const { model, contents, config: genaiConfig } = params;
    // The Gemini API endpoint requires the 'beta' version for this type of access.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    
    // The SDK's `contents` can be a string or an object, but the REST API expects a specific structure.
    // This logic converts the flexible SDK format to the required REST API format.
    let formattedContents: Content[];
    if (typeof contents === 'string') {
        formattedContents = [{ role: 'user', parts: [{ text: contents }] }];
    } else if (Array.isArray(contents)) {
        // This handles cases where contents might be string[] or Part[]
        formattedContents = [{ role: 'user', parts: contents.map(c => typeof c === 'string' ? { text: c } : c) }];
    } else {
        // Assumes `contents` is of type `Content` or similar structure like `{ parts: [...] }`
        formattedContents = [contents as Content];
    }

    const body = {
      contents: formattedContents,
      ...genaiConfig
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.googleAuthState.accessToken}`,
        'x-goog-user-project': config.googleProjectId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error (OAuth):", errorText);
      throw new Error(`Gemini API Error: ${response.status}. See console for details.`);
    }

    const data = await response.json();
    
    // Mimic the SDK's convenient `.text` property for easy access to the response text.
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      ...data,
      text,
    } as GenerateContentResponse;

  } else {
    // --- API Key Flow using the @google/genai SDK ---
    const effectiveApiKey = config.apiKey || process.env.API_KEY;
    if (!effectiveApiKey) {
        throw new Error("Gemini API Key is not set. Please add it in Settings.");
    }

    // Initialize or re-initialize the SDK if the API key has changed.
    if (!ai || currentApiKey !== effectiveApiKey) {
      ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      currentApiKey = effectiveApiKey;
    }
    
    return await ai.models.generateContent(params);
  }
}
