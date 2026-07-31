import React, { useState } from 'react';
import { Menu, Sun, Moon, Plus, ShieldCheck, RefreshCw } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { SearchBar } from '../ui/SearchBar';
import { IconButton } from '../ui/IconButton';
import { Button } from '../ui/Button';
import { NotificationDropdown } from '../ui/NotificationDropdown';
import { ProfileMenu } from '../ui/ProfileMenu';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';

export const Navbar = () => {
  const { toggleMobileSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncTwin = () => {
    setIsSyncing(true);
    addToast({
      title: 'Digital Twin Synchronization Started',
      description: 'Refreshing AWS/Azure cluster topology nodes...',
      type: 'info',
    });
    setTimeout(() => {
      setIsSyncing(false);
      addToast({
        title: 'Synchronization Complete',
        description: '1,420 nodes updated in active memory twin.',
        type: 'success',
      });
    }, 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-20 w-full glass-navbar border-b border-gray-800/80 px-4 lg:px-8 py-3 transition-all">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Trigger & Search */}
          <div className="flex items-center gap-3 flex-1">
            <IconButton
              icon={Menu}
              variant="ghost"
              size="md"
              onClick={toggleMobileSidebar}
              className="md:hidden"
              title="Toggle Navigation Menu"
            />

            <div className="hidden sm:block flex-1 max-w-lg">
              <SearchBar />
            </div>
          </div>

          {/* Right: Actions, Theme, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Sync Button */}
            <IconButton
              icon={RefreshCw}
              variant="outline"
              size="md"
              onClick={handleSyncTwin}
              className={isSyncing ? 'animate-spin text-blue-400 border-blue-500' : ''}
              title="Sync Digital Twin State"
            />

            {/* Quick Actions Button */}
            <Button
              variant="cyber"
              size="sm"
              leftIcon={Plus}
              glow
              onClick={() => setIsQuickActionModalOpen(true)}
              className="hidden md:inline-flex"
            >
              New Scan
            </Button>

            {/* Theme Toggle */}
            <IconButton
              icon={theme === 'dark' ? Sun : Moon}
              variant="secondary"
              size="md"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            />

            {/* Notifications */}
            <NotificationDropdown />

            <div className="h-6 w-[1px] bg-gray-800 mx-1 hidden sm:block" />

            {/* Profile Menu */}
            <ProfileMenu />
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="mt-3 sm:hidden">
          <SearchBar />
        </div>
      </header>

      {/* Quick Action Modal */}
      <Modal
        isOpen={isQuickActionModalOpen}
        onClose={() => setIsQuickActionModalOpen(false)}
        title="Initiate Security Scan & Digital Twin Injection"
        subtitle="Upload vulnerability report or trigger real-time AI threat analysis"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsQuickActionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsQuickActionModalOpen(false);
                addToast({
                  title: 'Scan Scheduled',
                  description: 'Scan job queued in production runner #849.',
                  type: 'success',
                });
              }}
            >
              Queue Scan Job
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-sans text-sm text-gray-300">
          <p>
            Select the target infrastructure or upload a JSON vulnerability report (Nmap, Nessus, AWS GuardDuty):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 hover:border-blue-500 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white">Cloud Infrastructure</span>
                <Badge variant="primary">AWS / Azure</Badge>
              </div>
              <p className="text-xs text-gray-400">
                Full VPC graph analysis and attack path simulation.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/60 hover:border-gray-700 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white">Kubernetes Clusters</span>
                <Badge variant="info">EKS / GKE</Badge>
              </div>
              <p className="text-xs text-gray-400">
                Container escape vectors and RBAC privilege graph.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
