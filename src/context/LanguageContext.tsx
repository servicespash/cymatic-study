import React, { createContext, useContext, useEffect, useState } from "react";
import { useLanguageStore, type LanguageCode } from "@/store/useLanguageStore";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: Record<string, string>;
  translate: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useLanguageStore();
  const [lang, setLang] = useState<LanguageCode>(store.language);

  // Sync state with Zustand store changes
  useEffect(() => {
    setLang(store.language);
  }, [store.language]);

  const handleSetLanguage = (newLang: LanguageCode) => {
    store.setLanguage(newLang);
    setLang(newLang);
  };

  const translate = (key: string, fallback?: string): string => {
    // If the key exists in our translation dictionary, use it
    if (store.t && key in store.t) {
      return (store.t as any)[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language: lang,
        setLanguage: handleSetLanguage,
        t: store.t as any,
        translate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
