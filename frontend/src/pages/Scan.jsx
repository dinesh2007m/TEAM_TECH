import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, CheckCircle2, AlertTriangle, Cpu, BarChart3,
  ChevronRight, Eye, Sparkles, Clock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ScanProgressPanel } from '../components/phase3/ScanProgressPanel';
import { SecurityConsole } from '../components/phase3/SecurityConsole';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Card } from '../components/ui/Card';
import scanData from '../data/scanStages.json';

const { stages } = scanData;

// Flatten all logs from all stages
const ALL_LOGS = stages.flatMap((s) => s.logs);

// Cumulative stage duration to know when to advance
const STAGE_DURATIONS = stages.map((s) => s.estimatedSeconds * 1000);

export const Scan = () => {
  const navigate = useNavigate();
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [logFlushIndex, setLogFlushIndex] = useState(0);
  const [autoNavigate, setAutoNavigate] = useState(false);

  const totalDuration = STAGE_DURATIONS.reduce((a, b) => a + b, 0);
  const elapsedPct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
  const remainingMs = Math.max(0, totalDuration - elapsed);
  const remainingSec = Math.ceil(remainingMs / 1000);

  // Drive stage progression
  useEffect(() => {
    if (isComplete) return;

    let cumulative = 0;
    for (let i = 0; i < currentStageIndex; i++) {
      cumulative += STAGE_DURATIONS[i];
    }

    if (currentStageIndex >= stages.length) {
      setIsComplete(true);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStageIndex((i) => i + 1);
    }, STAGE_DURATIONS[currentStageIndex]);

    return () => clearTimeout(timer);
  }, [currentStageIndex, isComplete]);

  // Elapsed timer
  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(() => setElapsed((e) => e + 200), 200);
    return () => clearInterval(id);
  }, [isComplete]);

  // Feed logs as stages advance
  useEffect(() => {
    const currentLogs = stages
      .slice(0, currentStageIndex + 1)
      .flatMap((s) => s.logs);

    if (currentLogs.length > displayedLogs.length) {
      const next = currentLogs[displayedLogs.length];
      if (next) {
        const t = setTimeout(() => {
          setDisplayedLogs((prev) => [...prev, next]);
        }, 300 + Math.random() * 400);
        return () => clearTimeout(t);
      }
    }
  }, [currentStageIndex, displayedLogs]);

  // Auto navigate after completion
  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => {
        setAutoNavigate(true);
        setTimeout(() => navigate('/threat-analysis'), 1800);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [isComplete, navigate]);

  const currentStage = stages[Math.min(currentStageIndex, stages.length - 1)];
  const completedCount = Math.min(currentStageIndex, stages.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider text-cyan-400 uppercase bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
              {isComplete ? 'Scan Complete' : 'Scanning in Progress'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            AI Threat Analysis Engine
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {isComplete
              ? 'Analysis complete. Review the full threat intelligence report.'
              : `Analyzing: Invoice_Q4_2024_Payroll.docm — Stage ${completedCount}/${stages.length}`}
          </p>
        </div>
        {!isComplete && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-blue-400"
            />
            <span className="text-xs font-semibold text-blue-400">AI Engine Active</span>
          </div>
        )}
      </div>

      {/* Overall Progress Card */}
      <Card className="relative overflow-hidden">
        {/* Animated scan line */}
        {!isComplete && (
          <motion.div
            className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent pointer-events-none"
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isComplete ? 'bg-green-500/20 border border-green-500/40' : 'bg-blue-500/20 border border-blue-500/40'
              }`}>
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Cpu className="w-5 h-5 text-blue-400" />
                  </motion.div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-200">
                  {isComplete ? 'Analysis Complete' : currentStage?.name || 'Initializing...'}
                </p>
                <p className="text-xs text-gray-500">
                  {isComplete
                    ? `All ${stages.length} stages completed`
                    : currentStage?.description || ''}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-white">{elapsedPct}%</p>
              <p className="text-xs text-gray-500 font-mono">
                {isComplete ? 'Complete' : `~${remainingSec}s remaining`}
              </p>
            </div>
          </div>

          <ProgressBar
            value={elapsedPct}
            max={100}
            variant={isComplete ? 'success' : 'primary'}
            showLabel={false}
            size="lg"
          />

          {/* Stage stats */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-800/50">
            <div className="text-center">
              <p className="text-lg font-bold font-mono text-green-400">{completedCount}</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">Completed</p>
            </div>
            <div className="text-center border-x border-gray-800/50">
              <p className="text-lg font-bold font-mono text-blue-400">{stages.length - completedCount}</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">Remaining</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-mono text-gray-300">{stages.length}</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">Total Stages</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content — Two Column */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Stage Progress — Left */}
        <div className="lg:col-span-3">
          <Card noPadding>
            <div className="px-5 py-4 border-b border-gray-800/60 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-gray-200">Scan Stages</span>
            </div>
            <div className="p-5">
              <ScanProgressPanel stages={stages} currentStage={currentStageIndex} />
            </div>
          </Card>
        </div>

        {/* Console — Right */}
        <div className="lg:col-span-2 space-y-4">
          <SecurityConsole
            logs={displayedLogs}
            isRunning={!isComplete}
          />

          {/* AI Status Card */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-gray-200">AegisX AI Status</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'YARA Signatures', value: '12,847 loaded', ok: true },
                { label: 'ML Model', value: 'ThreatBERT v4.2', ok: true },
                { label: 'TI Feeds', value: '7 sources active', ok: true },
                { label: 'MITRE Framework', value: 'v14.1 loaded', ok: true },
              ].map(({ label, value, ok }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{label}</span>
                  <span className={`font-mono font-semibold ${ok ? 'text-green-400' : 'text-red-400'}`}>{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Scan Complete State */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-green-500/30 bg-green-500/5 shadow-[0_0_40px_rgba(34,197,94,0.12)]"
          >
            <div className="h-1 bg-gradient-to-r from-green-600 via-emerald-400 to-green-600" />
            <div className="p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                className="w-20 h-20 rounded-2xl bg-green-500/15 border border-green-500/40 flex items-center justify-center shrink-0"
              >
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </motion.div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-green-300 mb-1">Scan Complete — Threat Detected</h2>
                <p className="text-sm text-gray-400 mb-4">
                  AegisX AI has completed full analysis. Critical threat identified with high confidence.
                </p>

                {/* Result Summary */}
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start mb-5">
                  <div className="text-center">
                    <p className="text-2xl font-bold font-mono text-red-400">87</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Risk Score</p>
                  </div>
                  <div className="border-l border-gray-700 pl-4 text-center">
                    <p className="text-2xl font-bold text-red-400">CRITICAL</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Threat Level</p>
                  </div>
                  <div className="border-l border-gray-700 pl-4 text-center">
                    <p className="text-2xl font-bold font-mono text-amber-400">94%</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">AI Confidence</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="cyber"
                    size="md"
                    leftIcon={Eye}
                    rightIcon={ChevronRight}
                    onClick={() => navigate('/threat-analysis')}
                    glow
                  >
                    View Threat Analysis
                  </Button>
                  {autoNavigate && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Clock className="w-3.5 h-3.5" />
                      </motion.div>
                      Auto-navigating...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
