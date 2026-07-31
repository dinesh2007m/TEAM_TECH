import React from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Archive, FileText, Play, Terminal, KeyRound,
  Cookie, FolderOpen, Upload, ShieldCheck, AlertTriangle,
  Info, CheckCircle2, XCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';

const ICON_MAP = {
  Mail, Archive, FileText, Play, Terminal, KeyRound,
  Cookie, FolderOpen, Upload, ShieldCheck, AlertTriangle,
  Info, CheckCircle2, XCircle
};

const SEVERITY_CONFIG = {
  info: { border: 'border-blue-500/30', icon: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-500', glow: 'shadow-blue-500/20' },
  warning: { border: 'border-amber-500/30', icon: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-500', glow: 'shadow-amber-500/20' },
  high: { border: 'border-orange-500/30', icon: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-500', glow: 'shadow-orange-500/20' },
  critical: { border: 'border-red-500/30', icon: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-500', glow: 'shadow-red-500/20' },
  success: { border: 'border-green-500/30', icon: 'text-green-400', bg: 'bg-green-500/10', dot: 'bg-green-500', glow: 'shadow-green-500/20' },
};

const STATUS_BADGE = {
  confirmed: { color: 'text-red-400 bg-red-500/10 border-red-500/30', label: 'Confirmed' },
  predicted: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'Predicted' },
  blocked: { color: 'text-green-400 bg-green-500/10 border-green-500/30', label: 'Blocked' },
};

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export const AttackTimeline = ({ events = [], className }) => {
  return (
    <div className={cn('relative', className)}>
      {events.map((event, index) => {
        const sev = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
        const badge = STATUS_BADGE[event.status] || STATUS_BADGE.confirmed;
        const Icon = ICON_MAP[event.icon] || Info;
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="relative flex gap-4">
            {/* Vertical line */}
            {!isLast && (
              <div
                className="absolute left-[19px] top-10 bottom-0 w-px"
                style={{
                  background: 'linear-gradient(to bottom, rgba(59,130,246,0.3), rgba(59,130,246,0.05))',
                }}
              />
            )}

            {/* Timeline dot + icon */}
            <div className="relative shrink-0 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.08, type: 'spring', stiffness: 300 }}
                className={cn(
                  'w-10 h-10 rounded-xl border flex items-center justify-center shadow-md',
                  sev.bg, sev.border, sev.glow
                )}
              >
                <Icon className={cn('w-4.5 h-4.5', sev.icon)} />
              </motion.div>
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 + 0.05, duration: 0.35 }}
              whileHover={{ x: 4 }}
              className={cn(
                'flex-1 mb-4 p-4 rounded-xl border transition-all duration-200 cursor-default',
                'glass-panel hover:shadow-lg',
                sev.border,
                `hover:${sev.bg}`
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h4 className="text-sm font-bold text-gray-100">{event.event}</h4>
                <div className="flex items-center gap-2">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-semibold', badge.color)}>
                    {badge.label}
                  </span>
                  <span className="text-[10px] font-mono text-gray-600">{formatTime(event.timestamp)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{event.description}</p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};
