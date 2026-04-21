import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Tenant } from '../types';
import { useTenantData } from '../hooks/useFirebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  tenant: Tenant | null;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Default to user's own workspace, unless they are super admin and switch it later
        setActiveWorkspaceId(currentUser.uid);
      } else {
        setActiveWorkspaceId(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isSuperAdmin = user?.email === 'abanoublotfy@gmail.com';

  // Real-time live tenant data for the active workspace
  const { tenant } = useTenantData(activeWorkspaceId);

  return (
    <AuthContext.Provider value={{ user, loading, isSuperAdmin, tenant, activeWorkspaceId, setActiveWorkspaceId }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
