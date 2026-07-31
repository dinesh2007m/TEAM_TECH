import React from 'react';
import { motion } from 'framer-motion';
import { AttackNode } from './AttackNode';
import { AttackEdge } from './AttackEdge';
import { HelpCircle, ShieldAlert, CheckCircle, Calendar, Clock, GitCommit } from 'lucide-react';
import { cn } from '../../utils/cn';

export const AttackPathGraph = ({
  steps = [],
  activeStepIndex = -1,
  selectedStepId = null,
  onSelectStep,
  mode = 'graph', // 'graph' or 'timeline'
}) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-gray-800 bg-[#111827]/40 rounded-2xl">
        <ShieldAlert className="w-12 h-12 text-gray-600 mb-3" />
        <h3 className="text-sm font-bold text-gray-400">No attack path loaded</h3>
      </div>
    );
  }

  if (mode === 'timeline') {
    return (
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-800/80">
        {steps.map((step, idx) => {
          const isSelected = step.id === selectedStepId;
          const isActive = idx === activeStepIndex;
          const isCompleted = activeStepIndex === -1 || idx <= activeStepIndex;

          const statusColors = {
            confirmed: 'bg-red-500/10 text-red-400 border-red-500/30',
            predicted: 'bg-amber-500/10 text-amber-400 border-amber-500/30 border-dashed animate-pulse',
            blocked: 'bg-green-500/10 text-green-400 border-green-500/30',
          };

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSelectStep(step)}
              className={cn(
                'relative p-4 rounded-xl border backdrop-blur-md transition-all duration-300 cursor-pointer select-none group',
                isSelected
                  ? 'bg-gray-900/90 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'bg-[#111827]/60 border-gray-850 hover:border-gray-700 hover:bg-[#111827]/80',
                isActive && !isSelected && 'border-red-500/40 bg-red-950/5'
              )}
            >
              {/* Timeline Indicator Ring */}
              <div
                className={cn(
                  'absolute -left-[23px] sm:-left-[27px] top-4 w-6 h-6 rounded-full border bg-[#030712] z-10 flex items-center justify-center transition-all duration-300',
                  step.status === 'blocked' && 'border-green-500 text-green-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
                  step.status === 'confirmed' && 'border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]',
                  step.status === 'predicted' && 'border-amber-500 text-amber-400 animate-pulse'
                )}
              >
                <span className="text-[10px] font-mono font-bold">{idx + 1}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 font-bold">
                    {step.stage}
                  </span>
                  <span className={cn('text-[9px] font-mono px-2 py-0.5 rounded border capitalize font-semibold', statusColors[step.status])}>
                    {step.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500">
                  <span className="text-cyan-400">{step.mitreId}</span>
                  <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="mt-2">
                <h4 className="text-sm font-bold text-gray-200 group-hover:text-white">
                  {step.asset}
                </h4>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {step.description}
                </p>
              </div>

              {/* Progress Connector Indicator */}
              {isActive && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  <span>ACTIVE POINT</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto py-6 px-4 scrollbar-thin select-none">
      <div className="flex items-center gap-0 w-max min-w-full">
        {steps.map((step, idx) => {
          const isSelected = step.id === selectedStepId;
          const isActive = idx === activeStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Attack Path Node */}
              <AttackNode
                step={step}
                index={idx}
                isActive={isActive}
                isSelected={isSelected}
                onClick={() => onSelectStep(step)}
              />

              {/* Connecting Edge Arrow */}
              {idx < steps.length - 1 && (
                <AttackEdge
                  status={
                    step.status === 'blocked'
                      ? 'blocked'
                      : steps[idx + 1].status === 'predicted'
                      ? 'predicted'
                      : 'confirmed'
                  }
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
