# aiux-record-form

> Source: `@servicenow/aiux-components-record@16.1.11` · `components/record/docs/usage/aiux-record-form.md`

Renders a ServiceNow record form using the layout, sections, and fields exposed by `FormAPI`. Must be used inside `<aiux-record-provider>`.

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
    <aiux-record-form
      layout-variant="flat"
      edit-mode="default"
      label-value-layout="horizontal"
    ></aiux-record-form>
  </aiux-record-provider>
`;
```

### Separate form messages

```js
html`
  <aiux-record-provider .data=${recordData}>
    <aiux-record-form-messages></aiux-record-form-messages>
    <aiux-record-form hide-form-messages></aiux-record-form>
  </aiux-record-provider>
`;
```

## API

### Properties and attributes

| Property                       | Attribute                         | Type       | Default         | Update behavior | Description                                                                                                                                               |
| ------------------------------ | --------------------------------- | ---------- | --------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layoutVariant`                | `layout-variant`                  | `String`   | user preference | —               | `"accordions"`, `"tabs"`, or `"flat"`. On desktop defaults to the `tabbed.forms` user preference; tablet always uses tabs; mobile always uses accordions. |
| `editMode`                     | `edit-mode`                       | `String`   | `'default'`     | —               | `"default"`, `"inline"`, or `"display-only"`.                                                                                                             |
| `variant`                      | `variant`                         | `String`   | —               | —               | `"default"` or `"compact"` visual density.                                                                                                                |
| `labelValueLayout`             | `label-value-layout`              | `String`   | `'vertical'`    | —               | `"horizontal"` or `"vertical"` label/value arrangement.                                                                                                   |
| `displayEmptyFields`           | `display-empty-fields`            | `Boolean`  | `false`         | —               | Show fields with empty values.                                                                                                                            |
| `alwaysDisplayFirstSection`    | `always-display-first-section`    | `Boolean`  | `false`         | —               | Always render the first section outside the accordion/tab layout.                                                                                         |
| `hideSectionHeaders`           | `hide-section-headers`            | `Boolean`  | `false`         | —               | Hide section headers.                                                                                                                                     |
| `hideFormMessages`             | `hide-form-messages`              | `Boolean`  | `false`         | —               | Suppress inline form messages so `<aiux-record-form-messages>` can be placed elsewhere.                                                                   |
| `sectionClass`                 | `section-class`                   | `String`   | `''`            | —               | Extra CSS class applied to each section wrapper.                                                                                                          |
| `disableUnsavedFieldIndicator` | `disable-unsaved-field-indicator` | `Boolean`  | `false`         | —               | Hide the unsaved-field indicator dot.                                                                                                                     |
| `disableSectionFocusRing`      | `disable-section-focus-ring`      | `Boolean`  | `false`         | —               | Suppress the accordion section focus-within ring.                                                                                                         |
| `autofocusFirstField`          | `autofocus-first-field`           | `Boolean`  | —               | —               | Override `glide.ui.focus_first_element` for first-field autofocus.                                                                                        |
| `onFormMessageAction`          | — (property only)                 | `Function` | —               | —               | Callback invoked when a form-message action button is clicked.                                                                                            |

### Events

None.

### Slots

None.

### Methods

None.

## Integration details

By default, `<aiux-record-form>` renders form-level messages inline. To place them elsewhere in the layout, set `hide-form-messages` on the form and add `<aiux-record-form-messages>` in the desired location. This prevents the messages from being rendered twice.

## Accessibility, localization, and customization

Form fields render with standard labels and ARIA roles. Error and loading states use `role="alert"` and `role="status"`. Visual density is controlled with the `variant` attribute and DaisyUI/Tailwind classes.
