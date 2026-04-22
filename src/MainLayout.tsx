import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { useAuth } from './context/AuthContext';
import { useI18n } from './context/I18nContext';
import { Globe } from 'lucide-react';
import clsx from 'clsx';

export const MainLayout = () => {
  const { user, loading, isSuperAdmin, activeWorkspaceId } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 text-blue-600">Loading WIMS...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const { lang, setLang } = useI18n();
  const isSuperAdminView = isSuperAdmin && activeWorkspaceId === 'super-admin';

  // Enforce route bounds
  if (isSuperAdminView && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }
  if (!isSuperAdminView && location.pathname.startsWith('/admin')) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className={clsx(
      "flex h-screen overflow-hidden font-sans transition-colors duration-300",
      isSuperAdminView ? "bg-slate-950 text-slate-200" : "bg-gray-50 dark:bg-dark-bg text-gray-800 dark:text-gray-100"
    )}>
      {/* Separated Sidebar Strategy */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {/* Simple top header spacer / context bar */}
        <header className={clsx(
          "h-16 border-b flex items-center px-8 z-10 shrink-0",
          isSuperAdminView ? "bg-slate-900/50 border-slate-800 backdrop-blur-md" : "bg-white/50 dark:bg-dark-panel/50 border-gray-200 dark:border-gray-800 backdrop-blur-md"
        )}>
          <div className="flex-1" />
          {/* Language Switcher */}
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-gray-400" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
              className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-600 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value="en" className="text-gray-900">English</option>
              <option value="ar" className="text-gray-900">العربية</option>
            </select>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
