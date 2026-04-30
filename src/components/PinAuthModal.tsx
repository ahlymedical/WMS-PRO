import React, { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { ShieldAlert, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface PinAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (managerId: string) => void;
  actionDescription: string;
}

export const PinAuthModal = ({ isOpen, onClose, onSuccess, actionDescription }: PinAuthModalProps) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();
  const { tenant } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setPin('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      toast.error(t('auth.pin.invalidLength'));
      return;
    }

    if (!tenant) return;

    setIsLoading(true);
    try {
      // Query users collection for a manager/admin within this tenant matching the PIN
      // Note: In a real enterprise app, PINs should be hashed. For this prototype, we check direct value.
      const q = query(
        collection(db, 'users'),
        where('tenantId', '==', tenant.id),
        where('pin', '==', pin)
      );

      const snap = await getDocs(q);

      let validManagerFound = false;
      let managerId = '';

      snap.forEach((doc) => {
        const userData = doc.data();
        if (userData.role === 'manager' || userData.role === 'admin') {
          validManagerFound = true;
          managerId = doc.id;
        }
      });

      if (validManagerFound) {
        toast.success(t('auth.pin.success'));
        onSuccess(managerId);
        onClose();
      } else {
        toast.error(t('auth.pin.invalid'));
        setPin('');
      }
    } catch (error) {
      console.error(error);
      toast.error(t('msg.fail'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-rose-500/20">
        <div className="p-4 flex justify-between items-start border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-500">
            <ShieldAlert size={24} />
            <h3 className="font-bold text-lg">{t('auth.pin.title')}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4 text-center">
              {actionDescription}
            </p>
            <div className="text-center">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                autoFocus
                placeholder="••••••"
                className="w-full text-center text-4xl tracking-[1em] font-mono py-4 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-rose-500 focus:ring-0 outline-none bg-gray-50 dark:bg-slate-800 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t('action.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || pin.length !== 6}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading ? '...' : t('auth.pin.verify')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
