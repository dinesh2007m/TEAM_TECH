import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  Cpu,
  Zap,
  CheckCircle2,
  Globe,
  Database,
  Layers,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { cn } from '../utils/cn';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('ciso@teamtech.cyber.sec');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const handleSignIn = (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setLoadingText('Authenticating Session Key...');

    setTimeout(() => {
      setLoadingText('Initializing Secure Session...');
    }, 600);

    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1200);
  };

  const handleDemoLogin = () => {
    setEmail('alex.vance@teamtech.cyber.sec');
    setPassword('CyberGuard#2026!');
    setIsLoading(true);
    setLoadingText('Bypassing via CISO Demo Security Clearance...');

    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 900);
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-[#F9FAFB] flex flex-col justify-between relative overflow-hidden selection:bg-blue-500/30 selection:text-blue-200">
      {/* Background Cyber Grid & Glowing Radar Orbs */}
      <div className="absolute inset-0 cyber-grid opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Logo Bar for Mobile */}
      <header className="relative z-20 px-6 py-4 flex items-center justify-between lg:hidden border-b border-gray-800/60 bg-[#030712]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-[1px] shadow-lg shadow-blue-500/30">
            <div className="w-full h-full bg-[#030712] rounded-[11px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <span className="font-bold text-lg text-white font-heading tracking-wider">
            Team<span className="text-blue-500">Tech</span>
          </span>
        </div>
        <Badge variant="primary" size="sm" dot>
          SOC v2.4
        </Badge>
      </header>

      {/* Main Split Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex items-center justify-center relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* LEFT SECTION: Cyber Illustration & Product Pitch */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-8"
          >
            {/* Header Brand */}
            <div className="hidden lg:flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-blue-400 p-[1px] shadow-xl shadow-blue-500/30 glow-blue">
                <div className="w-full h-full bg-[#030712] rounded-[15px] flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-2xl text-white font-heading tracking-wider">
                    Team<span className="text-blue-500">Tech</span>
                  </span>
                  <Badge variant="primary" size="sm" glow>
                    ENTERPRISE AI
                  </Badge>
                </div>
                <span className="text-xs text-gray-400 font-mono tracking-widest uppercase">
                  Autonomous Cyber Twin Platform
                </span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-heading leading-tight">
                Simulate Attacks. <br />
                <span className="text-gradient-primary">Protect Enterprise Assets.</span>
              </h1>
              <p className="text-base text-gray-400 font-sans max-w-xl leading-relaxed">
                Autonomous real-time AI threat analysis, zero-day payload sandbox detonation, and automated mitigation engine for Fortune 500 SOCs.
              </p>
            </div>

            {/* Interactive Cyber Illustration Canvas Graphic */}
            <div className="relative p-6 rounded-2xl glass-panel bg-[#0D1322]/80 border border-gray-800/80 overflow-hidden shadow-2xl">
              {/* Scanline line effect */}
              <motion.div
                animate={{ y: ['0%', '100%', '0%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent pointer-events-none"
              />

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800/80 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-gray-400 uppercase">Active Twin</p>
                    <p className="text-sm font-bold font-mono text-gray-100">1,420 Nodes</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800/80 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-gray-400 uppercase">Threat Efficacy</p>
                    <p className="text-sm font-bold font-mono text-green-400">99.8%</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800/80 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-gray-400 uppercase">MTTR Baseline</p>
                    <p className="text-sm font-bold font-mono text-amber-400">14m 22s</p>
                  </div>
                </div>
              </div>

              {/* Graphic Node Network Mock Visual */}
              <div className="h-28 bg-[#030712]/90 rounded-xl border border-gray-800 p-4 flex items-center justify-between relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center animate-pulse">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-200">US-EAST-PRIMARY-VPC</p>
                    <p className="text-[10px] font-mono text-gray-400">AWS / K8s Cluster Connected</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-12 bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse" />
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center">
                    <Database className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="h-0.5 w-12 bg-gradient-to-r from-cyan-400 to-green-500 animate-pulse" />
                  <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-400/50 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-green-400" />
                  </div>
                </div>

                <Badge variant="success" size="sm" dot>
                  ONLINE
                </Badge>
              </div>
            </div>

            {/* Feature Chips */}
            <div className="hidden sm:flex flex-wrap items-center gap-3 text-xs font-mono text-gray-400">
              <span className="flex items-center gap-1.5 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> SOC2 Type II Certified
              </span>
              <span className="flex items-center gap-1.5 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> ISO 27001 Compliant
              </span>
              <span className="flex items-center gap-1.5 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Zero-Trust Access
              </span>
            </div>
          </motion.div>

          {/* RIGHT SECTION: Glassmorphism Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="lg:col-span-6 xl:col-span-5 w-full"
          >
            <div className="glass-panel bg-[#0F172A]/90 border border-gray-800/90 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-2xl">
              {/* Top Accent Line */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white font-heading tracking-tight">
                  Security Gateway Sign In
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Enter your credentials to access the SOC Operations Portal
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 font-mono">
                    Security ID / Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@teamtech.cyber.sec"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-900/90 border border-gray-800 focus:border-blue-500 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
                      Passcode / Session Token
                    </label>
                    <a
                      href="#forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Password reset link dispatched to CISO security administrator.');
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-900/90 border border-gray-800 focus:border-blue-500 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer"
                    />
                    <span className="text-xs text-gray-300 font-sans">Remember session hardware key</span>
                  </label>
                </div>

                {/* Sign In Buttons */}
                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    variant="cyber"
                    size="lg"
                    isLoading={isLoading}
                    rightIcon={ArrowRight}
                    className="w-full shadow-lg shadow-blue-600/30"
                  >
                    {isLoading ? loadingText || 'Authenticating...' : 'Sign In to SOC Dashboard'}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    leftIcon={KeyRound}
                    onClick={handleDemoLogin}
                    className="w-full text-xs font-mono text-cyan-400 hover:text-cyan-300 border-cyan-900/50 hover:border-cyan-500/40"
                  >
                    ⚡ Quick Demo One-Click Access (CISO Mode)
                  </Button>
                </div>
              </form>

              {/* SSO / Social Login Divider & Placeholders */}
              <div className="mt-6 pt-6 border-t border-gray-800/80">
                <p className="text-[11px] font-mono text-center text-gray-400 uppercase tracking-wider mb-3">
                  Or authenticate with Enterprise IDP
                </p>

                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="p-2.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-xs text-gray-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="font-bold text-blue-400 font-mono">Okta</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="p-2.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-xs text-gray-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="font-bold text-cyan-400 font-mono">Azure AD</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="p-2.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-xs text-gray-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="font-bold text-emerald-400 font-mono">Google</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 px-6 py-4 border-t border-gray-800/60 bg-[#030712]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 font-mono">
          <div className="flex items-center gap-2">
            <span>© 2026 TeamTech Cyber Operations Systems, Inc.</span>
            <span className="text-gray-400">•</span>
            <span className="text-blue-400 font-semibold">Version 2.4.0-SOC</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-gray-200 transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-gray-200 transition-colors">
              Terms of Service
            </a>
            <a href="#security" onClick={(e) => e.preventDefault()} className="hover:text-gray-200 transition-colors">
              Security Compliance
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
