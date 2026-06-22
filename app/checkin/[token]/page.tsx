"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { checkinApi, PublicBookingInfo } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

type DocType = "passport" | "id_card" | "driving_license" | "residence_permit";

type FormState = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  place_of_birth: string;
  nationality: string;
  residence_address: string;
  document_type: DocType;
  document_number: string;
  document_issue_date: string;
  document_expiry_date: string;
  document_image: File | null;
  gdpr_consent: boolean;
};

const EMPTY: FormState = {
  first_name: "", last_name: "", date_of_birth: "", place_of_birth: "",
  nationality: "", residence_address: "", document_type: "passport",
  document_number: "", document_issue_date: "", document_expiry_date: "",
  document_image: null, gdpr_consent: false,
};

export default function GuestCheckinPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const c = t.checkin.guestForm;

  const [booking, setBooking] = useState<PublicBookingInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "signature", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Canvas signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!params.token) return;
    checkinApi.verifyToken(params.token)
      .then(setBooking)
      .catch(() => setNotFound(true));
  }, [params.token]);

  // ── Canvas helpers ────────────────────────────────────────────────────────

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    lastPos.current = getPos(e, canvas);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPos.current) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#0E7490";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPos.current = pos;
  }

  function endDraw() { drawing.current = false; lastPos.current = null; }

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setErrors(prev => { const e = { ...prev }; delete e.signature; return e; });
  }

  function getSignatureDataUrl() {
    const canvas = canvasRef.current;
    if (!canvas) return "";
    // Check if canvas is blank
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasPixels = data.some(v => v !== 0);
    return hasPixels ? canvas.toDataURL("image/png") : "";
  }

  // ── Field update ──────────────────────────────────────────────────────────

  function set(field: keyof FormState, value: string | boolean | File | null) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const e = { ...prev }; delete e[field as keyof typeof prev]; return e; });
  }

  // ── Validate + submit ─────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: typeof errors = {};
    const required: (keyof FormState)[] = [
      "first_name", "last_name", "date_of_birth", "place_of_birth",
      "nationality", "residence_address", "document_type",
      "document_number", "document_issue_date", "document_expiry_date",
    ];
    for (const f of required) {
      if (!form[f]) errs[f] = c.required;
    }
    if (!form.gdpr_consent) errs.gdpr_consent = c.gdprRequired;
    const sig = getSignatureDataUrl();
    if (!sig) errs.signature = c.required;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const fd = new FormData();
    (Object.keys(form) as (keyof FormState)[]).forEach(k => {
      const v = form[k];
      if (v === null) return;
      if (v instanceof File) fd.append(k, v);
      else fd.append(k, String(v));
    });
    fd.append("signature", getSignatureDataUrl());

    try {
      await checkinApi.submitRegistration(params.token, fd);
      setDone(true);
      router.push(`/checkin/${params.token}/success`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      setErrors({ first_name: msg });
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">{c.invalidLink}</h1>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">{c.loading}</p>
      </div>
    );
  }

  if (booking.is_completed || done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">{c.success.title}</h1>
          <p className="text-slate-600">{c.alreadyCompleted}</p>
        </div>
      </div>
    );
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white";
  const errCls = "text-xs text-red-500 mt-1";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide";
  const sectionCls = "bg-white rounded-2xl p-5 shadow-sm space-y-4";

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900 to-cyan-700 px-6 pt-10 pb-8 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-300 mb-1">{c.welcomeAt}</p>
        <h1 className="text-2xl font-bold">{booking.hotel_name}</h1>
        <div className="mt-4 flex gap-6 text-sm text-cyan-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">{c.checkIn}</p>
            <p className="font-semibold">{new Date(booking.check_in_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">{c.checkOut}</p>
            <p className="font-semibold">{new Date(booking.check_out_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">{c.guests}</p>
            <p className="font-semibold">{booking.num_guests}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h2 className="text-base font-bold text-slate-900">{c.title}</h2>
          <p className="text-sm text-slate-500 mt-1">{c.subtitle}</p>
          <p className="text-sm font-medium text-slate-700 mt-2">
            {t.checkin.guestForm.fields.firstName.split(" ")[0] && `${booking.guest_name}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Info */}
          <div className={sectionCls}>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">{c.sections.personal}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{c.fields.firstName}</label>
                <input className={inputCls} value={form.first_name} onChange={e => set("first_name", e.target.value)} />
                {errors.first_name && <p className={errCls}>{errors.first_name}</p>}
              </div>
              <div>
                <label className={labelCls}>{c.fields.lastName}</label>
                <input className={inputCls} value={form.last_name} onChange={e => set("last_name", e.target.value)} />
                {errors.last_name && <p className={errCls}>{errors.last_name}</p>}
              </div>
            </div>
            <div>
              <label className={labelCls}>{c.fields.dob}</label>
              <input type="date" className={inputCls} value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} />
              {errors.date_of_birth && <p className={errCls}>{errors.date_of_birth}</p>}
            </div>
            <div>
              <label className={labelCls}>{c.fields.placeOfBirth}</label>
              <input className={inputCls} value={form.place_of_birth} onChange={e => set("place_of_birth", e.target.value)} />
              {errors.place_of_birth && <p className={errCls}>{errors.place_of_birth}</p>}
            </div>
            <div>
              <label className={labelCls}>{c.fields.nationality}</label>
              <input className={inputCls} value={form.nationality} onChange={e => set("nationality", e.target.value)} />
              {errors.nationality && <p className={errCls}>{errors.nationality}</p>}
            </div>
            <div>
              <label className={labelCls}>{c.fields.residenceAddress}</label>
              <textarea rows={2} className={inputCls} value={form.residence_address} onChange={e => set("residence_address", e.target.value)} />
              {errors.residence_address && <p className={errCls}>{errors.residence_address}</p>}
            </div>
          </div>

          {/* Document Info */}
          <div className={sectionCls}>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">{c.sections.document}</h3>
            <div>
              <label className={labelCls}>{c.fields.documentType}</label>
              <select className={inputCls} value={form.document_type} onChange={e => set("document_type", e.target.value as DocType)}>
                <option value="passport">{c.docTypes.passport}</option>
                <option value="id_card">{c.docTypes.id_card}</option>
                <option value="driving_license">{c.docTypes.driving_license}</option>
                <option value="residence_permit">{c.docTypes.residence_permit}</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{c.fields.documentNumber}</label>
              <input className={inputCls} value={form.document_number} onChange={e => set("document_number", e.target.value)} />
              {errors.document_number && <p className={errCls}>{errors.document_number}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{c.fields.documentIssueDate}</label>
                <input type="date" className={inputCls} value={form.document_issue_date} onChange={e => set("document_issue_date", e.target.value)} />
                {errors.document_issue_date && <p className={errCls}>{errors.document_issue_date}</p>}
              </div>
              <div>
                <label className={labelCls}>{c.fields.documentExpiryDate}</label>
                <input type="date" className={inputCls} value={form.document_expiry_date} onChange={e => set("document_expiry_date", e.target.value)} />
                {errors.document_expiry_date && <p className={errCls}>{errors.document_expiry_date}</p>}
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className={sectionCls}>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">{c.sections.upload}</h3>
            <label className={labelCls}>{c.fields.documentImage}</label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
              onChange={e => {
                const file = e.target.files?.[0] ?? null;
                if (file && file.size > 10 * 1024 * 1024) {
                  setErrors(prev => ({ ...prev, document_image: c.fileTooBig }));
                  return;
                }
                set("document_image", file);
              }}
            />
            {errors.document_image && <p className={errCls}>{errors.document_image}</p>}
          </div>

          {/* Signature */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">{c.sections.signature}</h3>
              <button type="button" onClick={clearSignature} className="text-xs text-cyan-700 font-semibold hover:text-cyan-900">
                {c.clearSignature}
              </button>
            </div>
            <p className="text-xs text-slate-400">{c.fields.signature}</p>
            <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden touch-none">
              <canvas
                ref={canvasRef}
                width={600}
                height={160}
                className="w-full h-40 cursor-crosshair bg-white"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
            {errors.signature && <p className={errCls}>{errors.signature}</p>}
          </div>

          {/* GDPR */}
          <div className={sectionCls}>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">{c.sections.consent}</h3>
            <label className="flex gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.gdpr_consent}
                onChange={e => set("gdpr_consent", e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 flex-shrink-0"
              />
              <span className="text-sm text-slate-700 leading-snug">{c.fields.gdprConsent}</span>
            </label>
            {errors.gdpr_consent && <p className={errCls}>{errors.gdpr_consent}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-cyan-700 to-cyan-600 text-white font-bold py-4 rounded-2xl text-sm shadow-md active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? c.submitting : c.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
