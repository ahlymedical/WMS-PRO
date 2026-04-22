import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../hooks/useFirebase';
import { PackagePlus, Search, Pencil, Trash2, ArrowUpDown, PackageSearch } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useI18n } from '../context/I18nContext';
import clsx from 'clsx';

export const Inventory = () => {
  const { activeWorkspaceId, tenant } = useAuth();
  const { inventory } = useInventory(activeWorkspaceId!);
  const { t, isRtl } = useI18n();
  const [search, setSearch] = useState('');

  const filteredItems = inventory.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.barcode.includes(search)
  );

  const handleDelete = async (id: string) => {
    if (confirm(t('inventory.confirmDelete'))) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
        toast.success(t('inventory.deleteSuccess'));
      } catch (e) {
        toast.error(t('inventory.deleteFail'));
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{t('nav.inventory')}</h1>
        </div>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
          <PackagePlus size={20} /> {t('inventory.add')}
        </button>
      </div>

      <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-200/40 dark:shadow-none overflow-hidden">

        {/* Toolbar */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className={clsx("absolute top-1/2 -translate-y-1/2 text-gray-400", isRtl ? "right-3" : "left-3")} size={18} />
            <input
              type="text"
              placeholder={t('action.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={clsx("w-full py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", isRtl ? "pr-10 pl-4" : "pl-10 pr-4")}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className={clsx("px-6 py-4 border-b border-gray-100 dark:border-gray-800", isRtl && "text-right")}>{t('inventory.table.name')}</th>
                <th className={clsx("px-6 py-4 border-b border-gray-100 dark:border-gray-800", isRtl && "text-right")}>{t('inventory.table.barcode')}</th>
                <th className={clsx("px-6 py-4 border-b border-gray-100 dark:border-gray-800", isRtl && "text-right")}>{t('inventory.table.stock')}</th>
                <th className={clsx("px-6 py-4 border-b border-gray-100 dark:border-gray-800", isRtl && "text-right")}>{t('inventory.table.alert')}</th>
                <th className={clsx("px-6 py-4 border-b border-gray-100 dark:border-gray-800", isRtl && "text-right")}>{t('inventory.table.status')}</th>
                <th className={clsx("px-6 py-4 border-b border-gray-100 dark:border-gray-800", isRtl ? "text-left" : "text-right")}>{t('inventory.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <PackageSearch className="mx-auto mb-3 opacity-20" size={48} />
                    {t('inventory.empty')}
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isLowStock = item.stock <= item.minAlert;
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors ${isLowStock ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.category}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400">{item.barcode}</span>
                      </td>
                      <td className={`px-6 py-4 font-black ${isLowStock ? 'text-rose-600 dark:text-rose-500' : 'text-gray-900 dark:text-white'}`}>
                        {item.stock}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {item.minAlert}
                      </td>
                      <td className="px-6 py-4">
                        {isLowStock ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                            {t('inventory.lowStock')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                            {t('inventory.healthy')}
                          </span>
                        )}
                      </td>
                      <td className={clsx("px-6 py-4 space-x-2", isRtl ? "text-left space-x-reverse" : "text-right")}>
                        <button className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 dark:bg-gray-800 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
