import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Clock, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

// stageStatus: 'pending' | 'active' | 'complete'
export const ScanProgressPanel = ({ stages = [], currentStage = 0, className }) => {
  const completed = stages.filter((_, i) => i < currentStage).length;
  const overall = Math.round((completed / stages.length) * 100);

  return (
    <div className={cn('space-y-3', className)}>
      {stages.map((stage, index) => {
        const status =
          index < currentStage ? 'complete' :
          index === currentStage ? 'active' : 'pending';

        return (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'relative flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-300',
              status === 'active'
                ? 'border-blue-500/50 bg-blue-500/8 shadow-[0_0_20px_rgba(59,130,246,0.12)]'
                : status === 'complete'
                ? 'border-green-500/20 bg-green-500/5'
                : 'border-gray-800/40 bg-gray-900/20 opacity-50'
            )}
          >
            {/* Step Number / Icon */}
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300',
              status === 'complete' ? 'bg-green-500/20 border border-green-500/40' :
              status === 'active' ? 'bg-blue-500/20 border border-blue-500/40' :
              'bg-gray-800/50 border border-gray-700/40'
            )}>
              {status === 'complete' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : status === 'active' ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              ) : (
                <span className="text-xs font-bold text-gray-600">{stage.id}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className={cn(
                  'text-sm font-semibold',
                  status === 'active' ? 'text-blue-300' :
                  status === 'complete' ? 'text-green-400' : 'text-gray-600'
                )}>
                  {stage.name}
                </h4>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 text-gray-600" />
                  <span className="text-[10px] font-mono text-gray-600">~{stage.estimatedSeconds}s</span>
                </div>
              </div>
              <p className={cn(
                'text-[11px] mt-0.5 leading-relaxed line-clamp-1',
                status === 'active' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {stage.description}
              </p>

              {/* Active stage progress bar */}
              {status === 'active' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 h-0.5 bg-gray-800 rounded-full overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: stage.estimatedSeconds, ease: 'linear' }}
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
