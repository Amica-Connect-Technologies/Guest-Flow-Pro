import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import PublicLayout from "@/components/PublicLayout";
import { LanguageProvider } from "@/lib/LanguageContext";

export const metadata: Metadata = {
  title: "Guest Flow Pro | Italian Hotel Services in the UK",
  description:
    "Experience authentic Italian hospitality in the United Kingdom. Guest Flow Pro offers premium hotel concierge services for worldwide tourists — from airport transfers to guided tours and fine dining reservations.",
  // Prevent Chrome's built-in translation bar (our own widget handles it)
  other: { google: "notranslate" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-white">
        {/* Hidden Google Translate mount point */}
        <div id="google_translate_element" aria-hidden="true" />

        <LanguageProvider>
          <PublicLayout>{children}</PublicLayout>
        </LanguageProvider>

        {/*
          Google Translate Widget — loaded after the page is interactive.
          The callback name must be defined on window BEFORE the external
          script runs, so we use two sequential afterInteractive scripts.
        */}
        <Script id="gt-init" strategy="afterInteractive">{`
          window.googleTranslateElementInit = function () {
            new window.google.translate.TranslateElement(
              { pageLanguage: "en", includedLanguages: "en,it,es", autoDisplay: false },
              "google_translate_element"
            );

            /* ── Actively suppress the banner Google injects ── */
            function hideGTBar() {
              /* Hide every banner / frame GT adds */
              document.querySelectorAll(
                '.goog-te-banner-frame, iframe[src*="translate.google"]'
              ).forEach(function(el) {
                el.style.setProperty('display', 'none', 'important');
              });
              /* Remove the top offset GT adds to <body> */
              if (document.body.style.top && document.body.style.top !== '0px') {
                document.body.style.top = '0px';
              }
            }

            /* Run once immediately */
            hideGTBar();

            /* Watch for GT injecting or modifying elements */
            new MutationObserver(hideGTBar).observe(document.documentElement, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['style', 'class']
            });
          };
        `}</Script>
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
