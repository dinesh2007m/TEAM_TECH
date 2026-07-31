import React from 'react';
import { cn } from '../../utils/cn';

export const AttackEdge = ({ status }) => {
  const edgeColors = {
    confirmed: {
      color: '#EF4444', // Red
      glow: 'rgba(239, 68, 68, 0.4)',
      dashClass: 'animate-attack-edge-flow',
    },
    predicted: {
      color: '#F59E0B', // Amber
      glow: 'rgba(245, 158, 11, 0.2)',
      dashClass: 'animate-predicted-edge-flow',
    },
    blocked: {
      color: '#10B981', // Green
      glow: 'rgba(16, 185, 129, 0.3)',
      dashClass: '',
    },
  };

  const theme = edgeColors[status] || edgeColors.confirmed;

  return (
    <div className="flex items-center justify-center shrink-0 w-10 select-none">
      <style>{`
        @keyframes edgeFlow {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-attack-edge-flow {
          animation: edgeFlow 1.2s linear infinite;
        }
        .animate-predicted-edge-flow {
          animation: edgeFlow 2s linear infinite;
        }
      `}</style>
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
        {/* Glow Path */}
        {status !== 'blocked' && (
          <path
            d="M 0 12 L 34 12"
            stroke={theme.glow}
            strokeWidth="6"
            strokeLinecap="round"
          />
        )}

        {/* Base Connection line */}
        <path
          d="M 0 12 L 36 12"
          stroke={theme.color}
          strokeWidth="2"
          strokeLinecap="round"
          opacity={status === 'blocked' ? 0.8 : 0.6}
        />

        {/* Animated Dashes overlay */}
        {status !== 'blocked' && (
          <path
            d="M 0 12 L 36 12"
            stroke={theme.color}
            strokeWidth="2"
            strokeDasharray="6,4"
            className={theme.dashClass}
            strokeLinecap="round"
          />
        )}

        {/* Arrowhead */}
        <polygon
          points="32,8 38,12 32,16"
          fill={theme.color}
          opacity={status === 'blocked' ? 0.9 : 1}
        />
      </svg>
    </div>
  );
};
