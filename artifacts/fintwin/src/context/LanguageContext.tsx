import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import i18n from '@/i18n';

type Lang = 'en' | 'ar';

interface LanguageContextValue {
  lang: Lang;
  isRTL: boolean;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  isRTL: false,
  toggleLanguage: () => {},
});

function applyDir(lang: Lang) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  const toggleLanguage = useCallback(() => {
    setLang(prev => {
      const next: Lang = prev === 'en' ? 'ar' : 'en';
      i18n.changeLanguage(next);
      applyDir(next);
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, isRTL: lang === 'ar', toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
