import { useState, useEffect } from 'react';

/**
 * Composant Timer circulaire avec countdown
 * Affiche le temps restant avec changement de couleur
 */
function Timer({ duration, remainingTime, isActive }) {
  // Calculer le pourcentage de progression
  const percentage = duration > 0 ? (remainingTime / duration) * 100 : 100;

  // Déterminer la couleur selon le temps restant
  const getColor = () => {
    const percent = (remainingTime / duration) * 100;
    if (percent > 50) return 'text-green-600';
    if (percent > 20) return 'text-yellow-500';
    return 'text-red-600';
  };

  // Déterminer la couleur du cercle de progression
  const getStrokeColor = () => {
    const percent = (remainingTime / duration) * 100;
    if (percent > 50) return '#16a34a'; // green-600
    if (percent > 20) return '#eab308'; // yellow-500
    return '#dc2626'; // red-600
  };

  // Formater le temps en MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Paramètres du cercle SVG
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Animation de pulsation quand < 10s
  const shouldPulse = remainingTime <= 10 && isActive;

  if (!isActive || duration === null) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        {/* Cercle de progression SVG */}
        <svg className="w-full h-full -rotate-90">
          {/* Cercle de fond */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          {/* Cercle de progression */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease'
            }}
          />
        </svg>

        {/* Temps restant au centre */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-2xl font-bold ${getColor()} ${
              shouldPulse ? 'animate-pulse' : ''
            }`}
          >
            {formatTime(remainingTime)}
          </span>
        </div>
      </div>

      {shouldPulse && (
        <span className="text-xs font-semibold text-red-600 animate-pulse">
          Temps presque écoulé !
        </span>
      )}
    </div>
  );
}

export default Timer;
