import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useSales } from '../hooks/useFirebase';
import { formatMoney } from '../utils/format';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { useSupervisorAuth } from '../hooks/useSupervisorAuth';
import { PinAuthModal } from '../components/PinAuthModal';
import { db } from '../lib/firebase';
import { doc, writeBatch, increment } from 'firebase/firestore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export const Reports = () => {
  const { tenant, activeWorkspaceId } = useAuth();
  const { sales } = useSales(activeWorkspaceId!);
  const { t, isRtl } = useI18n();
  const { isPinModalOpen, actionDescription, requireSupervisor, handleSuccess, handleClose } = useSupervisorAuth();

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  if (!tenant) return null;

  const handleInitiateRefund = (txId: string) => {
    setSelectedTxId(txId);
    requireSupervisor('Supervisor PIN required to authorize this refund and return items to stock.', async (managerId: string) => {
      const tx = sales.find(s => s.id === txId);
      if (!tx || tx.status === 'refunded') return;

      try {
        const batch = writeBatch(db);

        // 1. Mark transaction as refunded
        const saleRef = doc(db, 'sales', txId);
        batch.update(saleRef, {
          status: 'refunded',
          refundApprovedBy: managerId
        });

        // 2. Return items to stock
        tx.items.forEach(item => {
          const inventoryRef = doc(db, 'inventory', item.inventoryId);
          batch.update(inventoryRef, { stock: increment(item.quantity) });
        });

        await batch.commit();
        toast.success('Refund processed successfully.');
      } catch (error) {
        console.error(error);
        toast.error(t('msg.fail'));
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{t('nav.reports')} & Transactions</h1>
        <p className="text-gray-500 mt-1">View historical sales and process supervised refunds.</p>
      </div>

      <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className={clsx("px-6 py-4 font-semibold", isRtl && "text-right")}>Date / Time</th>
                <th className={clsx("px-6 py-4 font-semibold", isRtl && "text-right")}>Invoice ID</th>
                <th className={clsx("px-6 py-4 font-semibold", isRtl && "text-right")}>Total</th>
                <th className={clsx("px-6 py-4 font-semibold", isRtl && "text-right")}>Status</th>
                <th className={clsx("px-6 py-4 font-semibold text-center")}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                sales.map(tx => (
                  <tr key={tx.id} className={clsx("hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors", tx.status === 'refunded' && "opacity-60")}>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {tx.timestamp?.toDate().toLocaleString() || '-'}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-900 dark:text-white">
                      {tx.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {formatMoney(tx.total, tx.currency)}
                    </td>
                    <td className="px-6 py-4">
                      {tx.status === 'refunded' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          <AlertTriangle size={12} /> Refunded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {tx.status !== 'refunded' && (
                        <button
                          onClick={() => handleInitiateRefund(tx.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 rounded-lg text-sm font-bold transition-colors"
                        >
                          <RotateCcw size={14} />
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        actionDescription={actionDescription}
      />
    </div>
  );
};
