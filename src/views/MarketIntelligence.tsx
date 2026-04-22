import React from 'react';
import { useI18n } from '../context/I18nContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Coins, Crown } from 'lucide-react';
import clsx from 'clsx';

const mockCurrencyData = [
  { name: 'USD', rate: 47.85, change: '+0.05' },
  { name: 'EUR', rate: 52.12, change: '+0.12' },
  { name: 'JPY', rate: 0.31, change: '-0.01' },
  { name: 'CNY', rate: 6.61, change: '+0.02' }
];

const mockGoldData = [
  { type: '24K', price: '3,850 EGP' },
  { type: '21K', price: '3,368 EGP' },
  { type: '18K', price: '2,887 EGP' }
];

const chartData = [
  { day: 'Mon', EGP: 47.5 },
  { day: 'Tue', EGP: 47.6 },
  { day: 'Wed', EGP: 47.5 },
  { day: 'Thu', EGP: 47.7 },
  { day: 'Fri', EGP: 47.85 }
];

export const MarketIntelligence = () => {
  const { t, isRtl } = useI18n();

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Market Intelligence</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Live tracking of Global Currencies & Local Gold Rates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Currencies */}
        <div className="bg-white dark:bg-dark-panel border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Coins size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Global Exchange Rates</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Base: EGP (Egypt)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {mockCurrencyData.map(c => (
              <div key={c.name} className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-900 dark:text-white">{c.name}</span>
                  <span className={clsx("text-xs font-black", c.change.startsWith('+') ? "text-emerald-500" : "text-rose-500")}>
                    {c.change}
                  </span>
                </div>
                <div className="text-2xl font-black text-gray-700 dark:text-gray-300">{c.rate}</div>
              </div>
            ))}
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" stroke="#8884d8" />
                <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} stroke="#8884d8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="EGP" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gold */}
        <div className="bg-white dark:bg-dark-panel border border-amber-100 dark:border-amber-900/30 rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <Crown size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Local Gold Rates</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Live feed updated every 15 mins</p>
            </div>
          </div>

          <div className="space-y-4">
            {mockGoldData.map(g => (
              <div key={g.type} className="p-6 border border-amber-100 dark:border-amber-900/50 rounded-xl bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/10 dark:to-transparent flex justify-between items-center">
                <span className="text-xl font-black text-amber-600 dark:text-amber-500">{g.type}</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">{g.price}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              Use these metrics to adjust your inventory cost-basis safely against local inflation.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
