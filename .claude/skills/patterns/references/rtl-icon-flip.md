# RTL Icon Flip

When and how to flip directional icons in right-to-left locales.

---

## Mental model

- When `dir="rtl"` is on the page (set per locale upstream), per-icon decide only **whether** to flip.
- The decision turns on **intent** — does the icon's direction mean something _semantic_ (next / back), _literal_ (left / right as a spatial reference), or nothing at all?
- Only semantic-direction icons flip. Literally-named icons (`arrow-left`, `chevron-down`) already encode the direction they should face on either axis — never flip them.

---

## Decide: triage by intent

For each directional-looking icon, ask **what does its direction mean** before reaching for any flip mechanism.

| Intent              | Question                                                                                                | Action                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Semantic**        | Does it mean "next / back / forward / reply" in reading direction?                                      | Flip in RTL                               |
| **Literal**         | Does it mean a physical direction (e.g., `arrow-left` for "move column left", a visual axis indicator)? | Don't flip — the icon name encodes intent |
| **Non-directional** | The icon has no directional meaning (search, clock, gear, check).                                       | Don't flip                                |

### Category examples

| Category                                                   | Intent          | Flip? |
| ---------------------------------------------------------- | --------------- | ----- |
| Navigation chevrons used as "next / back"                  | Semantic        | YES   |
| Undo / redo, reply, send, indent / outdent                 | Semantic        | YES   |
| Directional media transport (`next-track`, `fast-forward`) | Semantic        | YES   |
| `arrow-left` / `arrow-right` used for spatial direction    | Literal         | NO    |
| Sort-ascending / sort-descending indicator                 | Literal         | NO    |
| Search, clock, calendar, gear, user, avatar                | Non-directional | NO    |
| Symmetric media transport (play, pause, stop)              | Non-directional | NO    |
| Status (check, warning, error, info)                       | Non-directional | NO    |
| Brand / logo, glyphs containing text or numerals           | Non-directional | NO    |
| Symmetric shapes (circle, dot)                             | N/A             | N/A   |

**Disambiguation tip:** if you find yourself wanting to swap `arrow-left` → `arrow-right` based on locale, the intent is semantic — pick a semantically-named icon (`arrow-back` / `arrow-forward`) and flip that. Don't swap literal-direction names.

---

## How to flip

- Use the `icon()` directive from `@servicenow/aiux-directive-icon` for any directional icon.
- Pass `class: 'rtl:-scale-x-100'` to flip in RTL.
- Tailwind's `rtl:` variant resolves automatically from the nearest `dir` attribute — no JavaScript check needed.

Do **not** use the deprecated `<aiux-icon>` component — it is superseded by the `icon()` directive; migrate before adding flip behavior.

---

## Anti-patterns

- Don't flip a literally-named icon (`arrow-left`, `chevron-down`). Its name is the intent — reach for a semantically-named icon if the direction should follow the locale.
- Don't read `dir` in JavaScript to swap icon names. CSS flip is the single source of truth and stays in sync with the document direction automatically.
- Don't flip every icon in an RTL container blindly. Intent is decided per icon.
- Don't flip icons containing text or numerals — mirroring makes them unreadable.
- Don't combine the flip with `rotate-180`. Results vary by the source asset's rotation.

---

## Edge cases

| Case                                                                                      | Handling                                                                     |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Icon inside an explicit `dir="ltr"` island on an RTL page (code blocks, English numerals) | Tailwind `rtl:` resolves from the nearest `dir` — no special handling needed |
| Icon-only button                                                                          | Flip the icon; let logical CSS handle the button geometry                    |
| Inline directional glyphs in text (`→`, `←`)                                              | Same mechanism — apply `rtl:-scale-x-100` to the wrapping span               |

---

## Related

- `@localization` — broader RTL layout (logical Tailwind classes `ms-*` / `me-*`, logical CSS properties)
- `@internationalization` — string translation

Both are skills in the separate `@servicenow/agent-pack-aiux` pack.
