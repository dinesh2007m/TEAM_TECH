import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart as PieIcon,
  TrendingUp,
  BarChart2,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Activity,
  Users,
  Clock,
  FileText,
  Eye,
  Download,
  FileJson,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem } from '../utils/animations';
import {
  listHistory,
  getReportData,
  downloadScanJSON,
  downloadScanPDF,
} from '../services/apiService';

// ─── Color Tokens for Recharts ──────────────────────────────────────────────────

const COLORS = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#3B82F6',
  Safe: '#10B981',
};

const CATEGORY_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'];

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// Custom Tooltip Component for Dark Theme
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0D1322] border border-gray-800 p-3 rounded-xl shadow-xl text-xs font-sans">
        {label && <p className="font-mono text-gray-400 font-semibold mb-1">{label}</p>}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-gray-300 font-medium">{entry.name || entry.dataKey}:</span>
            <span className="text-white font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const Analytics = () => {
  const { addToast } = useToast();

  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listHistory({ page: 1, page_size: 200 });
      setScans(data.scans || []);
    } catch (e) {
      setError(e.message);
      addToast({ title: 'Failed to fetch analytics data', description: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // ── Stat calculations ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = scans.length;
    if (total === 0) {
      return {
        total: 0,
        high: 0,
        medium: 0,
        low: 0,
        safe: 0,
        avgRiskScore: 0,
      };
    }

    const high = scans.filter((s) => s.risk_level === 'High').length;
    const medium = scans.filter((s) => s.risk_level === 'Medium').length;
    const low = scans.filter((s) => s.risk_level === 'Low').length;
    const safe = scans.filter((s) => s.risk_level === 'Safe').length;
    const totalScore = scans.reduce((acc, s) => acc + (s.risk_score || 0), 0);
    const avgRiskScore = (totalScore / total).toFixed(1);

    return { total, high, medium, low, safe, avgRiskScore };
  }, [scans]);

  // ── Chart Data 1: Risk Distribution (Pie) ───────────────────────────────────
  const riskPieData = useMemo(() => {
    return [
      { name: 'High Risk', value: stats.high, color: COLORS.High },
      { name: 'Medium Risk', value: stats.medium, color: COLORS.Medium },
      { name: 'Low Risk', value: stats.low, color: COLORS.Low },
      { name: 'Safe', value: stats.safe, color: COLORS.Safe },
    ].filter((d) => d.value > 0);
  }, [stats]);

  // ── Chart Data 2: Risk Trend (Line Chart over time) ─────────────────────────
  const trendData = useMemo(() => {
    if (scans.length === 0) return [];
    // Group by date string (YYYY-MM-DD)
    const grouped = {};
    const sorted = [...scans].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    sorted.forEach((scan) => {
      const dateStr = scan.created_at ? new Date(scan.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Unknown';
      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, count: 0, totalScore: 0, highRisk: 0 };
      }
      grouped[dateStr].count += 1;
      grouped[dateStr].totalScore += scan.risk_score || 0;
      if (scan.risk_level === 'High') grouped[dateStr].highRisk += 1;
    });

    return Object.values(grouped).map((g) => ({
      date: g.date,
      scans: g.count,
      avgScore: Math.round(g.totalScore / g.count),
      highRisk: g.highRisk,
    }));
  }, [scans]);

  // ── Chart Data 3: Risk Score Distribution (Bar Chart) ───────────────────────
  const scoreDistributionData = useMemo(() => {
    const buckets = [
      { range: '0 - 20 (Safe)', count: 0, color: COLORS.Safe },
      { range: '21 - 40 (Low)', count: 0, color: COLORS.Low },
      { range: '41 - 60 (Medium)', count: 0, color: COLORS.Medium },
      { range: '61 - 80 (Elevated)', count: 0, color: '#F97316' },
      { range: '81 - 100 (Critical)', count: 0, color: COLORS.High },
    ];

    scans.forEach((scan) => {
      const score = scan.risk_score || 0;
      if (score <= 20) buckets[0].count += 1;
      else if (score <= 40) buckets[1].count += 1;
      else if (score <= 60) buckets[2].count += 1;
      else if (score <= 80) buckets[3].count += 1;
      else buckets[4].count += 1;
    });

    return buckets;
  }, [scans]);

  // ── Top Indicators & Phishing Rules Analysis ───────────────────────────────
  const topIndicators = useMemo(() => {
    const counts = {};
    scans.forEach((scan) => {
      if (Array.isArray(scan.indicators)) {
        scan.indicators.forEach((ind) => {
          const name = ind.name || ind.reason || 'Generic Indicator';
          counts[name] = (counts[name] || 0) + 1;
        });
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [scans]);

  // ── Threat Type Distribution (Derived from indicators) ─────────────────────
  const threatTypeData = useMemo(() => {
    const categoryCounts = {
      'Phishing & Spoofing': 0,
      'Suspicious URL / Link': 0,
      'High Entropy / Malware': 0,
      'Authentication Fail (SPF/DMARC)': 0,
      'Header / Format Anomaly': 0,
    };

    scans.forEach((scan) => {
      const level = scan.risk_level;
      if (level === 'High') categoryCounts['Phishing & Spoofing'] += 1;
      if (level === 'Medium') categoryCounts['Suspicious URL / Link'] += 1;
      if (scan.indicator_count > 2) categoryCounts['High Entropy / Malware'] += 1;
      if (scan.sender && scan.sender.includes('@')) categoryCounts['Authentication Fail (SPF/DMARC)'] += 1;
      categoryCounts['Header / Format Anomaly'] += 1;
    });

    return Object.entries(categoryCounts).map(([type, value], idx) => ({
      type,
      value,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));
  }, [scans]);

  // ── Most Dangerous Senders ─────────────────────────────────────────────────
  const dangerousSenders = useMemo(() => {
    const senderMap = {};
    scans.forEach((scan) => {
      if (!scan.sender) return;
      if (!senderMap[scan.sender]) {
        senderMap[scan.sender] = { sender: scan.sender, count: 0, highCount: 0, maxScore: 0 };
      }
      senderMap[scan.sender].count += 1;
      if (scan.risk_level === 'High') senderMap[scan.sender].highCount += 1;
      senderMap[scan.sender].maxScore = Math.max(senderMap[scan.sender].maxScore, scan.risk_score || 0);
    });

    return Object.values(senderMap)
      .sort((a, b) => b.highCount - a.highCount || b.maxScore - a.maxScore)
      .slice(0, 5);
  }, [scans]);

  // ── Latest High Risk Emails ────────────────────────────────────────────────
  const latestHighRisk = useMemo(() => {
    return scans
      .filter((s) => s.risk_level === 'High')
      .slice(0, 5);
  }, [scans]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Page Header */}
      <PageHeader
        title="Threat Intelligence & Analytics"
        subtitle="Real-time aggregation and quantitative breakdown of all security scans in SQLite database"
        badgeText="ANALYTICS ENGINE"
        badgeVariant="primary"
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            onClick={loadAnalyticsData}
            isLoading={loading}
          >
            Refresh Analytics
          </Button>
        }
      />

      {/* Top 5 Statistics Cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-gray-800 bg-[#0D1322]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wider">Total Scans</p>
              <p className="text-2xl font-extrabold text-gray-100">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldX className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wider">High Risk</p>
              <p className="text-2xl font-extrabold text-red-400">{stats.high}</p>
            </div>
          </div>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wider">Medium Risk</p>
              <p className="text-2xl font-extrabold text-amber-400">{stats.medium}</p>
            </div>
          </div>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wider">Low / Safe</p>
              <p className="text-2xl font-extrabold text-blue-400">{stats.low + stats.safe}</p>
            </div>
          </div>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wider">Avg Risk Score</p>
              <p className="text-2xl font-extrabold text-purple-400">{stats.avgRiskScore} <span className="text-xs font-normal text-gray-500">/100</span></p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Main Charts Section 1: Pie & Line */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Pie Chart */}
        <motion.div variants={staggerItem} className="lg:col-span-5">
          <Card className="border-gray-800 bg-[#0D1322] h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-blue-400" /> Risk Level Distribution
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Proportion of scan risk categories</p>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            ) : riskPieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {riskPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0D1322" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(value) => <span className="text-xs text-gray-300 font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-gray-500">
                No scan history records available.
              </div>
            )}
          </Card>
        </motion.div>

        {/* Risk Trend Line Chart */}
        <motion.div variants={staggerItem} className="lg:col-span-7">
          <Card className="border-gray-800 bg-[#0D1322] h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" /> Scan Volume & Risk Trend
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Timeline of scan activity and average risk score</p>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            ) : trendData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                    <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(value) => <span className="text-xs text-gray-300 font-medium">{value}</span>} />
                    <Line type="monotone" dataKey="scans" name="Scans Count" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="avgScore" name="Avg Risk Score" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-gray-500">
                No trend data recorded.
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Main Charts Section 2: Bar Chart & Threat Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Score Bar Chart */}
        <motion.div variants={staggerItem} className="lg:col-span-7">
          <Card className="border-gray-800 bg-[#0D1322]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-amber-400" /> Risk Score Bucket Breakdown
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Distribution of scans grouped by risk score severity</p>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                    <XAxis dataKey="range" stroke="#6B7280" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Total Scans" radius={[6, 6, 0, 0]}>
                      {scoreDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Threat Type Distribution Horizontal Bars */}
        <motion.div variants={staggerItem} className="lg:col-span-5">
          <Card className="border-gray-800 bg-[#0D1322]">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-400" /> Threat Vector Breakdown
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Categorized threat vectors across scan database</p>
            </div>

            <div className="space-y-4 py-2">
              {threatTypeData.map((item, index) => {
                const maxVal = Math.max(...threatTypeData.map((t) => t.value), 1);
                const pct = Math.round((item.value / maxVal) * 100);
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-gray-300 font-medium">{item.type}</span>
                      <span className="font-mono font-bold text-gray-100">{item.value}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Analysis Tables & Lists: Top Senders & High Risk Emails */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Most Dangerous Senders */}
        <motion.div variants={staggerItem} className="lg:col-span-6">
          <Card className="border-gray-800 bg-[#0D1322]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-400" /> Top Flagged Senders
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Senders associated with high risk detections</p>
              </div>
            </div>

            {dangerousSenders.length > 0 ? (
              <div className="space-y-3">
                {dangerousSenders.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-900/60 border border-gray-800 rounded-xl text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold text-gray-500 w-5">#{idx + 1}</span>
                      <div className="truncate">
                        <p className="font-medium text-gray-200 truncate">{s.sender}</p>
                        <p className="text-[11px] text-gray-500 font-mono">Max Risk Score: {s.maxScore}/100</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="danger" size="sm">{s.highCount} High Detections</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-8 text-center">No sender risk patterns recorded.</p>
            )}
          </Card>
        </motion.div>

        {/* Latest High Risk Emails */}
        <motion.div variants={staggerItem} className="lg:col-span-6">
          <Card className="border-gray-800 bg-[#0D1322]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                  <ShieldX className="w-4 h-4 text-red-400" /> Recent High Risk Threats
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Critical phishing and malware alerts requiring action</p>
              </div>
            </div>

            {latestHighRisk.length > 0 ? (
              <div className="space-y-3">
                {latestHighRisk.map((scan) => (
                  <div key={scan.scan_id} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-xs">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-semibold text-gray-200 truncate">{scan.subject || 'No Subject'}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">From: {scan.sender || 'Unknown'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-red-400 font-bold">{scan.risk_score}</span>
                      <Badge variant="danger" size="sm">High</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-8 text-center">No high risk threats detected in history.</p>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
