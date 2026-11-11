# Feedback

> Source: `@servicenow/aiux-sn-feedback@8.0.2` · `components/external/feedback/docs/usage/aiux-sn-feedback.md`

`<aiux-sn-feedback>` renders a "Helpful" and a "Not helpful" button. Clicking
one selects it, reports the click, and, when a form is configured for that
side, opens a popover form. On submit it dispatches the form's values. It
never saves feedback; the host persists it.

Built in: selected/unselected button states, the popover form (one checklist
or radio group, one comment box with a character counter), a submit button,
an error message, and a "Thanks for your feedback!" confirmation tooltip.

## Import

```js
import '@servicenow/aiux-sn-feedback';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-sn-feedback';

const NEGATIVE = {
  heading: 'What went wrong?',
  items: [
    {
      type: 'checklist',
      value: [
        {id: 'inaccurate', label: 'Inaccurate'},
        {id: 'incomplete', label: 'Incomplete'},
        {id: 'irrelevant', label: 'Not relevant'}
      ]
    },
    {type: 'textarea', maxlength: 500}
  ]
};

@customElement('my-answer-feedback')
export class MyAnswerFeedback extends AIUXElement {
  @property({type: String}) answerId = '';
  private _rating = 'NONE'; // submit detail does not carry the thumb

  private _onClicked(e: CustomEvent) {
    const {button, isSelected} = e.detail; // 'THUMBS_UP' | 'THUMBS_DOWN'
    this._rating = isSelected ? button : 'NONE';
    this._save({answerId: this.answerId, rating: this._rating});
  }

  private _onSubmit(e: CustomEvent) {
    const reasons = e.detail.items.find(i => i.type === 'checklist');
    const comment = e.detail.items.find(i => i.type === 'textarea');
    this._save({
      answerId: this.answerId,
      rating: this._rating,
      reasons: reasons?.value.filter(o => o.checked).map(o => o.itemId) ?? [],
      comment: comment?.value ?? ''
    });
  }

  private _save(payload: object) {
    // The page listening on this element upserts the record by answerId.
    this.dispatchEvent(new CustomEvent('my-feedback-save', {detail: payload}));
  }

  render() {
    return html`
      <aiux-sn-feedback
        .negativeFeedback=${NEGATIVE}
        @feedback-clicked=${this._onClicked}
        @granular-feedback-submit-clicked=${this._onSubmit}
      ></aiux-sn-feedback>
    `;
  }
}
```

**What happens:** "Helpful" has no form here, so clicking it only selects it.
After submit, the popover closes, the form resets, and the confirmation
tooltip shows for 1 second, without waiting for any save. The thumb stays
selected.

### Additional patterns

Host-managed submit. Report the save outcome through `error`, with a new
`timestamp` each time:

```ts
@state() private _error = {isError: false, timestamp: -1};

async _onSubmit(e) {
  const timestamp = this._error.timestamp + 1; // must differ from the last outcome
  try {
    await saveFeedback(e.detail.items);
    this._error = {isError: false, timestamp}; // closes + confirms
  } catch {
    this._error = {isError: true, timestamp}; // shows the error message
  }
}

html`
  <aiux-sn-feedback
    manage-submit
    .error=${this._error}
    .positiveFeedback=${POSITIVE}
    .negativeFeedback=${NEGATIVE}
    @granular-feedback-submit-clicked=${this._onSubmit}
  ></aiux-sn-feedback>
`;
```

## API

### Properties and attributes

