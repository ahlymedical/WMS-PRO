import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateCurrencyRequest } from '../hooks/useFirebase';
import { BadgeDollarSign, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminSettings = () => {
  const { tenant, activeWorkspaceId } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState(tenant?.currency || 'USD');
  const [loading, setLoading] = useState(false);

  if (!tenant) return null;

  const handleCurrencyRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCurrency === tenant.currency) {
      toast.error('This is already your active currency.');
      return;
    }

    setLoading(true);
    try {
      await updateCurrencyRequest(activeWorkspaceId!, selectedCurrency);
      toast.success('Currency change requested successfully. Awaiting Master Admin approval.');
    } catch (err) {
      toast.error('Failed to submit request.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Workspace Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Configure your business rules and local preferences.</p>
      </div>

      <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-200/40 dark:shadow-none p-8">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <BadgeDollarSign size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Operating Currency</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Request a change to your primary business currency.</p>
          </div>
        </div>

        <form onSubmit={handleCurrencyRequest} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Current Active Currency</label>
              <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 font-mono font-bold cursor-not-allowed flex items-center justify-between">
                {tenant.currency}
                {tenant.pendingCurrency && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded uppercase tracking-wider font-bold">
                    Pending Change
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Request New Currency</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                disabled={!!tenant.pendingCurrency || loading}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="EGP">EGP (E£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CNY">CNY (¥)</option>
              </select>
            </div>
          </div>

          {tenant.pendingCurrency && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
              <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Approval Pending</p>
                <p className="text-sm text-amber-700/80 dark:text-amber-500/80 mt-1">
                  You have requested to change your currency to <strong className="font-mono">{tenant.pendingCurrency}</strong>.
                  You cannot submit another request until the Master Admin reviews this one.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={!!tenant.pendingCurrency || loading || selectedCurrency === tenant.currency}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
            >
              Submit Request to Nexus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
