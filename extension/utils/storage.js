/**
 * utils/storage.js
 * ----------------
 * Storage utility layer for TEAM_TECH extension preferences using chrome.storage.local.
 */

export const DEFAULT_SETTINGS = {
  backendUrl: 'http://127.0.0.1:8000',
  autoAnalyze: false,
  enableNotifications: true,
  darkMode: true,
};

/**
 * Retrieve extension settings with fallbacks.
 * @returns {Promise<typeof DEFAULT_SETTINGS>}
 */
export async function getSettings() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['teamTechSettings'], (result) => {
        resolve({ ...DEFAULT_SETTINGS, ...(result.teamTechSettings || {}) });
      });
    } else {
      resolve(DEFAULT_SETTINGS);
    }
  });
}

/**
 * Save updated extension settings.
 * @param {Partial<typeof DEFAULT_SETTINGS>} newSettings
 * @returns {Promise<typeof DEFAULT_SETTINGS>}
 */
export async function saveSettings(newSettings) {
  const current = await getSettings();
  const updated = { ...current, ...newSettings };
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ teamTechSettings: updated }, () => {
        resolve(updated);
      });
    } else {
      resolve(updated);
    }
  });
}

/**
 * Get active Backend URL.
 * @returns {Promise<string>}
 */
export async function getBackendUrl() {
  const settings = await getSettings();
  return settings.backendUrl || DEFAULT_SETTINGS.backendUrl;
}
