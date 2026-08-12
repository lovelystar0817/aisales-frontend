import { motion } from 'motion/react';

// Voice Waves Component
export const VoiceWaves = ({ volume }: { volume: number }) => (
  <div className="absolute -bottom-8 left-1/2 flex -translate-x-1/2 transform space-x-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <motion.div
        key={i}
        className="w-1 rounded-full bg-primary"
        animate={{
          height: Math.random() * 20 + 10,
          opacity: volume / 100,
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
        }}
      />
    ))}
  </div>
);
