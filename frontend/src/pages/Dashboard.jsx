import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ShieldAlert,
  ShieldX,
  ExternalLink,
  Activity,
  FileCode,
  Search,
} from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem } from '../utils/animations';
import { listHistory } from '../services/apiService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_MAP = {
  High: { label: 'High Risk', variant: 'danger', icon: ShieldX, text: 'text-red-400' },
  Medium: { label: 'Medium Risk', variant: 'warning', icon: ShieldAlert, text: 'text-amber-400' },
  Low: { label: 'Low Risk', variant: 'info', icon: ShieldCheck, text: 'text-blue-400' },
  Safe: { label: 'Safe', variant: 'success', icon: ShieldCheck, text: 'text-green-400' },
};

function riskCfg(level) {
  return RISK_MAP[level] ?? RISK_MAP.Low;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatTimeOnly(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function truncate(str, max = 35) {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// ─── Timeline icon & dot helper ───────────────────────────────────────────────

const TimelineIcon = ({ status }) => {
  const base = 'w-3.5 h-3.5';
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

  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Load dashboard data from FastAPI backend SQLite ─────────────────────────
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listHistory({ page: 1, page_size: 50 });
      setScans(data.scans || []);
    } catch (e) {
      setError(e.message);
      addToast({
        title: 'Failed to refresh telemetry',
        description: e.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ── Derived Recent Reports (Newest 3 scans) ──────────────────────────────────
  const recentReports = useMemo(() => {
    return scans.slice(0, 3);
  }, [scans]);

  // ── Derived Recent History Timeline Events ───────────────────────────────────
  const recentHistoryEvents = useMemo(() => {
    if (scans.length === 0) return [];

    const events = [];
    // Process the top 3 newest scans to generate chronological activity timeline events
    scans.slice(0, 3).forEach((scan, scanIdx) => {
      const timeStr = formatTimeOnly(scan.created_at);
      const dateStr = formatDate(scan.created_at);

      // Event 1: Email Uploaded
      events.push({
        id: `${scan.scan_id}-upload`,
        status: 'Completed',
        title: 'Email Uploaded & Queued',
        description: `${truncate(scan.subject || 'Email Scan', 28)} (From: ${truncate(scan.sender, 22)})`,
        time: timeStr,
        rawTime: new Date(scan.created_at).getTime() + (scanIdx * 10),
      });

      // Event 2: Email Parsed
      events.push({
        id: `${scan.scan_id}-parse`,
        status: 'Completed',
        title: 'Email Parsed',
        description: 'MIME headers & body content extracted',
        time: timeStr,
        rawTime: new Date(scan.created_at).getTime() + (scanIdx * 10) + 1,
      });

      // Event 3: Phishing Analysis Completed
      events.push({
        id: `${scan.scan_id}-phishing`,
        status: 'Completed',
        title: 'Phishing Analysis Completed',
        description: `${scan.indicator_count ?? 0} threat indicator(s) evaluated`,
        time: timeStr,
        rawTime: new Date(scan.created_at).getTime() + (scanIdx * 10) + 2,
      });

      // Event 4: Sandbox Analysis (if attachments exist)
      if (scan.attachment_count > 0) {
        events.push({
          id: `${scan.scan_id}-sandbox`,
          status: 'Completed',
          title: 'Sandbox Analysis Completed',
          description: `${scan.attachment_count} attachment(s) inspected`,
          time: timeStr,
          rawTime: new Date(scan.created_at).getTime() + (scanIdx * 10) + 3,
        });
      }

      // Event 5: Risk Score Generated
      events.push({
        id: `${scan.scan_id}-risk`,
        status: scan.risk_level === 'High' ? 'Threat Detected' : 'Active',
        title: scan.risk_level === 'High' ? 'High Threat Detected' : 'Risk Score Generated',
        description: `Risk Level: ${scan.risk_level} (${scan.risk_score}/100)`,
        time: timeStr,
        rawTime: new Date(scan.created_at).getTime() + (scanIdx * 10) + 4,
      });

      // Event 6: Report Created
      events.push({
        id: `${scan.scan_id}-report`,
        status: 'Completed',
        title: 'Report Created',
        description: `Scan ID: ${scan.scan_id.slice(0, 13)}…`,
        time: timeStr,
        rawTime: new Date(scan.created_at).getTime() + (scanIdx * 10) + 5,
      });
    });

    // Return top 5 newest events
    return events.sort((a, b) => b.rawTime - a.rawTime).slice(0, 5);
  }, [scans]);

  // ── Derived 24h Threat Trend Telemetry Chart Data ─────────────────────────────
  const trendChartData = useMemo(() => {
    const timeSlots = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];

    if (scans.length === 0) {
      return timeSlots.map((time) => ({ time, detected: 0, blocked: 0 }));
    }

    const slotCounts = timeSlots.map((time) => ({ time, detected: 0, blocked: 0 }));

    scans.forEach((scan) => {
      if (!scan.created_at) return;
      const hour = new Date(scan.created_at).getHours();
      const slotIdx = Math.min(Math.floor(hour / 4), 6);
      slotCounts[slotIdx].detected += 1;
      if (scan.risk_level === 'High') {
        slotCounts[slotIdx].blocked += 1;
      }
    });

    return slotCounts;
  }, [scans]);

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
              isLoading={loading}
              onClick={() => {
                loadDashboardData();
                addToast({
                  title: 'SOC Telemetry Refreshed',
                  description: 'All feeds updated from SQLite database.',
                  type: 'info',
                });
              }}
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                <p className="text-xs text-gray-400">Loading recent reports…</p>
              </div>
            ) : recentReports.length > 0 ? (
              <div className="space-y-3">
                {recentReports.map((rep, idx) => {
                  const rCfg = riskCfg(rep.risk_level);
                  return (
                    <motion.div
                      key={rep.scan_id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.3 }}
                      onClick={() => navigate('/reports')}
                      className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-900/60 border border-gray-800/80 hover:border-gray-700 transition-all group cursor-pointer"
                    >
                      {/* Icon */}
                      <div className="p-1.5 rounded-md bg-blue-500/10 shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-200 truncate leading-tight">
                          {rep.subject || 'No Subject'}
                        </p>
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5 truncate">
                          From: {rep.sender || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-mono font-bold text-gray-300">
                            Score: {rep.risk_score}/100
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">
                            •
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">
                            {formatDate(rep.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Risk badge */}
                      <Badge variant={rCfg.variant} size="sm" className="shrink-0 mt-0.5">
                        {rCfg.label}
                      </Badge>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileText className="w-8 h-8 text-gray-700 mb-2" />
                <p className="text-xs font-semibold text-gray-400">No reports in database.</p>
                <p className="text-[11px] text-gray-600 mt-0.5">Upload an email to generate scans.</p>
              </div>
            )}
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                <p className="text-xs text-gray-400">Loading activity timeline…</p>
              </div>
            ) : recentHistoryEvents.length > 0 ? (
              /* Vertical timeline */
              <div className="relative pl-5">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/40 via-gray-700 to-transparent" />

                <div className="space-y-4">
                  {recentHistoryEvents.map((event, idx) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.3 }}
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
                        <p className="text-[10px] font-mono text-gray-400 truncate pl-5">
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
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Clock className="w-8 h-8 text-gray-700 mb-2" />
                <p className="text-xs font-semibold text-gray-400">No recent scan activity.</p>
                <p className="text-[11px] text-gray-600 mt-0.5">Upload a scan to record activity.</p>
              </div>
            )}
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
                  Real-time comparison of Detected vs Auto-Blocked threats from SQLite
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
                  Live DB
                </Badge>
              </div>
            </div>
          }
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
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
                  allowDecimals={false}
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
