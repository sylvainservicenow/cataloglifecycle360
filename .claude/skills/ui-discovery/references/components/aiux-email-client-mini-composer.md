# aiux-email-client-mini-composer

> Source: `@servicenow/aiux-components-record@16.1.11` · `components/record/docs/usage/aiux-email-client-mini-composer.md`

Renders a full email composer: recipients, subject, rich-text body, attachments, templates, and drafts. It creates the draft, saves it, and sends it. The host only sets which record the email is for, and listens to events when the page must react.

It does **not** need `<aiux-record-provider>`.

The props fall into three groups:

1. **Start a draft** — read once, when the composer loads. They decide what kind of draft is created.
2. **Update an already created draft** — act only after the draft has loaded.
3. **Configuration** — what is shown and how it looks. Works the same in every case.

## Import

Import from the root package if the page uses other record components, so they load as one bundle:

```js
import '@servicenow/aiux/aiux-components-record';
```

If the page only needs the email client, import the separate bundle instead. It's lighter because it leaves out the other record building blocks:

```js
import '@servicenow/aiux/aiux-components-record/email-client';
```

## Usage

`target-table` and `target-record` are **always required**. Without both, no draft is created and the composer stays empty.

### Minimal complete example

New email for a record:

```js
html`
  <aiux-email-client-mini-composer
    sys-id="-1"
    target-table=${table}
    target-record=${recordSysId}
  ></aiux-email-client-mini-composer>
`;
```

**What happens:**

- `sys-id="-1"` means "create a new draft". It is also the default, so it can be left out.
- If the table has a default email client template, it is applied to the new email.
- The draft record is created when the composer opens. From the Australia release, if the `aiux.email_client.compose_draft_supported` system property is `true`, it is created on the first save instead.

### Additional patterns

#### 1. Start a draft

##### 1.1 Reply, reply all, or forward

```js
html`
  <aiux-email-client-mini-composer
    sys-id="-1"
    target-table=${table}
    target-record=${recordSysId}
    reply-type="reply"
    reply-id=${originalEmailSysId}
  ></aiux-email-client-mini-composer>
`;
```

`reply-type` options:

| Value        | Result                                                          |
| ------------ | --------------------------------------------------------------- |
| `"reply"`    | Reply to the original email. To is filled; Cc is not copied.    |
| `"replyall"` | Reply to everyone. To and Cc are filled from the original.      |
| `"forward"`  | Forward the original email. Recipients are left empty.          |

- `reply-type` and `reply-id` must be set **together**. If only one is set, a plain new email is created.
- Bcc is never copied from the original email.
- `template-sys-id` is **ignored** here. To use a template with a reply, apply it after load with `templateDetails` (see 2.1).

##### 1.2 New email from a template

```js
html`
  <aiux-email-client-mini-composer
    sys-id="-1"
    target-table=${table}
    target-record=${recordSysId}
    template-sys-id=${emailTemplateSysId}
  ></aiux-email-client-mini-composer>
`;
```

The template is applied as the draft is created. Works only for a new email (`sys-id="-1"` and no reply props).

##### 1.3 New email with prefilled subject, body, and recipients

```js
html`
  <aiux-email-client-mini-composer
    sys-id="-1"
    target-table=${table}
    target-record=${recordSysId}
    .prePopulatedTo=${['abel.tuter@example.com']}
    .prePopulatedCc=${['beth.anglin@example.com']}
    .prePopulatedBcc=${['fred.luddy@example.com']}
    .prefill=${{subject: 'Update on your request', body: '<p>Hello,</p>'}}
  ></aiux-email-client-mini-composer>
`;
```

- These can be **added to** the minimal example, 1.1, or 1.2.
- Recipients are **added** to the recipients that come back with the created draft (from the reply or template, if any). They do not replace them.
- `prefill` **replaces** the subject and body of the draft. It is applied only once; later changes are ignored.

> Changing `sysId`, `replyType`, or `replyId` after load **starts again** with a new draft. Change them only when you really want a different draft. The one exception is `sysId = '-2'`, which keeps the current draft (see 2.1).

#### 2. Update an already created draft

These props act on the draft that is already loaded. Bind them on the composer like any other prop:

