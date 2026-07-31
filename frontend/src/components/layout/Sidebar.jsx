import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LayoutDashboard,
  UploadCloud,
  Cpu,
  GitFork,
  FileText,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
} from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

const menuItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    category: 'MAIN OPERATIVE',
  },
  {
    id: 'upload',
    title: 'Upload Scan',
    path: '/upload',
    icon: UploadCloud,
    badge: 'NEW',
    badgeVariant: 'primary',
    category: 'MAIN OPERATIVE',
  },
  {
    id: 'digital-twin',
    title: 'Digital Twin',
    path: '/digital-twin',
    icon: Cpu,
    badge: 'LIVE',
    badgeVariant: 'success',
    category: 'SIMULATION',
  },
  {
    id: 'attack-graph',
    title: 'Attack Graph',
    path: '/attack-graph',
    icon: GitFork,
    badge: 'AI',
    badgeVariant: 'warning',
    category: 'SIMULATION',
  },
  {
    id: 'reports',
    title: 'Reports',
    path: '/reports',
    icon: FileText,
    category: 'INTELLIGENCE',
  },
  {
    id: 'history',
    title: 'Scan History',
    path: '/history',
    icon: History,
    category: 'INTELLIGENCE',
  },
  {
    id: 'analytics',
    title: 'Threat Analytics',
    path: '/analytics',
    icon: BarChart3,
    category: 'INTELLIGENCE',
  },
  {
    id: 'settings',
    title: 'Settings',
    path: '/settings',
    icon: Settings,
    category: 'SYSTEM',
  },
];

export const Sidebar = () => {
  const { isCollapsed, toggleSidebar, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const location = useLocation();

  const sidebarVariants = {
    expanded: { width: '280px' },
    collapsed: { width: '80px' },
  };

  const renderContent = () => (
    <div className="flex flex-col h-full bg-[#111827]/90 backdrop-blur-2xl border-r border-gray-800/80 relative z-40 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-blue-400 p-[1px] shadow-lg shadow-blue-500/25 shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-[#030712] rounded-[11px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white font-heading tracking-wider">
                  AEGIS<span className="text-blue-500">X</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                  v2.4
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                AI Cyber Twin
              </span>
            </motion.div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden text-gray-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden space-y-1 px-3">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === '/dashboard' && location.pathname === '/');

          const showCategoryHeader =
            !isCollapsed &&
            (idx === 0 || menuItems[idx - 1].category !== item.category);

          return (
            <React.Fragment key={item.id}>
              {showCategoryHeader && (
                <div className="px-3 pt-4 pb-1 text-[10px] font-mono uppercase tracking-widest text-gray-500">
                  {item.category}
                </div>
              )}

              <NavLink
                to={item.path}
                className={({ isActive: isSelfActive }) => {
                  const active = isActive || isSelfActive;
                  return cn(
                    'relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer',
                    active
                      ? 'bg-blue-600/15 text-white font-semibold shadow-inner border border-blue-500/30'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 border border-transparent'
                  );
                }}
              >
                {/* Active Neon Glow Line */}
                {isActive && (
                  <motion.div
                    layoutId="activeGlowLine"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.9)]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-200'
                    )}
                  />
                </div>

                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-between min-w-0"
                  >
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <Badge variant={item.badgeVariant || 'primary'} size="sm" dot>
                        {item.badge}
                      </Badge>
                    )}
                  </motion.div>
                )}
              </NavLink>
            </React.Fragment>
          );
        })}
      </div>

      {/* Cyber System Status Banner */}
      {!isCollapsed && (
        <div className="p-3 mx-3 mb-4 rounded-xl bg-gradient-to-b from-gray-900/90 to-blue-950/40 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-gray-200 font-mono">SOC Engine</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-snug">
            Digital Twin status is operational with zero latent threats.
          </p>
        </div>
      )}

      {/* Desktop Collapse Toggle Footer */}
      <div className="hidden md:flex p-3 border-t border-gray-800/80 items-center justify-end">
        <button
          onClick={toggleSidebar}
          className="w-full py-2 flex items-center justify-center gap-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white hover:bg-gray-800/70 border border-gray-800 hover:border-gray-700 transition-all cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Animated Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:block h-screen sticky top-0 shrink-0 z-30"
      >
        {renderContent()}
      </motion.aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileSidebar}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-72 h-full z-10"
            >
              {renderContent()}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
