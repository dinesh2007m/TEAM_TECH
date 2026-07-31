import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  X,
  Send,
  User,
  UserCheck,
  Calendar,
  AlignLeft,
  Link2,
  Paperclip,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileCheck,
  ShieldCheck,
  ShieldX,
  Loader2,
  Activity,
} from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { uploadEmailFile, analyzePhishing } from '../services/emailService';
import { fadeUp, staggerContainer, staggerItem } from '../utils/animations';

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSION = '.eml';

// ─── Helper: human-readable file size ───────────────────────────────────────
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── Helper: extract file extension ─────────────────────────────────────────
function getExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}

// ─── Sub-component: drop-zone ────────────────────────────────────────────────
const DropZone = ({ onFileSelected, disabled }) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelected(file);
    },
    [disabled, onFileSelected]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <motion.div
      onClick={() => !disabled && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      animate={isDragging ? { borderColor: 'rgba(59,130,246,0.8)', scale: 1.01 } : {}}
      className={`
        relative border-2 border-dashed rounded-xl p-10 text-center
        transition-colors duration-200 select-none
        ${disabled
          ? 'border-gray-700/50 opacity-50 cursor-not-allowed'
          : 'border-gray-700 hover:border-blue-500/50 cursor-pointer'
        }
        ${isDragging ? 'bg-blue-500/5 border-blue-500/60' : 'bg-[#0D1322]/60'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".eml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          // reset so same file can be re-selected
          e.target.value = '';
        }}
        disabled={disabled}
        id="eml-file-input"
      />

      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center glow-blue">
          <UploadCloud className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <p className="text-gray-200 font-semibold text-base">
            {isDragging ? 'Drop your .eml file here' : 'Drag & drop or click to browse'}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Only <span className="text-cyan-400 font-mono">.eml</span> files · Max{' '}
            <span className="text-cyan-400 font-mono">{MAX_FILE_SIZE_MB} MB</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Sub-component: selected file chip ──────────────────────────────────────
const FileChip = ({ file, onRemove, disabled }) => (
  <motion.div
    {...fadeUp}
    className="flex items-center gap-3 bg-gray-900/70 border border-gray-700/60 rounded-lg px-4 py-3"
  >
    <FileText className="w-5 h-5 text-blue-400 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-100 truncate">{file.name}</p>
      <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
    </div>
    <button
      onClick={onRemove}
      disabled={disabled}
      className="text-gray-500 hover:text-red-400 transition-colors disabled:opacity-30 cursor-pointer"
      aria-label="Remove file"
    >
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

// ─── Sub-component: validation error banner ──────────────────────────────────
const ErrorBanner = ({ message }) => (
  <motion.div
    {...fadeUp}
    className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"
  >
    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
    <p className="text-sm text-red-300">{message}</p>
  </motion.div>
);

// ─── Sub-component: info row ─────────────────────────────────────────────────
const InfoRow = ({ Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-blue-400" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-gray-100 break-words">{value || <span className="text-gray-600 italic">—</span>}</p>
    </div>
  </div>
);

// ─── Sub-component: body text block ─────────────────────────────────────────
const BodyBlock = ({ text, html }) => {
  const content = text || html;
  return (
    <div className="rounded-lg bg-gray-900/60 border border-gray-800 p-4 max-h-60 overflow-y-auto">
      {content ? (
        <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words font-mono leading-relaxed">
          {content}
        </pre>
      ) : (
        <p className="text-xs text-gray-600 italic">No body content.</p>
      )}
    </div>
  );
};

// ─── Sub-component: URL list ─────────────────────────────────────────────────
const UrlList = ({ urls }) => {
  if (!urls?.length) {
    return <p className="text-sm text-gray-600 italic">No URLs extracted.</p>;
  }
  return (
    <motion.ul variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
      {urls.map((url, i) => (
        <motion.li key={i} variants={staggerItem}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors break-all"
          >
            <Link2 className="w-3.5 h-3.5 shrink-0" />
            {url}
          </a>
        </motion.li>
      ))}
    </motion.ul>
  );
};

// ─── Sub-component: attachment list ─────────────────────────────────────────
const AttachmentList = ({ attachments }) => {
  if (!attachments?.length) {
    return <p className="text-sm text-gray-600 italic">No attachments found.</p>;
  }
  return (
    <motion.ul variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
      {attachments.map((att, i) => (
        <motion.li key={i} variants={staggerItem}>
          <div className="flex items-center gap-3 bg-gray-900/50 border border-gray-800 rounded-lg px-3 py-2">
            <Paperclip className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 truncate font-medium">
                {att.filename || att.name || 'Unknown file'}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                {(att.extension || att.content_type) && (
                  <Badge variant="secondary" size="sm" className="font-mono">
                    {att.extension || att.content_type}
                  </Badge>
                )}
                {att.size !== undefined && (
                  <span className="text-xs text-gray-500">{formatBytes(att.size)}</span>
                )}
              </div>
            </div>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );
};

// ─── Sub-component: section card wrapper ─────────────────────────────────────
const SectionCard = ({ icon: Icon, title, badge, children }) => (
  <Card noPadding>
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800/80">
      <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-blue-400" />
      </div>
      <span className="text-sm font-semibold text-gray-100">{title}</span>
      {badge}
    </div>
    <div className="px-5 py-4">{children}</div>
  </Card>
);

// ─── Main Upload Page ────────────────────────────────────────────────────────
export const Upload = () => {
  const { addToast } = useToast();

  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [parsedEmail, setParsedEmail] = useState(null);
  const [emailId, setEmailId] = useState(null);
  // Phase 3 – phishing analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [phishingResult, setPhishingResult] = useState(null);

  // ── Validate file client-side ──────────────────────────────────────────────
  const validateFile = useCallback((file) => {
    if (!file) return 'Please select a file.';
    if (!file.name.toLowerCase().endsWith(ALLOWED_EXTENSION)) {
      return `Invalid file type "${getExtension(file.name)}". Only .eml files are accepted.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File is too large (${formatBytes(file.size)}). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`;
    }
    return '';
  }, []);

  // ── File selected (from drop-zone or input) ───────────────────────────────
  const handleFileSelected = useCallback(
    (file) => {
      const error = validateFile(file);
      setValidationError(error);
      setSelectedFile(file);
      setParsedEmail(null);
      setEmailId(null);
      if (!error) {
        console.log('[Upload] File selected:', file.name, formatBytes(file.size));
      }
    },
    [validateFile]
  );

  // ── Remove selected file ──────────────────────────────────────────────────
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setValidationError('');
    setParsedEmail(null);
    setEmailId(null);
    setPhishingResult(null);
  }, []);

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    // Final pre-upload validation
    if (!selectedFile) {
      setValidationError('Please select a file before uploading.');
      return;
    }
    const error = validateFile(selectedFile);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError('');
    setIsUploading(true);
    setParsedEmail(null);
    setPhishingResult(null);
    console.log('[Upload] Uploading...');

    try {
      // ── Step 1: Upload & parse the .eml file ─────────────────────────────
      const data = await uploadEmailFile(selectedFile);
      console.log('[Upload] Upload response:', data);

      setParsedEmail(data.parsed_email);
      setEmailId(data.email_id);

      addToast({
        title: 'Email Parsed Successfully',
        description: `Email ID: ${data.email_id}`,
        type: 'success',
      });

      // ── Step 2: Automatically run phishing analysis ───────────────────────
      setIsUploading(false);
      setIsAnalyzing(true);
      console.log('[Upload] Running phishing analysis...');

      try {
        const analysis = await analyzePhishing(data.parsed_email);
        console.log('[Upload] Phishing analysis response:', analysis);
        setPhishingResult(analysis);
        addToast({
          title: 'Phishing Analysis Complete',
          description: `${analysis.indicator_count} indicator(s) detected · Risk: ${analysis.risk_level}`,
          type: analysis.risk_level === 'High' ? 'error' : analysis.risk_level === 'Medium' ? 'warning' : 'success',
          duration: 6000,
        });
      } catch (analysisErr) {
        console.error('[Upload] Phishing analysis error:', analysisErr);
        addToast({
          title: 'Phishing Analysis Failed',
          description: analysisErr.message,
          type: 'error',
          duration: 6000,
        });
      } finally {
        setIsAnalyzing(false);
      }
    } catch (err) {
      console.error('[Upload] Upload error:', err);
      setValidationError(err.message || 'An unexpected error occurred.');
      addToast({
        title: 'Upload Failed',
        description: err.message,
        type: 'error',
        duration: 6000,
      });
      setIsUploading(false);
    }
  }, [selectedFile, validateFile, addToast]);

  const canUpload = selectedFile && !validationError && !isUploading && !isAnalyzing;

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <PageHeader
        title="Email Phishing Analysis"
        subtitle="Upload a raw .eml file to extract headers, body, URLs, and attachments"
        badgeText="UPLOAD MODULE"
        badgeVariant="primary"
        actions={
          parsedEmail && (
            <Badge variant="success" size="md" dot>
              Analysis Complete
            </Badge>
          )
        }
      />

      {/* ── Upload Card ───────────────────────────────────────────────── */}
      <Card>
        <div className="space-y-4">
          {/* Drop Zone */}
          <DropZone onFileSelected={handleFileSelected} disabled={isUploading} />

          {/* Selected file chip */}
          <AnimatePresence>
            {selectedFile && (
              <FileChip
                file={selectedFile}
                onRemove={handleRemoveFile}
                disabled={isUploading}
              />
            )}
          </AnimatePresence>

          {/* Validation error */}
          <AnimatePresence>
            {validationError && <ErrorBanner message={validationError} />}
          </AnimatePresence>

          {/* Upload button */}
          <div className="flex justify-end">
            <Button
              variant="cyber"
              size="lg"
              leftIcon={isUploading || isAnalyzing ? undefined : Send}
              isLoading={isUploading || isAnalyzing}
              isDisabled={!canUpload}
              onClick={handleUpload}
              glow={canUpload}
              id="upload-submit-button"
            >
              {isUploading ? 'Uploading...' : isAnalyzing ? 'Analysing...' : 'Upload & Analyse'}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Results Section ───────────────────────────────────────────── */}
      <AnimatePresence>
        {parsedEmail && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {/* Result header */}
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <h2 className="text-base font-semibold text-gray-200">Parsed Email Results</h2>
              {emailId && (
                <Badge variant="secondary" size="sm" className="font-mono ml-auto">
                  ID: {emailId}
                </Badge>
              )}
            </div>

            {/* ── Email Metadata ─── */}
            <SectionCard
              icon={FileCheck}
              title="Email Headers"
              badge={<Badge variant="info" size="sm">METADATA</Badge>}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoRow Icon={User} label="Sender" value={parsedEmail.sender} />
                <InfoRow Icon={UserCheck} label="Receiver" value={parsedEmail.receiver} />
                <InfoRow Icon={ShieldAlert} label="Subject" value={parsedEmail.subject} />
                <InfoRow Icon={Calendar} label="Date" value={parsedEmail.date} />
              </div>
            </SectionCard>

            {/* ── Body ─── */}
            <SectionCard
              icon={AlignLeft}
              title="Email Body"
              badge={
                parsedEmail.body_html
                  ? <Badge variant="warning" size="sm">HTML</Badge>
                  : <Badge variant="secondary" size="sm">PLAIN TEXT</Badge>
              }
            >
              <BodyBlock text={parsedEmail.body_text} html={parsedEmail.body_html} />
            </SectionCard>

            {/* ── URLs ─── */}
            <SectionCard
              icon={Link2}
              title="Extracted URLs"
              badge={
                <Badge
                  variant={parsedEmail.urls?.length ? 'danger' : 'secondary'}
                  size="sm"
                >
                  {parsedEmail.urls?.length ?? 0} found
                </Badge>
              }
            >
              <UrlList urls={parsedEmail.urls} />
            </SectionCard>

            {/* ── Attachments ─── */}
            <SectionCard
              icon={Paperclip}
              title="Attachments"
              badge={
                <Badge
                  variant={parsedEmail.attachments?.length ? 'warning' : 'secondary'}
                  size="sm"
                >
                  {parsedEmail.attachments?.length ?? 0} found
                </Badge>
              }
            >
              <AttachmentList attachments={parsedEmail.attachments} />
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phishing Analysis Loading ──────────────────────────────────── */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <div className="flex items-center justify-center gap-4 py-6">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-200">Running Phishing Analysis…</p>
                  <p className="text-xs text-gray-500 mt-0.5">Checking 15 detection rules against the parsed email</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phishing Analysis Results ──────────────────────────────────── */}
      <AnimatePresence>
        {phishingResult && (
          <motion.div
            key="phishing-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {/* Section header */}
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-semibold text-gray-200">Phishing Analysis Results</h2>
            </div>

            {/* ── Risk Summary Card ── */}
            <PhishingRiskSummary
              riskLevel={phishingResult.risk_level}
              indicatorCount={phishingResult.indicator_count}
            />

            {/* ── Indicator Cards ── */}
            {phishingResult.indicators?.length > 0 && (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-3"
              >
                {phishingResult.indicators.map((indicator, i) => (
                  <motion.div key={i} variants={staggerItem}>
                    <PhishingIndicatorCard indicator={indicator} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {phishingResult.indicators?.length === 0 && (
              <Card className="border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-3 py-2">
                  <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-300">No Phishing Indicators Detected</p>
                    <p className="text-xs text-gray-500 mt-0.5">This email passed all 15 detection rules.</p>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Phishing Risk Summary Card ───────────────────────────────────────────────
const RISK_CONFIG = {
  High:   { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-300',    badge: 'danger',   icon: ShieldX },
  Medium: { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-300',  badge: 'warning',  icon: ShieldAlert },
  Low:    { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-300',  badge: 'success',  icon: ShieldCheck },
};

const PhishingRiskSummary = ({ riskLevel, indicatorCount }) => {
  const cfg = RISK_CONFIG[riskLevel] ?? RISK_CONFIG.Low;
  const RiskIcon = cfg.icon;
  return (
    <Card noPadding className={`${cfg.bg} ${cfg.border}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 px-6 py-5">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${cfg.border} ${cfg.bg}`}>
          <RiskIcon className={`w-7 h-7 ${cfg.text}`} />
        </div>

        {/* Labels */}
        <div className="flex-1 space-y-1">
          <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Overall Risk Level</p>
          <p className={`text-3xl font-extrabold tracking-tight font-heading ${cfg.text}`}>
            {riskLevel.toUpperCase()}
          </p>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-12 bg-gray-700/60" />

        {/* Count */}
        <div className="space-y-1 sm:text-right">
          <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Indicators Found</p>
          <div className="flex sm:justify-end items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <p className="text-3xl font-extrabold tracking-tight text-gray-100 font-heading">
              {indicatorCount}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ─── Single Indicator Card ────────────────────────────────────────────────────
const SEVERITY_STYLE = {
  High:   { badge: 'danger',   bar: 'bg-red-500',    label: 'text-red-400' },
  Medium: { badge: 'warning',  bar: 'bg-amber-500',   label: 'text-amber-400' },
  Low:    { badge: 'success',  bar: 'bg-green-500',   label: 'text-green-400' },
};

const PhishingIndicatorCard = ({ indicator }) => {
  const sty = SEVERITY_STYLE[indicator.severity] ?? SEVERITY_STYLE.Low;
  return (
    <Card noPadding hoverEffect={false} glowOnHover={false}>
      {/* Left severity accent bar */}
      <div className="flex items-stretch">
        <div className={`w-1 rounded-l-xl shrink-0 ${sty.bar}`} />
        <div className="flex-1 px-5 py-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-sm font-semibold text-gray-100">{indicator.name}</p>
            <Badge variant={sty.badge} size="sm" className="shrink-0">
              {indicator.severity}
            </Badge>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{indicator.reason}</p>
        </div>
      </div>
    </Card>
  );
};
