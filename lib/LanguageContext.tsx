"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { translations, type Lang, type Translations } from "./i18n";

const SUPPORTED: Lang[] = ["en", "it", "es"];
const STORAGE_KEY = "gfp_lang";

/**
 * Programmatically switches Google Translate to the given language.
 *
 * - IT / ES → polls for the widget's combo select then fires it (no reload)
 * - EN       → clears the googtrans cookie and reloads the page
 */
function triggerGoogleTranslate(langCode: string): void {
  if (typeof window === "undefined") return;

  if (langCode === "en") {
    const isTranslated = document.cookie.split(";").some(c => c.trim().startsWith("googtrans="));
    if (!isTranslated) return;
    const exp = new Date(0).toUTCString();
    document.cookie = `googtrans=; expires=${exp}; path=/`;
    document.cookie = `googtrans=; expires=${exp}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=; expires=${exp}; path=/; domain=.${window.location.hostname}`;
    window.location.reload();
    return;
  }

  // Poll every 300 ms until the Google Translate widget combo is ready (max ~7.5 s)
  let tries = 0;
  const timer = setInterval(() => {
    const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (combo) {
      clearInterval(timer);
      if (combo.value !== langCode) {
        combo.value = langCode;
        combo.dispatchEvent(new Event("change"));
      }
    } else if (++tries > 25) {
      clearInterval(timer); // give up
    }
  }, 300);
}

function getUrlLang(): Lang | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search).get("lang");
  return SUPPORTED.includes(p as Lang) ? (p as Lang) : null;
}

function getStoredLang(): Lang | null {
  try {
    const s = localStorage.getItem(STORAGE_KEY) as Lang | null;
    return s && SUPPORTED.includes(s) ? s : null;
  } catch { return null; }
}

function getBrowserLang(): Lang | null {
  if (typeof window === "undefined") return null;
  const b = (navigator.languages?.[0] || navigator.language)?.slice(0, 2) as Lang;
  return SUPPORTED.includes(b) ? b : null;
}

function detectInitialLang(): Lang {
  return getUrlLang() || getStoredLang() || getBrowserLang() || "en";
}

function hasExplicitSource(): boolean {
  return !!(getUrlLang() || getStoredLang());
}

interface LanguageContextType {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => void;
  setHotelLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  t: translations.en as Translations,
  setLang: () => {},
  setHotelLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Start with "en" on both server and client — avoids hydration mismatch.
  // After hydration, useEffect corrects to the user's actual language preference.
  const [lang, setLangState] = useState<Lang>("en");
  const [explicit, setExplicit] = useState<boolean>(false);

  // Detect stored/browser language once on mount
  useEffect(() => {
    const detected = detectInitialLang();
    setLangState(detected);
    setExplicit(hasExplicitSource());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-trigger Google Translate on EVERY route change or language change.
  // This covers: initial load, user clicking IT/ES, and Next.js client navigation.
  useEffect(() => {
    if (lang !== "en") {
      triggerGoogleTranslate(lang);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, pathname]);

  // Update browser URL ?lang= without full navigation
  function pushLangToUrl(newLang: Lang) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", newLang);
    window.history.replaceState(null, "", url.toString());
  }

  // User-triggered switch — persists to localStorage and URL
  // Google Translate is re-triggered via the [lang, pathname] useEffect above
  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    setExplicit(true);
    try { localStorage.setItem(STORAGE_KEY, newLang); } catch {}
    pushLangToUrl(newLang);
  };

  // Hotel default — only applies when no URL param or saved user preference exists
  // Also seeds the URL param so sharing the page preserves the correct language
  const setHotelLang = (hotelLang: Lang) => {
    if (!explicit) {
      const resolved = SUPPORTED.includes(hotelLang) ? hotelLang : "it";
      setLangState(resolved);
      // Only set URL if it doesn't already have a ?lang= param
      if (typeof window !== "undefined" && !getUrlLang()) {
        pushLangToUrl(resolved);
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang] as Translations, setLang, setHotelLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
