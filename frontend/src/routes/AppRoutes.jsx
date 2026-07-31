import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Upload } from '../pages/Upload';
import { DigitalTwin } from '../pages/DigitalTwin';
import { AttackGraph } from '../pages/AttackGraph';
import { Reports } from '../pages/Reports';
import { History } from '../pages/History';
import { Analytics } from '../pages/Analytics';
import { Settings } from '../pages/Settings';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Login Route (Standalone) */}
      <Route path="/login" element={<Login />} />

      {/* Main Application Layout Protected Routes */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/digital-twin" element={<DigitalTwin />} />
        <Route path="/attack-graph" element={<AttackGraph />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/history" element={<History />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
