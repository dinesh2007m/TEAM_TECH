import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef(
  (
    {
      children,
      className,
      hoverEffect = true,
      glowOnHover = true,
      header,
      footer,
      noPadding = false,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        whileHover={
          hoverEffect
            ? {
                y: -3,
                boxShadow: glowOnHover
                  ? '0 0 25px rgba(59, 130, 246, 0.15), 0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  : '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
              }
            : {}
        }
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={onClick}
        className={cn(
          'glass-panel rounded-xl overflow-hidden relative border border-gray-800/80 bg-[#111827]/75 backdrop-blur-xl transition-colors duration-200',
          onClick && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {/* Subtle Cyber Highlight Edge */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent pointer-events-none" />

        {header && (
          <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between">
            {header}
          </div>
        )}

        <div className={cn(noPadding ? '' : 'p-6')}>{children}</div>

        {footer && (
          <div className="px-6 py-3 border-t border-gray-800/80 bg-gray-900/40 text-xs text-gray-400">
            {footer}
          </div>
        )}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
