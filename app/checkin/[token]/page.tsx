"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { checkinApi, type PublicBookingInfo } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

type DocType = "passport" | "id_card" | "driving_license" | "residence_permit";

// ── Full form for Guest 1 ──────────────────────────────────────────────────────
type PrimaryForm = {
  first_name: string; last_name: string; gender: string;
  date_of_birth: string; place_of_birth: string; nationality: string;
  address_house: string; address_street: string;
  address_city: string; address_country: string; address_postal: string;
  document_type: DocType; document_number: string;
  document_issue_date: string; document_expiry_date: string;
  document_image: File | null; gdpr_consent: boolean; marketing_optin: boolean;
};

// ── Simplified form for Guests 2+ ─────────────────────────────────────────────
type ExtraGuestForm = {
  first_name: string; last_name: string;
  document_type: DocType;
  document_issue_date: string; document_expiry_date: string;
  document_image: File | null;
};

const EMPTY_PRIMARY = (): PrimaryForm => ({
  first_name: "", last_name: "", gender: "",
  date_of_birth: "", place_of_birth: "", nationality: "",
  address_house: "", address_street: "", address_city: "", address_country: "", address_postal: "",
  document_type: "passport", document_number: "",
  document_issue_date: "", document_expiry_date: "",
  document_image: null, gdpr_consent: false, marketing_optin: false,
});

const EMPTY_EXTRA = (): ExtraGuestForm => ({
  first_name: "", last_name: "",
  document_type: "passport",
  document_issue_date: "", document_expiry_date: "",
  document_image: null,
});

type PrimaryErrors = Partial<Record<keyof PrimaryForm | "signature", string>>;
type ExtraErrors   = Partial<Record<keyof ExtraGuestForm, string>>;

