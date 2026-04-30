import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Tenant, Employee } from '../types';
import { useTenantData } from '../hooks/useFirebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  employeeProfile: Employee | null;
  loading: boolean;
  isSuperAdmin: boolean;
  tenant: Tenant | null;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch employee profile to know their role and tenantId (if they are a cashier/manager)
        try {
           const empDoc = await getDoc(doc(db, 'users', currentUser.uid));
           if (empDoc.exists()) {
             const empData = empDoc.data() as Employee;
             setEmployeeProfile(empData);
             setActiveWorkspaceId(empData.tenantId);
           } else {
             // If not an employee, they are either the tenant owner or super admin
             setActiveWorkspaceId(currentUser.uid);
             setEmployeeProfile(null);
           }
        } catch (e) {
           console.error("Failed to fetch employee profile", e);
           setActiveWorkspaceId(currentUser.uid);
           setEmployeeProfile(null);
        }
      } else {
        setActiveWorkspaceId(null);
        setEmployeeProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isSuperAdmin = user?.email === 'abanoublotfy@gmail.com';

  // Real-time live tenant data for the active workspace
  const { tenant } = useTenantData(activeWorkspaceId);

  return (
    <AuthContext.Provider value={{ user, employeeProfile, loading, isSuperAdmin, tenant, activeWorkspaceId, setActiveWorkspaceId }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
