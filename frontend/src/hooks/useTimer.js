import { useState, useEffect, useRef } from 'react';

/**
 * Hook personnalisé pour gérer le timer d'un round
 * Sync avec le backend via Socket.IO
 * @param {Object} socket - Instance Socket.IO
 * @param {number} serverDuration - Durée du timer depuis le serveur
 * @param {boolean} isActive - Le timer est-il actif
 * @returns {Object} État du timer { remainingTime, isExpired }
 */
export function useTimer(socket, serverDuration, isActive = false) {
  const [remainingTime, setRemainingTime] = useState(serverDuration || 0);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef(null);
  const lastSyncRef = useRef(Date.now());

  useEffect(() => {
    if (!socket || !isActive || !serverDuration) {
      // Nettoyer si inactif
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initialiser le temps restant
    setRemainingTime(serverDuration);
    setIsExpired(false);
    lastSyncRef.current = Date.now();

    // Écouter les ticks du serveur pour sync
    const handleTimerTick = ({ remainingTime: serverRemaining }) => {
      setRemainingTime(serverRemaining);
      lastSyncRef.current = Date.now();

      if (serverRemaining <= 0) {
        setIsExpired(true);
      }
    };

    // Écouter l'expiration du timer
    const handleTimerExpired = () => {
      setRemainingTime(0);
      setIsExpired(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    socket.on('timer-tick', handleTimerTick);
    socket.on('timer-expired', handleTimerExpired);

    // Countdown local entre les ticks du serveur (pour fluidité)
    intervalRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        const newValue = Math.max(0, prev - 1);
        if (newValue <= 0) {
          setIsExpired(true);
        }
        return newValue;
      });
    }, 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      socket.off('timer-tick', handleTimerTick);
      socket.off('timer-expired', handleTimerExpired);
    };
  }, [socket, serverDuration, isActive]);

  return {
    remainingTime,
    isExpired
  };
}

export default useTimer;
