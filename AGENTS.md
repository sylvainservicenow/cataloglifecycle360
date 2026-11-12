# AGENTS.md

Guidance for AI coding agents working in **Catalog Lifecycle 360 (scope `x_snc_catlife360`, repository `sylvainservicenow/cataloglifecycle360`)**.

## Start Here

Use `AGENTS.md` as the canonical guidance file for coding agents such as Claude Code, Gemini CLI, Codex, Cascade, and other repository-aware assistants. Tool-specific files such as `CLAUDE.md` and `GEMINI.md` should point back here instead of duplicating project rules.

## Mandatory UI Edit Checklist

For any request that involves building or updating UI:

1. Invoke the `ui-discovery` skill first — before writing code or making a plan.
2. Evaluate reusable components and instance widgets together. If a candidate exists, use the best match and proceed without asking for confirmation.

Use the ServiceNow AIUX skills before changing app code:

- `ui-discovery` — see Mandatory UI Edit Checklist above
- `aiux:aiux-build` for pages, routes, layouts, widgets, server scripts, `AIUXElement` lifecycle/decorators/loaders/context patterns, and deploy pipeline work
- `accessibility:accessibility` for accessibility audits and fixes

The ServiceNow agent packs are declared in `package.json` dev dependencies, so they install with the project. A `postinstall` script copies the packs' skills from `node_modules/@servicenow/agent-pack-*` into `.claude/skills`, then symlinks `.claude/skills` into `.agents/skills` so any agent can read them — automatically on every `pnpm install`, no manual step, and it works for any agent rather than relying on a Claude-specific hook. Run `pnpm agent:skills` to force a re-copy (e.g. after editing a skill, or if you installed with `--ignore-scripts`).

Keep `.claude/skills/` and the `.agents/skills` link out of `.gitignore`: some coding agents block reads of Git-ignored files, including skill references. Keep dependencies, caches, secrets, and build outputs ignored; do not enable blanket access to Git-ignored files just to read skills. Skill copies remain excluded from ESLint. Review changes after `pnpm install` or `pnpm agent:skills`, which refresh the copies and can overwrite local edits.

## Project Rules

- Components extend `AIUXElement` from `@servicenow/aiux/aiux-components-core`, never `LitElement`
- Guard browser globals with `isServer` from `lit`
- Use Tailwind + DaisyUI for styling; no `--now-*` CSS tokens
- `aiux.json#basename` defines the app URL. If a legacy `package.json#aiux.basename` is present, keep it aligned.
- Run `pnpm build` and `pnpm lint` before deploy

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm run deploy
```

Use `pnpm run deploy`, not `pnpm deploy`: pnpm's built-in workspace deployment command shadows the package script.

## App Shell Defaults

- `application.js` uses the shared `aiux-nav-layout` with the unified sidebar and user menu (`unifiedExperience: true`). Reuse the shell rather than copying Core UI components.
- Other nav features (global Search/Browse menus, notifications, session controls, theme toggle, density picker) are on by default, so `application.js` doesn't list them. Keep the app-owned Home and Incidents items alongside the shared menus.
- To turn a default feature off, add it to `features` in `application.js` as `false` (for example `notifications: false`). Platform permissions still govern privileged actions; menu visibility does not grant roles. Colors and shape are configured separately in `theme.js`.

## Verification and Generated Files

- SDK installation success does not verify runtime access or rendering. Check authenticated SSR responses and browser behavior; an unauthenticated HTTP 302 only confirms an authentication redirect.
- The starter Home and Incidents pages have no explicit page ACL decorators. Review intended page access before deployment; do not disable ACL checks to fix routing problems.
- Build output, `.aiux-runtime/`, and `<srcDir>/pages/.widget-sandbox*/` are generated. `<srcDir>` is the value of `srcDir` in this app's `aiux.json` (scaffolded as `src/lux`). Git and ESLint exclude the runtime cache and sandbox directories; keep authored pages and widgets under all existing lint rules.

## Optional Local Karuna Checkout

For framework development with a configured Karuna checkout, the full launcher can serve this app from local source and Core UI from the instance. From this app directory, replace `/path/to/karuna` with the checkout path:

```bash
AIUX_REPO_ROOT=/path/to/karuna AIUX_DEV_EXPERIENCE_FALLBACK=true node /path/to/karuna/aiux/cli/index.js dev --apps .
```

- The fallback flag enables instance-backed pages when no local page matches. Core UI has no local page registry, so it needs this lookup in development mode.
- The full launcher starts both services behind one proxy. Do not run the Core UI-only launcher alongside it; both claim the proxy port.
- Open the app under `/aiux/cataloglifecycle360/overview` and Core UI under `/aiux/ui/home` on the configured proxy origin. The SDK's instance deployment port is not necessarily the browser-facing AIUX port.
- `serve` selects instance-backed production mode and enforces the experience-approval list. An unapproved experience returns “Experience not available” before page ACL evaluation. Use normal development mode for local work or follow the production approval process; do not change ACLs or approval rules as a workaround.
