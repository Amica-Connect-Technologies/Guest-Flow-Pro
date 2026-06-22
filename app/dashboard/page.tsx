"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Utensils, BedDouble, Coffee, Wine, Moon, Heart, FlameKindling, Dumbbell, Car, Shirt, Home, Bell, Briefcase, Sparkles, ClipboardList, Banknote, User, Phone, Mail, MessageCircle, MapPin, LogIn, LogOut, Clock, Wifi, type LucideIcon } from "lucide-react";
import {
  auth, hotelsApi, servicesApi, bookingsApi,
  type Hotel, type HotelService, type ServiceBooking,
} from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import Image from "next/image";
import QRCode from "react-qr-code";

// ── Amenity/benefit tags (emoji/key are non-translatable metadata; labels come from t.dashboard.amenities) ──
const AMENITY_META = [
  { key: "reservations",    emoji: "📅" },
  { key: "about_hotel",     emoji: "🏨" },
  { key: "location",        emoji: "📍" },
  { key: "pre_arrival",     emoji: "⏱" },
  { key: "weddings_events", emoji: "💒" },
  { key: "tours_travel",    emoji: "✈️" },
  { key: "spa",             emoji: "💆" },
  { key: "restaurant",      emoji: "🍽️" },
  { key: "day_use",         emoji: "🌞" },
  { key: "events",          emoji: "🎤" },
  { key: "parking",         emoji: "🅿️" },
  { key: "night_life",      emoji: "🌙" },
  { key: "wifi",            emoji: "📶" },
  { key: "gym",             emoji: "🏋️" },
  { key: "pool",            emoji: "🏊" },
  { key: "bar",             emoji: "🍸" },
] as const;

// ── helpers ───────────────────────────────────────────────────────────────────
const CAT_ICON: Record<string, LucideIcon> = {
  food:         Utensils,
  room:         BedDouble,
  breakfast:    Coffee,
  bar:          Wine,
  nightlife:    Moon,
  massage:      Heart,
  spa:          FlameKindling,
  gym:          Dumbbell,
  transport:    Car,
  laundry:      Shirt,
  housekeeping: Home,
  concierge:    Bell,
  business:     Briefcase,
  other:        Sparkles,
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};
const PAY_STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-500",
  paid:    "bg-emerald-100 text-emerald-700",
};

// ── Service form ──────────────────────────────────────────────────────────────
type SvcForm = {
  name: string; description: string; category: string;
  price: string; is_available: boolean; imageFile: File | null; previewUrl: string;
};
const blankForm = (): SvcForm => ({
  name: "", description: "", category: "food", price: "", is_available: true, imageFile: null, previewUrl: "",
});

