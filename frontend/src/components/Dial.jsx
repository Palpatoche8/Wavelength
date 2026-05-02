import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

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

  const valueToAngle = (val) => {
    return ((val - 1) / 19) * 180;
  };

  const angleToValue = (angle) => {
    const rawValue = (angle / 180) * 19 + 1;
    return Math.max(1, Math.min(20, Math.round(rawValue)));
  };

  const calculateAngle = (clientX, clientY) => {
    if (!dialRef.current) return valueToAngle(value);

    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.bottom;

    const deltaX = clientX - centerX;
    const deltaY = centerY - clientY;

    let angleRad = Math.atan2(deltaY, -deltaX);
    let angleDeg = angleRad * (180 / Math.PI);

    if (angleDeg < 0) angleDeg = 0;
    if (angleDeg > 180) angleDeg = 180;

    return angleDeg;
  };

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

  const needleRotation = valueToAngle(value) - 90;

  return (
    <div className="flex flex-col items-center">
      {/* Cadran avec effets */}
      <div className="relative">
        {/* Lueur de fond adoucie */}
        <div className="absolute inset-0 blur-2xl opacity-15">
          <div className="w-80 h-40 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"></div>
        </div>

        <div
          ref={dialRef}
          className={`relative w-80 h-40 ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Semi-cercle de base */}
          <div className="absolute inset-0">
            <svg width="100%" height="100%" viewBox="0 0 384 192">
              {/* Définitions pour les dégradés et filtres */}
              <defs>
                {/* Dégradé métallique */}
                <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#f3f4f6', stopOpacity: 1}} />
                  <stop offset="30%" style={{stopColor: '#e5e7eb', stopOpacity: 1}} />
                  <stop offset="50%" style={{stopColor: '#d1d5db', stopOpacity: 1}} />
                  <stop offset="70%" style={{stopColor: '#e5e7eb', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: '#f9fafb', stopOpacity: 1}} />
                </linearGradient>

                {/* Dégradé arc-en-ciel pour le fond (adouci) */}
                <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor: '#a78bfa', stopOpacity: 0.15}} />
                  <stop offset="25%" style={{stopColor: '#ec4899', stopOpacity: 0.15}} />
                  <stop offset="50%" style={{stopColor: '#f59e0b', stopOpacity: 0.15}} />
                  <stop offset="75%" style={{stopColor: '#10b981', stopOpacity: 0.15}} />
                  <stop offset="100%" style={{stopColor: '#3b82f6', stopOpacity: 0.15}} />
                </linearGradient>

                {/* Filtre pour ombre portée */}
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.3"/>
                </filter>
              </defs>

              {/* Arc extérieur (ombre) */}
              <path
                d="M 24 192 A 168 168 0 0 1 360 192"
                fill="none"
                stroke="#1f2937"
                strokeWidth="52"
                opacity="0.1"
              />

              {/* Arc arc-en-ciel de fond */}
              <path
                d="M 24 192 A 168 168 0 0 1 360 192"
                fill="none"
                stroke="url(#rainbowGrad)"
                strokeWidth="50"
              />

              {/* Arc métallique principal */}
              <path
                d="M 24 192 A 168 168 0 0 1 360 192"
                fill="none"
                stroke="url(#metalGrad)"
                strokeWidth="42"
                filter="url(#shadow)"
              />

              {/* Reflet brillant sur l'arc */}
              <path
                d="M 40 192 A 168 168 0 0 1 344 192"
                fill="none"
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="6"
                strokeLinecap="round"
              />

              {/* Zones colorées pour le psychique */}
              {showColoredZones && targetValue !== null && (
                <>
                  {/* Zone orange (±2) */}
                  {(() => {
                    const minVal = Math.max(1, targetValue - 2);
                    const maxVal = Math.min(20, targetValue + 2);
                    const startAngle = valueToAngle(minVal);
                    const endAngle = valueToAngle(maxVal);
                    const startRad = (Math.PI - (startAngle * Math.PI) / 180);
                    const endRad = (Math.PI - (endAngle * Math.PI) / 180);
                    const radius = 192;
                    const x1 = 192 + Math.cos(startRad) * radius;
                    const y1 = 192 - Math.sin(startRad) * radius;
                    const x2 = 192 + Math.cos(endRad) * radius;
                    const y2 = 192 - Math.sin(endRad) * radius;
                    const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

                    return (
                      <path
                        d={`M 192 192 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill="rgba(249, 115, 22, 0.65)"
                        stroke="rgba(249, 115, 22, 0.85)"
                        strokeWidth="3"
                      />
                    );
                  })()}

                  {/* Zone jaune (±1) */}
                  {(() => {
                    const minVal = Math.max(1, targetValue - 1);
                    const maxVal = Math.min(20, targetValue + 1);
                    const startAngle = valueToAngle(minVal);
                    const endAngle = valueToAngle(maxVal);
                    const startRad = (Math.PI - (startAngle * Math.PI) / 180);
                    const endRad = (Math.PI - (endAngle * Math.PI) / 180);
                    const radius = 192;
                    const x1 = 192 + Math.cos(startRad) * radius;
                    const y1 = 192 - Math.sin(startRad) * radius;
                    const x2 = 192 + Math.cos(endRad) * radius;
                    const y2 = 192 - Math.sin(endRad) * radius;
                    const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

                    return (
                      <path
                        d={`M 192 192 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill="rgba(234, 179, 8, 0.7)"
                        stroke="rgba(234, 179, 8, 0.9)"
                        strokeWidth="3"
                      />
                    );
                  })()}

                  {/* Zone verte (exacte) */}
                  {(() => {
                    const targetAngle = valueToAngle(targetValue);
                    const spreadAngle = 4;
                    const startAngle = Math.max(0, targetAngle - spreadAngle);
                    const endAngle = Math.min(180, targetAngle + spreadAngle);
                    const startRad = (Math.PI - (startAngle * Math.PI) / 180);
                    const endRad = (Math.PI - (endAngle * Math.PI) / 180);
                    const radius = 192;
                    const x1 = 192 + Math.cos(startRad) * radius;
                    const y1 = 192 - Math.sin(startRad) * radius;
                    const x2 = 192 + Math.cos(endRad) * radius;
                    const y2 = 192 - Math.sin(endRad) * radius;

                    return (
                      <path
                        d={`M 192 192 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                        fill="rgba(34, 197, 94, 0.8)"
                        stroke="rgba(34, 197, 94, 1)"
                        strokeWidth="3"
                      />
                    );
                  })()}
                </>
              )}

              {/* Ligne cible rouge révélée */}
              {showTarget && targetValue !== null && (
                <>
                  <line
                    x1="192"
                    y1="192"
                    x2={192 + Math.cos(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 168}
                    y2={192 - Math.sin(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 168}
                    stroke="#ef4444"
                    strokeWidth="8"
                    strokeLinecap="round"
                    filter="url(#shadow)"
                  />
                  <circle
                    cx={192 + Math.cos(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 168}
                    cy={192 - Math.sin(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 168}
                    r="14"
                    fill="#ef4444"
                    filter="url(#shadow)"
                  />
                  <circle
                    cx={192 + Math.cos(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 168}
                    cy={192 - Math.sin(Math.PI - (valueToAngle(targetValue) * Math.PI) / 180) * 168}
                    r="10"
                    fill="#fca5a5"
                  />
                </>
              )}

              {/* Markers principaux avec style amélioré */}
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
                      stroke="#1f2937"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <text
                      x={192 + Math.cos(radian) * 175}
                      y={192 - Math.sin(radian) * 175}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-base font-black fill-gray-800"
                      style={{textShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Petits markers */}
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
                      stroke="#6b7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.6"
                    />
                  );
                })}
            </svg>
          </div>

          {/* Aiguille avec effet métallique et lueur */}
          <motion.div
            className="absolute bottom-0 left-1/2 origin-bottom"
            style={{
              width: '8px',
              height: '125px',
              transform: `translateX(-50%) rotate(${needleRotation}deg)`,
              transformOrigin: 'bottom center',
              pointerEvents: 'none'
            }}
            animate={{
              filter: isDragging ? 'drop-shadow(0 0 12px rgba(139, 92, 246, 0.8))' : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
            }}
          >
            {/* Aiguille avec dégradé métallique */}
            <div
              className="w-full h-full rounded-full"
              style={{
                background: disabled
                  ? 'linear-gradient(to top, #4b5563, #6b7280, #9ca3af)'
                  : 'linear-gradient(to top, #3b82f6, #6366f1, #8b5cf6, #a78bfa)',
              }}
            />

            {/* Poignée de l'aiguille améliorée */}
            <motion.div
              className={`absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl ${
                disabled ? 'bg-gray-400 border-4 border-gray-500' : 'bg-gradient-to-br from-purple-400 via-purple-500 to-pink-500 border-4 border-white'
              } ${!disabled && 'cursor-grab active:cursor-grabbing'}`}
              whileHover={!disabled ? { scale: 1.15, rotate: 5 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              animate={{
                boxShadow: isDragging
                  ? '0 0 30px rgba(139, 92, 246, 0.8), 0 10px 25px rgba(0, 0, 0, 0.3)'
                  : '0 8px 20px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div className={`text-3xl font-black ${disabled ? 'text-white' : 'text-white drop-shadow-lg'}`}>
                {value}
              </div>
            </motion.div>

            {/* Reflet sur l'aiguille */}
            {!disabled && (
              <div
                className="absolute top-0 left-0 w-2 h-full rounded-full opacity-40"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)',
                }}
              />
            )}
          </motion.div>

        </div>
      </div>

      {/* Indicateur de valeur avec style */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-sm font-semibold text-white/80 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
          Positionnez le curseur entre 1 et 20
        </p>
      </motion.div>
    </div>
  );
}

export default Dial;
