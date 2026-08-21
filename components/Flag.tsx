export type LangCode = "en" | "it" | "es";

export default function Flag({ code, size = 16 }: { code: LangCode; size?: number }) {
  const w = size, h = Math.round(size * 0.72);
  const common = { width: w, height: h, viewBox: "0 0 60 36", className: "rounded-[2px] flex-shrink-0 inline-block align-middle", style: { boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" } };
  if (code === "en") {
    return (
      <svg {...common}>
        <rect width="60" height="36" fill="#00247D" />
        <path d="M0,0 L60,36 M60,0 L0,36" stroke="#fff" strokeWidth="7" />
        <path d="M0,0 L60,36 M60,0 L0,36" stroke="#CF142B" strokeWidth="2.4" />
        <path d="M30,0 V36 M0,18 H60" stroke="#fff" strokeWidth="11" />
        <path d="M30,0 V36 M0,18 H60" stroke="#CF142B" strokeWidth="6.5" />
      </svg>
    );
  }
  if (code === "it") {
    return (
      <svg {...common}>
        <rect width="20" height="36" fill="#009246" />
        <rect x="20" width="20" height="36" fill="#fff" />
        <rect x="40" width="20" height="36" fill="#CE2B37" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect width="60" height="36" fill="#C60B1E" />
      <rect y="9" width="60" height="18" fill="#FFC400" />
    </svg>
  );
}
