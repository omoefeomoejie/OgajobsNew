# OgaJobs — Nigerian Artisan Services Marketplace

> Connecting skilled artisans with clients across Nigeria through a modern, multilingual platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

## What This Is

OgaJobs is a marketplace for Nigerian artisans — plumbers, electricians, carpenters, and other skilled tradespeople — to connect with clients who need their services. The platform handles booking, escrow payment, and dispute resolution.

**Current status**: Active development. Core booking loop is functional end-to-end. Real artisan onboarding underway in Abuja.

## Core Features (Working)

- **Booking flow**: Client submits request → artisan accepts → client pays via Paystack → escrow held → job completed → payment released
- **Role-based dashboards**: Separate views for clients, artisans, and admins
- **Multilingual UI**: English, Hausa, Igbo, Yoruba, Pidgin English
- **Admin portal**: User verification queue, booking management, dispute resolution
- **Paystack integration**: Payment processing and webhook-based escrow
- **Real-time messaging**: Conversations between clients and artisans

## Technology Stack

### Frontend
- **React 18** + **TypeScript** — UI framework
- **Vite** — Build tool and dev server
- **Tailwind CSS** + **shadcn/ui** — Styling and components
- **React Router** — Client-side routing
- **i18next** — Internationalization (5 Nigerian languages)

### Backend
- **Supabase** — Database (PostgreSQL), auth, storage, real-time
- **Edge Functions** — Serverless API (Deno runtime)
- **Row Level Security** — Database-level access control
- **Paystack** — Payment gateway (Nigerian market)

### Mobile
- **Capacitor** — iOS/Android wrapper (in progress)

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase CLI

### Development Setup

```bash
git clone <repo-url>
cd OgajobsNew
npm install

# Set environment variables
cp .env.example .env.local
# Add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_PAYSTACK_PUBLIC_KEY

npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
VITE_SENTRY_DSN=your_sentry_dsn   # optional
```

## Project Structure

```
src/
  components/     # Reusable UI components
    admin/        # Admin portal components
    dashboard/    # Role-based dashboard panels
    disputes/     # Dispute resolution UI
    home/         # Landing page sections
  contexts/       # React context providers (Auth)
  hooks/          # Custom hooks
  lib/            # Utilities (security, nigeria data, logger)
  pages/          # Route-level page components
  integrations/   # Supabase client
supabase/
  functions/      # Edge functions (payments, webhooks, etc.)
  migrations/     # Database migrations
```

## Roadmap

### Near-term
- [ ] Neighbourhood-level location filtering (Lekki, VI, Surulere)
- [ ] Artisan profile pages with portfolio
- [ ] SMS notifications (Termii)
- [ ] iOS/Android builds via Capacitor

### Medium-term
- [ ] POS agent network for offline bookings
- [ ] Artisan skill verification with document upload
- [ ] Client review and rating system
- [ ] Analytics dashboard for artisans

## Testing

```bash
npm test              # Run test suite
npm run test:watch    # Watch mode
npm run build         # Production build (zero TS errors required)
```

The test suite covers auth flows and booking form behaviour. E2E tests for the full booking loop are planned.

## Security

- Row Level Security on all Supabase tables
- JWT authentication via Supabase Auth
- Paystack webhook signature verification (HMAC-SHA512)
- Input sanitisation and XSS prevention
- Content Security Policy (no unsafe-inline for scripts)

## Contributing

This project is under active development. Issues and PRs welcome.

---

Built for Nigeria's artisan community.
