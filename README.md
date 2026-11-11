# Catalog Intelligence 360

A ServiceNow Lux Lab (AIUX) application that turns the native service catalog into a **Living Catalog Universe**: an animated, explorable map of catalog items, categories and service offerings, built only from real ServiceNow records.

- **Scope:** `x_snc_catalogintel`
- **App URL basename:** `catalogintelligence360`
- **Landing page:** `/home`

## Architecture

- AIUX app (Lit components extending `AIUXElement`, Tailwind + DaisyUI) in `src/lux/`
  - `application.js`, `theme.js`: app shell and theme
  - `pages/`: routes (`home`, `explore`)
  - `components/cat-universe.js`: the Living Catalog Universe
  - `lib/catalog-data.js`: read-only catalog data layer and layout helpers
- Read-only access to native tables (`sc_cat_item`, `sc_category`, `sc_cat_item_category`, `item_option_new`, `sc_req_item`, `service_offering`, `cmdb_rel_ci`, ...). No custom tables in the first milestone.
- ServiceNow SDK (`now-sdk`) is the only deployment mechanism.

## Development environment

- Node >= 24.14.1 (`.nvmrc`), pnpm
- VS Code + Claude Code + ServiceNow Lux Lab extension
- `pnpm install`: installs dependencies and copies agent skills into `.claude/skills`
- `pnpm dev`: local development server
- `pnpm build` / `pnpm lint`: run both before deploying
- `pnpm run deploy`: deploy to the instance with the SDK (never `pnpm deploy`)

Authentication lives in the SDK credential store and in the local `.env` (git-ignored). Never commit either.

## Git strategy

- `main` is the primary branch
- A meaningful commit after each successful milestone
- No automatic deployment from GitHub; deployment is manual via the SDK

## Milestones

1. **Phase 0:** workspace, GitHub and catalog discovery (done)
2. **Home + Explore:** light-themed Living Catalog Universe with animated clusters, progressive disclosure and intelligence lenses (built; visual refinement in progress)
3. **Intelligence lenses:** data quality, request activity, CSDM alignment
4. **AI assistance:** Otto and Now Assist driven catalog improvement suggestions
