import { useState } from 'react';

/**
 * Hook personnalisé pour gérer le localStorage avec React state
 * @param {string} key - Clé du localStorage
 * @param {any} initialValue - Valeur initiale si la clé n'existe pas
 * @returns {[any, Function]} - [valeur, setter]
 */
export function useLocalStorage(key, initialValue) {
  // State pour stocker la valeur
  // On passe une fonction à useState pour qu'elle ne soit appelée qu'une fois
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Récupérer la valeur depuis localStorage
      const item = window.localStorage.getItem(key);
      // Parse la valeur stockée ou retourne la valeur initiale
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Fonction pour mettre à jour le localStorage et le state
  const setValue = (value) => {
    try {
      // Permettre à value d'être une fonction comme dans useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // Sauvegarder dans le state
      setStoredValue(valueToStore);

      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;
