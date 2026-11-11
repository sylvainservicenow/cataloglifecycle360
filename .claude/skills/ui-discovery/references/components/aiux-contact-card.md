# Contact card

> Source: `@servicenow/aiux-contact-card@4.0.2` · `components/external/contact-card/docs/usage/aiux-contact-card.md`

`<aiux-contact-card>` renders the contact data the host passes in: name,
avatar or initials, titles, badges, and label/value fields. It loads nothing.
Clickable titles and fields fire `aiux-contact-card:item-clicked`; the host
performs the action (open a record, start an email, and so on).

Built in: initials fallback, an empty state, and a responsive layout driven
by the card's own width.

## Import

```js
import '@servicenow/aiux-contact-card';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-contact-card';

@customElement('my-caller-card')
export class MyCallerCard extends AIUXElement {
  @property({type: Object}) caller: {
    name: string;
    email: string;
    title: string;
  } | null = null;

  private _onItemClicked(e: CustomEvent) {
    const {type, item} = e.detail;
    if (type === 'field' && item.id === 'email') {
      window.location.href = `mailto:${item.value}`;
    }
  }

  render() {
    if (!this.caller) {
      return html`<aiux-contact-card
        empty
        empty-state-msg="Select a caller."
      ></aiux-contact-card>`;
    }
    return html`
      <aiux-contact-card
        heading-name=${this.caller.name}
        .subHeadingTitles=${[{label: this.caller.title}]}
        .badges=${[{label: 'VIP', color: 'positive'}]}
        .content=${[
          {
            id: 'email',
            label: 'Email',
            value: this.caller.email,
            clickable: true
          }
        ]}
        @aiux-contact-card:item-clicked=${this._onItemClicked}
      ></aiux-contact-card>
    `;
  }
}
```

**What happens:** without `headingName` (and without `empty`) the element
renders nothing. `item` in the event is the same object you passed in, so
put an `id` on items you need to tell apart.

## API

### Properties and attributes

`badges`, `subHeadingTitles`, and `content` are property only; pass a new
array to update them (in-place changes are not observed). Properties
marked "Config Editor" are also admin-overridable per instance; an admin
value wins over the one set in code.

| Property           | Attribute               | Type                         | Default             | Update behavior        | Description                                                                                                                                                     |
| ------------------ | ----------------------- | ---------------------------- | ------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `headingName`      | `heading-name`          | `string`                     | `''`                | Updates immediately    | Contact name. Required; also the source of the initials and the default `aria-label`. Long names wrap.                                                          |
| `avatarSrc`        | `avatar-src`            | `string`                     | `''`                | Updates immediately    | Image URL for a 32 px round avatar. Empty shows initials (first letters of the first and last words).                                                           |
| `headingLevel`     | `heading-level`         | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `3`                 | Updates immediately    | Heading element for the name (`h1`–`h6`); other values use `h3`. Does not change the style.                                                                     |
| `headingVariant`   | `heading-variant`       | `HeadingVariant`             | `'header-tertiary'` | Updates immediately    | Config Editor. Text style of the name.                                                                                                                          |
| `subHeadingTitles` | property only           | `SubHeadingTitle[]`          | `[]`                | On new array reference | Titles on one line under the name, separated by dividers and truncated. Entries with a blank `label` are skipped. `clickable` renders a link-styled button.     |
| `badges`           | property only           | `ContactBadge[]`             | `[]`                | On new array reference | Shown beside the name; the first three with a non-blank `label`. `color` defaults to `low`.                                                                     |
| `content`          | property only           | `ContactField[]`             | `[]`                | On new array reference | Label/value grid below the header. Entries with a blank `label` or `value` are skipped. `clickable` renders the value as a link-styled button.                  |
| `hideBorder`       | `hide-border`           | `boolean`                    | `false`             | Updates immediately    | Config Editor. Removes the border, rounded corners, and 16 px padding.                                                                                          |
| `empty`            | `empty`                 | `boolean`                    | `false`             | Updates immediately    | Shows the empty state instead of the contact.                                                                                                                   |
| `emptyStateTitle`  | `empty-state-title`     | `string`                     | `''`                | Updates immediately    | Empty-state heading. Empty uses localized "No contact selected".                                                                                                |
| `emptyStateMsg`    | `empty-state-msg`       | `string`                     | `''`                | Updates immediately    | Empty-state body text; hidden when blank.                                                                                                                       |
| `ariaLabel`        | `aria-label` (reflects) | `string \| null`             | `null`              | Updates immediately    | Host accessible name. When unset, the element sets it to `headingName` (or the empty-state heading when `empty`) and keeps it in sync. A value you set is kept. |
| `role`             | `role` (reflects)       | `string \| null`             | `'group'`           | Updates immediately    | Host ARIA role.                                                                                                                                                 |

