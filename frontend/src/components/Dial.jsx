import { useState, useRef, useEffect } from 'react';

/**
 * Composant Cadran rotatif pour WaveLength
 * Permet de positionner l'aiguille sur un semi-cercle de 0° à 180°
 */
function Dial({
  angle,
  onAngleChange,
  targetAngle = null,
  showTarget = false,
  disabled = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef(null);

  // Calculer l'angle basé sur la position de la souris
  const calculateAngle = (clientX, clientY) => {
    if (!dialRef.current) return angle;

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

    return Math.round(angleDeg);
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

    const newAngle = calculateAngle(e.clientX, e.clientY);
    onAngleChange(newAngle);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Gérer le touch pour mobile
  const handleTouchStart = (e) => {
    if (disabled) return;
    setIsDragging(true);
    const touch = e.touches[0];
    const newAngle = calculateAngle(touch.clientX, touch.clientY);
    onAngleChange(newAngle);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || disabled) return;
    const touch = e.touches[0];
    const newAngle = calculateAngle(touch.clientX, touch.clientY);
    onAngleChange(newAngle);
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
  }, [isDragging]);

  // Calculer la rotation de l'aiguille (0° = droite, 180° = gauche)
  const needleRotation = angle;

  // Zones de scoring (pour la révélation)
  const renderScoringZones = () => {
    if (!showTarget || targetAngle === null) return null;

    return (
      <>
        {/* Zone verte (±15°) */}
        <div
          className="absolute bottom-0 left-1/2 origin-bottom"
          style={{
            width: '2px',
            height: '140px',
            background: 'rgba(34, 197, 94, 0.3)',
            transform: `translateX(-50%) rotate(${targetAngle - 15}deg)`,
            transformOrigin: 'bottom center'
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 origin-bottom"
          style={{
            width: '2px',
            height: '140px',
            background: 'rgba(34, 197, 94, 0.3)',
            transform: `translateX(-50%) rotate(${targetAngle + 15}deg)`,
            transformOrigin: 'bottom center'
          }}
        />

        {/* Ligne de la cible */}
        <div
          className="absolute bottom-0 left-1/2 origin-bottom transition-all duration-300"
          style={{
            width: '4px',
            height: '160px',
            background: 'linear-gradient(to top, #ef4444, #fca5a5)',
            transform: `translateX(-50%) rotate(${targetAngle}deg)`,
            transformOrigin: 'bottom center',
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
          }}
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-xs font-bold">🎯</span>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col items-center">
      {/* Cadran */}
      <div
        ref={dialRef}
        className={`relative w-80 h-40 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Semi-cercle de base */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" viewBox="0 0 320 160">
            {/* Arc extérieur */}
            <path
              d="M 20 160 A 140 140 0 0 1 300 160"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="40"
            />

            {/* Zones colorées (optionnel) */}
            {showTarget && targetAngle !== null && (
              <>
                {/* Zone verte */}
                <path
                  d="M 20 160 A 140 140 0 0 1 300 160"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="30"
                  opacity="0.3"
                  strokeDasharray={`${30 * Math.PI * 140 / 180} ${300 * Math.PI * 140 / 180}`}
                  strokeDashoffset={-((targetAngle - 15) * Math.PI * 140 / 180)}
                />
              </>
            )}

            {/* Graduations */}
            {[0, 45, 90, 135, 180].map((deg) => {
              const radian = (deg * Math.PI) / 180;
              const x1 = 160 + Math.cos(Math.PI - radian) * 120;
              const y1 = 160 - Math.sin(Math.PI - radian) * 120;
              const x2 = 160 + Math.cos(Math.PI - radian) * 135;
              const y2 = 160 - Math.sin(Math.PI - radian) * 135;

              return (
                <line
                  key={deg}
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

        {/* Zones de scoring révélées */}
        {renderScoringZones()}

        {/* Aiguille */}
        <div
          className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-200"
          style={{
            width: '4px',
            height: '130px',
            background: disabled
              ? 'linear-gradient(to top, #6b7280, #9ca3af)'
              : 'linear-gradient(to top, #f59e0b, #fbbf24)',
            transform: `translateX(-50%) rotate(${needleRotation}deg)`,
            transformOrigin: 'bottom center',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
            pointerEvents: 'none'
          }}
        >
          {/* Poignée de l'aiguille */}
          <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 ${
            disabled ? 'bg-gray-400' : 'bg-gradient-to-br from-orange-400 to-orange-600'
          } rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
            !disabled && 'hover:scale-110 transition-transform cursor-grab active:cursor-grabbing'
          }`}>
            <div className="text-white text-xl">🎯</div>
          </div>
        </div>

        {/* Point central */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-800 rounded-full shadow-lg z-10"></div>
      </div>

      {/* Affichage de l'angle */}
      <div className="mt-6 text-center">
        <div className="bg-white rounded-lg shadow px-6 py-3 inline-block">
          <p className="text-sm text-gray-600 mb-1">Position actuelle</p>
          <p className="text-3xl font-bold text-orange-600">{angle}°</p>
        </div>

        {showTarget && targetAngle !== null && (
          <div className="mt-4 bg-red-50 rounded-lg shadow px-6 py-3 inline-block border-2 border-red-200">
            <p className="text-sm text-red-600 mb-1">🎯 Cible secrète</p>
            <p className="text-3xl font-bold text-red-600">{targetAngle}°</p>
            <p className="text-xs text-red-500 mt-1">
              Distance: {Math.abs(angle - targetAngle)}°
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dial;
