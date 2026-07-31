import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const ProgressBar = ({
  value = 0,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = true,
  label,
  className,
}) => {
  const percentage = Math.min(Math.max(0, Math.round((value / max) * 100)), 100);

  const barColors = {
    primary: 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]',
    success: 'bg-gradient-to-r from-green-600 to-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.5)]',
    warning: 'bg-gradient-to-r from-amber-600 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    danger: 'bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-mono">
          <span className="text-gray-400">{label || 'Scan Progress'}</span>
          <span className="text-gray-200 font-semibold">{percentage}%</span>
        </div>
      )}

      <div className={cn('w-full bg-gray-800/90 rounded-full overflow-hidden p-0.5 border border-gray-700/50', sizes[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn('h-full rounded-full transition-all duration-300', barColors[variant])}
        />
      </div>
    </div>
  );
};
