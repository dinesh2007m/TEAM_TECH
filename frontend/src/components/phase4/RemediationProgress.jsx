import React from 'react';
import { ProgressBar } from '../ui/ProgressBar';
import { Card } from '../ui/Card';
import { ShieldCheck, Activity, Award, ShieldAlert } from 'lucide-react';

export const RemediationProgress = ({
  totalActions = 0,
  completedActions = 0,
  inProgressActions = 0,
  criticalHighRemaining = 0,
  estimatedRiskReduction = 0,
}) => {
  const completionPercentage = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  return (
    <Card className="bg-gradient-to-b from-[#111827]/80 to-blue-950/20 border border-gray-800/80 shadow-2xl">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-200 font-heading">
            Mitigation Playbook Deployment Status
          </h3>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
            ACTIVE POSTURE REMEDIATION INDEX
          </p>
        </div>

        {/* Progress bar */}
        <ProgressBar
          value={completedActions}
          max={totalActions}
          variant={completionPercentage > 75 ? 'success' : completionPercentage > 40 ? 'primary' : 'warning'}
          size="md"
          label="Containment Integration Rate"
        />

        {/* Info grids */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 pt-2">
          <div className="p-3 rounded-xl bg-gray-950/40 border border-gray-800/60 text-center">
            <span className="text-[9px] uppercase font-mono text-gray-500 block mb-0.5">Total Actions</span>
            <span className="text-xl font-bold font-mono text-gray-200">{totalActions}</span>
          </div>

          <div className="p-3 rounded-xl bg-gray-950/40 border border-gray-800/60 text-center">
            <span className="text-[9px] uppercase font-mono text-gray-500 block mb-0.5">Completed</span>
            <span className="text-xl font-bold font-mono text-green-400">{completedActions}</span>
          </div>

          <div className="p-3 rounded-xl bg-gray-950/40 border border-gray-800/60 text-center">
            <span className="text-[9px] uppercase font-mono text-gray-500 block mb-0.5">In Progress</span>
            <span className="text-xl font-bold font-mono text-blue-400">{inProgressActions}</span>
          </div>

          <div className="p-3 rounded-xl bg-gray-950/40 border border-gray-800/60 text-center">
            <span className="text-[9px] uppercase font-mono text-gray-500 block mb-0.5">Crit/High Left</span>
            <span className={`text-xl font-bold font-mono ${criticalHighRemaining > 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {criticalHighRemaining}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-gray-950/40 border border-gray-800/60 text-center col-span-2 md:col-span-1">
            <span className="text-[9px] uppercase font-mono text-gray-500 block mb-0.5">Risk Reduction</span>
            <span className="text-xl font-bold font-mono text-cyan-400">-{estimatedRiskReduction}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
