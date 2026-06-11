# Changelog

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [SemVer](https://semver.org/).

## [Unreleased]

---

## [1.2.3] - 2026-06-11

### Added
- `seed:images` npm script — assigns Unsplash photos to portfolios by property type; idempotent, safe to run on any environment

---

## [1.2.2] - 2026-06-11

### Performance
- Eliminated render-blocking Google Fonts and Material Symbols imports by switching to async `preload` pattern with `onload` swap
- Added `display=swap` to Material Symbols to prevent FOIT (Flash of Invisible Text)
- Narrowed Material Symbols variable axis ranges to reduce font file size significantly
- Removed duplicate `@import` rules from `main.css` that were causing double fetches

---

## [1.2.1] - 2026-06-11

### Fixed
- Resolved 12 high-severity npm audit findings across backend and frontend dependencies without introducing breaking changes

---

## [1.2.0] - 2026-06-11

### Added
- `seed-demo` script to load demo data into an existing office on any environment (production-safe, skips if data already present)

### Fixed
- Replaced 18 dead Unsplash image IDs in the seed pool with verified, working photo IDs
- Repaired stale image assignments on portfolios that referenced broken URLs

---

## [1.1.0] - 2026-06-11

### Fixed
- Resolved critical-severity npm audit findings (step 1)
- Resolved high-severity API audit findings (step 2)

### Changed
- Aligned CLAUDE.md docs and `DemoReadOnlyGuard` documentation with actual runtime behavior (step 3)
- Deduplicated session handling, dashboard counts, and matching logic (step 4)
- Removed dead code across views; hardened error handling in portfolio and demand views (step 5)

### Build
- Docker: dist directory now persisted across container restarts, preventing cold-start failures after `npm run build`

---

## [1.0.0] - 2026-06-09

Initial stable release of EstateDesk — an internal portfolio and demand management tool for Turkish real estate offices.

### Added

**Core matching engine**
- Weighted buyer-to-portfolio matching: hard DB filter + in-memory scoring (budget, rooms, area, features, location)
- Haversine-based coordinate scoring with 30 km radius and decay curve; 375 district coordinates (Nominatim)
- Dual-panel demand detail view: live scored match cards with 300 ms debounce
- Demand-portfolio pin/save table (`DemandMatch`)

**Portfolio**
- Image gallery with drag-and-drop upload; backend converts to WebP via sharp (quality 82)
- Uploads served from bind-mounted `./uploads` directory via nginx static location
- Soft delete, office-scoped filtering

**Demand**
- Multi-location demand support (buyer can specify multiple target districts)
- Pagination on demand list, best-match portfolio preview card, color-coded search age
- Demand status management (ACTIVE / PASSIVE / CLOSED)

**Office & multi-tenancy**
- Multi-tenant data model: every Portfolio and Demand is isolated by `officeId`
- Shareable invite link (multi-use) + per-email invite (single-use)
- Invite acceptance flow: preview → register/login → join office → success animation
- Member removal UI in OfficeView
- Office screen redesign: stats panel, CSV export, role management

**Dashboard & Defter**
- Defter module: pending demand rows with inline portfolio match modal
- Recently Added portfolios section
- Summary stats card

**Onboarding & auth**
- Complete onboarding redesign covering 5 user scenarios (new office, join via link, join via email, solo, returning)
- Specific login error messages (wrong password vs. unknown email)
- JWT 12-hour tokens; `ed_token` localStorage key

**Landing page & demo**
- SaaS landing page
- Read-only interactive demo at `/demo` — ephemeral session, no login required; `DemoReadOnlyGuard` blocks all writes

**Mobile**
- Full mobile layout across all views
- Sliding bottom-nav with `+` modal sheet (bottom sheet on mobile)

**Global search**
- Full-text search across portfolios and demands using `unaccent` + LIKE raw SQL

**Infrastructure**
- Tailwind CSS integration with custom design token scale (Inter font, sage primary color, 8 px spacing unit)
- nginx reverse proxy config; backend port bound to localhost for Plesk compatibility
- `UPLOADS_DIR` env override for flexible deployment
- Docker Compose production config (`docker-compose.prod.yml`) with `prisma migrate deploy` on startup

### Fixed
- `@nestjs/serve-static` pinned to v4 for NestJS 10 peer dependency compatibility
- DB healthcheck fixed with in-container env expansion
- `dist/main.js` output path corrected via `tsconfig.build.json`
- `JwtModule` config in `OfficeModule`
- Router: invite acceptance routes accessible without an existing office
