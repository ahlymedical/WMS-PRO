import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Tenant } from '../types';
import { ShieldCheck, BadgeDollarSign, Activity, Trash2, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../context/I18nContext';
import { approveCurrency, archiveTenant, deleteTenantData } from '../hooks/useFirebase';
import clsx from 'clsx';

export const SuperAdminDashboard = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const { t, isRtl } = useI18n();

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
      await approveCurrency(tenantId, newCurrency);
      toast.success(t('msg.success'));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'msg.fail';
      toast.error(t(message) || t('msg.fail'));
    }
  };

  const handleArchive = async (tenant: Tenant) => {
    const reason = prompt("Enter mandatory archive reason / أدخل سبب الأرشفة الإلزامي:");
    if (reason) {
      try {
        await archiveTenant(tenant.id, tenant, reason);
        toast.success(t('msg.success'));
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'msg.fail';
        toast.error(t(message) || t('msg.fail'));
      }
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    const reason = prompt("تحذير: سيتم حذف البيانات نهائياً. أدخل سبب الحذف الإلزامي / Enter mandatory deletion reason:");
    if (reason) {
      try {
        await deleteTenantData(tenant.id, tenant, reason);
        toast.success(t('msg.success'));
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'msg.fail';
        toast.error(t(message) || t('msg.fail'));
      }
    }
  };

  const pendingRequests = tenants.filter(t => t.pendingCurrency);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">{t('admin.title')}</h1>
        <p className="text-slate-400 mt-1">{t('admin.desc')}</p>
      </div>

      {/* Metric Cards - Executive Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('admin.metrics.tenants')}</p>
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
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('admin.metrics.pending')}</p>
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
            {t('nav.currency')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className={clsx("px-6 py-4 font-semibold", isRtl && "text-right")}>{t('admin.table.workspace')}</th>
                <th className={clsx("px-6 py-4 font-semibold", isRtl && "text-right")}>{t('admin.table.current')}</th>
                <th className={clsx("px-6 py-4 font-semibold", isRtl && "text-right")}>{t('admin.table.requested')}</th>
                <th className={clsx("px-6 py-4 font-semibold", isRtl ? "text-left" : "text-right")}>{t('admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    {t('admin.table.empty')}
                  </td>
                </tr>
              ) : (
                pendingRequests.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{tenant.name}</div>
                      <div className="text-sm text-slate-500">{tenant.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-bold font-mono">
                        {tenant.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-bold font-mono border border-amber-500/20">
                        {tenant.pendingCurrency}
                      </span>
                    </td>
                    <td className={clsx("px-6 py-4", isRtl ? "text-left" : "text-right")}>
                      <button
                        onClick={() => handleApproveCurrency(tenant.id, tenant.pendingCurrency!)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors"
                      >
                        <ShieldCheck size={16} /> {t('admin.action.approveSync')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenants Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="text-indigo-400" />
            {t('nav.tenants')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className={clsx("px-6 py-4 font-semibold", isRtl && "text-right")}>{t('admin.table.workspace')}</th>
                <th className={clsx("px-6 py-4 font-semibold", isRtl && "text-right")}>Status</th>
                <th className={clsx("px-6 py-4 font-semibold", isRtl ? "text-left" : "text-right")}>{t('admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {tenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{tenant.name}</div>
                    <div className="text-sm text-slate-500">{tenant.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "px-2.5 py-1 rounded-md text-xs font-bold",
                      tenant.status === 'approved' ? "bg-emerald-500/10 text-emerald-400" :
                      tenant.status === 'rejected' ? "bg-rose-500/10 text-rose-400" :
                      "bg-slate-800 text-slate-300"
                    )}>
                      {tenant.status || 'Pending'}
                    </span>
                  </td>
                  <td className={clsx("px-6 py-4 space-x-2", isRtl ? "text-left space-x-reverse" : "text-right")}>
                    <button
                      onClick={() => handleArchive(tenant)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                      title="Archive"
                    >
                      <Archive size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tenant)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
