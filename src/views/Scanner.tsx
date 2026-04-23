import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useInventory } from '../hooks/useFirebase';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowDownToLine, ArrowUpFromLine, Scan, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import clsx from 'clsx';

export const Scanner = () => {
  const { tenant } = useAuth();
  const { t, isRtl } = useI18n();
  const { inventory } = useInventory(tenant?.id);

  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [manualBarcode, setManualBarcode] = useState('');
  const [scannedItem, setScannedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = (type: 'success' | 'error') => {
    if (!audioContextRef.current) return;
    const osc = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioContextRef.current.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.2);
      osc.start(audioContextRef.current.currentTime);
      osc.stop(audioContextRef.current.currentTime + 0.2);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, audioContextRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioContextRef.current.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
      osc.start(audioContextRef.current.currentTime);
      osc.stop(audioContextRef.current.currentTime + 0.3);
    }
  };

  const processTransaction = async (item: any, qtyToProcess: number) => {
    if (!tenant) return;

    try {
      let newStock = item.stock;
      if (mode === 'in') {
        newStock += qtyToProcess;
      } else {
        if (item.stock < qtyToProcess) {
          playBeep('error');
          toast.error(t('pos.cannotExceed'));
          return;
        }
        newStock -= qtyToProcess;
      }

      // Update Inventory
      const itemRef = doc(db, 'inventory', item.id);
      await updateDoc(itemRef, { stock: newStock });

      // Create Stock Transaction
      await addDoc(collection(db, 'stock_transactions'), {
        tenantId: tenant.id,
        inventoryId: item.id,
        name: item.name,
        type: mode,
        quantity: qtyToProcess,
        stockBefore: item.stock,
        stockAfter: newStock,
        timestamp: serverTimestamp()
      });

      playBeep('success');
      toast.success(`${mode === 'in' ? '+' : '-'}${qtyToProcess} ${item.name}`);

      setScannedItem({ ...item, stock: newStock });
      setQuantity(1);

    } catch (e) {
      console.error(e);
      playBeep('error');
      toast.error(t('msg.fail'));
    }
  };

  const handleScan = (barcode: string) => {
    const item = inventory.find(i => i.barcode === barcode);
    if (!item) {
      playBeep('error');
      toast.error(t('pos.notFound'));
      setScannedItem(null);
      return;
    }

    setScannedItem(item);

    if (isBulkMode) {
      processTransaction(item, 1);
    }
  };

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    let lastScanData: string | null = null;
    let lastScanTime = 0;

    scannerRef.current.render((decodedText) => {
      const now = Date.now();
      if (decodedText !== lastScanData || (now - lastScanTime) > 2000) {
        lastScanData = decodedText;
        lastScanTime = now;
        handleScan(decodedText);
      }
    }, undefined);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventory, mode, isBulkMode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleScan(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  if (!tenant) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Scan size={32} className="text-primary-600" />
          {t('scanner.title')}
        </h1>
        <p className="text-gray-500 mt-1">{t('scanner.desc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Col: Scanner & Controls */}
        <div className="space-y-6">
          <div className="flex gap-4">
            <button
              onClick={() => setMode('in')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all border-2",
                mode === 'in'
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-white dark:bg-dark-panel border-gray-200 dark:border-gray-800 text-gray-500 hover:border-emerald-500/50"
              )}
            >
              <ArrowDownToLine size={20} />
              Receive (IN)
            </button>
            <button
              onClick={() => setMode('out')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all border-2",
                mode === 'out'
                  ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20"
                  : "bg-white dark:bg-dark-panel border-gray-200 dark:border-gray-800 text-gray-500 hover:border-rose-500/50"
              )}
            >
              <ArrowUpFromLine size={20} />
              Issue (OUT)
            </button>
          </div>

          <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">{t('scanner.module')}</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBulkMode}
                  onChange={(e) => setIsBulkMode(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium">Bulk Mode (Auto +1/-1)</span>
              </label>
            </div>

            <div id="reader" className="w-full rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 min-h-[300px]"></div>

            <form onSubmit={handleManualSubmit} className="mt-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('pos.scan')}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                />
                <button type="submit" className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-opacity">
                  Enter
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Scan Results */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-6 min-h-[400px] flex flex-col">
            <h2 className="font-bold mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">Scan Result</h2>

            {!scannedItem ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Scan size={48} className="mb-4 opacity-50" />
                <p>Waiting for scan...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{scannedItem.name}</h3>
                    <p className="text-sm text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 inline-block px-2 py-1 rounded">
                      {scannedItem.barcode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Current Stock</p>
                    <p className={clsx(
                      "text-3xl font-black",
                      scannedItem.stock <= scannedItem.minAlert ? "text-rose-500" : "text-emerald-500"
                    )}>
                      {scannedItem.stock}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Category</p>
                    <p className="font-semibold">{scannedItem.category || '-'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Supplier</p>
                    <p className="font-semibold">{scannedItem.supplier || '-'}</p>
                  </div>
                </div>

                {!isBulkMode && (
                  <div className="mt-auto space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-primary-500/20 bg-primary-500/5">
                      <label className="font-bold flex-1">Quantity to {mode === 'in' ? 'Receive' : 'Issue'}:</label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 text-center px-4 py-2 text-lg font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>

                    <button
                      onClick={() => processTransaction(scannedItem, quantity)}
                      className={clsx(
                        "w-full py-4 rounded-xl font-black text-white text-lg transition-all shadow-lg",
                        mode === 'in'
                          ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                          : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                      )}
                    >
                      Confirm {mode === 'in' ? 'Receive' : 'Issue'} ({quantity})
                    </button>
                  </div>
                )}

                {isBulkMode && (
                  <div className="mt-auto p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">Bulk mode active. Scanning automatically records +1 or -1.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
