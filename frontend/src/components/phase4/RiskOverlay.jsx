import React from 'react';
import { ShieldAlert, Flame } from 'lucide-react';

export const RiskOverlay = () => {
  return (
    <div className="absolute bottom-4 left-4 p-4 rounded-xl bg-[#090D1A]/95 backdrop-blur-xl border border-gray-800/80 shadow-2xl z-10 w-60 select-none pointer-events-none">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-800/60">
        <Flame className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
        <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider font-heading">
          Risk Heatmap Overlay
        </h4>
      </div>

      <div className="space-y-2 text-[10px] font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-600 border border-red-500" />
            <span className="text-gray-400">Critical Risk</span>
          </div>
          <span className="text-red-400 font-bold">80 - 100%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-orange-600 border border-orange-500" />
            <span className="text-gray-400">High Risk</span>
          </div>
          <span className="text-orange-400 font-bold">60 - 79%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-600 border border-amber-500" />
            <span className="text-gray-400">Medium Risk</span>
          </div>
          <span className="text-amber-400 font-bold">40 - 59%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-600 border border-blue-500" />
            <span className="text-gray-400">Low Risk</span>
          </div>
          <span className="text-blue-400 font-bold">0 - 39%</span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-start gap-1.5 text-[9px] text-gray-500 leading-relaxed font-sans">
        <ShieldAlert className="w-3.5 h-3.5 text-red-500/60 shrink-0" />
        <span>
          Heatmap overlays show asset risk vulnerability vectors calculated from active MITRE techniques.
        </span>
      </div>
    </div>
  );
};
