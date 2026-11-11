# aiux-modal

> Source: `@servicenow/aiux-components-core@10.6.9` · `components/core/docs/usage/aiux-modal.md`

`<aiux-modal>` shows its slotted header, body, and footer in a native modal
`<dialog>` while `open` is `true`, and fires `aiux-modal:close` when it closes
itself. It is the default for blocking modals in Karuna apps (confirmations,
forms, full-screen content); for a non-blocking or draggable panel that leaves
the page interactive, use `aiux-dialog` (component library).

Built in, do not rebuild: header close button, `Escape` and optional backdrop
dismissal, focus trap with focus restore, background scroll lock, open
animation. It performs no action for your footer buttons; the host handles
them and closes the modal by setting `open` to `false`.

## Import

```js
import '@servicenow/aiux-components-core';
```

## Usage

### Minimal complete example

```js
import {html, nothing} from 'lit';
import {AIUXElement} from '@servicenow/aiux-components-core';

export class DeleteRuleButton extends AIUXElement {
  static properties = {
    ruleName: {type: String},
    _open: {state: true}
  };

  constructor() {
    super();
    this.ruleName = '';
    this._open = false;
  }

  _onModalClose(e) {
    // Content inside the modal may render its own aiux-modal; ignore its close.
    if (e.target !== e.currentTarget) return;
    this._open = false;
  }

  async _close() {
    this._open = false;
    // Removing an open modal does not restore focus; return it to the trigger.
    await this.updateComplete;
    this.renderRoot.querySelector('[aria-haspopup="dialog"]')?.focus();
  }

  _confirm() {
    this._close();
    this.dispatchEvent(
      new CustomEvent('delete-rule-confirmed', {bubbles: true, composed: true})
    );
  }

  render() {
    return html`
      <button class="aiux-btn aiux-btn-error" aria-haspopup="dialog" @click=${() => (this._open = true)}>
        Delete rule
      </button>
      ${this._open
        ? html`
            <aiux-modal
              open
              size="sm"
              no-dividers
              close-on-backdrop
              label="Delete ${this.ruleName}"
              @aiux-modal:close=${this._onModalClose}
            >
              <h5 slot="header">Delete ${this.ruleName}</h5>
              <p>This permanently deletes the rule. This action cannot be undone.</p>
              <div slot="footer" class="flex justify-end gap-2">
                <button class="aiux-btn aiux-btn-secondary" @click=${this._close}>
                  Cancel
                </button>
                <button class="aiux-btn aiux-btn-error" @click=${this._confirm}>Delete</button>
              </div>
            </aiux-modal>
          `
        : nothing}
    `;
  }
}
customElements.define('delete-rule-button', DeleteRuleButton);
```

**What happens:** Rendering the element with `open` calls `showModal()`, locks
page scroll, and moves focus to the header close button. The close button,
`Escape`, and a backdrop click close it, fire `aiux-modal:close`, and return
focus to the trigger. Cancel and Delete remove it while open, which releases
the scroll lock but does not restore focus, so `_close()` refocuses the
trigger after the update. Rendering it only while open keeps its content out of the server
HTML (see SSR).

### Additional patterns

Keep the element mounted and bind `open` instead. The host must clear its own
state on close: after the modal closes itself, binding the same `true` again
is not a change to Lit, so it does not reopen.

```js
html`
  <aiux-modal
    .open=${this._editing}
    size="lg"
    fill-height
    @aiux-modal:close=${e => {
      if (e.target === e.currentTarget) this._editing = false;
    }}
  >
    <h5 slot="header">Edit rule</h5>
    <rule-editor class="block h-full"></rule-editor>
  </aiux-modal>
`;
```

Busy state: `Escape` and backdrop do not close it (the header close button
still does). In some browsers a repeated `Escape` may still close it:

```js
html`<aiux-modal .open=${this._saving} .closeOnEscape=${false} hide-actions label="Saving">…</aiux-modal>`;
```

Content that opens floating panels through `createTeleport()` (dropdowns,
date pickers, popovers) needs `mount-teleports`, or those panels render but
cannot be clicked or focused:

```js
html`<aiux-modal .open=${this._open} mount-teleports @aiux-modal:close=${this._onModalClose}>…</aiux-modal>`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `open` | `open` (reflected) | `boolean` | `false` | Updates immediately | `true` calls `showModal()`; `false` closes. The modal sets it to `false` itself when the user closes it. |
| `size` | `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Updates immediately | Dialog width (see Sizing). Other values render as `md`. |
| `fillHeight` | `fill-height` | `boolean` | `false` | Updates immediately | Fixes the dialog height at `85vh` (`95vh` below 640px) so body content can fill it with `height: 100%` / `flex: 1`. No effect with `size="full"`. |
| `closeOnBackdrop` | `close-on-backdrop` | `boolean` | `false` | Updates immediately | Backdrop click closes the modal. |
| `closeOnEscape` | `close-on-escape` | `boolean` | `true` | Updates immediately | `Escape` closes the modal. Boolean attribute: any value, including `"false"`, means `true`; to disable, bind `.closeOnEscape=${false}`. |
| `hideActions` | `hide-actions` | `boolean` | `false` | Updates immediately | Removes the footer region; `slot="footer"` content is not shown. |
| `noDividers` | `no-dividers` | `boolean` | `false` | Updates immediately | Removes both the header and the footer border. |
| `noHeaderDivider` | `no-header-divider` | `boolean` | `undefined` (falsy) | Updates immediately | Removes only the header border. |
| `noFooterDivider` | `no-footer-divider` | `boolean` | `undefined` (falsy) | Updates immediately | Removes only the footer border. |
| `mountTeleports` | `mount-teleports` (reflected) | `boolean` | `false` | Applies to teleports created after the modal's next update (`await modal.updateComplete`), or set the attribute directly | `createTeleport()` calls from content inside this modal append the panel inside the `<dialog>` instead of `document.body`. Also drops the open animation's fill; do not give `::part(dialog)` a `transform`, `filter`, or `contain`, or fixed-position panels are placed relative to the dialog. |
| `label` | `label` | `string` | `''` | Updates immediately | Accessible name (`aria-label`) of the dialog. When empty, the name comes from the whole header region, which includes the close button's label. |
| `closeLabel` | `close-label` | `string \| null` | `null` | Updates immediately | `aria-label` and `title` of the close button. `null` uses the localized "Close dialog". |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `aiux-modal:open` | `null` | bubbles, composed, not cancelable | After `showModal()`, when `open` becomes `true` (including first render with `open`) | |
| `aiux-modal:close` | `null` | bubbles, composed, not cancelable | After the dialog closes: close button, `Escape` (if `closeOnEscape`), backdrop click (if `closeOnBackdrop`), `hide()`, or the host setting `open` to `false` | The modal is already closed; there is nothing to veto. For an unsaved-changes guard, reopen it (set `open` to `true`) after your own confirmation. Not fired when the element is removed while open. |

