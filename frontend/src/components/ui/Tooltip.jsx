import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

export const Tooltip = ({
  content,
  children,
  position = 'top',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: '-top-10 left-1/2 -translate-x-1/2',
    bottom: '-bottom-10 left-1/2 -translate-x-1/2',
    left: 'top-1/2 -left-10 -translate-y-1/2 -translate-x-full',
    right: 'top-1/2 -right-10 -translate-y-1/2 translate-x-full',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 px-2.5 py-1 text-xs font-medium text-gray-200 bg-gray-900 border border-gray-700/80 rounded-md shadow-xl whitespace-nowrap pointer-events-none backdrop-blur-md font-mono',
              positions[position],
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
