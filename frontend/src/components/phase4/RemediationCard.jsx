import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ShieldCheck, Clock, User, HardDrive, ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export const RemediationCard = ({ item, onStatusChange }) => {
  const priorityVariants = {
    critical: 'critical',
    high: 'danger',
    medium: 'warning',
    low: 'secondary',
  };

  const statusVariants = {
    'Completed': 'success',
    'In Progress': 'primary',
    'Pending Approval': 'warning',
    'Not Started': 'secondary',
    'Deferred': 'info',
  };

  const statuses = [
    'Not Started',
    'In Progress',
    'Pending Approval',
    'Completed',
    'Deferred',
  ];

  return (
    <Card className={cn(
      'bg-[#111827]/40 border border-gray-800/80 hover:border-gray-700/80 transition-all duration-300',
      item.status === 'Completed' && 'border-green-500/20 bg-green-950/5'
    )}>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2">
            <Badge variant={priorityVariants[item.priority.toLowerCase()]} size="sm">
              {item.priority.toUpperCase()}
            </Badge>
            <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-cyan-400 border border-blue-500/20 px-2 py-0.5 rounded">
              {item.ownerTeam}
            </span>
          </div>

          {/* Status Switcher Selector */}
          <div className="relative shrink-0">
            <select
              value={item.status}
              onChange={(e) => onStatusChange(item.id, e.target.value)}
              className={cn(
                'bg-gray-950/80 text-xs font-semibold py-1 px-2.5 rounded-lg border focus:outline-none cursor-pointer',
                item.status === 'Completed' ? 'border-green-500/40 text-green-400' :
                item.status === 'In Progress' ? 'border-blue-500/40 text-blue-400' :
                item.status === 'Pending Approval' ? 'border-amber-500/40 text-amber-400' :
                'border-gray-800 text-gray-400'
              )}
            >
              {statuses.map((st) => (
                <option key={st} value={st} className="bg-gray-950 text-gray-300">
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="text-sm font-bold text-gray-200 hover:text-white transition-colors flex items-start gap-1">
            <span>{item.title}</span>
          </h4>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Telemetry Footer */}
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-6 pt-3 border-t border-gray-850 text-[10px] font-mono text-gray-500">
          <div className="flex items-center gap-1.5 py-0.5">
            <HardDrive className="w-3.5 h-3.5 text-cyan-500" />
            <span className="truncate max-w-[140px] text-gray-300" title={item.affectedAsset}>
              {item.affectedAsset}
            </span>
          </div>

          <div className="flex items-center gap-1.5 py-0.5">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>ETA: <span className="text-gray-300 font-semibold">{item.timeEstimate}</span></span>
          </div>

          <div className="flex items-center gap-1.5 py-0.5 sm:ml-auto col-span-2">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400 animate-pulse" />
            <span>Risk Reduc: <span className="text-green-400 font-bold">-{item.riskReduction}%</span></span>
          </div>
        </div>
      </div>
    </Card>
  );
};
