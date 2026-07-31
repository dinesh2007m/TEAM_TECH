import React from 'react';
import { cn } from '../../utils/cn';

export const Divider = ({
  label,
  orientation = 'horizontal',
  className,
}) => {
  if (orientation === 'vertical') {
    return <div className={cn('w-[1px] h-full bg-gray-800 shrink-0 mx-2', className)} />;
  }

  return (
    <div className={cn('relative flex items-center w-full my-4', className)}>
      <div className="flex-grow border-t border-gray-800/80" />
      {label && (
        <span className="flex-shrink mx-4 text-xs font-mono text-gray-500 uppercase tracking-widest px-2 bg-[#030712]">
          {label}
        </span>
      )}
      <div className="flex-grow border-t border-gray-800/80" />
    </div>
  );
};
