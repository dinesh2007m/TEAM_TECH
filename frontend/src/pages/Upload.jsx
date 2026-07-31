import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud, FileText, Archive, FileCode, Mail, File,
  X, Zap, Search, Play, AlertTriangle, CheckCircle2,
  Clock, Shield, ChevronRight, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import uploadData from '../data/uploadMock.json';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem, pulseGlow } from '../utils/animations';

const FILE_ICONS = {
  '.docm': FileText,
  '.docx': FileText,
  '.pdf': FileText,
  '.eml': Mail,
  '.zip': Archive,
  '.exe': FileCode,
  '.js': FileCode,
};

const RISK_CONFIG = {
  critical: { variant: 'critical', label: 'CRITICAL', color: 'text-red-400' },
  high: { variant: 'danger', label: 'HIGH', color: 'text-red-400' },
  moderate: { variant: 'warning', label: 'MODERATE', color: 'text-amber-400' },
  low: { variant: 'success', label: 'LOW', color: 'text-green-400' },
};

const SUPPORTED_TYPES = ['.eml', '.pdf', '.docx', '.docm', '.zip', '.exe', '.js'];

export const Upload = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mockFileIndex, setMockFileIndex] = useState(0);
  const fileInputRef = useRef(null);

  const { mockFiles, recentHistory } = uploadData;

  const selectMockFile = (file) => {
    setSelectedFile(file);
    addToast({ title: 'File Selected', description: `${file.filename} ready for analysis.`, type: 'success' });
  };

  const handleQuickUpload = () => {
    const file = mockFiles[mockFileIndex % mockFiles.length];
    setMockFileIndex(i => i + 1);
    selectMockFile(file);
  };

  const handleBrowse = () => {
    // Select a random mock file to simulate browse
    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    selectMockFile(randomFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleQuickUpload();
  };

  const handleAnalyze = () => {
    if (!selectedFile) {
      addToast({ title: 'No File Selected', description: 'Please select a file before starting analysis.', type: 'warning' });
      return;
    }
    navigate('/scan');
  };

  const getFileIcon = (ext) => FILE_ICONS[ext] || File;
  const getRisk = (risk) => RISK_CONFIG[risk] || RISK_CONFIG.low;

  const getScanStatusConfig = (status) => {
    switch (status) {
      case 'completed': return { icon: CheckCircle2, color: 'text-green-400', label: 'Scanned' };
      case 'pending': return { icon: Clock, color: 'text-amber-400', label: 'Pending' };
      default: return { icon: AlertTriangle, color: 'text-gray-500', label: status };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider text-blue-400 uppercase bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
              Upload Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            AI-Powered Threat Analysis
          </h1>
          <p className="text-gray-400 mt-1 text-sm max-w-2xl">
            Submit suspicious files and emails for instant AI-driven malware detection, MITRE ATT&CK mapping, and enterprise threat reporting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-green-400">AI Engine Online</span>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
          isDragging
            ? 'border-blue-400 bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.25)]'
            : 'border-gray-700/60 hover:border-blue-500/40 hover:bg-blue-500/5'
        }`}
      >
        {/* Animated background grid */}
        <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

        {/* Pulsing glow ring */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.05) 0%, transparent 70%)' }}
        />

        <div className="relative p-10 sm:p-14 flex flex-col items-center text-center gap-5">
          {/* Upload Icon with pulse */}
          <motion.div
            animate={pulseGlow.animate}
            className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center"
          >
            <motion.div
              animate={{ y: isDragging ? -4 : [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <UploadCloud className="w-9 h-9 text-blue-400" />
            </motion.div>
          </motion.div>

          <div>
            <h3 className="text-lg font-bold text-gray-100">
              {isDragging ? 'Release to Select File' : 'Drop your suspicious file here'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Drag & drop, or use the buttons below to select a mock file for analysis
            </p>
          </div>

          {/* Supported types */}
          <div className="flex flex-wrap gap-2 justify-center">
            {SUPPORTED_TYPES.map((type) => (
              <span
                key={type}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-800/80 border border-gray-700/50 text-gray-400 font-mono font-medium"
              >
                {type}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-1">
            <Button
              variant="cyber"
              size="md"
              leftIcon={Zap}
              onClick={handleQuickUpload}
              glow
            >
              Quick Upload
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={Search}
              onClick={handleBrowse}
            >
              Browse Files
            </Button>
            {selectedFile && (
              <Button
                variant="ghost"
                size="md"
                leftIcon={X}
                onClick={() => setSelectedFile(null)}
                className="text-gray-400"
              >
                Clear Selection
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Selected File Card */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="glass-panel rounded-2xl border border-blue-500/30 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.12)]">
              {/* Top accent bar */}
              <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600" />
              <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

              <div className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    {(() => {
                      const Icon = getFileIcon(selectedFile.extension);
                      return (
                        <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                          <Icon className="w-6 h-6 text-blue-400" />
                        </div>
                      );
                    })()}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-100">{selectedFile.filename}</h3>
                        <Badge variant="primary" size="sm">{selectedFile.extension.toUpperCase()}</Badge>
                        <Badge variant={getRisk(selectedFile.risk).variant} size="sm" dot>
                          {getRisk(selectedFile.risk).label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{selectedFile.category} · {selectedFile.size}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Source: {selectedFile.source} · {selectedFile.sender}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* File preview info */}
                <div className="mt-4 p-3 rounded-xl bg-gray-900/50 border border-gray-800/50">
                  <p className="text-xs text-gray-400 leading-relaxed">{selectedFile.preview}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedFile.tags?.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800/80 border border-gray-700/50 text-gray-500 font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-800/50">
                  {[
                    { label: 'File Size', value: selectedFile.size },
                    { label: 'Category', value: selectedFile.category },
                    { label: 'Status', value: 'Ready for Analysis' },
                    { label: 'Upload Time', value: new Date(selectedFile.uploadTime).toLocaleTimeString() },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">{label}</p>
                      <p className="text-xs text-gray-300 mt-0.5 font-medium truncate">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Analyze Button */}
                <div className="mt-5">
                  <Button
                    variant="cyber"
                    size="lg"
                    leftIcon={Sparkles}
                    rightIcon={ChevronRight}
                    onClick={handleAnalyze}
                    glow
                    className="w-full sm:w-auto"
                  >
                    Analyze Now — Start AI Scan
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyze Now floating button when no file is selected */}
      {!selectedFile && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            size="md"
            leftIcon={Play}
            onClick={handleAnalyze}
            className="opacity-40 cursor-not-allowed"
            isDisabled
          >
            Select a file to enable analysis
          </Button>
        </div>
      )}

      {/* Mock File Selection Panel */}
      <Card noPadding>
        <div className="px-6 py-4 border-b border-gray-800/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-200">Select Mock File for Analysis</h3>
            <p className="text-xs text-gray-500 mt-0.5">Choose from realistic threat samples to simulate a security scan</p>
          </div>
          <Shield className="w-5 h-5 text-blue-400/60" />
        </div>
        <div className="p-6">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {mockFiles.map((file) => {
              const Icon = getFileIcon(file.extension);
              const risk = getRisk(file.risk);
              const isSelected = selectedFile?.id === file.id;

              return (
                <motion.div
                  key={file.id}
                  variants={staggerItem}
                  whileHover={{ y: -2 }}
                  onClick={() => selectMockFile(file)}
                  className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500/60 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                      : 'border-gray-800/60 bg-gray-900/40 hover:border-blue-500/30 hover:bg-gray-800/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-gray-800/80 border border-gray-700/50'
                    }`}>
                      <Icon className={`w-4.5 h-4.5 ${isSelected ? 'text-blue-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-200 truncate">{file.filename}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{file.size} · {file.source}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Badge variant={risk.variant} size="sm">{risk.label}</Badge>
                        <Badge variant="secondary" size="sm">{file.extension}</Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </Card>

      {/* Recent Upload History */}
      <Card noPadding>
        <div className="px-6 py-4 border-b border-gray-800/60">
          <h3 className="text-sm font-bold text-gray-200">Recent Uploaded Files</h3>
          <p className="text-xs text-gray-500 mt-0.5">Previously submitted files and their scan results</p>
        </div>
        <div className="divide-y divide-gray-800/40">
          {recentHistory.map((file, idx) => {
            const Icon = getFileIcon(file.extension);
            const risk = getRisk(file.risk);
            const statusConf = getScanStatusConfig(file.scanStatus);
            const StatusIcon = statusConf.icon;

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-800/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-800/70 border border-gray-700/50 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-300 truncate">{file.filename}</p>
                  <p className="text-[10px] text-gray-600">{file.size} · {file.uploadDate}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={risk.variant} size="sm">{risk.label}</Badge>
                  <div className={`flex items-center gap-1 ${statusConf.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium">{statusConf.label}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
};
