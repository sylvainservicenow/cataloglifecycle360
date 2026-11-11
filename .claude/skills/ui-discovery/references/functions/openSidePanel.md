# openSidePanel

> Source: `@servicenow/aiux-components-core@10.6.9` · `components/core/docs/usage/openSidePanel.md`

`openSidePanel(options)` writes the global side-panel state; the `<side-panel>`
element mounted by the app layout reads it and slides a panel in from the
right. The panel body is either your `content()` template or, when only `path`
is given, the app route at that path. There is one panel per page: calling it
again replaces what is shown. The panel provides the header (title, optional
navigate button, close button), backdrop, `Escape` and click-outside closing,
and an optional unsaved-changes confirmation modal (`setCloseConfirmation`);
do not rebuild these. It dispatches no close event to the caller; read
`sidePanelContext` to react to closing.

## Import

```js
import {openSidePanel, closeSidePanel} from '@servicenow/aiux-components-core';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, openSidePanel, closeSidePanel} from '@servicenow/aiux-components-core';

@customElement('incident-summary-page')
export class IncidentSummaryPage extends AIUXElement {
  _openDetails = e => {
    const trigger = e.currentTarget;
    const incident = {number: 'INC0010001', shortDescription: 'Email is down'};

    openSidePanel({
      title: `Incident ${incident.number}`,
      width: 'clamp(320px, calc(100vw - 16px), 480px)',
      content: () => html`
        <div class="p-4 flex flex-col gap-4">
          <p class="text-sm">${incident.shortDescription}</p>
          <button
            class="aiux-btn aiux-btn-sm self-end"
            @click=${() => {
              closeSidePanel();
              trigger.focus();
            }}
          >
            Done
          </button>
        </div>
      `
    });
  };

  render() {
    return html`<button class="aiux-btn" @click=${this._openDetails}>View details</button>`;
  }
}
```

**What happens:** the panel slides in over the page with a dimmed backdrop and
focus moves to the first header button (the close button here). `Escape`, the
header close button, or a backdrop click also close it; only the Done path
above returns focus to the trigger (see Additional patterns for the others).

### Additional patterns

Render an app route in the panel. With `path` and no `content`, the panel body
is a `<route-view>`: the page at `path` loads its bundles and runs its loaders
in an isolated scope (`ctx.embedded` is `true`, `this.isEmbedded` is `true`),
and links clicked inside it navigate within the panel.

```js
openSidePanel({
  path: `/record-detail/incident/${sysId}`,
  query: {sysparm_view: 'compact'},
  title: 'Incident'
});
```

Guard unsaved changes. Arm the confirmation after opening (every
`openSidePanel` call that replaces the panel, and every completed close, resets
it) and disarm it after saving.

```js
import {openSidePanel, closeSidePanel, setCloseConfirmation} from '@servicenow/aiux-components-core';

openSidePanel({
  title: 'Edit incident',
  content: () => html`<my-incident-form
    @dirty=${() => setCloseConfirmation({title: 'Discard changes?', preventForcedClose: true})}
    @saved=${() => {
      setCloseConfirmation(null);
      closeSidePanel();
    }}
  ></my-incident-form>`
});
```

React to the panel closing by any path (Escape, backdrop, header button),
for example to restore focus or clear a selection. `static contexts`
re-renders the host on every panel state change.

```js
import {html} from 'lit';
import {AIUXElement, openSidePanel, sidePanelContext} from '@servicenow/aiux-components-core';

class MyList extends AIUXElement {
  static contexts = [sidePanelContext];
  _panelWasOpen = false;
  _trigger = null;

  _open(e, row) {
    this._trigger = e.currentTarget;
    openSidePanel({title: row.number, content: () => html`<my-row-detail .row=${row}></my-row-detail>`});
  }

  updated(changed) {
    super.updated(changed);
    const open = sidePanelContext.get().open;
    if (this._panelWasOpen && !open) this._trigger?.focus();
    this._panelWasOpen = open;
  }
}
```

## API

### Signature