type SvcSug = { name: string; description: string; category: string; price: string };
const SERVICE_SUGGESTIONS: SvcSug[] = [
  // Food & Drinks
  { name: "Club Sandwich",          description: "Chicken, bacon, lettuce and tomato on toasted bread. Served with fries.",    category: "food",      price: "8.50"  },
  { name: "Caesar Salad",           description: "Crisp romaine, parmesan, croutons and Caesar dressing.",                     category: "food",      price: "7.00"  },
  { name: "Cheeseburger & Fries",   description: "Grilled beef patty with cheddar, lettuce and tomato.",                       category: "food",      price: "11.00" },
  { name: "Fish & Chips",           description: "Beer-battered cod fillet with hand-cut chips and mushy peas.",               category: "food",      price: "13.00" },
  { name: "Pasta Carbonara",        description: "Spaghetti carbonara with pancetta, egg and parmesan.",                       category: "food",      price: "10.50" },
  { name: "Chicken Wings",          description: "Crispy wings with your choice of sauce.",                                    category: "food",      price: "9.00"  },
  { name: "Afternoon Tea",          description: "Finger sandwiches, scones, cakes and a pot of tea.",                         category: "food",      price: "18.00" },
  // Breakfast
  { name: "Full English Breakfast", description: "Eggs, bacon, sausages, beans, toast and grilled tomatoes.",                  category: "breakfast", price: "12.00" },
  { name: "Continental Breakfast",  description: "Selection of pastries, fresh fruit, yoghurt and hot drink.",                 category: "breakfast", price: "9.00"  },
  { name: "Eggs Benedict",          description: "Poached eggs and Canadian bacon on English muffin with hollandaise.",        category: "breakfast", price: "11.00" },
  { name: "Pancakes & Maple Syrup", description: "Fluffy pancakes with maple syrup and fresh berries.",                        category: "breakfast", price: "8.50"  },
  { name: "Avocado Toast",          description: "Smashed avocado on sourdough with poached egg and chilli flakes.",           category: "breakfast", price: "9.50"  },
  // Bar & Drinks
  { name: "Cocktail of the Day",    description: "Ask our bartender for today's featured cocktail creation.",                  category: "bar",       price: "9.00"  },
  { name: "Glass of House Wine",    description: "Red, white or rosé — ask for today's selection.",                            category: "bar",       price: "6.50"  },
  { name: "Gin & Tonic",            description: "Premium gin with tonic, ice and a slice of citrus.",                         category: "bar",       price: "8.00"  },
  { name: "Mocktail (Non-Alcoholic)", description: "Refreshing non-alcoholic cocktail — ask for today's flavour.",             category: "bar",       price: "6.00"  },
  { name: "Beer / Lager",           description: "Chilled draught or bottled beer — ask for available brands.",                category: "bar",       price: "5.50"  },
  // Night Life
  { name: "VIP Table Reservation",  description: "Reserved table with priority seating in our lounge.",                       category: "nightlife", price: "50.00" },
  { name: "Club Entry Ticket",      description: "Entry to our exclusive nightclub — valid Friday & Saturday.",                category: "nightlife", price: "15.00" },
  { name: "Private Bar Package",    description: "Private bar area for up to 10 guests with a dedicated server (2 hrs).",     category: "nightlife", price: "150.00"},
  // Massage
  { name: "Full Body Massage (60 min)",  description: "Relaxing Swedish-style massage covering back, legs, arms and shoulders.", category: "massage", price: "65.00" },
  { name: "Head & Neck Massage (30 min)", description: "Focused massage for the neck, shoulders and scalp.",                   category: "massage", price: "35.00" },
  { name: "Hot Stone Massage (60 min)",  description: "Heated stones with gentle pressure for deep relaxation.",               category: "massage", price: "75.00" },
  { name: "Deep Tissue Massage (60 min)", description: "Firm pressure targeting deep muscle layers to relieve tension.",       category: "massage", price: "70.00" },
  { name: "Couple's Massage (60 min)",   description: "Side-by-side massage for two in our private couples suite.",            category: "massage", price: "120.00"},
  // Spa
  { name: "Facial Treatment (45 min)",  description: "Deep-cleansing facial using premium skincare products.",                 category: "spa",     price: "55.00" },
  { name: "Body Scrub & Wrap",          description: "Exfoliating body scrub followed by a nourishing body wrap.",            category: "spa",     price: "65.00" },
  { name: "Manicure & Pedicure",        description: "Classic mani-pedi with nail polish of your choice.",                    category: "spa",     price: "45.00" },
  { name: "Sauna & Steam Room Access",  description: "Private use of sauna and steam room facilities.",                       category: "spa",     price: "20.00" },
  // Gym
  { name: "Gym Day Pass",               description: "Full access to all gym equipment and facilities.",                      category: "gym",     price: "15.00" },
  { name: "Personal Training (1 hr)",   description: "One-to-one session with a qualified personal trainer.",                 category: "gym",     price: "50.00" },
  { name: "Yoga Class (1 hr)",          description: "Group yoga session for all levels — mats provided.",                    category: "gym",     price: "18.00" },
  // Transport
  { name: "Airport Transfer",           description: "Private car to or from the airport. Please provide flight details.",    category: "transport", price: "45.00" },
  { name: "City Centre Transfer",       description: "Private car to or from the city centre — up to 4 passengers.",         category: "transport", price: "25.00" },
  { name: "Car Rental Arrangement",     description: "We'll arrange a rental car from our trusted partner.",                 category: "transport", price: "10.00" },
  // Laundry
  { name: "Express Laundry (Same Day)", description: "Collected before 10am, returned by 6pm same day.",                     category: "laundry", price: "18.00" },
  { name: "Shirt Laundering (each)",    description: "Professional laundering and pressing per shirt.",                       category: "laundry", price: "4.50"  },
  { name: "Suit Dry Cleaning",          description: "Dry cleaning and pressing for a full suit (jacket & trousers).",       category: "laundry", price: "12.00" },
  // Housekeeping
  { name: "Extra Towels",               description: "Additional fresh towels delivered to your room.",                      category: "housekeeping", price: "0.00"  },
  { name: "Room Deep Clean",            description: "Full deep clean of your room including carpet and upholstery.",        category: "housekeeping", price: "20.00" },
  { name: "Baby Cot Setup",             description: "Travel cot set up in your room with clean bedding.",                   category: "housekeeping", price: "10.00" },
  { name: "Extra Bedding Set",          description: "Additional pillows, duvet and fresh linen delivered to your room.",   category: "housekeeping", price: "5.00"  },
  // Room Service
  { name: "Late Checkout (+2 hours)",   description: "Extend your checkout time by 2 hours (subject to availability).",     category: "room",    price: "25.00" },
  { name: "Early Check-in",             description: "Check in from 10am subject to availability.",                          category: "room",    price: "20.00" },
  { name: "Pillow Menu",                description: "Choose your preferred pillow type — memory foam, feather or ortho.",  category: "room",    price: "0.00"  },
  { name: "Evening Turndown Service",   description: "Bed prepared for night with chocolates and a bedtime drink.",          category: "room",    price: "0.00"  },
  // Concierge
  { name: "Restaurant Reservation",    description: "Our concierge will book a table at a local restaurant for you.",       category: "concierge", price: "0.00" },
  { name: "Theatre / Show Tickets",    description: "We'll source and book show tickets on your behalf.",                   category: "concierge", price: "5.00" },
  { name: "Sightseeing Tour Booking",  description: "We'll arrange a guided tour of local attractions.",                    category: "concierge", price: "5.00" },
  // Business
  { name: "Meeting Room (per hour)",   description: "Private meeting room with projector, whiteboard and refreshments.",    category: "business", price: "35.00" },
  { name: "Printing Service (per page)", description: "Black & white or colour printing available at reception.",           category: "business", price: "0.50"  },
  { name: "Business Lounge Access",    description: "Full-day access to our business lounge with workspace and Wi-Fi.",     category: "business", price: "20.00" },
];

