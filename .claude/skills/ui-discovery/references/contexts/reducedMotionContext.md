# Reduced motion context

> Source: `@servicenow/aiux-components-core@10.6.9` · `components/core/docs/usage/reducedMotionContext.md`

`reducedMotionContext` is `true` when the current user's
`glide.polaris.animation_disabled` preference is `'true'` (or `true`). Every `AIUXElement`
mirrors it as a boolean `reduced-motion` attribute on its host, and `<body>`
gets the same attribute, so most components need only CSS. It is seeded from the
pre-fetched preference, and saving that preference with `setUserPreference`
also updates this context.

## Import

```js
import {reducedMotionContext} from '@servicenow/aiux-components-core';
```

## Usage

### Minimal complete example

```js
import {html, css} from 'lit';
import {AIUXElement, reducedMotionContext} from '@servicenow/aiux-components-core';

export class NewsTicker extends AIUXElement {
  static contexts = [reducedMotionContext];
  static properties = {items: {type: Array}, _index: {state: true}};
  static styles = css`
    .item { transition: opacity 300ms ease; }
    :host([reduced-motion]) .item { transition: none; }
  `;

  constructor() {
    super();
    this.items = [];
    this._index = 0;
  }

  updated(changed) {
    super.updated(changed);
    // Re-evaluated on every context change because of static contexts.
    const shouldRun = !reducedMotionContext.get() && this.items.length > 1;
    if (shouldRun && !this._timer) {
      this._timer = setInterval(() => {
        this._index = (this._index + 1) % this.items.length;
      }, 4000);
    } else if (!shouldRun && this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._timer);
    this._timer = undefined;
  }

  render() {
    return html`<p class="item">${this.items[this._index] ?? ''}</p>`;
  }
}
customElements.define('news-ticker', NewsTicker);
```

**What happens:** CSS under `:host([reduced-motion])` needs no JS or context
declaration; `static contexts` is only needed because the autoplay timer reads
the value in JS.

## API

### Value

A `boolean` (see Data shapes).

| Field or method | Type | Meaning |
| --- | --- | --- |
| value | `boolean` | `true` when animations should be suppressed. Default `false`. |
| `get()` | `() => boolean` | Current value. |
| `subscribe(callback)` | `(cb: (value: boolean) => void) => () => void` | Called with the new value on every `setReducedMotion` call, even when unchanged; not called with the current value. Returns an unsubscribe function. |
| `set()` | — | Throws `Error`: the context is immutable. |

The value reflects only the ServiceNow preference, not the OS
`prefers-reduced-motion` media query. Add
`@media (prefers-reduced-motion: reduce)` rules yourself if both should apply.

### Providing

Provided automatically. `AIUXAppLayoutElement` (the app shell) sets it once
when it connects in the browser, from the pre-fetched
`glide.polaris.animation_disabled` preference, which is pre-fetched on every
page. Do not provide it yourself.

### Consuming

```css
/* Component CSS (every AIUXElement host receives the attribute) */
:host([reduced-motion]) .panel { transition: none; }

/* Light-DOM or global CSS */
body[reduced-motion] .banner { animation: none; }
```

```js
// JS: re-render on change
static contexts = [reducedMotionContext];
render() {
  const still = reducedMotionContext.get();
}

// JS without a context declaration
this.hasAttribute('reduced-motion'); // on any connected AIUXElement
isReducedMotionEnabled();            // same as reducedMotionContext.get() === true
```

- **Updates when:** the app shell connects, and when `setUserPreference`
  saves `glide.polaris.animation_disabled` (the value becomes `true` when the
  saved value is `'true'` or `true`, otherwise `false`). Not updated by client navigation, the OS setting, or the
  preference changing elsewhere.
- **Before a provider exists:** `false` on the server, before the app shell
  connects, and on pages without the Karuna app shell (e.g. a widget embedded
  elsewhere). Elements that connect earlier get the attribute when the value
  changes.
- `reduced-motion` attribute mirroring starts in each `AIUXElement`'s
  `connectedCallback` and stops on disconnect. Plain `LitElement`s do not get
  the attribute; use `body[reduced-motion]` or the context.
- There is no `@lit/context` bridge; `ContextConsumer` and `@consume` receive
  nothing.

### Updating

To change the user's setting, save the preference; the context follows:

```js
await setUserPreference('glide.polaris.animation_disabled', String(disabled));
```

`setReducedMotion(value)` changes only the page's value (and the
`reduced-motion` attributes) without saving; `value === true` means reduced.

### Exported helpers

All exported from `@servicenow/aiux-components-core`.

| Export | Signature | Use |
| --- | --- | --- |
| `isReducedMotionEnabled` | `() => boolean` | `reducedMotionContext.get() === true`. Does not subscribe. |
| `setReducedMotion` | `(value: boolean) => void` | Sets the value for the page and notifies subscribers; no save. |
| `reducedMotionAware` | class decorator `(target) => target` | Sets `static reducedMotionAware = true` on the class. `AIUXElement` currently mirrors `reduced-motion` on every instance whether or not the class is marked. Apply it below `@customElement`; placed above it, it throws an `Error` naming the tag (in browsers that support `customElements.getName`). |

```ts
import {customElement} from 'lit/decorators.js';
import {AIUXElement, reducedMotionAware} from '@servicenow/aiux-components-core';

@customElement('acme-carousel')
@reducedMotionAware
export class AcmeCarousel extends AIUXElement {}
```

### Data shapes

```ts
type ReducedMotion = boolean;
```

## Integration details

### SSR

- Not resolved on the server: `reducedMotionContext.get()` is `false` and no
  `reduced-motion` attribute is rendered. Keep motion suppression in CSS
  (applies once the attribute is set in the browser) and start timers or
  animations only in the browser.
- The value is never serialized to the client.
