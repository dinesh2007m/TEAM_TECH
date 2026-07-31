import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Circle } from 'lucide-react';
import { cn } from '../../utils/cn';

const LOG_STYLES = {
  '[INFO]': { color: 'text-cyan-400', bullet: 'text-cyan-500' },
  '[WARNING]': { color: 'text-amber-400', bullet: 'text-amber-500' },
  '[ALERT]': { color: 'text-red-400', bullet: 'text-red-500' },
  '[SUCCESS]': { color: 'text-green-400', bullet: 'text-green-500' },
};

function getLogStyle(line) {
  for (const [key, style] of Object.entries(LOG_STYLES)) {
    if (line.startsWith(key)) return { ...style, key };
  }
  return { color: 'text-gray-400', bullet: 'text-gray-600', key: '' };
}

export const SecurityConsole = ({ logs = [], isRunning = true, className }) => {
  const bottomRef = useRef(null);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [logIndex, setLogIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && logIndex < logs.length) {
      intervalRef.current = setTimeout(() => {
        setDisplayedLogs((prev) => [...prev, logs[logIndex]]);
        setLogIndex((i) => i + 1);
      }, 350 + Math.random() * 250);
    }
    return () => clearTimeout(intervalRef.current);
  }, [isRunning, logIndex, logs]);

  // Reset when logs array changes
  useEffect(() => {
    setDisplayedLogs([]);
    setLogIndex(0);
  }, [logs.length]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedLogs]);

  const now = new Date();
  const ts = (offset = 0) =>
    new Date(now.getTime() + offset * 1000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);

  return (
    <div className={cn('glass-panel rounded-xl overflow-hidden border border-gray-800/60', className)}>
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/80 border-b border-gray-800/60">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-gray-300 font-mono">AegisX Security Console — Live Analysis Feed</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isRunning && logIndex < logs.length && (
            <motion.div
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-green-400"
            />
          )}
          <span className="text-[10px] font-mono text-gray-600">
            {displayedLogs.length}/{logs.length} events
          </span>
        </div>
      </div>

      {/* Console Output */}
      <div className="h-64 overflow-y-auto p-4 bg-[#050A0F]/80 font-mono text-xs space-y-1">
        {/* Static header */}
        <p className="text-gray-600 mb-2">
          AegisX Threat Intelligence Engine v4.2 — {ts()} UTC
        </p>
        <p className="text-gray-600 mb-3 border-b border-gray-800/50 pb-2">
          ══════════════ BEGIN ANALYSIS SESSION ══════════════
        </p>

        <AnimatePresence>
          {displayedLogs.map((line, i) => {
            const { color, bullet, key } = getLogStyle(line);
            const rest = key ? line.slice(key.length) : line;

            return (
              <motion.div
                key={`${i}-${line}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-2 leading-relaxed"
              >
                <span className={cn('shrink-0 text-[10px] mt-0.5', bullet)}>›</span>
                <span>
                  <span className="text-gray-600 mr-1.5">{ts(i * 0.4)}</span>
                  {key && (
                    <span className={cn('font-bold mr-1.5', color)}>{key}</span>
                  )}
                  <span className="text-gray-300">{rest}</span>
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Blinking cursor */}
        {isRunning && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="text-blue-400 font-mono"
          >
            █
          </motion.span>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
