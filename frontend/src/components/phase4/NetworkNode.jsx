import React from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Mail, Shield, Lock, ShieldAlert, UserCheck, Key, Monitor,
  CreditCard, Users, Server, HardDrive, Database, Cloud, Terminal, Eye, AlertOctagon, CheckCircle2, ShieldOff
} from 'lucide-react';
import { cn } from '../../utils/cn';

const iconMap = {
  external: Globe,
  gateway: Mail,
  security: Shield,
  identity: Key,
  endpoint: Monitor,
  server: Server,
  cloud: Cloud,
};

const labelIconMap = {
  "VPN Gateway": Lock,
  "Web App Firewall": ShieldAlert,
  "Identity Provider": UserCheck,
  "Active Directory": Key,
  "Finance Workstations": CreditCard,
  "HR Workstations": Users,
  "File Server": HardDrive,
  "Database Server": Database,
  "SIEM Platform": Terminal,
  "SOC Monitoring": Eye,
};

export const NetworkNode = ({ node, onClick, isSelected, riskOverlayActive }) => {
  // Determine appropriate icon
  let IconComponent = iconMap[node.type] || Monitor;
  if (labelIconMap[node.label]) {
    IconComponent = labelIconMap[node.label];
  }

  const statusThemes = {
    secure: {
      border: 'border-green-500/50',
      bg: 'bg-green-950/20',
      glow: 'shadow-[0_0_12px_rgba(34,197,94,0.15)]',
      text: 'text-green-400',
      badgeBg: 'bg-green-500/10 text-green-400',
      pulse: false,
    },
    warning: {
      border: 'border-amber-500/50',
      bg: 'bg-amber-950/20',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]',
      text: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-400',
      pulse: false,
    },
    "high-risk": {
      border: 'border-red-500/50',
      bg: 'bg-red-950/20',
      glow: 'shadow-[0_0_15px_rgba(239,68,68,0.25)]',
      text: 'text-red-400',
      badgeBg: 'bg-red-500/10 text-red-400',
      pulse: false,
    },
    compromised: {
      border: 'border-red-600',
      bg: 'bg-red-950/40',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.45)]',
      text: 'text-red-300 font-bold',
      badgeBg: 'bg-red-600/20 text-red-300',
      pulse: true,
    },
    isolated: {
      border: 'border-gray-600/80 dashed',
      bg: 'bg-gray-900/60',
      glow: '',
      text: 'text-gray-500 line-through',
      badgeBg: 'bg-gray-800 text-gray-400',
      pulse: false,
    },
    offline: {
      border: 'border-gray-800',
      bg: 'bg-gray-950/80',
      glow: '',
      text: 'text-gray-600',
      badgeBg: 'bg-gray-950 text-gray-600',
      pulse: false,
    },
  };

  // Map data status to local node themes
  let statusKey = node.status.toLowerCase();
  if (node.status === "High Risk" || node.risk === "critical") {
    statusKey = "high-risk";
  }
  if (node.status === "compromised" || node.status === "Compromised") {
    statusKey = "compromised";
  }
  if (node.status === "isolated" || node.status === "Isolated") {
    statusKey = "isolated";
  }
  if (node.status === "offline" || node.status === "Offline") {
    statusKey = "offline";
  }

  const theme = statusThemes[statusKey] || statusThemes.secure;

  // Determine criticality display
  const critColor = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    moderate: 'text-amber-400',
    low: 'text-gray-400',
  }[node.criticality.toLowerCase()] || 'text-gray-400';

  const width = 160;
  const height = 80;

  return (
    <foreignObject
      x={node.x - width / 2}
      y={node.y - height / 2}
      width={width}
      height={height}
      className="overflow-visible select-none"
    >
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.05, y: -2 }}
        className={cn(
          'p-2.5 rounded-xl border backdrop-blur-xl transition-all duration-200 cursor-pointer flex flex-col justify-between text-left h-full group relative',
          isSelected ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-gray-800/80',
          theme.bg,
          theme.border,
          theme.glow
        )}
      >
        {/* Pulsing indicator background for compromised nodes */}
        {theme.pulse && (
          <div className="absolute -inset-[1px] rounded-xl bg-red-500/10 border border-red-500 animate-ping opacity-60 pointer-events-none" />
        )}

        {/* Top bar with icon and Criticality */}
        <div className="flex items-center justify-between">
          <div className={cn('p-1.5 rounded-lg border bg-gray-900/60 transition-transform duration-200 group-hover:scale-110', theme.border)}>
            <IconComponent className={cn('w-4 h-4', theme.text)} />
          </div>
          <span className={cn('text-[8px] font-mono tracking-widest uppercase font-bold', critColor)}>
            {node.criticality}
          </span>
        </div>

        {/* Node label and IP */}
        <div className="mt-1">
          <div className={cn('text-[11px] font-bold tracking-tight truncate', theme.text)}>
            {node.label}
          </div>
          <div className="text-[9px] font-mono text-gray-500 tracking-wider font-medium truncate">
            {node.ip}
          </div>
        </div>

        {/* Risk score heatmap highlight when risk overlay active */}
        {riskOverlayActive && (
          <div className={cn(
            "absolute -top-1 -right-1 flex items-center justify-center font-mono text-[9px] font-bold px-1 py-0.5 rounded border border-gray-700 shadow-md",
            node.risk === "critical" ? "bg-red-950 text-red-400 border-red-500/50" :
            node.risk === "high" ? "bg-orange-950/80 text-orange-400 border-orange-500/30" :
            node.risk === "moderate" ? "bg-amber-950/80 text-amber-400 border-amber-500/30" :
            "bg-blue-950/80 text-blue-400 border-blue-500/30"
          )}>
            {node.risk.toUpperCase()}
          </div>
        )}
      </motion.div>
    </foreignObject>
  );
};
