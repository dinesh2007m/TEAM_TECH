import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { ToastContainer } from '../components/ui/Toast';
import { pageTransition } from '../utils/animations';

export const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#030712] text-[#F9FAFB] flex flex-row overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200">
      {/* Reusable Left Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Navbar */}
        <Navbar />

        {/* Main Content Area with Animated Page Transition Support */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={pageTransition.initial}
              animate={pageTransition.animate}
              exit={pageTransition.exit}
              transition={pageTransition.transition}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};
