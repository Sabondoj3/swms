# SWMS — Smart Waste Management System

**Cleaner Communities Through Smart Technology.**

Universities and communities report, monitor, collect, and analyze waste: QR-coded bins, photo reports, collector workflow, admin verification, live maps (OpenStreetMap/Leaflet), analytics, education, gamification.

## Features
- Public/student: register/login, dashboard, step-by-step waste reporting (QR / map / geolocation + photo + category), my reports + timeline, nearby bins, education, notifications, points & badges.
- Collector (mobile-first): today's jobs, accept → on the way → collected → completed, completion photo + notes + kg, navigate via OSM.
- Admin: KPIs, recent activity, report verification, priority override, assign/reassign collectors (workload shown), collection points + QR generate/download/print/regenerate, users/roles, analytics charts (month/status/category/top points/collectors), CSV export, education CRUD, audit logs (Super Admin).
- System: NextAuth credentials + RBAC, Prisma/Postgres, local storage abstraction (S3-ready), `WasteClassificationService` abstraction (manual MVP, no fake AI), in-app notifications (email/SMS/WhatsApp-ready), PWA manifest + SW, Docker.

## Tech
Next.js 14 (App Router) • TypeScript • React 18 • Tailwind 3 • lucide-react • Prisma 5 • PostgreSQL 16 • NextAuth 4 (JWT) • bcryptjs • Zod • Leaflet/react-leaflet (OSM) • qrcode • recharts • Vitest.

## Prerequisites
- Node 20+ • npm • PostgreSQL 16 (or Docker) • Git

## Quick start
```bash
npm install
cp .env.example .env   # then edit DATABASE_URL, NEXTAUTH_SECRET
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev            # http://localhost:3000
```

### Docker (Postgres only — easiest)
```bash
docker compose up -d db
# set DATABASE_URL=postgresql://swms:swms_dev_password@localhost:5432/swms?schema=public in .env
npx prisma migrate dev
npm run seed
npm run dev
```

### Full Docker
```bash
docker compose up --build
```

## Env
See `.env.example`. Required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`. Optional: `STORAGE_PROVIDER`, `UPLOAD_DIR`, `MAX_UPLOAD_MB`, `AI_CLASSIFY_API_*`, `NEXT_PUBLIC_MAP_*`.

## Demo accounts (seed)
- Super Admin: `admin@swms.local` / `Admin123!`
- Admin: `ops@swms.local` / `Admin123!`
- Collector: `collector@swms.local` / `Collector123!` (+ collector2/3 same password)
- Student: `student@swms.local` / `Student123!` (+ user1..6 same password)

Seed creates: 1 org (Greenfield University — generic, add more orgs for cities/NGOs), 10 points (`RGU-CAMPUS-BIN-001..010`), 20+ reports, notifications, categories, badges, 5 education posts.

## Scripts
- `npm run dev` — dev server
- `npm run build` — `prisma generate && next build`
- `npm start` — prod server
- `npm run seed` — seed demo data (`tsx prisma/seed.ts`)
- `npm test` — Vitest (`tests/core.test.ts`)
- `npx prisma format|validate|migrate dev|studio`

## Folder structure
```
app/ (routes + api/*) • components/ui,layout,map,reports • lib/ (auth,prisma,validations,storage,qr,notifications,classification,gamification,audit,rate-limit,constants) • prisma/schema.prisma,seed.ts • public/ (manifest, sw.js, uploads/) • tests/
```

## Workflow
Scan QR (`/report?collectionPoint=CODE`) → photo → category/problem → submit (`SWMS-YYYY-000001`) → admin verifies → assigns → collector accepts → on the way → collected (+photo) → completed → user notified → analytics.

Statuses: `SUBMITTED → UNDER_REVIEW → VERIFIED → ASSIGNED → ACCEPTED → ON_THE_WAY → COLLECTED → COMPLETED` (+ `REJECTED`, `CANCELLED`). Timeline UI included.

## Security
bcrypt-12, Zod server validation, RBAC (middleware + API guards), protected routes, image MIME/size checks, rate-limit on register, audit logs, secure cookies (NextAuth JWT), no secrets in code.

## Troubleshooting
- `P1001 can't reach DB` → start Postgres (`docker compose up -d db`), check `DATABASE_URL`.
- `NEXTAUTH_SECRET missing` → set 32+ char random in `.env`.
- Leaflet SSR error → map is `dynamic(..., {ssr:false})` — don't import server-side.
- Uploads 404 → `public/uploads/.gitkeep` exists; set `UPLOAD_DIR`.
- Build prerender DB error → pages are `force-dynamic`; ensure DB reachable for `seed` but not required for `build`.

## Future (architected, not in MVP)
IoT fill sensors, vehicle GPS, AI image classification (plug `AI_CLASSIFY_API_URL/KEY`), route optimization, push/WhatsApp/SMS, multi-org/city, carbon reports, native apps, PDF export.
