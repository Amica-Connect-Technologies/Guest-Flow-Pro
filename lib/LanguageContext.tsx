"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, type Lang } from "./i18n";

type Translations = typeof translations.en | typeof translations.it;

interface LanguageContextType {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  t: translations.en as Translations,
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Lang | null;
    if (stored === "it" || stored === "en") {
      setLangState(stored);
    } else {
      const browserLang = navigator.language || "";
      setLangState(browserLang.toLowerCase().startsWith("it") ? "it" : "en");
    }
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("lang", newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