```js
html`
  <aiux-email-client-mini-composer
    target-table=${table}
    target-record=${recordSysId}
    .templateDetails=${this._templateDetails}
    .templateMessage=${this._templateMessage}
    .insertLinkInEmail=${this._insertLink}
    .prePopulatedTo=${this._to}
  ></aiux-email-client-mini-composer>
`;
```

The composer reacts only when the bound value becomes a **new object**. Setting the same object again does nothing. So:

- Keep the value in your component's state, and set a new object when the user takes an action (for example, picks a template).
- Do **not** build the object inside `render()`. A new object on every render applies it again on every render.

##### 2.1 Apply a template — `sysId` + `templateDetails`

Set `sysId` to `'-2'` and pass `templateDetails` **together**:

```js
this.sysId = '-2';
this.templateDetails = {
  templateSysId: emailTemplateSysId,
  templateTitle: 'Resolution notice'
};
```

- `'-2'` keeps the current draft; any other change to `sysId` loads a different draft.
- The template is applied to the draft.
- `templateSysId` is required. Without it, nothing happens.
- `templateTitle` is shown in the "template applied" message.
- Setting `templateDetails` before the draft has loaded has no effect. To start a new email from a template, use `template-sys-id` (see 1.2).

##### 2.2 Apply or undo a form-template body — `templateMessage`

```js
this.templateMessage = {
  actionType: 'apply',
  bodyText: '<p>Steps to reproduce…</p>',
  contentPlacement: 'insert_after_existing_text'
};

// Undo the last apply (one level only)
this.templateMessage = {actionType: 'undo'};
```

`contentPlacement` options:

| Value                           | Effect                                   |
| ------------------------------- | ---------------------------------------- |
| `'insert_before_existing_text'` | Adds `bodyText` before the current body. |
| `'insert_after_existing_text'`  | Adds `bodyText` after the current body.  |
| `'insert_at_cursor'`            | Inserts `bodyText` at the cursor.        |
| not set (or any other value)    | Replaces the whole body with `bodyText`. |

If it is set before the draft loads, it is applied once when the draft loads. In that case `'insert_at_cursor'` works like `'insert_before_existing_text'`.

##### 2.3 Insert a link — `insertLinkInEmail`

```js
this.insertLinkInEmail = {
  message: {
    link: 'kb_view.do?sysparm_article=KB0010001',
    title: 'Reset your password'
  },
  actionInfo: {itemData: {snippet: 'Steps to reset your password'}},
  direction: 'right'
};
```

The link (and optional snippet) is inserted at the cursor. A relative `link` is made absolute with the current origin. `link` or `snippet` is required.

`direction` decides where the snippet goes:

| Value               | Result                    |
| ------------------- | ------------------------- |
| `'right'` (default) | `Link: snippet`           |
| `'left'`            | `snippet: Link`           |
| `'top'` | `snippet:`, new line, link |
| `'bottom'`          | link, blank line, snippet |

##### 2.4 Add recipients

Setting `prePopulatedTo`, `prePopulatedCc`, or `prePopulatedBcc` to a new array after load works the same way as in 1.3: the recipients are **added** to the draft's current recipients. They do not replace them.

## API

### Properties and attributes

