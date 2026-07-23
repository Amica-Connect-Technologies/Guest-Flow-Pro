"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import type { Lang } from "@/lib/i18n";

// Used by language-specific routes (/it, /es) to force the correct
// language context and persist it to localStorage.
export default function ForceLang({ lang }: { lang: Lang }) {
  const { setLang } = useLanguage();
  useEffect(() => {
    setLang(lang);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);
  return null;
}
