import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'EN' | 'BN';

interface Translations {
  [key: string]: {
    EN: string;
    BN: string;
  };
}

const translations: Translations = {
  'app.title': { EN: 'UDN - TACTICAL MARKETPLACE', BN: 'ইউডিএন - ট্যাকটিক্যাল মার্কেটপ্লেস' },
  'boot.initializing': { EN: 'INITIALIZING UDN CORE...', BN: 'ইউডিএন কোর শুরু হচ্ছে...' },
  'boot.loading_assets': { EN: 'LOADING OPERATIONAL ASSETS...', BN: 'অপারেশনাল অ্যাসেট লোড হচ্ছে...' },
  'boot.securing_connection': { EN: 'SECURING ENCRYPTED CONNECTION...', BN: 'এনক্রিপ্টেড সংযোগ সুরক্ষিত করা হচ্ছে...' },
  'boot.ready': { EN: 'SYSTEM READY. ACCESS GRANTED.', BN: 'সিস্টেম প্রস্তুত। অ্যাক্সেস মঞ্জুর করা হয়েছে।' },
  'auth.login': { EN: 'LOGIN WITH GOOGLE', BN: 'গুগল দিয়ে লগইন করুন' },
  'onboarding.role_selection': { EN: 'SELECT OPERATIONAL ROLE', BN: 'অপারেশনাল রোল নির্বাচন করুন' },
  'onboarding.zone_assignment': { EN: 'ZONE ASSIGNMENT', BN: 'জোন অ্যাসাইনমেন্ট' },
  'onboarding.codename_generation': { EN: 'CODENAME GENERATION', BN: 'কোডনাম জেনারেশন' },
  'market.the_scan': { EN: 'THE SCAN', BN: 'দ্য স্ক্যান' },
  'market.grid': { EN: 'GRID', BN: 'গ্রিড' },
  'market.map': { EN: 'MAP', BN: 'ম্যাপ' },
  'market.sold_out': { EN: 'SOLD OUT', BN: 'বিক্রি শেষ' },
  'market.active': { EN: 'ACTIVE', BN: 'সক্রিয়' },
  'market.secure_drop': { EN: 'SECURE DROP', BN: 'সিকিউর ড্রপ' },
  'chat.ops_center': { EN: 'OPS CENTER', BN: 'অপস সেন্টার' },
  'chat.handshake': { EN: 'ESTABLISHING HANDSHAKE...', BN: 'হ্যান্ডশেক স্থাপন করা হচ্ছে...' },
  'chat.encrypted': { EN: 'CHANNEL ENCRYPTED', BN: 'চ্যানেল এনক্রিপ্টেড' },
  'profile.agent_intelligence': { EN: 'AGENT INTELLIGENCE', BN: 'এজেন্ট ইন্টেলিজেন্স' },
  'common.accept': { EN: 'ACCEPT', BN: 'গ্রহণ করুন' },
  'common.reject': { EN: 'REJECT', BN: 'প্রত্যাখ্যান করুন' },
  'common.cancel': { EN: 'CANCEL', BN: 'বাতিল করুন' },
  'common.confirm': { EN: 'CONFIRM', BN: 'নিশ্চিত করুন' },
  'common.delivered': { EN: 'DELIVERED', BN: 'ডেলিভার করা হয়েছে' },
  'common.received': { EN: 'RECEIVED', BN: 'গৃহীত হয়েছে' },
  'common.back': { EN: 'BACK', BN: 'পিছনে' },
  'common.next': { EN: 'NEXT', BN: 'পরবর্তী' },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('EN');

  const t = (key: string) => {
    return translations[key]?.[lang] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
