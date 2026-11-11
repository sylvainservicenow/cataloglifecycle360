# FocusTrapController

> Source: `@servicenow/aiux-controllers@1.3.20` · `controllers/docs/usage/FocusTrapController.md`

`FocusTrapController` keeps keyboard focus inside a component while an overlay
is open. The host calls `activate()` when the overlay opens and `deactivate()`
when it closes. On activate it remembers the focused element and moves focus
into the overlay; while active, Tab and Shift+Tab cycle through the overlay's
focusable elements and focus that leaves (by click or script) is pulled back;
on deactivate it restores focus to the remembered element. Shadow DOM is
pierced in both directions, and nested traps cooperate. It does not handle
Escape, set `aria-modal` or `inert`, or lock scrolling; the host does those.

## Import

```js
import {FocusTrapController} from '@servicenow/aiux-controllers';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import {FocusTrapController} from '@servicenow/aiux-controllers';

@customElement('acme-filter-panel')
export class AcmeFilterPanel extends AIUXElement {
  @state() _open = false;

  _trap = new FocusTrapController(this, {
    getContainers: () => {
      const panel = this.renderRoot?.querySelector('.panel');
      return panel ? [panel] : [this.renderRoot];
    }
  });

  updated(changed) {
    super.updated(changed);
    if (changed.has('_open')) {
      if (this._open) this._trap.activate();
      else this._trap.deactivate();
    }
  }

  _toggle() {
    this._open = !this._open;
  }

  _onPanelKeydown(e) {
    if (e.key === 'Escape') this._open = false;
  }

  render() {
    return html`
      <button class="aiux-btn" aria-expanded=${String(this._open)} @click=${this._toggle}>
        Filters
      </button>
      ${this._open
        ? html`
            <div
              class="panel aiux-card p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              @keydown=${this._onPanelKeydown}
            >
              <input class="aiux-input" aria-label="Keyword" />
              <button class="aiux-btn" @click=${this._toggle}>Apply</button>
            </div>
          `
        : null}
    `;
  }
}
```

**What happens:** clicking Filters renders the panel; after the render,
`activate()` moves focus to the keyword input. Tab and Shift+Tab cycle between
the input and Apply without leaving the panel. Escape or Apply sets `_open` to
`false`, `deactivate()` runs, and focus returns to the Filters button.
Removing the element while open also releases the trap.

### Additional patterns

Focus a specific element first, by default or for one activation. The target
must itself be focusable (see Behavior), otherwise the first focusable element
is used:

```js
_trap = new FocusTrapController(this, {
  initialFocus: () => this.renderRoot?.querySelector('[autofocus]') ?? null
});

this._trap.activate({initialFocus: () => this.renderRoot?.querySelector('.confirm')});
```

Explicit focus order, for overlays whose Tab order differs from DOM order or
that span several shadow roots:

```js
_trap = new FocusTrapController(this, {
  getContainers: () => [this.renderRoot],
  getFocusableElements: () =>
    [this._closeButton, ...this._bodyFocusables(), this._primaryAction].filter(Boolean)
});
```

Modeless overlay: move focus in and restore it on close, without trapping Tab:

```js
_trap = new FocusTrapController(this, {trapFocus: false});

// Or decide at each activate():
_trap = new FocusTrapController(this, {trapFocus: () => this.modal});
```

Overlay with nothing focusable (for example a loading state): focus goes to
the fallback, which defaults to the host. Give it `tabindex="-1"` so it can
receive programmatic focus:

```js
_trap = new FocusTrapController(this, {
  fallbackFocus: () => this.renderRoot?.querySelector('.panel')
});
```

## API

### Constructor

```ts
new FocusTrapController(host: ReactiveControllerHost & HTMLElement, options?: FocusTrapOptions)
```

- `host`: the component (an `AIUXElement`). The controller calls
  `host.addController(this)` when the host has that method. Create it as a
  class field or in the constructor.
- `options`: see Data shapes. Function options are called when needed, so
  they can read the current render; `trapFocus` may also be a boolean.

