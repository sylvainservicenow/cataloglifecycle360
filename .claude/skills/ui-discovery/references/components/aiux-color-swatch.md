# Color swatch

> Source: `@servicenow/aiux-color-swatch@4.0.2` · `components/external/color-swatch/docs/usage/aiux-color-swatch.md`

`<aiux-color-swatch>` shows `mainColor` as a swatch. Clicking it opens a
picker (saturation/brightness area, hue slider, HEX/RGB/HSL inputs, preview,
Cancel and Save). Save fires `aiux-color-swatch:color-set` with the new hex
and shows it on the swatch until `mainColor` changes. The host owns the value:
set `mainColor` from the event to keep it.

## Import

```js
import '@servicenow/aiux-color-swatch';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-color-swatch';

@customElement('my-category-color')
export class MyCategoryColor extends AIUXElement {
  @state() private _color = {hex: '#1f6feb'};

  render() {
    return html`
      <aiux-color-swatch
        label="Category color"
        .mainColor=${this._color}
        @aiux-color-swatch:color-set=${(e: CustomEvent) =>
          (this._color = {hex: e.detail.hexValue})}
      ></aiux-color-swatch>
    `;
  }
}
```

**What happens:** the picker does not start from `mainColor`. It opens at
`#ff0000` the first time and afterwards at the color the user last left in
it, including after Cancel. After Save the swatch shows the saved color until `mainColor` is set
again.

## API

### Properties and attributes

Attributes are lowercased property names; none reflect. Set `mainColor` and
`a11yColorPickerConfig` with a property binding.

| Property                                                            | Attribute                  | Type                                                                           | Default                | Update behavior         | Description                                                                                                                                                                                            |
| ------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------ | ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `mainColor`                                                         | `maincolor` (JSON)         | `ColorValue`                                                                   | `{hex: '#000000'}`     | On new object reference | Swatch color. `hex` accepts `#rgb`, `#rrggbb`, `rgb(r, g, b)`, or `hsl(h, s%, l%)`. An empty or unconvertible `rgb()`/`hsl()` value renders nothing. A new object replaces the color shown after Save. |
| `label`                                                             | `label`                    | `string`                                                                       | `''`                   | Updates immediately     | Used in the swatch's accessible name; not shown. Non-empty: 64 × 24 px swatch. Empty: 16 × 16 px swatch.                                                                                               |
| `disabled`                                                          | `disabled`                 | `boolean`                                                                      | `false`                | Updates immediately     | The picker does not open. The swatch stays focusable.                                                                                                                                                  |
| `disablePalette`                                                    | `disablepalette`           | `boolean`                                                                      | `false`                | Updates immediately     | Hides the HEX/RGB/HSL format tabs, leaving the inputs of the current format (HEX until the user switches).                                                                                             |
| `showBorderForLowContrast`                                          | `showborderforlowcontrast` | `boolean`                                                                      | `false`                | Updates immediately     | Adds a border when the color has less than 3:1 contrast with white; the swatch is then 16 × 16 px.                                                                                                     |
| `compEditPanelProp`                                                 | `compeditpanelprop`        | `string`                                                                       | `''`                   | Updates immediately     | Non-empty: 24 × 24 px tile filled with the color, bordered when low-contrast with white. `'BORDER_COLOR_PROP'`: the tile shows a white 14 × 14 px center.                                              |
| `variantId`                                                         | `variantid`                | `string`                                                                       | `''`                   | Updates immediately     | Echoed as `variantId` in `color-set`.                                                                                                                                                                  |
| `a11yColorPickerConfig`, `showA11yColorPicker`, `showA11yIndicator` | lowercased (first is JSON) | `{comparisonColor?: string; contrastTypeCheck?: string}`, `boolean`, `boolean` | `{}`, `false`, `false` | —                       | Not currently used; they enable no contrast checking.                                                                                                                                                  |

### Events

| Event                                   | `detail`                    | Delivery                          | Fires when                                                                                              | Notes                                                                                               |
| --------------------------------------- | --------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `aiux-color-swatch:color-set`           | `ColorSwatchColorSetDetail` | Bubbles, composed, not cancelable | The user clicks Save.                                                                                   | Fires even if the color is unchanged. `value`, `hexValue`, and `hook` all hold the saved `#rrggbb`. |
| `aiux-color-swatch:color-picker-closed` | `ColorPickerClosedDetail`   | Bubbles, composed, not cancelable | The picker closes for any reason: Save, Cancel, Escape, an outside click, or clicking the swatch again. | `isA11yColorPicker` is always `true`.                                                               |

### Slots

None.

### Methods

None.

### Data shapes

```ts
interface ColorValue {
  id?: string; // token name; used in the accessible name and colorKey
  hex: string;
}

interface ColorSwatchColorSetDetail {
  colorKey: string; // `--${mainColor.id ?? ''}`
  value: string;
  variantId: string;
  isCustom: boolean; // always true
  hexValue: string;
  hook: string;
  pickerOpenFromInteraction?: boolean; // never set
}

interface ColorPickerClosedDetail {
  isA11yColorPicker: boolean;
}
```

These types are not exported from the package entry.

## Integration details

### SSR

The swatch renders on the server; the picker works only in the browser.

### Sizing and layout

- `display: block`; the swatch sits at the inline start.
- The picker is a 240 px wide popover attached to `document.body`, placed
  below the swatch.

## Accessibility, localization, and customization

- **Accessibility:** set `label`; the swatch is a `role="button"` whose name
  reads "`<label>` selector. hex `<color>` selected". The saturation/brightness
  area is focusable; arrow Left/Right change saturation and Up/Down change
  brightness in 2% steps. Inputs apply on `change` (blur or Enter); the HEX
  input accepts only full `#rrggbb`.
- **Localization:** labels, buttons, and accessible names are localized.
- **Customization:** no parts or element-specific custom properties. The
  picker uses the theme tokens `--color-base-100`, `--color-base-200`,
  `--color-base-300`, `--color-base-content`, and `--color-primary`.
