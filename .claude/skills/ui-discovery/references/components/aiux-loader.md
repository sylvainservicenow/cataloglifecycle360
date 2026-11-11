# Loader

> Source: `@servicenow/aiux-components-loader@0.4.1` · `components/external/loader/docs/usage/aiux-loader.md`

`<aiux-loader>` shows an animation centered in its box. By default it renders a
CSS radial-dot animation; set `variant="sparkle"` for the Sparkmoji sparkle
instead. Both animations are pure CSS and SVG: they need no JavaScript, so they
animate from the first server-rendered paint. It has no loading logic of its
own: the host adds it while work is pending and removes it when done.

Built in: an ARIA status region, an optional text label, and an optional
"Works with ServiceNow" footer.

## Import

```js
import '@servicenow/aiux-components-loader';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-loader';

@customElement('my-incident-panel')
export class MyIncidentPanel extends AIUXElement {
  @property({type: Boolean}) loading = true;
  @property({type: Number}) count = 0;

  render() {
    return this.loading
      ? html`<div class="h-64">
          <aiux-loader size="lg" label="Loading incidents"></aiux-loader>
        </div>`
      : html`<p>${this.count} incidents</p>`;
  }
}
```

**What happens:** the loader fills the 16rem-tall container and centers the
animation and label in it.

### Additional patterns

Sparkle animation with footer, for a branded full-screen loading state:

```js
html`
  <div class="h-screen">
    <aiux-loader variant="sparkle" size="2xl" show-footer></aiux-loader>
  </div>
`;
```

## API

### Properties and attributes

`variant`, `size`, and `showFooter` can also be set by an admin in the platform
Config Editor; an admin value takes precedence over the bound value.

| Property          | Attribute     | Type                            | Default    | Update behavior     | Description                                                                                                                                                                                                                                                                                                         |
| ----------------- | ------------- | ------------------------------- | ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`         | `variant`     | `LoaderVariant`                 | `'radial'` | Updates immediately | Which animation to show: `'radial'` (CSS radial dots) or `'sparkle'` (the Sparkmoji sparkle, a self-contained animated SVG).                                                                                                                                                                                        |
| `size`            | `size`        | `LoaderSize`                    | `'md'`     | Updates immediately | Animation size. Radial dots: `4xs` and `xs` 16px, `3xs` and `sm` 20px, `md` 24px, `lg` 28px, `2xs` and `xl` 32px, `2xl` 64px. Sparkle: `4xs` 16px, `3xs` 20px, `2xs` 32px, `xs` 80px, `sm` 100px, `md` 140px, `lg` 180px, `xl` 220px, `2xl` 256px.                                                                  |
| `label`           | `label`       | `string \| null`                | `null`     | Updates immediately | Text under the animation and the status region's accessible name. With no label, the accessible name is "Loading" and no text shows. The exact value `'Loading...'` renders in small text; any other value renders large.                                                                                           |
| `showFooter`      | `show-footer` | `boolean`                       | `false`    | Updates immediately | Shows "Works with" plus the ServiceNow wordmark at the bottom of the loader's box.                                                                                                                                                                                                                                  |
| `animationConfig` | property only | `LoaderAnimationConfig \| null` | `null`     | Updates immediately | Former Lottie opt-in, kept unchanged for compatibility. Any non-null value renders the sparkle, the same as `variant="sparkle"`. `lottie-web` is no longer loaded and the options are not read, so a config naming a different animation also shows the sparkle. An admin `variant` value takes precedence over it. |

### Events

None.

### Slots

None.

### Methods

None.

### Data shapes

```ts
type LoaderSize =
  '4xs' | '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

type LoaderVariant = 'radial' | 'sparkle';

// Former lottie-web options; accepted for compatibility, not read.
type LoaderAnimationConfig = {
  path?: string;
  animationData?: unknown;
  renderer?: 'svg' | 'canvas' | 'html';
  loop?: boolean | number;
  autoplay?: boolean;
  name?: string;
  rendererSettings?: object;
  initialSegment?: [number, number];
  [option: string]: unknown;
};
```

These types are not exported by the package.

## Integration details

### SSR

Everything renders on the server, and both animations run without
JavaScript: the radial dots are CSS keyframes, and the sparkle is an inline SVG
animated with CSS (rotation) and SMIL (shape morph). A loader in the
server-rendered HTML animates before the page hydrates.

### Sizing and layout

- The host is `display: block; width: 100%; height: 100%`. Give the parent a
  height; the animation and label are centered vertically and horizontally.
- The footer is absolutely positioned at the bottom of the loader's box.

## Accessibility, localization, and customization

- **Accessibility:** the element is a `role="status"`, `aria-live="polite"`,
  `aria-busy="true"` region named by `label`. The animation and footer are
  hidden from assistive technology. Under `prefers-reduced-motion: reduce` the
  radial dots stop animating and the sparkle shows a static frame.
- **Localization:** the default accessible name "Loading" and the footer text
  are localized. `label` is shown as given; translate it.
- **Customization:** `--color-loader-custom` sets the dot color and the
  sparkle's fill (the sparkle falls back to `currentColor`). The label is exposed as
  `::part(label)`. The footer wordmark uses `--color-text-primary`.
