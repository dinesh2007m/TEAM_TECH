import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Calendar, Clock, Terminal, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const AttackStageCard = ({ step }) => {
  if (!step) {
    return (
      <Card className="bg-[#111827]/40 border border-gray-800/80">
        <div className="flex flex-col items-center justify-center text-center p-8">
          <Terminal className="w-10 h-10 text-gray-600 mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-gray-400 font-heading">No Attack Stage Selected</h3>
          <p className="text-xs text-gray-500 max-w-xs mt-1">
            Click on any attack node in the timeline or graph path to analyze detailed forensics.
          </p>
        </div>
      </Card>
    );
  }

  const riskColors = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/30',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };

  const statusVariants = {
    confirmed: 'danger',
    predicted: 'warning',
    blocked: 'success',
  };

  return (
    <Card className="bg-[#111827]/60 backdrop-blur-xl border border-gray-800/80">
      <div className="space-y-4">
        {/* Title bar */}
        <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b border-gray-800/50">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
              Stage Analysis Profile
            </span>
            <h3 className="text-base font-bold text-gray-100 font-heading mt-0.5">
              {step.stage}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[step.status]} size="sm">
              {step.status.toUpperCase()}
            </Badge>
            <span className="text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
              {step.mitreId}
            </span>
          </div>
        </div>

        {/* Highlight Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-gray-950/40 border border-gray-800/50">
            <span className="text-[9px] uppercase font-mono text-gray-500 block mb-0.5">Target Asset</span>
            <span className="text-xs font-bold text-gray-200 block truncate">{step.asset}</span>
          </div>
          <div className="p-3 rounded-lg bg-gray-950/40 border border-gray-800/50">
            <span className="text-[9px] uppercase font-mono text-gray-500 block mb-0.5">Technique Name</span>
            <span className="text-xs font-bold text-gray-200 block truncate">{step.technique}</span>
          </div>
          <div className="p-3 rounded-lg bg-gray-950/40 border border-gray-800/50 col-span-2 sm:col-span-1">
            <span className="text-[9px] uppercase font-mono text-gray-500 block mb-0.5">Risk Level</span>
            <span className={`inline-block text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border mt-0.5 ${riskColors[step.risk]}`}>
              {step.risk.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Description Forensics */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
            Attack Execution Description
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed font-sans bg-gray-950/50 p-3 rounded-xl border border-gray-850">
            {step.description}
          </p>
        </div>

        {/* Diagnostics & Logs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-800/40 text-xs">
          <div className="space-y-1.5">
            <span className="text-gray-500 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-500" />
              <span>Forensic Timestamp</span>
            </span>
            <span className="font-mono text-gray-300 font-semibold block bg-gray-950/30 px-2.5 py-1.5 rounded-lg border border-gray-800/40">
              {new Date(step.timestamp).toLocaleString()} UTC
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="text-gray-500 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              <span>Recommended Containment</span>
            </span>
            <span className="text-gray-300 font-semibold block bg-gray-950/30 px-2.5 py-1.5 rounded-lg border border-gray-800/40 truncate">
              {step.status === 'blocked' ? 'Threat mitigated by boundary rule.' : 'EDR Host Isolation Plan.'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
