import { create } from 'zustand';
import type { Preset, Roll, Settings } from './dice/types';
import { defaultSettings, loadSettings, saveSettings } from './storage/settings';
import * as db from './storage/db';

interface AppState {
  currentRoll: Roll | null;
  history: Roll[];
  presets: Preset[];
  settings: Settings;
  rolling: boolean;

  init: () => Promise<void>;
  setCurrentRoll: (r: Roll | null) => void;
  addRoll: (r: Roll) => Promise<void>;
  deleteRoll: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  savePreset: (p: Preset) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => void;
  setRolling: (b: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentRoll: null,
  history: [],
  presets: [],
  settings: defaultSettings,
  rolling: false,

  init: async () => {
    const settings = loadSettings();
    const [history, presets] = await Promise.all([db.getHistory(100), db.getPresets()]);
    set({ settings, history, presets });
  },

  setCurrentRoll: (r) => set({ currentRoll: r }),

  addRoll: async (r) => {
    await db.addRoll(r);
    set({ currentRoll: r, history: [r, ...get().history].slice(0, 100) });
  },

  deleteRoll: async (id) => {
    await db.deleteRoll(id);
    set({ history: get().history.filter((r) => r.id !== id) });
  },

  clearHistory: async () => {
    await db.clearHistory();
    set({ history: [] });
  },

  savePreset: async (p) => {
    await db.savePreset(p);
    set({ presets: [...get().presets.filter((x) => x.id !== p.id), p] });
  },

  deletePreset: async (id) => {
    await db.deletePreset(id);
    set({ presets: get().presets.filter((p) => p.id !== id) });
  },

  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    saveSettings(next);
    set({ settings: next });
  },

  setRolling: (b) => set({ rolling: b }),
}));
