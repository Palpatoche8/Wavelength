import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Wrapper pour score avec animation pulse et count-up
 */
function ScorePulse({ value, className = '' }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [shouldPulse, setShouldPulse] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      // Trigger pulse animation
      setShouldPulse(true);

      // Animate count-up
      const diff = value - prevValue;
      const duration = 500; // ms
      const steps = 20;
      const stepValue = diff / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.round(prevValue + stepValue * currentStep));
        }
      }, duration / steps);

      // Stop pulse after animation
      setTimeout(() => setShouldPulse(false), 600);

      setPrevValue(value);

      return () => clearInterval(interval);
    }
  }, [value, prevValue]);

  return (
    <motion.span
      className={className}
      animate={shouldPulse ? {
        scale: [1, 1.2, 1],
        color: ['#6366f1', '#10b981', '#6366f1']
      } : {}}
      transition={{ duration: 0.6 }}
    >
      {displayValue}
    </motion.span>
  );
}

export default ScorePulse;
