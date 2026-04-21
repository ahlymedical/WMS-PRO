import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Scanner = () => {
  const { tenant } = useAuth();

  if (!tenant) return null;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Smart Scanner</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Receive or issue stock via barcode scanning.</p>
      </div>

      <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-10 text-center text-gray-500">
        <h2 className="text-xl font-bold mb-2">Scanner Module</h2>
        <p>Implementation placeholder. Reuses the html5-qrcode logic from the original shell.</p>
      </div>
    </div>
  );
};
