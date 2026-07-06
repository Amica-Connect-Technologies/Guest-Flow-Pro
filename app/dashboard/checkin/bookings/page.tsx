"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkinApi, type CheckinBooking, type CheckinRegistration } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

type StatusFilter = "all" | "pending" | "completed" | "missing_info";

const STATUS_COLORS: Record<string, { pill: string; dot: string }> = {
  pending:      { pill: "bg-amber-100 text-amber-700",   dot: "#F59E0B" },
  completed:    { pill: "bg-emerald-100 text-emerald-700", dot: "#10B981" },
  missing_info: { pill: "bg-red-100 text-red-700",       dot: "#EF4444" },
  expired:      { pill: "bg-slate-100 text-slate-500",   dot: "#94A3B8" },
};

function fmt(d: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
}

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—";
}

// ── PDF Slip generator ────────────────────────────────────────────────────────
function generateSlip(booking: CheckinBooking) {
  const regs = booking.registrations ?? [];
  const primary = regs.find(r => r.guest_number === 1);
  const extras  = regs.filter(r => r.guest_number > 1).sort((a, b) => a.guest_number - b.guest_number);
  const pendingCount = booking.num_guests - regs.length;

  // Primary guest: 2-col data grid + photo/signature on right side
  const primaryHtml = primary ? `
<div class="g-block" style="break-inside:avoid;">
  <div class="g-header">
    <span>PRIMARY GUEST</span>
    <span style="font-weight:400;font-size:9px;opacity:.8;">${primary.first_name} ${primary.last_name}</span>
  </div>
  <div class="g-body" style="display:flex;gap:10px;">
    <div style="flex:1;min-width:0;">
      <div class="fields-grid">
        <div class="f-cell"><div class="fl">Full Name</div><div class="fv"><strong>${primary.first_name} ${primary.last_name}</strong></div></div>
        ${primary.gender      ? `<div class="f-cell"><div class="fl">Gender</div><div class="fv">${cap(primary.gender)}</div></div>` : ""}
        ${primary.date_of_birth ? `<div class="f-cell"><div class="fl">Date of Birth</div><div class="fv">${fmt(primary.date_of_birth)}</div></div>` : ""}
        ${primary.nationality  ? `<div class="f-cell"><div class="fl">Nationality</div><div class="fv">${primary.nationality}</div></div>` : ""}
        <div class="f-cell"><div class="fl">Document Type</div><div class="fv">${cap(primary.document_type)}</div></div>
        ${primary.document_number ? `<div class="f-cell"><div class="fl">Doc No.</div><div class="fv">${primary.document_number}</div></div>` : ""}
        <div class="f-cell"><div class="fl">Issue Date</div><div class="fv">${fmt(primary.document_issue_date)}</div></div>
        <div class="f-cell"><div class="fl">Expiry Date</div><div class="fv">${fmt(primary.document_expiry_date)}</div></div>
        ${primary.residence_address ? `<div class="f-cell f-full"><div class="fl">Address</div><div class="fv">${primary.residence_address}</div></div>` : ""}
        <div class="f-cell"><div class="fl">GDPR Consent</div><div class="fv">${primary.gdpr_consent ? "✓ Yes" : "No"}</div></div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;flex-shrink:0;width:130px;">
      ${primary.document_image_url
        ? `<div><div class="media-label">Document Photo</div><img src="${primary.document_image_url}" class="doc-img"/></div>`
        : `<div><div class="media-label">Document Photo</div><div class="no-media">Not uploaded</div></div>`}
      ${primary.signature
        ? `<div><div class="media-label">Signature</div><img src="${primary.signature}" class="sig-img"/></div>`
        : ""}
    </div>
  </div>
</div>` : "";

  // Extra guests: 2-per-row compact cards
  const extraPairs: string[] = [];
  for (let i = 0; i < extras.length; i += 2) {
    const cards = [extras[i], extras[i + 1]].filter(Boolean).map(r => `
      <div class="g-block" style="flex:1;min-width:0;">
        <div class="g-header">
          <span>GUEST ${r.guest_number}</span>
          <span style="font-weight:400;font-size:9px;opacity:.8;">${r.first_name} ${r.last_name}</span>
        </div>
        <div class="g-body" style="display:flex;gap:8px;align-items:flex-start;">
          <div style="flex:1;min-width:0;">
            <div class="fields-grid">
              <div class="f-cell f-full"><div class="fl">Full Name</div><div class="fv"><strong>${r.first_name} ${r.last_name}</strong></div></div>
              <div class="f-cell"><div class="fl">Doc Type</div><div class="fv">${cap(r.document_type)}</div></div>
              ${r.document_number ? `<div class="f-cell"><div class="fl">Doc No.</div><div class="fv">${r.document_number}</div></div>` : ""}
              <div class="f-cell"><div class="fl">Issue Date</div><div class="fv">${fmt(r.document_issue_date)}</div></div>
              <div class="f-cell"><div class="fl">Expiry Date</div><div class="fv">${fmt(r.document_expiry_date)}</div></div>
            </div>
          </div>
          <div style="flex-shrink:0;width:90px;">
            ${r.document_image_url
              ? `<div class="media-label">Photo</div><img src="${r.document_image_url}" class="doc-img" style="max-width:90px;max-height:65px;"/>`
              : `<div class="media-label">Photo</div><div class="no-media">Not uploaded</div>`}
          </div>
        </div>
      </div>`).join("");
    extraPairs.push(`<div style="display:flex;gap:8px;break-inside:avoid;">${cards}</div>`);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Guest Registration Slip — ${booking.guest_name}</title>
<style>
  @page { size: A4; margin: 12mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }
  @media screen { body { padding: 20px 28px; max-width: 794px; margin: 0 auto; } }
  @media print { .no-print { display: none !important; } }

  /* ── Header ── */
  .slip-header { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 2.5px solid #0E7490; padding-bottom: 8px; margin-bottom: 10px; }
  .slip-title { font-size: 18px; font-weight: 900; color: #083344; line-height: 1; }
  .slip-sub { font-size: 9px; color: #64748b; margin-top: 3px; }
  .hotel-name { font-size: 13px; font-weight: 900; color: #0E7490; text-align: right; }
  .gen-date { font-size: 8.5px; color: #94a3b8; text-align: right; margin-top: 2px; }

  /* ── Booking summary bar ── */
  .bbar { background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 6px; padding: 7px 10px; margin-bottom: 10px; display: flex; gap: 0; }
  .bcol { flex: 1; padding: 0 8px; border-right: 1px solid #BAE6FD; }
  .bcol:first-child { padding-left: 0; }
  .bcol:last-child { border-right: none; }
  .bl { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: #0E7490; }
  .bv { font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .status-pill { display: inline-block; padding: 1px 7px; border-radius: 20px; font-size: 9.5px; font-weight: 800; }
  .status-pending      { background: #FEF3C7; color: #92400E; }
  .status-completed    { background: #D1FAE5; color: #065F46; }
  .status-missing_info { background: #FEE2E2; color: #991B1B; }

  /* ── Section title ── */
  .sec-title { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 10px 0 8px; }

  /* ── Guest block ── */
  .g-block { border: 1px solid #e2e8f0; border-radius: 7px; overflow: hidden; margin-bottom: 8px; }
  .g-header { background: linear-gradient(90deg, #083344 0%, #0E7490 100%); color: #fff; font-size: 9px; font-weight: 900; letter-spacing: .07em; padding: 5px 10px; display: flex; justify-content: space-between; align-items: center; }
  .g-body { padding: 8px 10px; }

  /* ── Fields grid (2 columns) ── */
  .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .f-cell { padding: 3.5px 6px 3.5px 0; border-bottom: 1px solid #f1f5f9; }
  .f-full { grid-column: 1 / -1; }
  .fl { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
  .fv { font-size: 10.5px; font-weight: 600; color: #0f172a; margin-top: 1px; }

  /* ── Media ── */
  .media-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; margin-bottom: 3px; }
  .doc-img { display: block; max-width: 130px; max-height: 90px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 5px; }
  .sig-img { display: block; max-width: 130px; max-height: 50px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 5px; background: #f8fafc; padding: 3px; }
  .no-media { font-size: 9px; color: #cbd5e1; font-style: italic; border: 1px dashed #e2e8f0; border-radius: 5px; padding: 6px 8px; text-align: center; }

  /* ── Pending warning ── */
  .pending-bar { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 5px; padding: 5px 10px; font-size: 9px; font-weight: 700; color: #92400E; margin-bottom: 8px; }

  /* ── Verification strip ── */
  .verify { margin-top: 10px; border: 1.5px dashed #0E7490; border-radius: 7px; padding: 10px 12px; break-inside: avoid; }
  .verify-title { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: .07em; color: #0E7490; margin-bottom: 10px; }
  .verify-cols { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  .v-field { border-bottom: 1.5px solid #0E7490; min-height: 28px; padding-bottom: 2px; }
  .v-label { font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
  .verify-footer { margin-top: 8px; font-size: 8px; color: #cbd5e1; text-align: center; }

  /* ── Print button ── */
  .print-btn { position: fixed; top: 16px; right: 16px; background: linear-gradient(135deg, #083344, #0E7490); color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 3px 10px rgba(14,116,144,.4); }
</style>
</head>
<body>

<button class="print-btn no-print" onclick="window.print()">⬇ Save / Print PDF</button>

<!-- Header -->
<div class="slip-header">
  <div>
    <div class="slip-title">Guest Registration Slip</div>
    <div class="slip-sub">Online Check-in &nbsp;·&nbsp; Ref: ${booking.booking_reference || "N/A"} &nbsp;·&nbsp; ${regs.length} of ${booking.num_guests} guests registered</div>
  </div>
  <div>
    <div class="hotel-name">${booking.hotel_name || ""}</div>
    <div class="gen-date">Generated: ${new Date().toLocaleString("en-GB")}</div>
  </div>
</div>

<!-- Booking summary bar -->
<div class="bbar">
  <div class="bcol"><div class="bl">Guest Name</div><div class="bv">${booking.guest_name}</div></div>
  <div class="bcol"><div class="bl">Check-in</div><div class="bv">${fmt(booking.check_in_date)}</div></div>
  <div class="bcol"><div class="bl">Check-out</div><div class="bv">${fmt(booking.check_out_date)}</div></div>
  <div class="bcol"><div class="bl">Guests</div><div class="bv">${booking.num_guests}</div></div>
  <div class="bcol"><div class="bl">Status</div><div class="bv"><span class="status-pill status-${booking.status}">${cap(booking.status)}</span></div></div>
  ${booking.guest_email ? `<div class="bcol"><div class="bl">Email</div><div class="bv" style="font-size:9.5px;">${booking.guest_email}</div></div>` : ""}
  ${booking.guest_phone ? `<div class="bcol"><div class="bl">Phone</div><div class="bv" style="font-size:9.5px;">${booking.guest_phone}</div></div>` : ""}
</div>

${pendingCount > 0 ? `<div class="pending-bar">⚠ ${pendingCount} guest${pendingCount > 1 ? "s have" : " has"} not yet completed registration.</div>` : ""}

<!-- Guest registrations -->
<div class="sec-title">Guest Registrations</div>

${primaryHtml}

${extraPairs.join("")}

<!-- Manager verification strip -->
<div class="verify">
  <div class="verify-title">✓ Hotel Manager Verification</div>
  <div class="verify-cols">
    <div><div class="v-field"></div><div class="v-label">Documents Verified By</div></div>
    <div><div class="v-field"></div><div class="v-label">Room No. Assigned</div></div>
    <div><div class="v-field"></div><div class="v-label">Manager Signature</div></div>
    <div><div class="v-field"></div><div class="v-label">Date &amp; Time</div></div>
  </div>
  <div class="verify-footer">GuestFlow Pro &nbsp;·&nbsp; Guest Registration Slip &nbsp;·&nbsp; Present at reception for verification</div>
</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=860,height=900");
  if (win) { win.document.write(html); win.document.close(); }
}

// ── Per-guest registration panel ──────────────────────────────────────────────
function GuestPanel({ reg, guestName, guestNum, total }: {
  reg: CheckinRegistration; guestName: string; guestNum: number; total: number;
}) {
  const isPrimary = guestNum === 1;
  const [downloading, setDownloading] = useState(false);
  const [lightbox, setLightbox]       = useState(false);

  async function handleDownload() {
    const url = reg.document_image_url;
    if (!url) return;
    setDownloading(true);
    try {
      const res  = await fetch(url, { credentials: "include" });
      const blob = await res.blob();
      const ext  = blob.type.includes("pdf") ? "pdf" : "jpg";
      const obj  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = obj;
      a.download = `guest${guestNum}_${reg.first_name}_${reg.last_name}.${ext}`;
      a.click();
      URL.revokeObjectURL(obj);
    } catch {
      // CORS fallback — open in new tab so user can save manually
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  function handleView() {
    if (reg.document_image_url) setLightbox(true);
  }

  const label = total > 1 ? `Guest ${guestNum} of ${total}` : "Guest Response";

  return (
    <div className="space-y-3">

      {/* Lightbox overlay */}
      {lightbox && reg.document_image_url && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
          style={{ background: "rgba(2,11,18,0.92)" }}
          onClick={() => setLightbox(false)}>
          <div className="relative max-w-full max-h-full p-4 flex flex-col items-center gap-3"
            onClick={e => e.stopPropagation()}>
            {/* Lightbox toolbar */}
            <div className="flex items-center gap-2 w-full justify-between">
              <p className="text-white text-sm font-black">
                {reg.first_name} {reg.last_name} · Guest {guestNum}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={handleDownload} disabled={downloading}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #083344, #0E7490)" }}>
                  {downloading
                    ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>}
                  Download
                </button>
                <button onClick={() => setLightbox(false)}
                  className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Lightbox image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={reg.document_image_url}
              alt="Document"
              className="max-w-[90vw] max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              style={{ background: "white" }} />
          </div>
        </div>
      )}

      {/* Guest header row */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #083344, #0E7490)" }}>
          {guestNum}
        </div>
        <p className="text-xs font-black text-slate-700 uppercase tracking-wider">{label}</p>
        {reg.document_image_url
          ? <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-lg">DOC ✓</span>
          : <span className="ml-auto text-[10px] bg-slate-100 text-slate-400 font-bold px-2 py-0.5 rounded-lg">No Doc</span>
        }
      </div>

      {/* ── PRIMARY GUEST: personal info + separate document section ── */}
      {isPrimary && (
        <>
          <Section icon="👤" title="Personal Information" color="#ECFDF5" stroke="#059669">
            <Row label="Full Name"    value={`${reg.first_name} ${reg.last_name}`} />
            {reg.gender            && <Row label="Gender"         value={cap(reg.gender)} />}
            {reg.date_of_birth     && <Row label="Date of Birth"  value={fmt(reg.date_of_birth)} />}
            {reg.place_of_birth    && <Row label="Place of Birth" value={reg.place_of_birth} />}
            {reg.nationality       && <Row label="Nationality"    value={reg.nationality} />}
            {reg.residence_address && <Row label="Address"        value={reg.residence_address} />}
            <Row label="Submitted"    value={fmt(reg.completed_at)} />
          </Section>
          <Section icon="🪪" title="Identity Document" color="#FFFBEB" stroke="#D97706">
            <Row label="Document Type"  value={cap(reg.document_type)} />
            {reg.document_number   && <Row label="Document No."   value={reg.document_number} />}
            <Row label="Issue Date"     value={fmt(reg.document_issue_date)} />
            <Row label="Expiry Date"    value={fmt(reg.document_expiry_date)} />
            <Row label="GDPR Consent"   value={reg.gdpr_consent ? "Yes ✓" : "No"} />
          </Section>
        </>
      )}

      {/* ── EXTRA GUESTS: name + document in ONE combined section ─── */}
      {!isPrimary && (
        <Section icon="🪪" title={`Guest ${guestNum} — Document Details`} color="#FFFBEB" stroke="#D97706">
          <Row label="Full Name"      value={`${reg.first_name} ${reg.last_name}`} />
          <Row label="Document Type"  value={cap(reg.document_type)} />
          {reg.document_number   && <Row label="Document No."   value={reg.document_number} />}
          <Row label="Issue Date"     value={fmt(reg.document_issue_date)} />
          <Row label="Expiry Date"    value={fmt(reg.document_expiry_date)} />
          <Row label="Submitted"      value={fmt(reg.completed_at)} />
        </Section>
      )}

      {/* Document photo card — always rendered */}
      <div className="rounded-2xl overflow-hidden border border-slate-200"
        style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>

        {/* Card header with View + Download */}
        <div className="px-4 py-3 flex items-center justify-between"
          style={{ background: reg.document_image_url ? "#F0FDF4" : "#F8FAFC" }}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none"
              stroke={reg.document_image_url ? "#059669" : "#94A3B8"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs font-black"
              style={{ color: reg.document_image_url ? "#065F46" : "#64748B" }}>
              Document Photo · Guest {guestNum}
            </p>
          </div>

          {reg.document_image_url && (
            <div className="flex items-center gap-2">
              {/* View button */}
              <button onClick={handleView}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View
              </button>
              {/* Download button */}
              <button onClick={handleDownload} disabled={downloading}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-white disabled:opacity-60 transition-all"
                style={{ background: "linear-gradient(135deg, #083344, #0E7490)" }}>
                {downloading
                  ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>}
                Download
              </button>
            </div>
          )}
        </div>

        {/* Image preview thumbnail */}
        {reg.document_image_url ? (
          <div className="relative cursor-pointer group" onClick={handleView}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={reg.document_image_url}
              alt={`Guest ${guestNum} document`}
              className="w-full object-contain max-h-52 bg-white" />
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(2,11,18,0.45)" }}>
              <div className="flex items-center gap-2 bg-white/90 rounded-xl px-4 py-2.5 shadow-lg">
                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                <span className="text-sm font-black text-slate-800">Click to enlarge</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center gap-2 bg-white">
            <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-slate-400 font-medium">No document photo uploaded</p>
          </div>
        )}
      </div>

      {/* Signature — primary guest only */}
      {isPrimary && reg.signature && (
        <div className="rounded-2xl overflow-hidden border border-slate-200">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
            <p className="text-xs font-black text-slate-700">Signature · Guest {guestNum}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={reg.signature} alt={`Guest ${guestNum} signature`}
            className="w-full object-contain max-h-28 bg-white p-3" />
        </div>
      )}
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────────
function DetailModal({ booking, onClose }: { booking: CheckinBooking; onClose: () => void }) {
  const regs = booking.registrations ?? [];
  const total = booking.num_guests;
  const sc = STATUS_COLORS[booking.status] ?? { pill: "bg-slate-100 text-slate-500", dot: "#94A3B8" };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(2,11,18,0.7)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mt-auto max-h-[92dvh] flex flex-col bg-white rounded-t-3xl overflow-hidden"
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.25)" }}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Modal header */}
        <div className="px-5 py-3 flex items-start justify-between border-b border-slate-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base font-black text-slate-900">{booking.guest_name}</h2>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sc.pill}`}>
                {cap(booking.status)}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {booking.booking_reference ? `Ref: ${booking.booking_reference} · ` : ""}
              {regs.length}/{total} guest{total !== 1 ? "s" : ""} registered
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar for multi-guest */}
        {total > 1 && (
          <div className="px-5 py-2.5 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                Registration Progress
              </p>
              <span className="ml-auto text-[10px] font-black text-slate-600">
                {regs.length}/{total}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: i < regs.length ? "#10B981" : "#E2E8F0" }} />
              ))}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* ── Booking Info ─────────────────────────────────── */}
          <Section icon="📋" title="Booking Details" color="#EFF6FF" stroke="#2563EB">
            <Row label="Check-in"  value={fmt(booking.check_in_date)} />
            <Row label="Check-out" value={fmt(booking.check_out_date)} />
            <Row label="Guests"    value={String(booking.num_guests)} />
            {booking.guest_email && <Row label="Email"  value={booking.guest_email} />}
            {booking.guest_phone && <Row label="Phone"  value={booking.guest_phone} />}
            {booking.notes       && <Row label="Notes"  value={booking.notes} />}
            <Row label="Created"   value={fmt(booking.created_at)} />
            {booking.link_sent_at && <Row label="Link sent" value={fmt(booking.link_sent_at)} />}
          </Section>

          {/* ── Guest Registrations ────────────────────────────── */}
          {regs.length > 0 ? (
            regs.map(reg => (
              <GuestPanel
                key={reg.id}
                reg={reg}
                guestName={booking.guest_name}
                guestNum={reg.guest_number}
                total={total}
              />
            ))
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-amber-50">
                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-600">No registrations submitted yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Guest has not completed the check-in form
              </p>
            </div>
          )}

          {/* Pending guests notice */}
          {regs.length > 0 && regs.length < total && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-amber-700 font-medium">
                <span className="font-black">{total - regs.length} guest{total - regs.length !== 1 ? "s" : ""} still pending.</span>
                {" "}Guests {regs.map(r => r.guest_number).sort().join(", ")} have registered.
              </p>
            </div>
          )}

          <div className="h-4" />
        </div>

        {/* Close button */}
        <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-black text-sm text-white"
            style={{ background: "linear-gradient(135deg, #083344, #0E7490)" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, color, stroke, children }: {
  icon: string; title: string; color: string; stroke: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <div className="px-4 py-3 flex items-center gap-2.5" style={{ background: color }}>
        <span className="text-base leading-none">{icon}</span>
        <p className="text-xs font-black" style={{ color: stroke }}>{title}</p>
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between px-4 py-2.5 bg-white gap-3">
      <span className="text-xs text-slate-400 font-semibold flex-shrink-0 w-32">{label}</span>
      <span className="text-xs text-slate-800 font-bold text-right flex-1 break-words">{value || "—"}</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AllBookingsPage() {
  const router = useRouter();
  const { t }  = useLanguage();
  const c      = t.checkin;

  const [bookings, setBookings] = useState<CheckinBooking[]>([]);
  const [filter, setFilter]     = useState<StatusFilter>("all");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds]   = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [detail, setDetail]     = useState<CheckinBooking | null>(null);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
    if (!token) router.replace("/login");
  }, [router]);

  function load(status?: string) {
    setLoading(true);
    setError("");
    checkinApi
      .listBookings(status && status !== "all" ? { status } : undefined)
      .then(setBookings)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(filter); }, [filter]);

  async function openDetail(b: CheckinBooking) {
    // Use already-loaded data (registration is included in list response)
    // But try to fetch fresh full detail if possible
    setDetailLoading(b.id);
    try {
      const full = await checkinApi.getBooking(b.id);
      setDetail(full);
    } catch {
      setDetail(b); // fall back to list data
    } finally {
      setDetailLoading(null);
    }
  }

  async function handleSendLink(booking: CheckinBooking) {
    if (!booking.guest_email) return;
    setSendingId(booking.id);
    try {
      await checkinApi.sendLink(booking.id);
      setSentIds(prev => new Set(prev).add(booking.id));
    } catch { /* silent */ } finally { setSendingId(null); }
  }

  async function handleDelete(booking: CheckinBooking) {
    const msg = c.bookings.deleteConfirm.replace("{name}", booking.guest_name);
    if (!window.confirm(msg)) return;
    await checkinApi.deleteBooking(booking.id);
    setBookings(prev => prev.filter(b => b.id !== booking.id));
    if (detail?.id === booking.id) setDetail(null);
  }

  async function handleCopy(booking: CheckinBooking) {
    await navigator.clipboard.writeText(booking.checkin_link);
    setCopiedId(booking.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function exportCSV() {
    const res  = await checkinApi.exportCSV();
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "guest-registrations.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const statusLabel = (s: string) => (c.status as Record<string, string>)[s] ?? s;

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all",          label: c.bookings.filterAll },
    { key: "pending",      label: c.bookings.filterPending },
    { key: "completed",    label: c.bookings.filterCompleted },
    { key: "missing_info", label: c.bookings.filterMissing },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F0F2F7" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.20) 0%, transparent 65%)" }} />
        <div className="px-5 pt-10 pb-5 max-w-3xl mx-auto">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-cyan-300/80 text-sm font-semibold mb-4 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {c.dashboard.title}
          </button>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-cyan-300/80 text-[10px] font-bold uppercase tracking-widest mb-1">Check-in</p>
              <h1 className="text-2xl font-black text-white">{c.bookings.title}</h1>
            </div>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter pills ──────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto max-w-3xl mx-auto">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              filter === f.key
                ? "text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
            style={filter === f.key ? { background: "linear-gradient(135deg, #083344, #0E7490)" } : {}}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── List ─────────────────────────────────────────────────────── */}
      <div className="px-4 pb-8 space-y-3 max-w-3xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">{error}</div>
        )}

        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }} />
          ))
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "#ECFEFF" }}>
              <svg className="w-6 h-6" fill="none" stroke="#0E7490" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">{c.bookings.noResults}</p>
          </div>
        ) : bookings.map(b => {
          const sc = STATUS_COLORS[b.status] ?? { pill: "bg-slate-100 text-slate-500", dot: "#94A3B8" };
          return (
            <div key={b.id} className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>

              {/* Card top: status stripe */}
              <div className="h-1 w-full" style={{ background: sc.dot }} />

              <div className="p-4">
                {/* Name + status */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-black text-slate-900 text-sm">{b.guest_name}</p>
                    {b.booking_reference && (
                      <p className="text-[11px] text-slate-400 font-medium">Ref: {b.booking_reference}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl ${sc.pill}`}>
                    {statusLabel(b.status)}
                  </span>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mb-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {b.check_in_date} → {b.check_out_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                    </svg>
                    {b.num_guests} guest{b.num_guests !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Registration quick summary */}
                {b.registrations?.length > 0 && (
                  <div className="mb-3 px-3 py-2 rounded-xl flex items-center gap-2"
                    style={{ background: "#F0FDF4" }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="#059669" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-bold text-emerald-700">
                      {b.registrations.length}/{b.num_guests} guest{b.num_guests !== 1 ? "s" : ""} registered
                      {b.registrations[0] && ` · ${b.registrations[0].first_name} ${b.registrations[0].last_name}`}
                    </p>
                    {b.registrations.some(r => r.document_image_url) && (
                      <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-600 font-black px-2 py-0.5 rounded-lg">
                        DOCS
                      </span>
                    )}
                  </div>
                )}

                {/* Actions row */}
                <div className="flex gap-2 flex-wrap items-center">
                  {/* View Details */}
                  <button
                    onClick={() => openDetail(b)}
                    disabled={detailLoading === b.id}
                    className="flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl text-white transition-all disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #083344, #0E7490)" }}>
                    {detailLoading === b.id ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                    View Details
                  </button>

                  {/* PDF Slip */}
                  <button
                    onClick={() => generateSlip(b)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-cyan-200 text-cyan-700 hover:bg-cyan-50 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10 12h4M10 16h4M10 8h2" />
                    </svg>
                    PDF Slip
                  </button>

                  {/* Copy link */}
                  <button onClick={() => handleCopy(b)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                    {copiedId === b.id ? (
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                    {copiedId === b.id ? c.bookings.copied : c.bookings.copyLink}
                  </button>

                  {/* Send link */}
                  {b.guest_email && b.status !== "completed" && (
                    <button onClick={() => handleSendLink(b)} disabled={sendingId === b.id}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-60 ${
                        sentIds.has(b.id) || b.link_sent_at
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}>
                      {sendingId === b.id ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {sendingId === b.id ? c.bookings.sending : sentIds.has(b.id) || b.link_sent_at ? c.bookings.sent : c.bookings.sendLink}
                    </button>
                  )}

                  {/* Delete */}
                  <button onClick={() => handleDelete(b)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors ml-auto">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {c.bookings.delete}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────── */}
      {detail && <DetailModal booking={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
