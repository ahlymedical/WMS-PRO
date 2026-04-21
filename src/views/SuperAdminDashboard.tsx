import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Tenant } from '../types';
import { ShieldCheck, ServerCrash, BadgeDollarSign, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export const SuperAdminDashboard = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'tenants'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const t: Tenant[] = [];
      snapshot.forEach(doc => t.push({ id: doc.id, ...doc.data() } as Tenant));
      setTenants(t);
    });
    return () => unsubscribe();
  }, []);

  const handleApproveCurrency = async (tenantId: string, newCurrency: string) => {
    try {
      await updateDoc(doc(db, 'tenants', tenantId), {
        currency: newCurrency,
        pendingCurrency: null
      });
      toast.success('Currency update approved & pushed live');
    } catch (e) {
      toast.error('Failed to approve currency');
    }
  };

  const pendingRequests = tenants.filter(t => t.pendingCurrency);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Nexus Overview</h1>
        <p className="text-slate-400 mt-1">Global SaaS command center and telemetry.</p>
      </div>

      {/* Metric Cards - Executive Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Tenants</p>
              <h3 className="text-3xl font-bold text-white">{tenants.length}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Activity size={24} />
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Pending Currency</p>
              <h3 className="text-3xl font-bold text-amber-400">{pendingRequests.length}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <BadgeDollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Currency Approval Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BadgeDollarSign className="text-amber-400" />
            Currency Change Requests
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Workspace / Email</th>
                <th className="px-6 py-4 font-semibold">Current Currency</th>
                <th className="px-6 py-4 font-semibold">Requested Currency</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No pending currency requests.
                  </td>
                </tr>
              ) : (
                pendingRequests.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{t.name}</div>
                      <div className="text-sm text-slate-500">{t.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-bold font-mono">
                        {t.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-bold font-mono border border-amber-500/20">
                        {t.pendingCurrency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleApproveCurrency(t.id, t.pendingCurrency!)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors"
                      >
                        <ShieldCheck size={16} /> Approve & Sync
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
