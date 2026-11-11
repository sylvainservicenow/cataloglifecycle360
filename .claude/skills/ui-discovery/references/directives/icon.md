# icon

> Source: `@servicenow/aiux-directive-icon@1.4.3` · `directives/icon/docs/usage/icon.md`

`icon({name, size, alt, class})` renders an `<svg>` whose `<use>` references
the platform icon sprite for the given name, variant, and size. The icon names are not checked: an unknown name renders an empty SVG of
the requested size.

## Import

```js
import {icon} from '@servicenow/aiux-directive-icon';
// Types: import type {IconOptions, IconName, IconNameWithVariant, IconSize, IconVariant} from '@servicenow/aiux-directive-icon';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {msg} from '@lit/localize';
import {AIUXElement} from '@servicenow/aiux-components-core';
import {icon} from '@servicenow/aiux-directive-icon';

@customElement('my-toolbar')
export class MyToolbar extends AIUXElement {
  _onEdit() {
    this.dispatchEvent(new CustomEvent('my-toolbar:edit', {bubbles: true, composed: true}));
  }

  render() {
    return html`
      <button class="aiux-btn aiux-btn-sm text-primary" @click=${this._onEdit}>
        ${icon({name: 'pencil', size: 'sm'})}
        ${msg('Edit')}
      </button>
      <span class="text-warning">
        ${icon({name: 'circle-info-outline', alt: msg('Record is read-only')})}
      </span>
    `;
  }
}
```

**What happens:** the first icon is decorative (`aria-hidden="true"`) and
takes the button's text color. The second has `role="img"`, the label, and
`tabindex="0"`.

## API

### Signature

```ts
icon(options: IconOptions): DirectiveResult
```

`options` is required; calling `icon()` without an object throws.

- `name`: base name, optionally with `-fill` or `-outline` (default `fill`).
  Underscores are treated as hyphens (`circle_info_outline`). Legacy names
  (mostly Font Awesome, for example `cog`, `search`, `times`, `trash-o`) are
  mapped to current names; when the mapped name has its own variant suffix,
  that variant is used. An empty or missing `name` renders nothing.
- `size` (default `'md'`): pixel size, both width and height. Unknown values
  use `'md'`.

  | `size` | `xs` | `sm` | `md` | `lg` | `xl` | `1x` | `2x` | `3x` |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | Pixels | 12 | 16 | 20 | 24 | 32 | 16 | 24 | 32 |
  | Sprite key | `xs` | `sm` | `md` | `lg` | `xl` | `sm` | `lg` | `xl` |

- `alt`: non-empty sets `role="img"`, `aria-label`, `tabindex="0"`, and
  inline `cursor:help;border-radius:0.25rem`. Empty or missing sets
  `aria-hidden="true"`.
- `class`: set as the SVG's `class` attribute; omitted when empty.

### Binding

Text (child) position only: `${icon({...})}`. Any other position throws
``icon() must be used in a child expression: html`${icon(...)}` `` when the
template first renders.

### Update behavior

Every render re-renders the SVG from the current options; changed options
update the existing SVG's attributes. The directive keeps no state and needs
no cleanup.

### Exported helpers

| Export | Signature | Use |
| --- | --- | --- |
| `parseIconName` | `(name: string) => {baseName: string, variant: 'fill' \| 'outline'} \| null` | The name resolution `icon` uses (normalization, legacy mapping, variant). Returns `null` for an empty name. |
| `ICON_SIZES` | `Record<IconSize, {pixelSize: number, key: string}>` | The size table above. |
| `IconDirective` | Lit `Directive` class | The class behind `icon`; not needed to use it. |

### Data shapes

The package exports these types (see Import).

```ts
type IconName = 'abc' | 'accessibility' | /* ... */ 'user' | /* ... */; // every available base name
type IconNameWithVariant = IconName | `${IconName}-fill` | `${IconName}-outline`;
type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '1x' | '2x' | '3x';
type IconVariant = 'fill' | 'outline';

interface IconOptions {
  name: IconNameWithVariant;
  size?: IconSize; // default 'md'
  alt?: string;
  class?: string;
}
```

## Integration details

### SSR

The full SVG renders on the server.

### Sizing and layout

The SVG has inline `display:inline-block; vertical-align:middle;
flex-shrink:0; color:currentColor`. Class rules on the SVG do not override
these (use a parent for color and visibility); CSS `width`/`height` classes do
override the pixel size, and the icon scales.

## Accessibility, localization, and customization

- **Accessibility:** pass `alt` only for icons that convey meaning on their
  own; that icon becomes a focusable tab stop. Omit `alt` when adjacent text
  already labels the control.
- **Localization:** translate `alt` before passing it.
- **Customization:** most icons draw with `currentColor`, so set text color
  on a parent element.