### Methods and fields

| Member | Signature | Effect |
| --- | --- | --- |
| `active` | `boolean` (getter) | `true` between `activate()` and `deactivate()`. |
| `activate` | `(overrides?: {initialFocus?: () => HTMLElement \| null}) => void` | Starts the trap and moves focus in (see Behavior). `overrides.initialFocus` replaces `options.initialFocus` for this activation only. No-op when already active. |
| `deactivate` | `() => void` | Stops the trap and restores focus to the element that was focused at `activate()`. No-op when not active. |
| `hostConnected` | `() => void` | Called by Lit. Does nothing; the trap starts only on `activate()`. |
| `hostDisconnected` | `() => void` | Called by Lit. Calls `deactivate()`. |

### Behavior

- **Focusable elements.** Collected in DOM order from every container
  returned by `getContainers`, descending into shadow roots of nested
  elements. An element counts when it matches `a[href]`, an enabled
  `button`/`input`/`select`/`textarea`, `iframe`, or `[tabindex]` other than
  `tabindex="-1"`, and is rendered (not `display: none`, not
  `visibility: hidden`, and has a layout box). With `getFocusableElements`,
  that list is used in the given order, filtered by the same test.
- **Default containers.** Without `getContainers`, the host's render root
  (shadow root), or the host itself when it has none.
- **On `activate()`.** Records the deepest focused element (inside shadow
  roots), then in a microtask (it does not wait for `updateComplete`), focuses the
  first of: `overrides.initialFocus()`, `options.initialFocus()`, the first
  focusable element, `fallbackFocus()` (default: the host). An
  `initialFocus` result that is not focusable by the test above is skipped.
  A `deactivate()` in the same tick cancels this.
- **While active (`trapFocus` true).** Document-level capture listeners:
  - Tab / Shift+Tab, when focus is inside the containers (or nowhere), moves
    to the next / previous focusable element and wraps at the ends. With no
    focusable elements, Tab does nothing.
  - Focus landing outside the containers is moved to the first focusable
    element (or the fallback).
  - When any focusable element is an `iframe`, Tab is left to the browser.
    If an `iframe` is focusable at activation, two invisible, focusable edge
    elements are inserted before the first and after the last focusable
    element; focusing one wraps to the other end. They are removed on
    `deactivate()`.
- **`trapFocus` false.** No listeners and no edge elements; initial focus and
  restore still happen. Evaluated once per `activate()`.
- **On `deactivate()`.** Removes the listeners and edge elements, then in a
  microtask focuses the recorded element if it is still in the document.
- **Nested traps.** Active traps form a stack. Focus moving into a trap
  activated later is not pulled back by an earlier one, and each trap
  handles Tab only when focus is inside its own containers. Deactivate inner
  traps before outer ones so focus restores to the inner trigger.
- Dispatches no events and does not render.

### Lifecycle

- Construct once per host. `activate()`/`deactivate()` can be called any
  number of times.
- Call `activate()` after the overlay's content is rendered or will render in
  the current update: from `updated()`, or from an event handler that also
  sets the open state (the focus move waits a microtask).
- Removing the host from the document deactivates the trap and restores
  focus. Reconnecting does not reactivate it.

### Data shapes

```ts
interface FocusTrapOptions {
  // Elements or shadow roots that make up the trap. Default: [host.renderRoot ?? host].
  getContainers?: () => Array<HTMLElement | ShadowRoot>;
  // Explicit ordered focusables; replaces container discovery for ordering.
  getFocusableElements?: () => HTMLElement[];
  // Default initial focus target for activate().
  initialFocus?: () => HTMLElement | null;
  // Install Tab cycling and focus redirect. Default true.
  trapFocus?: boolean | (() => boolean);
  // Focus target when nothing is focusable. Default: the host.
  fallbackFocus?: () => HTMLElement | null;
}
```

## Integration details

### SSR

Constructing the controller is safe on the server. `activate()` and
`deactivate()` use `document`; call them only in the browser, from
`updated()`, `firstUpdated()`, or event handlers.
