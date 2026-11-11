# Form Validation Accessibility

How to wire validation messages, errors, and live region announcements so that keyboard and screen reader users get the same feedback as sighted mouse users.

## When to read this

- Implementing or reviewing any form with validation
- Hooking up error messages, helper text, or hint copy to a form control
- Choosing between `role="alert"` and `role="status"` for a validation message
- Deciding when to validate (on blur, on change, on submit)

## Core requirements

Every invalid form control must satisfy all five:

1. **Accessible name** — `<label for="id">` with matching `id` on the control (or `aria-label` if no visible label).
2. **`aria-invalid="true"`** — applied to the control when its value is invalid; removed when valid.
3. **`aria-describedby`** — points to the id of the message element (helper text, error message, or both).
4. **Error message element** — has a stable `id` referenced by `aria-describedby`, and an appropriate live region role.
5. **Focus to first invalid field on submit** — keyboard users land at the first problem, not the top of the page.

## ARIA association pattern

```html
<div class="field">
  <label for="form-field-email">Email <span aria-hidden="true">*</span></label>
  <input
    id="form-field-email"
    type="email"
    aria-required="true"
    aria-describedby="form-field-email-messages"
  />
  <div id="form-field-email-messages">
    <!-- Message element appears here when invalid -->
  </div>
</div>
```

The `aria-describedby` target must always exist in the DOM, even when empty. It must be in the same Shadow DOM as the input it is associated with. Creating the container only at invalidation time causes screen readers to miss the association.

## Message role mapping

Choose the role based on the message's urgency, not its visual style.

### Field-level messages

| Status                              | Role            | Behavior                                              |
| ----------------------------------- | --------------- | ----------------------------------------------------- |
| Error (critical, blocks submission) | `role="alert"`  | Interrupts current screen reader output; assertive    |
| Warning (non-blocking issue)        | `role="alert"`  | Assertive — user should hear it now                   |
| Success / positive confirmation     | `role="status"` | Polite — announced at the next pause                  |
| Informational helper text           | `role="status"` | Polite                                                |
| Suggestion (e.g., AI-generated)     | `role="status"` | Polite                                                |
| Static helper text (always present) | _no role_       | Read as part of the field via `aria-describedby` only |

### Form-level banners (above the field grid)

| Type                  | Role            | Sort order              |
| --------------------- | --------------- | ----------------------- |
| Mandatory field error | `role="alert"`  | Highest (sorted to top) |
| Field-level error     | `role="alert"`  | High                    |
| Submission error      | `role="alert"`  | High                    |
| Warning               | `role="alert"`  | Medium                  |
| Info                  | `role="status"` | Low                     |
| Success               | `role="status"` | Low                     |

## Complete form validation cycle

The validation cycle must implement all of: marking invalid, providing a message, announcing it, moving focus, and clearing state when the user corrects the input.

```html
<form id="my-form" novalidate>
  <div class="field">
    <label for="email">Email <span aria-hidden="true">*</span></label>
    <input
      id="email"
      type="email"
      aria-required="true"
      aria-describedby="email-error"
    />
    <span id="email-error" role="alert" class="visually-hidden"></span>
  </div>
  <button type="submit">Submit</button>
</form>
```

```js
form.addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('email');
  const errorEl = document.getElementById('email-error');

  if (!input.value || !input.validity.valid) {
    // Mark the field invalid
    input.setAttribute('aria-invalid', 'true');
    // Provide the error message — role="alert" announces it immediately
    errorEl.textContent = 'Please enter a valid email address.';
    input.focus();
    return;
  }

  // Clear error state when valid
  input.removeAttribute('aria-invalid');
  errorEl.textContent = '';
  // Proceed with submission...
});

// Clear error state as the user corrects the input
document.getElementById('email').addEventListener('input', e => {
  if (e.target.getAttribute('aria-invalid')) {
    e.target.removeAttribute('aria-invalid');
    document.getElementById('email-error').textContent = '';
  }
});
```

Key behaviors covered:

- `aria-invalid="true"` on the invalid input — tells screen readers the field has an error
- `aria-describedby` linking the input to its error element — reads the error text after the field label
- `role="alert"` on the error element — announces the error immediately when text is inserted
- Both `aria-invalid` and the error text are cleared when the user starts correcting the field
- Focus moves to the first invalid field on submit so keyboard users land at the error

## Validation timing

The timing of validation feedback affects whether users see errors before they have a chance to provide valid input. Always guard with `isTouched` so a field never shows an error before the user has interacted with it.

| Trigger                        | When                      | Use for                                          |
| ------------------------------ | ------------------------- | ------------------------------------------------ |
| **On blur**                    | Field loses focus         | Standard field validation — default              |
| **On value change**            | Programmatic value change | Backend-driven validation, dependent field rules |
| **On input** (debounced 250ms) | While the user is typing  | Real-time format validation (IP, URL, etc.)      |
| **On submit**                  | Form submission           | Form-level banner generation                     |

**Do not validate on input without debouncing.** Announcing an error on every keystroke is jarring for screen reader users and creates noise that obscures real problems.

**Treat empty as valid in non-required validators.** Use the `required` attribute (and matching `aria-required="true"`) for mandatory fields. Pattern, min/max, and format validators must skip empty values — otherwise an empty optional field is announced as invalid.

## Live region patterns for non-field feedback

For validation feedback that is not tied to a specific field (e.g., "Form saved successfully", "Network error — try again"), use a dedicated live region.

```html
<!-- Visible alert — appears on screen and is announced -->
<div role="alert">Record saved successfully</div>

<!-- Visually hidden live region — non-visual feedback -->
<div aria-live="polite" class="visually-hidden">Record saved successfully</div>
```

Use `role="status"` (or `aria-live="polite"`) for passive updates, and `role="alert"` (or `aria-live="assertive"`) for urgent ones that interrupt the screen reader.

A reusable live region controller (`AriaLiveController` from `@servicenow/aiux-controller-aria-live` in Karuna projects) handles polite/assertive announcements without manually creating elements per message.

## Don't conflate visual style with semantic role

Visual treatment (alert color, banner background, icon) is a separate concern from the ARIA role. A "warning" colored banner can be `role="alert"` (assertive) or `role="status"` (polite) depending on whether the user must respond now or just be informed.

When the design language assigns visual styles to statuses (critical / warning / positive / info), define the role mapping at the same time and document it alongside the visual mapping.

## Related WCAG criteria

- **1.3.1 Info and Relationships** — programmatic association between label, control, and error
- **3.3.1 Error Identification** — errors are identified and described to the user
- **3.3.2 Labels or Instructions** — labels and instructions are provided when content requires user input
- **3.3.3 Error Suggestion** — when an error is detected, a suggested correction is provided when known
- **3.3.4 Error Prevention (Legal, Financial, Data)** — submissions are reversible, checked, or confirmable
- **4.1.3 Status Messages** — status messages are programmatically determined (via role or aria-live) without receiving focus
