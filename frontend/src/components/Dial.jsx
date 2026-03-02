import { useState, useRef, useEffect } from 'react';

/**
 * Composant Cadran pour WaveLength
 * Permet de sélectionner une valeur entre 1 et 20 sur un semi-cercle
 */
function Dial({
  value,
  onValueChange,
  targetValue = null,
  showTarget = false,
  showColoredZones = false,
  disabled = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef(null);

  // Conversion valeur (1-20) ↔ angle (0-180°)
  const valueToAngle = (val) => {
    // Valeur 1 = 0°, Valeur 10 = 90°, Valeur 20 = 180°
    return ((val - 1) / 19) * 180;
  };

  const angleToValue = (angle) => {
    // Angle 0° = 1, Angle 90° = 10, Angle 180° = 20
    const rawValue = (angle / 180) * 19 + 1;
    // Snapping : arrondir à la valeur la plus proche
    return Math.max(1, Math.min(20, Math.round(rawValue)));
  };

  // Calculer l'angle basé sur la position de la souris
  const calculateAngle = (clientX, clientY) => {
    if (!dialRef.current) return valueToAngle(value);

    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.bottom; // Le centre est en bas du semi-cercle

    const deltaX = clientX - centerX;
    const deltaY = centerY - clientY; // Inverser Y car le haut de l'écran = 0

    // Calculer l'angle en radians puis en degrés
    // CORRECTION: Inverser deltaX pour inverser le sens du curseur
    let angleRad = Math.atan2(deltaY, -deltaX);
    let angleDeg = angleRad * (180 / Math.PI);

    // Limiter l'angle entre 0 et 180
    if (angleDeg < 0) angleDeg = 0;
    if (angleDeg > 180) angleDeg = 180;

    return angleDeg;
  };

  // Gérer le drag
  const handleMouseDown = (e) => {
    if (disabled) return;
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseMove = (e) => {
    if (!isDragging && e.type !== 'mousedown') return;
    if (disabled) return;

    const angle = calculateAngle(e.clientX, e.clientY);
    const newValue = angleToValue(angle);
    if (newValue !== value) {
      onValueChange(newValue);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Gérer le touch pour mobile
  const handleTouchStart = (e) => {
    if (disabled) return;
    setIsDragging(true);
    const touch = e.touches[0];
    const angle = calculateAngle(touch.clientX, touch.clientY);
    const newValue = angleToValue(angle);
    if (newValue !== value) {
      onValueChange(newValue);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || disabled) return;
    const touch = e.touches[0];
    const angle = calculateAngle(touch.clientX, touch.clientY);
    const newValue = angleToValue(angle);
    if (newValue !== value) {
      onValueChange(newValue);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Event listeners globaux
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, value]);

  // Calculer la rotation de l'aiguille
  // CORRECTION : Pour un demi-cercle avec origin en bas, rotate(0) = haut
  // Donc on doit soustraire 90° pour que valeur 10 soit au centre (haut)
  const needleRotation = valueToAngle(value) - 90;

  // Calculer la couleur de la zone selon la distance (pour la révélation)
  const getZoneColor = (distance) => {
    if (distance === 0) return '#22c55e'; // Vert
    if (distance === 1) return '#eab308'; // Jaune
    if (distance === 2) return '#f97316'; // Orange
    return 'transparent';
  };

  return (
    <div className="flex flex-col items-center">
      {/* Cadran */}
      <div
        ref={dialRef}
        className={`relative w-96 h-48 ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Semi-cercle de base */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" viewBox="0 0 384 192">
            {/* Arc de fond (blanc/gris) */}
            <path
              d="M 24 192 A 168 168 0 0 1 360 192"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="48"
            />

            {/* Arc intérieur (blanc) pour l'effet 3D */}
            <path
              d="M 24 192 A 168 168 0 0 1 360 192"
              fill="none"
              stroke="#f9fafb"
              strokeWidth="40"
            />

            {/* Zones colorées pour le psychique (avant de donner l'indice) */}
            {showColoredZones && targetValue !== null && (
              <>
                {/* Zone orange (±2) - 2 points */}
                {(() => {
                  const targetAngle = valueToAngle(targetValue);
                  const minVal = Math.max(1, targetValue - 2);
                  const maxVal = Math.min(20, targetValue + 2);
                  const startAngle = valueToAngle(minVal);
                  const endAngle = valueToAngle(maxVal);

                  const startRad = (Math.PI - (startAngle * Math.PI) / 180);
                  const endRad = (Math.PI - (endAngle * Math.PI) / 180);

                  const radius = 200; // Rayon étendu pour couvrir jusqu'au bord extérieur visible du cadran
                  const x1 = 192 + Math.cos(startRad) * radius;
                  const y1 = 192 - Math.sin(startRad) * radius;
                  const x2 = 192 + Math.cos(endRad) * radius;
                  const y2 = 192 - Math.sin(endRad) * radius;

                  const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

                  return (
                    <path
                      d={`M 192 192 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill="rgba(249, 115, 22, 0.3)"
                      stroke="none"
                    />
                  );
                })()}

                {/* Zone jaune (±1) - 3 points */}
                {(() => {
                  const targetAngle = valueToAngle(targetValue);
                  const minVal = Math.max(1, targetValue - 1);
                  const maxVal = Math.min(20, targetValue + 1);
                  const startAngle = valueToAngle(minVal);
                  const endAngle = valueToAngle(maxVal);

                  const startRad = (Math.PI - (startAngle * Math.PI) / 180);
                  const endRad = (Math.PI - (endAngle * Math.PI) / 180);

                  const radius = 200; // Même rayon que zone orange pour cohérence
                  const x1 = 192 + Math.cos(startRad) * radius;
                  const y1 = 192 - Math.sin(startRad) * radius;
                  const x2 = 192 + Math.cos(endRad) * radius;
                  const y2 = 192 - Math.sin(endRad) * radius;

                  const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

                  return (
                    <path
                      d={`M 192 192 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill="rgba(234, 179, 8, 0.4)"
                      stroke="none"
                    />
                  );
                })()}

                {/* Zone verte (valeur exacte) - 4 points */}
                {(() => {
                  const targetAngle = valueToAngle(targetValue);
                  const spreadAngle = 4; // Petit angle pour montrer la zone exacte
                  const startAngle = Math.max(0, targetAngle - spreadAngle);
                  const endAngle = Math.min(180, targetAngle + spreadAngle);

                  const startRad = (Math.PI - (startAngle * Math.PI) / 180);
                  const endRad = (Math.PI - (endAngle * Math.PI) / 180);

                  const radius = 200; // Rayon étendu pour cohérence avec autres zones
                  const x1 = 192 + Math.cos(startRad) * radius;
                  const y1 = 192 - Math.sin(startRad) * radius;
                  const x2 = 192 + Math.cos(endRad) * radius;
                  const y2 = 192 - Math.sin(endRad) * radius;

                  return (
                    <path
                      d={`M 192 192 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                      fill="rgba(34, 197, 94, 0.5)"
                      stroke="none"
                    />
                  );
                })()}
              </>
            )}

            {/* Zones colorées révélées (seulement lors de la révélation) */}
            {showTarget && targetValue !== null && (
              <>
                {/* Zone verte (valeur exacte) */}
                {Math.abs(value - targetValue) === 0 && (
                  <path
                    d={`M 192 192 L ${192 + Math.cos(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 144} ${192 - Math.sin(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 144} A 5 5 0 0 0 ${192 + Math.cos(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 144} ${192 - Math.sin(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 144} Z`}
                    fill="rgba(34, 197, 94, 0.3)"
                    stroke="none"
                  />
                )}

                {/* Ligne de la cible (rouge) */}
                <line
                  x1="192"
                  y1="192"
                  x2={192 + Math.cos(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 168}
                  y2={192 - Math.sin(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 168}
                  stroke="#ef4444"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* Cercle rouge à la fin de la ligne cible */}
                <circle
                  cx={192 + Math.cos(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 168}
                  cy={192 - Math.sin(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 168}
                  r="12"
                  fill="#ef4444"
                />
              </>
            )}

            {/* Markers pour les valeurs principales */}
            {[1, 5, 10, 15, 20].map((val) => {
              const angle = valueToAngle(val);
              const radian = (Math.PI - (angle * Math.PI) / 180);
              const x1 = 192 + Math.cos(radian) * 144;
              const y1 = 192 - Math.sin(radian) * 144;
              const x2 = 192 + Math.cos(radian) * 160;
              const y2 = 192 - Math.sin(radian) * 160;

              return (
                <g key={val}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#6b7280"
                    strokeWidth="3"
                  />
                  <text
                    x={192 + Math.cos(radian) * 175}
                    y={192 - Math.sin(radian) * 175}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm font-bold fill-gray-700"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Petits markers pour toutes les autres valeurs */}
            {Array.from({ length: 20 }, (_, i) => i + 1)
              .filter(v => ![1, 5, 10, 15, 20].includes(v))
              .map((val) => {
                const angle = valueToAngle(val);
                const radian = (Math.PI - (angle * Math.PI) / 180);
                const x1 = 192 + Math.cos(radian) * 150;
                const y1 = 192 - Math.sin(radian) * 150;
                const x2 = 192 + Math.cos(radian) * 160;
                const y2 = 192 - Math.sin(radian) * 160;

                return (
                  <line
                    key={val}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#9ca3af"
                    strokeWidth="2"
                  />
                );
              })}
          </svg>
        </div>

        {/* Aiguille - CORRECTION: rotate(needleRotation - 90) */}
        <div
          className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-150"
          style={{
            width: '6px',
            height: '150px',
            background: disabled
              ? 'linear-gradient(to top, #6b7280, #9ca3af)'
              : 'linear-gradient(to top, #6b7280, #d1d5db)',
            transform: `translateX(-50%) rotate(${needleRotation}deg)`,
            transformOrigin: 'bottom center',
            boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)',
            pointerEvents: 'none'
          }}
        >
          {/* Poignée de l'aiguille */}
          <div className={`absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 ${
            disabled ? 'bg-gray-400' : 'bg-white border-4 border-gray-400'
          } rounded-full flex items-center justify-center shadow-xl ${
            !disabled && 'hover:scale-110 transition-transform cursor-grab active:cursor-grabbing'
          }`}>
            <div className={`text-2xl font-bold font-mono text-center ${disabled ? 'text-white' : 'text-gray-700'}`}>
              {value}
            </div>
          </div>
        </div>

        {/* Point central */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full shadow-lg z-10"></div>
      </div>

      {/* Affichage simple de la valeur */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">Positionnez le curseur entre 1 et 20</p>
      </div>
    </div>
  );
}

export default Dial;
