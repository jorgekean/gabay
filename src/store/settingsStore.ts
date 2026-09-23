import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  activeSchoolYear: string;
  setActiveSchoolYear: (sy: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      activeSchoolYear: '2026-2027', // Default MVP active year
      setActiveSchoolYear: (sy: string) => set({ activeSchoolYear: sy }),
    }),
    {
      name: 'gabay-settings-storage',
    }
  )
);
