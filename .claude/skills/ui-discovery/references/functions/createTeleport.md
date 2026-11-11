# createTeleport

> Source: `@servicenow/aiux-components-core@10.6.9` · `components/core/docs/usage/createTeleport.md`

`createTeleport()` appends a new, empty `<aiux-teleport>` element outside
your component (to `document.body`, or into an opted-in open modal
`<dialog>`) and returns it. You set its `template`, position the content
yourself, and remove it with `removeTeleport()`. Nothing removes it for you.
Use it for positioned overlays and popovers that must escape clipping; it is
not for dialogs.

## Import

```js
import {createTeleport, removeTeleport} from '@servicenow/aiux-components-core';
```

## Usage

### Minimal complete example

```ts
import {html, isServer, type TemplateResult} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement, createTeleport, removeTeleport} from '@servicenow/aiux-components-core';

type TeleportElement = HTMLElement & {
  template: TemplateResult | null;
  updateComplete: Promise<boolean>;
};

const ITEMS = ['Edit', 'Duplicate', 'Delete'];

@customElement('my-menu-button')
export class MyMenuButton extends AIUXElement {
  @state() private _selected = '';
  private _teleport: TeleportElement | null = null;
  private _trigger: HTMLElement | null = null;

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._close();
  }

  private _toggle = (e: Event) => {
    if (this._teleport) this._close();
    else this._open(e.currentTarget as HTMLElement);
  };

  private async _open(trigger: HTMLElement) {
    if (isServer) return;
    this._trigger = trigger;
    const r = trigger.getBoundingClientRect();
    this._teleport = createTeleport(trigger) as TeleportElement;
    this._teleport.template = html`
      <ul
        role="menu"
        class="fixed aiux-menu bg-base-100 rounded-box shadow-sm min-w-40 pointer-events-auto"
        style="top: ${r.bottom + 4}px; left: ${r.left}px;"
        @keydown=${this._onKeydown}
      >
        ${ITEMS.map(
          item => html`<li role="none">
            <button role="menuitem" data-item=${item} @click=${this._onItemClick}>${item}</button>
          </li>`
        )}
      </ul>
    `;
    document.addEventListener('pointerdown', this._onOutsidePointer, true);
    await this._teleport.updateComplete;
    this._teleport?.shadowRoot?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }

  private _close() {
    document.removeEventListener('pointerdown', this._onOutsidePointer, true);
    if (this._teleport) removeTeleport(this._teleport);
    this._teleport = null;
  }

  private _onItemClick = (e: Event) => {
    this._select((e.currentTarget as HTMLElement).dataset.item ?? '');
  };

  private _select(item: string) {
    this._selected = item;
    this._close();
    this._trigger?.focus();
  }

  private _onKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    this._close();
    this._trigger?.focus();
  };

  private _onOutsidePointer = (e: PointerEvent) => {
    const path = e.composedPath();
    if (this._teleport && !path.includes(this._teleport) && !path.includes(this._trigger!)) {
      this._close();
    }
  };

  render() {
    return html`
      <button class="aiux-btn" aria-haspopup="menu" @click=${this._toggle}>
        Actions${this._selected ? `: ${this._selected}` : ''}
      </button>
    `;
  }
}
```

**What happens:** the menu renders in the teleport's shadow root, so it is not
clipped by the host's `overflow` or stacking context. Positions are viewport
coordinates captured at open; they do not follow scrolling or resizing unless
you re-measure and set `template` again.

### Additional patterns

Move existing light-DOM children into the teleport instead of (or alongside)
a template. Children show wherever the template renders a `<slot>`; with
`template` `null` the element renders a single default `<slot>`. Move them
back before calling `removeTeleport()`, or they are removed with it.

```ts
this._teleport = createTeleport(this) as TeleportElement;
const nodes = [...this.querySelectorAll(':scope > [slot="content"]')];
nodes.forEach(n => { n.removeAttribute('slot'); this._teleport!.appendChild(n); });
const r = this.getBoundingClientRect();
const pos = `top:${r.bottom}px;left:${r.left}px`;
this._teleport.template = html`<div class="fixed pointer-events-auto" style=${pos}><slot></slot></div>`;

// close:
nodes.forEach(n => { n.setAttribute('slot', 'content'); this.appendChild(n); });
if (this._teleport) removeTeleport(this._teleport);
```

## API

### Signature

```ts
createTeleport(anchor?: HTMLElement): TeleportElement
```

- `anchor`: the element the overlay belongs to (usually its trigger), used
  only to choose the mount parent. Defaults to the currently focused element,
  looked up through shadow roots.

### Returns

