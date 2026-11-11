# Filter overview (`cb-filter-overview`)

> Source: `@servicenow/aiux-components-condition-builder@4.0.20` · `components/condition-builder/docs/usage/cb-filter-overview.md`

`<cb-filter-overview>` renders one pill per condition of an encoded query, plus locked pills for an optional fixed query, and a "Show more / Show less" toggle when the pills wrap past one row. The host sets the table and the encoded query and wraps the element in `<cb-store-provider>`, which decodes the query. The element reports changes through `cb-encoded-query-updated`; the host must write the new query back to both elements. Pill labels, "or" prefixes, condition-set dividers, the dismiss button, the pill menu, and overflow handling are built in.

## Import

```js
import '@servicenow/aiux-components-condition-builder';
```

This one import registers `cb-filter-overview` and `cb-store-provider`. Their classes are exported as `CbFilterOverview` and `CbStoreProvider`.

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-condition-builder';
import type {CbEncodedQueryUpdatedDetail} from '@servicenow/aiux-components-condition-builder';

@customElement('my-incident-filters')
export class MyIncidentFilters extends AIUXElement {
  @state() private _query = 'active=true^priority=1^ORpriority=2';

  private _handleQueryUpdated = (e: CustomEvent<CbEncodedQueryUpdatedDetail>) => {
    this._query = e.detail.encodedQuery;
  };

