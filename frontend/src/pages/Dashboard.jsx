import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  UploadCloud,
  FileText,
  ArrowRight,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem } from '../utils/animations';

// ─── Dashboard-specific mock data ─────────────────────────────────────────────

const RECENT_REPORTS = [
  {
    id: 'REP-2026-081',
    filename: 'Q3_AWS_VPC_Threat_Graph_Audit',
    category: 'Ransomware & IAM Escalation',
    fileSize: '4.2 MB',
    time: 'Today at 13:45',
    risk: 'high',
  },
  {
    id: 'REP-2026-080',
    filename: 'Malware_Sandbox_Execution_EML',
    category: 'Spear Phishing XLSM Macro',
    fileSize: '2.8 MB',
    time: 'Today at 11:20',
    risk: 'medium',
  },
  {
    id: 'REP-2026-079',
    filename: 'K8s_Cluster_RBAC_Escape_Analysis',
    category: 'Container Privilege Abuse',
    fileSize: '5.1 MB',
    time: 'Yesterday at 18:30',
    risk: 'low',
  },
];

const RECENT_HISTORY = [
  {
    id: 1,
    status: 'Completed',
    title: 'Suspicious email uploaded',
    description: 'Invoice_Urgent_9941.eml',
    time: '14:02:12',
  },
  {
    id: 2,
    status: 'Active',
    title: 'Scan initiated',
    description: 'Environment setup completed',
    time: '14:02:18',
  },
  {
    id: 3,
    status: 'Running',
    title: 'Sandbox detonation started',
    description: 'Win11 Pro • Dynamic analysis',
    time: '14:02:25',
  },
  {
    id: 4,
    status: 'Threat Detected',
    title: 'Threat detected',
    description: 'Malicious VBA macro executed',
    time: '14:02:34',
  },
  {
    id: 5,
    status: 'Completed',
    title: 'Action taken',
    description: 'File quarantined & threat blocked',
    time: '14:02:40',
  },
];

const THREAT_TREND_DATA = [
  { time: '00:00', detected: 4, blocked: 2 },
  { time: '02:00', detected: 7, blocked: 5 },
  { time: '04:00', detected: 3, blocked: 2 },
  { time: '06:00', detected: 9, blocked: 7 },
  { time: '08:00', detected: 18, blocked: 14 },
  { time: '10:00', detected: 24, blocked: 19 },
  { time: '12:00', detected: 31, blocked: 26 },
  { time: '14:00', detected: 27, blocked: 22 },
  { time: '16:00', detected: 35, blocked: 30 },
  { time: '18:00', detected: 22, blocked: 18 },
  { time: '20:00', detected: 16, blocked: 13 },
  { time: '22:00', detected: 11, blocked: 9 },
  { time: '24:00', detected: 6, blocked: 5 },
];

// ─── Risk badge helper ─────────────────────────────────────────────────────────

const RISK_MAP = {
  high: { label: 'High Risk', variant: 'danger' },
  medium: { label: 'Medium Risk', variant: 'warning' },
  low: { label: 'Low Risk', variant: 'success' },
};

// ─── Timeline icon helper ──────────────────────────────────────────────────────

const TimelineIcon = ({ status }) => {
  const base = 'w-4 h-4';
  switch (status) {
    case 'Completed':
      return <CheckCircle2 className={`${base} text-green-400`} />;
    case 'Active':
      return <ShieldCheck className={`${base} text-blue-400`} />;
    case 'Running':
      return <Loader2 className={`${base} text-amber-400 animate-spin`} />;
    case 'Threat Detected':
      return <AlertTriangle className={`${base} text-red-400`} />;
    default:
      return <Clock className={`${base} text-gray-400`} />;
  }
};

const STATUS_DOT = {
  Completed: 'bg-green-500',
  Active: 'bg-blue-500',
  Running: 'bg-amber-500',
  'Threat Detected': 'bg-red-500',
};

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0D1322] border border-gray-700 rounded-lg p-3 text-xs font-sans shadow-xl">
        <p className="text-gray-400 font-mono mb-1.5">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 mb-0.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-300">{entry.name}:</span>
            <span className="font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main Dashboard component ──────────────────────────────────────────────────

