import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from "../utils/cn";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Terminal,
  Activity,
  Search,
  ArrowUpRight,
  FileText,
  UploadCloud,
  BarChart3,
  History,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Database,
  Clock,
} from 'lucide-react';

import dashboardStatsData from '../data/dashboardStats.json';
import dashboardChartsData from '../data/dashboardCharts.json';
import alertsData from '../data/alerts.json';
import reportsData from '../data/reports.json';
import activityData from '../data/activity.json';
import notificationsData from '../data/notifications.json';

import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { SearchBar } from '../components/ui/SearchBar';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem } from '../utils/animations';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [alertSearch, setAlertSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [alerts, setAlerts] = useState(alertsData);

  // Filter alerts by search query and severity
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.threat.toLowerCase().includes(alertSearch.toLowerCase()) ||
      alert.target.toLowerCase().includes(alertSearch.toLowerCase()) ||
      alert.cve.toLowerCase().includes(alertSearch.toLowerCase());

    const matchesSeverity =
      severityFilter === 'all' || alert.severity.toLowerCase() === severityFilter.toLowerCase();

    return matchesSearch && matchesSeverity;
  });

  const handleRemediateAlert = (id, threatName) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Remediated' } : a))
    );
    addToast({
      title: 'Automated Remediation Triggered',
      description: `Isolated threat vectors for ${threatName}`,
      type: 'success',
    });
  };

  const severityBadgeMap = {
    critical: 'critical',
    high: 'danger',
    warning: 'warning',
    medium: 'warning',
    low: 'info',
  };

  const quickActions = [
    { title: 'Analyze File', path: '/upload', icon: UploadCloud, color: 'text-blue-400', desc: 'Scan binary or PCAP' },
    { title: 'Upload Email', path: '/upload', icon: FileText, color: 'text-cyan-400', desc: 'Ingest .EML attachment' },
    { title: 'View Reports', path: '/reports', icon: FileText, color: 'text-amber-400', desc: 'Compliance & executive PDFs' },
    { title: 'Scan History', path: '/history', icon: History, color: 'text-gray-400', desc: 'Audit log archives' },
    { title: 'Threat Analytics', path: '/analytics', icon: BarChart3, color: 'text-rose-400', desc: 'Risk trend profiling' },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-8 font-sans"
    >
      {/* Hero Page Header */}
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
                  description: 'All 6 metrics and chart feeds updated to latest epoch.',
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

      {/* 1. TOP METRICS GRID (6 Stat Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {dashboardStatsData.map((stat) => (
          <motion.div key={stat.id} variants={staggerItem}>
            <StatCard
              title={stat.title}
              value={stat.displayValue}
              status={stat.status}
              change={stat.change}
              trend={stat.trend}
              variant={stat.variant}
              icon={stat.icon}
              subtitle={stat.subtitle}
            />
          </motion.div>
        ))}
      </section>

      {/* 2. CHARTS SECTION (Threat Trend, Risk Distribution, Weekly Activity, Attack Categories) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Threat Trend Area Chart */}
        <motion.div variants={staggerItem} className="lg:col-span-8">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <div>
                  <h3 className="text-base font-bold text-gray-100 font-heading">
                    Threat Trend Telemetry (24h)
                  </h3>
                  <p className="text-xs text-gray-400">
                    Real-time comparison of Detected vs Auto-Blocked threats
                  </p>
                </div>
                <Badge variant="success" size="sm" dot>
                  LIVE FEED
                </Badge>
              </div>
            }
          >
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardChartsData.threatTrend}>
                  <defs>
                    <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0D1322',
                      borderColor: '#374151',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#F9FAFB',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="blocked"
                    name="Blocked Threats"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBlocked)"
                  />
                  <Area
                    type="monotone"
                    dataKey="critical"
                    name="Critical Vulnerabilities"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCritical)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Risk Distribution Donut Chart */}
        <motion.div variants={staggerItem} className="lg:col-span-4">
          <Card
            header={
              <div>
                <h3 className="text-base font-bold text-gray-100 font-heading">
                  Risk Level Breakdown
                </h3>
                <p className="text-xs text-gray-400">
                  Current enterprise asset risk profiling
                </p>
              </div>
            }
          >
            <div className="h-72 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={dashboardChartsData.riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dashboardChartsData.riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0D1322',
                      borderColor: '#374151',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-2 w-full text-xs pt-1 font-mono">
                {dashboardChartsData.riskDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between px-2 py-1 bg-gray-900/60 rounded border border-gray-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-300 truncate">{item.name}</span>
                    </div>
                    <span className="font-bold text-gray-100">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Weekly Security Activity Bar Chart */}
        <motion.div variants={staggerItem} className="lg:col-span-6">
          <Card
            header={
              <div>
                <h3 className="text-base font-bold text-gray-100 font-heading">
                  Weekly Scan & Incident Volumes
                </h3>
                <p className="text-xs text-gray-400">
                  Total automated scans vs flagged security incidents
                </p>
              </div>
            }
          >
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardChartsData.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0D1322',
                      borderColor: '#374151',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '5px' }} />
                  <Bar dataKey="scans" name="Telemetry Scans" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="incidents" name="Incidents Flagged" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Attack Categories Progress Bars */}
        <motion.div variants={staggerItem} className="lg:col-span-6">
          <Card
            header={
              <div>
                <h3 className="text-base font-bold text-gray-100 font-heading">
                  Top Attack Vector Categories
                </h3>
                <p className="text-xs text-gray-400">
                  Percentage distribution of detected vector signatures
                </p>
              </div>
            }
          >
            <div className="space-y-4 pt-1">
              {dashboardChartsData.attackCategories.map((cat, idx) => {
                const variants = ['danger', 'primary', 'warning', 'info', 'success'];
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-200 font-semibold">{cat.category}</span>
                      <span className="text-gray-400">{cat.count} occurrences ({cat.percentage}%)</span>
                    </div>
                    <ProgressBar
                      value={cat.percentage}
                      variant={variants[idx % variants.length]}
                      size="md"
                      showLabel={false}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </section>

      {/* 3. RECENT ALERTS TABLE & NOTIFICATIONS PANEL */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Recent Alerts Glassmorphism Table (8 Cols) */}
        <motion.div variants={staggerItem} className="lg:col-span-8">
          <Card
            header={
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-100 font-heading">
                      Recent Threat Alerts
                    </h3>
                    <Badge variant="critical" size="sm">
                      {filteredAlerts.length} ALERTS
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    Active vulnerability detections and MITRE ATT&CK vectors
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter alerts..."
                      value={alertSearch}
                      onChange={(e) => setAlertSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-sans"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="py-1.5 px-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono cursor-pointer"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="warning">Warning</option>
                  </select>
                </div>
              </div>
            }
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-gray-900/80 text-gray-400 font-mono uppercase tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="p-3.5 pl-6">Threat / CVE</th>
                    <th className="p-3.5">Severity</th>
                    <th className="p-3.5">Target Host / IP</th>
                    <th className="p-3.5">Time</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-sans">
                  {filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 font-mono">
                        No security alerts match the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <tr
                        key={alert.id}
                        className="hover:bg-gray-800/40 transition-colors group"
                      >
                        <td className="p-3.5 pl-6">
                          <div className="font-semibold text-gray-200 flex items-center gap-2">
                            <span>{alert.threat}</span>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/30">
                            {alert.cve}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <Badge variant={severityBadgeMap[alert.severity]} size="sm">
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </td>

                        <td className="p-3.5 font-mono text-gray-300 text-xs">
                          {alert.target}
                        </td>

                        <td className="p-3.5 font-mono text-gray-400 text-xs">
                          {alert.time}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-xs font-medium',
                              alert.status === 'Active' && 'text-red-400 font-bold animate-pulse',
                              alert.status === 'Remediated' && 'text-green-400',
                              alert.status === 'Investigating' && 'text-amber-400',
                              alert.status === 'Isolated' && 'text-cyan-400'
                            )}
                          >
                            {alert.status === 'Active' && <AlertTriangle className="w-3.5 h-3.5" />}
                            {alert.status === 'Remediated' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {alert.status}
                          </span>
                        </td>

                        <td className="p-3.5 pr-6 text-right">
                          {alert.status !== 'Remediated' ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemediateAlert(alert.id, alert.threat)}
                            >
                              Remediate
                            </Button>
                          ) : (
                            <Badge variant="success" size="sm">
                              SECURED
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* Notifications Panel Cards (4 Cols) */}
        <motion.div variants={staggerItem} className="lg:col-span-4 space-y-4">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <h3 className="text-base font-bold text-gray-100 font-heading">
                  SOC Intelligence Feed
                </h3>
                <Badge variant="info" size="sm">
                  LIVE ALERTS
                </Badge>
              </div>
            }
          >
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {notificationsData.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 rounded-xl bg-gray-900/80 border border-gray-800/80 hover:border-blue-500/40 transition-all flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-gray-200 truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] font-mono text-gray-400">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">
                      {notif.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant={notif.severity === 'critical' ? 'critical' : 'warning'} size="sm">
                        {notif.severity.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {notif.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </section>

      {/* 4. QUICK ACTIONS & RECENT REPORTS & SYSTEM HEALTH PANEL */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Quick Actions Card Grid (4 Cols) */}
        <motion.div variants={staggerItem} className="lg:col-span-4">
          <Card
            header={
              <h3 className="text-base font-bold text-gray-100 font-heading">
                SOC Quick Operations
              </h3>
            }
          >
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    onClick={() => navigate(action.path)}
                    className="p-3.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-blue-500/40 text-left transition-all group cursor-pointer flex flex-col justify-between h-28"
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={cn('w-5 h-5 transition-transform group-hover:scale-110', action.color)} />
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-200 group-hover:text-white">
                        {action.title}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5 font-mono">
                        {action.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Recent Reports Cards (4 Cols) */}
        <motion.div variants={staggerItem} className="lg:col-span-4">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <h3 className="text-base font-bold text-gray-100 font-heading">
                  Recent Threat Reports
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
                  All Reports
                </Button>
              </div>
            }
          >
            <div className="space-y-3">
              {reportsData.slice(0, 3).map((rep) => (
                <div
                  key={rep.id}
                  className="p-3 rounded-xl bg-gray-900/80 border border-gray-800/80 hover:border-gray-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-200 truncate">
                          {rep.filename}
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                          {rep.threatType} • {rep.fileSize}
                        </p>
                      </div>
                    </div>
                    <Badge variant={rep.riskScore > 75 ? 'danger' : 'warning'} size="sm">
                      {rep.riskScore} RISK
                    </Badge>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-gray-400">{rep.generatedTime}</span>
                    <button
                      onClick={() => navigate('/reports')}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      View Report <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* System Health Panel (4 Cols) */}
        <motion.div variants={staggerItem} className="lg:col-span-4">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <h3 className="text-base font-bold text-gray-100 font-heading">
                  System Health & Telemetry
                </h3>
                <Badge variant="success" size="sm" dot>
                  OPTIMAL
                </Badge>
              </div>
            }
          >
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">AI Threat Analysis Engine</span>
                  <span className="text-green-400 font-bold">100% Operational</span>
                </div>
                <ProgressBar value={100} variant="success" showLabel={false} size="sm" />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">Malware Sandbox Detonation</span>
                  <span className="text-blue-400 font-bold">4 Active Runners</span>
                </div>
                <ProgressBar value={82} variant="primary" showLabel={false} size="sm" />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">Threat Intelligence Feed</span>
                  <span className="text-cyan-400 font-bold">Sync (12ms)</span>
                </div>
                <ProgressBar value={95} variant="primary" showLabel={false} size="sm" />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">Detection Rate Accuracy</span>
                  <span className="text-green-400 font-bold">99.8%</span>
                </div>
                <ProgressBar value={99.8} variant="success" showLabel={false} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-between">
                  <span className="text-gray-400">CPU Usage</span>
                  <span className="font-bold text-blue-400">28.4%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-between">
                  <span className="text-gray-400">Memory</span>
                  <span className="font-bold text-cyan-400">6.2 / 32 GB</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* 5. LIVE ACTIVITY FEED TIMELINE */}
      <motion.section variants={staggerItem}>
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-gray-100 font-heading">
                  Live Execution Activity Timeline
                </h3>
              </div>
              <Badge variant="primary" size="sm">
                CHRONOLOGICAL AUDIT
              </Badge>
            </div>
          }
        >
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-800">
            {activityData.map((act) => (
              <div key={act.id} className="relative flex items-start justify-between gap-4 group">
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-[#030712] group-hover:scale-125 transition-transform" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-bold text-gray-200">{act.title}</h4>
                    <Badge variant={act.badgeVariant || 'primary'} size="sm">
                      {act.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed font-sans">
                    {act.description}
                  </p>
                </div>

                <span className="text-xs font-mono text-gray-400 shrink-0 bg-gray-900 px-2 py-1 rounded border border-gray-800">
                  {act.timestamp}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.section>
    </motion.div>
  );
};