  render() {
    return html`
      <cb-store-provider
        table-name="incident"
        .encodedQuery=${this._query}
      >
        <cb-filter-overview
          .tableName=${'incident'}
          .encodedQuery=${this._query}
          @cb-encoded-query-updated=${this._handleQueryUpdated}
        ></cb-filter-overview>
      </cb-store-provider>
    `;
  }
}
```

**What happens:** while the first decode is in flight, skeleton pills show. Then one pill per condition appears; a condition joined with `^OR` shows an "or" prefix, and condition sets (`^NQ`) are separated by an "OR" divider. Clicking a pill's X removes it immediately and fires `cb-encoded-query-updated`. The host stores `detail.encodedQuery`, which flows back into both elements and triggers a re-decode.

### Additional patterns

Locked scope pills, pill menu, and host-handled menu actions:

```ts
html`
  <cb-store-provider
    table-name="incident"
    .encodedQuery=${this._query}
    .fixedEncodedQuery=${this._fixedQuery}
  >
    <cb-filter-overview
      .tableName=${'incident'}
      .encodedQuery=${this._query}
      .fixedEncodedQuery=${this._fixedQuery}
      .showMenu=${true}
      .showCopyQuery=${true}
      .showOpenEditor=${true}
      @cb-encoded-query-updated=${this._handleQueryUpdated}
      @cb-editor-opened=${this._openEditor}
      @cb-copy-query=${this._showCopiedToast}
    ></cb-filter-overview>
  </cb-store-provider>
`;
```

## API

### cb-filter-overview

#### Properties and attributes

Attributes are the lowercased property names (not kebab-case). Boolean attributes can only turn a flag on; set boolean properties (`.showFixedFilters=${false}`) to turn one off or to bind dynamically.

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `encodedQuery` | `encodedquery` | `string` | `''` | Updates immediately | The query this bar represents. Used only to decide whether to render (nothing renders when both this and `fixedEncodedQuery` are empty) and to size the skeleton. The pills come from what the enclosing `cb-store-provider` decoded, so feed the provider the same query. |
| `fixedEncodedQuery` | `fixedencodedquery` | `string` | `''` | Updates immediately | Locked query. Its conditions render first as non-dismissible pills with a lock icon. Gate rendering the same way as `encodedQuery`; the provider must decode it too. |
| `tableName` | `tablename` | `string` | `''` | Updates immediately | ServiceNow table name, passed to each pill as its field source. Decoding uses the provider's `table-name`. |
| `isSimple` | `issimple` | `boolean` | `false` | Updates immediately | Colon pill labels ("Priority: 1 - High"); `!=` conditions keep the operator form ("State is not Resolved"). Use when the conditions come from a simple/basic filter panel. Also controls which conditions are dropped on re-encode: in simple mode "is anything" conditions are dropped, in advanced mode they are kept. |
| `readOnly` | `readonly` | `boolean` | `false` | Updates immediately | Display only. No dismiss buttons and no menus. Overrides every `show*` menu flag. |
| `showFixedFilters` | `showfixedfilters` | `boolean` | `true` | Updates immediately | When `false`, locked pills are not rendered even if `fixedEncodedQuery` is set. |
| `showMenu` | `showmenu` | `boolean` | `false` | Updates immediately | Replaces each normal pill's X with a dropdown (chevron). It always has "Delete condition" and "Delete all after" (the latter omitted on the last pill). Ignored when `readOnly`. Locked pills never get a menu. On related-list sub-condition pills "Delete all after" is shown (except on the last one) but does nothing, and "Copy query" and "Open new window" are not offered; any menu choice on the related-list table pill removes the whole related-list condition. |
| `showCopyQuery` | `showcopyquery` | `boolean` | `false` | Updates immediately | Adds "Copy query" to the menu. Only has an effect when `showMenu` is `true`. |
| `showOpenNewWindow` | `showopennewwindow` | `boolean` | `false` | Updates immediately | Adds "Open new window" to the menu. Only has an effect when `showMenu` is `true`. |
| `showOpenEditor` | `showopeneditor` | `boolean` | `false` | Updates immediately | Adds "Open editor" to the menu. Only has an effect when `showMenu` is `true`. |
| `showInlineEditor` | `showinlineeditor` | `boolean` | `false` | Not supported | Not supported; leave unset. |
| `popoverContainer` | property only | `HTMLElement \| null` | `null` | Updates immediately | Element that menu popovers are appended to instead of `document.body`. |

#### Events

All events bubble and are composed. None is cancelable. Events fire only from user interaction in the browser.

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `cb-encoded-query-updated` | [`CbEncodedQueryUpdatedDetail`](#data-shapes) | `bubbles: true`, `composed: true` | A pill is dismissed, "Delete condition" or "Delete all after" is chosen, or a related-list pill or sub-condition is removed. | Use `detail.encodedQuery` as the new query; it does not include the fixed query, and `fixedEncodedQuery` is always `''` (see Data shapes). The element does not change its own `encodedQuery`; the host must. The pill is removed locally first, before the host responds. |
| `cb-copy-query` | [`CbEncodedQueryUpdatedDetail`](#data-shapes) | `bubbles: true`, `composed: true` | "Copy query" is chosen. | The element already writes `combinedEncodedQuery` (fixed plus normal conditions up to and including that pill) to the clipboard. Use the event only for feedback such as a toast. Not fired for related-list pills. Requires a secure context; without one, no clipboard write happens and `cb-copy-query` does not fire. |
| `cb-editor-opened` | `{}` | `bubbles: true`, `composed: true` | "Open editor" is chosen. | No other side effect; the host opens its own editor. |

"Open new window" fires no event: it calls `window.open` on the current page URL with `sysparm_query` set to the conditions up to and including that pill (and `sysparm_fixed_query` backfilled from the fixed query when the URL has none).

#### Slots

None.

#### Methods

None.

### cb-store-provider

Required ancestor of `cb-filter-overview`. It decodes the query in the browser and shares the result with descendant elements. It renders only its slotted children (`display: contents`).

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `tableName` | `table-name` | `string` | `''` | Re-decodes the query | Table the queries target. |
| `encodedQuery` | `encoded-query` | `string` | `''` | Re-decodes the query | The query to decode and share. Keep it equal to the filter overview's `encodedQuery`. |
| `fixedEncodedQuery` | `fixed-encoded-query` | `string` | `''` | Re-decodes the query | Locked query, decoded alongside `encodedQuery`. |
| `contextHost` | property only | `HTMLElement \| null` | `null` | Applies immediately | Set when the provider is rendered inside a shadow root around a `<slot>`: slotted consumers then resolve the provider through this host element. |

#### Events

None.

#### Slots

Default slot: the elements that consume the decoded result, such as `cb-filter-overview`.

#### Methods

None.

### Data shapes

`cb-encoded-query-updated` and `cb-copy-query` both carry this shape. `CbEncodedQueryUpdatedDetail` is the exported type.

```ts
interface CbEncodedQueryUpdatedDetail {
  encodedQuery: string;
  fixedEncodedQuery: string;
  combinedEncodedQuery: string;
}
```

| Event | `encodedQuery` | `fixedEncodedQuery` | `combinedEncodedQuery` |
| --- | --- | --- | --- |
| `cb-encoded-query-updated` | The new query, rebuilt from the normal conditions; keeps related list conditions, sort and the first group-by. | Always `''`. | Equal to `encodedQuery`. Combine with your own fixed query before querying records. |
| `cb-copy-query` | Normal conditions up to and including the chosen pill, plus related list conditions. | The fixed conditions re-encoded (no sort or group-by). | Fixed conditions, then `encodedQuery`; no sort or group-by. |

## Integration details

### Platform requirements

- A `cb-store-provider` ancestor is required for pills to appear. It owns the decode (a call to the instance, so a signed-in session is needed) and shares one result with the filter overview. Set its `table-name`, `encoded-query`, and `fixed-encoded-query` (attributes, or the properties `tableName`, `encodedQuery`, `fixedEncodedQuery`) to the same values as the filter overview. Without a provider no pills appear.
- The element shows whatever the provider decoded. It does not check that the decode matches its own `encodedQuery`.
- One provider per table and query; give each independent filter bar its own provider.

### SSR

- On the server the provider does not decode, and `firstUpdated` does not run. When `encodedQuery` contains conditions the server renders the skeleton; with only a `fixedEncodedQuery` nothing renders until the browser decode settles; with both empty it renders nothing. Pills appear after hydration.
- The ResizeObserver is created only in the browser.

### Lifecycle

- The skeleton shows on the first decode only. Later re-decodes keep the previous pills visible until the new result arrives.
- If the decode fails, the bar renders nothing; no event fires.
- Dismissal is optimistic: the pill disappears at once, and the host's new `encodedQuery` re-decodes in the background.
- After an X or "Delete condition" dismiss of a normal pill, or a sub-condition dismiss, focus moves to the next pill, or to the previous one when the last was removed. Focus does not move after "Delete all after" or after the related-list table pill is removed.
- Disconnecting the element unsubscribes from the provider and stops the resize observer.

### Sizing and layout

- `display: block`; width follows the container.
- Collapsed, pills wrap but are clipped to a single row (32px). When they overflow, a "Show more" button appears. Expanded, the area grows to at most 224px and scrolls vertically.
- The element adds 16px of bottom padding.
- Renders nothing (zero height) when there are no visible conditions. Conditions with no field selected never render.

## Accessibility, localization, and customization

- Renders a `region` labelled "Active filters" containing a `list` of pills. Condition-set dividers have `role="separator"`. The skeleton is `aria-busy` and decorative.
- Arrow keys (RTL-aware), Home, and End move focus between pills. On a pill with a menu, Enter, Space, ArrowDown and ArrowUp open the menu. Every pill is a tab stop (in dismissible mode the stop is its X button).
- The "Show more / Show less" toggle sets `aria-expanded` and `aria-controls`.
- All built-in strings ("Active filters", "OR", "Show more", "Show less", menu labels) are localized through the platform message catalog; there are no string properties to override.
- No slots, parts, or documented CSS custom properties. Pill styling uses the platform theme tokens.
