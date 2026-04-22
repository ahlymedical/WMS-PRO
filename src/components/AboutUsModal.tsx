import React from 'react';
import { useI18n } from '../context/I18nContext';
import { X, Globe, Mail, Phone, Code2 } from 'lucide-react';
import clsx from 'clsx';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  const { t, isRtl } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in border border-white/20 dark:border-slate-700/50">

        {/* Left/Right Branding Banner */}
        <div className={clsx(
          "bg-gradient-to-br from-indigo-600 to-blue-700 p-8 flex flex-col justify-center items-center text-white md:w-2/5",
          isRtl ? "md:order-last" : ""
        )}>
          <div className="w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-lg flex items-center justify-center mb-6 shadow-inner border border-white/20">
            <span className="text-3xl font-black tracking-tighter">MP</span>
          </div>
          <h2 className="text-2xl font-black text-center tracking-tight mb-2">MalakPay WMS PRO</h2>
          <p className="text-sm text-indigo-100 text-center font-medium opacity-80">
            Enterprise Cloud Platform
          </p>
        </div>

        {/* Info Section */}
        <div className="p-8 flex-1 relative">
          <button
            onClick={onClose}
            className={clsx("absolute top-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors", isRtl ? "left-4" : "right-4")}
          >
            <X size={24} />
          </button>

          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">{t('brand.about')}</h3>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                <Code2 size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t('brand.developer')}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{t('brand.devName')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Globe size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t('brand.contact')}</p>
                <a href="https://www.malakpay.com" target="_blank" rel="noreferrer" className="block text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mb-1">www.malakpay.com</a>
                <a href="https://www.malakclickpay.com" target="_blank" rel="noreferrer" className="block text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">www.malakclickpay.com</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email</p>
                <a href="mailto:malakclickpay@gmail.com" className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-amber-600 transition-colors">malakclickpay@gmail.com</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Phone</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200" dir="ltr">{t('brand.phone').replace('Phone: ', '').replace('هاتف: ', '')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
