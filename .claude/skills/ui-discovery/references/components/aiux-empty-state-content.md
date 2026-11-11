# Empty state content

> Source: `@servicenow/aiux-components-empty-state-content@2.4.1` · `components/external/empty-state-content/docs/usage/aiux-empty-state-content.md`

`<aiux-empty-state-content>` renders a centered placeholder: an icon (or a
slotted illustration), heading, body text, and an optional action slot. It is
presentational: it dispatches no events, and any action button you slot in is
yours to handle.

## Import

```js
import '@servicenow/aiux-components-empty-state-content';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-empty-state-content';

@customElement('my-no-results')
export class MyNoResults extends AIUXElement {
  private _clearFilters() {
    // The page that owns the filters listens for this and resets them.
    this.dispatchEvent(
      new CustomEvent('my-clear-filters', {bubbles: true, composed: true})
    );
  }

  render() {
    return html`
      <div class="h-64">
        <aiux-empty-state-content
          icon="circle-question-outline"
          heading-text="No results found"
          body-text="Try adjusting your filters."
          show-action
        >
          <button
            slot="action"
            class="aiux-btn aiux-btn-primary"
            @click=${this._clearFilters}
          >
            Clear filters
          </button>
        </aiux-empty-state-content>
      </div>
    `;
  }
}
```

### Additional patterns

Illustration instead of an icon:

```js
html`
  <aiux-empty-state-content asset="illustration" heading-text="No reports yet">
    <img slot="illustration" src=${chartUrl} alt="" class="w-20 h-20" />
  </aiux-empty-state-content>
`;
```

## API

### Properties and attributes

| Property       | Attribute        | Type                       | Default                     | Update behavior     | Description                                                                                                                            |
| -------------- | ---------------- | -------------------------- | --------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `asset`        | `asset`          | `'icon' \| 'illustration'` | `'icon'`                    | Updates immediately | `icon` renders `iconName`; `illustration` renders the `illustration` slot.                                                             |
| `iconName`     | `icon`           | `string` (icon name)       | `'circle-question-outline'` | Updates immediately | Icon from the `@servicenow/aiux-directive-icon` set, rendered large at 50% opacity. `asset="icon"` only. Empty string renders no icon. |
| `headingText`  | `heading-text`   | `string`                   | `''`                        | Updates immediately | Heading line. Not rendered when empty.                                                                                                 |
| `bodyText`     | `body-text`      | `string`                   | `''`                        | Updates immediately | Secondary text under the heading. Not rendered when empty.                                                                             |
| `showBodyText` | `show-body-text` | `boolean`                  | `true`                      | Updates immediately | Set `false` with a property binding (`.showBodyText=${false}`); an absent attribute does not mean `false`.                             |
| `showAction`   | `show-action`    | `boolean`                  | `false`                     | Updates immediately | Renders the `action` slot. With nothing slotted, shows a primary "Action" button that does nothing.                                    |

### Events

None.

### Slots

- `action`: rendered only when `showAction` is `true`, centered under the text.
  Typically one button.
- `illustration`: rendered only when `asset="illustration"`, inside an 80 × 80 px
  centered box. Defaults to a bar-chart icon.

### Methods

None.

### Data shapes

No component-specific types.

## Integration details

### Sizing and layout

The host is `display: flex` with `width: 100%; height: 100%` and centers its
content both ways; give the parent a height to center vertically. Content is
capped at 24rem wide.

## Accessibility, localization, and customization

- **Accessibility:** `headingText` renders as a paragraph, not a heading
  element. Give an illustration image its own `alt`.
- **Localization:** pass translated `headingText` and `bodyText`. The fallback
  "Action" label is localized.
- **Customization:** no styling hooks; text colors come from the page's DaisyUI
  theme.
