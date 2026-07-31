import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const RISK_LEVELS = [
  { max: 25, label: 'Low', color: '#22C55E', trackColor: 'rgba(34, 197, 94, 0.15)', glowColor: 'rgba(34,197,94,0.6)' },
  { max: 50, label: 'Moderate', color: '#F59E0B', trackColor: 'rgba(245, 158, 11, 0.15)', glowColor: 'rgba(245,158,11,0.6)' },
  { max: 75, label: 'High', color: '#F97316', trackColor: 'rgba(249, 115, 22, 0.15)', glowColor: 'rgba(249,115,22,0.6)' },
  { max: 100, label: 'Critical', color: '#EF4444', trackColor: 'rgba(239, 68, 68, 0.15)', glowColor: 'rgba(239,68,68,0.6)' },
];

function getRiskLevel(score) {
  return RISK_LEVELS.find((r) => score <= r.max) || RISK_LEVELS[3];
}

export const RiskGauge = ({ score = 0, size = 180, className }) => {
  const risk = getRiskLevel(score);
  const radius = (size - 24) / 2;
  const circumference = Math.PI * radius; // semicircle
  const strokeWidth = 12;
  const cx = size / 2;
  const cy = size / 2 + 10;

  // Semicircle arc length fraction
  const filled = (score / 100) * circumference;
  const dashOffset = circumference - filled;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size * 0.6 + 30 }}>
        <svg
          width={size}
          height={size * 0.6 + 30}
          viewBox={`0 0 ${size} ${size * 0.6 + 30}`}
          style={{ overflow: 'visible' }}
        >
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2 + 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2 - 2} ${cy}`}
            fill="none"
            stroke="rgba(55,65,81,0.6)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Animated filled arc */}
          <motion.path
            d={`M ${strokeWidth / 2 + 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2 - 2} ${cy}`}
            fill="none"
            stroke={risk.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
            style={{
              filter: `drop-shadow(0 0 8px ${risk.glowColor})`,
            }}
          />

          {/* Score text */}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fill="white"
            fontSize="28"
            fontWeight="bold"
            fontFamily="'JetBrains Mono', monospace"
          >
            {score}
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            fill={risk.color}
            fontSize="11"
            fontWeight="600"
            fontFamily="'Space Grotesk', sans-serif"
            letterSpacing="1"
          >
            {risk.label.toUpperCase()}
          </text>

          {/* Labels */}
          <text x={strokeWidth / 2 + 2} y={cy + 22} textAnchor="middle" fill="#6B7280" fontSize="9" fontFamily="monospace">0</text>
          <text x={size - strokeWidth / 2 - 2} y={cy + 22} textAnchor="middle" fill="#6B7280" fontSize="9" fontFamily="monospace">100</text>
        </svg>
      </div>

      {/* Tick markers */}
      <div className="flex gap-1 mt-1">
        {RISK_LEVELS.map((lvl) => (
          <div
            key={lvl.label}
            className="text-[10px] px-2 py-0.5 rounded-full border font-semibold"
            style={{
              color: score <= lvl.max && score > (RISK_LEVELS[RISK_LEVELS.indexOf(lvl) - 1]?.max ?? -1) ? lvl.color : '#4B5563',
              borderColor: score <= lvl.max && score > (RISK_LEVELS[RISK_LEVELS.indexOf(lvl) - 1]?.max ?? -1) ? lvl.color : 'transparent',
              backgroundColor: score <= lvl.max && score > (RISK_LEVELS[RISK_LEVELS.indexOf(lvl) - 1]?.max ?? -1) ? `${lvl.color}15` : 'transparent',
            }}
          >
            {lvl.label}
          </div>
        ))}
      </div>
    </div>
  );
};
