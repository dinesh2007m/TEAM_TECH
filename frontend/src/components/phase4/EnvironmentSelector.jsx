import React from 'react';
import { Building, Cloud, Globe } from 'lucide-react';
import { cn } from '../../utils/cn';

const iconMap = {
  Building: Building,
  Cloud: Cloud,
  Globe: Globe,
};

export const EnvironmentSelector = ({ environments = [], activeEnvId, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2.5 p-1 rounded-xl bg-gray-950/80 border border-gray-800/80 w-fit max-w-full">
      {environments.map((env) => {
        const IconComponent = iconMap[env.icon] || Building;
        const isActive = env.id === activeEnvId;

        return (
          <button
            key={env.id}
            onClick={() => onSelect(env.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider font-sans uppercase transition-all duration-300 relative cursor-pointer outline-none border border-transparent',
              isActive
                ? 'bg-blue-600/15 border-blue-500/40 text-blue-400 font-bold shadow-[inset_0_0_12px_rgba(59,130,246,0.15)] shadow-blue-500/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/60'
            )}
          >
            <IconComponent className={cn('w-4 h-4 shrink-0', isActive ? 'text-blue-400' : 'text-gray-500')} />
            <span>{env.name}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping absolute top-1 right-1" />
            )}
          </button>
        );
      })}
    </div>
  );
};
