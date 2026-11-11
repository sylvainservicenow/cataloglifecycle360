# Error and Validation — Cross-Cutting Pattern

Two independent display patterns for validation feedback. They share an upstream pipeline but diverge at the display layer. A third pattern (page-level notifications) is out of scope — see `@compositions/notification-spec.md`.

> **Accessibility wiring** (ARIA association, `aria-invalid`, `aria-describedby`, role mapping, validation timing, focus on first invalid field, the complete form validation cycle) is owned by the accessibility skill — see `@accessibility`, a skill in the separate `@servicenow/agent-pack-aiux` pack. This file documents Horizon's visual mapping and design-system specifics only.

---

## Two Display Patterns

| Pattern                | Where                             | What It Shows                                                        | Rendered By                   |
| ---------------------- | --------------------------------- | -------------------------------------------------------------------- | ----------------------------- |
| **Inline Validation**  | Beneath each form control         | Field-specific errors, warnings, info, suggestions                   | `renderFormFieldMessages()`   |
| **Form-Level Banners** | Above the field grid, top of form | Aggregated mandatory errors, cross-field errors, submission failures | `<aiux-record-form-messages>` |

### Decision guide

| If the message is about…                           | It belongs to…                  |
| -------------------------------------------------- | ------------------------------- |
| A specific field's value being wrong               | **Inline Validation**           |
| The form as a whole failing submission             | **Form-Level Banner**           |
| A system event, operation result, or status change | **Notification** (out of scope) |

The three message systems operate independently — there is no central orchestrator. A field validation failure shows an inline error only. It does NOT automatically create a form-level banner.

---

## Shared Validation Pipeline

Both patterns flow through four stages:

```
Constraint  →  ValidationResult  →  ControlMessage[]  →  Display Pattern
(required,     { valid, message }   { status, icon,      ├─ Inline (field-level)
 min, max,                           content }           └─ Banner (form-level)
 pattern)
```

All validators treat empty values as valid. Use the `required` attribute for mandatory fields — do not conflate absence with invalidity.

---

## Message Status Mapping

### Inline validation (field-level)

| `status`     | Alert Class                          | Icon                   | ARIA Role       |
| ------------ | ------------------------------------- | ---------------------- | --------------- |
| `critical`   | `aiux-alert-soft aiux-alert-error`   | `hexagon-exclamation`  | `role="alert"`  |
| `warning`    | `aiux-alert-soft aiux-alert-warning` | `triangle-exclamation` | `role="alert"`  |
| `positive`   | `aiux-alert-soft aiux-alert-success` | `circle-check`         | `role="status"` |
| `info`       | `aiux-alert-soft aiux-alert-info`    | `circle-info`          | `role="status"` |
| `suggestion` | `aiux-alert-soft`                    | `ai-sparkle`           | `role="status"` |

### Form-level banners

| Type              | Alert Class          | Icon                   | Priority                |
| ----------------- | --------------------- | ---------------------- | ----------------------- |
| `MANDATORY_ERROR` | `aiux-alert-error`   | `circle-exclamation`   | Highest (sorted to top) |
| `FIELD_ERROR`     | `aiux-alert-error`   | `circle-exclamation`   | High                    |
| `ERROR`           | `aiux-alert-error`   | `circle-exclamation`   | High                    |
| `WARNING`         | `aiux-alert-warning` | `triangle-exclamation` | Medium                  |
| `INFO`            | `aiux-alert-info`    | `circle-info`          | Low                     |
| `SUCCESS`         | `aiux-alert-success` | `circle-check`         | Low                     |
| `SUGGESTION`      | `aiux-alert-success` | `ai-sparkle-fill`      | Low                     |

---

## Accessibility wiring

ARIA association (`aria-invalid`, `aria-describedby`, `aria-required`), role mapping (`alert` vs `status`), focus on first invalid field, and the complete form validation cycle are documented in `@accessibility`.

---

## DaisyUI Error Classes

| Control Type | Error Class            |
| ------------ | ----------------------- |
| Input        | `aiux-input-error`    |
| Textarea     | `aiux-textarea-error` |
| Select       | `aiux-select-error`   |
| Checkbox     | `aiux-checkbox-error` |
| Toggle       | `aiux-toggle-error`   |

The required indicator switches from `text-text-primary` to `text-error` when invalid.

---

## Validation Timing

Triggers, debouncing, and the `isTouched` guard are documented in `@accessibility` › Validation timing.

## Localization

All user-facing validation messages must use `@lit/localize`:

```typescript
msg('This field is required');
msg(str`Value must be at least ${min}`);
```

Never hardcode English strings in validation messages.

---

## Known Exceptions

- **Icon name drift:** `renderFormFieldMessages()` uses short names (`close`), `transformMessages()` uses `-outline` suffix, form-level messages use mixed conventions.