Bind Boolean, object, and array props as properties (`.prop=${value}`). See [Integration details](#integration-details).

#### Start a draft

| Property          | Attribute           | Type                | Default | Update behavior                                       | Description                                                                                                                                                                        |
| ----------------- | ------------------- | ------------------- | ------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `targetTable`     | `target-table`      | `String`            | `''`    | Read at load                                          | **Required.** Table of the record the email is about.                                                                                                                              |
| `targetRecord`    | `target-record`     | `String`            | `''`    | Read at load                                          | **Required.** sys_id of that record.                                                                                                                                               |
| `sysId`           | `sys-id`            | `String`            | `'-1'`  | Change starts a new draft (except `'-2'`)             | `'-1'` creates a new draft. A real `sys_email_draft` sys_id opens that existing draft (reply and template props are then ignored). `'-2'` is used only with `templateDetails` (see 2.1). |
| `replyType`       | `reply-type`        | `String`            | `''`    | Change starts a new draft                             | `"reply"`, `"replyall"`, or `"forward"`. Needs `replyId`.                                                                                                                          |
| `replyId`         | `reply-id`          | `String`            | `''`    | Change starts a new draft                             | sys_id of the email being replied to or forwarded. Needs `replyType`.                                                                                                              |
| `templateSysId`   | `template-sys-id`   | `String`            | `''`    | Read at load                                          | `sys_email_client_template` to apply to a new email. Ignored for replies and existing drafts.                                                                                      |
| `prePopulatedTo`  | `pre-populated-to`  | `PrePopulatedInput` | `[]`    | Read at load; a new array later adds those recipients | Recipients to add to To.                                                                                                                                                           |
| `prePopulatedCc`  | `pre-populated-cc`  | `PrePopulatedInput` | `[]`    | Read at load; a new array later adds those recipients | Recipients to add to Cc.                                                                                                                                                           |
| `prePopulatedBcc` | `pre-populated-bcc` | `PrePopulatedInput` | `[]`    | Read at load; a new array later adds those recipients | Recipients to add to Bcc.                                                                                                                                                          |
| `prefill`         | — (property only)   | `PrefillData`       | —       | Applied once                                          | Subject and body to start with.                                                                                                                                                    |

#### Update an already created draft

| Property            | Attribute              | Type                  | Default | Update behavior                | Description                                    |
| ------------------- | ---------------------- | --------------------- | ------- | ------------------------------ | ---------------------------------------------- |
| `templateDetails`   | `template-details`     | `TemplateDetailsData` | `{}`    | Applied when a new object is set | Apply a template to the already created draft. |
| `templateMessage`   | `template-message`     | `TemplateMessageData` | `{}`    | Applied when a new object is set | Apply or undo a form-template body.            |
| `insertLinkInEmail` | `insert-link-in-email` | `LinkData`            | `{}`    | Applied when a new object is set | Insert a link into the body.                   |

#### Configuration

| Property                  | Attribute                    | Type                          | Default                     | Update behavior | Description                                                                                         |
| ------------------------- | ---------------------------- | ----------------------------- | --------------------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| `showAttachments`         | `show-attachments`           | `Boolean`                     | `true`                      | —               | Allow attachments.                                                                                  |
| `showEmailTemplates`      | `show-email-templates`       | `Boolean`                     | `true`                      | —               | Show the email template picker.                                                                     |
| `showQuickMessages`       | `show-quick-messages`        | `Boolean`                     | `true`                      | —               | Show the quick message picker.                                                                      |
| `showResponseTemplates`   | `show-response-templates`    | `Boolean`                     | `true`                      | —               | Show the response template picker.                                                                  |
| `showViewDrafts`          | `show-view-drafts`           | `Boolean`                     | `true`                      | —               | Show the "view drafts" action.                                                                      |
| `showDiscardDraft`        | `show-discard-draft`         | `Boolean`                     | `true`                      | —               | Show the discard action.                                                                            |
| `showPopOut`              | `show-pop-out`               | `Boolean`                     | `true`                      | —               | Show the pop-out button.                                                                            |
| `popoutIcon`              | `popout-icon`                | `String`                      | `'open-link-right-outline'` | —               | Icon for the pop-out button.                                                                        |
| `hideSend`                | `hide-send`                  | `Boolean`                     | `false`                     | —               | Hide the Send button.                                                                               |
| `enableMentioningUsers`   | `enable-mentioning-users`    | `Boolean`                     | `true`                      | Read at load | Allow @mentions in the body. Set it before the composer loads; turning it on later has no effect. |
| `fitToParent`             | `fit-to-parent` (reflected)  | `Boolean`                     | `false`                     | —               | Fill the parent's height. Use inside a fixed-height host (modal, window).                           |
| `elevated`                | `elevated`                   | `Boolean`                     | `false`                     | Read at load | Rounded card with shadow, no border. Set it before the composer loads; do not change it later. |
| `emailTitle`              | `email-title`                | `String`                      | `''`                        | —               | Header title above the composer. No header when empty.                                              |
| `composerTitle`           | `composer-title`             | `String`                      | `''`                        | —               | Accessible name for the composer region. Use when a page has more than one.                         |
| `sendEmailButtonVariant`  | `send-email-button-variant`  | `String`                      | `'secondary'`               | —               | `"primary"`, `"secondary"`, or `""` (then `sendEmailButtonColor` and `sendEmailButtonModifier` apply). |
| `sendEmailButtonSize`     | `send-email-button-size`     | `String`                      | `'sm'`                      | —               | `"xs"`, `"sm"`, or `"md"`.                                                                          |
| `sendEmailButtonColor`    | `send-email-button-color`    | `String`                      | `'neutral'`                 | —               | `"primary"`, `"secondary"`, `"neutral"`, `"error"`. **Only when** `sendEmailButtonVariant` is `""`. |
| `sendEmailButtonModifier` | `send-email-button-modifier` | `String`                      | —                           | —               | `"ghost"`, `"outline"`, `"soft"`. **Only when** `sendEmailButtonVariant` is `""`.                   |
| `showSendButtonAsIcon`    | `show-send-button-as-icon`   | `Boolean`                     | `false`                     | —               | Icon-only Send button.                                                                              |

### Events

| Event                              | `detail`                                                                        | Delivery          | Fires when                                                        | Notes                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `aiux-email-client:sending`        | `{draftId: string}`                                                             | Bubbles, composed | Send has started, after all checks passed.                        | `draftId` is the draft `sys_email_draft` sys_id.                                  |
| `aiux-email-client:send-success`   | `{table: string; sysId: string; draftSysId: string}`                            | Bubbles, composed | The email was sent.                                               | `table` / `sysId` are the target record. Use it to close a modal.           |
| `aiux-email-client:send-failed` | `{reason: SendFailureReason; error?: string; invalidRecipients?: string[]}` | Bubbles, composed | A send check failed or the send request failed. | For server errors it fires after `sending`. `error` (the error text) is set for `'api_error'`. `invalidRecipients` (email addresses) is set for `'smime_error'`. The composer shows an error alert for most reasons, but not yet for `'smime_error'` and `'smime_combined_error'`. |
| `aiux-email-client:send-cancelled` | `{reason: 'empty_subject' \| 'empty_body' \| 'both'}`                           | Bubbles, composed | The user cancelled from the empty subject / body confirmation.    | —                                                                           |
| `aiux-email-client:draft-saved`    | `{sysId: string}`                                                               | Bubbles, composed | The draft was saved.                                              | `sysId` is the draft `sys_email_draft` sys_id.                                    |

### Slots

None.

### Methods

None.

### Data shapes

```typescript
type PrePopulatedInput = Array<
  string | {emailAddress?: string; displayName?: string; id?: string}
>;

type PrefillData = {subject?: string; body?: string /* HTML */};

type TemplateDetailsData = {
  templateSysId: string;
  templateTitle?: string;
};

type TemplateMessageData = {
  actionType: 'apply' | 'undo';
  bodyText?: string; // HTML
  contentPlacement?: // not set = replace the whole body
    | 'insert_before_existing_text'
    | 'insert_after_existing_text'
    | 'insert_at_cursor';
};

type LinkData = {
  message?: {link?: string; title?: string};
  actionInfo?: {itemData?: {snippet?: string}};
  direction?: 'right' | 'left' | 'top' | 'bottom';
};

// Common values. Other failure codes can also appear, so handle unknown values.
type SendFailureReason =
  | 'attachment_uploading'
  | 'reply_to_failure'
  | 'from_failure'
  | 'from_certificate_error'
  | 'smime_error'
  | 'smime_combined_error'
  | 'draft_state_fail'
  | 'attachment_unavailable'
  | 'body_char_length_limit'
  | 'send_fail'
  | 'api_error'
  | 'unknown'
  | (string & {});
```

## Integration details

### Boolean, object, and array props

Bind them as properties (`.prop=${value}`), not attributes. With an attribute, a `false` value is not written during server-side rendering, so a prop that defaults to `true` stays `true`.

```js
// Correct
html`<aiux-email-client-mini-composer
  .elevated=${true}
  .showPopOut=${false}
></aiux-email-client-mini-composer>`;

// Wrong — showPopOut stays true
html`<aiux-email-client-mini-composer
  ?show-pop-out=${false}
></aiux-email-client-mini-composer>`;
```

### Sizing and layout

With `fitToParent`, put the composer inside a container that has a fixed height (for example, a modal body or a floating window). Without it, the composer sizes to its content.

### Alerts

The composer shows its own success and error alerts (except for the S/MIME reasons, see [Events](#events)). Listen to the events only when your page must react, and do not show a second alert.

## Accessibility, localization, and customization

The composer is a `role="region"` landmark named "Email composer" (or "Email composer: `<composerTitle>`"). All strings are localized by the package and are not host-configurable. Use `elevated` and `fitToParent` to fit the composer into your layout; internal styling is not customizable.
