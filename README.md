# PhotoScout

> A web app helping UK landscape photographers discover locations, check weather conditions, and plan the perfect shoot.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

PhotoScout is a location planning tool designed specifically for landscape photographers in the UK. Select any location on an interactive map, and PhotoScout provides:

- **Sun & Golden Hour Calculations** ✅ - Precise sunrise, sunset, and golden hour times
- **Weather Forecasts** ✅ - Real-time weather conditions from Open-Meteo API
- **Photography Scores** ✅ - Smart scoring based on light quality, weather, and time of day
- **Nearby Photo Discovery** 🔮 - Find geotagged photos from Wikimedia Commons (planned)
- **Points of Interest** 🔮 - Locate parking, cafes, and amenities near your shoot location (planned)

Whether you're planning a sunrise shoot in the Lake District or scouting coastal locations in Cornwall, PhotoScout helps you make the most of the light.

## Current Status

**MVP Development - Phase 6 (Final Polish)** 🎨

- ✅ **Phase 1**: Project foundation with Next.js, TypeScript, and Tailwind CSS
- ✅ **Phase 2**: Local Supabase database with PostGIS for spatial queries
- ✅ **Phase 3**: Core map interface with interactive location selection
- ✅ **Phase 4**: Photography conditions and sun calculations
- ✅ **Phase 5**: Real-time weather integration with Open-Meteo API
- 🚧 **Phase 6**: Final polish, testing, and documentation (in progress)

All core MVP features are complete! See [PLAN.md](PLAN.md) for detailed roadmap and progress tracking.

## Key Features

### Core Features (MVP)
- 🗺️ Interactive map powered by MapLibre GL JS and OpenStreetMap
- 📍 Click-to-select locations with radius overlay
- 🌅 Golden hour and sun position calculations using SunCalc
- ⛅ Weather forecasts (Met Office DataPoint API)
- 📊 Photography score algorithm (light + weather conditions)
- 📱 Mobile-first responsive design

### Future Enhancements
- 🔐 User authentication and saved locations
- 📸 Wikimedia Commons photo discovery
- 🅿️ Overpass API integration for POIs (parking, cafes)
- 🔔 Weather alerts and notifications
- 👥 Community photo spots
- ☁️ Deployment to Vercel

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui (Radix UI primitives) |
| **Maps** | MapLibre GL JS, OpenStreetMap tiles |
| **Database** | Supabase (PostgreSQL + PostGIS) |
| **Authentication** | Supabase Auth |
| **APIs** | Open-Meteo (weather), Overpass (POI), Wikimedia Commons (photos) |
| **Sun Calculations** | SunCalc.js |
| **State Management** | Zustand |
| **Testing** | Vitest, React Testing Library, MSW (API mocking) |
| **Deployment** | Vercel (planned) |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop (for local Supabase)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/iwatts3519/photoscout.git
   cd photoscout
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your local Supabase credentials (obtained in next step).

4. **Start local Supabase**
   ```bash
   npx supabase start
   ```

   Note the `anon key` and `API URL` from the output and add them to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. **Apply database migrations**
   ```bash
   npx supabase db reset
   ```

6. **Generate TypeScript types from database**
   ```bash
   npx supabase gen types typescript --local > src/types/database.ts
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Development

### Available Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run typecheck    # TypeScript type checking (run after code changes)
npm run lint         # ESLint
npm run test         # Run Vitest tests
npm run test:watch   # Tests in watch mode
```

### Supabase Commands

```bash
npx supabase start   # Start local Supabase
npx supabase stop    # Stop local Supabase
npx supabase status  # Check Supabase status
npx supabase db reset  # Reset database with migrations
npx supabase gen types typescript --local > src/types/database.ts  # Regenerate types
```

### Validation Workflow

Before committing, always run:
```bash
npm run typecheck && npm run lint && npm run test
```

## Project Structure

```
photoscout/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── map/               # Map components (MapView, markers, overlays)
│   ├── weather/           # Weather display components
│   ├── locations/         # Location management components
│   ├── layout/            # Layout components (AppShell, Sidebar)
│   └── shared/            # Shared components
├── lib/
│   ├── supabase/          # Supabase client configurations
│   ├── api/               # External API clients (Met Office, etc.)
│   ├── queries/           # Database query functions
│   └── utils/             # Utility functions (sun-calc, photo-score)
├── src/
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand state stores
│   ├── types/             # TypeScript type definitions
│   ├── mocks/             # MSW mock handlers (for testing)
│   └── setupTests.ts      # Vitest setup
├── supabase/
│   ├── migrations/        # Database migration files
│   └── config.toml        # Supabase configuration
├── PLAN.md                # Detailed project roadmap
├── CLAUDE.md              # Development guidelines and patterns
└── README.md              # This file
```

## Code Style

- **TypeScript Strict Mode** - No `any` types allowed
- **Server Components First** - Use `'use client'` only when necessary
- **Named Exports** - All components use named exports
- **Mobile-First CSS** - Tailwind breakpoints: sm → md → lg
- **Conventional Commits** - Format: `feat:`, `fix:`, `docs:`, etc.

See [CLAUDE.md](CLAUDE.md) for comprehensive code style guidelines and development patterns.

## Database Schema

### Core Tables

- **profiles** - User profiles (extends Supabase auth.users)
- **locations** - Saved photography locations with PostGIS coordinates
- **weather_alerts** - User weather alert preferences

### Spatial Features

PostGIS enables efficient geospatial queries:
- Find locations within radius
- Calculate distances accurately using geography types
- Spatial indexing for fast lookups

## API Rate Limits

| API | Limit | Caching Strategy |
|-----|-------|------------------|
| Open-Meteo | No key required, unlimited non-commercial | Cache 30 minutes |
| Overpass | Be respectful | Cache 24 hours |
| Wikimedia Commons | Generous | Cache 1 hour |

## Contributing

This is currently a personal project in active development. Contributions, issues, and feature requests are welcome once the MVP is complete.

### Git Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and test: `npm run typecheck && npm run lint && npm run test`
3. Commit using conventional commits: `git commit -m "feat: add feature description"`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request

See [CLAUDE.md](CLAUDE.md) for detailed git workflow and best practices.

## License

MIT License - See [LICENSE](LICENSE) file for details

## Acknowledgments

- **OpenStreetMap** - Map tiles and data
- **MapLibre GL JS** - Open-source mapping library
- **Supabase** - Database and authentication platform
- **shadcn/ui** - Beautiful UI components
- **Open-Meteo** - Free weather API for non-commercial use
- **SunCalc** - Sun position calculations

## Links

- **Repository**: https://github.com/iwatts3519/photoscout
- **Documentation**: [CLAUDE.md](CLAUDE.md)
- **Roadmap**: [PLAN.md](PLAN.md)
- **Issues**: https://github.com/iwatts3519/photoscout/issues

---

**Built with ☕ for photographers who chase the light**
