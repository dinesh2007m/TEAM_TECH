import React from 'react';
import { cn } from '../../utils/cn';

export const LoadingSkeleton = ({
  variant = 'text',
  width,
  height,
  className,
  count = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-800/70 rounded border border-gray-700/30';

  const variants = {
    text: 'h-4 w-full rounded',
    title: 'h-7 w-2/3 rounded-lg',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-40 w-full rounded-xl',
    button: 'h-10 w-28 rounded-lg',
  };

  const renderSkeleton = (key) => (
    <div
      key={key}
      style={{ width, height }}
      className={cn(baseClasses, variants[variant], className)}
    />
  );

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => renderSkeleton(i))}
      </div>
    );
  }

  return renderSkeleton(0);
};
