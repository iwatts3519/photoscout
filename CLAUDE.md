# PhotoScout - Photography Location Planning App

## Overview
Web app helping UK landscape photographers discover locations, check weather conditions, and plan shoots. Users select map locations, search for nearby geotagged photos, receive weather alerts, and find parking/amenities.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Maps**: MapLibre GL JS + OpenStreetMap tiles
- **Database**: Supabase (PostgreSQL + PostGIS)
- **Auth**: Supabase Auth
- **APIs**: Open-Meteo (weather), Overpass (POI), Wikimedia Commons (photos)
- **Sun/Moon**: SunCalc.js (client-side)
- **Deployment**: Vercel (Hobby plan)

## Commands
```bash
npm run dev          # Dev server at localhost:3000
npm run build        # Production build
npm run typecheck    # TypeScript check - RUN AFTER CODE CHANGES
npm run lint         # ESLint
npm run test         # Vitest tests
npm run test:watch   # Tests in watch mode

# Supabase
npx supabase start   # Local Supabase
npx supabase db reset                                    # Reset with migrations
npx supabase gen types typescript --local > src/types/database.ts  # Gen types

# Git
git add .                              # Stage all changes
git commit -m "feat: descriptive message"  # Commit with conventional commit message
git push origin main                   # Push to GitHub
git pull origin main                   # Pull latest changes
```

## Planning
When you are adding new features to PLAN.md, add each feature as a new phase, numbered, for example Phase 1, Phase 2 etc. Do not add new features as Phase 1.1, 1.2 etc. Every new feature should have its own phase 

## Git Workflow

### Repository
- **Remote**: https://github.com/iwatts3519/photoscout.git
- **Branch**: `main` (default)
- **Strategy**: Commit at the end of each phase in PLAN.md

### Commit Guidelines
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature (e.g., "feat: add MapView component")
- `fix:` - Bug fix (e.g., "fix: correct sun calculation timezone")
- `refactor:` - Code refactoring (e.g., "refactor: extract photo scoring logic")
- `docs:` - Documentation (e.g., "docs: update PLAN.md phase 3")
- `test:` - Adding tests (e.g., "test: add sun calculation tests")
- `chore:` - Maintenance (e.g., "chore: update dependencies")

### End of Phase Checklist
At the end of each phase in PLAN.md:

1. **Validate** - Ensure all validation steps pass:
   ```bash
   npm run typecheck && npm run lint && npm run test
   ```

2. **Stage Changes** - Review and stage files:
   ```bash
   git status          # Review changes
   git add .           # Stage all files
   ```

3. **Commit** - Use descriptive conventional commit message:
   ```bash
   git commit -m "feat: complete phase X - [brief description]"
   ```
   Example: `git commit -m "feat: complete phase 2 - database setup with PostGIS"`

4. **Push to GitHub**:
   ```bash
   git push origin main
   ```

### Best Practices
- **Atomic commits** - Each commit should represent one logical change
- **Descriptive messages** - Explain what changed and why
- **Test before pushing** - Always run validation commands first
- **Commit phase completion** - Push after each phase in PLAN.md is complete
- **Keep .env files private** - Never commit `.env.local` or API keys
- **Review changes** - Use `git diff` before committing

### Common Git Commands
```bash
git status                    # Check current state
git diff                      # See unstaged changes
git diff --staged             # See staged changes
git log --oneline             # View commit history
git remote -v                 # Verify remote URL
```

## Code Style
- Strict TypeScript - no `any` types
- Server Components by default, `'use client'` only when needed
- Named exports for components
- Zod schemas for all validation
- Mobile-first Tailwind (sm → md → lg)

### File Naming
- Components: `PascalCase.tsx`
- Utilities/hooks: `camelCase.ts`
- Co-locate tests: `Component.test.tsx`

### Import Order
1. React/Next.js
2. Third-party libs
3. Internal (@/components, @/lib)
4. Relative imports
5. Type imports (`import type`)

## Project Structure
```
src/
├── app/                 # Next.js App Router
├── components/
│   ├── ui/             # shadcn/ui
│   ├── map/            # MapView, markers, overlays
│   ├── weather/        # Weather display
│   └── locations/      # Location management
├── lib/
│   ├── supabase/       # Supabase clients
│   ├── api/            # External API clients
│   └── utils/          # Helpers (sun-calc, photo-score)
├── hooks/              # Custom hooks
├── stores/             # Zustand stores
└── types/              # TypeScript types
```

## API Rate Limits
| API | Limit | Strategy |
|-----|-------|----------|
| Open-Meteo | No key required, unlimited non-commercial | Cache 30min |
| Overpass | Be respectful | Cache 24hr |
| Wikimedia | Generous | Cache 1hr |

## Key Patterns

### PostGIS Queries
```sql
-- Find within radius (use geography for accuracy)
SELECT * FROM locations
WHERE ST_DWithin(coordinates, ST_MakePoint($lng, $lat)::geography, $meters);
```

### SunCalc Usage
```typescript
import SunCalc from 'suncalc';
const times = SunCalc.getTimes(new Date(), lat, lng);
// times.sunrise, times.sunset, times.goldenHour, times.goldenHourEnd
```

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: Open-Meteo requires no API key for non-commercial use.

## Important Reminders
1. **ALWAYS typecheck** after code changes
2. **Cache API responses** - stay within rate limits
3. **Use PostGIS functions** for geo queries, not JS calculations
4. **MapLibre needs `'use client'`** - uses browser APIs
5. **Mobile-first** - photographers check conditions on phones
6. **Attribution required** for Wikimedia photos and OpenStreetMap

## Common Gotchas
- Open-Meteo returns temps in Celsius, wind in km/h (convert to mph: `km/h * 0.621371`)
- Open-Meteo uses WMO weather codes (0-99) - map to descriptive text
- SunCalc azimuths are radians - convert: `(azimuth * 180 / Math.PI) + 180`
- Supabase PostGIS needs `::geography` casting for distance accuracy
- Overpass API can be slow - use timeouts and loading states
