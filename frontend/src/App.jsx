import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { SidebarProvider } from './hooks/useSidebar';
import { ToastProvider } from './hooks/useToast';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SidebarProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </SidebarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
