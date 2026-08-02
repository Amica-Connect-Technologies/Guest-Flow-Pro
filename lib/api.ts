const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type HotelGalleryImage = {
  id: string;
  image_url: string;
  order: number;
  created_at: string;
};

export type Hotel = {
  id: string; name: string; city: string; country: string; whatsapp_number: string;
  language_default: string; logo_url: string; created_at: string;
  // extended profile fields
  description: string; address: string; phone: string; email: string; website: string;
  check_in_time: string; check_out_time: string; wifi_info: string;
  amenities: string[]; is_24_7: boolean; open_time: string; close_time: string;
  // white-label / branding
  brand_color: string; welcome_message: string;
  google_review_url: string; tripadvisor_url: string;
  // gallery
  gallery_images?: HotelGalleryImage[];
  // plan & verification
  plan: string;
  plan_expires_at: string | null;
  is_verified: boolean;
};
export type Tour = {
  id: string; city: string; title: string; description: string;
  image_url: string; price: number | null; provider: string;
  affiliate_link: string; created_at: string;
};
export type Place = {
  id: string; city: string; name: string; type: string; description: string;
  address: string; google_maps_link: string; created_at: string;
};
export type UserInfo = { id: number; email: string; role: string; hotel_id: string | null };
export type HotelService = {
  id: string; name: string; description: string; category: string;
  price: number; image_url: string | null; is_available: boolean; created_at: string;
};
export type ServiceBooking = {
  id: string; service: string; service_name: string; service_category: string;
  service_price: number; guest_name: string; guest_phone: string; guest_room: string;
  quantity: number; notes: string; payment_method: string; payment_status: string;
  status: string; total_price: number; created_at: string;
};
export type Registration = {
  id: string;
  owner_name: string;
  business_name: string;
  email: string;
  phone: string;
  city: string;
  whatsapp_number: string;
  plan: string;
  status: string;
  rejection_reason: string;
  created_at: string;
  reviewed_at: string | null;
  payment_proof_url: string | null;
};

// ── Token helpers ────────────────────────────────────────────────────────────
function getAccess(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("access") : null;
}
function setSession(access: string, refresh: string) {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
}
export function clearSession() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

// ── Core fetch wrapper ───────────────────────────────────────────────────────
async function req<T>(path: string, { headers: extra, ...opts }: RequestInit = {}): Promise<T> {
  const token = getAccess();
  const headers: Record<string, string> = { ...(extra as Record<string, string>) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(opts.body instanceof FormData)) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });

  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      json?.detail ??
      json?.non_field_errors?.[0] ??
      Object.values(json ?? {})[0] ??
      (res.status >= 500
        ? `Server error (${res.status}). Please contact support if this persists.`
        : `Request failed (${res.status})`);
    throw new Error(String(msg));
  }
  return json;
}

export type NearbyPlace = {
  place_id: string; name: string; address: string;
  rating: number | null; user_ratings_total: number;
  lat: number; lng: number; maps_link: string;
  open_now: boolean | null; price_level: number | null;
  photo_url: string | null; ai_description: string | null;
  types: string[];
};

// ── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  async login(email: string, password: string): Promise<{ access: string; refresh: string; user: UserInfo }> {
    const data = await req<{ access: string; refresh: string; user: UserInfo }>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setSession(data.access, data.refresh);
    return data;
  },

  async me(): Promise<UserInfo> {
    return req<UserInfo>("/api/auth/me/");
  },

  logout() {
    clearSession();
  },
};

// ── Hotels ───────────────────────────────────────────────────────────────────
export const hotelsApi = {
  list: () => req<Hotel[]>("/api/hotels/"),
  get: (id: string) => req<Hotel>(`/api/hotels/${id}/`),

  create(data: FormData | Record<string, string>) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return req<Hotel>("/api/hotels/", { method: "POST", body });
  },

  update(id: string, data: FormData | Record<string, string>) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return req<Hotel>(`/api/hotels/${id}/`, { method: "PATCH", body });
  },

  delete: (id: string) => req<void>(`/api/hotels/${id}/`, { method: "DELETE" }),

  stats: () => req<{
    hotels: number; tours: number; places: number;
    total_guests: number; marketing_optins: number;
    total_reviews: number; avg_rating: number | null;
    top_hotels: { hotel_id: string; hotel_name: string; guest_count: number }[];
  }>("/api/auth/stats/"),

  getProfile: () => req<Hotel>("/api/hotels/profile/"),
  updateProfile: (data: FormData | Record<string, unknown>) => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return req<Hotel>("/api/hotels/profile/", { method: "PATCH", body });
  },
};

