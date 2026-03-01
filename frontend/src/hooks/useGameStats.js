import { useStatsStore } from '../stores/statsStore';

/**
 * Hook simplifié pour enregistrer les statistiques de jeu
 */
export function useGameStats() {
  const addGameResult = useStatsStore(state => state.addGameResult);
  const getAverageAccuracy = useStatsStore(state => state.getAverageAccuracy);
  const getAverageScore = useStatsStore(state => state.getAverageScore);
  const getRecentGames = useStatsStore(state => state.getRecentGames);
  const exportStats = useStatsStore(state => state.exportStats);

  /**
   * Enregistre une partie terminée
   * @param {Object} gameData - Données de la partie
   */
  const recordGame = (gameData) => {
    const { roomCode, players, finalScore, rounds, totalDistance } = gameData;

    addGameResult({
      roomCode,
      players: players.map(p => p.name),
      finalScore,
      rounds,
      totalDistance
    });
  };

  return {
    recordGame,
    getAverageAccuracy,
    getAverageScore,
    getRecentGames,
    exportStats
  };
}

export default useGameStats;