A new `<aiux-teleport>` element, already connected. Each call creates another
element; multiple teleports can coexist. It is typed as `HTMLElement`; its
`template` property is not in the declared type, so cast (see Data shapes).

| Member | Type | Description |
| --- | --- | --- |
| `template` | `TemplateResult \| null`, property only | Content rendered in the teleport's shadow root. Default `null`, which renders a default `<slot>`. Setting it again re-renders asynchronously (Lit update); await `updateComplete` before querying `shadowRoot`. |
| `updateComplete` | `Promise<boolean>` | Resolves after the pending render. |
| `shadowRoot` | `ShadowRoot` | Open shadow root holding the rendered template. Query your content here. |

Throws an `Error` (`createTeleport() requires <aiux-teleport> to be registered first. …`)
when the element is not registered. It is never registered on the
server, so calling it there always throws. Importing
`@servicenow/aiux-components-core` registers it in the browser.

### Behavior

- **Mount parent.** Starting from `anchor` (or the focused element), it walks
  up through slots and shadow roots to the nearest open modal `<dialog>`. If
  that dialog, or the shadow host containing it, has the `mount-teleports`
  attribute, the teleport is appended inside the dialog. Otherwise, and when
  no modal dialog is open, it goes to `document.body`. The parent is chosen
  once at creation; the teleport does not move if a dialog opens later.
- **Inside a modal without the opt-in.** A teleport in `document.body` while a
  modal dialog is open is painted above the dialog but is inert: it cannot be
  clicked, focused, or scrolled.
- **Top layer.** When the browser supports the Popover API, the element gets
  `popover="manual"` and is shown with `showPopover()`, so it stacks above
  open modal dialogs and earlier teleports. There is no light dismiss or
  `Escape` handling; the host closes it. Without Popover API support the
  element is a normal child of its parent and cannot stack above a modal
  dialog; give your content a `z-index`. With the Popover API, moving the
  element to another parent hides it (a removed popover closes); leave it
  where `createTeleport()` put it.
- **Host box.** The element itself is `position: absolute`, `0×0`, with no
  insets (it sits at its static position), `overflow: visible`, `pointer-events: none`, `color: inherit`. Content must
  set its own position (typically `position: fixed` with coordinates from the
  trigger's `getBoundingClientRect()`) and `pointer-events: auto`, or it
  receives no clicks.
- **Events.** DOM events from the content bubble to the teleport's parent
  (`document.body` or the dialog), not through your component. Bind handlers
  in the template (`@click=${…}`) as arrow functions or bound methods; Lit
  calls plain listeners with `this` set to the teleport element. For outside-
  click detection, check `e.composedPath()` against the teleport and trigger.

### Exported helpers

| Export | Signature | Use |
| --- | --- | --- |
| `removeTeleport` | `(teleport: HTMLElement) => void` | Removes the teleport from the DOM (and its light-DOM children with it). Does nothing for `null` at runtime, but the declared type is non-nullable, so guard nullable fields in TypeScript. Call on close and in the host's `disconnectedCallback`. |

### Data shapes

```ts
type TeleportElement = HTMLElement & {
  template: TemplateResult | null;
  updateComplete: Promise<boolean>;
};
```

## Integration details

### SSR

The element is never registered on the server, so `createTeleport()` throws
there. Call it only from browser code paths: event handlers, `updated()`, or
behind `if (isServer) return;`. Nothing is server-rendered; the overlay exists
only after it is created on the client.

### Lifecycle

- The teleport is not tied to the host. Removing, moving, or hiding the host
  leaves the teleport in place; call `removeTeleport()` in
  `disconnectedCallback` and on every close path.
- Removed teleports are not reused; call `createTeleport()` again to reopen.
  Guard against creating a second one while one is open.
- Document-level listeners you add for outside clicks or keys are yours to
  remove on close.

## Accessibility, localization, and customization

- **Accessibility:** the teleport sits at the end of its parent, so `Tab` from
  the trigger does not reach it. Move focus into the content after
  `updateComplete`, handle `Escape` and arrow keys yourself, and return focus
  to the trigger on close; removing the teleport does not restore focus. Set
  roles and ARIA on the content and trigger (`aria-haspopup`,
  `aria-expanded`); `aria-controls`/`aria-labelledby` IDs do not resolve
  across the shadow boundary.
- **Customization:** the teleport's shadow root includes the AIUX Tailwind and
  DaisyUI styles, so utility and `aiux-` component classes work. Your
  component's own `static styles` do not apply; put extra CSS in a `<style>`
  inside the template or append one to `teleport.shadowRoot`. Theme tokens
  come from `data-theme` on `<html>`/`<body>` and apply normally; CSS custom
  properties set on your component or its ancestors below `<body>` do not
  reach the content.
