# GuestFlow Pro — Digital Concierge Platform

A full-stack SaaS platform for hotels that provides a digital concierge experience for guests, online check-in with document collection, hotel service ordering, nearby places discovery, and an admin panel for hotel managers.

**Live:** [guestflowpro.com](https://guestflowpro.com)

---

## What This Project Does

Hotels register on the platform and get:

- A **public concierge page** (`/h/[hotel-slug]`) for guests — explore nearby restaurants, attractions, order hotel services, view tours
- **Online check-in** — hotel manager sends a link, guest fills a form with personal details, document upload, and digital signature
- **Hotel Manager Dashboard** — manage bookings, check-in registrations, hotel services, view guest documents, download PDF registration slips
- **Super Admin Panel** — manage all hotels, approve/reject registrations, manage users, tours, places

---

## Tech Stack

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| Next.js | 16.2.4 | App Router, SSR/SSG |
| React | 19 | UI |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3.4 | Styling |
| Lucide React | — | Icons |
| react-qr-code | — | QR codes |

### Backend
| Tool | Version | Purpose |
|------|---------|---------|
| Django | 4.2 | Web framework |
| Django REST Framework | 3.14 | REST API |
| SimpleJWT | 5.3 | JWT authentication |
| django-cors-headers | 4.3 | CORS handling |
| Pillow | 10+ | Image/file handling |
| Stripe | 7+ | Payment processing |
| Gunicorn | 21+ | Production WSGI server |

### Infrastructure (VPS)
- **Server:** Linux VPS — `/root/Guest-Flow-Pro/`
- **Frontend process:** PM2 (`guestflowpro`) running `next start` on port 3000
- **Backend process:** Gunicorn via Unix socket `/run/concierge.sock`
- **Reverse proxy:** Nginx
- **CI/CD:** GitHub Actions → SSH deploy on push to `main`

---

## Project Structure

```
/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page
│   ├── login/                    # Hotel manager login
│   ├── register/                 # Hotel registration (4-step wizard)
│   │   ├── page.tsx              # Registration form
│   │   ├── success/              # Post-registration success
│   │   └── cancel/               # Payment cancelled
│   ├── h/[slug]/                 # Public hotel concierge page (guest-facing)
│   ├── checkin/[token]/          # Guest online check-in form (public)
│   ├── dashboard/                # Hotel manager dashboard
│   │   ├── page.tsx              # Dashboard home (stats, bookings, services)
│   │   └── checkin/
│   │       ├── bookings/         # Check-in bookings list + detail modal
│   │       └── new/              # Create new booking
│   ├── admin/                    # Super admin panel
│   │   ├── page.tsx              # Admin home
│   │   ├── hotels/               # Manage all hotels + services
│   │   ├── registrations/        # Approve/reject hotel registrations
│   │   ├── tours/                # Manage tours
│   │   ├── places/               # Manage places
│   │   └── users/                # Manage system users
│   ├── hotels/                   # Public hotels listing
│   ├── tours/                    # Public tours listing
│   ├── places/                   # Public places listing
│   ├── about/                    # About page
│   └── contact/                  # Contact page
│
├── components/                   # Shared React components
│   ├── ConciergeView.tsx         # Main guest concierge UI (services, nearby places, tours)
│   ├── RestaurantView.tsx        # Restaurant/bar nearby places view
│   ├── HotelsView.tsx            # Hotels listing component
│   ├── ToursView.tsx             # Tours listing component
│   ├── PlacesView.tsx            # Places listing component
│   ├── Navbar.tsx                # Public site navbar
│   ├── AdminNav.tsx              # Admin top navbar
│   ├── AdminSidebar.tsx          # Admin left sidebar
│   ├── BottomNav.tsx             # Mobile bottom navigation
│   ├── MobileHeader.tsx          # Mobile top header
│   ├── PublicLayout.tsx          # Layout wrapper for public pages
│   ├── Footer.tsx                # Site footer
│   ├── ContactForm.tsx           # Contact form
│   └── AboutContent.tsx          # About page content
│
├── lib/
│   ├── api.ts                    # All API calls + TypeScript types
│   ├── LanguageContext.tsx       # EN/IT language switcher context
│   ├── i18n.ts                   # Translation strings (English + Italian)
│   └── supabase.ts               # Supabase client (legacy/storage)
│
├── public/
│   ├── logo.png                  # GuestFlow Pro logo
│   └── favicon.png               # Browser favicon
│
├── backend/                      # Django backend
│   ├── concierge/                # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py               # Root URL config
│   │   └── auth.py               # Custom auth helpers
│   ├── accounts/                 # User authentication app
│   ├── hotels/                   # Hotel profiles + CRUD
│   ├── tours/                    # Tours management
│   ├── places/                   # Places (Google Places integration)
│   ├── services/                 # Hotel services + guest bookings
│   ├── subscriptions/            # Hotel registration + Stripe payments
│   ├── checkin/                  # Online check-in system
│   │   ├── models.py             # Booking, GuestRegistration, MessageLog
│   │   ├── views.py              # Public check-in + hotel manager API
│   │   └── serializers.py        # API serializers
│   ├── media/                    # Uploaded files
│   │   ├── checkin-documents/    # Guest document photos
│   │   ├── hotel-logos/          # Hotel logo uploads
│   │   ├── payment_proofs/       # Bank transfer proofs
│   │   └── services/             # Service images
│   └── manage.py
│
└── .github/workflows/deploy.yml  # Auto-deploy on push to main
```

---

## Key Features

### Guest Concierge Page (`/h/[slug]`)
- Services the hotel offers (food, spa, transport, etc.) — guests can order directly
- Nearby restaurants, bars, attractions via **Google Places API**
- AI-generated descriptions via **OpenAI API**
- Tours & experiences
- EN/IT language toggle

### Online Check-in (`/checkin/[token]`)
- Hotel manager creates a booking and sends a tokenized link via email
- Guest fills: personal details, gender, address (house/street/city/country/postal), nationality, document (passport/ID/driving license/residence permit), document photo upload, digital signature
- Multi-guest support — first guest fills full form, additional guests fill simplified form (name + document only)
- GDPR consent
- Step progress indicator

### Hotel Manager Dashboard (`/dashboard`)
- Stats: today's check-ins, pending/completed/missing bookings
- Service bookings management (accept/reject/complete)
- Hotel services CRUD (add/edit/delete with image upload)
- **Check-in Bookings:**
  - Create bookings manually
  - Send check-in link via email
  - View all guest registrations in a slide-up modal
  - View & download guest document photos (lightbox)
  - **PDF Slip** — generates a printable A4 guest registration slip for hotel manager verification at arrival
  - Export all bookings to CSV

### Hotel Registration (`/register`)
- 4-step wizard: Account → Hotel Details → Plan → Payment
- Plan selection: Basic (£29/mo) or Pro (£79/mo)
- Payment: Bank Transfer (manual proof upload) or Invoice
- Stripe integration (card payment — coming soon)
- City selection: 87 Italian cities + "Other" option

### Super Admin Panel (`/admin`)
- Approve/reject hotel registration requests
- View payment proofs
- Manage all hotels, their services, tours, places
- Import places from Google Places API
- Manage system users and roles

---

## User Roles

| Role | Access |
|------|--------|
| `superadmin` | Full admin panel — all hotels, users, registrations |
| `hotel_manager` | Own dashboard, own hotel's check-in bookings and services |
| Guest (no login) | Public concierge page, check-in form via token link |

---

## API Overview

All API calls go through `lib/api.ts`. Base URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`).

Authentication: JWT Bearer token stored in `localStorage`.

| Endpoint group | Path | Description |
|----------------|------|-------------|
| Auth | `/api/auth/` | Login, me, users CRUD |
| Hotels | `/api/hotels/` | Hotel CRUD, profile |
| Tours | `/api/tours/` | Tours CRUD |
| Places | `/api/places/` | Places CRUD, import from Google, nearby search |
| Services | `/api/services/` | Hotel service CRUD |
| Bookings | `/api/bookings/` | Guest service booking orders |
| Subscriptions | `/api/subscriptions/` | Hotel registration, payment proof, approval |
| Check-in | `/api/checkin/` | Bookings CRUD, send link, guest submit, stats, export CSV |

---

## Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Backend (`backend/.env`)
```env
SECRET_KEY=your-django-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,YOUR_VPS_IP

GOOGLE_PLACES_API_KEY=...
GOOGLE_GEOCODING_API_KEY=...
OPENAI_API_KEY=...

STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_BASIC=...
STRIPE_PRICE_PRO=...

FRONTEND_URL=https://yourdomain.com

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=YOUR_GMAIL_APP_PASSWORD
DEFAULT_FROM_EMAIL=noreply@guestflowpro.com
```

> **Security:** Never commit `.env` or `.env.local` files. Both are in `.gitignore`.

---

## Local Development

### Frontend
```bash
npm install
npm run dev        # http://localhost:3000
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver     # http://localhost:8000
```

---

## VPS Deployment

Deployments trigger automatically on push to `main` via `.github/workflows/deploy.yml`.

### Manual rebuild commands

**Full rebuild (frontend + backend):**
```bash
cd /root/Guest-Flow-Pro
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt --quiet
python manage.py migrate --no-input
python manage.py collectstatic --no-input
pkill -f gunicorn || true
sleep 1
gunicorn --workers 3 --bind unix:/run/concierge.sock concierge.wsgi:application --daemon
deactivate
cd ..

# Frontend
npm install --silent
rm -rf .next          # clean build (avoids cache mismatch errors)
npm run build
pm2 restart guestflowpro --update-env
```

**Frontend only:**
```bash
cd /root/Guest-Flow-Pro
rm -rf .next && npm run build && pm2 restart guestflowpro --update-env
```

**Check status:**
```bash
pm2 status
pm2 logs guestflowpro --lines 20
```

---

## Check-in Data Model

```
Booking
  ├── id (UUID)
  ├── hotel → Hotel
  ├── booking_reference
  ├── guest_name, guest_email, guest_phone
  ├── check_in_date, check_out_date
  ├── num_guests
  ├── status: pending | completed | missing_info | expired
  ├── checkin_token (UUID, unique — used in guest URL)
  └── registrations[] → GuestRegistration

GuestRegistration
  ├── booking → Booking (ForeignKey)
  ├── guest_number (1 = primary, 2..N = extra guests)
  ├── first_name, last_name, gender
  ├── date_of_birth, place_of_birth, nationality   (primary only)
  ├── residence_address                             (primary only)
  ├── document_type, document_number
  ├── document_issue_date, document_expiry_date
  ├── document_image (file upload)
  ├── signature (base64 canvas)
  └── gdpr_consent
  [unique_together: booking + guest_number]
```

Booking status becomes `completed` when `registrations.count() >= num_guests`.

---

## Internationalization

Supports **English** and **Italian**. Language is toggled via the `🇬🇧 EN / 🇮🇹 IT` switcher in the navbar, stored in `localStorage`, and managed through `LanguageContext`.

All strings live in `lib/i18n.ts`.

---

## PDF Registration Slip

Hotel managers can generate a printable PDF slip per booking from the dashboard. The slip includes:
- Booking summary (guest name, check-in/out, status)
- Per-guest sections: personal details, document info, photo thumbnail, signature
- Hotel Manager Verification strip (blank sign-off fields: verified by, room number, signature, date)

Generated via `window.print()` on a styled HTML page — no PDF library required.
