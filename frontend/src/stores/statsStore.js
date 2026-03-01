import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store Zustand pour les statistiques de jeu
 * Persiste automatiquement dans localStorage
 */
export const useStatsStore = create(
  persist(
    (set, get) => ({
      // Statistiques globales
      gamesPlayed: 0,
      totalPoints: 0,
      totalDistance: 0, // Distance cumulée (pour moyenne)
      bestScore: 0,
      bestAccuracy: 0, // Meilleure distance minimale

      // Historique des parties (max 50 pour limiter la taille)
      history: [],

      // Ajouter un résultat de partie
      addGameResult: (result) => {
        const state = get();

        // Calculer la moyenne de distance pour cette partie
        const avgDistance = result.totalDistance / result.rounds;

        // Mettre à jour les statistiques globales
        const newGamesPlayed = state.gamesPlayed + 1;
        const newTotalPoints = state.totalPoints + result.finalScore;
        const newTotalDistance = state.totalDistance + result.totalDistance;
        const newBestScore = Math.max(state.bestScore, result.finalScore);
        const newBestAccuracy = state.bestAccuracy === 0
          ? avgDistance
          : Math.min(state.bestAccuracy, avgDistance);

        // Ajouter à l'historique (garder seulement les 50 dernières parties)
        const newHistory = [
          {
            date: new Date().toISOString(),
            roomCode: result.roomCode,
            players: result.players || [],
            finalScore: result.finalScore,
            rounds: result.rounds,
            averageDistance: avgDistance,
            totalDistance: result.totalDistance
          },
          ...state.history
        ].slice(0, 50); // Limiter à 50 parties

        set({
          gamesPlayed: newGamesPlayed,
          totalPoints: newTotalPoints,
          totalDistance: newTotalDistance,
          bestScore: newBestScore,
          bestAccuracy: newBestAccuracy,
          history: newHistory
        });
      },

      // Calculer la précision moyenne
      getAverageAccuracy: () => {
        const state = get();
        if (state.gamesPlayed === 0) return 0;
        return state.totalDistance / state.gamesPlayed;
      },

      // Calculer le score moyen
      getAverageScore: () => {
        const state = get();
        if (state.gamesPlayed === 0) return 0;
        return state.totalPoints / state.gamesPlayed;
      },

      // Obtenir les N dernières parties
      getRecentGames: (n = 10) => {
        const state = get();
        return state.history.slice(0, n);
      },

      // Exporter les statistiques en JSON
      exportStats: () => {
        const state = get();
        return JSON.stringify({
          gamesPlayed: state.gamesPlayed,
          totalPoints: state.totalPoints,
          averageScore: state.getAverageScore(),
          averageAccuracy: state.getAverageAccuracy(),
          bestScore: state.bestScore,
          bestAccuracy: state.bestAccuracy,
          history: state.history
        }, null, 2);
      },

      // Reset toutes les stats
      resetStats: () => set({
        gamesPlayed: 0,
        totalPoints: 0,
        totalDistance: 0,
        bestScore: 0,
        bestAccuracy: 0,
        history: []
      })
    }),
    {
      name: 'wavelength_stats', // Nom de la clé dans localStorage
      version: 1 // Versioning pour migrations futures
    }
  )
);

export default useStatsStore;
