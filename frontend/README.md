# WhatsApp SaaS — Frontend

A premium Next.js 15 multi-tenant WhatsApp SaaS frontend, inspired by the Green-API console design.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** (dark theme, Green-API aesthetic)
- **Framer Motion** (animations)
- **Zustand** (global state)
- **React Hook Form + Zod** (forms & validation)
- **Axios** (API calls with JWT interceptors)
- **Lucide React** (icons)

## Getting Started

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=WhatsApp SaaS
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx        # Login page
│   │   └── register/page.tsx     # Register page
│   ├── dashboard/
│   │   ├── layout.tsx            # Dashboard layout (sidebar + header)
│   │   ├── page.tsx              # Dashboard home (stats)
│   │   ├── instances/page.tsx    # Instance management
│   │   ├── chats/page.tsx        # Conversations
│   │   ├── api/page.tsx          # API keys
│   │   ├── balance/page.tsx      # Plans & billing
│   │   ├── purchases/page.tsx    # Invoice history
│   │   ├── integrations/page.tsx # Integrations
│   │   ├── proxy/page.tsx        # Proxy config
│   │   └── account/page.tsx      # User account & usage metrics
│   ├── admin/
│   │   ├── layout.tsx            # Admin layout
│   │   ├── users/page.tsx        # User management
│   │   ├── instances/page.tsx    # All instances
│   │   └── plans/page.tsx        # Plan management
│   ├── globals.css               # Global styles + Tailwind
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Redirect → /dashboard
├── components/
│   ├── Sidebar.tsx               # Main navigation sidebar
│   ├── AdminSidebar.tsx          # Admin sidebar
│   ├── Header.tsx                # Top header (language, user, notifications)
│   ├── InstanceCard.tsx          # WhatsApp instance card
│   ├── StatusBadge.tsx           # Status indicator badge
│   ├── QRScannerModal.tsx        # QR code scanner modal
│   └── CreateInstanceModal.tsx   # Instance creation modal
├── lib/
│   ├── api.ts                    # Axios instance + API service methods
│   ├── types.ts                  # TypeScript interfaces
│   └── utils.ts                  # Utility functions
├── store/
│   └── useStore.ts               # Zustand global store
├── middleware.ts                  # Auth route protection
└── .env.local.example            # Environment variables template
```

## Features

### User Dashboard
- **Home** — stats overview (instances, messages, plan)
- **Instances** — create, list, delete, restart WhatsApp instances; scan QR codes
- **Chats** — recent conversations (mock data + real-time ready)
- **API** — manage API keys with copy/show toggle; code examples
- **Balance** — subscription plans, upgrade UI
- **Purchases** — invoice history
- **Integrations** — webhooks, Zapier, REST API
- **Proxy** — proxy configuration per instance
- **Account** — profile, usage metrics (messages sent, instances), quota bars

### Admin Panel
- **Users** — view all users, plans, instance counts
- **Instances** — monitor all instances across all tenants
- **Plans** — manage subscription plans

### Design
- Dark theme: `#0f0f0f` background, `#22c55e` green accent
- 260px sidebar with green/black theme
- Framer Motion animations (hover, fade-in, stagger)
- Responsive: collapsible mobile sidebar
- "Payment is required" banner for expired instances
- Red `Expired` status badges

## Backend Integration

The frontend expects a REST API at `NEXT_PUBLIC_API_URL` with these endpoints:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/instances` | List user's instances |
| POST | `/instances` | Create instance |
| DELETE | `/instances/:id` | Delete instance |
| POST | `/instances/:id/restart` | Restart instance |
| GET | `/instances/:id/qr` | Get QR code |

JWT token is stored in `localStorage` and sent via `Authorization: Bearer <token>` header.

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```
