import React from 'react';
import { motion } from 'framer-motion';
import { Building, Cloud, Globe, Calendar, AlertTriangle, ShieldCheck, Activity, ArrowRight, Network, Play } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

const iconMap = {
  Building: Building,
  Cloud: Cloud,
  Globe: Globe,
};

export const DigitalTwinCard = ({ env, onSelect, onViewTopology, onRunSimulation }) => {
  const IconComponent = iconMap[env.icon] || Building;

  const statusColors = {
    active: 'success',
    warning: 'warning',
    critical: 'danger',
  };

  const postureColors = {
    Good: 'text-green-400',
    Moderate: 'text-amber-400',
    'At Risk': 'text-red-400',
  };

  return (
    <Card hoverEffect={true} className="flex flex-col h-full bg-[#111827]/60 backdrop-blur-xl border border-gray-800/80">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100 font-heading">{env.name}</h3>
            <span className="text-xs font-mono text-gray-400">{env.type}</span>
          </div>
        </div>
        <Badge variant={statusColors[env.status] || 'primary'} size="sm" dot>
          {env.status.toUpperCase()}
        </Badge>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed mb-5 flex-grow">
        {env.description}
      </p>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 p-3 rounded-xl bg-gray-950/40 border border-gray-800/50">
        <div>
          <span className="text-[10px] uppercase font-mono text-gray-500 block">Total Assets</span>
          <span className="text-base font-bold font-mono text-gray-200">{env.totalAssets}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-gray-500 block">Critical Assets</span>
          <span className="text-base font-bold font-mono text-red-400">{env.criticalAssets}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-gray-500 block">Security Posture</span>
          <span className={`text-xs font-bold ${postureColors[env.securityPosture] || 'text-gray-300'}`}>
            {env.securityPosture}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-gray-500 block">Overall Risk</span>
          <span className={`text-base font-bold font-mono ${env.riskScore > 70 ? 'text-red-400' : env.riskScore > 50 ? 'text-amber-400' : 'text-green-400'}`}>
            {env.riskScore}%
          </span>
        </div>
      </div>

      {/* Sync Footer */}
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 mb-5 border-t border-gray-800/50 pt-3">
        <Activity className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
        <span>Last Synced: {new Date(env.lastSync).toLocaleString()}</span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5 mt-auto">
        <Button
          variant="cyber"
          size="sm"
          className="w-full text-xs font-bold"
          rightIcon={ArrowRight}
          onClick={() => onSelect(env.id)}
        >
          Open Digital Twin
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="text-[11px] font-semibold px-2 py-1.5"
            leftIcon={Network}
            onClick={() => onViewTopology(env.id)}
          >
            Topology
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-[11px] font-semibold px-2 py-1.5 hover:border-amber-500/30 text-amber-400"
            leftIcon={Play}
            onClick={() => onRunSimulation(env.id)}
          >
            Simulate
          </Button>
        </div>
      </div>
    </Card>
  );
};
