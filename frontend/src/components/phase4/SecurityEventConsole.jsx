import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, EyeOff, Search, Play, Pause, Trash2, SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

const LOG_THEMES = {
  info: { color: 'text-cyan-400', label: 'INFO', bullet: 'text-cyan-500 bg-cyan-500/10' },
  warning: { color: 'text-amber-400', label: 'WARN', bullet: 'text-amber-500 bg-amber-500/10' },
  high: { color: 'text-orange-500', label: 'HIGH', bullet: 'text-orange-500 bg-orange-500/10' },
  critical: { color: 'text-red-500 font-bold uppercase', label: 'CRIT', bullet: 'text-red-500 bg-red-500/10 border-red-500/20' },
  success: { color: 'text-green-400', label: 'SUCC', bullet: 'text-green-500 bg-green-500/10' },
};

export const SecurityEventConsole = ({ logs = [], currentStepIndex, isSimulationActive }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isConsolePaused, setIsConsolePaused] = useState(false);
  const [clearedLogsCount, setClearedLogsCount] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  const consoleEndRef = useRef(null);

  // Auto-scroll when new logs arrive
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, autoScroll]);

  // Determine displayed logs based on current simulation progress (step 0 to currentStepIndex)
  // and check if console is paused or cleared.
  const activeStepLogs = logs.slice(clearedLogsCount);

  const filteredLogs = activeStepLogs.filter((log) => {
    // Search query matches message, asset or technique
    const matchesSearch =
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.asset.toLowerCase().includes(search.toLowerCase()) ||
      (log.technique && log.technique.toLowerCase().includes(search.toLowerCase()));

    // Severity level filter
    const matchesFilter =
      filter === 'all' ||
      (filter === 'critical' && (log.severity === 'critical' || log.severity === 'high')) ||
      (filter === 'warning' && log.severity === 'warning') ||
      (filter === 'info' && log.severity === 'info') ||
      (filter === 'success' && log.severity === 'success');

    return matchesSearch && matchesFilter;
  });

  const handleClearConsole = () => {
    setClearedLogsCount(logs.length);
  };

  const handleResetConsole = () => {
    setClearedLogsCount(0);
  };

  return (
    <div className="glass-panel bg-[#030712]/90 rounded-xl overflow-hidden border border-gray-800/80 shadow-2xl flex flex-col h-[400px]">
      {/* Console Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-950/80 border-b border-gray-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-gray-300">
              AegisX Endpoint & Cloud Log Monitor
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSimulationActive && !isConsolePaused && (
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
          <span className="text-[10px] font-mono text-gray-500">
            {filteredLogs.length} events logged
          </span>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="p-3 bg-gray-950/40 border-b border-gray-800/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Search */}
        <div className="relative w-full sm:w-48">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Filter logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-950 border border-gray-850 rounded-lg pl-8 pr-3 py-1 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono"
          />
        </div>

        {/* Severity Filter pills */}
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500 shrink-0 mr-1" />
          {['all', 'critical', 'warning', 'info', 'success'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={cn(
                'px-2 py-0.5 text-[9px] font-mono font-bold rounded capitalize cursor-pointer transition-colors border',
                filter === lvl
                  ? 'bg-blue-600/15 border-blue-500/40 text-blue-400 font-bold'
                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
              )}
            >
              {lvl === 'critical' ? 'Crit/High' : lvl}
            </button>
          ))}
        </div>

        {/* Console Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {clearedLogsCount > 0 && (
            <button
              onClick={handleResetConsole}
              className="px-2 py-1 text-[9px] font-mono text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:bg-blue-500/5 rounded cursor-pointer"
            >
              Restore ({clearedLogsCount})
            </button>
          )}
          <button
            onClick={() => setIsConsolePaused(!isConsolePaused)}
            title={isConsolePaused ? 'Resume Logging Feed' : 'Pause Logging Feed'}
            className={cn(
              'p-1.5 rounded border cursor-pointer hover:bg-gray-800 transition-colors',
              isConsolePaused ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' : 'text-gray-400 border-gray-800'
            )}
          >
            {isConsolePaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleClearConsole}
            title="Clear Console"
            className="p-1.5 rounded border border-gray-800 text-gray-400 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <label className="flex items-center gap-1 text-[10px] font-mono text-gray-500 cursor-pointer ml-1 select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-gray-950 border-gray-800 text-blue-500 focus:ring-0 w-3 h-3"
            />
            <span>Scroll</span>
          </label>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 p-4 bg-[#050914] overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 scrollbar-thin">
        {/* Terminal Header */}
        <div className="text-gray-600 mb-2 border-b border-gray-850 pb-2 flex justify-between items-center text-[10px]">
          <span>AEGISX THREAT INTELLIGENCE AGENT v4.2.14</span>
          <span>SESSION FEED STABLE</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-48 text-gray-600 font-sans">
            <EyeOff className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">Console is empty</p>
            <p className="text-[10px] mt-0.5">No log entries matching active filters.</p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {filteredLogs.map((log, idx) => {
                const theme = LOG_THEMES[log.severity] || LOG_THEMES.info;
                return (
                  <motion.div
                    key={`${idx}-${log.timestamp}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start gap-2.5 py-0.5 border-b border-gray-950/20 hover:bg-gray-950/40 px-1 rounded transition-colors"
                  >
                    <span className="text-cyan-600 shrink-0 font-bold select-none">›</span>
                    <span className="text-gray-500 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={cn('px-1.5 py-0.25 text-[8px] font-bold rounded shrink-0 border select-none w-10 text-center font-mono', theme.bullet, theme.color)}>
                      {theme.label}
                    </span>
                    <div className="flex-1 font-mono text-gray-300">
                      <span className="text-cyan-500 font-bold mr-1.5">[{log.asset}]</span>
                      {log.message}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <div ref={consoleEndRef} />
      </div>
    </div>
  );
};
