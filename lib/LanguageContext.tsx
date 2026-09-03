"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { translations, type Lang, type Translations } from "./i18n";

const SUPPORTED: Lang[] = ["en", "it", "es"];
const STORAGE_KEY = "gfp_lang";
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

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

/** Visitor's country -> default language (Italy -> it, Spain -> es, else -> en). */
async function detectGeoLang(): Promise<Lang | null> {
  try {
    const res = await fetch(`${API_BASE}/api/geo-lang/`);
    const data: { lang?: string } = await res.json();
    return SUPPORTED.includes(data.lang as Lang) ? (data.lang as Lang) : null;
  } catch {
    return null;
  }
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
  // Start with "en" on both server and client — avoids hydration mismatch.
  // After hydration, useEffect corrects to the user's actual language preference.
  const [lang, setLangState] = useState<Lang>("en");
  const [explicit, setExplicit] = useState<boolean>(false);
  // Refs so the async geo-IP callback below can see the LATEST values (not
  // the ones captured when the effect first ran) before deciding to apply.
  const explicitRef = useRef(false);
  const hotelDefaultAppliedRef = useRef(false);

  // Resolve the initial language once on mount: URL/localStorage win outright;
  // otherwise ask geo-IP (Italy -> it, Spain -> es, else -> en), falling back
  // to the browser's own language if that lookup fails or times out. If a
  // hotel page sets its own default (setHotelLang) before geo-IP resolves,
  // that takes precedence and the geo-IP result is discarded.
  useEffect(() => {
    const urlLang = getUrlLang();
    const storedLang = getStoredLang();
    if (urlLang || storedLang) {
      setLangState((urlLang ?? storedLang) as Lang);
      setExplicit(true);
      explicitRef.current = true;
      return;
    }

    let cancelled = false;
    detectGeoLang().then((geoLang) => {
      if (cancelled || explicitRef.current || hotelDefaultAppliedRef.current) return;
      setLangState(geoLang ?? getBrowserLang() ?? "en");
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update browser URL ?lang= without full navigation
  function pushLangToUrl(newLang: Lang) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", newLang);
    window.history.replaceState(null, "", url.toString());
  }

  // User-triggered switch — persists to localStorage and URL
  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    setExplicit(true);
    explicitRef.current = true;
    try { localStorage.setItem(STORAGE_KEY, newLang); } catch {}
    pushLangToUrl(newLang);
  };

  // Hotel default — only applies when no URL param or saved user preference exists
  // Also seeds the URL param so sharing the page preserves the correct language
  const setHotelLang = (hotelLang: Lang) => {
    if (!explicit) {
      const resolved = SUPPORTED.includes(hotelLang) ? hotelLang : "it";
      setLangState(resolved);
      hotelDefaultAppliedRef.current = true;
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