export const Dashboard = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6 font-sans"
    >
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <PageHeader
        title="Security Operations Center"
        subtitle="Live Threat Telemetry, AI Analysis & Automated Remediation Engine"
        badgeText="REALTIME SOC"
        badgeVariant="primary"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={() =>
                addToast({
                  title: 'SOC Telemetry Refreshed',
                  description: 'All feeds updated to latest epoch.',
                  type: 'info',
                })
              }
            >
              Refresh Telemetry
            </Button>
            <Button
              variant="cyber"
              size="sm"
              leftIcon={Zap}
              glow
              onClick={() => navigate('/upload')}
            >
              Trigger AI Analysis
            </Button>
          </>
        }
      />

      {/* ── ROW 1: Three cards ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* ── 1. Upload Scan card ─────────────────────────────────────── */}
        <motion.div variants={staggerItem}>
          <Card className="h-full">
            <div className="flex flex-col items-center justify-center text-center gap-5 py-4">
              {/* Icon */}
              <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.12)]">
                <UploadCloud className="w-10 h-10 text-blue-400" />
              </div>

              {/* Title */}
              <div>
                <h2 className="text-lg font-bold text-white font-heading mb-1">
                  Upload Scan
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed max-w-[200px] mx-auto">
                  Go to Upload Scan page to upload and analyze files
                </p>
              </div>

              {/* CTA button */}
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="cyber"
                  size="md"
                  leftIcon={UploadCloud}
                  onClick={() => navigate('/upload')}
                >
                  Upload &amp; Scan
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* ── 2. Recent Reports card ──────────────────────────────────── */}
        <motion.div variants={staggerItem}>
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <h3 className="text-sm font-bold text-gray-100 font-heading">
                  Recent Reports
                </h3>
                <button
                  onClick={() => navigate('/reports')}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer"
                >
                  View All
                </button>
              </div>
            }
            footer={
              <button
                onClick={() => navigate('/reports')}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors group cursor-pointer w-full justify-center py-0.5"
              >
                View All Reports
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            }
            className="h-full"
          >
            <div className="space-y-3">
              {RECENT_REPORTS.map((rep, idx) => {
                const risk = RISK_MAP[rep.risk] || RISK_MAP.low;
                return (
                  <motion.div
                    key={rep.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.3 }}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-900/60 border border-gray-800/80 hover:border-gray-700 transition-all group"
                  >
                    {/* Icon */}
                    <div className="p-1.5 rounded-md bg-blue-500/10 shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-blue-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate leading-tight">
                        {rep.filename}
                      </p>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5 truncate">
                        {rep.category}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-mono text-gray-500">
                          {rep.fileSize}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">
                          •
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">
                          {rep.time}
                        </span>
                      </div>
                    </div>

                    {/* Risk badge */}
                    <Badge variant={risk.variant} size="sm" className="shrink-0 mt-0.5">
                      {risk.label}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* ── 3. Recent History card ──────────────────────────────────── */}
        <motion.div variants={staggerItem}>
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <h3 className="text-sm font-bold text-gray-100 font-heading">
                  Recent History
                </h3>
                <button
                  onClick={() => navigate('/history')}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer"
                >
                  View All
                </button>
              </div>
            }
            footer={
              <button
                onClick={() => navigate('/history')}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors group cursor-pointer w-full justify-center py-0.5"
              >
                View All History
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            }
            className="h-full"
          >
            {/* Vertical timeline */}
            <div className="relative pl-5">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/40 via-gray-700 to-transparent" />

              <div className="space-y-4">
                {RECENT_HISTORY.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.3 }}
                    className="relative flex items-start gap-3"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#111827] shrink-0 ${STATUS_DOT[event.status] || 'bg-gray-600'}`}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <TimelineIcon status={event.status} />
                        <p className="text-xs font-semibold text-gray-200 truncate">
                          {event.title}
                        </p>
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 truncate pl-6">
                        {event.description}
                      </p>
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] font-mono text-gray-500 shrink-0 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800 mt-0.5">
                      {event.time}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* ── ROW 2: Full-width Threat Trend Telemetry chart ─────────────── */}
      <motion.section variants={staggerItem}>
        <Card
          header={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <div>
                <h3 className="text-base font-bold text-gray-100 font-heading">
                  Threat Analysis – Threat Trend Telemetry (24h)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Real-time comparison of Detected vs Auto-Blocked threats
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* Time range selector */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono text-gray-300 cursor-default select-none">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  Last 24 Hours
                </div>
                {/* Live indicator */}
                <Badge variant="success" size="sm" dot>
                  Live
                </Badge>
              </div>
            </div>
          }
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={THREAT_TREND_DATA} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashDetectedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#4B5563"
                  tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#374151' }}
                />
                <YAxis
                  stroke="#4B5563"
                  tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '14px', fontFamily: 'sans-serif' }}
                  formatter={(value) => (
                    <span style={{ color: '#D1D5DB' }}>{value}</span>
                  )}
                />
                {/* Blue gradient area — Detected Threats */}
                <Area
                  type="monotone"
                  dataKey="detected"
                  name="Detected Threats"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dashDetectedGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#3B82F6', stroke: '#1E3A5F', strokeWidth: 2 }}
                />
                {/* Red line — Auto-Blocked Threats */}
                <Area
                  type="monotone"
                  dataKey="blocked"
                  name="Auto-Blocked Threats"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={0}
                  fill="none"
                  dot={false}
                  activeDot={{ r: 5, fill: '#EF4444', stroke: '#7F1D1D', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend description row */}
          <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-800/60">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <span className="text-xs text-gray-400 font-mono">Detected Threats</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <span className="text-xs text-gray-400 font-mono">Auto-Blocked Threats</span>
            </div>
          </div>
        </Card>
      </motion.section>
    </motion.div>
  );
};
