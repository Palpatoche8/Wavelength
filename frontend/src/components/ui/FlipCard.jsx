import { motion } from 'framer-motion';

/**
 * Carte avec animation de flip 3D
 * Affiche le front par défaut, flip vers le back quand isFlipped=true
 */
function FlipCard({ front, back, isFlipped, className = '' }) {
  return (
    <div className={`relative ${className}`} style={{ perspective: '1000px' }}>
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Face avant */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          {front}
        </div>

        {/* Face arrière */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}

export default FlipCard;
