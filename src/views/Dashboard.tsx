import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useInventory, useSales } from '../hooks/useFirebase';
import { formatMoney } from '../utils/format';
import { PackageSearch, CircleDollarSign, ArrowUpRight, ShieldAlert } from 'lucide-react';

export const Dashboard = () => {
  const { tenant, activeWorkspaceId, isSuperAdmin } = useAuth();
  const { inventory } = useInventory(activeWorkspaceId!);
  const { sales } = useSales(activeWorkspaceId!);

  // Calculate live stats
  const totalVolume = inventory.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = inventory.filter(i => i.stock <= i.minAlert).length;
  const totalRevenue = sales.reduce((sum, tx) => sum + tx.total, 0);

  if (!tenant) return <div>Loading Workspace...</div>;

  const isPendingCurrency = !!tenant.pendingCurrency;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Workspace Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            Welcome to <span className="font-bold text-gray-700 dark:text-gray-300">{tenant.name}</span> HQ
          </p>
        </div>

        {/* Live Currency Status Pill */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-xl shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Currency</span>
            <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">{tenant.currency}</span>
          </div>
          {isPendingCurrency && (
            <>
              <div className="w-px h-8 bg-gray-200 dark:bg-slate-700 mx-2" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                  <ShieldAlert size={10} /> Pending Approval
                </span>
                <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">{tenant.pendingCurrency}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Revenue Card (Reacts to live currency instantly) */}
        <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-xl shadow-gray-200/40 dark:shadow-none relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-blue-50 dark:text-blue-900/20 group-hover:scale-110 transition-transform duration-500">
            <CircleDollarSign size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Revenue</p>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
              {formatMoney(totalRevenue, tenant.currency)}
            </h3>
            <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
              <ArrowUpRight size={14} /> +12.5% this month
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-xl shadow-gray-200/40 dark:shadow-none relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-emerald-50 dark:text-emerald-900/20 group-hover:scale-110 transition-transform duration-500">
            <PackageSearch size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Stock Volume</p>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-2">{totalVolume}</h3>
            <p className="text-xs font-semibold text-gray-500">Units across {inventory.length} items</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-panel border border-rose-100 dark:border-rose-900/30 p-6 rounded-2xl shadow-xl shadow-rose-200/20 dark:shadow-none relative overflow-hidden group">
           <div className="relative z-10">
            <p className="text-sm font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-2">Action Required</p>
            <h3 className="text-4xl font-black text-rose-600 dark:text-rose-500 mb-2">{lowStockCount}</h3>
            <p className="text-xs font-semibold text-rose-500/70">Items below minimum threshold</p>
          </div>
        </div>

      </div>
    </div>
  );
};
