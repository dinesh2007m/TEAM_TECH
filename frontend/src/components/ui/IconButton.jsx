import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const IconButton = React.forwardRef(
  (
    {
      icon: Icon,
      variant = 'secondary',
      size = 'md',
      badge = null,
      badgeColor = 'bg-blue-500',
      className,
      onClick,
      title,
      isDisabled = false,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'relative inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#030712] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40',
      secondary: 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white border border-gray-700/60 backdrop-blur-md',
      ghost: 'bg-transparent hover:bg-gray-800/60 text-gray-400 hover:text-white',
      outline: 'bg-transparent hover:bg-blue-500/10 text-gray-300 hover:text-blue-400 border border-gray-700 hover:border-blue-500/50',
    };

    const sizes = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? {} : { scale: 1.08 }}
        whileTap={isDisabled ? {} : { scale: 0.92 }}
        onClick={onClick}
        title={title}
        disabled={isDisabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {Icon && <Icon className={iconSizes[size]} />}
        
        {badge !== null && badge !== false && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white bg-red-500 ring-2 ring-[#030712] animate-pulse">
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </span>
        )}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';