// ── Hotel Gallery ─────────────────────────────────────────────────────────────
export const galleryApi = {
  list: (hotelId: string) =>
    req<HotelGalleryImage[]>(`/api/hotels/gallery/?hotel_id=${encodeURIComponent(hotelId)}`),

  upload: (imageFile: File) => {
    const fd = new FormData();
    fd.append("image", imageFile);
    return req<HotelGalleryImage>("/api/hotels/gallery/", { method: "POST", body: fd });
  },

  delete: (id: string) => req<void>(`/api/hotels/gallery/${id}/`, { method: "DELETE" }),

  // Admin: upload image to any hotel by hotel_id
  adminUpload: (hotelId: string, imageFile: File) => {
    const fd = new FormData();
    fd.append("hotel_id", hotelId);
    fd.append("image", imageFile);
    return req<HotelGalleryImage>("/api/hotels/gallery/", { method: "POST", body: fd });
  },

  adminDelete: (id: string) => req<void>(`/api/hotels/gallery/${id}/`, { method: "DELETE" }),
};

// ── Tours ────────────────────────────────────────────────────────────────────
export const toursApi = {
  list: (city?: string) =>
    req<Tour[]>(`/api/tours/${city ? `?city=${encodeURIComponent(city)}` : ""}`),

  create(data: FormData) {
    return req<Tour>("/api/tours/", { method: "POST", body: data });
  },

  update(id: string, data: FormData) {
    return req<Tour>(`/api/tours/${id}/`, { method: "PATCH", body: data });
  },

  delete: (id: string) => req<void>(`/api/tours/${id}/`, { method: "DELETE" }),
};

// ── Places ───────────────────────────────────────────────────────────────────
export const placesApi = {
  list: (city?: string) =>
    req<Place[]>(`/api/places/${city ? `?city=${encodeURIComponent(city)}` : ""}`),

  create: (data: Record<string, string>) =>
    req<Place>("/api/places/", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, string>) =>
    req<Place>(`/api/places/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) => req<void>(`/api/places/${id}/`, { method: "DELETE" }),

  import: (city: string, type: string, limit = 50) =>
    req<{ created: number; skipped: number; city: string; type: string }>(
      "/api/places/import/",
      { method: "POST", body: JSON.stringify({ city, type, limit }) }
    ),

  nearby: (hotelId: string, type: string, keyword?: string, radius?: number) => {
    let url = `/api/places/nearby/?hotel_id=${encodeURIComponent(hotelId)}&type=${type}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    if (radius)  url += `&radius=${radius}`;
    return req<{ places: NearbyPlace[]; lat: number; lng: number }>(url);
  },
};

