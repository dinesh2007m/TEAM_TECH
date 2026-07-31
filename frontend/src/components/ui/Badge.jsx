import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  glow = false,
  className,
}) => {
  const variants = {
    primary: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    secondary: 'bg-gray-800 text-gray-300 border-gray-700',
    success: 'bg-green-500/15 text-green-400 border-green-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30',
    critical: 'bg-red-600/25 text-red-300 border-red-500/50 font-bold uppercase tracking-wider',
    info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  const dotColors = {
    primary: 'bg-blue-400',
    secondary: 'bg-gray-400',
    success: 'bg-green-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    critical: 'bg-red-500 animate-ping',
    info: 'bg-cyan-400',
  };

  const glowStyles = glow ? 'shadow-[0_0_12px_rgba(59,130,246,0.35)]' : '';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-solid backdrop-blur-md select-none',
        variants[variant],
        sizes[size],
        glowStyles,
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  );
};
