import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShieldCheck, Key, Settings, LogOut, ChevronDown } from 'lucide-react';
import profileData from '../../data/profile.json';
import { Badge } from './Badge';
import { cn } from '../../utils/cn';

export const ProfileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-800/60 border border-transparent hover:border-gray-700/60 transition-all cursor-pointer select-none"
      >
        <div className="relative">
          <img
            src={profileData.avatar}
            alt={profileData.name}
            className="w-9 h-9 rounded-lg object-cover ring-2 ring-blue-500/40"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-[#030712]" />
        </div>

        <div className="hidden md:block text-left pr-1">
          <p className="text-xs font-semibold text-gray-200 leading-none">
            {profileData.name}
          </p>
          <p className="text-[10px] text-gray-400 font-mono mt-1 leading-none">
            {profileData.role}
          </p>
        </div>

        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-64 glass-panel bg-[#0D1322]/95 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden z-50 backdrop-blur-xl p-2"
          >
            {/* Header info */}
            <div className="p-3 bg-gray-900/60 rounded-xl mb-2 border border-gray-800/60">
              <p className="text-xs font-bold text-gray-100">{profileData.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{profileData.email}</p>
              
              <div className="mt-2.5 flex items-center justify-between">
                <Badge variant="success" size="sm" dot>
                  {profileData.status}
                </Badge>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  {profileData.nodeRegion}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              <button
                type="button"
                className="w-full px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-blue-400" />
                <span>Security Officer Profile</span>
              </button>

              <button
                type="button"
                className="w-full px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span>MFA Status</span>
                </div>
                <span className="text-[10px] font-mono text-green-400 font-bold">VERIFIED</span>
              </button>

              <button
                type="button"
                className="w-full px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Key className="w-4 h-4 text-amber-400" />
                <span>API Keys & Credentials</span>
              </button>

              <button
                type="button"
                className="w-full px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span>Preferences</span>
              </button>
            </div>

            <div className="my-1 border-t border-gray-800/80" />

            <button
              type="button"
              className="w-full px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Session</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