Badge colors map to DaisyUI soft badges: `critical`, `high` → error;
`warning`, `moderate`, `orange`, `yellow` → warning; `positive`, `green`,
`green-yellow` → success; `info`, `teal` → info; `blue` → primary;
`magenta`, `purple` → secondary; `pink` → accent; `low`, `brown`, `gray` →
neutral.

### Events

| Event                            | `detail`                     | Delivery                          | Fires when                                                                                               | Notes                                                 |
| -------------------------------- | ---------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `aiux-contact-card:item-clicked` | `ContactCardItemClickDetail` | Bubbles, composed, not cancelable | The user activates a clickable title (`type: 'title'`) or field (`type: 'field'`), by click or keyboard. | Non-clickable items render as text and never fire it. |

### Slots

None.

### Methods

None.

### Data shapes

```ts
type HeadingVariant =
  | 'header-primary' // 2xl bold
  | 'header-secondary' // xl bold
  | 'header-tertiary' // lg normal
  | 'title-primary' // base semibold
  | 'title-secondary' // sm semibold
  | 'title-tertiary'; // xs medium

type BadgeColor =
  | 'critical'
  | 'high'
  | 'warning'
  | 'moderate'
  | 'positive'
  | 'info'
  | 'low'
  | 'magenta'
  | 'pink'
  | 'orange'
  | 'yellow'
  | 'brown'
  | 'green'
  | 'green-yellow'
  | 'blue'
  | 'gray'
  | 'teal'
  | 'purple';

interface ContactBadge {
  label: string;
  color?: BadgeColor;
}

interface SubHeadingTitle {
  label: string;
  clickable?: boolean;
  id?: string;
}

interface ContactField {
  label: string;
  value: string;
  clickable?: boolean;
  id?: string;
}

interface ContactCardItemClickDetail {
  type: 'title' | 'field';
  item: SubHeadingTitle | ContactField; // the object from your array
}
```

These types are not exported from the package entry.

## Integration details

### Sizing and layout

- `display: block; width: 100%`. Layout follows the card's own width:
  fields use 6 columns at 1024 px and wider, 3 by default, 2 at 471 px or
  narrower, 1 below 320 px. At 320 px or narrower the avatar moves above the
  name; below 320 px the header stacks.
- Badges share the header row with the name and truncate when space runs out.
- The empty-state illustration is loaded from
  `/aiux/assets/core/icons/window-question--theme.svg` on the serving origin.

## Accessibility, localization, and customization

- **Accessibility:** the host is `role="group"` named by `headingName` unless
  you set `aria-label`. Fields are a `<dl>`; clickable items are native
  buttons, so keyboard activation works. Set `headingLevel` to fit the page
  outline.
- **Localization:** list labels ("Titles", "Status badges", "Contact
  details") and the default empty-state heading are localized. All contact
  text is host-supplied.
- **Customization:** no parts or element-specific custom properties. The name
  and links use the theme's primary color ramp; badges use DaisyUI badge
  colors.
