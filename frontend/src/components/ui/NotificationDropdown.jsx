import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, AlertCircle, ShieldAlert, Info, ChevronRight } from 'lucide-react';
import notificationsData from '../../data/notifications.json';
import { Badge } from './Badge';
import { IconButton } from './IconButton';
import { cn } from '../../utils/cn';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationsData);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const severityBadges = {
    critical: 'critical',
    high: 'danger',
    warning: 'warning',
    info: 'info',
  };

  const severityIcons = {
    critical: <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />,
    high: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <IconButton
        icon={Bell}
        variant="ghost"
        badge={unreadCount > 0 ? unreadCount : null}
        onClick={() => setIsOpen(!isOpen)}
        title="SOC Security Alerts"
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel bg-[#0D1322]/95 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden z-50 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-100 font-heading">SOC Alerts</span>
                {unreadCount > 0 && (
                  <Badge variant="critical" size="sm">
                    {unreadCount} UNREAD
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/60">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500 font-mono">
                  No active security alerts
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'p-3.5 transition-colors hover:bg-gray-800/50 flex items-start gap-3 cursor-pointer',
                      !item.read && 'bg-blue-500/5'
                    )}
                  >
                    {severityIcons[item.severity]}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h5 className="text-xs font-semibold text-gray-200 truncate">
                          {item.title}
                        </h5>
                        <span className="text-[10px] font-mono text-gray-500 shrink-0">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">
                        {item.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant={severityBadges[item.severity]} size="sm">
                          {item.severity.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] font-mono text-gray-500 uppercase">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 text-center border-t border-gray-800 bg-gray-900/60">
              <button
                type="button"
                className="text-xs font-mono text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open Intelligence Center</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
