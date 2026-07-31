import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { IconButton } from './IconButton';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-xl',
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative w-full glass-panel bg-[#0F172A]/90 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-10',
              maxWidth,
              className
            )}
          >
            {/* Top Cyan/Blue Edge Accent */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600" />

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-800/80 flex items-start justify-between">
              <div>
                {title && (
                  <h2 className="text-xl font-bold text-gray-100 tracking-tight">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
                )}
              </div>
              <IconButton
                icon={X}
                variant="ghost"
                size="sm"
                onClick={onClose}
                title="Close modal"
              />
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-gray-800/80 bg-gray-900/50 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
