import type { Settings } from '../dice/types';

const KEY = 'dice-settings-v1';

export const defaultSettings: Settings = {
  theme: 'dark',
  diceColor: '#ef4444',
  diceMaterial: 'plastic',
  soundEnabled: false,
  gravity: 9.82,
  tableFriction: 0.4,
  autoClearMs: 0,
  hapticsEnabled: true,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
