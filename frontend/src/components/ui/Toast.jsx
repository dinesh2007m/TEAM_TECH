import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  };

  const borderColors = {
    success: 'border-green-500/40 shadow-green-500/10',
    error: 'border-red-500/40 shadow-red-500/10',
    warning: 'border-amber-500/40 shadow-amber-500/10',
    info: 'border-blue-500/40 shadow-blue-500/10',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'pointer-events-auto p-4 rounded-xl glass-panel bg-[#111827]/95 border shadow-xl flex items-start gap-3 relative overflow-hidden backdrop-blur-xl',
              borderColors[toast.type] || borderColors.info
            )}
          >
            {icons[toast.type] || icons.info}

            <div className="flex-1 pr-4">
              <h4 className="text-sm font-semibold text-gray-100">{toast.title}</h4>
              {toast.description && (
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
