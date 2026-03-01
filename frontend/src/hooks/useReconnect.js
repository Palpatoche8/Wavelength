import { useState, useEffect } from 'react';
import useLocalStorage from './useLocalStorage';

/**
 * Hook pour gérer la reconnexion à la dernière room
 */
export function useReconnect() {
  const [lastRoomCode, setLastRoomCode] = useLocalStorage('wavelength_last_room', null);
  const [canReconnect, setCanReconnect] = useState(false);

  useEffect(() => {
    // Vérifier si on peut se reconnecter
    setCanReconnect(!!lastRoomCode);
  }, [lastRoomCode]);

  const saveRoom = (roomCode) => {
    setLastRoomCode(roomCode);
  };

  const clearRoom = () => {
    setLastRoomCode(null);
    setCanReconnect(false);
  };

  return {
    canReconnect,
    lastRoomCode,
    saveRoom,
    clearRoom
  };
}

export default useReconnect;