```ts
openSidePanel(options?: SidePanelOptions): void
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | `() => TemplateResult` | `null` | Panel body. Called with no arguments every time the panel renders (on any `sidePanelContext` change), not when your component re-renders. Takes precedence over `path` for the body. |
| `title` | `string \| null` | `null` | Header text on the left, and the panel's `aria-label` (fallback: translated "Side panel"). A route rendered via `path` replaces it with its own header title when it has one. |
| `width` | `string` | `'550px'` | CSS width of the panel. Not clamped to the viewport; use `clamp()`/`min()` for narrow screens. Users cannot resize the panel. |
| `height` | `string \| null` | `null` | CSS height. `null` is full viewport height. The panel is inset 8px on each side, so the rendered height is `height - 16px`. |
| `anchor` | `'top' \| 'bottom'` | `'top'` | Pins the panel to the top or bottom edge; matters only with `height`. Any other value (including `null`) throws `Error('Invalid anchor value: …')`. |
| `closeOnClickOutside` | `boolean` | `true` | `true`: renders a dimmed backdrop that closes the panel on click. `false`: no backdrop, and the page behind stays interactive. |
| `path` | `string \| null` | `null` | App route (relative to the app, may contain `?query`). Without `content`, the body renders that route. With or without `content`, a navigate button appears in the header (see Behavior). |
| `query` | `object \| string \| null` | `null` | Query parameters for the `path` route's loader context; also sent with the navigate button's tab request. Explicit keys win over an inline `?query` in `path`. |

Do not pass state keys (`open`, `closeConfirmation`, `pendingClose`,
`pendingOpen`); other unlisted keys are stored in the panel state and ignored.

### Returns

`undefined`. The panel opens asynchronously on the layout's next render.

### Behavior

- **Replaces, never stacks.** Every option not passed returns to its default.
  If the open panel has a confirmation armed with `preventForcedClose: true`,
  the new panel is queued: the confirmation modal shows, confirming opens the
  new panel, cancelling keeps the current one.
- **Where content lives.** `content()` renders inside `<side-panel>`'s shadow
  root, not your component's. AIUX Tailwind/DaisyUI classes apply; your
  component's `static styles` do not. DOM events from the content bubble to the
  layout, not through your component, so bind handlers in the template as arrow
  functions (Lit calls plain listeners with `this` set to the panel). The body
  scrolls vertically and has no padding.
- **Updating content.** Your component's re-renders do not reach the panel.
  Put live state inside a custom element rendered by `content()`, or call
  `openSidePanel` again (which also clears any confirmation).
- **Closing.** `Escape` anywhere in the document while the panel is open, the
  header close button, and a backdrop click (when `closeOnClickOutside`) all
  close it; with a confirmation armed, each shows the modal instead. Stop
  propagation of an `Escape` keydown inside the content to keep the panel open
  (for example when closing your own dropdown). Closing clears the content,
  which disconnects the rendered elements.
- **Navigate button.** Shown when `path` is set. Clicking it closes the panel
  (through the confirmation, if armed), then dispatches `aiux-nav-create-tab`
  on `window` with `detail: {title, route: path, query}`. `aiux-nav-layout`
  handles it by opening the route as a pinned navigation tab; in other layouts
  nothing listens, so the button only closes the panel.
- **Routed content.** When the body is a route, links inside it update the
  panel's `path`/`query`; header title and page actions from the embedded page
  appear in the panel header. A missing route or loader failure shows an error
  message in the body.

### Exported helpers

| Export | Signature | Use |
| --- | --- | --- |
| `closeSidePanel` | `(options?: {force?: boolean}) => void` | Closes and resets all panel state. With a confirmation armed and `preventForcedClose: true`, shows the modal instead unless `force: true`. With `preventForcedClose: false` it closes immediately, without confirmation. |
| `setCloseConfirmation` | `(config: CloseConfirmation \| null) => void` | Arms (`config`) or disarms (`null`) the confirmation modal on the current panel. Omitted fields take the defaults in Data shapes. Call after `openSidePanel`. |
| `hideSidePanel` | `() => boolean` | Hides the panel but keeps its options and confirmation. The content elements are disconnected and a routed page is discarded. Returns `false` if already closed. |
| `showSidePanel` | `() => boolean` | Shows a hidden panel again; `content()` is called anew (a route reloads). Returns `false` if already open. |
| `setNavigationTabPath` | `(path: string \| null, query?: object \| null) => void` | Changes the navigate button's target on the open panel; `null` hides the button. Omit `query` to keep the current one. With no `content`, it also changes the routed body. |
| `sidePanelContext` | global context | `sidePanelContext.get()` returns the current `SidePanelState`; `subscribe(cb)` returns an unsubscribe function; `static contexts = [sidePanelContext]` on an `AIUXElement` re-renders it on every change (for example to shrink your layout by `get().width` while `open`). `set()` replaces the whole state; prefer the helpers above. |

### Data shapes

```ts
interface SidePanelOptions {
  content?: () => TemplateResult;
  title?: string | null;
  width?: string;                 // default '550px'
  height?: string | null;         // default null (full height)
  anchor?: 'top' | 'bottom';      // default 'top'
  closeOnClickOutside?: boolean;  // default true
  path?: string | null;
  query?: Record<string, string> | string | null;
}

interface CloseConfirmation {
  title?: string;               // default 'Close panel?'
  message?: string;             // default 'Are you sure you want to close this panel?'
  confirmLabel?: string;        // default 'Close'
  cancelLabel?: string;         // default 'Cancel'
  preventForcedClose?: boolean; // default false
}

interface SidePanelState extends Required<SidePanelOptions> {
  open: boolean;
  closeConfirmation: Required<CloseConfirmation> | null;
  pendingClose: boolean;         // confirmation modal requested
  pendingOpen: SidePanelState | null; // queued openSidePanel call
}
```

## Integration details

### Platform requirements

The panel appears only where a `<side-panel>` element is mounted:
`aiux-layout`, `aiux-structured-layout`, and `aiux-nav-layout` mount one. In
an app whose layout does not, `openSidePanel` updates state and nothing is
shown. Do not add a second `<side-panel>`; every instance renders the same
state.

### SSR

Panel state is not serialized: the panel is always closed on initial page
load. Calling `openSidePanel` during server rendering or in a loader has no
visible effect. Call it from browser event handlers.

### Sizing and layout

The panel is `position: fixed` at `z-index: 1000`, 8px from the right, top,
and bottom edges (left edge when `<html dir="rtl">`), with a 52px header. It
overlays the page and does not push content aside; to reflow your layout, read
`sidePanelContext.get().width` while `open`.

## Accessibility, localization, and customization

- **Accessibility:** the panel has `role="dialog"`, `aria-modal="true"`, and
  `aria-label` from `title`. On open, focus moves to the first header button
  on the next animation frame. Focus is not trapped and is not restored on
  close; restore it to the trigger yourself.
- **Localization:** the close and navigate button labels are translated.
  `title` and all `setCloseConfirmation` strings are yours to translate; the
  confirmation defaults are English.
- **Customization:** set `--side-panel-bg` (default `--color-base-100`) and
  `--side-panel-header-border` (default `1px solid var(--color-base-300)`,
  drawn only when the header shows a title) on an ancestor such as `:root`;
  they inherit into the panel. The header layout, backdrop, and animation are
  fixed.
