import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useInventory, useSales, useBackups } from '../hooks/useFirebase';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { HardDriveDownload, RefreshCw, AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export const BackupCenter = () => {
  const { tenant } = useAuth();
  const { t, isRtl } = useI18n();
  const { inventory } = useInventory(tenant?.id);
  const { sales } = useSales(tenant?.id);
  const { backups } = useBackups(tenant?.id);

  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [backupName, setBackupName] = useState('');

  if (!tenant) return null;

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupName.trim()) return;

    setIsCreating(true);
    try {
      // 1. Fetch current stock transactions as well
      const stQ = query(collection(db, 'stock_transactions'), where('tenantId', '==', tenant.id));
      const stSnap = await getDocs(stQ);
      const stockTransactions = stSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Serialize Payload
      const payload = JSON.stringify({
        inventory,
        sales,
        stockTransactions
      });

      // 3. Save to Firebase
      await addDoc(collection(db, 'backups'), {
        tenantId: tenant.id,
        name: backupName.trim(),
        dataPayload: payload,
        sizeBytes: new Blob([payload]).size,
        timestamp: serverTimestamp()
      });

      setBackupName('');
      toast.success(t('msg.success'));
    } catch (error) {
      console.error(error);
      toast.error(t('msg.fail'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (backup: any) => {
    const confirmMessage = "تحذير: استعادة هذه النسخة سيمسح بياناتك الحالية. هل أنت متأكد؟\nWarning: Restoring this backup will overwrite your current data. Are you sure?";
    if (!window.confirm(confirmMessage)) return;

    setIsRestoring(true);
    try {
      const data = JSON.parse(backup.dataPayload);
      const batch = writeBatch(db);
      let opCount = 0;

      const commitBatchIfNeeded = async () => {
        if (opCount >= 450) {
           await batch.commit();
           opCount = 0;
        }
      }

      // Helper to delete existing collections
      const deleteCollection = async (collName: string) => {
        const q = query(collection(db, collName), where('tenantId', '==', tenant.id));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          batch.delete(d.ref);
          opCount++;
          await commitBatchIfNeeded();
        }
      };

      await deleteCollection('inventory');
      await deleteCollection('sales');
      await deleteCollection('stock_transactions');

      // Re-insert backup data
      for (const item of (data.inventory || [])) {
        const ref = doc(db, 'inventory', item.id);
        const { id, ...rest } = item;
        batch.set(ref, rest);
        opCount++;
        await commitBatchIfNeeded();
      }
      for (const sale of (data.sales || [])) {
        const ref = doc(db, 'sales', sale.id);
        const { id, ...rest } = sale;
        // Restore timestamp objects safely so they don't break sorting
        if (rest.timestamp && typeof rest.timestamp === 'object' && 'seconds' in rest.timestamp) {
           rest.timestamp = new Date(rest.timestamp.seconds * 1000);
        }
        batch.set(ref, rest);
        opCount++;
        await commitBatchIfNeeded();
      }
      for (const st of (data.stockTransactions || [])) {
        const ref = doc(db, 'stock_transactions', st.id);
        const { id, ...rest } = st;
        if (rest.timestamp && typeof rest.timestamp === 'object' && 'seconds' in rest.timestamp) {
           rest.timestamp = new Date(rest.timestamp.seconds * 1000);
        }
        batch.set(ref, rest);
        opCount++;
        await commitBatchIfNeeded();
      }

      if (opCount > 0) {
        await batch.commit();
      }

      toast.success(t('msg.success'));
    } catch (error) {
      console.error(error);
      toast.error(t('msg.fail'));
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFactoryReset = async () => {
    const confirm1 = window.prompt("اكتب 'DELETE' لتأكيد مسح كافة بياناتك نهائياً\nType 'DELETE' to confirm permanent wipe of your data:");
    if (confirm1 !== 'DELETE') return;

    setIsResetting(true);
    try {
      const batch = writeBatch(db);

      const deleteCollection = async (collName: string) => {
        const q = query(collection(db, collName), where('tenantId', '==', tenant.id));
        const snap = await getDocs(q);
        snap.forEach(d => batch.delete(d.ref));
      };

      await deleteCollection('inventory');
      await deleteCollection('sales');
      await deleteCollection('stock_transactions');
      // Intentionally leaving backups so they can restore if they made a mistake

      await batch.commit();
      toast.success('Factory Reset Complete.');
    } catch (error) {
      console.error(error);
      toast.error(t('msg.fail'));
    } finally {
      setIsResetting(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <HardDriveDownload className="text-primary-600" size={32} />
          {t('backup.title')}
        </h1>
        <p className="text-gray-500 mt-1">{t('backup.desc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Creation Panel */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold mb-4">{t('backup.create')}</h2>
            <form onSubmit={handleCreateBackup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('backup.name')}</label>
                <input
                  type="text"
                  required
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder={t('backup.placeholder')}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreating ? <RefreshCw className="animate-spin" size={20} /> : <HardDriveDownload size={20} />}
                {t('backup.btn.create')}
              </button>
            </form>
          </div>

          <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
              <ShieldAlert size={20} /> {t('backup.danger')}
            </h2>
            <p className="text-sm text-rose-600/80 dark:text-rose-400/80 mb-4">
              {t('backup.danger.desc')}
            </p>
            <button
              onClick={handleFactoryReset}
              disabled={isResetting}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isResetting ? <RefreshCw className="animate-spin" size={20} /> : <Trash2 size={20} />}
              {t('backup.btn.reset')}
            </button>
          </div>
        </div>

        {/* List Panel */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold">{t('backup.list')}</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className={clsx("px-6 py-4 font-semibold", isRtl && "text-right")}>{t('backup.table.date')}</th>
                    <th className={clsx("px-6 py-4 font-semibold", isRtl && "text-right")}>{t('backup.table.name')}</th>
                    <th className={clsx("px-6 py-4 font-semibold", isRtl && "text-right")}>{t('backup.table.size')}</th>
                    <th className={clsx("px-6 py-4 font-semibold text-center")}>{t('backup.table.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {backups.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        {t('backup.empty')}
                      </td>
                    </tr>
                  ) : (
                    backups.map(backup => (
                      <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {backup.timestamp?.toDate().toLocaleString() || t('backup.justNow')}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {backup.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                          {formatBytes(backup.sizeBytes)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleRestore(backup)}
                            disabled={isRestoring || isResetting}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                          >
                            <RefreshCw size={14} className={isRestoring ? "animate-spin" : ""} />
                            {t('backup.action.restore')}
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

      </div>
    </div>
  );
};
