"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { reviewsApi, type PublicReviewInfo } from "@/lib/api";

function Star({ filled, onClick }: { filled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="transition-transform hover:scale-110 active:scale-95">
      <svg viewBox="0 0 24 24" className="w-10 h-10" fill={filled ? "#F59E0B" : "none"}
        stroke={filled ? "#F59E0B" : "#475569"} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    </button>
  );
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
const RATING_COLORS = ["", "#EF4444", "#F97316", "#EAB308", "#10B981", "#06B6D4"];

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<PublicReviewInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await reviewsApi.getPublic(token);
        setInfo(data);
        if (data.is_submitted) setDone(true);
      } catch {
        setError("This review link is invalid or has expired.");
      }
      setLoading(false);
    })();
  }, [token]);

  async function submit() {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await reviewsApi.submitPublic(token, { rating, comment });
      setDone(true);
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : null) ?? "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>
        <div className="text-center">
          <p className="text-5xl mb-4">🔗</p>
          <p className="text-white font-black text-xl mb-2">Invalid Link</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const displayRating = hovered || rating;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>

      <div className="w-full max-w-md">
        {/* Hotel header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black text-white mb-4"
            style={{ background: "linear-gradient(135deg,#0E7490,#083344)", border: "1.5px solid rgba(6,182,212,0.4)" }}>
            {info?.hotel_name?.slice(0, 2).toUpperCase() ?? "★"}
          </div>
          <h1 className="text-2xl font-black text-white">{info?.hotel_name}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {info?.guest_name ? `Dear ${info.guest_name},` : ""}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Thank you for your recent stay. We&apos;d love your feedback!
          </p>
        </div>

        {done ? (
          /* ── Thank-you card ── */
          <div className="rounded-3xl p-8 text-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-5xl mb-4">⭐</p>
            <h2 className="text-xl font-black text-white mb-2">Thank You!</h2>
            <p className="text-slate-400 text-sm mb-6">
              Your review has been submitted. We appreciate your feedback!
            </p>

            {(info?.google_review_url || info?.tripadvisor_url) && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Share on
                </p>
                {info.google_review_url && (
                  <a href={info.google_review_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl font-bold text-sm transition-colors"
                    style={{ background: "rgba(234,67,53,0.15)", color: "#EA4335", border: "1px solid rgba(234,67,53,0.3)" }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Review on Google
                  </a>
                )}
                {info.tripadvisor_url && (
                  <a href={info.tripadvisor_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl font-bold text-sm transition-colors"
                    style={{ background: "rgba(52,168,83,0.12)", color: "#34A853", border: "1px solid rgba(52,168,83,0.25)" }}>
                    🌿 Review on TripAdvisor
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── Review form ── */
          <div className="rounded-3xl p-6 sm:p-8"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>

            {/* Star rating */}
            <div className="text-center mb-6">
              <p className="text-sm font-bold text-slate-400 mb-4">How would you rate your stay?</p>
              <div className="flex justify-center gap-2"
                onMouseLeave={() => setHovered(0)}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n}
                    onMouseEnter={() => setHovered(n)}
                    onClick={() => setRating(n)}
                    className="transition-transform hover:scale-110 active:scale-95">
                    <svg viewBox="0 0 24 24" className="w-11 h-11"
                      fill={n <= displayRating ? RATING_COLORS[displayRating] : "none"}
                      stroke={n <= displayRating ? RATING_COLORS[displayRating] : "#334155"}
                      strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </button>
                ))}
              </div>
              {displayRating > 0 && (
                <p className="text-sm font-black mt-3 transition-all" style={{ color: RATING_COLORS[displayRating] }}>
                  {RATING_LABELS[displayRating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Comments <span className="text-slate-600 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none transition-all"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center mb-4">{error}</p>
            )}

            <button
              onClick={submit}
              disabled={rating === 0 || submitting}
              className="w-full py-4 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-40"
              style={{ background: rating > 0 ? `linear-gradient(135deg, ${RATING_COLORS[rating]}, #083344)` : "rgba(255,255,255,0.1)" }}>
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-6">Powered by GuestFlow Pro</p>
      </div>
    </div>
  );
}
