import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Chip = ({
  label,
  icon: Icon,
  onRemove,
  variant = 'default',
  className,
}) => {
  const variants = {
    default: 'bg-gray-800/90 text-gray-200 border-gray-700/80 hover:border-gray-600',
    primary: 'bg-blue-950/60 text-blue-300 border-blue-800/50 hover:border-blue-600',
    success: 'bg-green-950/60 text-green-300 border-green-800/50 hover:border-green-600',
    danger: 'bg-red-950/60 text-red-300 border-red-800/50 hover:border-red-600',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border backdrop-blur-sm transition-all',
        variants[variant],
        className
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0 text-current" />}
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 text-gray-400 hover:text-white focus:outline-none cursor-pointer rounded p-0.5 hover:bg-gray-700/50"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
