# 4Lebanon - Arabic News Platform

A production-ready Arabic (RTL) Lebanese news website built with Next.js 16.1.1, Supabase, and Tailwind CSS.

## Features

### Public Site

- 🌐 Full Arabic RTL support
- 📰 Homepage with breaking/featured articles
- 🔍 Full-text search with filters (region, country, section)
- 📄 Article pages with reading time, sources, related articles
- ✍️ Author profile pages
- 📡 RSS feed and sitemap for SEO

### Admin Panel

- 🔐 Secure authentication for 3 authors
- 📝 Create, edit, delete own articles (RLS enforced)
- 📤 Image upload to Supabase Storage
- 📅 Scheduled publishing (no cron needed)
- 🏷️ Article categorization (sections, regions, topics)

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router, Turbopack)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **Database**: Supabase PostgreSQL with RLS
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Hosting**: Vercel

## Quick Start

### Prerequisites

- Node.js 20.9.0+
- npm
- Supabase account
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd app

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REVALIDATE_SECRET=your_random_secret
```

## Database Setup

Run migrations in Supabase SQL Editor:

1. `supabase/migrations/001_schema.sql` - Tables
2. `supabase/migrations/002_indexes.sql` - Performance indexes
3. `supabase/migrations/003_rls.sql` - Row Level Security
4. `supabase/migrations/004_seed.sql` - Initial data
5. `supabase/migrations/005_functions.sql` - Helper functions

## Project Structure

```
app/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public routes (implicit)
│   ├── admin/             # Admin routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout (RTL)
├── components/            # React components
│   ├── layout/           # Header, nav, footer
│   ├── article/          # Article cards, grids
│   ├── sidebar/          # Most read, writers
│   └── admin/            # Admin components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase clients
│   ├── utils.ts          # Helper functions
│   └── constants.ts      # Site configuration
├── supabase/migrations/  # SQL migrations
├── docs/                 # Documentation
└── types/                # TypeScript types
```

## Available Scripts

```bash
npm run dev        # Start development server with Turbopack
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
npm run typecheck  # Run TypeScript check
npm run format     # Format with Prettier
```

## Documentation

- [Deployment Guide](docs/README_DEPLOY.md)
- [Performance Strategy](docs/PERFORMANCE.md)
- [CI/CD Pipeline](docs/CICD.md)
- [Stack & Costs](docs/STACK_AND_COST.md)

## Design

Inspired by [Lebanon Debate](https://lebanondebate.com) with a red/black/white palette:

- Primary: `#830005` (Deep red)
- Background: `#ffffff` (White)
- Text: `#000000` (Black)
- Accent: `#f5c518` (Gold)

## License

Private - All rights reserved.
