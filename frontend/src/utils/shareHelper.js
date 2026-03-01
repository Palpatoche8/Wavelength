/**
 * Utilitaires pour partager du contenu via Web Share API
 */

/**
 * Partage le code de room
 * @param {string} roomCode - Code de la room
 * @returns {Promise<boolean>} True si partagé avec succès
 */
export async function shareRoomCode(roomCode) {
  // Vérifier si Web Share API est supportée
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: 'Rejoignez ma partie WaveLength!',
      text: `Code de la partie: ${roomCode}\nJouez avec moi sur WaveLength!`,
      url: window.location.origin
    });
    return true;
  } catch (error) {
    // Erreur si l'utilisateur annule ou autre
    if (error.name !== 'AbortError') {
      console.error('Erreur lors du partage:', error);
    }
    return false;
  }
}

/**
 * Vérifie si Web Share API est supportée
 * @returns {boolean}
 */
export function canShare() {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

export default shareRoomCode;
