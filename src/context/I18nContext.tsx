import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations = {
  en: {
    // Navigation
    'nav.nexus': 'Nexus Overview',
    'nav.tenants': 'Tenants & Accounts',
    'nav.currency': 'Currency Requests',
    'nav.audit': 'Audit Logs',
    'nav.security': 'Security Engine',
    'nav.dashboard': 'Dashboard',
    'nav.inventory': 'Inventory',
    'nav.scanner': 'Smart Scanner',
    'nav.pos': 'Cashier POS',
    'nav.reports': 'Reports & BI',
    'nav.settings': 'Settings',
    'nav.signout': 'Sign Out',
    'nav.workspace': 'Workspace',
    'nav.retail': 'Retail & Finance',
    'nav.config': 'Configuration',
    'nav.oversight': 'Oversight',
    'nav.system': 'System',

    // Switcher
    'switch.command': 'Command',
    'switch.private': 'Private HQ',

    // Generic
    'action.save': 'Save',
    'action.delete': 'Delete',
    'action.cancel': 'Cancel',
    'action.approve': 'Approve',
    'action.reject': 'Reject',
    'action.search': 'Search...',

    // POS
    'pos.scan': 'Scan barcode or type item name and press Enter...',
    'pos.quickAdd': 'Quick Add Catalog',
    'pos.cart': 'Current Cart',
    'pos.empty': 'Cart is empty',
    'pos.subtotal': 'Subtotal',
    'pos.tax': 'Tax (10%)',
    'pos.total': 'Total',
    'pos.checkout': 'Complete Checkout',
    'pos.processing': 'Processing...',
    'pos.outOfStock': 'Item is out of stock!',
    'pos.notEnoughStock': 'Not enough stock available',
    'pos.notFound': 'Item not found',
    'pos.cannotExceed': 'Cannot exceed available stock',
    'pos.success': 'Checkout successful!',
    'pos.fail': 'Checkout failed',

    // Inventory
    'inventory.title': 'Inventory Management',
    'inventory.desc': 'Manage stock, prices, and alerts for your warehouse.',
    'inventory.add': 'Add New Item',
    'inventory.search': 'Search by name or barcode...',
    'inventory.sort': 'Sort',
    'inventory.table.name': 'Item Name',
    'inventory.table.barcode': 'Barcode',
    'inventory.table.stock': 'Stock',
    'inventory.table.alert': 'Min Alert',
    'inventory.table.status': 'Status',
    'inventory.table.actions': 'Actions',
    'inventory.empty': 'No items found matching your search.',
    'inventory.lowStock': 'Low Stock',
    'inventory.healthy': 'Healthy',
    'inventory.confirmDelete': 'Delete this item permanently?',
    'inventory.deleteSuccess': 'Item deleted',
    'inventory.deleteFail': 'Failed to delete item',

    // Dashboard
    'dash.title': 'Workspace Overview',
    'dash.desc': 'Welcome to {name} HQ',
    'dash.currency.active': 'Active Currency',
    'dash.currency.pending': 'Pending Approval',
    'dash.revenue': 'Total Revenue',
    'dash.revenue.trend': '+12.5% this month',
    'dash.stock': 'Stock Volume',
    'dash.stock.desc': 'Units across {count} items',
    'dash.alert': 'Action Required',
    'dash.alert.desc': 'Items below minimum threshold',

    // Scanner
    'scanner.title': 'Smart Scanner',
    'scanner.desc': 'Receive or issue stock via barcode scanning.',
    'scanner.module': 'Scanner Module',
    'scanner.placeholder': 'Implementation placeholder. Reuses the html5-qrcode logic from the original shell.',

    // Auth & Permission Messages
    'err.permission': 'Missing or insufficient permissions.',
    'msg.success': 'Operation completed successfully.',
    'msg.fail': 'Failed to execute operation.',

    // Settings
    'settings.title': 'Workspace Settings',
    'settings.desc': 'Configure your business rules and local preferences.',
    'settings.currency.title': 'Operating Currency',
    'settings.currency.desc': 'Request a change to your primary business currency.',
    'settings.currency.current': 'Current Active Currency',
    'settings.currency.pending': 'Pending Change',
    'settings.currency.request': 'Request New Currency',
    'settings.currency.submit': 'Submit Request to Nexus',
    'settings.approval.pending': 'Approval Pending',
    'settings.approval.msg': 'You have requested to change your currency to {currency}. You cannot submit another request until the Master Admin reviews this one.',

    // Super Admin Dashboard
    'admin.title': 'Nexus Overview',
    'admin.desc': 'Global SaaS command center and telemetry.',
    'admin.metrics.tenants': 'Total Tenants',
    'admin.metrics.pending': 'Pending Currency',
    'admin.table.workspace': 'Workspace / Email',
    'admin.table.current': 'Current Currency',
    'admin.table.requested': 'Requested Currency',
    'admin.table.actions': 'Actions',
    'admin.table.empty': 'No pending currency requests.',
    'admin.action.approveSync': 'Approve & Sync',

    // Errors mapped safely
    'err.admin.deleteFail': 'Cannot delete this account.',
    'err.admin.noData': 'Cannot process missing data.'
  },
  ar: {
    // Navigation
    'nav.nexus': 'نظرة عامة على النظام (Nexus)',
    'nav.tenants': 'الحسابات والمستأجرين',
    'nav.currency': 'طلبات تغيير العملة',
    'nav.audit': 'سجلات النظام',
    'nav.security': 'محرك الأمان',
    'nav.dashboard': 'لوحة القيادة',
    'nav.inventory': 'المخزن',
    'nav.scanner': 'الماسح الذكي',
    'nav.pos': 'نقطة البيع (الكاشير)',
    'nav.reports': 'التقارير والإحصائيات',
    'nav.settings': 'الإعدادات',
    'nav.signout': 'تسجيل الخروج',
    'nav.workspace': 'مساحة العمل',
    'nav.retail': 'التجزئة والمالية',
    'nav.config': 'التكوين',
    'nav.oversight': 'الإشراف العام',
    'nav.system': 'النظام',

    // Switcher
    'switch.command': 'مركز القيادة',
    'switch.private': 'المخزن الخاص',

    // Generic
    'action.save': 'حفظ',
    'action.delete': 'حذف',
    'action.cancel': 'إلغاء',
    'action.approve': 'موافقة',
    'action.reject': 'رفض',
    'action.search': 'بحث...',

    // POS
    'pos.scan': 'قم بمسح الباركود أو كتابة اسم العنصر واضغط Enter...',
    'pos.quickAdd': 'قائمة الإضافة السريعة',
    'pos.cart': 'عربة التسوق الحالية',
    'pos.empty': 'عربة التسوق فارغة',
    'pos.subtotal': 'المجموع الفرعي',
    'pos.tax': 'الضريبة (10%)',
    'pos.total': 'الإجمالي',
    'pos.checkout': 'إتمام الدفع',
    'pos.processing': 'جاري المعالجة...',
    'pos.outOfStock': 'العنصر غير متوفر في المخزون!',
    'pos.notEnoughStock': 'الكمية المتوفرة غير كافية',
    'pos.notFound': 'العنصر غير موجود',
    'pos.cannotExceed': 'لا يمكن تجاوز المخزون المتوفر',
    'pos.success': 'تم الدفع بنجاح!',
    'pos.fail': 'فشل في عملية الدفع',

    // Inventory
    'inventory.title': 'إدارة المخزون',
    'inventory.desc': 'إدارة المخزون، الأسعار، والتنبيهات الخاصة بمستودعك.',
    'inventory.add': 'إضافة عنصر جديد',
    'inventory.search': 'البحث بالاسم أو الباركود...',
    'inventory.sort': 'فرز',
    'inventory.table.name': 'اسم العنصر',
    'inventory.table.barcode': 'الباركود',
    'inventory.table.stock': 'المخزون',
    'inventory.table.alert': 'الحد الأدنى',
    'inventory.table.status': 'الحالة',
    'inventory.table.actions': 'الإجراءات',
    'inventory.empty': 'لا توجد عناصر تطابق بحثك.',
    'inventory.lowStock': 'مخزون منخفض',
    'inventory.healthy': 'جيد',
    'inventory.confirmDelete': 'هل أنت متأكد من حذف هذا العنصر نهائياً؟',
    'inventory.deleteSuccess': 'تم حذف العنصر',
    'inventory.deleteFail': 'فشل في حذف العنصر',

    // Dashboard
    'dash.title': 'نظرة عامة على مساحة العمل',
    'dash.desc': 'مرحباً بك في مقر {name}',
    'dash.currency.active': 'العملة النشطة',
    'dash.currency.pending': 'في انتظار الموافقة',
    'dash.revenue': 'إجمالي الإيرادات',
    'dash.revenue.trend': '+12.5% هذا الشهر',
    'dash.stock': 'حجم المخزون',
    'dash.stock.desc': 'وحدات عبر {count} عناصر',
    'dash.alert': 'إجراء مطلوب',
    'dash.alert.desc': 'عناصر تحت الحد الأدنى',

    // Scanner
    'scanner.title': 'الماسح الذكي',
    'scanner.desc': 'استلام أو إصدار المخزون عبر مسح الباركود.',
    'scanner.module': 'وحدة الماسح',
    'scanner.placeholder': 'مكان للتنفيذ المستقبلي. يعيد استخدام منطق html5-qrcode من الواجهة الأصلية.',

    // Auth & Permission Messages
    'err.permission': 'لا تملك صلاحية تنفيذ هذا الإجراء.',
    'msg.success': 'تم تنفيذ العملية بنجاح.',
    'msg.fail': 'تعذر تنفيذ العملية.',

    // Settings
    'settings.title': 'إعدادات مساحة العمل',
    'settings.desc': 'قم بتكوين قواعد عملك وتفضيلاتك المحلية.',
    'settings.currency.title': 'عملة التشغيل',
    'settings.currency.desc': 'اطلب تغييراً لعملة عملك الأساسية.',
    'settings.currency.current': 'العملة النشطة الحالية',
    'settings.currency.pending': 'تغيير قيد الانتظار',
    'settings.currency.request': 'طلب عملة جديدة',
    'settings.currency.submit': 'إرسال الطلب إلى النظام الرئيسي',
    'settings.approval.pending': 'في انتظار الموافقة',
    'settings.approval.msg': 'لقد طلبت تغيير عملتك إلى {currency}. لا يمكنك تقديم طلب آخر حتى يقوم المسؤول الرئيسي بمراجعة هذا الطلب.',

    // Super Admin Dashboard
    'admin.title': 'المركز الرئيسي للنظام',
    'admin.desc': 'مركز القيادة العالمي للنظام.',
    'admin.metrics.tenants': 'إجمالي المستأجرين',
    'admin.metrics.pending': 'العملات المعلقة',
    'admin.table.workspace': 'مساحة العمل / البريد',
    'admin.table.current': 'العملة الحالية',
    'admin.table.requested': 'العملة المطلوبة',
    'admin.table.actions': 'الإجراءات',
    'admin.table.empty': 'لا توجد طلبات عملة معلقة.',
    'admin.action.approveSync': 'موافقة ومزامنة',

    // Errors mapped safely
    'err.admin.deleteFail': 'تعذر حذف هذا الحساب.',
    'err.admin.noData': 'لا يمكن تنفيذ العملية لأن البيانات غير مكتملة.'
  }
};

const I18nContext = createContext<I18nContextType>({} as I18nContextType);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('wims_lang') as Language) || 'ar'; // Default to Arabic as requested
  });

  useEffect(() => {
    localStorage.setItem('wims_lang', lang);
    const htmlTag = document.documentElement;
    if (lang === 'ar') {
      htmlTag.setAttribute('dir', 'rtl');
      htmlTag.setAttribute('lang', 'ar');
    } else {
      htmlTag.setAttribute('dir', 'ltr');
      htmlTag.setAttribute('lang', 'en');
    }
  }, [lang]);

  const t = (key: string): string => {
    const dictionary = translations[lang];
    return (dictionary as Record<string, string>)[key] || key;
  };

  const isRtl = lang === 'ar';

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRtl }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
