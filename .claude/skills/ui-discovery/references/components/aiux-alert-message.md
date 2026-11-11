# Alert message

> Source: `@servicenow/aiux-components-alert@2.5.3` · `components/external/alert/docs/usage/aiux-alert-message.md`

`<aiux-alert-message>` shows a title, a message, and optional slotted content
with a type-specific color and icon, and announces them to screen readers.
When `dismissible`, it can close itself (button or timer) and reports it with
`alert-dismiss`. A dismissed alert only fades out; removing it is the host's
job. The event fires as the fade starts, not when it ends.

Built in: close button, auto-dismiss with a progress bar and a pause/resume
button, initial focus on the first control, and reduced-motion handling that
follows the user's animation preference. `message` is plain text; links and
other HTML go in the default slot.

## Import

```js
import '@servicenow/aiux-components-alert';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-alert';

@customElement('my-save-status')
export class MySaveStatus extends AIUXElement {
  @state() private _showAlert = true;

  render() {
    return this._showAlert
      ? html`
          <aiux-alert-message
            type="success"
            alert-title="Saved"
            message="Changes saved."
            dismissible
            duration="8000"
            @alert-dismiss=${() => (this._showAlert = false)}
          >
            <a class="aiux-link" href="/now/history">View history</a>
          </aiux-alert-message>
        `
      : null;
  }
}
```

**What happens:** on first render, focus moves to the "View history" link.
After 8 seconds (unless paused), the alert starts hiding and fires
`alert-dismiss` immediately; this host removes it at once, so no fade shows.

### Additional patterns

Ambient alert that must not take focus, with an action button (`_retry` is
your application's handler):

```js
html`
  <aiux-alert-message
    type="warning"
    alert-title="Connection lost"
    message="Changes will sync when you are back online."
    .autofocusControls=${false}
  >
    <button class="aiux-btn aiux-btn-sm mt-2" @click=${this._retry}>
      Retry
    </button>
  </aiux-alert-message>
`;
```

Re-show a dismissed alert, or restart its timer when the same event repeats:

```js
html`<aiux-alert-message .resetKey=${this._resetKey} ...></aiux-alert-message>`;
this._resetKey += 1; // when the event repeats; not a method on the element
```

## API

### Properties and attributes

| Property            | Attribute            | Type                 | Default  | Update behavior                                                        | Description                                                                                                                                                                                                     |
| ------------------- | -------------------- | -------------------- | -------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`              | `type`               | `AlertType`          | `'info'` | Updates immediately                                                    | Color and default icon. Unknown values render as `info`.                                                                                                                                                        |
| `alertTitle`        | `alert-title`        | `string`             | `''`     | Updates immediately                                                    | Bold title above the message.                                                                                                                                                                                   |
| `message`           | `message`            | `string`             | `''`     | Updates immediately                                                    | Plain text. Any markup, `<a>` and `<br />` included, shows as literal text. Put HTML in the default slot (see below).                                                                                           |
| `icon`              | `icon`               | `string` (icon name) | `''`     | Updates immediately                                                    | Replaces the type's default icon.                                                                                                                                                                               |
| `dismissible`       | `dismissible`        | `boolean`            | `false`  | Buttons immediately; timer when first rendered or on `resetKey` change | Shows the close button. Required for auto-dismiss.                                                                                                                                                              |
| `duration`          | `duration`           | `number` (ms)        | `0`      | Buttons immediately; timer when first rendered or on `resetKey` change | With `dismissible`, dismisses after this time and shows the pause button and progress bar. `0` disables. Changing it later does not start or restart the timer.                                                 |
| `resetKey`          | `reset-key`          | `number`             | `0`      | On change                                                              | Changing it to a new value > 0 re-shows a dismissed alert, clears the paused state, restarts the timer and progress bar, and re-applies initial focus. The value present at first render does not trigger this. |
| `autofocusControls` | `autofocus-controls` | `boolean`            | `true`   | First render and `resetKey` changes                                    | Moves focus to the first focusable slotted element, else the pause or close button. Set `false` with a property binding for alerts the user did not trigger.                                                    |

HTML content (links, line breaks, lists) goes in the default slot. The host
owns it:

- Sanitize HTML from a server, script, or user input before rendering it;
  never pass an unsanitized string to `unsafeHTML()` or `innerHTML`.
- Style it: slotted content uses the host's CSS, not the alert's.
- Announce it: the alert announces only `alertTitle` and `message`, so add a
  visually hidden `role="alert"` element with the slotted text.

### Events

| Event           | `detail`                             | Delivery                          | Fires when                                                             | Notes                                                                    |
| --------------- | ------------------------------------ | --------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `alert-dismiss` | `{type}`: the `type` property as set | Bubbles, composed, not cancelable | The close button is clicked, the timer ends, or `dismiss()` is called. | Fires again on each later `dismiss()` call, even when already dismissed. |

### Slots

- Default: extra content below the message, such as action buttons, links, or
  other HTML (see the host's responsibilities above).

### Methods

| Method      | Effect                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| `dismiss()` | Starts the fade-out, stops the timer, and fires `alert-dismiss` synchronously. Works when not `dismissible`. |

### Data shapes

```ts
type AlertType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'critical'
  | 'high'
  | 'moderate'
  | 'positive'
  | 'low'
  | 'ai'
  | 'primary'
  | 'accent';
```

This type is not exported from the package entry.

## Integration details

### SSR

The alert renders on the server. The timer and initial
focus start in the browser.

### Lifecycle

Removing the element stops the timer. Re-attaching a visible alert restarts
the timer with the full `duration`.

### Sizing and layout

- `display: block`; the alert fills its container's width and wraps long
  text.
- A dismissed alert is transparent but still in the DOM and keeps its space
  until the host removes it.

## Accessibility, localization, and customization

- **Accessibility:** the title, message text, and control names are
  announced assertively on render and when they change; pausing and resuming
  are announced politely. Slotted content is not announced. Pause is
  available only through the pause button.
  Use `.autofocusControls=${false}` for alerts not caused by the user's
  action.
- **Localization:** control labels and announcements are localized.
  `alertTitle` and `message` are the caller's to translate.
- **Customization:** CSS parts `alert` (container), `content` (title,
  message, and slot), and `dismiss-button`. The pause button has no part.
  Colors come from the DaisyUI theme. With the `staggered` attribute on the
  host, the entry transition is delayed by `--stagger-tight` ×
  `--stagger-index`.
