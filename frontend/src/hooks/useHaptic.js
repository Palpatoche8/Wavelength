import { useCallback } from 'react';

/**
 * Hook pour feedback haptique sur mobile
 * Utilise navigator.vibrate si disponible
 */
export function useHaptic() {
  // Vérifie si l'API Vibration est supportée
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  /**
   * Déclenche une vibration simple
   * @param {number} duration - Durée en ms (défaut: 50ms)
   */
  const vibrate = useCallback((duration = 50) => {
    if (!isSupported) return false;

    try {
      navigator.vibrate(duration);
      return true;
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
      return false;
    }
  }, [isSupported]);

  /**
   * Déclenche un pattern de vibration
   * @param {Array} pattern - Array alternant durées vibration et pauses [vibrate, pause, vibrate, ...]
   */
  const vibratePattern = useCallback((pattern) => {
    if (!isSupported) return false;

    try {
      navigator.vibrate(pattern);
      return true;
    } catch (error) {
      console.warn('Haptic pattern failed:', error);
      return false;
    }
  }, [isSupported]);

  /**
   * Vibrations prédéfinies pour différents événements
   */
  const feedback = {
    // Feedback léger (sélection)
    light: () => vibrate(10),

    // Feedback moyen (action)
    medium: () => vibrate(30),

    // Feedback fort (succès)
    strong: () => vibrate(50),

    // Feedback double (erreur)
    error: () => vibratePattern([50, 50, 50]),

    // Feedback succès
    success: () => vibratePattern([30, 20, 30]),

    // Feedback progression
    tick: () => vibrate(15)
  };

  return {
    vibrate,
    vibratePattern,
    feedback,
    isSupported
  };
}

export default useHaptic;
