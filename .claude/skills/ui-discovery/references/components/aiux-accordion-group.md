# Accordion group

> Source: `@servicenow/aiux-components-accordion@1.4.2` · `components/external/accordion/docs/usage/aiux-accordion-group.md`

`<aiux-accordion-group>` renders one collapsible section per entry in `items`.
The element keeps open/closed state itself and reports each toggle through an
event; it never writes back to `items`.

Built in: single-open mode (opening one closes the others), disabled items,
arrow/plus expand icons, and keyboard navigation between headers.

## Import

```js
import '@servicenow/aiux-components-accordion';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-accordion';

@customElement('my-faq')
export class MyFaq extends AIUXElement {
  // Stable reference: a new array on each render would reset open state.
  private _items = [
    {
      title: 'How do I reset my password?',
      content: 'Use the Forgot password link.',
      open: true
    },
    {
      title: 'Who approves my request?',
      content: 'Your manager, then the service owner.'
    },
    {title: 'Archived topics', content: '', disabled: true}
  ];

  render() {
    return html`
      <aiux-accordion-group
        .items=${this._items}
        icon="arrow"
        bordered
        heading-level="3"
      ></aiux-accordion-group>
    `;
  }
}
```

**What happens:** assigning a new `items` array resets every section to its
item's `open` value, discarding the user's toggles.

### Additional patterns

Custom title and content markup for item 0 (slot names use the item index;
`this._details` is a stable host field such as `[{title: 'Details', content: ''}]`):

```js
html`
  <aiux-accordion-group .items=${this._details} icon="plus">
    <span slot="title-0"
      >Details <span class="aiux-badge aiux-badge-info">New</span></span
    >
    <div slot="content-0"><a href="/kb/123">Read the article</a></div>
  </aiux-accordion-group>
`;
```

## API

### Properties and attributes

| Property       | Attribute       | Type                      | Default | Update behavior                         | Description                                                                                                                                        |
| -------------- | --------------- | ------------------------- | ------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`        | `items` (JSON)  | `AccordionItem[]`         | `[]`    | Resets open state to each item's `open` | Sections, in order. Use a property binding.                                                                                                        |
| `multiple`     | `multiple`      | `boolean`                 | `false` | Next toggle                             | `false`: opening a section closes all others. Initial `open` values are not normalized. Switching to `false` does not close sections already open. |
| `icon`         | `icon`          | `'arrow' \| 'plus' \| ''` | `''`    | Updates immediately                     | Expand indicator at the end of each header. `''` (or any other value) shows none.                                                                  |
| `bordered`     | `bordered`      | `boolean`                 | `false` | Updates immediately                     | Bordered sections on `base-100`; otherwise borderless on `base-200`.                                                                               |
| `headingLevel` | `heading-level` | `number`                  | `2`     | Updates immediately                     | `aria-level` of each header. Clamped to 1–6.                                                                                                       |

### Events

| Event                         | `detail`                         | Delivery                          | Fires when                                                   | Notes                                                                                                                                  |
| ----------------------------- | -------------------------------- | --------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `accordion-group:item-toggle` | `AccordionGroupItemToggleDetail` | Bubbles, composed, not cancelable | The user opens or closes a section (click, Enter, or Space). | Fires once for the clicked section only, not for sections closed by single-open mode. Not fired for disabled items or `items` changes. |
| `accordion-item-clicked`      | `AccordionGroupItemToggleDetail` | Bubbles, composed, not cancelable | Immediately after every `accordion-group:item-toggle`.       | Same detail. Kept for backward compatibility; listen to `accordion-group:item-toggle`.                                                 |

### Slots

- `title-{index}`: replaces the header text of item `index`. It renders inside
  the header `<button>`, so do not slot interactive elements.
- `content-{index}`: replaces the body text of item `index`.

### Methods

None.

### Data shapes

```ts
interface AccordionItem {
  title: string;
  content: string; // rendered as plain text
  open?: boolean; // initial state, re-applied whenever items changes
  disabled?: boolean; // header cannot be toggled or focused
}

interface AccordionGroupItemToggleDetail {
  index: number;
  title: string;
  open: boolean; // state after the toggle
}
```

The package does not export these types.

## Integration details

### SSR

Renders on the server, including sections marked `open`.

### Sizing and layout

`display: block`; sections stack with a small gap. Collapsed content takes no
space.

## Accessibility, localization, and customization

- **Accessibility:** each header is a button with `aria-expanded` inside a
  `role="heading"` at `headingLevel`; set it to fit the page outline. Arrow
  Up/Down (wrapping), Home, and End move focus between enabled headers. Closed
  panels are inert. Animations are reduced when the user's reduced-motion
  preference is on.
- **Localization:** no built-in text; pass translated `title` and `content`.
- **Customization:** no styling hooks beyond `bordered` and `icon`; colors come
  from the DaisyUI theme (`base-100`/`200`/`300`).
