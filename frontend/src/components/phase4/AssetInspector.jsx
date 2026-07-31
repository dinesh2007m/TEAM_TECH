import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ShieldAlert, Monitor, User, Info, AlertTriangle, ShieldCheck,
  Network, EyeOff, Radio, Calendar, ArrowRight, Eye
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const AssetInspector = ({
  asset,
  onClose,
  onIsolate,
  onInvestigate,
  onViewAttackPaths,
  onViewDetails,
}) => {
  if (!asset) return null;

  const statusColors = {
    secure: 'success',
    warning: 'warning',
    compromised: 'danger',
    isolated: 'secondary',
    offline: 'secondary',
  };

  const isAssetIsolated = asset.status.toLowerCase() === 'isolated';

  return (
    <div className="w-full lg:w-96 shrink-0 h-full flex flex-col bg-[#0F172A]/90 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-gray-800/80 overflow-y-auto">
      {/* Header */}
      <div className="p-5 border-b border-gray-800/80 flex items-start justify-between bg-gray-900/40">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Monitor className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-gray-100 font-heading truncate max-w-[200px]">
              {asset.name}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
            {asset.type}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all cursor-pointer"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="p-6 space-y-6 flex-1">
        {/* Risk Score & Status */}
        <div className="flex items-center justify-between gap-4">
          <div className="p-3.5 rounded-xl bg-gray-950/50 border border-gray-800/60 text-center flex-1">
            <span className="text-[9px] uppercase font-mono text-gray-500 block mb-0.5">Risk Score</span>
            <span className={`text-2xl font-bold font-mono ${asset.riskScore > 75 ? 'text-red-400' : asset.riskScore > 40 ? 'text-amber-400' : 'text-green-400'}`}>
              {asset.riskScore}%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-950/50 border border-gray-800/60 text-center flex-1">
            <span className="text-[9px] uppercase font-mono text-gray-500 block mb-1">Status</span>
            <Badge variant={statusColors[asset.status.toLowerCase()] || 'primary'} size="sm">
              {asset.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Technical Metadata */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-gray-500 border-b border-gray-800/50 pb-1.5">
            System Metadata
          </h4>
          <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
            <div>
              <span className="text-gray-500 block text-[10px]">IP Address</span>
              <span className="font-mono text-gray-300 font-semibold">{asset.ip}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">Operating System</span>
              <span className="text-gray-300 font-semibold truncate block">{asset.os}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">Department Owner</span>
              <span className="text-gray-300 font-semibold block">{asset.department}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">Criticality</span>
              <span className="text-gray-300 font-semibold block">{asset.criticality}</span>
            </div>
          </div>
        </div>

        {/* Vulnerabilities Block */}
        <div>
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-gray-500 border-b border-gray-800/50 pb-1.5 mb-2.5">
            Vulnerability Profile
          </h4>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-950/20 border border-red-500/20">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-red-400">
                {asset.vulns} Active Vulnerabilities
              </div>
              <p className="text-[10px] text-gray-400">
                {asset.vulns > 0 ? 'Urgent patch remediation is required.' : 'No patch exclusions detected.'}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Events Timeline */}
        {asset.events && asset.events.length > 0 && (
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-gray-500 border-b border-gray-800/50 pb-1.5 mb-2.5">
              Recent Host Events
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {asset.events.map((evt, i) => (
                <div key={i} className="p-2 rounded bg-gray-950/60 border border-gray-800/40 text-[10px] leading-relaxed">
                  <div className="flex items-center gap-1.5 text-red-400 font-mono font-bold mb-0.5">
                    <span className="w-1 h-1 rounded-full bg-red-400 animate-ping" />
                    <span>SECURITY ALARM</span>
                  </div>
                  <p className="text-gray-300 font-sans">{evt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected Neighbors */}
        {asset.connectedAssets && asset.connectedAssets.length > 0 && (
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-gray-500 border-b border-gray-800/50 pb-1.5 mb-2">
              Connected Neighbors
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {asset.connectedAssets.map((c, i) => (
                <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20">
          <h5 className="text-[10px] font-mono uppercase tracking-wider text-blue-400 mb-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>AI Incident Playbook</span>
          </h5>
          <p className="text-xs text-gray-300 leading-relaxed font-sans">
            {asset.recommendedAction}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 border-t border-gray-800/80 bg-gray-900/60 space-y-2 mt-auto">
        <Button
          variant={isAssetIsolated ? 'outline' : 'danger'}
          size="sm"
          className="w-full font-bold text-xs"
          leftIcon={EyeOff}
          onClick={onIsolate}
        >
          {isAssetIsolated ? 'De-isolate Host (Restore)' : 'Isolate Asset (EDR Block)'}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="text-[11px] font-semibold"
            leftIcon={Radio}
            onClick={onInvestigate}
          >
            Investigate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-[11px] font-semibold text-blue-400"
            rightIcon={ArrowRight}
            onClick={onViewAttackPaths}
          >
            Attack Paths
          </Button>
        </div>
      </div>
    </div>
  );
};
