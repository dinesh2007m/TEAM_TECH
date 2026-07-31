import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldX, Play, HelpCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export const AttackNode = ({ step, index, isActive, isSelected, onClick }) => {
  const riskColors = {
    critical: 'border-red-500/80 text-red-400 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
    high: 'border-orange-500/80 text-orange-400 bg-orange-950/20 shadow-[0_0_12px_rgba(249,115,22,0.15)]',
    medium: 'border-amber-500/80 text-amber-400 bg-amber-950/20',
  };

  const statusIcons = {
    confirmed: <ShieldAlert className="w-3.5 h-3.5 text-red-400" />,
    predicted: <HelpCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />,
    blocked: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
  };

  const statusBadges = {
    confirmed: 'bg-red-500/10 text-red-400 border-red-500/20',
    predicted: 'bg-amber-500/10 text-amber-400 border-amber-500/20 border-dashed animate-pulse',
    blocked: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      className={cn(
        'p-3.5 rounded-xl border backdrop-blur-xl transition-all duration-300 w-64 cursor-pointer text-left relative group select-none flex flex-col justify-between h-36',
        isSelected ? 'ring-2 ring-blue-500 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-gray-900/90' : 'border-gray-800/80 bg-[#111827]/75',
        isActive && !isSelected && 'shadow-[0_0_15px_rgba(239,68,68,0.25)] border-red-500/40 bg-red-950/5'
      )}
    >
      {/* Node Index Indicator */}
      <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-gray-900 border border-gray-800 text-[10px] font-mono font-bold flex items-center justify-center text-gray-400 shadow-md">
        {index + 1}
      </div>

      {/* Top stage name */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[9px] font-mono tracking-widest uppercase text-gray-500 font-bold">
          {step.stage}
        </span>
        <span className={cn('text-[9px] font-mono px-2 py-0.5 rounded border capitalize flex items-center gap-1 font-semibold', statusBadges[step.status])}>
          {statusIcons[step.status]}
          <span>{step.status}</span>
        </span>
      </div>

      {/* Body with asset & technique */}
      <div className="my-2">
        <h4 className="text-xs font-bold text-gray-200 truncate group-hover:text-white">
          {step.asset}
        </h4>
        <p className="text-[10px] text-gray-400 truncate mt-0.5 font-medium">
          {step.technique}
        </p>
      </div>

      {/* Footer with MITRE ID and Risk */}
      <div className="flex items-center justify-between border-t border-gray-800/50 pt-2 text-[10px] font-mono">
        <span className="text-cyan-400 font-semibold">{step.mitreId}</span>
        <span className={cn('px-1.5 py-0.5 rounded border text-[9px] uppercase font-bold tracking-wider', riskColors[step.risk] || 'border-gray-800 text-gray-400')}>
          {step.risk}
        </span>
      </div>
    </motion.div>
  );
};
