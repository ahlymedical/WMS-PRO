import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { InventoryItem, SaleTransaction, StockTransaction, Tenant } from '../types';

export const useTenantData = (uid: string | null) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setTenant(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'tenants', uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setTenant({ id: docSnap.id, ...docSnap.data() } as Tenant);
      } else {
        setTenant(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  return { tenant, loading };
};

export const useInventory = (tenantId: string | undefined) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const q = query(collection(db, 'inventory'), where('tenantId', '==', tenantId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: InventoryItem[] = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() } as InventoryItem));
      setInventory(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  return { inventory, loading };
};

export const useSales = (tenantId: string | undefined) => {
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const q = query(collection(db, 'sales'), where('tenantId', '==', tenantId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: SaleTransaction[] = [];
      snapshot.forEach((doc) => txs.push({ id: doc.id, ...doc.data() } as SaleTransaction));
      // Sort by timestamp desc locally for now
      txs.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
      setSales(txs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  return { sales, loading };
};

export const updateCurrencyRequest = async (tenantId: string, newCurrency: string) => {
  const ref = doc(db, 'tenants', tenantId);
  await updateDoc(ref, {
    pendingCurrency: newCurrency
  });
};

export const approveCurrency = async (tenantId: string, newCurrency: string) => {
  const ref = doc(db, 'tenants', tenantId);
  await updateDoc(ref, {
    currency: newCurrency,
    pendingCurrency: null
  });
};