// ── Registrations ────────────────────────────────────────────────────────────
export const registrationsApi = {
  register: (data: {
    owner_name: string; business_name: string; email: string; password: string;
    phone?: string; city: string; country?: string; whatsapp_number?: string;
    website?: string; plan: string; payment_method: string;
  }) =>
    req<
      | { checkout_url: string; registration_id: string }
      | {
          registration_id: string; method: string; business_name: string; status: string;
          bank_details: {
            account_name: string; bank_name: string; sort_code: string;
            account_number: string; iban: string; swift: string; reference: string;
          };
        }
    >("/api/subscriptions/register/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  submitPaymentProof: (registrationId: string, data: FormData) =>
    req<{ status: string; registration_id: string }>(
      `/api/subscriptions/registrations/${registrationId}/payment-proof/`,
      { method: "POST", body: data }
    ),

  verifyPayment: (session_id: string) =>
    req<{ status: string; business_name: string }>("/api/subscriptions/verify-payment/", {
      method: "POST",
      body: JSON.stringify({ session_id }),
    }),

  list: (status?: string) =>
    req<Registration[]>(`/api/subscriptions/registrations/${status ? `?status=${status}` : ""}`),

  approve: (id: string) =>
    req<{ status: string; hotel_id: string }>(`/api/subscriptions/registrations/${id}/approve/`, {
      method: "POST",
    }),

  reject: (id: string, reason?: string) =>
    req<{ status: string }>(`/api/subscriptions/registrations/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason ?? "" }),
    }),

  pendingCount: () =>
    req<{ count: number }>("/api/subscriptions/pending-count/"),

  delete: (id: string) =>
    req<void>(`/api/subscriptions/registrations/${id}/`, { method: "DELETE" }),
};

// ── Admin Users ───────────────────────────────────────────────────────────────
export type AdminUser = {
  id: number; username: string; email: string; role: string;
  hotel_name: string | null; hotel_id: string | null;
  is_active: boolean; date_joined: string; last_login: string | null;
};
export const usersApi = {
  list: () => req<AdminUser[]>("/api/auth/users/"),
  create: (data: { email: string; password: string; role: string }) =>
    req<AdminUser>("/api/auth/users/", { method: "POST", body: JSON.stringify(data) }),
  updateRole: (id: number, role: string) =>
    req<AdminUser>(`/api/auth/users/${id}/`, { method: "PATCH", body: JSON.stringify({ role }) }),
  delete: (id: number) => req<void>(`/api/auth/users/${id}/`, { method: "DELETE" }),
};

// ── Services ─────────────────────────────────────────────────────────────────
export const servicesApi = {
  list: (hotelId: string) =>
    req<HotelService[]>(`/api/services/?hotel_id=${hotelId}`),

  myList: () => req<HotelService[]>("/api/services/"),

  create: (data: FormData) =>
    req<HotelService>("/api/services/", { method: "POST", body: data }),

  update: (id: string, data: FormData) =>
    req<HotelService>(`/api/services/${id}/`, { method: "PATCH", body: data }),

  delete: (id: string) => req<void>(`/api/services/${id}/`, { method: "DELETE" }),
};

// ── Guest Check-in ────────────────────────────────────────────────────────────
export type CheckinBooking = {
  id: string;
  hotel: string;
  hotel_name: string;
  booking_reference: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  status: "pending" | "completed" | "missing_info" | "expired";
  checkin_token: string;
  checkin_link: string;
  link_sent_at: string | null;
  notes: string;
  created_at: string;
  registrations: CheckinRegistration[];
  messages: CheckinMessage[];
};

export type CheckinRegistration = {
  id: string;
  guest_number: number;
  first_name: string;
  last_name: string;
  gender?: string;
  date_of_birth: string;
  place_of_birth: string;
  nationality: string;
  residence_address: string;
  document_type: string;
  document_number: string;
  document_issue_date: string;
  document_expiry_date: string;
  document_image_url: string | null;
  signature: string;
  gdpr_consent: boolean;
  marketing_optin: boolean;
  completed_at: string;
};

export type CheckinMessage = {
  id: string;
  message_type: "email" | "whatsapp";
  recipient: string;
  status: "sent" | "failed";
  sent_at: string;
};

export type CheckinStats = {
  today: number;
  tomorrow: number;
  pending: number;
  completed: number;
  missing: number;
  total: number;
};

export type PublicBookingInfo = {
  guest_name: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  hotel_name: string;
  hotel_logo_url: string;
  hotel_brand_color: string;
  hotel_welcome_message: string;
  hotel_language: string;
  is_completed: boolean;
};

export const checkinApi = {
  // Hotel-authenticated
  listBookings: (params?: { status?: string; filter?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return req<CheckinBooking[]>(`/api/checkin/bookings/${qs ? `?${qs}` : ""}`);
  },

  createBooking: (data: {
    booking_reference?: string;
    guest_name: string;
    guest_email?: string;
    guest_phone?: string;
    check_in_date: string;
    check_out_date: string;
    num_guests: number;
    notes?: string;
  }) => req<CheckinBooking>("/api/checkin/bookings/", { method: "POST", body: JSON.stringify(data) }),

  getBooking: (id: string) => req<CheckinBooking>(`/api/checkin/bookings/${id}/`),

  deleteBooking: (id: string) => req<void>(`/api/checkin/bookings/${id}/`, { method: "DELETE" }),

  sendLink: (id: string) =>
    req<{ detail: string; sent_at: string }>(`/api/checkin/bookings/${id}/send-link/`, { method: "POST" }),

  stats: () => req<CheckinStats>("/api/checkin/bookings/stats/"),

  exportCSV: () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`${BASE}/api/checkin/bookings/export/`, { headers });
  },

  // Public (no auth) — used by guest check-in page
  verifyToken: (token: string) =>
    req<PublicBookingInfo>(`/api/checkin/verify/${token}/`),

  submitRegistration: (token: string, data: FormData) =>
    req<{ detail: string }>(`/api/checkin/register/${token}/`, { method: "POST", body: data }),
};

// ── CRM Guests ───────────────────────────────────────────────────────────────
export type CRMGuest = {
  id: string; guest_number: number;
  first_name: string; last_name: string; gender: string;
  date_of_birth: string | null; nationality: string; residence_address: string;
  document_type: string; document_number: string; document_image_url: string | null;
  gdpr_consent: boolean; marketing_optin: boolean; completed_at: string;
  booking_id: string; booking_reference: string; hotel_name: string;
  guest_email: string; guest_phone: string;
  check_in_date: string; check_out_date: string; booking_status: string;
};
export type CRMStats = { total: number; marketing_optins: number; top_countries: { nationality: string; count: number }[] };

export const guestsApi = {
  list: (params?: { search?: string; marketing_optin?: string; nationality?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return req<{ guests: CRMGuest[]; stats: CRMStats }>(`/api/checkin/guests/${qs ? `?${qs}` : ""}`);
  },
};

// ── API Keys ──────────────────────────────────────────────────────────────────
export type APIKey = {
  id: string; name: string; key_prefix: string;
  is_active: boolean; last_used_at: string | null; created_at: string;
  key?: string; // only present on creation — shown once
};
export const apiKeysApi = {
  list: () => req<APIKey[]>("/api/hotels/api-keys/"),
  create: (name: string) => req<APIKey>("/api/hotels/api-keys/", { method: "POST", body: JSON.stringify({ name }) }),
  toggle: (id: string, is_active: boolean) =>
    req<{ id: string; is_active: boolean }>(`/api/hotels/api-keys/${id}/`, { method: "PATCH", body: JSON.stringify({ is_active }) }),
  delete: (id: string) => req<void>(`/api/hotels/api-keys/${id}/`, { method: "DELETE" }),
};

// ── Booking Requests ─────────────────────────────────────────────────────────
export type BookingRequest = {
  id: string; hotel: string; hotel_name: string;
  guest_name: string; guest_email: string; guest_phone: string;
  check_in_date: string; check_out_date: string; num_guests: number;
  room_type: string; message: string;
  status: "pending" | "confirmed" | "declined";
  hotel_notes: string; booking: string | null; invitation_sent_at: string | null;
  checkin_link: string | null;
  created_at: string; updated_at: string;
};

export const bookingRequestsApi = {
  list: (status?: string) => {
    const qs = status ? `?status=${status}` : "";
    return req<BookingRequest[]>(`/api/checkin/requests/${qs}`);
  },
  update: (id: string, data: { status?: string; hotel_notes?: string }) =>
    req<BookingRequest>(`/api/checkin/requests/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => req<void>(`/api/checkin/requests/${id}/`, { method: "DELETE" }),
  // Public — no auth needed
  submitPublic: (hotelId: string, data: {
    guest_name: string; guest_email?: string; guest_phone?: string;
    check_in_date: string; check_out_date: string; num_guests: number;
    room_type?: string; message?: string;
  }) => req<{ detail: string }>(`/api/checkin/request/${hotelId}/`, { method: "POST", body: JSON.stringify(data) }),
};

// ── Review Requests ───────────────────────────────────────────────────────────
export type ReviewRequest = {
  id: string; booking_reference: string; guest_name: string; hotel_name: string;
  check_in_date: string; check_out_date: string;
  review_link: string; sent_at: string | null;
  rating: number | null; comment: string; submitted_at: string | null; is_submitted: boolean;
  google_review_url: string; tripadvisor_url: string;
  created_at: string;
};
export type PublicReviewInfo = {
  hotel_name: string; guest_name: string;
  check_in_date: string; check_out_date: string;
  is_submitted: boolean; google_review_url: string; tripadvisor_url: string;
};

export const reviewsApi = {
  list: () => req<ReviewRequest[]>("/api/checkin/reviews/"),
  sendLink: (id: string) =>
    req<{ detail: string; sent_at: string }>(`/api/checkin/reviews/${id}/send/`, { method: "POST" }),
  updateLinks: (id: string, data: { google_review_url?: string; tripadvisor_url?: string }) =>
    req<ReviewRequest>(`/api/checkin/reviews/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => req<void>(`/api/checkin/reviews/${id}/`, { method: "DELETE" }),
  requestForBooking: (bookingId: string) =>
    req<{ detail: string; sent_at: string }>(`/api/checkin/bookings/${bookingId}/request-review/`, { method: "POST" }),
  // Public
  getPublic: (token: string) => req<PublicReviewInfo>(`/api/checkin/review/${token}/`),
  submitPublic: (token: string, data: { rating: number; comment: string }) =>
    req<{ detail: string; rating: number }>(`/api/checkin/review/${token}/`, { method: "POST", body: JSON.stringify(data) }),
};

// ── Webhooks ─────────────────────────────────────────────────────────────────
export type WebhookConfig = {
  id: string; url: string;
  event: "guest_registered" | "booking_created" | "review_submitted" | "booking_request" | "all";
  is_active: boolean; created_at: string;
};
export const webhooksApi = {
  list: () => req<WebhookConfig[]>("/api/checkin/webhooks/"),
  create: (data: { url: string; event: string; secret?: string }) =>
    req<WebhookConfig>("/api/checkin/webhooks/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Pick<WebhookConfig, "url" | "event" | "is_active">>) =>
    req<WebhookConfig>(`/api/checkin/webhooks/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => req<void>(`/api/checkin/webhooks/${id}/`, { method: "DELETE" }),
};

// ── Hotel Outreach ────────────────────────────────────────────────────────────
export type OutreachStatus = "new" | "contacted" | "interested" | "negotiating" | "converted" | "lost";
export type HotelOutreach = {
  id: string; hotel_name: string; contact_name: string;
  email: string; phone: string; city: string; website: string;
  status: OutreachStatus; notes: string;
  invite_sent_at: string | null; created_at: string; updated_at: string;
};

export const outreachApi = {
  list: (params?: { status?: string; search?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return req<HotelOutreach[]>(`/api/hotels/outreach/${qs ? `?${qs}` : ""}`);
  },
  create: (data: Partial<HotelOutreach>) =>
    req<HotelOutreach>("/api/hotels/outreach/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<HotelOutreach>) =>
    req<HotelOutreach>(`/api/hotels/outreach/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => req<void>(`/api/hotels/outreach/${id}/`, { method: "DELETE" }),
  sendInvite: (id: string) =>
    req<{ detail: string; invite_sent_at: string }>(`/api/hotels/outreach/${id}/invite/`, { method: "POST" }),
};

// ── Marketing ─────────────────────────────────────────────────────────────────
export type MarketingGuest = {
  id: string; first_name: string; last_name: string;
  email: string; phone: string; nationality: string;
  hotel: string; check_in_date: string; check_out_date: string;
  registered_at: string;
};
export type MarketingAnalytics = {
  total_guests: number; marketing_optins: number; opt_in_rate: number;
  nationality_breakdown: { nationality: string; count: number }[];
  monthly_trend: { month: string; count: number }[];
  reviews: { total: number; avg_rating: number | null };
};

export const marketingApi = {
  guests: (params?: { nationality?: string; since?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return req<{ count: number; guests: MarketingGuest[] }>(`/api/marketing/guests/${qs ? `?${qs}` : ""}`);
  },
  analytics: () => req<MarketingAnalytics>("/api/marketing/analytics/"),
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingsApi = {
  create: (data: {
    service_id: string; guest_name: string; guest_phone?: string;
    guest_room?: string; quantity: number; notes?: string; payment_method: string;
  }) => req<ServiceBooking>("/api/bookings/create/", { method: "POST", body: JSON.stringify(data) }),

  list: (status?: string) =>
    req<ServiceBooking[]>(`/api/bookings/${status ? `?status=${status}` : ""}`),

  updateStatus: (id: string, data: { status?: string; payment_status?: string }) =>
    req<ServiceBooking>(`/api/bookings/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
};
