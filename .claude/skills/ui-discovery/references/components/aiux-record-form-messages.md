# aiux-record-form-messages

> Source: `@servicenow/aiux-components-record@16.1.11` · `components/record/docs/usage/aiux-record-form-messages.md`

Displays form-level messages from `FormAPI`. By default `<aiux-record-form>` renders these inline; use this component when you want a custom placement. Must be used inside `<aiux-record-provider>`.

Platform-owned record pages already include a provider, so you do not need to add one there; add a provider only on custom pages, home pages, list pages, dashboards, or when the form must target a different record than the record page's default provider.

## Import

```js
import '@servicenow/aiux/aiux-components-record';
```

## Usage

### Minimal complete example

```js
html`
  <aiux-record-provider .data=${recordData}>
    <aiux-record-form hide-form-messages></aiux-record-form>
    <aiux-record-form-messages></aiux-record-form-messages>
  </aiux-record-provider>
`;
```

## API

### Properties and attributes

| Property              | Attribute         | Type       | Default | Update behavior | Description                                                    |
| --------------------- | ----------------- | ---------- | ------- | --------------- | -------------------------------------------------------------- |
| `onFormMessageAction` | — (property only) | `Function` | —       | —               | Callback invoked when a form-message action button is clicked. |

### Events

None.

### Slots

None.

### Methods

None.

## Integration details

By default, `<aiux-record-form>` renders form messages inline. To place them elsewhere in the layout, set `hide-form-messages` on `<aiux-record-form>` and add `<aiux-record-form-messages>` in the desired location. This prevents the messages from being rendered twice.

## Accessibility, localization, and customization

Each message is rendered as an alert with an appropriate ARIA role (`alert` or `status`). Dismiss buttons have localized labels.
