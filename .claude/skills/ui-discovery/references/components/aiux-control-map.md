# aiux-control-map

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-map.md`

Address field that geocodes what the user types (or selects from suggestions) via the Google Maps Geocoding/Places APIs and shows the result as a pin on an inline map preview. Reports the address string plus resolved `{lat, lng}` coordinates.

Built in: address-suggestion typeahead (debounced, Places Autocomplete), geocode-by-place-ID and geocode-by-address resolution with request cancellation, and the inline Google Map (marker, custom zoom controls, auto-recenter on blur). Do not build these yourself.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
import '@servicenow/aiux-components-control';
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';

class MyForm extends AIUXElement {
  render() {
    return html`
      <aiux-control-map
        name="office_address"
        label="Office address"
        api-key="YOUR_GOOGLE_MAPS_API_KEY"
        .value=${'Seattle, WA'}
        @AIUX_CONTROL_MAP#VALUE_CHANGED=${this._onChange}
      ></aiux-control-map>
    `;
  }

  _onChange(e) {
    const {value, coordinates, name} = e.detail;
    // coordinates is {lat, lng} or null if geocoding failed / value was cleared
  }
}
```

**What happens:** on connect, a non-empty `value` is geocoded immediately. As the user types, address suggestions are fetched (debounced 300ms, 2+ characters) and shown in the typeahead dropdown; selecting one geocodes by place ID (a single precise call), while confirming free text geocodes the address string as a fallback. Each resolution dispatches `AIUX_CONTROL_MAP#VALUE_CHANGED`. The map preview only renders when `api-key` is set and `value` is non-empty.

**Gotcha:** picking a suggestion from the typeahead rewrites `value` to that suggestion's canonical short address string (e.g. `'Seattle, WA, USA'`), not the raw text the user typed or the full display label shown in the dropdown. Expect `value` in `AIUX_CONTROL_MAP#VALUE_CHANGED` to differ from whatever the user last typed even though they didn't retype anything themselves — persist `detail.value`, not your own copy of the typed text.

### Additional patterns

Without an API key, the map preview is omitted entirely and only the address typeahead is rendered — no map container is added to the DOM. Geocoding and suggestion-fetch calls are still attempted (the control does not skip them based on `api-key`); they simply fail against the Google Maps APIs without a valid key.

Readonly display (e.g. a record detail page):

```js
html`
  <aiux-control-map
    name="office_address"
    label="Location"
    api-key="YOUR_GOOGLE_MAPS_API_KEY"
    .value=${'Eiffel Tower, Paris, France'}
    ?readonly=${true}
  ></aiux-control-map>
`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `apiKey` | `api-key` | `string` | `''` | Read on every geocode/suggestion/map-init call. | Google Maps API key. Required for both the map preview and geocoding; a missing key logs a `console.warn` on connect and suppresses the map preview, but geocode/suggestion requests are still attempted (and will fail) without it. |
| `mapId` | `map-id` | `string` | `'aiux-control-map'` | Read when initializing the map. | Google Maps Map ID (registered in Google Cloud Console); required for the `AdvancedMarkerElement` pin. |
| `zoom` | `zoom` | `number` | `12` | Re-renders/updates the live map's zoom; also updated in the other direction when the user uses the map's own zoom controls. | Map zoom level (1–21). |
| `value` | `value` (reflects) | `string` | `''` | On external change (while not focused), re-geocodes the new address by string; clearing it resets the map. | The address string. |
| `name` | `name` | `string` | `''` | Falls back to `'map-address'` for the nested typeahead's own `name` if unset. | Field name; echoed in event `detail`. |
| `placeholder` | `placeholder` | `string` | `''` | — | Overrides the default `'Enter address…'` placeholder. |

Also inherited and functional: `label` (also used as the nested typeahead's `aria-label`), `disabled`, `readonly`, `required`, `invalid`, `helperContent`, `fieldLayout`, `variant`, `editMode` (the map preview is only shown in `FormFieldEditMode.DEFAULT`), `wrapLabel`, `hideRequiredIndicator`, `showUnsavedIndicator`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator`, `messages`, `nowId`.

Also inherited but **not** applied by this control's own template: `controlStyles` (the raw-CSS binding is never read by `aiux-control-map`'s render logic).

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_MAP#VALUE_CHANGED` | `{name, value, coordinates}` | bubbles, composed, cancelable | After a suggestion is selected and geocoded, after free-text is confirmed and geocoded, or when the value is cleared. | `value` is the address string; `coordinates` is `{lat, lng}` on success or `null` if geocoding failed or the value was cleared. There is no staged/intermediate event from this control itself — the nested typeahead's own staged event only drives the internal suggestion fetch and is not re-dispatched. |

### Slots

None (no default or named slots).

### Methods

| Method | Description |
| --- | --- |
| `focus(options?)` | Moves focus to the nested address typeahead input. |
| `reset()` | Inherited from the base control. |

## Integration details

Requires a Google Maps API key with the **Maps JavaScript API**, **Geocoding API**, and **Places API (New)** enabled, and a registered Map ID for the marker. Without an API key, the map never renders and geocode/suggestion requests will fail, though the control still attempts them (it does not gate the calls on `api-key` being set).

### SSR

Guarded for SSR: map rendering, geocoding, and the Google Maps loader are all skipped when `isServer` is true.

### Lifecycle

Geocoding requests (by address or by place ID) race a 10-second timeout and abort the previous in-flight request when a new one starts; all in-flight requests, the debounced suggestion fetch, and the Google Map instance are cleaned up on disconnect.

### Sizing and layout

Uses the shared form-field grid layout (`fieldLayout`). The map preview has a fixed height (`192px`, documented as four standard input rows) and is not configurable via a property.

## Accessibility, localization, and customization

Built-in: the map itself is `gestureHandling: 'none'` (display-only, not interactive) with custom `+`/`−` zoom-control buttons carrying their own aria-labels; the address input is a full `aiux-control-typeahead` with its own keyboard support. Error/empty-state copy ("Address not found", "Map failed to load", the default placeholder) is produced through `@lit/localize` `msg()` — hard-coded English source, not host-settable via a property, but translatable. Styling is Tailwind-based with no exposed `::part()` targets or CSS custom properties; the inherited `controlStyles` raw-CSS binding is not applied by this control.
