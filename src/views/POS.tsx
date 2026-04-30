import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../hooks/useFirebase';
import { formatMoney } from '../utils/format';
import { Search, ShoppingCart, Minus, Plus, Trash2, CheckCircle2, PauseCircle, PlayCircle, Receipt } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useI18n } from '../context/I18nContext';
import clsx from 'clsx';

interface CartItem {
  id: string; // Inventory ID
  name: string;
  price: number;
  cost: number;
  qty: number;
  stock: number;
}

export const POS = () => {
  const { tenant, activeWorkspaceId } = useAuth();
  const { inventory } = useInventory(activeWorkspaceId!);
  const { t, isRtl } = useI18n();

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldCart, setHeldCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash'|'card'|'credit'>('cash');
  const [amountTendered, setAmountTendered] = useState<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>('');
  const barcodeTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const processBarcode = (term: string) => {
      const match = inventory.find(i => i.barcode === term || i.name.toLowerCase() === term);

      if (match) {
        if (match.stock <= 0) {
          toast.error(t('pos.outOfStock'));
          return;
        }

        setCart(prev => {
          const existing = prev.find(p => p.id === match.id);
          if (existing) {
            if (existing.qty >= match.stock) {
              toast.error(t('pos.notEnoughStock'));
              return prev;
            }
            return prev.map(p => p.id === match.id ? { ...p, qty: p.qty + 1 } : p);
          }
          return [...prev, { id: match.id, name: match.name, price: match.salePrice, cost: match.cost, qty: 1, stock: match.stock }];
        });
        setSearch('');
      } else {
        toast.error(t('pos.notFound'));
      }
    };

    // Global Keyboard Listener for physical Barcode Scanners
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input field other than search
      if (document.activeElement?.tagName === 'INPUT' && document.activeElement !== searchInputRef.current) return;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length > 0) {
           processBarcode(barcodeBufferRef.current);
           barcodeBufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
        if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
        // Clear buffer if it takes too long (human typing vs scanner)
        barcodeTimeoutRef.current = setTimeout(() => { barcodeBufferRef.current = ''; }, 100);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [inventory, t]);

  const processBarcodeManual = (term: string) => {
      const match = inventory.find(i => i.barcode === term || i.name.toLowerCase() === term);

      if (match) {
        if (match.stock <= 0) {
          toast.error(t('pos.outOfStock'));
          return;
        }

        setCart(prev => {
          const existing = prev.find(p => p.id === match.id);
          if (existing) {
            if (existing.qty >= match.stock) {
              toast.error(t('pos.notEnoughStock'));
              return prev;
            }
            return prev.map(p => p.id === match.id ? { ...p, qty: p.qty + 1 } : p);
          }
          return [...prev, { id: match.id, name: match.name, price: match.salePrice, cost: match.cost, qty: 1, stock: match.stock }];
        });
        setSearch('');
      } else {
        toast.error(t('pos.notFound'));
      }
  };

  if (!tenant) return null;

  const handleSearchAndAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const term = search.toLowerCase();
      processBarcodeManual(term);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        if (newQty > item.stock) {
          toast.error(t('pos.cannotExceed'));
          return item;
        }
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.1; // Example 10% tax
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const batch = writeBatch(db);

      // 1. Deduct Inventory safely using increment
      cart.forEach(item => {
        const itemRef = doc(db, 'inventory', item.id);
        batch.update(itemRef, { stock: increment(-item.qty) });
      });

      // 2. Log Sale Transaction
      const saleRef = doc(collection(db, 'sales'));
      const saleData = {
        tenantId: activeWorkspaceId,
        cashierId: 'todo_auth_id', // TODO: hook up to employee id
        cashierName: 'todo_auth_name',
        status: 'completed',
        paymentMethod,
        items: cart.map(i => ({
          inventoryId: i.id,
          name: i.name,
          quantity: i.qty,
          salePrice: i.price,
          cost: i.cost
        })),
        subtotal,
        tax,
        discount: 0,
        total,
        amountTendered,
        changeDue: Math.max(0, amountTendered - total),
        currency: tenant.currency, // Crucial: Stamped currency at time of sale
        timestamp: serverTimestamp()
      };
      batch.set(saleRef, saleData);

      await batch.commit();

      toast.success(t('pos.success'));
      printReceipt(saleRef.id, cart, total, amountTendered, tax);
      setCart([]);
      setAmountTendered(0);
    } catch (e) {
      toast.error(t('pos.fail'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHoldCart = () => {
    if (cart.length === 0) return;
    setHeldCart(cart);
    setCart([]);
    toast.success('Cart suspended.');
  };

  const handleRecallCart = () => {
    if (heldCart.length === 0) return;
    setCart(heldCart);
    setHeldCart([]);
    toast.success('Cart recalled.');
  };

  const printReceipt = (invoiceId: string, itemsToPrint: CartItem[], invoiceTotal: number, tendered: number, invoiceTax: number) => {
    const receiptContent = `
      <div style="width: 80mm; font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; padding: 10px; margin: 0 auto; background: white;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 16px;">${tenant.businessDisplayName || tenant.name}</h2>
          <p style="margin: 5px 0;">${tenant.supportPhone || ''}</p>
          <p style="margin: 5px 0; border-bottom: 1px dashed #000; padding-bottom: 10px;">Tax Invoice: #${invoiceId.substring(0, 8)}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left; padding: 5px 0;">Item</th>
              <th style="text-align: center; padding: 5px 0;">Qty</th>
              <th style="text-align: right; padding: 5px 0;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsToPrint.map(item => `
              <tr>
                <td style="padding: 5px 0; max-width: 40mm; word-wrap: break-word;">${item.name}</td>
                <td style="text-align: center; padding: 5px 0;">${item.qty}</td>
                <td style="text-align: right; padding: 5px 0;">${formatMoney(item.price * item.qty, tenant.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;"><span>Tax (10%):</span><span>${formatMoney(invoiceTax, tenant.currency)}</span></div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px;"><span>TOTAL:</span><span>${formatMoney(invoiceTotal, tenant.currency)}</span></div>
        </div>
        <div style="border-top: 1px dashed #000; padding-top: 10px;">
           <div style="display: flex; justify-content: space-between;"><span>Tendered:</span><span>${formatMoney(tendered, tenant.currency)}</span></div>
           <div style="display: flex; justify-content: space-between;"><span>Change:</span><span>${formatMoney(Math.max(0, tendered - invoiceTotal), tenant.currency)}</span></div>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 10px;">
          <p>Thank you for your business!</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Receipt</title></head><body style="margin:0;">' + receiptContent + '</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <div className={clsx("flex flex-col gap-6 h-full pb-8", isRtl ? "md:flex-row-reverse" : "md:flex-row")}>

      {/* Left Area: Search & Quick Add */}
      <div className="flex-[2] flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{t('nav.pos')}</h1>
        </div>

        <div className="relative">
          <Search className={clsx("absolute top-1/2 -translate-y-1/2 text-gray-400", isRtl ? "right-4" : "left-4")} size={24} />
          <input
            type="text"
            placeholder={t('action.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchAndAdd}
            className={clsx("w-full py-4 bg-white dark:bg-dark-panel border-2 border-gray-200 dark:border-gray-800 rounded-2xl text-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold", isRtl ? "pr-14 pl-6" : "pl-14 pr-6")}
            autoFocus
          />
        </div>

        <div className="flex-1 bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-xl shadow-gray-200/40 dark:shadow-none overflow-y-auto">
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t('pos.quickAdd')}</h3>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {inventory.slice(0, 12).map(item => (
               <button
                key={item.id}
                onClick={() => handleSearchAndAdd({ key: 'Enter', target: { value: item.barcode } } as any)}
                disabled={item.stock <= 0}
                className="text-left p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-500 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                 <div className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.name}</div>
                 <div className="text-sm text-gray-500 mb-3">{item.stock} in stock</div>
                 <div className="font-black text-blue-600 dark:text-blue-400">{formatMoney(item.salePrice, tenant.currency)}</div>
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Right Area: Cart & Checkout */}
      <div className="flex-1 flex flex-col bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-200/40 dark:shadow-none overflow-hidden h-[calc(100vh-8rem)]">

        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 bg-gray-50/50 dark:bg-slate-900/20">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-blue-600" />
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-bold">
              {cart.length}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleHoldCart}
              disabled={cart.length === 0}
              title="Suspend Cart"
              className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg disabled:opacity-50 transition-colors"
            >
              <PauseCircle size={20} />
            </button>
            <button
              onClick={handleRecallCart}
              disabled={heldCart.length === 0}
              title={`Recall Cart (${heldCart.length} items)`}
              className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg disabled:opacity-50 transition-colors relative"
            >
              <PlayCircle size={20} />
              {heldCart.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900"></span>}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
              <ShoppingCart size={48} className="mb-4" />
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center p-3 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-800/50 transition-colors">
                <div className="flex-1">
                  <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                  <div className="text-sm font-black text-blue-600 dark:text-blue-400">{formatMoney(item.price, tenant.currency)}</div>
                </div>

                <div className="flex items-center gap-3 px-4">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-md">
                    <Minus size={16} />
                  </button>
                  <span className="font-black w-6 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-md">
                    <Plus size={16} />
                  </button>
                </div>

                <div className="text-right w-20 font-bold text-gray-900 dark:text-white">
                  {formatMoney(item.price * item.qty, tenant.currency)}
                </div>

                <button onClick={() => removeFromCart(item.id)} className="ml-4 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50/80 dark:bg-slate-900/50 border-t border-gray-100 dark:border-gray-800">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm font-semibold text-gray-500">
              <span>{t('pos.subtotal')}</span>
              <span>{formatMoney(subtotal, tenant.currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-gray-500">
              <span>{t('pos.tax')}</span>
              <span>{formatMoney(tax, tenant.currency)}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2 mt-2">
                {(['cash', 'card', 'credit'] as const).map(pm => (
                  <button
                    key={pm}
                    onClick={() => {
                       setPaymentMethod(pm);
                       if (pm !== 'cash') setAmountTendered(total);
                    }}
                    className={clsx(
                      "flex-1 py-2 text-xs font-bold uppercase rounded-lg border-2 transition-all",
                      paymentMethod === pm ? "border-blue-500 bg-blue-500 text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-200"
                    )}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tendered Input (Only if Cash) */}
            {paymentMethod === 'cash' && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-semibold text-gray-500">Tendered:</span>
                <input
                  type="number"
                  min={total}
                  value={amountTendered || ''}
                  onChange={(e) => setAmountTendered(Number(e.target.value))}
                  className="w-24 text-right px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            )}

            {paymentMethod === 'cash' && amountTendered > total && (
              <div className="flex justify-between text-sm font-bold text-emerald-500 pt-1">
                <span>Change Due:</span>
                <span>{formatMoney(amountTendered - total, tenant.currency)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-gray-900 dark:text-white font-black text-lg">{t('pos.total')}</span>
              <span className="text-blue-600 dark:text-blue-400 font-black text-3xl">{formatMoney(total, tenant.currency)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-black text-lg rounded-xl shadow-xl shadow-emerald-500/30 transition-all"
          >
            <CheckCircle2 /> {isProcessing ? t('pos.processing') : t('pos.checkout')}
          </button>
        </div>

      </div>
    </div>
  );
};
