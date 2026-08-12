import { motion } from 'framer-motion';
import clsx from 'clsx';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  position: 'left' | 'right';
  className?: string;
}

export function FloatingActionButton({
  onClick,
  icon,
  label,
  position,
  className,
}: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={clsx(
        'fixed z-40 flex items-center gap-3 rounded-full bg-white shadow-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-xl transition-all duration-200',
        position === 'left' ? 'left-4' : 'right-4',
        'top-1/2 -translate-y-1/2',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: position === 'left' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-center w-5 h-5">
        {icon}
      </div>
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
} 