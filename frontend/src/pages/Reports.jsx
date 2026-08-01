import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  FileJson,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Loader2,
  AlertTriangle,
  Calendar,
  User,
  Mail,
  Activity,
  Paperclip,
  X,
  Clock,
  CheckCircle2,
} from 'lucide-react';

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

// ─── Risk Configuration ────────────────────────────────────────────────────────

const RISK_CONFIG = {
  High:   { badge: 'danger',  icon: ShieldX,    text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
  Medium: { badge: 'warning', icon: ShieldAlert, text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
  Low:    { badge: 'info',    icon: ShieldCheck, text: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  Safe:   { badge: 'success', icon: ShieldCheck, text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30' },
};

function riskCfg(level) {
  return RISK_CONFIG[level] ?? RISK_CONFIG.Low;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function truncate(str, max = 35) {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// ─── View Report Detail Modal ──────────────────────────────────────────────────

const ReportDetailModal = ({ scanId, onClose }) => {
  const { addToast } = useToast();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getReportData(scanId)
      .then((data) => setDetail(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [scanId]);

  const handleDownloadJSON = async () => {
    try {
      await downloadScanJSON(scanId);
      addToast({ title: 'JSON report downloaded', type: 'success' });
    } catch (e) {
      addToast({ title: 'Download failed', description: e.message, type: 'error' });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadScanPDF(scanId);
      addToast({ title: 'PDF report downloaded', type: 'success' });
    } catch (e) {
      addToast({ title: 'Download failed', description: e.message, type: 'error' });
    }
  };

  const cfg = detail ? riskCfg(detail.risk_level) : riskCfg('Low');
  const RiskIcon = cfg.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0D1322] border border-gray-800 shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0D1322] border-b border-gray-800">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm font-bold text-gray-100">Cybersecurity Scan Report</p>
              <p className="text-xs font-mono text-gray-500">{scanId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-16">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              <p className="text-sm text-gray-400">Loading analysis report from backend…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {detail && !loading && (
            <>
              {/* Risk Level Banner */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${cfg.border} ${cfg.bg}`}>
                    <RiskIcon className={`w-7 h-7 ${cfg.text}`} />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Risk Assessment</p>
                    <p className={`text-3xl font-extrabold tracking-tight ${cfg.text}`}>
                      {detail.risk_level?.toUpperCase()} RISK
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 bg-gray-900/80 px-5 py-3 rounded-xl border border-gray-800">
                  <div>
                    <p className="text-xs font-mono text-gray-400 uppercase">Risk Score</p>
                    <p className="text-2xl font-extrabold text-gray-100">{detail.risk_score} <span className="text-xs text-gray-500 font-normal">/ 100</span></p>
                  </div>
                  <div className="w-px h-8 bg-gray-800" />
                  <div>
                    <p className="text-xs font-mono text-gray-400 uppercase">Scan Date</p>
                    <p className="text-xs text-gray-300 font-mono mt-0.5">{formatDate(detail.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase mb-1">
                    <User className="w-3.5 h-3.5 text-blue-400" /> Sender
                  </div>
                  <p className="text-sm font-medium text-gray-200 truncate">{detail.sender || '—'}</p>
                </div>
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase mb-1">
                    <Mail className="w-3.5 h-3.5 text-blue-400" /> Receiver
                  </div>
                  <p className="text-sm font-medium text-gray-200 truncate">{detail.receiver || '—'}</p>
                </div>
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase mb-1">
                    <FileText className="w-3.5 h-3.5 text-blue-400" /> Subject
                  </div>
                  <p className="text-sm font-medium text-gray-200 truncate">{detail.subject || '—'}</p>
                </div>
              </div>

              {/* Recommendation & Summary */}
              {detail.recommendation && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1">
                  <p className="text-xs font-mono text-blue-400 uppercase tracking-wider">Recommendation</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{detail.recommendation}</p>
                </div>
              )}

              {detail.summary && (
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-1">
                  <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Summary</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{detail.summary}</p>
                </div>
              )}

              {/* Indicators */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" /> Threat Indicators ({detail.indicators?.length || 0})
                  </p>
                </div>
                {detail.indicators?.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {detail.indicators.map((ind, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl text-xs">
                        <Badge
                          variant={ind.severity === 'High' ? 'danger' : ind.severity === 'Medium' ? 'warning' : 'info'}
                          size="sm"
                        >
                          {ind.severity}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-200">{ind.name}</p>
                          <p className="text-gray-400 mt-0.5">{ind.reason}</p>
                        </div>
                        {ind.source && (
                          <span className="font-mono text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                            {ind.source}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 bg-gray-900/40 p-3 rounded-xl border border-gray-800">
                    No threat indicators were triggered for this email.
                  </p>
                )}
              </div>

              {/* Attachments */}
              {detail.attachments?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                    <Paperclip className="w-4 h-4 text-amber-400" /> Attachments ({detail.attachments.length})
                  </p>
                  <div className="space-y-2">
                    {detail.attachments.map((att, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-800 rounded-xl text-xs">
                        <div className="flex items-center gap-3">
                          <Paperclip className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <p className="font-medium text-gray-200">{att.filename || '—'}</p>
                            <p className="font-mono text-[10px] text-gray-500">
                              {att.mime_type} • {(att.size / 1024).toFixed(1)} KB • Entropy: {att.entropy ? att.entropy.toFixed(2) : '—'}
                            </p>
                          </div>
                        </div>
                        {att.risk && (
                          <Badge variant={riskCfg(att.risk).badge} size="sm">{att.risk}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <Button variant="outline" size="sm" leftIcon={FileJson} onClick={handleDownloadJSON}>
                  Download JSON
                </Button>
                <Button variant="primary" size="sm" leftIcon={Download} onClick={handleDownloadPDF}>
                  Download PDF Report
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Reports Page ─────────────────────────────────────────────────────────

export const Reports = () => {
  const { addToast } = useToast();

  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalScanId, setModalScanId] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listHistory({ page: 1, page_size: 200 });
      setScans(data.scans || []);
    } catch (e) {
      setError(e.message);
      addToast({ title: 'Failed to fetch reports', description: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // ── Stat calculations ─────────────────────────────────────────────────────
  const totalReports = scans.length;
  const highRiskCount = scans.filter((s) => s.risk_level === 'High').length;
  const mediumRiskCount = scans.filter((s) => s.risk_level === 'Medium').length;
  const lowRiskCount = scans.filter((s) => s.risk_level === 'Low' || s.risk_level === 'Safe').length;

  // ── Filtering Logic ───────────────────────────────────────────────────────
  const filteredScans = scans.filter((scan) => {
    // Search query filter
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      scan.scan_id?.toLowerCase().includes(q) ||
      scan.sender?.toLowerCase().includes(q) ||
      scan.subject?.toLowerCase().includes(q);

    // Risk level filter
    const matchesRisk =
      riskFilter === 'all' || scan.risk_level?.toLowerCase() === riskFilter.toLowerCase();

    // Date filter logic
    let matchesDate = true;
    if (dateFilter !== 'all' && scan.created_at) {
      const scanDate = new Date(scan.created_at);
      const now = new Date();
      if (dateFilter === 'today') {
        matchesDate = scanDate.toDateString() === now.toDateString();
      } else if (dateFilter === '7days') {
        const past7 = new Date(now.setDate(now.getDate() - 7));
        matchesDate = scanDate >= past7;
      } else if (dateFilter === '30days') {
        const past30 = new Date(now.setDate(now.getDate() - 30));
        matchesDate = scanDate >= past30;
      }
    }

    return matchesSearch && matchesRisk && matchesDate;
  });

  const handleDownloadJSON = async (scanId) => {
    try {
      await downloadScanJSON(scanId);
      addToast({ title: 'JSON downloaded', type: 'success' });
    } catch (e) {
      addToast({ title: 'Download failed', description: e.message, type: 'error' });
    }
  };

  const handleDownloadPDF = async (scanId) => {
    try {
      await downloadScanPDF(scanId);
      addToast({ title: 'PDF report downloaded', type: 'success' });
    } catch (e) {
      addToast({ title: 'Download failed', description: e.message, type: 'error' });
    }
  };

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Page Header */}
        <PageHeader
          title="Security Reports & Audit Hub"
          subtitle="Generate, view, and export detailed cybersecurity reports from real scan records"
          badgeText="REPORTS MODULE"
          badgeVariant="primary"
          actions={
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={loadReports}
              isLoading={loading}
            >
              Refresh
            </Button>
          }
        />

        {/* Executive Stat Cards */}
        <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-800 bg-[#0D1322]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Total Reports</p>
                <p className="text-2xl font-extrabold text-gray-100">{totalReports}</p>
              </div>
            </div>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <ShieldX className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">High Risk Reports</p>
                <p className="text-2xl font-extrabold text-red-400">{highRiskCount}</p>
              </div>
            </div>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Medium Risk Reports</p>
                <p className="text-2xl font-extrabold text-amber-400">{mediumRiskCount}</p>
              </div>
            </div>
          </Card>

          <Card className="border-green-500/20 bg-green-500/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Low / Safe Reports</p>
                <p className="text-2xl font-extrabold text-green-400">{lowRiskCount}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filters Section */}
        <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by scan ID, sender, or subject…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="py-2.5 px-3 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-blue-500 font-mono cursor-pointer"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
              <option value="safe">Safe</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="py-2.5 px-3 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-blue-500 font-mono cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 30 Days</option>
            </select>
          </div>
        </motion.div>

        {/* Reports Table */}
        <motion.div variants={staggerItem}>
          <Card noPadding className="border-gray-800 bg-[#0D1322] overflow-hidden">
            {loading && (
              <div className="flex items-center justify-center gap-3 py-16">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                <p className="text-sm text-gray-400">Fetching reports from backend database…</p>
              </div>
            )}

            {error && !loading && (
              <div className="flex items-center gap-3 m-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {!loading && !error && filteredScans.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <FileText className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-300 font-semibold">No reports match your filters.</p>
                <p className="text-gray-500 text-sm mt-1">Try resetting your search query or risk filters.</p>
              </div>
            )}

            {!loading && !error && filteredScans.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-gray-900/80 text-gray-400 font-mono uppercase tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="p-4 pl-6">Scan ID</th>
                      <th className="p-4">Sender</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Risk Level</th>
                      <th className="p-4">Risk Score</th>
                      <th className="p-4">Scan Date</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {filteredScans.map((scan) => {
                      const cfg = riskCfg(scan.risk_level);
                      const RiskIcon = cfg.icon;
                      return (
                        <tr
                          key={scan.scan_id}
                          className="hover:bg-gray-800/40 transition-colors group"
                        >
                          <td className="p-4 pl-6 font-mono text-cyan-400 font-medium">
                            {scan.scan_id?.slice(0, 13)}…
                          </td>
                          <td className="p-4 text-gray-200 max-w-[180px] truncate">
                            {truncate(scan.sender, 30)}
                          </td>
                          <td className="p-4 text-gray-300 max-w-[220px] truncate">
                            {truncate(scan.subject, 40)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <RiskIcon className={`w-4 h-4 ${cfg.text}`} />
                              <Badge variant={cfg.badge} size="sm">{scan.risk_level}</Badge>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-gray-200">
                            {scan.risk_score} <span className="text-gray-500 text-[10px]">/ 100</span>
                          </td>
                          <td className="p-4 text-gray-400 font-mono text-[11px]">
                            {formatDate(scan.created_at)}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setModalScanId(scan.scan_id)}
                                title="View Report"
                                className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Report
                              </button>
                              <button
                                onClick={() => handleDownloadPDF(scan.scan_id)}
                                title="Download PDF"
                                className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDownloadJSON(scan.scan_id)}
                                title="Download JSON"
                                className="p-1.5 rounded-lg bg-gray-800 text-cyan-400 hover:bg-gray-700 transition-colors cursor-pointer"
                              >
                                <FileJson className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>

      {/* Report Detail Modal */}
      <AnimatePresence>
        {modalScanId && (
          <ReportDetailModal scanId={modalScanId} onClose={() => setModalScanId(null)} />
        )}
      </AnimatePresence>
    </>
  );
};
