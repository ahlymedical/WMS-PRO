import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../hooks/useFirebase';
import { formatMoney } from '../utils/format';
import { Search, ShoppingCart, Minus, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

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

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!tenant) return null;

  const handleSearchAndAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const term = search.toLowerCase();
      const match = inventory.find(i => i.barcode === term || i.name.toLowerCase() === term);

      if (match) {
        if (match.stock <= 0) {
          toast.error("Item is out of stock!");
          return;
        }

        setCart(prev => {
          const existing = prev.find(p => p.id === match.id);
          if (existing) {
            if (existing.qty >= match.stock) {
              toast.error("Not enough stock available");
              return prev;
            }
            return prev.map(p => p.id === match.id ? { ...p, qty: p.qty + 1 } : p);
          }
          return [...prev, { id: match.id, name: match.name, price: match.salePrice, cost: match.cost, qty: 1, stock: match.stock }];
        });
        setSearch('');
      } else {
        toast.error("Item not found");
      }
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        if (newQty > item.stock) {
          toast.error("Cannot exceed available stock");
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

      // 1. Deduct Inventory
      cart.forEach(item => {
        const itemRef = doc(db, 'inventory', item.id);
        // Note: In production use FieldValue.increment
        // Here we assume local stock is fresh enough for demo, but should use increment
        batch.update(itemRef, { stock: item.stock - item.qty });
      });

      // 2. Log Sale Transaction
      const saleRef = doc(collection(db, 'sales'));
      const saleData = {
        tenantId: activeWorkspaceId,
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
        currency: tenant.currency, // Crucial: Stamped currency at time of sale
        timestamp: serverTimestamp()
      };
      batch.set(saleRef, saleData);

      await batch.commit();

      toast.success("Checkout successful!");
      setCart([]);
    } catch (e) {
      toast.error("Checkout failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full pb-8">

      {/* Left Area: Search & Quick Add */}
      <div className="flex-[2] flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Point of Sale</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Scan or search to ring up items instantly.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
          <input
            type="text"
            placeholder="Scan barcode or type item name and press Enter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchAndAdd}
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-dark-panel border-2 border-gray-200 dark:border-gray-800 rounded-2xl text-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold"
            autoFocus
          />
        </div>

        <div className="flex-1 bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-xl shadow-gray-200/40 dark:shadow-none overflow-y-auto">
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Add Catalog</h3>
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

        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50/50 dark:bg-slate-900/20">
          <ShoppingCart className="text-blue-600" />
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Current Cart</h2>
          <span className="ml-auto bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-bold">
            {cart.length} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
              <ShoppingCart size={48} className="mb-4" />
              <p className="font-medium">Cart is empty</p>
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
              <span>Subtotal</span>
              <span>{formatMoney(subtotal, tenant.currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-gray-500">
              <span>Tax (10%)</span>
              <span>{formatMoney(tax, tenant.currency)}</span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-gray-900 dark:text-white font-black text-lg">Total</span>
              <span className="text-blue-600 dark:text-blue-400 font-black text-3xl">{formatMoney(total, tenant.currency)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-black text-lg rounded-xl shadow-xl shadow-emerald-500/30 transition-all"
          >
            <CheckCircle2 /> {isProcessing ? 'Processing...' : 'Complete Checkout'}
          </button>
        </div>

      </div>
    </div>
  );
};
