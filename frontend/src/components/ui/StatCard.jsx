import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Card } from './Card';
import { Badge } from './Badge';
import { cn } from '../../utils/cn';

export const StatCard = ({
  title,
  value,
  status,
  change,
  trend = 'up',
  variant = 'primary',
  icon: iconName,
  subtitle,
  className,
}) => {
  const IconComponent = iconName && Icons[iconName] ? Icons[iconName] : Icons.ShieldAlert;

  const variantGlows = {
    danger: 'group-hover:border-red-500/50 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    warning: 'group-hover:border-amber-500/50 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    success: 'group-hover:border-green-500/50 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]',
    primary: 'group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]',
  };

  const iconBg = {
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    primary: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <Card
      hoverEffect={true}
      className={cn('group relative transition-all duration-300', variantGlows[variant], className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-bold font-mono text-gray-100 tracking-tight my-1">
            {value}
          </h3>
        </div>

        <div
          className={cn(
            'p-3 rounded-xl border backdrop-blur-md transition-transform duration-300 group-hover:scale-110',
            iconBg[variant]
          )}
        >
          <IconComponent className="w-6 h-6" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status && <Badge variant={variant} size="sm">{status}</Badge>}
          {change && (
            <span
              className={cn(
                'text-xs font-mono font-medium flex items-center gap-0.5',
                trend === 'up' && variant === 'danger' ? 'text-red-400' : 'text-green-400'
              )}
            >
              {change}
            </span>
          )}
        </div>

        {subtitle && <span className="text-[11px] text-gray-500 truncate max-w-[140px]">{subtitle}</span>}
      </div>
    </Card>
  );
};
