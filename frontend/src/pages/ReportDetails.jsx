import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Shield, AlertTriangle, Brain, Download,
  Printer, Share2, CheckCircle2, ChevronRight, Monitor,
  User, Building, HardDrive, AppWindow, Database,
  Activity, Target, Lock, RotateCcw, Copy
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { RiskGauge } from '../components/phase3/RiskGauge';
import { HashCard } from '../components/phase3/HashCard';
import { IOCTable } from '../components/phase3/IOCTable';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem } from '../utils/animations';
import reportData from '../data/reportMock.json';
import analysisData from '../data/analysisMock.json';
import iocData from '../data/iocMock.json';
import mitreData from '../data/mitreMock.json';

const { report } = reportData;
const { analysis } = analysisData;
const { indicators } = iocData;
const { techniques } = mitreData;

function SectionCard({ title, icon: Icon, children, id }) {
  return (
    <div id={id} className="glass-panel rounded-2xl border border-gray-800/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800/60 flex items-center gap-3 bg-gray-900/50">
        <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

const TACTIC_COLORS = {
  'Initial Access': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  'Execution': 'text-red-400 bg-red-500/10 border-red-500/30',
  'Persistence': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'Defense Evasion': 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  'Credential Access': 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  'Command and Control': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  'Exfiltration': 'text-pink-400 bg-pink-500/10 border-pink-500/30',
};

export const ReportDetails = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [shareModal, setShareModal] = useState(false);

  const handleExport = (type) => {
    const messages = {
      pdf: { title: 'PDF Export Initiated', description: 'AX-2024-1218-0047.pdf is being generated...', type: 'success' },
      json: { title: 'JSON Download Ready', description: 'Report data exported as threat_report_AX-2024-1218-0047.json', type: 'success' },
      print: { title: 'Print Dialog', description: 'Opening print dialog for formatted report view...', type: 'info' },
    };
    addToast(messages[type] || { title: 'Action Triggered', type: 'info' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-800/60 bg-gradient-to-br from-gray-900/90 to-gray-950/90 p-6">
        <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          {/* Report ID & Title */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-bold tracking-wider text-red-400 uppercase bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">
                CRITICAL THREAT
              </span>
              <span className="text-xs font-mono text-gray-600">Report ID: {report.reportId}</span>
              <span className="text-xs text-gray-600">v{report.version}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight max-w-2xl">{report.reportTitle}</h1>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
              <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
              <span>·</span>
              <span>Analyst: {report.analyst}</span>
              <span>·</span>
              <span>Reviewed by: {report.reviewedBy}</span>
            </div>
            <div className="mt-2">
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {report.classification}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="secondary" size="sm" leftIcon={Download} onClick={() => handleExport('pdf')}>
              Export PDF
            </Button>
            <Button variant="secondary" size="sm" leftIcon={Copy} onClick={() => handleExport('json')}>
              Download JSON
            </Button>
            <Button variant="secondary" size="sm" leftIcon={Printer} onClick={() => handleExport('print')}>
              Print
            </Button>
            <Button variant="outline" size="sm" leftIcon={Share2} onClick={() => setShareModal(true)}>
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* 1. Executive Summary */}
      <SectionCard title="Executive Summary" icon={FileText} id="executive-summary">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15">
            <p className="text-sm text-gray-300 leading-relaxed">{report.executiveSummary.summary}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-1">Business Impact</p>
              <p className="text-xs text-gray-300">{report.executiveSummary.businessImpact}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-1">Primary Risk</p>
              <p className="text-xs text-gray-300">{report.executiveSummary.primaryRisk}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-1">Recommended Priority</p>
              <p className="text-xs text-red-400 font-semibold">{report.executiveSummary.recommendedPriority}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 2. Threat Overview + Risk Score */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Threat Overview" icon={AlertTriangle} id="threat-overview">
          <div className="space-y-3">
            {[
              { label: 'Threat Family', value: analysis.threatFamily },
              { label: 'Threat Category', value: analysis.threatCategory },
              { label: 'Threat Level', value: analysis.threatLevel, badge: 'critical' },
              { label: 'AI Confidence', value: `${analysis.aiConfidence}%` },
              { label: 'Detection Status', value: analysis.analysisStatus },
            ].map(({ label, value, badge }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-800/30">
                <span className="text-xs text-gray-500">{label}</span>
                {badge ? <Badge variant={badge} size="sm">{value}</Badge> : <span className="text-xs text-gray-200 font-medium">{value}</span>}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Risk Score" icon={Shield} id="risk-score">
          <div className="flex flex-col items-center gap-4">
            <RiskGauge score={analysis.riskScore} size={180} />
            <div className="w-full space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">Risk Classification</span>
                <Badge variant="critical" size="sm">CRITICAL</Badge>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Score of 87/100 indicates active, confirmed malware with credential theft capability, C2 connectivity, and high probability of ransomware deployment. Immediate isolation required.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 3. File Information + Hashes */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="File Information" icon={FileText} id="file-info">
          <div className="space-y-2.5">
            {[
              { label: 'Filename', value: analysis.filename },
              { label: 'File Type', value: analysis.fileType },
              { label: 'File Size', value: analysis.fileSize },
              { label: 'File Source', value: analysis.fileSource },
              { label: 'Upload Time', value: new Date(analysis.uploadTime).toLocaleString() },
              { label: 'Scan Time', value: new Date(analysis.scanTime).toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">{label}</p>
                <p className="text-xs text-gray-300 font-mono">{value}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Cryptographic Hashes" icon={Activity} id="hashes">
          <div className="space-y-3">
            <HashCard label="SHA256" hash={analysis.hashes.sha256} variant="primary" />
            <HashCard label="SHA1" hash={analysis.hashes.sha1} variant="cyan" />
            <HashCard label="MD5" hash={analysis.hashes.md5} variant="violet" />
          </div>
        </SectionCard>
      </div>

      {/* 4. IOC Table */}
      <SectionCard title={`Indicators of Compromise (${indicators.length})`} icon={Target} id="ioc">
        <IOCTable indicators={indicators} />
      </SectionCard>

      {/* 5. MITRE ATT&CK Mapping */}
      <SectionCard title="MITRE ATT&CK Mapping" icon={Brain} id="mitre">
        <div className="grid sm:grid-cols-2 gap-3">
          {techniques.map((tech, idx) => {
            const tacticColor = TACTIC_COLORS[tech.tactic] || 'text-gray-400 bg-gray-800 border-gray-700';
            return (
              <motion.div
                key={`${tech.id}-${idx}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="p-4 rounded-xl border border-gray-800/60 bg-gray-900/30 hover:border-blue-500/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold font-mono text-blue-400">{tech.subId || tech.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${tacticColor}`}>{tech.tactic}</span>
                </div>
                <p className="text-xs font-semibold text-gray-200">{tech.name}</p>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{tech.description}</p>
              </motion.div>
            );
          })}
        </div>
      </SectionCard>

      {/* 6. Affected Assets */}
      <SectionCard title="Affected Assets" icon={Monitor} id="assets">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Monitor, label: 'Device', value: `${report.affectedAssets.device} (${report.affectedAssets.hostname})` },
            { icon: User, label: 'User Account', value: report.affectedAssets.userAccount },
            { icon: Building, label: 'Department', value: report.affectedAssets.department },
            { icon: User, label: 'User Role', value: report.affectedAssets.userRole },
            { icon: HardDrive, label: 'Operating System', value: report.affectedAssets.operatingSystem },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="p-3 rounded-xl bg-gray-900/40 border border-gray-800/50">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-blue-400/70" />
                <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">{label}</p>
              </div>
              <p className="text-xs text-gray-300 font-mono">{value}</p>
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-3.5 h-3.5 text-red-400" />
              <p className="text-[10px] text-red-400 uppercase tracking-wider font-semibold">Sensitive Data Exposure</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {report.affectedAssets.sensitiveDataExposure.map((item) => (
                <span key={item} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 7. Recommended Actions */}
      <SectionCard title="Recommended Actions" icon={CheckCircle2} id="actions">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {report.recommendedActions.map((action, i) => (
            <motion.div
              key={action.id}
              variants={staggerItem}
              className="flex items-start gap-4 p-4 rounded-xl border border-gray-800/40 bg-gray-900/30 hover:border-blue-500/25 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                {action.priority}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-200">{action.action}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600">{action.owner}</span>
                    <Badge variant={action.deadline === 'Immediate' ? 'critical' : 'warning'} size="sm">
                      {action.deadline}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{action.details}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </SectionCard>

      {/* 8. Containment + Recovery Steps */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Containment Steps" icon={Lock} id="containment">
          <div className="space-y-2">
            {report.containmentSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-gray-300">
                <span className="text-blue-400 font-mono font-bold shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                <span className="leading-relaxed">{step.replace(/^Step \d+: /, '')}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recovery Steps" icon={RotateCcw} id="recovery">
          <div className="space-y-2">
            {report.recoverySteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-gray-300">
                <span className="text-green-400 font-mono font-bold shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                <span className="leading-relaxed">{step.replace(/^Step \d+: /, '')}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-3 justify-between pt-2">
        <Button variant="secondary" size="sm" onClick={() => navigate('/threat-analysis')}>
          ← Back to Analysis
        </Button>
        <Button variant="cyber" size="sm" leftIcon={ChevronRight} onClick={() => navigate('/history')}>
          View Scan History
        </Button>
      </div>

      {/* Share Modal */}
      <Modal
        isOpen={shareModal}
        onClose={() => setShareModal(false)}
        title="Share Report"
        subtitle="Generate a secure shareable link for this threat report"
        footer={
          <Button
            variant="cyber"
            size="sm"
            onClick={() => {
              setShareModal(false);
              addToast({ title: 'Secure Link Generated', description: 'Report link copied to clipboard. Expires in 24 hours.', type: 'success' });
            }}
          >
            Generate Secure Link
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 font-mono text-xs text-gray-400 break-all">
            https://aegisx.soc/r/{report.reportId}?token=eyJ...
          </div>
          <p className="text-xs text-gray-500">Shareable links are encrypted, access-controlled, and expire after 24 hours. Recipient will require SOC authentication to view.</p>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="expiry" className="rounded" defaultChecked />
            <label htmlFor="expiry" className="text-xs text-gray-400">Require MFA to access this report</label>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
