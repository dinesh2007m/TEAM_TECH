import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className,
      glow = false,
      onClick,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#030712] disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const variants = {
      primary:
        'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500 border border-blue-500/40 shadow-lg shadow-blue-600/20',
      secondary:
        'bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 border border-gray-700/60 focus:ring-gray-500 backdrop-blur-md',
      danger:
        'bg-red-600/90 hover:bg-red-500 text-white focus:ring-red-500 border border-red-500/40 shadow-lg shadow-red-600/20',
      warning:
        'bg-amber-600/90 hover:bg-amber-500 text-white focus:ring-amber-500 border border-amber-500/40 shadow-lg shadow-amber-600/20',
      outline:
        'bg-transparent hover:bg-blue-500/10 text-blue-400 border border-blue-500/40 focus:ring-blue-500',
      ghost:
        'bg-transparent hover:bg-gray-800/60 text-gray-300 hover:text-white focus:ring-gray-600',
      cyber:
        'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold border border-cyan-400/40 shadow-lg shadow-cyan-500/25',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-2.5 gap-2.5',
    };

    const glowStyles = glow ? 'shadow-[0_0_20px_rgba(59,130,246,0.5)] border-blue-400' : '';

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={isDisabled || isLoading ? {} : { scale: 1.02 }}
        whileTap={isDisabled || isLoading ? {} : { scale: 0.97 }}
        disabled={isDisabled || isLoading}
        onClick={onClick}
        className={cn(baseStyles, variants[variant], sizes[size], glowStyles, className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : LeftIcon ? (
          <LeftIcon className="w-4 h-4 shrink-0" />
        ) : null}

        <span>{children}</span>

        {!isLoading && RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
