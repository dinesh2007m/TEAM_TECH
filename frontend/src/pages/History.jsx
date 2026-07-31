import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History as HistoryIcon,
  Trash2,
  Eye,
  Download,
  FileJson,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Paperclip,
  Activity,
  Calendar,
  User,
  Mail,
  Search,
} from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem } from '../utils/animations';
import {
  listHistory,
  getHistoryDetail,
  deleteHistoryScan,
  downloadScanJSON,
  downloadScanPDF,
} from '../services/apiService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  High:   { badge: 'danger',  icon: ShieldX,    text: 'text-red-400',    bg: 'bg-red-500/10'   },
  Medium: { badge: 'warning', icon: ShieldAlert, text: 'text-amber-400',  bg: 'bg-amber-500/10' },
  Low:    { badge: 'info',    icon: ShieldCheck, text: 'text-blue-400',   bg: 'bg-blue-500/10'  },
  Safe:   { badge: 'success', icon: ShieldCheck, text: 'text-green-400',  bg: 'bg-green-500/10' },
};

const SEV_CONFIG = {
  High:   'danger',
  Medium: 'warning',
  Low:    'info',
};

function riskCfg(level) {
  return RISK_CONFIG[level] ?? RISK_CONFIG.Low;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function truncate(str, max = 40) {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// ─── Scan Detail Modal ─────────────────────────────────────────────────────────

const DetailModal = ({ scanId, onClose }) => {
  const { addToast } = useToast();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getHistoryDetail(scanId)
      .then((d) => setDetail(d.scan))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [scanId]);

  const handleDownloadJSON = async () => {
    try {
      await downloadScanJSON(detail.scan_id, detail);
      addToast({ title: 'JSON downloaded', type: 'success' });
    } catch (e) {
      addToast({ title: 'Download failed', description: e.message, type: 'error' });
    }
  };

  const handleDownloadReport = async () => {
    try {
      await downloadScanPDF(detail.scan_id, detail);
      addToast({ title: 'Report downloaded', type: 'success' });
    } catch (e) {
      addToast({ title: 'Download failed', description: e.message, type: 'error' });
    }
  };

  const cfg = detail ? riskCfg(detail.risk_level) : riskCfg('Low');
  const RiskIcon = cfg.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0D1322] border border-gray-700 shadow-2xl"
      >
        {/* Modal header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0D1322] border-b border-gray-800">
          <div className="flex items-center gap-3">
            <HistoryIcon className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm font-bold text-gray-100">Scan Detail</p>
              <p className="text-xs font-mono text-gray-500">{scanId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-12">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              <p className="text-sm text-gray-400">Loading scan details…</p>
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
              {/* Risk summary */}
              <div className={`flex flex-col sm:flex-row sm:items-center gap-5 p-5 rounded-xl border ${cfg.bg} border-gray-700`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-gray-700 ${cfg.bg}`}>
                  <RiskIcon className={`w-7 h-7 ${cfg.text}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Overall Risk Level</p>
                  <p className={`text-3xl font-extrabold tracking-tight ${cfg.text}`}>{detail.risk_level?.toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Risk Score</p>
                  <div className="flex items-center gap-2 justify-end mt-1">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <p className="text-3xl font-extrabold text-gray-100">{detail.risk_score ?? '—'}</p>
                  </div>
                </div>
              </div>

              {/* Email metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: User, label: 'Sender', value: detail.sender },
                  { icon: Mail, label: 'Receiver', value: detail.receiver },
                  { icon: FileText, label: 'Subject', value: detail.subject },
                  { icon: Calendar, label: 'Scanned', value: formatDate(detail.created_at) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-gray-900/60 rounded-xl border border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">{label}</p>
                      <p className="text-sm text-gray-200 break-words mt-0.5">{value || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              {detail.recommendation && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <p className="text-xs font-mono text-blue-400 uppercase tracking-wider mb-1">Recommendation</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{detail.recommendation}</p>
                </div>
              )}

              {/* Summary */}
              {detail.summary && (
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">Summary</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{detail.summary}</p>
                </div>
              )}

              {/* Indicators */}
              {detail.indicators?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <p className="text-sm font-semibold text-gray-200">
                      Indicators ({detail.indicators.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {detail.indicators.map((ind, i) => (
                      <div key={i} className="flex items-stretch rounded-xl overflow-hidden border border-gray-800 bg-gray-900/50">
                        <div className={`w-1 shrink-0 ${ind.severity === 'High' ? 'bg-red-500' : ind.severity === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        <div className="flex-1 px-4 py-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-200">{ind.name}</p>
                            <Badge variant={SEV_CONFIG[ind.severity] || 'info'} size="sm">{ind.severity}</Badge>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{ind.reason}</p>
                          {ind.source && (
                            <p className="text-[10px] font-mono text-gray-600 mt-1">source: {ind.source}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {detail.attachments?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="w-4 h-4 text-amber-400" />
                    <p className="text-sm font-semibold text-gray-200">
                      Attachments ({detail.attachments.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {detail.attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
                        <Paperclip className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{att.filename || '—'}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs font-mono text-gray-500 flex-wrap">
                            {att.sha256 && <span>SHA256: {att.sha256.slice(0, 16)}…</span>}
                            {att.mime_type && <span>{att.mime_type}</span>}
                            {att.entropy != null && <span>Entropy: {att.entropy.toFixed(2)}</span>}
                            {att.size != null && <span>{(att.size / 1024).toFixed(1)} KB</span>}
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

              {/* Download buttons */}
              <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-800">
                <Button variant="outline" size="sm" leftIcon={FileJson} onClick={handleDownloadJSON}>
                  Download JSON
                </Button>
                <Button variant="outline" size="sm" leftIcon={Download} onClick={handleDownloadReport}>
                  Download Report
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── History Row ───────────────────────────────────────────────────────────────

const HistoryRow = ({ scan, onView, onDelete, onDownloadJSON, onDownloadReport, isDeleting }) => {
  const cfg = riskCfg(scan.risk_level);
  const RiskIcon = cfg.icon;

  return (
    <motion.tr
      variants={staggerItem}
      className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors group"
    >
      {/* Scan ID */}
      <td className="p-4 pl-6">
        <p className="text-xs font-mono text-cyan-400 truncate max-w-[120px]">{scan.scan_id?.slice(0, 13)}…</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{formatDate(scan.created_at)}</p>
      </td>

      {/* Sender */}
      <td className="p-4">
        <p className="text-sm text-gray-200 truncate max-w-[180px]">{truncate(scan.sender, 35) || '—'}</p>
      </td>

      {/* Subject */}
      <td className="p-4">
        <p className="text-sm text-gray-300 truncate max-w-[220px]">{truncate(scan.subject, 45) || '—'}</p>
      </td>

      {/* Risk */}
      <td className="p-4">
        <div className="flex items-center gap-2">
          <RiskIcon className={`w-4 h-4 shrink-0 ${cfg.text}`} />
          <Badge variant={cfg.badge} size="sm">{scan.risk_level || '—'}</Badge>
        </div>
        {scan.risk_score != null && (
          <p className="text-xs font-mono text-gray-500 mt-0.5">Score: {scan.risk_score}</p>
        )}
      </td>

      {/* Indicators */}
      <td className="p-4 text-center">
        <span className={`text-sm font-bold ${scan.indicator_count > 0 ? cfg.text : 'text-gray-500'}`}>
          {scan.indicator_count ?? 0}
        </span>
      </td>

      {/* Actions */}
      <td className="p-4 pr-6">
        <div className="flex items-center gap-2 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onView(scan.scan_id)}
            title="View full report"
            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDownloadJSON(scan.scan_id)}
            title="Download JSON"
            className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
          >
            <FileJson className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDownloadReport(scan.scan_id)}
            title="Download report"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-500/10 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(scan.scan_id)}
            disabled={isDeleting === scan.scan_id}
            title="Delete scan"
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-40"
          >
            {isDeleting === scan.scan_id
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Trash2 className="w-4 h-4" />
            }
          </button>
        </div>
      </td>
    </motion.tr>
  );
};

// ─── Main History Page ─────────────────────────────────────────────────────────

export const History = () => {
  const { addToast } = useToast();

  const [scans, setScans] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [modalScanId, setModalScanId] = useState(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // ── Load history ─────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listHistory({ page, page_size: PAGE_SIZE });
      setScans(data.scans || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message);
      addToast({ title: 'Failed to load history', description: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, addToast]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (scanId) => {
    setDeletingId(scanId);
    try {
      await deleteHistoryScan(scanId);
      setScans((prev) => prev.filter((s) => s.scan_id !== scanId));
      setTotal((prev) => Math.max(0, prev - 1));
      addToast({ title: 'Scan deleted', type: 'success' });
    } catch (e) {
      addToast({ title: 'Delete failed', description: e.message, type: 'error', duration: 6000 });
    } finally {
      setDeletingId(null);
    }
  }, [addToast]);

  // ── Downloads ─────────────────────────────────────────────────────────────
  const handleDownloadJSON = useCallback(async (scanId) => {
    try {
      await downloadScanJSON(scanId);
      addToast({ title: 'JSON report downloaded', type: 'success' });
    } catch (e) {
      addToast({ title: 'Download failed', description: e.message, type: 'error' });
    }
  }, [addToast]);

  const handleDownloadReport = useCallback(async (scanId) => {
    try {
      await downloadScanPDF(scanId);
      addToast({ title: 'Report downloaded', type: 'success' });
    } catch (e) {
      addToast({ title: 'Download failed', description: e.message, type: 'error' });
    }
  }, [addToast]);

  // ── Filtering (client-side on loaded page) ────────────────────────────────
  const filtered = scans.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.scan_id?.toLowerCase().includes(q) ||
      s.sender?.toLowerCase().includes(q) ||
      s.subject?.toLowerCase().includes(q);
    const matchRisk = riskFilter === 'all' || s.risk_level?.toLowerCase() === riskFilter;
    return matchSearch && matchRisk;
  });

  // ── Risk level counts ─────────────────────────────────────────────────────
  const counts = scans.reduce((acc, s) => {
    const lv = s.risk_level || 'Unknown';
    acc[lv] = (acc[lv] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Page header */}
        <PageHeader
          title="Scan History"
          subtitle="Complete chronological record of all email security scans"
          badgeText="AUDIT LOG"
          badgeVariant="primary"
          actions={
            <div className="flex items-center gap-3">
              <Badge variant="secondary" size="md">
                {total} total scan{total !== 1 ? 's' : ''}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                leftIcon={RefreshCw}
                onClick={loadHistory}
                isLoading={loading}
              >
                Refresh
              </Button>
            </div>
          }
        />

        {/* Stats row */}
        <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['High', 'Medium', 'Low', 'Safe'].map((lv) => {
            const c = riskCfg(lv);
            const Icon = c.icon;
            return (
              <Card key={lv} className={`${c.bg} border-gray-700`}>
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 shrink-0 ${c.text}`} />
                  <div>
                    <p className="text-xs text-gray-500 font-mono uppercase">{lv} Risk</p>
                    <p className={`text-2xl font-extrabold ${c.text}`}>{counts[lv] || 0}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </motion.div>

        {/* Filters */}
        <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by scan ID, sender, or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="py-2 px-3 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500 font-mono cursor-pointer"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="safe">Safe</option>
          </select>
        </motion.div>

        {/* Table */}
        <motion.div variants={staggerItem}>
          <Card noPadding>
            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center gap-3 py-16">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                <p className="text-sm text-gray-400">Loading scan history…</p>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="flex items-center gap-3 m-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <HistoryIcon className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-400 font-semibold">
                  {scans.length === 0 ? 'No scan history yet.' : 'No results match your filter.'}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {scans.length === 0
                    ? 'Upload an email on the Upload page to generate your first scan.'
                    : 'Try adjusting your search or filter.'}
                </p>
              </div>
            )}

            {/* Data table */}
            {!loading && !error && filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-gray-900/80 text-gray-400 font-mono uppercase tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="p-4 pl-6">Scan ID / Date</th>
                      <th className="p-4">Sender</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Risk Level</th>
                      <th className="p-4 text-center">Indicators</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {filtered.map((scan) => (
                      <HistoryRow
                        key={scan.scan_id}
                        scan={scan}
                        onView={setModalScanId}
                        onDelete={handleDelete}
                        onDownloadJSON={handleDownloadJSON}
                        onDownloadReport={handleDownloadReport}
                        isDeleting={deletingId}
                      />
                    ))}
                  </motion.tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            {!loading && total > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800 text-xs font-mono text-gray-500">
                <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page * PAGE_SIZE >= total}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {modalScanId && (
          <DetailModal scanId={modalScanId} onClose={() => setModalScanId(null)} />
        )}
      </AnimatePresence>
    </>
  );
};