export default function HotelDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [hotel, setHotel]     = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  // ── translated category labels & amenity meta (must live inside component — hooks can't run at module scope)
  const CAT_LABEL: Record<string, string> = t.dashboard.services.categories;
  const AMENITIES = AMENITY_META.map(a => ({ ...a, label: t.dashboard.amenities[a.key] }));
  const bookStatusLabels: Record<string, string> = t.dashboard.bookings.filters;

  // ── active section
  const [section, setSection] = useState<"qr" | "services" | "bookings" | "profile">("qr");

  // ── services
  const [services, setServices]   = useState<HotelService[]>([]);
  const [svcLoading, setSvcLoading] = useState(false);
  const [svcForm, setSvcForm]     = useState<SvcForm>(blankForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSvcForm, setShowSvcForm] = useState(false);
  const [svcSaving, setSvcSaving] = useState(false);
  const [svcError, setSvcError]   = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSug, setShowSug]     = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  // ── bookings
  const [bookings, setBookings]     = useState<ServiceBooking[]>([]);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookFilter, setBookFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── profile edit
  type ProfileForm = {
    name: string; city: string; phone: string; email: string;
    whatsapp_number: string; address: string; description: string;
    check_in_time: string; check_out_time: string; wifi_info: string;
    language_default: string; amenities: string[];
    is_24_7: boolean; open_time: string; close_time: string;
    logoFile: File | null; logoPreview: string;
  };
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "", city: "", phone: "", email: "", whatsapp_number: "", address: "",
    description: "", check_in_time: "14:00", check_out_time: "11:00", wifi_info: "",
    language_default: "en", amenities: [], is_24_7: false,
    open_time: "09:00", close_time: "22:00", logoFile: null, logoPreview: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState({ msg: "", ok: true });

  // ── init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      let userInfo;
      try { userInfo = await auth.me(); } catch { router.push("/login"); return; }
      setUserEmail(userInfo.email);
      if (userInfo.role === "admin") { router.push("/admin"); return; }
      if (!userInfo.hotel_id) { setLoading(false); return; }

      try {
        const h = await hotelsApi.get(userInfo.hotel_id);
        setHotel(h);
      } catch { /* fall through */ }
      setLoading(false);
    }
    load();
  }, [router]);

  // ── load services / bookings when section changes
  useEffect(() => {
    if (!hotel) return;
    if (section === "services") fetchServices();
    if (section === "bookings") fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, hotel]);

  async function fetchServices() {
    setSvcLoading(true);
    try { setServices(await servicesApi.myList()); } catch { /* stay */ }
    setSvcLoading(false);
  }

  async function fetchBookings() {
    setBookLoading(true);
    try { setBookings(await bookingsApi.list()); } catch { /* stay */ }
    setBookLoading(false);
  }

  // ── toast ─────────────────────────────────────────────────────────────────
  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 3000);
  }

  // ── service CRUD ──────────────────────────────────────────────────────────
  function openAddService() {
    setSvcForm(blankForm());
    setEditingId(null);
    setSvcError("");
    setShowSvcForm(true);
  }
  function openEditService(svc: HotelService) {
    setSvcForm({
      name: svc.name, description: svc.description, category: svc.category,
      price: String(svc.price), is_available: svc.is_available,
      imageFile: null, previewUrl: svc.image_url ?? "",
    });
    setEditingId(svc.id);
    setSvcError("");
    setShowSvcForm(true);
  }

  async function saveService() {
    if (!svcForm.name.trim() || !svcForm.price) { setSvcError(t.dashboard.services.nameRequired); return; }
    setSvcSaving(true); setSvcError("");
    const fd = new FormData();
    fd.append("name",         svcForm.name.trim());
    fd.append("description",  svcForm.description.trim());
    fd.append("category",     svcForm.category);
    fd.append("price",        svcForm.price);
    fd.append("is_available", svcForm.is_available ? "true" : "false");
    if (svcForm.imageFile) fd.append("image", svcForm.imageFile);
    try {
      if (editingId) {
        await servicesApi.update(editingId, fd);
        showToast(t.dashboard.services.updated);
      } else {
        await servicesApi.create(fd);
        showToast(t.dashboard.services.added);
      }
      setShowSvcForm(false);
      fetchServices();
    } catch (e) {
      setSvcError(e instanceof Error ? e.message : t.dashboard.services.saveFailed);
    }
    setSvcSaving(false);
  }

  async function deleteService(id: string) {
    if (!confirm(t.dashboard.services.deleteConfirm)) return;
    setDeletingId(id);
    try {
      await servicesApi.delete(id);
      setServices(s => s.filter(x => x.id !== id));
      showToast(t.dashboard.services.deleted);
    } catch (e) {
      showToast(e instanceof Error ? e.message : t.dashboard.services.deleteFailed, false);
    }
    setDeletingId(null);
  }

  // ── profile helpers ───────────────────────────────────────────────────────
  function openProfileForm() {
    if (!hotel) return;
    setProfileForm({
      name: hotel.name, city: hotel.city, phone: hotel.phone ?? "",
      email: hotel.email ?? "", whatsapp_number: hotel.whatsapp_number ?? "",
      address: hotel.address ?? "", description: hotel.description ?? "",
      check_in_time: hotel.check_in_time || "14:00",
      check_out_time: hotel.check_out_time || "11:00",
      wifi_info: hotel.wifi_info ?? "", language_default: hotel.language_default || "en",
      amenities: hotel.amenities ?? [], is_24_7: hotel.is_24_7 ?? false,
      open_time: hotel.open_time || "09:00", close_time: hotel.close_time || "22:00",
      logoFile: null, logoPreview: hotel.logo_url ?? "",
    });
    setProfileError("");
    setShowProfileForm(true);
  }

  async function saveProfile() {
    if (!profileForm.name.trim()) { setProfileError(t.dashboard.profileForm.hotelNameRequired); return; }
    setProfileSaving(true); setProfileError("");
    try {
      const fd = new FormData();
      fd.append("name",           profileForm.name.trim());
      fd.append("city",           profileForm.city.trim());
      fd.append("phone",          profileForm.phone.trim());
      fd.append("email",          profileForm.email.trim());
      fd.append("whatsapp_number", profileForm.whatsapp_number.trim());
      fd.append("address",        profileForm.address.trim());
      fd.append("description",    profileForm.description.trim());
      fd.append("check_in_time",  profileForm.check_in_time);
      fd.append("check_out_time", profileForm.check_out_time);
      fd.append("wifi_info",      profileForm.wifi_info.trim());
      fd.append("language_default", profileForm.language_default);
      fd.append("amenities",      JSON.stringify(profileForm.amenities));
      fd.append("is_24_7",        profileForm.is_24_7 ? "true" : "false");
      fd.append("open_time",      profileForm.is_24_7 ? "" : profileForm.open_time);
      fd.append("close_time",     profileForm.is_24_7 ? "" : profileForm.close_time);
      if (profileForm.logoFile) fd.append("logo", profileForm.logoFile);
      const updated = await hotelsApi.updateProfile(fd);
      setHotel(updated);
      setShowProfileForm(false);
      showToast(t.dashboard.profileForm.saved);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : t.dashboard.profileForm.saveFailed);
    }
    setProfileSaving(false);
  }

  function toggleAmenity(key: string) {
    setProfileForm(f => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter(a => a !== key)
        : [...f.amenities, key],
    }));
  }

  // ── booking status update ─────────────────────────────────────────────────
  async function updateBooking(id: string, data: { status?: string; payment_status?: string }) {
    setUpdatingId(id);
    try {
      const updated = await bookingsApi.updateStatus(id, data);
      setBookings(b => b.map(x => x.id === id ? updated : x));
      showToast(t.dashboard.bookings.updated);
    } catch (e) {
      showToast(e instanceof Error ? e.message : t.dashboard.bookings.updateFailed, false);
    }
    setUpdatingId(null);
  }

  // ── guards ────────────────────────────────────────────────────────────────
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400 text-sm">{t.dashboard.loading}</div>;
  if (!hotel) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <p className="text-slate-500">{t.dashboard.noHotelLinked}</p>
      <button onClick={() => { auth.logout(); router.push("/login"); }} className="text-sm text-blue-600 hover:underline">{t.dashboard.signOut}</button>
    </div>
  );

  const guestUrl = typeof window !== "undefined" ? `${window.location.origin}/h/${hotel.id}` : `/h/${hotel.id}`;
  const filteredBookings = bookFilter === "all" ? bookings : bookings.filter(b => b.status === bookFilter);

  return (
    <div className="min-h-screen" style={{ background: "#ECEEF3" }}>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast.msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 text-white text-sm px-5 py-3.5 rounded-2xl shadow-2xl z-[300] whitespace-nowrap font-semibold ${toast.ok ? "bg-slate-900" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)", boxShadow: "0 4px 24px rgba(2,11,18,0.35)" }}>
        <div className="px-4 py-4 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            {hotel.logo_url ? (
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-0.5 rounded-xl opacity-70" style={{ background: "linear-gradient(135deg, #F59E0B, #06B6D4)" }} />
                <Image unoptimized src={hotel.logo_url} alt={hotel.name} width={40} height={40}
                  className="relative w-10 h-10 rounded-xl object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #083344, #0E7490)", border: "1.5px solid rgba(6,182,212,0.4)" }}>
                {hotel.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-black text-white text-sm leading-none">{hotel.name}</p>
              <p className="text-cyan-300/80 text-xs mt-0.5 font-medium">{hotel.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-cyan-300/60 hidden sm:block font-medium">{userEmail}</span>
            <button onClick={() => { auth.logout(); router.push("/login"); }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.15)" }}>
              {t.dashboard.signOut}
            </button>
          </div>
        </div>

        {/* Section Nav inside header */}
        <div className="px-4 pb-3 max-w-2xl mx-auto">
          <div className="flex gap-2">
            {([
              { key: "qr",       label: t.dashboard.nav.qrCode,   emoji: "◻" },
              { key: "services", label: t.dashboard.nav.services, emoji: "🛎" },
              { key: "bookings", label: t.dashboard.nav.bookings, emoji: "📋" },
              { key: "profile",  label: t.dashboard.nav.profile,  emoji: "🏨" },
            ] as const).map(({ key, label, emoji }) => {
              const active = section === key;
              const pendingCount = key === "bookings" ? bookings.filter(b => b.status === "pending").length : 0;
              return (
                <button key={key} onClick={() => setSection(key)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95"
                  style={{
                    touchAction: "manipulation",
                    background: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.10)",
                    color: active ? "#083344" : "rgba(255,255,255,0.70)",
                    boxShadow: active ? "0 4px 16px rgba(0,0,0,0.20)" : "none",
                    border: active ? "none" : "1px solid rgba(255,255,255,0.12)",
                  }}>
                  <span className="text-sm leading-none">{emoji}</span>
                  <span>{label}</span>
                  {pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-16">

        {/* ════ QR CODE SECTION ══════════════════════════════════════════════ */}
        {section === "qr" && (
          <div className="space-y-4">
            {/* QR banner */}
            <div className="relative overflow-hidden rounded-3xl p-6 text-white"
              style={{ background: "linear-gradient(140deg, #020B12 0%, #083344 45%, #0E7490 100%)", boxShadow: "0 8px 32px rgba(14,116,144,0.30)" }}>
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 65%)" }} />
              <div className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(8,145,178,0.22) 0%, transparent 65%)" }} />
              <div className="relative z-10">
                <p className="text-cyan-300/80 text-[11px] font-black uppercase tracking-[0.15em] mb-1">{t.dashboard.qr.kicker}</p>
                <h2 className="font-black text-white text-xl mb-1">{t.dashboard.qr.title}</h2>
                <p className="text-cyan-200/70 text-sm">{t.dashboard.qr.subtitle}</p>
              </div>
            </div>

            {/* QR + actions card */}
            <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="p-4 rounded-2xl flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #ECFEFF, #F0FDFA)", border: "2px solid #A5F3FC" }}>
                  <QRCode value={guestUrl} size={136} />
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.dashboard.qr.linkLabel}</p>
                  <a href={guestUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-semibold break-all" style={{ color: "#0E7490" }}>{guestUrl}</a>
                  <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
                    <button onClick={() => { navigator.clipboard.writeText(guestUrl); showToast(t.dashboard.qr.linkCopied); }}
                      className="flex-1 text-sm font-black py-3 rounded-2xl transition-all active:scale-95"
                      style={{ background: "#ECFEFF", color: "#0E7490", border: "1.5px solid #A5F3FC", touchAction: "manipulation" }}>
                      {t.dashboard.qr.copyLink}
                    </button>
                    <a href={guestUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-sm font-black py-3 rounded-2xl text-center text-white transition-all active:scale-95"
                      style={{ background: "linear-gradient(135deg, #083344, #0E7490)", boxShadow: "0 4px 16px rgba(14,116,144,0.35)" }}>
                      {t.dashboard.qr.previewAsGuest}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Guest Check-in card ───────────────────────────────────────── */}
            <button
              onClick={() => router.push("/dashboard/checkin")}
              className="w-full text-left rounded-3xl p-5 flex items-center gap-4 active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)", boxShadow: "0 8px 28px rgba(14,116,144,0.28)" }}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.12)" }}>
                <svg className="w-7 h-7 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-0.5">
                  {t.checkin.navLabel}
                </p>
                <p className="text-white font-black text-base">{t.checkin.dashboard.title}</p>
                <p className="text-cyan-200/70 text-xs mt-0.5">{t.checkin.dashboard.subtitle}</p>
              </div>
              {/* Arrow */}
              <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* ════ SERVICES SECTION ════════════════════════════════════════════ */}
        {section === "services" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-slate-800 text-base">{t.dashboard.services.title}</p>
                <p className="text-slate-400 text-xs font-medium">{services.length} {t.dashboard.services.total}</p>
              </div>
              <button onClick={openAddService} style={{ touchAction: "manipulation", background: "linear-gradient(135deg, #083344, #0E7490)", boxShadow: "0 4px 16px rgba(14,116,144,0.35)" }}
                className="flex items-center gap-2 text-white text-xs font-black px-4 py-3 rounded-2xl active:scale-95 transition-all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t.dashboard.services.addService}
              </button>
            </div>

            {svcLoading ? (
              <div className="bg-white rounded-3xl p-10 flex items-center justify-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                <div className="w-8 h-8 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: "#0E7490", borderTopColor: "transparent" }} />
              </div>
            ) : services.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#ECFEFF" }}>
                  <Bell className="w-8 h-8" style={{ color: "#0E7490" }} />
                </div>
                <p className="font-black text-slate-800 text-base">{t.dashboard.services.emptyTitle}</p>
                <p className="text-slate-400 text-sm mt-1.5">{t.dashboard.services.emptySubtitle}</p>
                <button onClick={openAddService} style={{ touchAction: "manipulation", background: "linear-gradient(135deg, #083344, #0E7490)", boxShadow: "0 4px 16px rgba(14,116,144,0.35)" }}
                  className="mt-5 text-white text-sm font-black px-6 py-3 rounded-2xl active:scale-95 transition-all">
                  {t.dashboard.services.addFirstService}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(svc => {
                  const CatIcon = CAT_ICON[svc.category] ?? Sparkles;
                  return (
                  <div key={svc.id} className={`bg-white rounded-3xl overflow-hidden transition-opacity ${!svc.is_available ? "opacity-55" : ""}`}
                    style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
                    <div className="flex items-start gap-3 p-4">
                      {svc.image_url ? (
                        <Image unoptimized src={svc.image_url} alt={svc.name} width={60} height={60}
                          className="w-[60px] h-[60px] rounded-2xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "#ECFEFF" }}>
                          <CatIcon className="w-7 h-7" style={{ color: "#0E7490" }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-black text-slate-900 text-sm leading-snug">{svc.name}</p>
                          {!svc.is_available && (
                            <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full flex-shrink-0">{t.dashboard.services.hidden}</span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#0E7490" }}>{CAT_LABEL[svc.category] ?? svc.category}</p>
                        <p className="font-black text-emerald-600 text-sm mt-1.5">£{Number(svc.price).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex border-t border-slate-100">
                      <button onClick={() => openEditService(svc)} style={{ touchAction: "manipulation", color: "#0E7490" }}
                        className="flex-1 py-3 text-xs font-black hover:bg-cyan-50 transition-colors">{t.dashboard.services.edit}</button>
                      <button onClick={() => deleteService(svc.id)} disabled={deletingId === svc.id}
                        style={{ touchAction: "manipulation" }}
                        className="flex-1 py-3 text-xs font-black text-red-500 hover:bg-red-50 transition-colors border-l border-slate-100 disabled:opacity-50">
                        {deletingId === svc.id ? t.dashboard.services.deleting : t.dashboard.services.delete}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ BOOKINGS SECTION ════════════════════════════════════════════ */}
        {section === "bookings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-slate-800 text-base">{t.dashboard.bookings.title}</p>
                <p className="text-slate-400 text-xs font-medium">{bookings.length} {t.dashboard.bookings.total}</p>
              </div>
              <button onClick={fetchBookings}
                className="text-xs font-black px-3 py-2 rounded-xl bg-white active:scale-95 transition-all"
                style={{ touchAction: "manipulation", color: "#0E7490", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                ↻ {t.dashboard.bookings.refresh}
              </button>
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {[
                { k: "all",       label: t.dashboard.bookings.filters.all       },
                { k: "pending",   label: t.dashboard.bookings.filters.pending   },
                { k: "confirmed", label: t.dashboard.bookings.filters.confirmed },
                { k: "completed", label: t.dashboard.bookings.filters.completed },
                { k: "cancelled", label: t.dashboard.bookings.filters.cancelled },
              ].map(({ k, label }) => (
                <button key={k} onClick={() => setBookFilter(k)}
                  className={`flex-shrink-0 text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 ${
                    bookFilter === k ? "text-white" : "bg-white text-slate-500"
                  }`}
                  style={bookFilter === k
                    ? { background: "linear-gradient(135deg, #083344, #0E7490)", boxShadow: "0 4px 14px rgba(14,116,144,0.35)", touchAction: "manipulation" }
                    : { touchAction: "manipulation", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }
                  }>
                  {label}
                </button>
              ))}
            </div>

            {bookLoading ? (
              <div className="bg-white rounded-3xl p-10 flex items-center justify-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                <div className="w-8 h-8 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: "#0E7490", borderTopColor: "transparent" }} />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#ECFEFF" }}>
                  <ClipboardList className="w-8 h-8" style={{ color: "#0E7490" }} />
                </div>
                <p className="font-black text-slate-800 text-base">{t.dashboard.bookings.emptyTitle}</p>
                <p className="text-slate-400 text-sm mt-1.5">{t.dashboard.bookings.emptySubtitle}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map(b => (
                  <div key={b.id} className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 text-sm mb-1.5">{b.service_name}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl capitalize ${BOOKING_STATUS_COLORS[b.status] ?? ""}`}>
                              {bookStatusLabels[b.status] ?? b.status}
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl ${PAY_STATUS_COLORS[b.payment_status] ?? ""}`}>
                              {b.payment_status === "paid" ? t.dashboard.bookings.paid : b.payment_method === "cod" ? t.dashboard.bookings.cashOnDelivery : t.dashboard.bookings.unpaid}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 font-semibold">{b.guest_name}
                            {b.guest_room && <span className="text-slate-400 font-normal"> · {t.dashboard.bookings.roomLabel} {b.guest_room}</span>}
                            {b.guest_phone && <span className="text-slate-400 font-normal"> · {b.guest_phone}</span>}
                          </p>
                          {b.notes && <p className="text-xs text-slate-400 mt-1 italic">&ldquo;{b.notes}&rdquo;</p>}
                          <p className="text-[10px] text-slate-300 mt-1.5 font-medium">
                            {new Date(b.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-emerald-600 text-base">£{Number(b.total_price).toFixed(2)}</p>
                          <p className="text-[10px] text-slate-300 mt-0.5 font-medium">×{b.quantity}</p>
                        </div>
                      </div>
                    </div>

                    {b.status !== "completed" && b.status !== "cancelled" && (
                      <div className="flex border-t border-slate-100 divide-x divide-slate-100">
                        {b.status === "pending" && (
                          <button onClick={() => updateBooking(b.id, { status: "confirmed" })}
                            disabled={updatingId === b.id} style={{ touchAction: "manipulation", color: "#0E7490" }}
                            className="flex-1 py-3 text-xs font-black hover:bg-cyan-50 disabled:opacity-50 transition-colors">
                            {t.dashboard.bookings.confirm}
                          </button>
                        )}
                        {b.status === "confirmed" && (
                          <button onClick={() => updateBooking(b.id, { status: "completed" })}
                            disabled={updatingId === b.id} style={{ touchAction: "manipulation" }}
                            className="flex-1 py-3 text-xs font-black text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors">
                            {t.dashboard.bookings.markDone}
                          </button>
                        )}
                        {b.payment_status === "pending" && b.payment_method !== "stripe" && (
                          <button onClick={() => updateBooking(b.id, { payment_status: "paid" })}
                            disabled={updatingId === b.id} style={{ touchAction: "manipulation" }}
                            className="flex-1 py-3 text-xs font-black text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors">
                            {t.dashboard.bookings.markPaid}
                          </button>
                        )}
                        <button onClick={() => updateBooking(b.id, { status: "cancelled" })}
                          disabled={updatingId === b.id} style={{ touchAction: "manipulation" }}
                          className="flex-1 py-3 text-xs font-black text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors">
                          {t.dashboard.bookings.cancel}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ PROFILE SECTION ════════════════════════════════════════════ */}
        {section === "profile" && (
          <div className="space-y-4">
            {/* Header card */}
            <div className="rounded-3xl overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(14,116,144,0.22)" }}>
              <div className="relative px-5 py-6 flex items-center justify-between overflow-hidden"
                style={{ background: "linear-gradient(140deg, #020B12 0%, #083344 45%, #0E7490 100%)" }}>
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 65%)" }} />
                <div className="absolute -bottom-16 -left-8 w-36 h-36 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(8,145,178,0.20) 0%, transparent 65%)" }} />
                <div className="relative z-10 flex items-center gap-4">
                  {hotel.logo_url ? (
                    <div className="relative flex-shrink-0">
                      <div className="absolute -inset-0.5 rounded-2xl opacity-70" style={{ background: "linear-gradient(135deg, #F59E0B, #06B6D4)" }} />
                      <Image unoptimized src={hotel.logo_url} alt={hotel.name} width={56} height={56}
                        className="relative w-14 h-14 rounded-2xl object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(6,182,212,0.3)" }}>
                      <span className="text-white font-black text-xl">{hotel.name.slice(0,2).toUpperCase()}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-black text-lg leading-tight">{hotel.name}</p>
                    <p className="text-cyan-300/80 text-xs mt-0.5 font-medium">{hotel.city}</p>
                  </div>
                </div>
                <button onClick={openProfileForm}
                  className="relative z-10 flex items-center gap-1.5 text-white text-xs font-black px-3.5 py-2.5 rounded-xl transition-all active:scale-95"
                  style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.22)", touchAction: "manipulation" }}>
                  <User className="w-3.5 h-3.5" />
                  {t.dashboard.profile.editProfile}
                </button>
              </div>

              {/* Info rows */}
              <div style={{ background: "#F0F8FA" }} className="px-4 py-4 grid grid-cols-1 gap-2.5">
                {[
                  { label: t.dashboard.profile.phone,     val: hotel.phone             || "—", Icon: Phone,      color: "#0E7490", bg: "#ECFEFF" },
                  { label: t.dashboard.profile.email,     val: hotel.email             || "—", Icon: Mail,       color: "#0E7490", bg: "#ECFEFF" },
                  { label: t.dashboard.profile.whatsapp,  val: hotel.whatsapp_number   || "—", Icon: MessageCircle, color: "#059669", bg: "#ECFDF5" },
                  { label: t.dashboard.profile.address,   val: hotel.address           || "—", Icon: MapPin,     color: "#7C3AED", bg: "#F5F3FF" },
                  { label: t.dashboard.profile.checkIn,   val: hotel.check_in_time     || "14:00", Icon: LogIn,  color: "#0E7490", bg: "#ECFEFF" },
                  { label: t.dashboard.profile.checkOut,  val: hotel.check_out_time    || "11:00", Icon: LogOut, color: "#B45309", bg: "#FFFBEB" },
                  { label: t.dashboard.profile.hours,     val: hotel.is_24_7 ? t.dashboard.profile.always247 : `${hotel.open_time || "09:00"} – ${hotel.close_time || "22:00"}`, Icon: Clock, color: "#0E7490", bg: "#ECFEFF" },
                  { label: t.dashboard.profile.wifi,      val: hotel.wifi_info         || t.dashboard.profile.askReception, Icon: Wifi, color: "#0E7490", bg: "#ECFEFF" },
                ].map(({ label, val, Icon, color, bg }) => (
                  <div key={label} className="flex items-center gap-3 bg-white rounded-2xl px-3.5 py-3"
                    style={{ boxShadow: "0 1px 6px rgba(14,116,144,0.08)" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: bg }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#94A3B8" }}>{label}</p>
                      <p className="text-xs font-bold truncate mt-0.5" style={{ color: "#1E293B" }}>{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {hotel.description && (
              <div className="rounded-3xl overflow-hidden" style={{ boxShadow: "0 4px 18px rgba(14,116,144,0.12)" }}>
                <div className="px-4 py-3 flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg, #083344 0%, #0E7490 100%)" }}>
                  <span className="text-base">🏨</span>
                  <p className="text-xs font-black text-white/90 uppercase tracking-widest">{t.dashboard.profile.about}</p>
                </div>
                <div className="bg-white px-5 py-4">
                  <p className="text-sm text-slate-600 leading-relaxed">{hotel.description}</p>
                </div>
              </div>
            )}

            {/* Services & Benefits */}
            <div className="rounded-3xl overflow-hidden" style={{ boxShadow: "0 4px 18px rgba(14,116,144,0.12)" }}>
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ background: "linear-gradient(135deg, #083344 0%, #0E7490 100%)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">✨</span>
                  <p className="text-xs font-black text-white/90 uppercase tracking-widest">{t.dashboard.profile.servicesAndBenefits}</p>
                </div>
                <button onClick={openProfileForm} style={{ touchAction: "manipulation", background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)" }}
                  className="text-xs text-white font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform">{t.dashboard.services.edit}</button>
              </div>
              <div className="bg-white px-5 py-4">
                {(hotel.amenities ?? []).length === 0 ? (
                  <p className="text-xs text-slate-400">{t.dashboard.profile.noServicesYet} <button onClick={openProfileForm} style={{ touchAction: "manipulation" }} className="text-cyan-600 font-bold hover:underline">{t.dashboard.profile.addNow}</button></p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(hotel.amenities ?? []).map(key => {
                      const a = AMENITIES.find(x => x.key === key);
                      return a ? (
                        <span key={key} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                          style={{ background: "#ECFEFF", color: "#0E7490", border: "1px solid rgba(14,116,144,0.18)" }}>
                          <span>{a.emoji}</span>{a.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════ PROFILE EDIT SHEET ═════════════════════════════════════════════ */}
      {showProfileForm && (
        <>
          <div onClick={() => !profileSaving && setShowProfileForm(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 210, background: "white",
            borderRadius: "24px 24px 0 0", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
            maxHeight: "94vh", overflowY: "auto" }}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            <div className="px-5 pb-2">
              <h3 className="font-bold text-slate-900 text-base mb-4">{t.dashboard.profileForm.title}</h3>

              <div className="space-y-4">

                {/* Logo upload */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">{t.dashboard.profileForm.hotelLogo}</label>
                  <div className="flex items-center gap-3">
                    <div onClick={() => logoRef.current?.click()}
                      className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-400 transition-colors flex-shrink-0">
                      {profileForm.logoPreview ? (
                        <Image unoptimized src={profileForm.logoPreview} alt="" width={64} height={64} className="w-16 h-16 object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-slate-300">{profileForm.name.slice(0,2).toUpperCase() || "?"}</span>
                      )}
                    </div>
                    <button type="button" onClick={() => logoRef.current?.click()}
                      className="text-xs font-semibold text-blue-600 hover:underline">
                      {profileForm.logoPreview ? t.dashboard.profileForm.changeLogo : t.dashboard.profileForm.uploadLogo}
                    </button>
                    <input ref={logoRef} type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) setProfileForm(s => ({ ...s, logoFile: f, logoPreview: URL.createObjectURL(f) }));
                      }} />
                  </div>
                </div>

                {/* Name + City */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.profileForm.hotelName} <span className="text-red-400">*</span></label>
                    <input value={profileForm.name} onChange={e => setProfileForm(s => ({ ...s, name: e.target.value }))}
                      placeholder={t.dashboard.profileForm.hotelNamePlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.profileForm.city}</label>
                    <input value={profileForm.city} onChange={e => setProfileForm(s => ({ ...s, city: e.target.value }))}
                      placeholder={t.dashboard.profileForm.cityPlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                </div>

                {/* About */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.profileForm.aboutDescription}</label>
                  <textarea value={profileForm.description} onChange={e => setProfileForm(s => ({ ...s, description: e.target.value }))}
                    rows={3} placeholder={t.dashboard.profileForm.aboutPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all resize-none" />
                </div>

                {/* Address */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.profileForm.address}</label>
                  <input value={profileForm.address} onChange={e => setProfileForm(s => ({ ...s, address: e.target.value }))}
                    placeholder={t.dashboard.profileForm.addressPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.profileForm.phone}</label>
                    <input value={profileForm.phone} onChange={e => setProfileForm(s => ({ ...s, phone: e.target.value }))}
                      placeholder={t.dashboard.profileForm.phonePlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.profileForm.email}</label>
                    <input type="email" value={profileForm.email} onChange={e => setProfileForm(s => ({ ...s, email: e.target.value }))}
                      placeholder={t.dashboard.profileForm.emailPlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.profileForm.whatsappNumber}</label>
                  <input value={profileForm.whatsapp_number} onChange={e => setProfileForm(s => ({ ...s, whatsapp_number: e.target.value }))}
                    placeholder={t.dashboard.profileForm.whatsappPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                </div>

                {/* Check-in / Check-out / WiFi */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.profileForm.checkIn}</label>
                    <input value={profileForm.check_in_time} onChange={e => setProfileForm(s => ({ ...s, check_in_time: e.target.value }))}
                      placeholder={t.dashboard.profileForm.checkInPlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.profileForm.checkOut}</label>
                    <input value={profileForm.check_out_time} onChange={e => setProfileForm(s => ({ ...s, check_out_time: e.target.value }))}
                      placeholder={t.dashboard.profileForm.checkOutPlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.profileForm.wifiInfo}</label>
                    <input value={profileForm.wifi_info} onChange={e => setProfileForm(s => ({ ...s, wifi_info: e.target.value }))}
                      placeholder={t.dashboard.profileForm.wifiPlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                </div>

                {/* Opening Hours */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">{t.dashboard.profileForm.openingHours}</label>
                  {/* 24/7 toggle */}
                  <button type="button"
                    onClick={() => setProfileForm(s => ({ ...s, is_24_7: !s.is_24_7 }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all mb-3 ${
                      profileForm.is_24_7
                        ? "bg-emerald-50 border-emerald-400"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                    style={{ touchAction: "manipulation" }}>
                    <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${profileForm.is_24_7 ? "bg-emerald-500" : "bg-slate-300"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform shadow ${profileForm.is_24_7 ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${profileForm.is_24_7 ? "text-emerald-700" : "text-slate-600"}`}>
                        {t.dashboard.profileForm.open247}
                      </p>
                      <p className="text-[11px] text-slate-400">{t.dashboard.profileForm.open247Hint}</p>
                    </div>
                    {profileForm.is_24_7 && (
                      <span className="ml-auto text-[10px] font-black bg-emerald-500 text-white px-2.5 py-1 rounded-full">{t.dashboard.profileForm.active}</span>
                    )}
                  </button>

                  {/* Open / Close time pickers — hidden when 24/7 */}
                  {!profileForm.is_24_7 && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">{t.dashboard.profileForm.opensAt}</label>
                        <div className="relative">
                          <input
                            type="time"
                            value={profileForm.open_time}
                            onChange={e => setProfileForm(s => ({ ...s, open_time: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                          />
                        </div>
                        {/* AM/PM hint */}
                        {profileForm.open_time && (
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                            {(() => {
                              const [h, m] = profileForm.open_time.split(":").map(Number);
                              const ampm = h < 12 ? "AM" : "PM";
                              const h12 = h % 12 || 12;
                              return `${h12}:${String(m).padStart(2,"0")} ${ampm}`;
                            })()}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">{t.dashboard.profileForm.closesAt}</label>
                        <div className="relative">
                          <input
                            type="time"
                            value={profileForm.close_time}
                            onChange={e => setProfileForm(s => ({ ...s, close_time: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                          />
                        </div>
                        {profileForm.close_time && (
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                            {(() => {
                              const [h, m] = profileForm.close_time.split(":").map(Number);
                              const ampm = h < 12 ? "AM" : "PM";
                              const h12 = h % 12 || 12;
                              return `${h12}:${String(m).padStart(2,"0")} ${ampm}`;
                            })()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Services & Benefits */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">{t.dashboard.profileForm.servicesAndBenefits}</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map(({ key, label, emoji }) => {
                      const active = profileForm.amenities.includes(key);
                      return (
                        <button key={key} type="button" onClick={() => toggleAmenity(key)}
                          style={{ touchAction: "manipulation" }}
                          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                            active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                          }`}>
                          <span>{emoji}</span>{label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {profileError && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-red-600">{profileError}</p>
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowProfileForm(false)} disabled={profileSaving}
                  className="flex-1 border border-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl text-sm">
                  {t.dashboard.profileForm.cancel}
                </button>
                <button onClick={saveProfile} disabled={profileSaving}
                  className="flex-1 bg-blue-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl text-sm">
                  {profileSaving ? t.dashboard.profileForm.saving : t.dashboard.profileForm.save}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════ SERVICE FORM SHEET ══════════════════════════════════════════════ */}
      {showSvcForm && (
        <>
          <div onClick={() => !svcSaving && setShowSvcForm(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 210, background: "white",
            borderRadius: "24px 24px 0 0", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
            maxHeight: "92vh", overflowY: "auto" }}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            <div className="px-5 pb-2">
              <h3 className="font-bold text-slate-900 text-base mb-4">{editingId ? t.dashboard.serviceForm.editTitle : t.dashboard.serviceForm.addTitle}</h3>

              <div className="space-y-3">
                {/* Image upload */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">{t.dashboard.serviceForm.photo}</label>
                  <div className="flex items-center gap-3">
                    <div onClick={() => imgRef.current?.click()}
                      className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-400 transition-colors flex-shrink-0">
                      {svcForm.previewUrl ? (
                        <Image unoptimized src={svcForm.previewUrl} alt="" width={64} height={64} className="w-16 h-16 object-cover" />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-slate-300">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21zM12.75 6.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                      )}
                    </div>
                    <button type="button" onClick={() => imgRef.current?.click()}
                      className="text-xs font-semibold text-blue-600 hover:underline">
                      {svcForm.previewUrl ? t.dashboard.serviceForm.changePhoto : t.dashboard.serviceForm.uploadPhoto}
                    </button>
                    <input ref={imgRef} type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) setSvcForm(s => ({ ...s, imageFile: f, previewUrl: URL.createObjectURL(f) }));
                      }} />
                  </div>
                </div>

                {/* Name + Suggestions */}
                <div className="relative">
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.serviceForm.name} <span className="text-red-400">*</span></label>
                  <input
                    value={svcForm.name}
                    onChange={e => { setSvcForm(s => ({ ...s, name: e.target.value })); setShowSug(true); }}
                    onFocus={() => setShowSug(true)}
                    onBlur={() => setTimeout(() => setShowSug(false), 160)}
                    placeholder={t.dashboard.serviceForm.namePlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all"
                  />
                  {showSug && (() => {
                    const q = svcForm.name.toLowerCase().trim();
                    const sugs = SERVICE_SUGGESTIONS.filter(s =>
                      q ? s.name.toLowerCase().includes(q) : s.category === svcForm.category
                    ).slice(0, 6);
                    if (!sugs.length) return null;
                    return (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                        <p className="px-4 pt-2.5 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {q ? t.dashboard.serviceForm.matchingServices : `${t.dashboard.serviceForm.suggestionsFor} ${CAT_LABEL[svcForm.category] ?? svcForm.category}`}
                        </p>
                        {sugs.map((s, i) => {
                          const Icon = CAT_ICON[s.category] ?? Sparkles;
                          return (
                            <button key={i} type="button"
                              onMouseDown={() => {
                                setSvcForm(f => ({ ...f, name: s.name, description: s.description, category: s.category, price: s.price }));
                                setShowSug(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 border-t border-slate-50 active:bg-blue-100 transition-colors text-left">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-slate-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{s.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{CAT_LABEL[s.category]} · £{s.price}</p>
                              </div>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 text-blue-400 flex-shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.serviceForm.description}</label>
                  <textarea value={svcForm.description} onChange={e => setSvcForm(s => ({ ...s, description: e.target.value }))}
                    rows={2} placeholder={t.dashboard.serviceForm.descriptionPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all resize-none" />
                </div>

                {/* Category + Price row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.serviceForm.category}</label>
                    <select value={svcForm.category} onChange={e => setSvcForm(s => ({ ...s, category: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all">
                      {Object.entries(CAT_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">{t.dashboard.serviceForm.price} <span className="text-red-400">*</span></label>
                    <input type="number" min="0" step="0.01" value={svcForm.price}
                      onChange={e => setSvcForm(s => ({ ...s, price: e.target.value }))}
                      placeholder={t.dashboard.serviceForm.pricePlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                </div>

                {/* Payment hint for food */}
                {svcForm.category === "food" && (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <p className="text-xs text-orange-700 font-medium">{t.dashboard.serviceForm.foodPaymentHint} <strong>{t.dashboard.serviceForm.cashOnDelivery}</strong> {t.dashboard.serviceForm.foodPaymentHintSuffix}</p>
                  </div>
                )}

                {/* Available toggle */}
                <button type="button" onClick={() => setSvcForm(s => ({ ...s, is_available: !s.is_available }))}
                  className="flex items-center gap-3 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${svcForm.is_available ? "bg-blue-600" : "bg-slate-200"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform shadow ${svcForm.is_available ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{t.dashboard.serviceForm.availableToGuests}</span>
                </button>
              </div>

              {svcError && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-red-600">{svcError}</p>
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowSvcForm(false)} disabled={svcSaving}
                  className="flex-1 border border-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl text-sm">
                  {t.dashboard.serviceForm.cancel}
                </button>
                <button onClick={saveService} disabled={svcSaving}
                  className="flex-1 bg-blue-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl text-sm">
                  {svcSaving ? t.dashboard.serviceForm.saving : editingId ? t.dashboard.serviceForm.save : t.dashboard.serviceForm.add}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
