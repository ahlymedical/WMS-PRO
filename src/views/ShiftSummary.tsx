import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useSales } from '../hooks/useFirebase';
import { formatMoney } from '../utils/format';
import { Calculator, Printer, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export const ShiftSummary = () => {
  const { tenant, activeWorkspaceId, employeeProfile } = useAuth();
  const { sales } = useSales(activeWorkspaceId!);
  const { t, isRtl } = useI18n();

  // This is a simplified end-of-day summary calculation.
  // In a full production app, you'd query sales strictly between a shift start/end timestamp.
  // Here we'll summarize all sales currently in memory (e.g., today's sales).

  const [actualCash, setActualCash] = useState<number>(0);

  if (!tenant) return null;

  // Summarize metrics
  const completedSales = sales.filter(s => s.status === 'completed');
  const refundedSales = sales.filter(s => s.status === 'refunded');

  const cashSales = completedSales.filter(s => s.paymentMethod === 'cash').reduce((sum, tx) => sum + tx.total, 0);
  const cardSales = completedSales.filter(s => s.paymentMethod === 'card').reduce((sum, tx) => sum + tx.total, 0);
  const creditSales = completedSales.filter(s => s.paymentMethod === 'credit').reduce((sum, tx) => sum + tx.total, 0);
  const refundTotals = refundedSales.reduce((sum, tx) => sum + tx.total, 0);

  // Expected Cash Drawer = Starting Cash (assume 0 for demo) + Cash Sales - Refunds (assuming refunds were given in cash)
  const expectedCash = Math.max(0, cashSales - refundTotals);
  const difference = actualCash - expectedCash;

  const handlePrintZReport = () => {
    const reportContent = `
      <div style="width: 80mm; font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; padding: 10px; margin: 0 auto; background: white;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 16px;">${tenant.businessDisplayName || tenant.name}</h2>
          <p style="margin: 5px 0;">Z-REPORT (END OF SHIFT)</p>
          <p style="margin: 5px 0; border-bottom: 1px dashed #000; padding-bottom: 10px;">Printed: ${new Date().toLocaleString()}</p>
        </div>

        <p><strong>Cashier:</strong> ${employeeProfile?.name || 'Admin/Owner'}</p>

        <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 10px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px;">Sales Breakdown</h3>
          <div style="display: flex; justify-content: space-between;"><span>Cash Sales:</span><span>${formatMoney(cashSales, tenant.currency)}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Card Sales:</span><span>${formatMoney(cardSales, tenant.currency)}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Credit Sales:</span><span>${formatMoney(creditSales, tenant.currency)}</span></div>
          <div style="display: flex; justify-content: space-between; color: red;"><span>Refunds:</span><span>-${formatMoney(refundTotals, tenant.currency)}</span></div>
        </div>

        <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 10px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px;">Drawer Reconciliation</h3>
          <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>Expected Cash:</span><span>${formatMoney(expectedCash, tenant.currency)}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Actual Counted:</span><span>${formatMoney(actualCash, tenant.currency)}</span></div>
          <div style="display: flex; justify-content: space-between; font-style: italic;"><span>Difference:</span><span>${formatMoney(difference, tenant.currency)}</span></div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px;">
          <p>*** END OF REPORT ***</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Z-Report</title></head><body style="margin:0;">' + reportContent + '</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Calculator className="text-primary-600" size={32} />
          End of Shift (Z-Report)
        </h1>
        <p className="text-gray-500 mt-1">Reconcile the cash drawer and print your daily summary.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Left Col: Analytics */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-6">
             <h2 className="text-lg font-bold mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Sales Breakdown</h2>
             <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-medium">
                   <span className="text-gray-500">Cash Sales</span>
                   <span className="font-bold">{formatMoney(cashSales, tenant.currency)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                   <span className="text-gray-500">Card Sales</span>
                   <span className="font-bold">{formatMoney(cardSales, tenant.currency)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                   <span className="text-gray-500">Credit / On-Account</span>
                   <span className="font-bold">{formatMoney(creditSales, tenant.currency)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-rose-500 border-t border-gray-100 dark:border-gray-800 pt-3">
                   <span>Refunds Processed</span>
                   <span className="font-bold">-{formatMoney(refundTotals, tenant.currency)}</span>
                </div>
             </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 text-center">
             <p className="text-sm font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-2">Expected Cash In Drawer</p>
             <h3 className="text-4xl font-black text-emerald-700 dark:text-emerald-400">
               {formatMoney(expectedCash, tenant.currency)}
             </h3>
          </div>
        </div>

        {/* Right Col: Reconciliation */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-6">
             <h2 className="text-lg font-bold mb-4">Cash Drawer Reconciliation</h2>

             <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enter Actual Counted Cash</label>
                <input
                  type="number"
                  min="0"
                  value={actualCash || ''}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  className="w-full text-center text-3xl font-black py-4 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-0 outline-none bg-gray-50 dark:bg-slate-800 dark:text-white transition-colors"
                  placeholder="0.00"
                />
             </div>

             <div className={clsx(
               "p-4 rounded-xl border-2 mb-6",
               difference === 0 ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
               difference < 0 ? "bg-rose-50 border-rose-200 text-rose-700" :
               "bg-amber-50 border-amber-200 text-amber-700"
             )}>
                <div className="flex justify-between items-center font-bold">
                  <span>Difference:</span>
                  <span>{difference > 0 ? '+' : ''}{formatMoney(difference, tenant.currency)}</span>
                </div>
                <p className="text-xs mt-1 opacity-80">
                  {difference === 0 ? "Perfect match!" : difference < 0 ? "Drawer is short." : "Drawer is over."}
                </p>
             </div>

             <button
               onClick={handlePrintZReport}
               className="w-full flex items-center justify-center gap-3 py-4 bg-gray-900 dark:bg-white hover:opacity-90 text-white dark:text-gray-900 font-black text-lg rounded-xl shadow-xl transition-all"
             >
               <Printer size={20} /> Print Z-Report
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};