| Property           | Attribute       | Type                              | Default                           | Update behavior     | Description                                                                                                                                                                                                                                   |
| ------------------ | --------------- | --------------------------------- | --------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loadState`        | `load-state`    | `FeedbackButtonState`             | `'NONE'`                          | When connected      | Initially selected button. `'SUBMIT_FEEDBACK'` selects neither. Re-read each time the element is attached.                                                                                                                                    |
| `positiveFeedback` | property only   | `GranularFeedbackDetails \| null` | `null`                            | Updates immediately | Form for "Helpful". `null`: the button only selects. An empty or all-invalid `items` list still opens a popover containing only Submit. A new value discards the user's unsaved edits.                                                        |
| `negativeFeedback` | property only   | `GranularFeedbackDetails \| null` | `null`                            | Updates immediately | Form for "Not helpful". Same rules.                                                                                                                                                                                                           |
| `placement`        | `placement`     | `FeedbackPlacement`               | `'bottom'`                        | Next open           | Popover placement relative to the clicked button; see `aiux-sn-popover`.                                                                                                                                                                      |
| `manageSubmit`     | `manage-submit` | `boolean`                         | `false`                           | Updates immediately | Submit only dispatches the event and disables Submit; the popover stays open until `error` reports success.                                                                                                                                   |
| `error`            | property only   | `FeedbackError`                   | `{isError: false, timestamp: -1}` | On change           | `manageSubmit` only for success. `isError: false` with a `timestamp` different from the previous one (and not `-1`) closes the popover and shows the confirmation. `isError: true` shows the error message in the form until `error` changes. |

Form rules:

- Only the first `checklist` or `radio` item and the first `textarea` item
  are used, rendered in that order. Items with an empty option list are
  dropped.
- Radio: only the first option with `checked: true` starts selected.
- Textarea: `maxlength` defaults to 300; Submit is disabled while the text is
  longer than it.
- Closing the popover (close button, Escape, outside click, or a successful
  submit) discards unsaved edits.
- In managed mode, Submit stays disabled after a submit until the popover
  closes; an error does not re-enable it.

### Events

| Event                              | `detail`                                                      | Delivery                          | Fires when                    | Notes                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------- | --------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `feedback-clicked`                 | `{button: 'THUMBS_UP' \| 'THUMBS_DOWN', isSelected: boolean}` | Bubbles, composed, not cancelable | The user clicks either thumb. | `isSelected: false` means the user deselected it (clicking the selected thumb again). Clicking the other thumb switches the selection. |
| `granular-feedback-submit-clicked` | `{items: SubmitPayloadItem[]}`                                | Bubbles, composed, not cancelable | The user clicks Submit.       | List items include every option with its `checked` state.                                                                              |

The internal popovers' cancelable `aiux-sn-popover:close-request` bubbles out
of this element; a page-level listener that calls `preventDefault()` on it also
keeps this element's popover open.

### Slots

None.

### Methods

None.

### Data shapes

```ts
type FeedbackButtonState =
  'NONE' | 'THUMBS_UP' | 'THUMBS_DOWN' | 'SUBMIT_FEEDBACK';

interface GranularFeedbackDetails {
  heading: string; // popover heading
  items: Array<
    | {
        type: 'checklist';
        value: {id: string; label: string; checked?: boolean}[];
      }
    | {type: 'radio'; value: {id: string; label: string; checked?: boolean}[]}
    | {type: 'textarea'; value?: string; maxlength?: number}
  >;
}

interface FeedbackError {
  isError: boolean;
  timestamp: number; // a new value for each outcome, e.g. a counter
}

interface SubmitPayloadItem {
  type: 'checklist' | 'radio' | 'textarea';
  value:
    | {
        itemId: string;
        order: number;
        checked: boolean;
        label: string;
        hasLink: false;
      }[]
    | string; // textarea
}

type FeedbackPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  // deprecated physical aliases
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'left-top'
  | 'left-bottom'
  | 'right-top'
  | 'right-bottom';
```

These types are not exported from the package entry.

## Integration details

### SSR

The buttons render on the server; the popover opens only in the browser.

### Lifecycle

Re-attaching the element resets the selection to `loadState` and the forms to
the current configuration.

### Sizing and layout

`display: block`; the two buttons sit in a row at the start. The popover
opens outside the element's box and does not affect layout.

## Accessibility, localization, and customization

- **Accessibility:** the buttons use `aria-pressed`; the popover traps focus
  and returns it on close; the confirmation is announced through a live
  region.
- **Localization:** button labels, Submit, the placeholder, the error
  message, and the confirmation are localized. `heading` and option `label`
  values are the caller's to translate.
- **Customization:** no styling hooks; the element uses the DaisyUI theme,
  and the selected thumb uses the `success` color.
