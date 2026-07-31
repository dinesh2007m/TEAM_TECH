import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from './Badge';
import { cn } from '../../utils/cn';

export const PageHeader = ({
  title,
  subtitle,
  badgeText,
  badgeVariant = 'primary',
  actions,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-800/80', className)}
    >
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-heading">
            {title}
          </h1>
          {badgeText && (
            <Badge variant={badgeVariant} size="sm" glow>
              {badgeText}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-400 mt-1 font-sans">
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </motion.div>
  );
};
