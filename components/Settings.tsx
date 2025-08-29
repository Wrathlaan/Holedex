/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { FETCHABLE_REGIONS } from '../App';

interface RegionFetchState {
  isFetched: boolean;
  isFetching: boolean;
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onFetchAllData: () => void;
  isAllDataFetched: boolean;
  isFetchingAll: boolean;
  onFetchRegionData: (regionName: string) => void;
  regionFetchStates: Record<string, RegionFetchState>;
}

const Settings: React.FC<SettingsProps> = ({ 
  isOpen, 
  onClose, 
  onFetchAllData, 
  isAllDataFetched, 
  isFetchingAll,
  onFetchRegionData,
  regionFetchStates,
}) => {
  if (!isOpen) {
    return null;
  }

  const isAnyRegionFetching = Object.values(regionFetchStates).some(state => state.isFetching);
  const isAnyFetching = isFetchingAll || isAnyRegionFetching;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose} aria-label="Close Settings">&times;</button>
        <div className="settings-content">
          <h2 id="settings-modal-title" className="settings-title">Settings</h2>
          <div className="settings-section">
            <h3 className="settings-section-title">Data Management</h3>
            <p className="settings-description">
              The Pokédex is initialized with Kanto data. You can incrementally fetch data for other regions or fetch all available Pokémon at once.
            </p>
            <div className="settings-actions">
              {FETCHABLE_REGIONS.map(region => {
                const state = regionFetchStates[region];
                const isFetched = state.isFetched || isAllDataFetched;
                return (
                  <button
                    key={region}
                    className="fetch-data-btn"
                    onClick={() => onFetchRegionData(region)}
                    disabled={isFetched || isAnyFetching}
                  >
                    {state.isFetching ? 'Fetching...' : isFetched ? `${region} Data Fetched` : `Fetch ${region} Data`}
                  </button>
                );
              })}
              <button
                className="fetch-data-btn"
                onClick={onFetchAllData}
                disabled={isAllDataFetched || isAnyFetching}
              >
                {isFetchingAll ? 'Fetching...' : isAllDataFetched ? 'All Data Fetched' : 'Fetch All Pokémon Data'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
