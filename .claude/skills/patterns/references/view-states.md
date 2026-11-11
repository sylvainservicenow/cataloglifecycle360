# View States

A view state is the rendering a container's primary content takes when it is **absent, in-flight, or unavailable**. This pattern governs view states for a view's **primary-content region**. It covers **empty** and **loading**. Container-level **error** is deferred pending more audit specimens (see [§ Boundaries](#boundaries)).

The body is structured as a **routing block** (read once to pick the state), followed by a per-state walk for each state. The cognitive path the pattern teaches an LLM consumer: **trigger → state → cause → user-need → action → shape**.

---

## Mental model — where view states fit

| Category                                    | Renders                                           | Rules live in                                  |
| ------------------------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| **Primary-content view states**             | Primary content absent, in-flight, or unavailable | This file                                      |
| Form-field validation                       | Field-level + form-level messages                 | `@patterns/references/error-and-validation.md` |
| System events ("just happened?")            | Toast and alert notifications                     | `@compositions/notification-spec.md`           |

The full-viewport case (e.g. app-bootstrap failure, unauthenticated entry) is rare; the day-to-day case is a content region inside an already-rendered app frame. Both share the centered-column anatomy, so the same rules apply regardless of the region's size or position.

---

## Scope

Use this pattern when **all** of the following hold:

- The state occupies a **primary-content region** — the whole viewport (rare: app-bootstrap failure, unauthenticated entry), a main content area, or a sidebar-style content region such as a list, detail, or assistant region. It is **larger than a card**: the centered-column anatomy below has room to sit without crowding.
- The primary content is **absent** (zero results) or **in-flight** (request not yet resolved) — the whole region, not a single field or element inside it.
- The response is what the user is here to see, not a peripheral surface.

If the state lives inside a Card, Section, or Modal/Popover, the anatomy and focus model differ — those are deferred to v1 (see [§ Boundaries](#boundaries)). If the state is a form field or chart-area fallback, route to the peer pattern in the Mental model table above.

---

## Routing — pick the state first

The single most important LLM-facing decision in this pattern. Route by **trigger** (what the async layer did) before any aesthetic decision.

```
What's the data state?

├─ Request is in-flight (not yet resolved)
│   → Loading        (§ Loading state)
│
├─ Request resolved, zero items returned
│   → Empty          (§ Empty state)
│
└─ Request failed
    → Error          (deferred — see § Boundaries)
```

### Loading vs empty — six discriminators

If routing feels ambiguous, the table below resolves it. Loading and empty are not stylistic siblings — they are produced by different async states and render through different primitives.

| Axis          | Loading                                                                | Empty                                                             |
| ------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Trigger**   | Request in-flight                                                      | Request resolved, zero items                                      |
| **Primitive** | `aiux-skeleton` placeholders shaped like content                       | Icon + heading + body + optional CTA                              |
| **ARIA**      | `role="status"` + `aria-label="Loading X"`; placeholders `aria-hidden` | `role="status"`; heading + body read directly; icon `aria-hidden` |
| **Lifecycle** | Transient — auto-replaces on resolution                                | Settled — persists until state changes                            |
| **CTA**       | Never                                                                  | Sometimes (cause-dependent — see § Empty state)                   |
| **Motion**    | Shimmer with `prefers-reduced-motion` guard                            | None                                                              |

Conflating these two states is the load-bearing anti-pattern — see [§ Anti-patterns](#anti-patterns).

---

## Empty state

### Cause check — three judgment questions

Before rendering, ask three questions about **why** the state is empty. Each answer informs copy and CTA. **Named sub-types are deferred to v1** — the v0 audit is too thin (one specimen per candidate bucket) to lock in a taxonomy. Judgment questions transfer to adjacent buckets a deeper audit may surface.

**Q1. Did the user apply filters that produced this result?**
If yes: copy acknowledges the filter ("No results match your filters"); CTA offers the undo path ("Clear filters"). **CTA is the default in this case.**

**Q2. Could this thing have data, and can the user create it?**
If creation is available: copy states the absence ("You don't have any X yet"); CTA points at creation ("Create your first X"). **CTA conditional on the creation path existing.**

**Q3. Does the user have access to this data?**
If no: copy states the restriction without blame ("Access to this is managed by your administrator"); names who can grant access. CTA only if a request-access path exists. **Usually no CTA.**

The CTA decision rule derives from these three questions, not from visual taste. Filter-caused empty defaults to a CTA; access-restricted usually has none.

### Anatomy

Document the structural shape **component-agnostically**. Apps may compose from primitives, or use an existing implementation such as `aiux-empty-state-content` from the `empty-state-content` package.

```
┌─ Centered column (flex flex-col gap-4 items-center max-w-sm) ─┐
│                                                                │
│            [icon | illustration slot]                          │
│                                                                │
│            Heading (text-text-primary)                         │
│            Body    (text-text-secondary)                       │
│                                                                │
│            [optional CTA button]                               │
└────────────────────────────────────────────────────────────────┘
```

| Element    | Classes                                               |
| ---------- | ----------------------------------------------------- |
| Container  | `flex flex-col gap-4 items-center max-w-sm w-full`    |
| Text block | `flex flex-col gap-2 items-center text-center w-full` |
| Heading    | `text-text-primary` (do not use `text-base-content`)  |
| Body       | `text-text-secondary`                                 |
| Icon       | `aiux-icon` size `lg`, `opacity-50`                   |
| CTA button | `aiux-btn aiux-btn-primary`                           |

---

## Loading state

Use the DaisyUI `aiux-skeleton` primitive. At this pattern's scope, content shape is generally known and skeletons mirror it — that's the right choice over a generic spinner. `<aiux-loader>` is the appropriate primitive at smaller scope — Section, component, button-busy state, or loading states with no known content shape — but those are **out of scope here, not banned**. DaisyUI's native Loading component (`aiux-loading`) is disallowed for new implementations (exception only for a tiny in-button spinner); `<aiux-loader>` is its dedicated replacement.

### Rules

- **Skeletons mirror the shape of incoming content.** Heading-shaped, paragraph-shaped, chart-shaped placeholders. Not generic blobs.
- **Wrapper carries `role="status"` + `aria-label`** describing what is loading (e.g. `aria-label="Loading dashboard"`). One announcement, not per-placeholder.
- **Decorative skeleton elements get `aria-hidden="true"`** so screen readers hear the wrapper label once, not the placeholder stack.
- **Shimmer animation respects `prefers-reduced-motion`.** Soften to a static placeholder or short linear fade. See `@motion/SKILL.md` for the reduced-motion variant guidance.
- **Fade-in when content arrives uses `linear` easing, `--duration-sm`.** Never a named curve on opacity. See `@motion/SKILL.md`.

### Sizing and composition

- **Loaders are sized proportional to their container.** A skeleton or spinner whose scale doesn't match its surrounding container creates visual tension. Don't mix large and medium loaders inside a smaller area.
- **Use consistent sizes for similar components and elements.** A list of repeated cards should show one skeleton size across all of them. Inconsistent sizes for similar elements confuse the loading hierarchy and user expectations about what's coming.
- **Prefer a single loader per view.** One loader focuses attention on the primary loading area. Multiple loaders within a single view cause unnecessary workflow disruption and give the impression that the experience is slow.
- **If multiple loaders are needed, consolidate.** Combine them into one loader over the larger encompassing area. The user should perceive one "wait" event, not several.

### When `<aiux-loader>` is correct (out of this pattern's scope)

`<aiux-loader>` is the right primitive — and `aiux-skeleton` would be the wrong primitive — when:

- The container is smaller than this pattern's scope: a Section, an individual component, or an in-button busy state.
- The async operation has no known content shape: a save submission, a search input while a query is being computed, component data hydration with unpredictable output.

These cases are out of this pattern's scope. They're noted here so an LLM doesn't mis-generalize "always use skeleton" beyond primary-content regions.

---

## Accessibility

See `@accessibility/SKILL.md` for generic a11y rules — a skill in the separate `@servicenow/agent-pack-aiux` pack. **View-states-specific applications**:

- **Empty wrapper**: `role="status"` (passive, polite).
- **Loading wrapper**: `role="status"` + `aria-label` naming what is loading.
- **State swap** (loading → content, loading → empty) **must not steal focus** unless the user just triggered the change. Default is no focus move; the status announcement is enough.
- **320px reflow**: the centered-column anatomy with `max-w-sm` and relative widths already satisfies WCAG 1.4.10 — no additional handling required.

---

## Internationalization

User-facing copy (heading, body, CTA) follows the i18n rules in `@internationalization/SKILL.md` — a skill in the separate `@servicenow/agent-pack-aiux` pack — wrapping, parameterized messages, locale handling.

**View-states-specific**: the centered-column anatomy uses logical-safe utilities (no inline directional margins), so RTL works automatically without additional handling.

---

## Anti-patterns

1. **Conflating loading with empty.** Rendering an empty anatomy while the request is still in-flight (or vice versa). Trigger is the discriminator, not the visual.
2. **CTA by vibe.** Picking whether to show a button on aesthetic grounds instead of the cause-check answer.
3. **Hardcoded English** in heading, body, or CTA copy.
4. **`<aiux-loader>` at primary-content-region scope when content shape is known.** Skeletons mirror shape; spinners do not. (`<aiux-loader>` is the right primitive at smaller scope — Section, component — but those are out of this pattern's scope, not anti-patterns there.)
5. **Skeleton placeholder elements missing `aria-hidden="true"`.** Screen reader announces each placeholder separately instead of the wrapper label. The wrapper itself carries `role="status"` + `aria-label` and must remain announced; `aria-hidden` goes on the decorative placeholder elements inside.
6. **Missing `prefers-reduced-motion` guard** for shimmer — see `@motion/SKILL.md`.
7. **`text-base-content` for heading or body.** Use `text-text-primary` / `text-text-secondary`.
8. **Auto-focusing the CTA on state swap** when the user did not trigger the change. Steals focus context.
9. **Access-restricted empty framed as user error.** "You can't view this" → "Access to this is managed by your administrator."
10. **Mixed-scale loaders in one area.** Large + medium skeletons (or differently-sized spinners) inside the same region create visual tension and break the loading hierarchy.
11. **Multiple simultaneous loaders in one view.** Disrupts the user's workflow and makes the experience feel slower than it is. Consolidate into a single loader over the larger encompassing area.

---

## Boundaries

Deferred for v0.x:

- **Container-level error state** — anatomy likely parallels empty; awaits audit specimens.
- **Card-scoped view states** — Cards are smaller and have their own header/footer constraints; the centered-column anatomy doesn't fit cleanly. Separate treatment when the audit lands.
- **Section-scoped view states** — Sections frequently nest under cards or lists; scope is variable and overlaps with Card and primary-content rules.
- **Modal / Popover-scoped view states** — different focus model (focus trap, dismissal), often paired with form content. Treated separately.
- **Navigation sidebar empty / loading** — Navigation is a different category (app-wide chrome, not primary content) and doesn't participate in the same anatomy.
- **Surfaces foundation cross-reference** — once that artifact lands, this pattern adds a section on how anatomy adapts to narrower Panes and smaller surfaces.

Peer patterns for related surfaces:

- Form-field empty / error → `@patterns/references/error-and-validation.md`
- Toast and system events → `@compositions/notification-spec.md`
