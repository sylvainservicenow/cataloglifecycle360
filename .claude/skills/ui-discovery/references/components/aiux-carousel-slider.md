# Carousel

> Source: `@servicenow/aiux-components-carousel@2.4.1` · `components/external/carousel/docs/usage/aiux-carousel-slider.md`

`<aiux-carousel-slider>` shows the slides in `items` and reports each slide
change through `carousel-content-switch`. The host supplies slide data or
slotted markup. The element fetches no data; the browser loads image URLs.

Built in: previous/next buttons (wrap around), numbered indicator buttons,
autoplay with a pause/resume button, pause on hover and on focus, arrow-key and
Home/End navigation, and a live region that announces "Slide N of M". Do not
build these yourself. `showNavigation`, `showIndicators`, `autoplay`,
`alignment`, and `vertical` can also be set by page admin configuration. An
admin value overrides the bound property.

## Import

```js
import '@servicenow/aiux-components-carousel';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-carousel';

@customElement('my-promo-carousel')
export class MyPromoCarousel extends AIUXElement {
  @state() private _current = 0;

  private _items = [
    // image URLs are your app's own assets
    {
      type: 'image',
      content: '/assets/promo-1.png',
      alt: 'New service portal',
      width: 1200,
      height: 400
    },
    {
      type: 'image',
      content: '/assets/promo-2.png',
      alt: 'Knowledge base refresh',
      width: 1200,
      height: 400
    },
    {content: 'Maintenance window this Saturday, 22:00 UTC'}
  ];

  render() {
    return html`
      <aiux-carousel-slider
        .items=${this._items}
        label="Announcements"
        autoplay="6000"
        @carousel-content-switch=${(e: CustomEvent) => (this._current = e.detail.index)}
      ></aiux-carousel-slider>
      <p>Showing ${this._current + 1} of ${this._items.length}</p>
    `;
  }
}
```

**What happens:** every slide change, including autoplay ticks, scrolls the
slide into view. If the carousel is only partly visible, this also scrolls
the page or the scrolling ancestor.

### Additional patterns

Custom slide markup. Each `item-<index>` slot replaces that slide's default
content, but the slide exists only if `items` has an entry at that index:

```js
html`
  <aiux-carousel-slider .items=${[{}, {}]} .showIndicators=${false}>
    <div slot="item-0" class="p-6">${cardA}</div>
    <div slot="item-1" class="p-6">${cardB}</div>
  </aiux-carousel-slider>
`;
```

## API

### Properties and attributes

Boolean properties that default to `true` cannot be turned off with an
attribute. Use a property binding such as `.showNavigation=${false}`.

| Property         | Attribute              | Type                                                           | Default    | Update behavior                         | Description                                                                                                                                                                                     |
| ---------------- | ---------------------- | -------------------------------------------------------------- | ---------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`          | `items` (JSON)         | `CarouselItem[]`                                               | `[]`       | Updates immediately                     | One slide per entry. If the list shrinks below the active slide, the last slide becomes active and no event fires.                                                                              |
| `showNavigation` | `show-navigation`      | `boolean`                                                      | `true`     | Updates immediately                     | Previous/next buttons overlaid at mid-height on the left and right, including in vertical mode.                                                                                                 |
| `showIndicators` | `show-indicators`      | `boolean`                                                      | `true`     | Updates immediately                     | Numbered buttons (1…n) below the slides. The active one has `aria-current="true"`.                                                                                                              |
| `autoplay`       | `autoplay`             | `number` (ms)                                                  | `0`        | Restarts or stops the timer immediately | Interval between automatic advances. `0` disables autoplay. When > 0, a pause/resume button appears below the slides.                                                                           |
| `alignment`      | `alignment`            | `'start' \| 'center' \| 'end'`                                 | `'center'` | Updates immediately                     | Alignment of slides in the track.                                                                                                                                                               |
| `vertical`       | `vertical` (reflected) | `boolean`                                                      | `false`    | Updates immediately                     | Stacks slides vertically and gives the host a height of `24rem`. Up/Down arrows replace Left/Right.                                                                                             |
| `label`          | `label`                | `string`                                                       | `''`       | Updates immediately                     | Accessible name of the carousel region. Empty uses "Image carousel".                                                                                                                            |
| `onchange`       | property only          | `(arg: {detail: CarouselContentSwitchDetail}) => void \| null` | `null`     | Updates immediately                     | Legacy callback; prefer the event. Called with `{detail}` after each `carousel-content-switch`. Replaces the element's native `onchange`. A non-function value is not called; it logs an error. |

### Events

| Event                     | `detail`                      | Delivery                          | Fires when                                                                   | Notes                                                                                                                                                                 |
| ------------------------- | ----------------------------- | --------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `carousel-content-switch` | `CarouselContentSwitchDetail` | Bubbles, composed, not cancelable | Any slide change: buttons, indicators, keys, autoplay, or the methods below. | Also fires when the target is the current slide, for example Home on the first slide or clicking the active indicator. Out-of-range `goToSlide` calls do not fire it. |

### Slots

- `item-<index>` (0-based, one for each `items` entry): replaces that slide's
  default image or text.

### Methods

| Method                     | Effect                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `goToSlide(index: number)` | Activates that slide and fires `carousel-content-switch`. Out-of-range indexes are ignored. Restarts the autoplay interval. |
| `next()`                   | Next slide. Wraps from the last slide to the first.                                                                         |
| `previous()`               | Previous slide. Wraps from the first slide to the last.                                                                     |

### Data shapes

```ts
interface CarouselItem {
  type?: string; // 'image' renders <img src=content>; anything else (or absent) renders content as plain text
  content?: string; // image URL or text; a slide with no content renders empty unless slotted
  alt?: string; // image alt; defaults to "Slide N"; '' marks the image decorative
  width?: number | string; // <img> width attribute
  height?: number | string; // <img> height attribute
}

type CarouselAlignment = 'start' | 'center' | 'end';

interface CarouselContentSwitchDetail {
  index: number;
  previousIndex: number;
}
```

The package does not export these types.

## Integration details

### SSR

Renders on the server. Autoplay starts only in the browser.

### Lifecycle

- Disconnecting stops autoplay. Reconnecting restarts it when `autoplay` > 0,
  even if the user had paused it.
- The first slide is active initially. The active slide is not a property; use
  the methods to change it.

### Sizing and layout

- `display: block`. Slides fill the width, and height follows the slide
  content. Give images `width`/`height` to reserve space, because they load
  lazily.
- Vertical mode: the host is `24rem` tall with `overflow: hidden`. Set a height
  on the host to change it.
- Inactive slides render at 85% opacity.

## Accessibility, localization, and customization

- **Accessibility:** set `label` to a meaningful name. The region is not in the
  tab order; arrow keys, Home, and End work while focus is on a control inside
  it, but not in inputs, textareas, selects, or contenteditable content.
  Autoplay stops when the pointer or focus enters. Unless paused with the
  button, it restarts when the pointer leaves (focus not checked), when focus
  leaves (pointer not checked), and on every slide change, even from a control
  inside the carousel. With the reduced-motion preference on, autoplay does
  not start and the pause button is hidden, but pointer or focus leaving
  starts it anyway.
  The live region is silent while `autoplay` > 0 and the user has not
  paused it.
- **Localization:** button labels, slide labels, and the default alt text are
  localized. Slide `content` and `alt` are shown as given.
- **Customization:** no parts or custom properties. Colors come from the page's
  DaisyUI theme. Text slides use a `base-200` background. The opacity
  transition uses `--duration-lg` (`--duration-xs` with reduced motion).
