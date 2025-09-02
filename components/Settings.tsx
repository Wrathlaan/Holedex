/**
 * Holodex — Settings (ZIP-integrated, hardened)
 * Single-file React component using ONLY React + project CSS classes from index.css.
 * - Visual: uses .modal-* and .settings-* classes already in your ZIP
 * - Hardened: Error boundaries per section, guarded localStorage, try/catch on actions
 * - Backward compatible props with your existing Settings modal shape
 * - Optional Appearance prefs (theme + text size) applied via CSS variables (no deps)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.ts';

// --------------------------- Types ---------------------------
export interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GoogleAuthState {
  accessToken: string;
  expiresAt: number;
  profile: {
    email: string;
    name: string;
    picture: string;
  };
}

// --------------------------- Local settings model ---------------------------
// Minimal settings to keep UI useful without adding libraries.
// Extend as needed and the schema validator will ignore unknown keys.

type ThemeMode = 'light' | 'dark' | 'legendsZA';
type TextSize = 'S' | 'M' | 'L';

type LocalSettings = {
  theme: ThemeMode;
  textSize: TextSize;
  kidMode: boolean;
};

const DEFAULTS: LocalSettings = {
  theme: 'legendsZA',
  textSize: 'M',
  kidMode: false,
};

const STORAGE_KEY = 'HOLODEX_SETTINGS_V1';

// Runtime guard (tiny – avoids adding zod)
function isLocalSettings(x: any): x is LocalSettings {
  return (
    x &&
    (x.theme === 'light' || x.theme === 'dark' || x.theme === 'legendsZA') &&
    (x.textSize === 'S' || x.textSize === 'M' || x.textSize === 'L') &&
    typeof x.kidMode === 'boolean'
  );
}

function safeLoad(): LocalSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return isLocalSettings(parsed) ? parsed : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function safeSave(settings: LocalSettings): string | null {
  try {
    const json = JSON.stringify(settings);
    const tmpKey = STORAGE_KEY + '.tmp';
    localStorage.setItem(tmpKey, json);
    localStorage.setItem(STORAGE_KEY, json);
    localStorage.removeItem(tmpKey);
    return null;
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      return 'Storage quota exceeded – reduce cache or clear data.';
    }
    return e?.message || 'Failed to save settings';
  }
}

// Apply settings visually using existing CSS variables – no new lib
function applyToDocument(settings: LocalSettings) {
  const root = document.documentElement;
  // Theme accent presets (Legends ZA gets a warm aurora tint)
  const THEME_PRESETS: Record<ThemeMode, { accent: string; glow: string; modalGlow: string }> = {
    light:     { accent: '#3A7BFF', glow: 'rgba(58,123,255,0.18)', modalGlow: 'rgba(58,123,255,0.22)' },
    dark:      { accent: '#58a6ff', glow: 'rgba(88,166,255,0.225)', modalGlow: 'rgba(88,166,255,0.30)' },
    legendsZA: { accent: '#E7DCA7', glow: 'rgba(231,220,167,0.25)', modalGlow: 'rgba(231,220,167,0.33)' },
  };
  const p = THEME_PRESETS[settings.theme];
  root.style.setProperty('--accent-color', p.accent);
  root.style.setProperty('--glow-color', p.glow);
  root.style.setProperty('--modal-glow-color', p.modalGlow);

  // Text scale – gentle increments
  const scale = settings.textSize === 'S' ? 0.95 : settings.textSize === 'L' ? 1.08 : 1.0;
  root.style.setProperty('--ui-scale', String(scale));

  // Kid/sensory mode: reduce motion & saturation if desired (CSS should observe these if present)
  root.style.setProperty('--reduced-motion', settings.kidMode ? '1' : '0');
  root.style.setProperty('--reduced-saturation', settings.kidMode ? '30%' : '0%');
}

// --------------------------- Error Boundary ---------------------------
class SectionBoundary extends React.Component<React.PropsWithChildren<{ title: string }>, { hasError: boolean; message?: string }> {
  constructor(props: React.PropsWithChildren<{ title: string }>) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(e: any) { return { hasError: true, message: String(e?.message || e) }; }
  componentDidCatch(e: any, info: any) { console.error(`[Settings:${this.props.title}]`, e, info); }
  reset = () => this.setState({ hasError: false, message: undefined });
  render() {
    if (this.state.hasError) {
      return (
        <div className="settings-section" role="region" aria-label={`${this.props.title} (recovered)`}>
          <div className="settings-section-title">{this.props.title} — recovered</div>
          <p className="settings-description">This section hit an error and was isolated to avoid an app crash.</p>
          <button className="fetch-data-btn" onClick={this.reset}>Try again</button>
          <div style={{opacity:0.8,fontSize:'0.9rem',marginTop:'0.5rem'}}>{this.state.message}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --------------------------- Component ---------------------------
const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const [local, setLocal] = useState<LocalSettings>(() => safeLoad());
  const [saveError, setSaveError] = useState<string | null>(null);

  // Apply immediately when opening and when changes occur
  useEffect(() => { if (isOpen) applyToDocument(local); }, [isOpen]);
  useEffect(() => { applyToDocument(local); const err = safeSave(local); setSaveError(err); }, [local]);

  const onOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Click outside container closes
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onOverlayClick} role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
      <div className="modal-container">
        <button className="modal-close-button" onClick={onClose} aria-label="Close Settings">✕</button>
        <div className="settings-content">
          <h2 id="settings-modal-title" className="settings-title">Settings</h2>

          {saveError && (
            <div className="settings-section" role="alert">
              <div className="settings-section-title">Save Warning</div>
              <p className="settings-description">{saveError}</p>
            </div>
          )}

          {/* Gemini API Configuration */}
          <SectionBoundary title="Gemini API">
            <GeminiApiConfig />
          </SectionBoundary>

          {/* Appearance */}
          <SectionBoundary title="Appearance">
            <section className="settings-section" aria-label="Appearance">
              <div className="settings-section-title">Appearance</div>
              <p className="settings-description">Theme, text size, and kid/sensory mode.</p>

              <div className="settings-actions" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div>
                  <label htmlFor="theme-select">Theme</label>
                  <select id="theme-select" value={local.theme} onChange={(e)=>setLocal(v=>({...v, theme: e.target.value as ThemeMode}))}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="legendsZA">Legends ZA</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="text-size-select">Text size</label>
                  <select id="text-size-select" value={local.textSize} onChange={(e)=>setLocal(v=>({...v, textSize: e.target.value as TextSize}))}>
                    <option value="S">Small</option>
                    <option value="M">Medium</option>
                    <option value="L">Large</option>
                  </select>
                </div>
                <div style={{gridColumn:'1 / -1', display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <input id="kid-mode" type="checkbox" checked={local.kidMode} onChange={(e)=>setLocal(v=>({...v, kidMode: e.target.checked}))} />
                  <label htmlFor="kid-mode">Kid/Sensory mode (reduce motion & saturation)</label>
                </div>
              </div>
            </section>
          </SectionBoundary>

          {/* Backup & Reset (only settings JSON, not app data) */}
          <SectionBoundary title="Backup & Reset">
            <BackupPanel settings={local} onImport={(s)=>setLocal(s)} onReset={()=>setLocal(DEFAULTS)} />
          </SectionBoundary>
        </div>
      </div>
    </div>
  );
};

