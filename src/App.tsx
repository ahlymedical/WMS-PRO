import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './MainLayout';
import { Toaster } from 'react-hot-toast';

import { Dashboard } from './views/Dashboard';
import { SuperAdminDashboard } from './views/SuperAdminDashboard';
import { AdminSettings } from './views/AdminSettings';
import { Inventory } from './views/Inventory';
import { Scanner } from './views/Scanner';
import { POS } from './views/POS';

// Placeholder login
const Login = () => <div className="p-10"><h1>Login View</h1></div>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/app" replace />} />

            {/* Private Warehouse / Tenant Routes */}
            <Route path="app">
              <Route index element={<Dashboard />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="scanner" element={<Scanner />} />
              <Route path="pos" element={<POS />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="*" element={<div className="p-10">Warehouse Feature placeholder</div>} />
            </Route>

            {/* Super Admin Nexus Routes */}
            <Route path="admin">
              <Route index element={<SuperAdminDashboard />} />
              <Route path="*" element={<div className="p-10">Nexus Feature placeholder</div>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </AuthProvider>
  );
}
