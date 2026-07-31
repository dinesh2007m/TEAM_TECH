import React, { useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

export const SimulationTimeline = ({ stages = [], currentStepIndex, onSelectStep }) => {
  const containerRef = useRef(null);

  // Auto-scroll to center active step on timeline
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentStepIndex]);

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-0 overflow-x-auto pb-4 pt-2 px-6 scrollbar-thin select-none max-w-full"
    >
      {stages.map((stage, idx) => {
        const isCompleted = idx < currentStepIndex;
        const isActive = idx === currentStepIndex;
        const isFuture = idx > currentStepIndex;

        return (
          <React.Fragment key={stage.id}>
            {/* Step Node */}
            <div
              onClick={() => onSelectStep(idx)}
              data-active={isActive ? 'true' : 'false'}
              className="flex flex-col items-center text-center cursor-pointer shrink-0 group w-28 relative"
            >
              {/* Pulsing indicator for active step */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-[10px] font-bold transition-all duration-300 relative',
                  isCompleted && 'bg-blue-950/40 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
                  isActive && 'bg-red-950/40 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]',
                  isFuture && 'bg-gray-900/60 border-gray-800 text-gray-500 group-hover:border-gray-700 group-hover:text-gray-400'
                )}
              >
                {isActive && (
                  <span className="absolute -inset-[2px] rounded-full border border-red-500 animate-ping opacity-60 pointer-events-none" />
                )}
                {stage.id}
              </div>

              {/* Labels */}
              <div className="mt-2.5 max-w-[100px]">
                <h5
                  className={cn(
                    'text-[10px] font-bold truncate transition-colors duration-200',
                    isCompleted && 'text-gray-300',
                    isActive && 'text-red-400',
                    isFuture && 'text-gray-600 group-hover:text-gray-400'
                  )}
                >
                  {stage.title}
                </h5>
                <span className="text-[8px] font-mono text-gray-500 block truncate mt-0.5">
                  {stage.mitreId || 'N/A'}
                </span>
              </div>
            </div>

            {/* Connecting Bridge Line */}
            {idx < stages.length - 1 && (
              <div className="w-10 h-[2px] bg-gray-800/80 self-center shrink-0 -mt-7 relative">
                {/* Flow glow overlay */}
                {isCompleted && (
                  <div className="absolute inset-0 bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                )}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-gray-800 animate-pulse" />
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