export default function GuestCheckinPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { t }  = useLanguage();
  const c      = t.checkin.guestForm;

  const [booking, setBooking]   = useState<PublicBookingInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [allDone, setAllDone]   = useState(false);

  // Which step we're on: 0 = primary guest, 1..N-1 = extra guests
  const [step, setStep]         = useState(0);

  // Primary guest state
  const [primary, setPrimary]   = useState<PrimaryForm>(EMPTY_PRIMARY());
  const [pErrors, setPErrors]   = useState<PrimaryErrors>({});
  const [imgPreview, setImgPreview] = useState("");

  // Extra guests state (array of length num_guests-1)
  const [extras, setExtras]         = useState<ExtraGuestForm[]>([]);
  const [eErrors, setEErrors]       = useState<ExtraErrors>({});
  const [extraImgPreviews, setExtraImgPreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Signature canvas (only for primary guest)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing   = useRef(false);
  const lastPos   = useRef<{ x: number; y: number } | null>(null);
  const sigData   = useRef("");

  useEffect(() => {
    if (!params.token) return;
    checkinApi.verifyToken(params.token)
      .then(b => {
        setBooking(b);
        const extra = Math.max(0, b.num_guests - 1);
        setExtras(Array.from({ length: extra }, () => EMPTY_EXTRA()));
        setExtraImgPreviews(Array(extra).fill(""));
      })
      .catch(() => setNotFound(true));
  }, [params.token]);

  // ── Canvas ────────────────────────────────────────────────────────────────
  function getPos(e: React.MouseEvent | React.TouchEvent, c: HTMLCanvasElement) {
    const r = c.getBoundingClientRect();
    const sx = c.width / r.width, sy = c.height / r.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy };
    }
    return { x: ((e as React.MouseEvent).clientX - r.left) * sx, y: ((e as React.MouseEvent).clientY - r.top) * sy };
  }
  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current!);
  }
  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current || !canvasRef.current || !lastPos.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const pos = getPos(e, canvasRef.current);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = "#0E7490"; ctx.lineWidth = 2.5;
    ctx.lineCap = "round"; ctx.stroke(); lastPos.current = pos;
  }
  function endDraw() { drawing.current = false; lastPos.current = null; }
  function clearSig() {
    const cv = canvasRef.current; const ctx = cv?.getContext("2d");
    if (cv && ctx) ctx.clearRect(0, 0, cv.width, cv.height);
    sigData.current = "";
    setPErrors(e => { const n = { ...e }; delete n.signature; return n; });
  }
  function captureSig() {
    const cv = canvasRef.current; if (!cv) return "";
    const ctx = cv.getContext("2d"); if (!ctx) return "";
    const px = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const url = px.some(v => v !== 0) ? cv.toDataURL("image/png") : "";
    sigData.current = url; return url;
  }

  // ── Primary field helper ──────────────────────────────────────────────────
  function setP(k: keyof PrimaryForm, v: string | boolean | File | null) {
    setPrimary(p => ({ ...p, [k]: v }));
    setPErrors(e => { const n = { ...e }; delete n[k as keyof PrimaryErrors]; return n; });
  }

  // ── Extra field helper ────────────────────────────────────────────────────
  function setE(idx: number, k: keyof ExtraGuestForm, v: string | File | null) {
    setExtras(prev => { const n = [...prev]; n[idx] = { ...n[idx], [k]: v }; return n; });
    setEErrors(e => { const n = { ...e }; delete n[k as keyof ExtraErrors]; return n; });
  }

  const inp = (err?: string) =>
    `w-full bg-white border ${err ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:ring-cyan-100"} rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all`;

  // ── Validate primary ──────────────────────────────────────────────────────
  function validatePrimary(): boolean {
    const errs: PrimaryErrors = {};
    const req: (keyof PrimaryForm)[] = [
      "first_name", "last_name", "date_of_birth", "nationality",
      "address_city", "address_country",
      "document_issue_date", "document_expiry_date",
    ];
    for (const f of req) if (!primary[f]) errs[f] = c.required;
    if (!primary.gdpr_consent) errs.gdpr_consent = c.gdprRequired;
    const sig = captureSig();
    if (!sig) errs.signature = c.required;
    setPErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Validate extra guest ──────────────────────────────────────────────────
  function validateExtra(idx: number): boolean {
    const g = extras[idx];
    const errs: ExtraErrors = {};
    if (!g.first_name)          errs.first_name = c.required;
    if (!g.last_name)           errs.last_name  = c.required;
    if (!g.document_issue_date) errs.document_issue_date = c.required;
    if (!g.document_expiry_date) errs.document_expiry_date = c.required;
    setEErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit handlers ───────────────────────────────────────────────────────
  async function submitPrimary() {
    const sig = sigData.current;
    const addr = [primary.address_house, primary.address_street, primary.address_city,
                  primary.address_postal, primary.address_country].filter(Boolean).join(", ");
    const fd = new FormData();
    fd.append("guest_number",         "1");
    fd.append("first_name",           primary.first_name);
    fd.append("last_name",            primary.last_name);
    fd.append("gender",               primary.gender);
    fd.append("date_of_birth",        primary.date_of_birth);
    fd.append("place_of_birth",       primary.place_of_birth);
    fd.append("nationality",          primary.nationality);
    fd.append("residence_address",    addr);
    fd.append("document_type",        primary.document_type);
    fd.append("document_number",      primary.document_number);
    fd.append("document_issue_date",  primary.document_issue_date);
    fd.append("document_expiry_date", primary.document_expiry_date);
    fd.append("gdpr_consent",     String(primary.gdpr_consent));
    fd.append("marketing_optin", String(primary.marketing_optin));
    fd.append("signature",            sig);
    if (primary.document_image) fd.append("document_image", primary.document_image);
    await checkinApi.submitRegistration(params.token, fd);
  }

  async function submitExtra(idx: number) {
    const g = extras[idx];
    const fd = new FormData();
    fd.append("guest_number",         String(idx + 2)); // guest 2, 3, …
    fd.append("first_name",           g.first_name);
    fd.append("last_name",            g.last_name);
    fd.append("document_type",        g.document_type);
    fd.append("document_issue_date",  g.document_issue_date);
    fd.append("document_expiry_date", g.document_expiry_date);
    if (g.document_image) fd.append("document_image", g.document_image);
    await checkinApi.submitRegistration(params.token, fd);
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const totalGuests = booking?.num_guests ?? 1;
    const extraCount  = extras.length;
    const isLastStep  = step === extraCount; // 0 = primary, 1..extraCount = extra guests

    if (step === 0) {
      if (!validatePrimary()) return;
    } else {
      if (!validateExtra(step - 1)) return;
    }

    setSubmitting(true);
    try {
      if (step === 0) {
        await submitPrimary();
      } else {
        await submitExtra(step - 1);
      }

      if (isLastStep) {
        setAllDone(true);
        router.push(`/checkin/${params.token}/success`);
      } else {
        setStep(s => s + 1);
        setEErrors({});
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F0F2F7" }}>
      <div className="text-center max-w-sm bg-white rounded-3xl p-10 shadow-lg">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-red-50">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h1 className="text-lg font-black text-slate-900 mb-2">{c.invalidLink}</h1>
        <p className="text-sm text-slate-500">This check-in link is invalid or has expired.</p>
      </div>
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F0F2F7" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
          style={{ borderColor: "#0E7490", borderTopColor: "transparent" }} />
        <p className="text-slate-400 text-sm font-medium">{c.loading}</p>
      </div>
    </div>
  );

  if (booking.is_completed || allDone) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F0F2F7" }}>
      <div className="text-center max-w-sm bg-white rounded-3xl p-10 shadow-lg">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #083344, #0E7490)" }}>
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-black text-slate-900 mb-2">{c.success.title}</h1>
        <p className="text-sm text-slate-500">{c.alreadyCompleted}</p>
      </div>
    </div>
  );

  const totalSteps  = extras.length + 1; // 1 primary + N-1 extra
  const isPrimary   = step === 0;
  const isLastStep  = step === extras.length;
  const extraIdx    = step - 1;           // index into extras[]
  const extra       = extras[extraIdx] ?? EMPTY_EXTRA();

  return (
    <div className="min-h-screen pb-10" style={{ background: "#F0F2F7" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: booking.hotel_brand_color
          ? `linear-gradient(135deg, #020B12 0%, ${booking.hotel_brand_color}99 55%, ${booking.hotel_brand_color} 100%)`
          : "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.20) 0%, transparent 65%)" }} />
        <div className="px-5 pt-10 pb-5 max-w-2xl mx-auto relative z-10">
          <p className="text-cyan-300/80 text-[10px] font-bold uppercase tracking-widest mb-1">{c.welcomeAt}</p>
          <h1 className="text-2xl font-black text-white mb-1">{booking.hotel_name}</h1>
          {booking.hotel_welcome_message && (
            <p className="text-white/70 text-xs mb-2 leading-relaxed">{booking.hotel_welcome_message}</p>
          )}
          <div className="flex gap-5 mt-3">
            {[
              { label: c.checkIn,  val: new Date(booking.check_in_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
              { label: c.checkOut, val: new Date(booking.check_out_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
              { label: c.guests,   val: String(booking.num_guests) },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-400">{label}</p>
                <p className="text-sm font-black text-white mt-0.5">{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step progress (only when multi-guest) */}
        {totalSteps > 1 && (
          <div className="px-5 pb-5 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-xs font-black">
                  {isPrimary ? `Primary Guest (${booking.guest_name})` : `Guest ${step + 1} of ${totalSteps}`}
                </p>
                <p className="text-cyan-300/80 text-xs">{step + 1} / {totalSteps}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                    style={{
                      background: i < step ? "#34D399" : i === step ? "white" : "rgba(255,255,255,0.25)"
                    }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleNext} className="px-4 mt-5 space-y-4 max-w-2xl mx-auto">

        {/* ── STEP 0: Full primary guest form ───────────────────────────── */}
        {isPrimary && (
          <>
            {/* Intro */}
            <div className="bg-white rounded-2xl px-5 py-4 flex items-start gap-4"
              style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #083344, #0E7490)" }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">{c.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{c.subtitle}</p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon="👤" title={c.sections.personal} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{c.fields.firstName} <Required /></Label>
                  <input className={inp(pErrors.first_name)} value={primary.first_name}
                    onChange={e => setP("first_name", e.target.value)} placeholder="John" />
                  <Err msg={pErrors.first_name} />
                </div>
                <div>
                  <Label>{c.fields.lastName} <Required /></Label>
                  <input className={inp(pErrors.last_name)} value={primary.last_name}
                    onChange={e => setP("last_name", e.target.value)} placeholder="Smith" />
                  <Err msg={pErrors.last_name} />
                </div>
              </div>
              <div>
                <Label>Gender</Label>
                <select className={inp()} value={primary.gender} onChange={e => setP("gender", e.target.value)}>
                  <option value="">Select gender…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{c.fields.dob} <Required /></Label>
                  <input type="date" className={inp(pErrors.date_of_birth)} value={primary.date_of_birth}
                    onChange={e => setP("date_of_birth", e.target.value)} />
                  <Err msg={pErrors.date_of_birth} />
                </div>
                <div>
                  <Label>{c.fields.placeOfBirth}</Label>
                  <input className={inp()} value={primary.place_of_birth}
                    onChange={e => setP("place_of_birth", e.target.value)} placeholder="City of birth" />
                </div>
              </div>
              <div>
                <Label>{c.fields.nationality} <Required /></Label>
                <input className={inp(pErrors.nationality)} value={primary.nationality}
                  onChange={e => setP("nationality", e.target.value)} placeholder="e.g. British" />
                <Err msg={pErrors.nationality} />
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon="📍" title="Residence Address" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>House / Apt No.</Label>
                  <input className={inp()} value={primary.address_house}
                    onChange={e => setP("address_house", e.target.value)} placeholder="e.g. 12A" />
                </div>
                <div>
                  <Label>Street / Road</Label>
                  <input className={inp()} value={primary.address_street}
                    onChange={e => setP("address_street", e.target.value)} placeholder="Baker Street" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>City <Required /></Label>
                  <input className={inp(pErrors.address_city)} value={primary.address_city}
                    onChange={e => setP("address_city", e.target.value)} placeholder="London" />
                  <Err msg={pErrors.address_city} />
                </div>
                <div>
                  <Label>Postal / ZIP Code</Label>
                  <input className={inp()} value={primary.address_postal}
                    onChange={e => setP("address_postal", e.target.value)} placeholder="NW1 6XE" />
                </div>
              </div>
              <div>
                <Label>Country <Required /></Label>
                <input className={inp(pErrors.address_country)} value={primary.address_country}
                  onChange={e => setP("address_country", e.target.value)} placeholder="United Kingdom" />
                <Err msg={pErrors.address_country} />
              </div>
            </div>

            {/* Document */}
            <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon="🪪" title={c.sections.document} />
              <div>
                <Label>{c.fields.documentType}</Label>
                <select className={inp()} value={primary.document_type}
                  onChange={e => setP("document_type", e.target.value as DocType)}>
                  <option value="passport">{c.docTypes.passport}</option>
                  <option value="id_card">{c.docTypes.id_card}</option>
                  <option value="driving_license">{c.docTypes.driving_license}</option>
                  <option value="residence_permit">{c.docTypes.residence_permit}</option>
                </select>
              </div>
              <div>
                <Label>{c.fields.documentNumber}</Label>
                <input className={inp()} value={primary.document_number}
                  onChange={e => setP("document_number", e.target.value)} placeholder="e.g. GB1234567" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{c.fields.documentIssueDate} <Required /></Label>
                  <input type="date" className={inp(pErrors.document_issue_date)} value={primary.document_issue_date}
                    onChange={e => setP("document_issue_date", e.target.value)} />
                  <Err msg={pErrors.document_issue_date} />
                </div>
                <div>
                  <Label>{c.fields.documentExpiryDate} <Required /></Label>
                  <input type="date" className={inp(pErrors.document_expiry_date)} value={primary.document_expiry_date}
                    onChange={e => setP("document_expiry_date", e.target.value)} />
                  <Err msg={pErrors.document_expiry_date} />
                </div>
              </div>
            </div>

            {/* Document upload */}
            <div className="bg-white rounded-2xl p-5 space-y-3" style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon="📷" title={c.sections.upload} />
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${primary.document_image ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-cyan-400 bg-slate-50"}`}>
                  {imgPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgPreview} alt="doc" className="h-28 object-contain rounded-xl" />
                      <p className="text-xs text-emerald-600 font-bold">{primary.document_image?.name}</p>
                      <p className="text-xs text-slate-400">Tap to change</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#ECFEFF" }}>
                        <svg className="w-6 h-6" fill="none" stroke="#0E7490" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-slate-700">Tap to upload document photo</p>
                      <p className="text-xs text-slate-400">Passport, ID card, driving licence · Max 10MB</p>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*,.pdf" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null;
                    setP("document_image", file);
                    setImgPreview(file ? URL.createObjectURL(file) : "");
                  }} />
              </label>
            </div>

            {/* Signature */}
            <div className="bg-white rounded-2xl p-5 space-y-3" style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <SectionHeader icon="✍️" title={c.sections.signature} />
                <button type="button" onClick={clearSig}
                  className="text-xs font-bold text-cyan-600 hover:text-cyan-800 px-3 py-1.5 rounded-lg hover:bg-cyan-50 transition-colors">
                  {c.clearSignature}
                </button>
              </div>
              <p className="text-xs text-slate-400">{c.fields.signature}</p>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden touch-none bg-white">
                <canvas ref={canvasRef} width={600} height={160} className="w-full h-36 cursor-crosshair"
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
              </div>
              <Err msg={pErrors.signature} />
            </div>

            {/* GDPR */}
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
              <SectionHeader icon="🛡️" title={c.sections.consent} />
              <label className="flex gap-3 cursor-pointer mt-3">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input type="checkbox" checked={primary.gdpr_consent}
                    onChange={e => setP("gdpr_consent", e.target.checked)} className="sr-only peer" />
                  <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:border-cyan-600 peer-checked:bg-cyan-600 transition-all flex items-center justify-center">
                    {primary.gdpr_consent && (
                      <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3">
                        <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-700 leading-snug">{c.fields.gdprConsent}</span>
              </label>
              <Err msg={pErrors.gdpr_consent} />

              {/* Marketing opt-in — optional */}
              <label className="flex gap-3 cursor-pointer mt-4">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input type="checkbox" checked={primary.marketing_optin}
                    onChange={e => setP("marketing_optin", e.target.checked)} className="sr-only peer" />
                  <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:border-cyan-600 peer-checked:bg-cyan-600 transition-all flex items-center justify-center">
                    {primary.marketing_optin && (
                      <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3">
                        <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-500 leading-snug">
                  I agree to receive future offers and promotions from this property. <span className="text-xs text-slate-400">(Optional)</span>
                </span>
              </label>
            </div>
          </>
        )}

        {/* ── STEPS 1+: Simplified extra guest form ─────────────────────── */}
        {!isPrimary && (
          <>
            {/* Guest header card */}
            <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4"
              style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #083344, #0E7490)" }}>
                {step + 1}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Guest {step + 1} Details</p>
                <p className="text-xs text-slate-400 mt-0.5">Name and document information only</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First Name <Required /></Label>
                  <input className={inp(eErrors.first_name)} value={extra.first_name}
                    onChange={e => setE(extraIdx, "first_name", e.target.value)} placeholder="First name" />
                  <Err msg={eErrors.first_name} />
                </div>
                <div>
                  <Label>Last Name <Required /></Label>
                  <input className={inp(eErrors.last_name)} value={extra.last_name}
                    onChange={e => setE(extraIdx, "last_name", e.target.value)} placeholder="Last name" />
                  <Err msg={eErrors.last_name} />
                </div>
              </div>

              {/* Document Type */}
              <div>
                <Label>Document Type</Label>
                <select className={inp()} value={extra.document_type}
                  onChange={e => setE(extraIdx, "document_type", e.target.value as DocType)}>
                  <option value="passport">Passport</option>
                  <option value="id_card">ID Card</option>
                  <option value="driving_license">Driving Licence</option>
                  <option value="residence_permit">Residence Permit</option>
                </select>
              </div>

              {/* Issue + Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Issue Date <Required /></Label>
                  <input type="date" className={inp(eErrors.document_issue_date)} value={extra.document_issue_date}
                    onChange={e => setE(extraIdx, "document_issue_date", e.target.value)} />
                  <Err msg={eErrors.document_issue_date} />
                </div>
                <div>
                  <Label>Expiry Date <Required /></Label>
                  <input type="date" className={inp(eErrors.document_expiry_date)} value={extra.document_expiry_date}
                    onChange={e => setE(extraIdx, "document_expiry_date", e.target.value)} />
                  <Err msg={eErrors.document_expiry_date} />
                </div>
              </div>

              {/* Document upload */}
              <div>
                <Label>Document Photo</Label>
                <label className="block cursor-pointer">
                  <div className={`border-2 border-dashed rounded-2xl p-5 text-center transition-colors ${extra.document_image ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-cyan-400 bg-slate-50 hover:bg-cyan-50/30"}`}>
                    {extraImgPreviews[extraIdx] ? (
                      <div className="flex flex-col items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={extraImgPreviews[extraIdx]} alt="doc"
                          className="h-24 object-contain rounded-xl" />
                        <p className="text-xs text-emerald-600 font-bold truncate max-w-full px-2">
                          {extra.document_image?.name}
                        </p>
                        <p className="text-[10px] text-slate-400">Tap to change</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "#ECFEFF" }}>
                          <svg className="w-5 h-5" fill="none" stroke="#0E7490" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-700">Upload document photo</p>
                          <p className="text-xs text-slate-400 mt-0.5">Passport · ID · Licence · Permit</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*,.pdf" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0] ?? null;
                      setE(extraIdx, "document_image", file);
                      setExtraImgPreviews(prev => {
                        const next = [...prev];
                        next[extraIdx] = file ? URL.createObjectURL(file) : "";
                        return next;
                      });
                    }} />
                </label>
              </div>
            </div>
          </>
        )}

        {/* ── Error banner ────────────────────────────────────────────────── */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <p className="text-sm text-red-700 font-medium">{submitError}</p>
          </div>
        )}

        {/* ── Submit / Next button ─────────────────────────────────────────── */}
        <button type="submit" disabled={submitting}
          className="w-full flex items-center justify-center gap-2.5 font-black text-base py-4 rounded-2xl text-white transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #083344, #0E7490)", boxShadow: "0 6px 20px rgba(14,116,144,0.35)" }}>
          {submitting ? (
            <><div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            {c.submitting}</>
          ) : isLastStep ? (
            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>{c.submit}</>
          ) : (
            <>Next Guest ({step + 2} of {totalSteps})
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg></>
          )}
        </button>

        {totalSteps > 1 && (
          <p className="text-center text-xs text-slate-400 pb-2">
            {isLastStep
              ? "Last guest — submitting will complete check-in"
              : `${totalSteps - step - 1} more guest${totalSteps - step - 1 !== 1 ? "s" : ""} after this`}
          </p>
        )}
      </form>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────
function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
      <span className="text-base leading-none">{icon}</span>
      <p className="text-sm font-black text-slate-900">{title}</p>
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-slate-600 mb-1.5">{children}</label>;
}
function Required() {
  return <span className="text-red-400"> *</span>;
}
function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;
}
