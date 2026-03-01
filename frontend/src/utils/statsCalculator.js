/**
 * Calculs statistiques pour le jeu
 */

/**
 * Calcule la précision moyenne
 * @param {Array} history - Historique des parties
 * @returns {number} Précision moyenne (distance)
 */
export function calculateAverageAccuracy(history) {
  if (!history || history.length === 0) return 0;

  const totalDistance = history.reduce((sum, game) => sum + (game.averageDistance || 0), 0);
  return totalDistance / history.length;
}

/**
 * Calcule le score moyen
 * @param {Array} history - Historique des parties
 * @returns {number} Score moyen
 */
export function calculateAverageScore(history) {
  if (!history || history.length === 0) return 0;

  const totalScore = history.reduce((sum, game) => sum + (game.finalScore || 0), 0);
  return totalScore / history.length;
}

/**
 * Génère des données pour graphique
 * @param {Array} history - Historique des parties
 * @returns {Array} Données formatées pour recharts
 */
export function generateChartData(history) {
  if (!history) return [];

  return history.slice(0, 10).reverse().map((game, index) => ({
    name: `Partie ${index + 1}`,
    score: game.finalScore,
    precision: 20 - game.averageDistance, // Inverser pour que plus haut = mieux
    date: new Date(game.date).toLocaleDateString()
  }));
}

/**
 * Calcule les tendances
 * @param {Array} history - Historique des parties
 * @returns {Object} Tendances (amélioration, score moyen récent, etc.)
 */
export function calculateTrends(history) {
  if (!history || history.length < 2) {
    return {
      improving: false,
      recentAverage: 0,
      change: 0
    };
  }

  const recent = history.slice(0, 5);
  const older = history.slice(5, 10);

  const recentAvg = calculateAverageScore(recent);
  const olderAvg = calculateAverageScore(older);

  return {
    improving: recentAvg > olderAvg,
    recentAverage: recentAvg,
    change: recentAvg - olderAvg
  };
}

export default {
  calculateAverageAccuracy,
  calculateAverageScore,
  generateChartData,
  calculateTrends
};
