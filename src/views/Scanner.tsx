import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export const Scanner = () => {
  const { tenant } = useAuth();
  const { t } = useI18n();

  if (!tenant) return null;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{t('nav.scanner')}</h1>
      </div>

      <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-10 text-center text-gray-500">
        <h2 className="text-xl font-bold mb-2">{t('scanner.module')}</h2>
        <p>{t('scanner.placeholder')}</p>
      </div>
    </div>
  );
};
