import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils/cn';

export const HashCard = ({ label, hash, variant = 'primary', className }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = hash;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const variantStyles = {
    primary: { accent: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5', label: 'text-blue-300' },
    cyan: { accent: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5', label: 'text-cyan-300' },
    violet: { accent: 'text-violet-400', border: 'border-violet-500/20', bg: 'bg-violet-500/5', label: 'text-violet-300' },
  };

  const s = variantStyles[variant] || variantStyles.primary;
  const truncated = hash.length > 20 ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : hash;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass-panel rounded-xl p-4 border transition-all duration-200',
        s.border,
        s.bg,
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-xs font-bold tracking-wider uppercase', s.label)}>{label}</span>
        <div className="flex gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            title={expanded ? 'Collapse' : 'Expand full hash'}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            className={cn(
              'p-1 rounded-md transition-colors cursor-pointer',
              copied ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            )}
            title="Copy hash"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </motion.button>
        </div>
      </div>

      <div className={cn('font-mono text-sm break-all transition-all duration-200', s.accent)}>
        {expanded ? hash : truncated}
      </div>

      {copied && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-[10px] text-green-400 mt-1"
        >
          Copied to clipboard
        </motion.p>
      )}
    </motion.div>
  );
};
