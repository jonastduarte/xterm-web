import React, { createContext, useContext, useState } from 'react';
import { T, TKey, Lang } from './translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => T[key]['en'],
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem('xtermweb_lang') as Lang) || 'en'
  );

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('xtermweb_lang', l);
  };

  const t = (key: TKey): string => T[key][lang] ?? T[key]['en'];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
