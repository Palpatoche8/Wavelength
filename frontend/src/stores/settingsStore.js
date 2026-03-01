import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store Zustand pour les paramètres de l'application
 * Persiste automatiquement dans localStorage
 */
export const useSettingsStore = create(
  persist(
    (set) => ({
      // Paramètres d'affichage
      theme: 'light', // 'light' | 'dark' | 'system'
      soundEnabled: true,
      animationsEnabled: true,

      // Paramètres par défaut de partie
      defaultTimerDuration: null, // null, 30, 60, 90
      defaultTotalRounds: null, // null, 5, 10, 15
      defaultDifficulty: 'normal', // 'easy' | 'normal' | 'hard'

      // Dernière room (pour reconnexion)
      lastRoomCode: null,

      // Actions pour mettre à jour les paramètres
      setTheme: (theme) => set({ theme }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
      setDefaultTimerDuration: (duration) => set({ defaultTimerDuration: duration }),
      setDefaultTotalRounds: (rounds) => set({ defaultTotalRounds: rounds }),
      setDefaultDifficulty: (difficulty) => set({ defaultDifficulty: difficulty }),
      setLastRoomCode: (code) => set({ lastRoomCode: code }),

      // Reset tous les paramètres
      resetSettings: () => set({
        theme: 'light',
        soundEnabled: true,
        animationsEnabled: true,
        defaultTimerDuration: null,
        defaultTotalRounds: null,
        defaultDifficulty: 'normal',
        lastRoomCode: null
      })
    }),
    {
      name: 'wavelength_settings', // Nom de la clé dans localStorage
      version: 1 // Versioning pour migrations futures
    }
  )
);

export default useSettingsStore;
