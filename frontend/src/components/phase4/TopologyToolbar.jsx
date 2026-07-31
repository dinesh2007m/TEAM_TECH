import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize, Tag, Activity, Flame, Expand } from 'lucide-react';
import { cn } from '../../utils/cn';

export const TopologyToolbar = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
  showLabels,
  onToggleLabels,
  showTraffic,
  onToggleTraffic,
  showRiskOverlay,
  onToggleRiskOverlay,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-[#0B0F19]/90 backdrop-blur-xl border border-gray-800/80 shadow-2xl relative z-10 w-fit select-none">
      {/* Zoom Controls */}
      <div className="flex items-center gap-1 border-r border-gray-800/80 pr-2">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors cursor-pointer outline-none"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-mono text-gray-500 min-w-[36px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors cursor-pointer outline-none"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={onReset}
          title="Reset Zoom"
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors cursor-pointer outline-none"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onFit}
          title="Fit Network"
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors cursor-pointer outline-none"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Visibility / Overlay Toggles */}
      <div className="flex items-center gap-1 border-r border-gray-800/80 pr-2">
        <button
          onClick={onToggleLabels}
          title="Toggle Labels"
          className={cn(
            'p-1.5 rounded-lg transition-colors cursor-pointer outline-none flex items-center gap-1',
            showLabels ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
          )}
        >
          <Tag className="w-4 h-4" />
          <span className="text-[10px] font-semibold hidden sm:inline">Labels</span>
        </button>

        <button
          onClick={onToggleTraffic}
          title="Toggle Traffic Lines"
          className={cn(
            'p-1.5 rounded-lg transition-colors cursor-pointer outline-none flex items-center gap-1',
            showTraffic ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
          )}
        >
          <Activity className="w-4 h-4" />
          <span className="text-[10px] font-semibold hidden sm:inline">Traffic</span>
        </button>

        <button
          onClick={onToggleRiskOverlay}
          title="Toggle Risk Overlays"
          className={cn(
            'p-1.5 rounded-lg transition-colors cursor-pointer outline-none flex items-center gap-1',
            showRiskOverlay ? 'text-amber-400 bg-amber-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
          )}
        >
          <Flame className="w-4 h-4" />
          <span className="text-[10px] font-semibold hidden sm:inline">Risk Heatmap</span>
        </button>
      </div>

      {/* Fullscreen UI */}
      <button
        onClick={onToggleFullscreen}
        title="Toggle Fullscreen UI"
        className={cn(
          'p-1.5 rounded-lg transition-colors cursor-pointer outline-none flex items-center gap-1',
          isFullscreen ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
        )}
      >
        <Expand className="w-4 h-4" />
        <span className="text-[10px] font-semibold hidden sm:inline">Fullscreen</span>
      </button>
    </div>
  );
};
