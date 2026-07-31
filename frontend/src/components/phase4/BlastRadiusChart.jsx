import React from 'react';
import { motion } from 'framer-motion';

export const BlastRadiusChart = ({ zones = [] }) => {
  const cx = 160;
  const cy = 160;

  // Outer to inner radii
  const radiiMap = {
    z4: 135,
    z3: 105,
    z2: 75,
    z1: 45,
  };

  const ringStyles = {
    z1: { stroke: 'rgba(239, 68, 68, 0.7)', fill: 'rgba(239, 68, 68, 0.15)', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' },
    z2: { stroke: 'rgba(249, 115, 22, 0.6)', fill: 'rgba(249, 115, 22, 0.08)', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]' },
    z3: { stroke: 'rgba(245, 158, 11, 0.5)', fill: 'rgba(245, 158, 11, 0.05)', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.1)]' },
    z4: { stroke: 'rgba(59, 130, 246, 0.4)', fill: 'rgba(59, 130, 246, 0.02)', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.1)]' },
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 relative select-none w-full max-w-[340px] mx-auto h-[340px]">
      <svg width="100%" height="100%" viewBox="0 0 320 320" className="overflow-visible">
        <defs>
          {/* Radial glows */}
          <radialGradient id="redGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Center Target Core */}
        <circle cx={cx} cy={cy} r="6" fill="#EF4444" className="animate-ping" />
        <circle cx={cx} cy={cy} r="3" fill="#EF4444" />

        {/* Outer to Inner Rings */}
        {zones.slice().reverse().map((zone) => {
          const radius = radiiMap[zone.id] || 45;
          const style = ringStyles[zone.id] || ringStyles.z4;

          return (
            <g key={zone.id}>
              {/* Outer boundary circle with spring animation when radii changes */}
              <motion.circle
                cx={cx}
                cy={cy}
                initial={{ r: 0 }}
                animate={{ r: radius }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                stroke={style.stroke}
                strokeWidth="1.5"
                strokeDasharray={zone.id === 'z4' ? '4,4' : 'none'}
                fill={style.fill}
                className="transition-colors duration-300"
              />

              {/* Text indicator overlay along the circle top boundary */}
              <motion.g
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Text showing asset count inside the rings */}
                <text
                  x={cx}
                  y={cy - radius + 14}
                  fill={zone.id === 'z1' ? '#EF4444' : zone.id === 'z2' ? '#F97316' : zone.id === 'z3' ? '#F59E0B' : '#60A5FA'}
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {zone.assets} ASSETS
                </text>
              </motion.g>
            </g>
          );
        })}

        {/* Concentric grid labels */}
        {zones.map((zone) => {
          const radius = radiiMap[zone.id] || 45;
          return (
            <g key={`lbl-${zone.id}`} transform={`translate(${cx + 10}, ${cy - radius + 3})`}>
              <text
                fill="#9CA3AF"
                fontSize="7"
                fontFamily="sans-serif"
                fontWeight="bold"
                className="uppercase tracking-wider"
              >
                {zone.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
