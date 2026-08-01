import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Sliders,
  Palette,
  Bell,
  Database,
  Info,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  Zap,
  Server,
  Code2,
  Users,
  Clock,
  Globe,
  Activity,
  Shield,
  Loader2,
} from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem } from '../utils/animations';
import {
  getSystemStatus,
  clearScanHistoryDB,
  refreshDatabaseDB,
  exportDatabaseDB,
  importDatabaseDB,
} from '../services/apiService';

export const Settings = () => {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  // System Status state
  const [systemInfo, setSystemInfo] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [pingMs, setPingMs] = useState(null);

  // Action button loading states
  const [testingConn, setTestingConn] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [refreshingDB, setRefreshingDB] = useState(false);
  const [importingDB, setImportingDB] = useState(false);

  // Clear confirmation modal state
  const [showClearModal, setShowClearModal] = useState(false);

  // Settings State (Local preferences)
  const [settingsState, setSettingsState] = useState({
    autoRefresh: '30s',
    notificationsEnabled: true,
    riskThreshold: 'High',
    soundAlerts: false,
    highContrast: false,
  });

  const checkStatus = useCallback(async () => {
    setLoadingStatus(true);
    const start = performance.now();
    try {
      const data = await getSystemStatus();
      const latency = Math.round(performance.now() - start);
      setSystemInfo(data);
      setPingMs(latency);
    } catch (e) {
      setSystemInfo({ status: 'offline', error: e.message });
      setPingMs(null);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // ── Action Handlers ─────────────────────────────────────────────────────────

  const handleTestConnection = async () => {
    setTestingConn(true);
    const start = performance.now();
    try {
      const data = await getSystemStatus();
      const latency = Math.round(performance.now() - start);
      setSystemInfo(data);
      setPingMs(latency);
      addToast({
        title: 'Backend Connection Successful',
        description: `Connected to FastAPI server at http://127.0.0.1:8000 in ${latency} ms`,
        type: 'success',
      });
    } catch (e) {
      addToast({
        title: 'Backend Connection Failed',
        description: e.message,
        type: 'error',
      });
    } finally {
      setTestingConn(false);
    }
  };

  const handleClearHistory = async () => {
    setClearingHistory(true);
    try {
      await clearScanHistoryDB();
      addToast({
        title: 'Database Cleared',
        description: 'All scan history records were deleted from SQLite database.',
        type: 'success',
      });
      setShowClearModal(false);
      checkStatus();
    } catch (e) {
      addToast({
        title: 'Clear Failed',
        description: e.message,
        type: 'error',
      });
    } finally {
      setClearingHistory(false);
    }
  };

  const handleRefreshDatabase = async () => {
    setRefreshingDB(true);
    try {
      const res = await refreshDatabaseDB();
      addToast({
        title: 'Database Refreshed',
        description: res.message || 'Database cleared and seeded with sample scans.',
        type: 'success',
      });
      checkStatus();
    } catch (e) {
      addToast({
        title: 'Refresh Failed',
        description: e.message,
        type: 'error',
      });
    } finally {
      setRefreshingDB(false);
    }
  };

  const handleExportDatabase = async () => {
    try {
      await exportDatabaseDB();
      addToast({
        title: 'Database Export Started',
        description: 'Downloading JSON database backup file.',
        type: 'success',
      });
    } catch (e) {
      addToast({
        title: 'Export Failed',
        description: e.message,
        type: 'error',
      });
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingDB(true);
    try {
      const res = await importDatabaseDB(file);
      addToast({
        title: 'Database Import Complete',
        description: res.message || `Successfully imported records from ${file.name}`,
        type: 'success',
      });
      checkStatus();
    } catch (err) {
      addToast({
        title: 'Import Failed',
        description: err.message,
        type: 'error',
      });
    } finally {
      setImportingDB(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Page Header */}
      <PageHeader
        title="System Settings & Preferences"
        subtitle="Manage platform configuration, backend status, and SQLite database operations"
        badgeText="SETTINGS MODULE"
        badgeVariant="primary"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation / Overview Left Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick System Health Card */}
          <motion.div variants={staggerItem}>
            <Card className="border-gray-800 bg-[#0D1322] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" /> Backend Engine Status
                </h3>
                {systemInfo?.status === 'online' ? (
                  <Badge variant="success" size="sm">ONLINE</Badge>
                ) : (
                  <Badge variant="danger" size="sm">OFFLINE</Badge>
                )}
              </div>

              <div className="space-y-3 pt-1 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-gray-900/60 rounded-xl border border-gray-800">
                  <span className="text-gray-400 font-mono">Backend URL</span>
                  <span className="text-gray-200 font-mono font-bold">http://127.0.0.1:8000</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-900/60 rounded-xl border border-gray-800">
                  <span className="text-gray-400 font-mono">API Latency</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {pingMs !== null ? `${pingMs} ms` : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-900/60 rounded-xl border border-gray-800">
                  <span className="text-gray-400 font-mono">SQLite Total Records</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {systemInfo?.database?.total_scans ?? 0} scans
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                fullWidth
                leftIcon={Zap}
                onClick={handleTestConnection}
                isLoading={testingConn}
              >
                Test Backend Connection
              </Button>
            </Card>
          </motion.div>

          {/* Database Operations Card */}
          <motion.div variants={staggerItem}>
            <Card className="border-gray-800 bg-[#0D1322] space-y-4">
              <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" /> Database Tools
              </h3>

              <div className="space-y-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  leftIcon={RefreshCw}
                  onClick={handleRefreshDatabase}
                  isLoading={refreshingDB}
                >
                  Refresh / Seed Database
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  leftIcon={Download}
                  onClick={handleExportDatabase}
                >
                  Export Database (JSON)
                </Button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  leftIcon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={importingDB}
                >
                  Import Database (JSON)
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  leftIcon={Trash2}
                  onClick={() => setShowClearModal(true)}
                >
                  Clear All History
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right Settings Detail Panels */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: General Preferences */}
          <motion.div variants={staggerItem}>
            <Card className="border-gray-800 bg-[#0D1322] space-y-4">
              <div className="border-b border-gray-800 pb-3">
                <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" /> General Preferences
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Configure operational parameters and interface options</p>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <div className="flex items-center justify-between py-2 border-b border-gray-800/60">
                  <div>
                    <p className="font-semibold text-gray-200">System Platform Name</p>
                    <p className="text-gray-500">Global application header identifier</p>
                  </div>
                  <span className="font-mono bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800 text-gray-200">
                    AEGISX Cyber Twin
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-800/60">
                  <div>
                    <p className="font-semibold text-gray-200">Deployment Environment</p>
                    <p className="text-gray-500">Current execution target mode</p>
                  </div>
                  <Badge variant="info" size="sm">Production Local</Badge>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-semibold text-gray-200">Auto-Refresh Frequency</p>
                    <p className="text-gray-500">Background data sync interval for dashboards</p>
                  </div>
                  <select
                    value={settingsState.autoRefresh}
                    onChange={(e) => setSettingsState({ ...settingsState, autoRefresh: e.target.value })}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 font-mono text-gray-200 cursor-pointer focus:outline-none"
                  >
                    <option value="15s">Every 15s</option>
                    <option value="30s">Every 30s</option>
                    <option value="60s">Every 60s</option>
                    <option value="off">Disabled</option>
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Section 2: Theme & Aesthetic Settings */}
          <motion.div variants={staggerItem}>
            <Card className="border-gray-800 bg-[#0D1322] space-y-4">
              <div className="border-b border-gray-800 pb-3">
                <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-400" /> Theme & Aesthetic Styling
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">AEGISX design system configuration</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-gray-800/60">
                  <div>
                    <p className="font-semibold text-gray-200">Active Design Theme</p>
                    <p className="text-gray-500">AEGISX Cyber Dark Glassmorphism Mode</p>
                  </div>
                  <Badge variant="success" size="sm">AEGISX Dark Active</Badge>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-semibold text-gray-200">Accent Colors Palette</p>
                    <p className="text-gray-500">Primary UI highlight colors</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500 ring-2 ring-blue-400/50" />
                    <div className="w-5 h-5 rounded-full bg-cyan-400 opacity-60" />
                    <div className="w-5 h-5 rounded-full bg-amber-500 opacity-60" />
                    <div className="w-5 h-5 rounded-full bg-red-500 opacity-60" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Section 3: Notification Alerts */}
          <motion.div variants={staggerItem}>
            <Card className="border-gray-800 bg-[#0D1322] space-y-4">
              <div className="border-b border-gray-800 pb-3">
                <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" /> Notification & Alert Thresholds
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Configure automated threat notifications</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-gray-800/60">
                  <div>
                    <p className="font-semibold text-gray-200">Browser Toast Alerts</p>
                    <p className="text-gray-500">Show real-time toast popups on completed scans</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsState.notificationsEnabled}
                    onChange={(e) => setSettingsState({ ...settingsState, notificationsEnabled: e.target.checked })}
                    className="w-4 h-4 accent-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-semibold text-gray-200">Risk Threshold Trigger</p>
                    <p className="text-gray-500">Minimum risk level for high priority alerts</p>
                  </div>
                  <select
                    value={settingsState.riskThreshold}
                    onChange={(e) => setSettingsState({ ...settingsState, riskThreshold: e.target.value })}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 font-mono text-gray-200 cursor-pointer focus:outline-none"
                  >
                    <option value="High">High Risk Only</option>
                    <option value="Medium">Medium & High</option>
                    <option value="All">All Detections</option>
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Section 4: About Platform */}
          <motion.div variants={staggerItem}>
            <Card className="border-gray-800 bg-[#0D1322] space-y-4">
              <div className="border-b border-gray-800 pb-3">
                <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                  <Info className="w-4 h-4 text-green-400" /> About Platform
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Application metadata and versioning</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <p className="text-gray-500 font-mono uppercase text-[10px]">App Version</p>
                  <p className="font-bold text-gray-100 mt-0.5">v1.0.0</p>
                </div>
                <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <p className="text-gray-500 font-mono uppercase text-[10px]">Build Version</p>
                  <p className="font-bold text-gray-100 mt-0.5">2026.08.01</p>
                </div>
                <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <p className="text-gray-500 font-mono uppercase text-[10px]">Framework</p>
                  <p className="font-bold text-gray-100 mt-0.5">FastAPI / React</p>
                </div>
                <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <p className="text-gray-500 font-mono uppercase text-[10px]">Developer Team</p>
                  <p className="font-bold text-gray-100 mt-0.5">TEAM_TECH</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearModal && (
          <Modal
            isOpen={showClearModal}
            onClose={() => setShowClearModal(false)}
            title="Clear Scan History"
            subtitle="Permanent Database Deletion"
            size="md"
          >
            <div className="space-y-4 p-2 text-xs text-gray-300">
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
                <p>
                  This action will permanently delete all scan records, threat indicators, and reports from the SQLite database.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={Trash2}
                  onClick={handleClearHistory}
                  isLoading={clearingHistory}
                >
                  Confirm Permanent Clear
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
