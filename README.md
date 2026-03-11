# 🛺 AutoRiksha

> A production-ready, full-stack **Auto Rickshaw ride-booking platform** for India — like Uber, but built specifically for Auto Rickshaws.

![AutoRiksha](https://img.shields.io/badge/AutoRiksha-v1.0.0-F97316?style=for-the-badge)
![Bun](https://img.shields.io/badge/Bun-Runtime-000?logo=bun&logoColor=white&style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js_14-Admin-000?logo=next.js&style=flat-square)
![Expo](https://img.shields.io/badge/Expo_SDK_51-Mobile-000?logo=expo&style=flat-square)

---

## 📱 Three Applications

| App | Stack | Purpose |
|-----|-------|---------|
| **Backend API** | Bun + Elysia.js + Prisma + PostgreSQL | Single source of truth — REST + WebSocket |
| **Admin Panel** | Next.js 14 (App Router) + Redux Toolkit | Internal operations dashboard |
| **Mobile App** | React Native + Expo + Zustand | Customer & Driver apps |

---

## 🏗️ Project Structure

```
Otox/
├── backend/                   # Elysia.js API Server
│   ├── prisma/                # Database schema & seed
│   └── src/
│       ├── config/            # Firebase, Redis, env
│       ├── middleware/        # Auth, error handler, logger
│       ├── plugins/           # Swagger, CORS
│       ├── routes/            # auth, customer, driver, admin, maps, websocket
│       ├── services/          # Fare calc, ride matching, notifications, OTP, payouts
│       ├── types/             # TypeScript interfaces & enums
│       └── utils/             # Distance, validators
├── frontend/                  # Next.js Admin Panel
│   └── src/
│       ├── app/               # App Router pages
│       │   ├── (dashboard)/   # Dashboard, users, drivers, rides, payments, support, etc.
│       │   └── login/         # Admin auth
│       ├── components/        # Sidebar, Header
│       ├── lib/               # Axios, Firebase, permissions, types
│       └── store/             # Redux + RTK Query API slices
├── mobile_frontend/           # React Native Expo App
│   ├── app/
│   │   ├── (auth)/            # Welcome, phone, OTP, register
│   │   ├── (customer)/        # Home (map+booking), rides, wallet, profile
│   │   └── (driver)/          # Home (online/offline), active-ride, earnings, profile
│   ├── components/            # StatusBadge, RideCard, Button
│   ├── services/              # API (Axios), Socket.io, location tracker
│   └── stores/                # Zustand (auth, ride, location)
└── AutoRiksha_AI_Agent_Prompt.md  # Full spec document
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [Elysia.js](https://elysiajs.com)
- **ORM**: [Prisma](https://www.prisma.io)
- **Database**: PostgreSQL
- **Cache**: Redis (ioredis)
- **Auth**: Firebase Admin SDK + JWT (jose)
- **Real-time**: WebSockets (Elysia built-in)
- **Push**: Firebase Cloud Messaging
- **Maps**: Google Maps APIs
- **Payments**: Razorpay
- **Docs**: Swagger via @elysiajs/swagger

### Admin Panel
- **Framework**: Next.js 14 (App Router)
- **State**: Redux Toolkit + RTK Query
- **UI**: Tailwind CSS + Radix UI + Recharts + Lucide Icons
- **Maps**: @vis.gl/react-google-maps
- **Tables**: TanStack Table v8

### Mobile App
- **Framework**: React Native + Expo SDK 51
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind for RN)
- **State**: Zustand
- **Maps**: react-native-maps + expo-location
- **Real-time**: Socket.io-client

---

## ⚡ Getting Started

### Prerequisites

- [Bun](https://bun.sh) (for backend)
- [Node.js](https://nodejs.org) v18+ (for admin & mobile)
- PostgreSQL database
- Redis server
- Firebase project (Auth + FCM + Storage)
- Google Maps API key

### 1. Backend

```bash
cd backend
cp .env.example .env           # Configure your env vars
bun install
bunx prisma generate
bunx prisma db push
bun run db:seed                # Seed fare config + super admin
bun run dev                    # Starts on http://localhost:3001
```

Swagger docs: `http://localhost:3001/swagger`

### 2. Admin Panel

```bash
cd frontend
cp .env.example .env.local     # Configure your env vars
npm install
npm run dev                    # Starts on http://localhost:3000
```

### 3. Mobile App

```bash
cd mobile_frontend
cp .env.example .env
npm install
npx expo start                 # Scan QR with Expo Go
```

---

## 🗄️ Database Schema

17+ Prisma models including:

| Model | Description |
|-------|-------------|
| `User` | Customers & Drivers (shared) |
| `CustomerProfile` | Saved addresses, total rides |
| `DriverProfile` | License, Aadhar, location, earnings, rating |
| `Vehicle` | Registration, insurance, permits |
| `Ride` | Full ride lifecycle with OTP |
| `FareConfig` | Base fare ₹30, ₹12/km, ₹1.5/min |
| `Review` | Post-ride ratings |
| `Payment` | Razorpay integration |
| `Earning` | Driver earnings with 15% commission |
| `WalletTransaction` | Wallet credits/debits |
| `AdminUser` | 6 roles with permission matrix |
| `SupportTicket` | Ticket system with messages |
| `ServerErrorLog` | Auto-logged server errors |
| `Promotion` | Promo codes (flat/percent) |
| `AppSettings` | Key-value config |

---

## 💰 Business Logic

### Fare Calculation
```
Total = max(baseFare, distanceFare + timeFare)
  baseFare     = ₹30 (minimum)
  distanceFare = distance × ₹12/km
  timeFare     = duration × ₹1.5/min
  nightCharge  = ×1.25 (11PM–5AM)
  surge        = configurable multiplier
```

### Ride Matching
- Search nearby online drivers within **3km radius** (Redis GEO)
- Broadcast ride request via **FCM push + WebSocket**
- **30-second** acceptance window per driver
- Expand to **5km** if no driver accepts

### Platform Commission
- **15%** of ride fare deducted from driver earnings
- Transparent breakdown shown to drivers

---

## 🔐 Authentication

### Mobile (Customer/Driver)
1. Phone number → Firebase SMS OTP
2. OTP verified → Firebase `idToken`
3. `POST /api/auth/verify` → Server issues JWT
4. Stored in secure storage, auto-refresh on 401

### Admin Panel
1. Email/password → Firebase Auth
2. `POST /api/admin/auth/verify` → Admin JWT with role
3. Role-based middleware on all routes

### Admin Roles
| Role | Key Permissions |
|------|-----------------|
| `SUPER_ADMIN` | Full access |
| `DEVELOPER` | Dashboard, errors, logs |
| `OPERATIONS` | Drivers, rides, promotions |
| `FINANCE` | Payments, payouts, refunds, fare config |
| `CUSTOMER_SERVICE` | Users, support tickets |
| `SUPPORT_AGENT` | Support tickets only |

---

## 🌐 API Overview

| Route Group | Base Path | Auth |
|-------------|-----------|------|
| Auth | `/api/auth` | Public |
| Customer | `/api/customer` | JWT |
| Driver | `/api/driver` | JWT |
| Maps | `/api/maps` | JWT |
| Admin | `/api/admin` | Admin JWT + Role |

### WebSocket Endpoints
- `/ws/customer/:rideId` — Live ride updates for customers
- `/ws/driver` — Ride requests & updates for drivers

---

## 📱 Mobile App Screens

### Customer
- **Home** — Google Map with nearby auto markers, "Where to?" search bar
- **Booking** — Fare estimate, payment method, "Book Auto" CTA
- **Ride Tracking** — Real-time driver location, ETA, OTP display
- **Rides** — Ride history with status badges
- **Wallet** — Balance, quick top-up, transaction history
- **Profile** — Edit info, saved addresses, logout

### Driver
- **Home** — Online/offline toggle, today's earnings, incoming ride requests (modal)
- **Active Ride** — Navigate to pickup → verify OTP → start trip → complete
- **Earnings** — Daily/weekly/monthly breakdown, commission details
- **Profile** — Vehicle info, document status, rating

---

## 🖥️ Admin Dashboard Pages

| Page | Features |
|------|----------|
| **Dashboard** | 8 KPI cards, revenue/rides charts, recent activity |
| **Live Map** | Real-time driver/ride markers on Google Maps |
| **Users** | Customer list, search, ban/unban, detail view |
| **Drivers** | Approval queue, document review, suspend/activate |
| **Rides** | All rides table with filters, ride detail, refund |
| **Payments** | Revenue summary, transaction table, driver payouts |
| **Support** | Ticket management, chat, assign agents, priority |
| **Analytics** | Revenue, rides, user growth, distribution charts |
| **Errors** | Server error logs with severity filter, resolve action |
| **Promotions** | Create/manage promo codes |
| **Settings** | Fare config editor, app settings |
| **Activity** | Admin user management, activity log |

---

## 🎨 Design

- **Primary Color**: `#F97316` (orange — auto rickshaw theme 🛺)
- **Sidebar**: `#1A1A2E` (dark)
- **Background**: `#FAFAFA`
- **Typography**: System fonts (SF Pro / Roboto)
- **Map Markers**: Custom auto rickshaw icons

---

## 📝 Environment Variables

See `.env.example` files in each project folder:
- `backend/.env.example` — Database, Redis, JWT, Firebase, Google Maps, Razorpay
- `frontend/.env.example` — API URL, Firebase, Google Maps
- `mobile_frontend/.env.example` — API URL, WebSocket, Firebase, Google Maps, Razorpay

---

## 📄 License

This project is proprietary software. All rights reserved.

---

<p align="center">Built with 🛺 for India</p>
