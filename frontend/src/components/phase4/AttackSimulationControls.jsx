import React from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, FastForward } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export const AttackSimulationControls = ({
  isPlaying,
  onStartPause,
  onRestart,
  onStepForward,
  onStepBack,
  speed,
  onSpeedChange,
  currentStep,
  totalSteps,
}) => {
  const speeds = [0.5, 1, 2, 4];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#0F172A]/70 backdrop-blur-xl border border-gray-800/80 shadow-lg select-none">
      {/* Simulation Playback Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="p-2 shrink-0 cursor-pointer"
          onClick={onStepBack}
          isDisabled={currentStep <= 0}
          title="Step Backward"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          variant={isPlaying ? 'warning' : 'cyber'}
          size="sm"
          className="px-5 font-bold tracking-wider uppercase text-xs"
          leftIcon={isPlaying ? Pause : Play}
          onClick={onStartPause}
        >
          {isPlaying ? 'Pause' : 'Start'}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="p-2 shrink-0 cursor-pointer"
          onClick={onStepForward}
          isDisabled={currentStep >= totalSteps - 1}
          title="Step Forward"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="p-2 shrink-0 cursor-pointer hover:border-red-500/30 text-gray-400 hover:text-red-400"
          onClick={onRestart}
          title="Restart Simulation"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Step Counters Info */}
      <div className="text-xs font-mono text-gray-400">
        Stage: <span className="text-cyan-400 font-bold">{currentStep + 1}</span> / {totalSteps}
      </div>

      {/* Speed Selector dials */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-gray-950/80 border border-gray-800/50">
        <span className="text-[10px] font-mono text-gray-500 uppercase px-2 font-bold">Speed</span>
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={cn(
              'px-2.5 py-1 text-[10px] font-mono font-bold rounded cursor-pointer transition-all duration-200 border border-transparent',
              speed === s
                ? 'bg-blue-600/15 border-blue-500/40 text-blue-400 font-bold'
                : 'text-gray-400 hover:text-gray-200'
            )}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
};
