import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext({
  isCollapsed: false,
  toggleSidebar: () => {},
  setIsCollapsed: () => {},
  isMobileOpen: false,
  toggleMobileSidebar: () => {},
});

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);
  const toggleMobileSidebar = () => setIsMobileOpen((prev) => !prev);

  // Auto-collapse sidebar on smaller desktop screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && window.innerWidth >= 768) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1280) {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleSidebar,
        setIsCollapsed,
        isMobileOpen,
        toggleMobileSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
