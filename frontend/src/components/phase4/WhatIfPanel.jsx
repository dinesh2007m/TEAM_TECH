import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { Card } from '../ui/Card';

export const WhatIfPanel = ({ scenarios = {}, activeScenarios = {}, onToggle }) => {
  return (
    <Card className="bg-[#111827]/60 backdrop-blur-xl border border-gray-800/80">
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-800/50">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-gray-200 font-heading">
              "What-If" Mitigation Sandbox
            </h3>
            <p className="text-[10px] text-gray-500">
              Simulate active network remediations to evaluate containment posture.
            </p>
          </div>
        </div>

        {/* Toggle scenarios */}
        <div className="space-y-3.5">
          {Object.entries(scenarios).map(([key, scenario]) => {
            const isActive = !!activeScenarios[key];

            return (
              <div
                key={key}
                onClick={() => onToggle(key)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer select-none ${
                  isActive
                    ? 'bg-blue-600/10 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.1)]'
                    : 'bg-gray-950/40 border-gray-800/60 hover:border-gray-700'
                }`}
              >
                <div className="flex-1 pr-4">
                  <span className={`text-xs font-bold transition-colors ${isActive ? 'text-blue-400' : 'text-gray-300'}`}>
                    {scenario.label}
                  </span>
                  <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono text-gray-500">
                    <span className="text-red-400 font-semibold">-{scenario.riskReduction}% Risk</span>
                    <span className="text-green-400 font-semibold">+{scenario.containmentBoost}% post.</span>
                    <span>-{scenario.affectedReduction} assets</span>
                  </div>
                </div>

                {/* Custom toggle slider */}
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${
                    isActive ? 'bg-blue-500' : 'bg-gray-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                      isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2 text-[10px] text-gray-400 leading-relaxed">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Remediation score calculations are compiled using local heuristics. Activating triggers will dynamically narrow down the attack blast radius.
          </span>
        </div>
      </div>
    </Card>
  );
};