Both events are composed, so an `aiux-modal` inside your modal's content (or
inside a component you render there) reaches your listener. Check
`e.target === e.currentTarget` before acting.

`Escape` pressed inside the modal is stopped at the dialog: it never bubbles
to ancestor or `document` key listeners (capture-phase listeners still see
it), even with `closeOnEscape` `false`.

### Slots

| Slot | Content |
| --- | --- |
| `header` | Title, shown left of the close button. No text styling is applied; use `<h5 slot="header">` for the Horizon title scale. Long titles are not truncated by the modal. |
| (default) | Body. Scrolls vertically when it exceeds the available height. Padded `px-6 py-5`. |
| `footer` | Actions. The region does not lay out its children; give the slotted element its own layout (for example `class="flex justify-end gap-2"`). |

### Methods

| Method | Effect |
| --- | --- |
| `show()` | Sets `open` to `true`. |
| `hide()` | Sets `open` to `false`; fires `aiux-modal:close`. |

### Data shapes

`ModalWidgetResult` is exported as a type from
`@servicenow/aiux-components-core` for content hosted inside a modal (for
example through `g_modal.showWidget`) that reports a result:

```ts
interface ModalWidgetResult {
  action: 'confirmed' | 'cancelled' | 'dismissed';
  data?: unknown;
}
```

## Integration details

### SSR

The element is registered only in the browser. On the server `<aiux-modal>`
is emitted as an unknown element with its light-DOM children, so slotted
content is visible in the server HTML until the client upgrades it, even when
`open` is absent. Render the element only while open (as in the minimal
example) or only in the browser (`isServer` from `lit`).

### Lifecycle

- Focus returns to the element focused at open only when the modal closes
  (close button, `Escape`, backdrop, `hide()`, or `open` set to `false`).
  Removing the element while open releases the scroll lock but does not
  restore focus or fire `aiux-modal:close`; reset your own state and refocus
  the trigger yourself, or set `open` to `false` and remove it after
  `aiux-modal:close`.
- Several open modals can coexist; the most recently opened stacks on top and
  the scroll lock is released when the last one closes.

### Sizing and layout

- The host is `display: contents` (and `display: none` while closed), so it
  takes no space where it is placed. The dialog is centered in the browser's
  top layer above all page content; no `z-index` is needed or possible.
- Widths: `sm` `min(24rem, 100vw − 2rem)`, `md` `min(32rem, …)`, `lg`
  `min(48rem, …)`, `xl` `min(64rem, …)`; below 640px these become
  `100vw − 1rem` with a `95vh` height cap. `full` is `100vw − 2rem` by
  `100vh − 2rem`.
- Height follows content up to `85vh`; header and footer stay fixed and the
  body scrolls. A `height: 100%` child of the body collapses unless
  `fill-height` or `size="full"` is set.
- Open animation: 0.2s fade and scale. No close animation. It is off when the
  OS requests reduced motion or the user's in-app "Reduce motion" preference
  is on (applied automatically).
- While open, the rest of the page is inert (not clickable, focusable, or
  exposed to assistive technology) and `document.body` does not scroll.

## Accessibility, localization, and customization

- **Accessibility:** Set `label` to the dialog title; without it the
  accessible name also contains the close button's text. On open, focus goes
  to the header close button, overriding `autofocus` on slotted content; to
  focus another element (for example a form's first field), focus it from an
  `aiux-modal:open` listener inside `requestAnimationFrame`, since a
  synchronous `focus()` is overridden. `Tab` cycles the close button, then
  slotted focusable elements in light-DOM source order across all slots, so
  write header, body, then footer content in that order. On close, focus
  returns to the element focused at open. The close button cannot be hidden.
- **Localization:** The close button label defaults to the localized "Close
  dialog"; `close-label` replaces it. Translate all slotted text and `label`.
- **Customization:** `::part(dialog)` is the `<dialog>` (surface, radius,
  shadow, `max-height`; override margin and inset for non-centered placement
  while keeping focus trap, `Escape`, and backdrop behavior).
  `::part(body)` is the scrollable body wrapper; set `padding: 0` there when
  the content brings its own padding. `--modal-backdrop` on `aiux-modal` sets
  the backdrop color (default `rgba(0, 0, 0, 0.5)`). Surface colors follow the
  DaisyUI theme (`bg-base-100`, `text-base-content`). The header and footer
  regions and the close button have no parts.
