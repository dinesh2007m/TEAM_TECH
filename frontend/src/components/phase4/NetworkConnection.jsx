import React from 'react';
import { cn } from '../../utils/cn';

export const NetworkConnection = ({ connection, fromNode, toNode, trafficActive = true }) => {
  if (!fromNode || !toNode) return null;

  const typeThemes = {
    normal: {
      color: '#3B82F6', // Blue
      glowColor: 'rgba(59, 130, 246, 0.2)',
      strokeWidth: 2,
      dashArray: '5,5',
      dashClass: 'animate-normal-dash',
    },
    suspicious: {
      color: '#F59E0B', // Amber
      glowColor: 'rgba(245, 158, 11, 0.3)',
      strokeWidth: 2.5,
      dashArray: '6,4',
      dashClass: 'animate-suspicious-dash',
    },
    attack: {
      color: '#EF4444', // Red
      glowColor: 'rgba(239, 68, 68, 0.5)',
      strokeWidth: 3,
      dashArray: '8,4',
      dashClass: 'animate-attack-dash',
    },
    blocked: {
      color: '#374151', // Dark Gray
      glowColor: 'transparent',
      strokeWidth: 1.5,
      dashArray: '2,4',
      dashClass: '',
    },
  };

  const theme = typeThemes[connection.type] || typeThemes.normal;

  const x1 = fromNode.x;
  const y1 = fromNode.y;
  const x2 = toNode.x;
  const y2 = toNode.y;

  // Midpoint for placing blocked icon or labels
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Calculate angle for the connection text or indicators
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  return (
    <g className="select-none pointer-events-none">
      {/* Local animation style tag (scoped to SVG) */}
      <style>{`
        @keyframes flowDash {
          to {
            stroke-dashoffset: -40;
          }
        }
        .animate-normal-dash {
          animation: flowDash 2.5s linear infinite;
        }
        .animate-suspicious-dash {
          animation: flowDash 1.8s linear infinite;
        }
        .animate-attack-dash {
          animation: flowDash 1s linear infinite;
        }
      `}</style>

      {/* Neon Glow layer */}
      {connection.type !== 'blocked' && (
        <path
          d={`M ${x1} ${y1} L ${x2} ${y2}`}
          stroke={theme.glowColor}
          strokeWidth={theme.strokeWidth * 3}
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* Main Base Connection Line */}
      <path
        d={`M ${x1} ${y1} L ${x2} ${y2}`}
        stroke={theme.color}
        strokeWidth={theme.strokeWidth}
        strokeLinecap="round"
        fill="none"
        opacity={connection.type === 'blocked' ? 0.4 : 0.75}
      />

      {/* Animated Traffic overlay */}
      {trafficActive && connection.type !== 'blocked' && (
        <path
          d={`M ${x1} ${y1} L ${x2} ${y2}`}
          stroke={theme.color}
          strokeWidth={theme.strokeWidth}
          strokeDasharray={theme.dashArray}
          className={theme.dashClass}
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* Connection Label (Optional - when hovered or details toggle is active) */}
      {connection.label && connection.type !== 'blocked' && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x="-25"
            y="-7"
            width="50"
            height="14"
            rx="4"
            fill="#030712"
            stroke="#1F2937"
            strokeWidth="0.5"
            opacity="0.95"
          />
          <text
            fill="#9CA3AF"
            fontSize="7"
            fontFamily="monospace"
            textAnchor="middle"
            alignmentBaseline="middle"
            dy="1"
          >
            {connection.label}
          </text>
        </g>
      )}

      {/* Blocked indicator symbol */}
      {connection.type === 'blocked' && (
        <g transform={`translate(${midX}, ${midY})`}>
          <circle r="7" fill="#1F2937" stroke="#EF4444" strokeWidth="1" />
          <line x1="-3" y1="-3" x2="3" y2="3" stroke="#EF4444" strokeWidth="1.5" />
          <line x1="3" y1="-3" x2="-3" y2="3" stroke="#EF4444" strokeWidth="1.5" />
        </g>
      )}
    </g>
  );
};
