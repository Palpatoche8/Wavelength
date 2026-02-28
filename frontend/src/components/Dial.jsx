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
  disabled = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef(null);

  // Conversion valeur (1-20) ↔ angle (0-180°)
  const valueToAngle = (val) => {
    // Valeur 1 = 0°, Valeur 20 = 180°
    return ((val - 1) / 19) * 180;
  };

  const angleToValue = (angle) => {
    // Angle 0° = 1, Angle 180° = 20
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
    let angleRad = Math.atan2(deltaY, deltaX);
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
  const needleRotation = valueToAngle(value);

  // Calculer les zones de scoring si la cible est révélée
  const getZoneColor = (distance) => {
    if (distance === 0) return 'rgba(34, 197, 94, 0.4)'; // Vert
    if (distance === 1) return 'rgba(234, 179, 8, 0.4)'; // Jaune
    if (distance === 2) return 'rgba(249, 115, 22, 0.4)'; // Orange
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
            {/* Arc de fond */}
            <path
              d="M 24 192 A 168 168 0 0 1 360 192"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="48"
            />

            {/* Dégradé de couleur sur le spectre */}
            <defs>
              <linearGradient id="spectrumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316" /> {/* Orange */}
                <stop offset="50%" stopColor="#fbbf24" /> {/* Jaune */}
                <stop offset="100%" stopColor="#3b82f6" /> {/* Bleu */}
              </linearGradient>
            </defs>

            {/* Arc avec dégradé */}
            <path
              d="M 24 192 A 168 168 0 0 1 360 192"
              fill="none"
              stroke="url(#spectrumGradient)"
              strokeWidth="40"
              opacity="0.8"
            />

            {/* Markers pour chaque valeur (1-20) */}
            {Array.from({ length: 20 }, (_, i) => i + 1).map((val) => {
              const angle = valueToAngle(val);
              const radian = (Math.PI - (angle * Math.PI) / 180);
              const x1 = 192 + Math.cos(radian) * 144;
              const y1 = 192 - Math.sin(radian) * 144;
              const x2 = 192 + Math.cos(radian) * 160;
              const y2 = 192 - Math.sin(radian) * 160;

              // Marker plus grand pour les valeurs 1, 5, 10, 15, 20
              const isMajor = val % 5 === 0 || val === 1;

              return (
                <g key={val}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={value === val ? '#f59e0b' : '#6b7280'}
                    strokeWidth={isMajor ? 3 : 2}
                  />
                  {isMajor && (
                    <text
                      x={192 + Math.cos(radian) * 175}
                      y={192 - Math.sin(radian) * 175}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-bold fill-gray-700"
                    >
                      {val}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Zones de scoring révélées */}
            {showTarget && targetValue !== null && (
              <>
                {/* Zone verte (valeur exacte) */}
                <path
                  d={`M 192 192 L ${192 + Math.cos(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 144} ${192 - Math.sin(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 144} A 144 144 0 0 0 ${192 + Math.cos(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 144} ${192 - Math.sin(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 144} Z`}
                  fill={getZoneColor(0)}
                  stroke="none"
                />

                {/* Zones jaunes (±1) */}
                {[targetValue - 1, targetValue + 1].map((zoneVal) => {
                  if (zoneVal < 1 || zoneVal > 20) return null;
                  const angle1 = valueToAngle(zoneVal);
                  const angle2 = valueToAngle(zoneVal);
                  return (
                    <circle
                      key={zoneVal}
                      cx={192 + Math.cos(Math.PI - (angle1 * Math.PI) / 180) * 120}
                      cy={192 - Math.sin(Math.PI - (angle1 * Math.PI) / 180) * 120}
                      r="20"
                      fill={getZoneColor(1)}
                      stroke="none"
                    />
                  );
                })}

                {/* Ligne de la cible */}
                <line
                  x1="192"
                  y1="192"
                  x2={192 + Math.cos(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 160}
                  y2={192 - Math.sin(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 160}
                  stroke="#ef4444"
                  strokeWidth="4"
                />
              </>
            )}
          </svg>
        </div>

        {/* Aiguille */}
        <div
          className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-150"
          style={{
            width: '6px',
            height: '150px',
            background: disabled
              ? 'linear-gradient(to top, #6b7280, #9ca3af)'
              : 'linear-gradient(to top, #f59e0b, #fbbf24)',
            transform: `translateX(-50%) rotate(${needleRotation}deg)`,
            transformOrigin: 'bottom center',
            boxShadow: '0 0 12px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none'
          }}
        >
          {/* Poignée de l'aiguille */}
          <div className={`absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 ${
            disabled ? 'bg-gray-400' : 'bg-gradient-to-br from-orange-400 to-orange-600'
          } rounded-full flex items-center justify-center shadow-xl border-4 border-white ${
            !disabled && 'hover:scale-110 transition-transform cursor-grab active:cursor-grabbing'
          }`}>
            <div className="text-white text-2xl font-bold">{value}</div>
          </div>
        </div>

        {/* Point central */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 bg-gray-800 rounded-full shadow-lg z-10"></div>
      </div>

      {/* Affichage de la valeur */}
      <div className="mt-8 text-center">
        <div className="bg-white rounded-xl shadow-lg px-8 py-4 inline-block border-2 border-orange-200">
          <p className="text-sm text-gray-600 mb-1 font-medium">Valeur sélectionnée</p>
          <p className="text-5xl font-bold text-orange-600">{value}</p>
          <p className="text-xs text-gray-500 mt-1">sur une échelle de 1 à 20</p>
        </div>

        {showTarget && targetValue !== null && (
          <div className="mt-4 bg-red-50 rounded-xl shadow-lg px-8 py-4 inline-block border-4 border-red-300">
            <p className="text-sm text-red-600 mb-1 font-medium">🎯 Cible secrète</p>
            <p className="text-5xl font-bold text-red-600">{targetValue}</p>
            <p className="text-sm text-red-500 mt-2">
              Distance: <strong>{Math.abs(value - targetValue)}</strong>
              {Math.abs(value - targetValue) === 0 && ' - 🎉 PARFAIT !'}
              {Math.abs(value - targetValue) === 1 && ' - Très proche !'}
              {Math.abs(value - targetValue) === 2 && ' - Proche'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dial;
