import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Cpu } from 'lucide-react';
import { cn } from '../../utils/cn';

export const LoadingOverlay = ({
  message = 'Initializing AI Cyber Simulation Engine...',
  isFullPage = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 backdrop-blur-md rounded-xl z-30',
        isFullPage
          ? 'fixed inset-0 bg-[#030712]/90 z-50'
          : 'absolute inset-0 bg-[#111827]/85',
        className
      )}
    >
      <div className="relative flex items-center justify-center mb-6">
        {/* Pulsing Glow Rings */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-20 h-20 rounded-full border border-blue-500/40 bg-blue-500/10 glow-blue"
        />

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-2 border-dashed border-cyan-400/60 border-t-transparent"
        />

        <Shield className="absolute w-7 h-7 text-blue-400" />
      </div>

      <div className="flex items-center gap-2 mb-1">
        <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
          TeamTech Core Engine
        </span>
      </div>

      <p className="text-sm font-medium text-gray-300 font-mono text-center max-w-xs animate-pulse">
        {message}
      </p>
    </div>
  );
};
