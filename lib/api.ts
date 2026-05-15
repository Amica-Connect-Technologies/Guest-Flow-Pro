const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type Hotel = {
  id: string; name: string; city: string; whatsapp_number: string;
  language_default: string; logo_url: string; created_at: string;
  // extended profile fields
  description: string; address: string; phone: string; email: string;
  check_in_time: string; check_out_time: string; wifi_info: string;
  amenities: string[];
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
      "Request failed";
    throw new Error(String(msg));
  }
  return json;
}

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

  stats: () => req<{ hotels: number; tours: number; places: number }>("/api/auth/stats/"),

  getProfile: () => req<Hotel>("/api/hotels/profile/"),
  updateProfile: (data: FormData | Record<string, unknown>) => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return req<Hotel>("/api/hotels/profile/", { method: "PATCH", body });
  },
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
};

// ── Registrations ────────────────────────────────────────────────────────────
export const registrationsApi = {
  register: (data: {
    owner_name: string; business_name: string; email: string; password: string;
    phone?: string; city: string; whatsapp_number?: string; plan: string; payment_method: string;
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
