"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Countries where Spanish is the primary language
const SPANISH_COUNTRIES = new Set([
  "ES","MX","CO","AR","PE","CL","VE","EC","BO","PY","UY",
  "DO","GT","HN","SV","NI","CR","PA","CU","PR","GQ",
]);

export default function GeoRedirect() {
  const router = useRouter();

  useEffect(() => {
    // User already has a saved language preference — respect it, don't redirect
    try {
      if (localStorage.getItem("gfp_lang")) return;
    } catch {}

    // Silent IP-based country detection — no permission popup needed
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data: { country_code?: string }) => {
        const cc = data.country_code;
        if (!cc) return;
        if (cc === "IT") router.replace("/it");
        else if (SPANISH_COUNTRIES.has(cc)) router.replace("/es");
        // All other countries → stay on English "/"
      })
      .catch(() => {
        // Network error or rate-limit — silently stay on English
      });
  }, [router]);

  return null;
}
