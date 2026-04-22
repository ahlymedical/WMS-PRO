import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PackageSearch,
  ScanBarcode,
  Calculator,
  FileBarChart,
  Settings,
  ShieldAlert,
  UsersRound,
  BadgeDollarSign,
  LogOut,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { logout } from '../lib/firebase';
import clsx from 'clsx';

export const Sidebar = () => {
  const { isSuperAdmin, activeWorkspaceId, setActiveWorkspaceId, user } = useAuth();
  const { t, isRtl } = useI18n();

  const isSuperAdminView = isSuperAdmin && activeWorkspaceId === 'super-admin';

  return (
    <aside className={clsx(
      "w-72 flex flex-col h-full border-r transition-colors duration-300",
      isSuperAdminView
        ? "bg-slate-900 border-slate-800 text-slate-300" // Executive Command Center Look
        : "bg-white dark:bg-dark-panel border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300" // Warehouse Look
    )}>

      {/* Header Branding */}
      <div className="p-6 border-b border-inherit">
        <h1 className={clsx(
          "text-2xl font-black flex items-center gap-3 tracking-tight",
          isSuperAdminView ? "text-white" : "text-primary dark:text-blue-400"
        )}>
          {isSuperAdminView ? <ShieldAlert className="w-8 h-8 text-indigo-500" /> : <Building2 className="w-8 h-8" />}
          {isSuperAdminView ? 'WIMS Nexus' : 'WIMS'}
        </h1>
        <p className="text-xs mt-1 font-medium opacity-70">
          {isSuperAdminView ? 'Global Governance Center' : 'Warehouse & POS Platform'}
        </p>
      </div>

      {/* Workspace Switcher for Super Admin */}
      {isSuperAdmin && (
        <div className="p-4 border-b border-inherit bg-black/5 dark:bg-black/20">
          <p className={clsx("text-xs font-semibold mb-2 uppercase tracking-wider opacity-60", isRtl ? "mr-1" : "ml-1")}>{t('nav.workspace')}</p>
          <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setActiveWorkspaceId('super-admin')}
              className={clsx(
                "flex-1 text-xs font-bold py-2 rounded-md transition-all",
                isSuperAdminView ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "hover:bg-slate-300 dark:hover:bg-slate-700/50"
              )}
            >
              {t('switch.command')}
            </button>
            <button
              onClick={() => setActiveWorkspaceId(user!.uid)}
              className={clsx(
                "flex-1 text-xs font-bold py-2 rounded-md transition-all",
                !isSuperAdminView ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" : "hover:bg-slate-300 dark:hover:bg-slate-700/50"
              )}
            >
              {t('switch.private')}
            </button>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">

        {isSuperAdminView ? (
          /* ==========================================
             SUPER ADMIN NAVIGATION (Nexus)
             ========================================== */
          <>
            <p className={clsx("text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 mt-2", isRtl ? "mr-2" : "ml-2")}>{t('nav.oversight')}</p>
            <NavItem to="/admin" icon={<LayoutDashboard size={20}/>} label={t('nav.nexus')} isDark={true} />
            <NavItem to="/admin/tenants" icon={<UsersRound size={20}/>} label={t('nav.tenants')} isDark={true} />
            <NavItem to="/admin/currency" icon={<BadgeDollarSign size={20}/>} label={t('nav.currency')} isDark={true} />

            <p className={clsx("text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 mt-6", isRtl ? "mr-2" : "ml-2")}>{t('nav.system')}</p>
            <NavItem to="/admin/audit" icon={<FileBarChart size={20}/>} label={t('nav.audit')} isDark={true} />
            <NavItem to="/admin/security" icon={<ShieldAlert size={20}/>} label={t('nav.security')} isDark={true} />
          </>
        ) : (
          /* ==========================================
             TENANT / PRIVATE WAREHOUSE NAVIGATION
             ========================================== */
          <>
            <p className={clsx("text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 mt-2", isRtl ? "mr-2" : "ml-2")}>{t('nav.workspace')}</p>
            <NavItem to="/app" icon={<LayoutDashboard size={20}/>} label={t('nav.dashboard')} end />
            <NavItem to="/app/inventory" icon={<PackageSearch size={20}/>} label={t('nav.inventory')} />
            <NavItem to="/app/scanner" icon={<ScanBarcode size={20}/>} label={t('nav.scanner')} />

            <p className={clsx("text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 mt-6", isRtl ? "mr-2" : "ml-2")}>{t('nav.retail')}</p>
            <NavItem to="/app/pos" icon={<Calculator size={20}/>} label={t('nav.pos')} />
            <NavItem to="/app/reports" icon={<FileBarChart size={20}/>} label={t('nav.reports')} />

            <p className={clsx("text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 mt-6", isRtl ? "mr-2" : "ml-2")}>{t('nav.config')}</p>
            <NavItem to="/app/settings" icon={<Settings size={20}/>} label={t('nav.settings')} />
          </>
        )}
      </nav>

      {/* Footer / Profile */}
      <div className="p-4 border-t border-inherit">
        <button
          onClick={() => logout()}
          className={clsx(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors",
            isSuperAdminView
              ? "text-rose-400 hover:bg-rose-500/10"
              : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10"
          )}
        >
          <LogOut size={20} className={isRtl ? "rotate-180" : ""} />
          {t('nav.signout')}
        </button>
      </div>
    </aside>
  );
};

// NavItem Component
const NavItem = ({ to, icon, label, end = false, isDark = false }: { to: string, icon: React.ReactNode, label: string, end?: boolean, isDark?: boolean }) => {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => clsx(
        "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
        isActive
          ? (isDark ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold")
          : (isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-gray-50 dark:hover:bg-gray-800/50")
      )}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};
