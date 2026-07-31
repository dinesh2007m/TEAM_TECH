import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, Brain, FileText, Target,
  Code2, Terminal, KeyRound, Settings2, RefreshCcw,
  Wifi, Layers, Radio, ChevronRight, Activity,
  CheckCircle2, Clock, Info
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { RiskGauge } from '../components/phase3/RiskGauge';
import { HashCard } from '../components/phase3/HashCard';
import { IOCTable } from '../components/phase3/IOCTable';
import { AttackTimeline } from '../components/phase3/AttackTimeline';
import { staggerContainer, staggerItem } from '../utils/animations';
import analysisData from '../data/analysisMock.json';
import iocData from '../data/iocMock.json';
import mitreData from '../data/mitreMock.json';

const { analysis } = analysisData;
const { indicators } = iocData;
const { techniques } = mitreData;

const BEHAVIOR_ICONS = {
  Code2, Terminal, KeyRound, Settings2, RefreshCcw, Wifi, Layers, Radio,
};

const SEVERITY_CONFIG = {
  critical: { badge: 'critical', border: 'border-red-500/25', bg: 'bg-red-500/5' },
  high: { badge: 'danger', border: 'border-orange-500/25', bg: 'bg-orange-500/5' },
  moderate: { badge: 'warning', border: 'border-amber-500/25', bg: 'bg-amber-500/5' },
};

const TACTIC_COLORS = {
  'Initial Access': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  'Execution': 'text-red-400 bg-red-500/10 border-red-500/30',
  'Persistence': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'Defense Evasion': 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  'Credential Access': 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  'Command and Control': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  'Exfiltration': 'text-pink-400 bg-pink-500/10 border-pink-500/30',
};

function SectionHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-100">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export const ThreatAnalysis = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'behaviors', label: 'Behaviors' },
    { id: 'ioc', label: 'IOC Table' },
    { id: 'mitre', label: 'MITRE ATT&CK' },
    { id: 'ai', label: 'AI Analyst' },
    { id: 'timeline', label: 'Attack Timeline' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider text-red-400 uppercase bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">
              CRITICAL THREAT DETECTED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Threat Analysis Report
          </h1>
          <p className="text-gray-400 mt-1 text-sm font-mono">{analysis.filename} · Report #{analysis.reportId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={FileText} onClick={() => navigate('/report-details')}>
            Full Report
          </Button>
          <Button variant="cyber" size="sm" leftIcon={ChevronRight} onClick={() => navigate('/history')}>
            Scan History
          </Button>
        </div>
      </div>

      {/* Risk Summary Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { label: 'Risk Score', value: analysis.riskScore, suffix: '/100', color: 'text-red-400', border: 'border-red-500/25', bg: 'bg-red-500/8' },
          { label: 'Threat Level', value: analysis.threatLevel, suffix: '', color: 'text-red-400', border: 'border-red-500/25', bg: 'bg-red-500/8' },
          { label: 'AI Confidence', value: `${analysis.aiConfidence}%`, suffix: '', color: 'text-amber-400', border: 'border-amber-500/25', bg: 'bg-amber-500/8' },
          { label: 'IOC Count', value: indicators.length, suffix: ' IOCs', color: 'text-blue-400', border: 'border-blue-500/25', bg: 'bg-blue-500/8' },
        ].map(({ label, value, suffix, color, border, bg }) => (
          <motion.div
            key={label}
            variants={staggerItem}
            className={`glass-panel rounded-xl p-4 border ${border} ${bg} text-center`}
          >
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">{label}</p>
            <p className={`text-xl font-bold font-mono ${color}`}>{value}{suffix}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid lg:grid-cols-3 gap-6">
          {/* Risk Gauge + File Info */}
          <Card className="flex flex-col items-center text-center gap-4">
            <SectionHeader icon={Shield} title="Risk Assessment" />
            <RiskGauge score={analysis.riskScore} size={200} />
            <div className="w-full space-y-2 text-left">
              {[
                { label: 'Threat Family', value: analysis.threatFamily },
                { label: 'Threat Category', value: analysis.threatCategory },
                { label: 'Analysis Status', value: analysis.analysisStatus },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-200 font-medium text-right max-w-36 truncate">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* File Info */}
          <Card className="space-y-4">
            <SectionHeader icon={FileText} title="File Information" />
            <div className="space-y-3">
              {[
                { label: 'Filename', value: analysis.filename },
                { label: 'File Type', value: analysis.fileType },
                { label: 'File Size', value: analysis.fileSize },
                { label: 'Source', value: analysis.fileSource },
                { label: 'Upload Time', value: new Date(analysis.uploadTime).toLocaleString() },
                { label: 'Scan Time', value: new Date(analysis.scanTime).toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">{label}</p>
                  <p className="text-xs text-gray-300 font-mono break-all">{value}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Hashes */}
          <Card className="space-y-4">
            <SectionHeader icon={Activity} title="Cryptographic Hashes" subtitle="File fingerprints — click to copy" />
            <div className="space-y-3">
              <HashCard label="SHA256" hash={analysis.hashes.sha256} variant="primary" />
              <HashCard label="SHA1" hash={analysis.hashes.sha1} variant="cyan" />
              <HashCard label="MD5" hash={analysis.hashes.md5} variant="violet" />
            </div>
          </Card>
        </motion.div>
      )}

      {activeTab === 'behaviors' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 xl:grid-cols-2 gap-4"
        >
          {analysis.suspiciousBehaviors.map((beh, idx) => {
            const Icon = BEHAVIOR_ICONS[beh.icon] || Shield;
            const sev = SEVERITY_CONFIG[beh.severity] || SEVERITY_CONFIG.high;

            return (
              <motion.div
                key={beh.id}
                variants={staggerItem}
                className={`glass-panel rounded-xl p-5 border transition-all duration-200 hover:shadow-lg ${sev.border} ${sev.bg}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sev.bg} border ${sev.border}`}>
                    <Icon className="w-5 h-5 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-100">{beh.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={sev.badge} size="sm">{beh.severity.toUpperCase()}</Badge>
                        <span className="text-[10px] font-mono text-gray-500">{beh.confidence}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{beh.explanation}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {beh.status === 'confirmed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className={`text-[10px] font-semibold capitalize ${
                        beh.status === 'confirmed' ? 'text-red-400' : 'text-amber-400'
                      }`}>{beh.status}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {activeTab === 'ioc' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card noPadding>
            <div className="px-6 py-4 border-b border-gray-800/60">
              <SectionHeader icon={Target} title="Indicators of Compromise" subtitle={`${indicators.length} indicators identified`} />
            </div>
            <div className="p-6">
              <IOCTable indicators={indicators} />
            </div>
          </Card>
        </motion.div>
      )}

      {activeTab === 'mitre' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 gap-4"
        >
          {techniques.map((tech, idx) => {
            const tacticColor = TACTIC_COLORS[tech.tactic] || 'text-gray-400 bg-gray-800 border-gray-700';

            return (
              <motion.div
                key={`${tech.id}-${idx}`}
                variants={staggerItem}
                className="glass-panel rounded-xl p-5 border border-gray-800/60 hover:border-blue-500/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold font-mono text-blue-400">{tech.subId || tech.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${tacticColor}`}>
                        {tech.tactic}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-100">{tech.name}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-amber-400">{tech.confidence}%</p>
                    <p className="text-[10px] text-gray-600">confidence</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{tech.description}</p>

                {/* Confidence bar */}
                <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${tech.confidence}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.05 }}
                    className="h-full bg-gradient-to-r from-amber-600 to-orange-400 rounded-full"
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {activeTab === 'ai' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* AI Analyst Header */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-6">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Brain className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-cyan-300">AegisX AI Security Analyst</h2>
                  <Badge variant="info" size="sm" dot>AI Generated</Badge>
                </div>
                <p className="text-xs text-gray-400">Confidence: <span className="text-amber-400 font-bold">{analysis.aiConfidence}%</span> · Model: AegisX ThreatBERT v4.2</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-gray-900/60 border border-gray-800/50">
              <p className="text-sm text-gray-300 leading-relaxed">{analysis.aiAssessment.executiveSummary}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Why This File Is Suspicious', icon: AlertTriangle, content: analysis.aiAssessment.whySuspicious, color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5' },
              { label: 'Probable Attack Objective', icon: Target, content: analysis.aiAssessment.probableObjective, color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5' },
              { label: 'Estimated Attacker Sophistication', icon: Brain, content: analysis.aiAssessment.attackerSophistication, color: 'text-violet-400', border: 'border-violet-500/20', bg: 'bg-violet-500/5' },
              { label: 'Potential Business Impact', icon: Activity, content: analysis.aiAssessment.businessImpact, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
            ].map(({ label, icon: Icon, content, color, border, bg }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-panel rounded-xl p-5 border ${border} ${bg}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</h3>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{content}</p>
              </motion.div>
            ))}
          </div>

          {/* Recommended Actions */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-gray-200">Recommended Immediate Actions</h3>
            </div>
            <div className="space-y-2">
              {analysis.aiAssessment.recommendedActions.map((action, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-xs text-gray-300 leading-relaxed">{action}</p>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Priority + Containment */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass-panel rounded-xl p-5 border border-red-500/25 bg-red-500/5">
              <p className="text-xs text-red-400 uppercase tracking-wider font-bold mb-1">Analyst Priority</p>
              <p className="text-lg font-bold text-red-300">{analysis.aiAssessment.analystPriority}</p>
            </div>
            <div className="glass-panel rounded-xl p-5 border border-orange-500/25 bg-orange-500/5">
              <p className="text-xs text-orange-400 uppercase tracking-wider font-bold mb-1">Containment Decision</p>
              <p className="text-xs text-orange-300 leading-relaxed">{analysis.aiAssessment.containmentDecision}</p>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'timeline' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <SectionHeader icon={Activity} title="Attack Timeline" subtitle="Reconstructed attack chain — confirmed and predicted events" />
            <AttackTimeline events={analysis.attackTimeline} />
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};
