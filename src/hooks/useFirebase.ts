import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, writeBatch, setDoc, deleteDoc } from 'firebase/firestore';
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
  try {
    const ref = doc(db, 'tenants', tenantId);
    await updateDoc(ref, {
      pendingCurrency: newCurrency
    });
  } catch (err: any) {
    if (err.code === 'permission-denied') throw new Error('err.permission');
    throw new Error('msg.fail');
  }
};

export const approveCurrency = async (tenantId: string, newCurrency: string) => {
  try {
    const ref = doc(db, 'tenants', tenantId);
    await updateDoc(ref, {
      currency: newCurrency,
      pendingCurrency: null
    });
  } catch (err: any) {
    if (err.code === 'permission-denied') throw new Error('err.permission');
    throw new Error('msg.fail');
  }
};

export const archiveTenant = async (tenantId: string, tenantData: Tenant) => {
  try {
    const archiveRef = doc(db, 'deleted_users_archive', tenantId);
    await setDoc(archiveRef, { ...tenantData, archivedAt: new Date() }, { merge: true });

    const ref = doc(db, 'tenants', tenantId);
    await updateDoc(ref, { status: 'rejected' });
  } catch (err: any) {
    if (err.code === 'permission-denied') throw new Error('err.permission');
    throw new Error('err.admin.deleteFail');
  }
};

export const deleteTenantData = async (tenantId: string) => {
  try {
    const ref = doc(db, 'tenants', tenantId);
    await deleteDoc(ref);
  } catch (err: any) {
    if (err.code === 'permission-denied') throw new Error('err.permission');
    throw new Error('err.admin.deleteFail');
  }
};

export const updateTenantPermissions = async (tenantId: string, updates: Partial<Tenant>) => {
  try {
    const ref = doc(db, 'tenants', tenantId);
    await updateDoc(ref, updates);
  } catch (err: any) {
    if (err.code === 'permission-denied') throw new Error('err.permission');
    throw new Error('msg.fail');
  }
};
