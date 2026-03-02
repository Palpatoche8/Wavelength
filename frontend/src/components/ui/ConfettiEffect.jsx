import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

/**
 * Composant pour déclencher des confettis
 * Utilise canvas-confetti pour l'effet visuel
 */
function ConfettiEffect({ trigger, colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'] }) {
  const lastTrigger = useRef(0);

  useEffect(() => {
    // Ne rien faire si trigger est 0 ou si c'est le même trigger qu'avant
    if (!trigger || trigger === lastTrigger.current) return;
    
    // Mettre à jour la référence pour éviter les déclenchements multiples
    lastTrigger.current = trigger;

    // Configuration des confettis
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: colors
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    // Lancer plusieurs vagues de confettis (UNE SEULE FOIS)
    fire(0.25, {
      spread: 26,
      startVelocity: 55
    });

    fire(0.2, {
      spread: 60
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45
    });
  }, [trigger, colors]);

  return null; // Pas de rendu visuel, juste l'effet
}

export default ConfettiEffect;
