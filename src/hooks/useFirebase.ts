import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, writeBatch, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { InventoryItem, SaleTransaction, StockTransaction, Tenant } from '../types';

export const useTenantData = (uid: string | null) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;

    if (uid) {
      const docRef = doc(db, 'tenants', uid);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setTenant({ id: docSnap.id, ...docSnap.data() } as Tenant);
        } else {
          setTenant(null);
        }
        setLoading(false);
      });
    } else {
       setTenant(null);
       setLoading(false);
    }

    return () => {
        if (unsubscribe) unsubscribe();
    };
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
      txs.sort((a, b) => {
        const timeA = a.timestamp && 'toMillis' in a.timestamp ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp && 'toMillis' in b.timestamp ? b.timestamp.toMillis() : 0;
        return timeB - timeA;
      });
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
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === 'permission-denied') throw new Error('err.permission');
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
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === 'permission-denied') throw new Error('err.permission');
    throw new Error('msg.fail');
  }
};

export const archiveTenant = async (tenantId: string, tenantData: Tenant, reason: string) => {
  if (!reason.trim()) throw new Error('Reason is required');
  try {
    const archiveRef = doc(db, 'deleted_users_archive', tenantId);
    await setDoc(archiveRef, { ...tenantData, archivedAt: new Date(), archiveReason: reason }, { merge: true });

    const historyRef = doc(collection(db, 'deleted_users_history'));
    await setDoc(historyRef, {
      tenantId,
      email: tenantData.email,
      name: tenantData.name,
      reason,
      action: 'archived',
      timestamp: new Date()
    });

    const ref = doc(db, 'tenants', tenantId);
    await updateDoc(ref, { status: 'rejected' });
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === 'permission-denied') throw new Error('err.permission');
    throw new Error('err.admin.deleteFail');
  }
};

export const deleteTenantData = async (tenantId: string, tenantData: Tenant, reason: string) => {
  if (!reason.trim()) throw new Error('Reason is required');
  try {
    const historyRef = doc(collection(db, 'deleted_users_history'));
    await setDoc(historyRef, {
      tenantId,
      email: tenantData.email,
      name: tenantData.name,
      reason,
      action: 'deleted',
      timestamp: new Date()
    });

    const ref = doc(db, 'tenants', tenantId);
    await deleteDoc(ref);
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === 'permission-denied') throw new Error('err.permission');
    throw new Error('err.admin.deleteFail');
  }
};

export const checkDeletionHistory = async (email: string) => {
  const q = query(collection(db, 'deleted_users_history'), where('email', '==', email));
  const snapshot = await getDoc(doc(db, 'deleted_users_history', email)); // Note: Using collection query logic in components, keeping this simple.
  return snapshot.exists();
};

export const updateTenantPermissions = async (tenantId: string, updates: Partial<Tenant>) => {
  try {
    const ref = doc(db, 'tenants', tenantId);
    await updateDoc(ref, updates);
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === 'permission-denied') throw new Error('err.permission');
    throw new Error('msg.fail');
  }
};
