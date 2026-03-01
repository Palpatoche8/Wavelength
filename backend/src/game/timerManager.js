/**
 * Gestionnaire de timers pour les rooms de jeu
 * Gère les countdowns et la progression automatique
 */
class TimerManager {
  constructor() {
    // Map des timers actifs : roomCode -> { timeout, startTime, duration, callback }
    this.timers = new Map();
  }

  /**
   * Démarre un timer pour une room
   * @param {string} roomCode - Code de la room
   * @param {number} duration - Durée en secondes
   * @param {Function} onExpire - Callback appelé quand le timer expire
   * @param {Function} onTick - Callback optionnel appelé chaque seconde
   */
  startTimer(roomCode, duration, onExpire, onTick = null) {
    // Arrêter le timer existant s'il y en a un
    this.stopTimer(roomCode);

    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    // Créer un interval pour les ticks (optionnel)
    let tickInterval = null;
    if (onTick) {
      tickInterval = setInterval(() => {
        const remaining = this.getRemainingTime(roomCode);
        if (remaining > 0) {
          onTick(remaining);
        }
      }, 1000); // Tick chaque seconde
    }

    // Créer le timeout principal
    const timeout = setTimeout(() => {
      // Nettoyer le tick interval
      if (tickInterval) {
        clearInterval(tickInterval);
      }

      // Retirer de la map
      this.timers.delete(roomCode);

      // Appeler le callback d'expiration
      if (onExpire) {
        onExpire();
      }

      console.log(`⏰ Timer expiré pour la room ${roomCode}`);
    }, duration * 1000);

    // Stocker le timer
    this.timers.set(roomCode, {
      timeout,
      tickInterval,
      startTime,
      endTime,
      duration,
      callback: onExpire
    });

    console.log(`⏱️  Timer démarré pour ${roomCode}: ${duration}s`);
  }

  /**
   * Arrête le timer d'une room
   * @param {string} roomCode - Code de la room
   */
  stopTimer(roomCode) {
    const timer = this.timers.get(roomCode);
    if (timer) {
      clearTimeout(timer.timeout);
      if (timer.tickInterval) {
        clearInterval(timer.tickInterval);
      }
      this.timers.delete(roomCode);
      console.log(`⏹️  Timer arrêté pour ${roomCode}`);
    }
  }

  /**
   * Récupère le temps restant pour une room
   * @param {string} roomCode - Code de la room
   * @returns {number} Temps restant en secondes (arrondi), ou 0 si pas de timer
   */
  getRemainingTime(roomCode) {
    const timer = this.timers.get(roomCode);
    if (!timer) return 0;

    const now = Date.now();
    const remaining = Math.max(0, timer.endTime - now);
    return Math.ceil(remaining / 1000); // Arrondir au supérieur
  }

  /**
   * Ajoute du temps à un timer existant
   * @param {string} roomCode - Code de la room
   * @param {number} additionalSeconds - Secondes à ajouter
   * @returns {boolean} True si le timer a été étendu, false sinon
   */
  extendTimer(roomCode, additionalSeconds) {
    const timer = this.timers.get(roomCode);
    if (!timer) {
      console.warn(`Impossible d'étendre le timer : aucun timer actif pour ${roomCode}`);
      return false;
    }

    // Mettre à jour l'endTime
    timer.endTime += additionalSeconds * 1000;
    timer.duration += additionalSeconds;

    console.log(`⏰ Timer étendu de ${additionalSeconds}s pour ${roomCode}`);
    return true;
  }

  /**
   * Vérifie si une room a un timer actif
   * @param {string} roomCode - Code de la room
   * @returns {boolean}
   */
  hasActiveTimer(roomCode) {
    return this.timers.has(roomCode);
  }

  /**
   * Obtient les infos du timer d'une room
   * @param {string} roomCode - Code de la room
   * @returns {Object|null} Infos du timer ou null
   */
  getTimerInfo(roomCode) {
    const timer = this.timers.get(roomCode);
    if (!timer) return null;

    return {
      remaining: this.getRemainingTime(roomCode),
      duration: timer.duration,
      startTime: timer.startTime,
      endTime: timer.endTime
    };
  }

  /**
   * Nettoie tous les timers (utile pour shutdown)
   */
  cleanup() {
    for (const [roomCode, timer] of this.timers.entries()) {
      clearTimeout(timer.timeout);
      if (timer.tickInterval) {
        clearInterval(timer.tickInterval);
      }
    }
    this.timers.clear();
    console.log('🧹 Tous les timers ont été nettoyés');
  }
}

// Export une instance singleton
export default new TimerManager();