export default Settings;

// --------------------------- Gemini API Panel ---------------------------
function GeminiApiConfig() {
  const [authMode, setAuthMode] = useLocalStorage<'apiKey' | 'oauth'>('gemini-auth-mode', 'apiKey');
  const [apiKey, setApiKey] = useLocalStorage<string>('gemini-api-key', '');
  const [googleClientId, setGoogleClientId] = useLocalStorage<string>('gemini-client-id', '');
  const [googleProjectId, setGoogleProjectId] = useLocalStorage<string>('gemini-project-id', '');
  const [googleAuthState, setGoogleAuthState] = useLocalStorage<GoogleAuthState | null>('gemini-auth-state', null);
  
  const [isGsiReady, setIsGsiReady] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Check if the Google Identity Services script is loaded.
    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.oauth2) {
        setIsGsiReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleSignIn = () => {
    if (!isGsiReady || !googleClientId) {
      alert("Google Sign-In is not ready or Client ID is missing.");
      return;
    }
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      callback: async (tokenResponse: { access_token: string; expires_in: number }) => {
        if (tokenResponse.access_token) {
          try {
            const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
            });
            if (!profileRes.ok) throw new Error("Failed to fetch user profile.");
            const profile = await profileRes.json();
            setGoogleAuthState({
              accessToken: tokenResponse.access_token,
              expiresAt: Date.now() + tokenResponse.expires_in * 1000,
              profile: {
                email: profile.email,
                name: profile.name,
                picture: profile.picture,
              }
            });
          } catch (e) {
            console.error("OAuth profile fetch failed:", e);
            alert("Failed to fetch Google profile. Please try again.");
          }
        }
      },
    });
    client.requestAccessToken();
  };

  const handleSignOut = () => {
    if (googleAuthState?.accessToken) {
      (window as any).google.accounts.oauth2.revoke(googleAuthState.accessToken, () => {
        setGoogleAuthState(null);
      });
    }
  };

  const handleTestConnection = async () => {
    if (!googleAuthState || !googleProjectId) {
      setTestResult({ status: 'error', message: "Not signed in or Project ID is missing."});
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
        headers: {
          "Authorization": `Bearer ${googleAuthState.accessToken}`,
          "x-goog-user-project": googleProjectId,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API returned ${res.status}: ${errorText}`);
      }
      await res.json();
      setTestResult({ status: 'success', message: 'Connection successful! Found available models.'});
    } catch (e: any) {
      console.error("OAuth test connection failed:", e);
      setTestResult({ status: 'error', message: `Test failed: ${e.message}`});
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <section className="settings-section" aria-label="Gemini API Configuration">
      <div className="settings-section-title">Gemini API Configuration</div>
      <p className="settings-description">Configure how the app connects to Google Gemini for AI features.</p>
      
      <div className="settings-auth-mode">
        <input type="radio" id="auth-api-key" name="auth-mode" value="apiKey" checked={authMode === 'apiKey'} onChange={() => setAuthMode('apiKey')} />
        <label htmlFor="auth-api-key">API Key</label>
        <input type="radio" id="auth-oauth" name="auth-mode" value="oauth" checked={authMode === 'oauth'} onChange={() => setAuthMode('oauth')} />
        <label htmlFor="auth-oauth">OAuth 2.0</label>
      </div>

      <div className="settings-actions">
        {authMode === 'apiKey' ? (
          <div>
            <label htmlFor="api-key-input">Gemini API Key</label>
            <input id="api-key-input" type="password" placeholder="Enter your API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} />
          </div>
        ) : (
          <div className="auth-card">
            <div>
              <label htmlFor="client-id-input">Google OAuth Client ID</label>
              <input id="client-id-input" type="text" placeholder="Enter your Web Client ID" value={googleClientId} onChange={e => setGoogleClientId(e.target.value)} />
            </div>
            {googleAuthState ? (
              <>
                <div className="auth-profile">
                  <img src={googleAuthState.profile.picture} alt="User avatar" />
                  <div className="auth-profile-info">
                    <span className="auth-profile-name">{googleAuthState.profile.name}</span>
                    <span className="auth-profile-email">{googleAuthState.profile.email}</span>
                  </div>
                  <button className="settings-btn secondary" onClick={handleSignOut} style={{marginLeft: 'auto'}}>Sign Out</button>
                </div>
                 <div>
                  <label htmlFor="project-id-input">Google Cloud Project ID</label>
                  <input id="project-id-input" type="text" placeholder="Enter your GCP Project ID" value={googleProjectId} onChange={e => setGoogleProjectId(e.target.value)} />
                </div>
                <button className="settings-btn" onClick={handleTestConnection} disabled={isTesting || !googleProjectId}>
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
              </>
            ) : (
              <button className="settings-btn" onClick={handleSignIn} disabled={!isGsiReady || !googleClientId}>Sign in with Google</button>
            )}
            {testResult && (
              <div className={`test-connection-result ${testResult.status}`}>
                {testResult.message}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}


// --------------------------- Backup Panel ---------------------------
function BackupPanel({ settings, onImport, onReset }: { settings: LocalSettings; onImport: (s: LocalSettings)=>void; onReset: ()=>void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const doExport = useCallback(() => {
    try {
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'holodex-settings.json'; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || 'Export failed');
    }
  }, [settings]);

  const doImport = useCallback(async (file?: File | null) => {
    setError(null);
    try {
      if (!file) return;
      const text = await file.text();
      const json = JSON.parse(text);
      if (!isLocalSettings(json)) throw new Error('Invalid settings file');
      onImport(json);
    } catch (e: any) {
      setError(e?.message || 'Import failed');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [onImport]);

  const clearStorage = useCallback(() => {
    if (!confirm('Clear local settings storage? (Keeps other app data)')) return;
    try { localStorage.removeItem(STORAGE_KEY); location.reload(); } catch (e) { console.error(e); }
  }, []);

  return (
    <section className="settings-section" aria-label="Backup & Reset">
      <div className="settings-section-title">Backup & Reset</div>
      <p className="settings-description">Export/import your appearance preferences. This does not touch Pokémon data.</p>
      <div className="settings-actions" style={{display:'flex',flexWrap:'wrap',gap:'0.5rem'}}>
        <button className="fetch-data-btn" onClick={doExport}>Export Settings (JSON)</button>
        <input ref={fileRef} type="file" accept="application/json" style={{ display:'none' }} onChange={(e)=>doImport(e.target.files?.[0])} />
        <button className="fetch-data-btn" onClick={()=>fileRef.current?.click()}>Import Settings</button>
        <button className="fetch-data-btn" onClick={()=>{ if(confirm('Reset appearance to defaults?')) onReset(); }}>Reset Appearance</button>
        <button className="fetch-data-btn" onClick={clearStorage}>Clear Local Settings</button>
      </div>
      {error && <p className="settings-description" role="alert" style={{color:'#ffb4b4'}}>{error}</p>}
    </section>
  );
}