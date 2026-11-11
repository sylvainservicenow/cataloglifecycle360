# AIUXControlFileAttachment

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-file-attachment.md`

A single-attachment upload control. One component handles four attachment field types — plain file, `user_image`, video, and audio — switching its labels and preview behavior based on the `attachmentType` property (driven by the platform's `FieldType.UserImage`/`Video`/`Audio`/`FileAttachment`). Extension allow-lists are not switched internally by `attachmentType`; the dictionary-driven form renderer computes and forwards a preset `extensions` list per field type, but the control itself always validates against whatever `extensions` it is given. It manages the full upload lifecycle (select → upload → success/failure) plus retry, rename, delete, download, and an in-place preview.

Built in: file validation (extension allow-list and max size) before upload, upload/retry/rename/delete against the platform attachment API, a virus-scan-blocked state, and a preview modal (native `<video>`/`<audio>` players for those types, the platform document viewer for everything else, lazy-loaded on first use). Do not build your own upload state machine, validation, or preview modal for a single attachment field — this control owns all of it.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import '@servicenow/aiux-components-control';

class MyAttachmentField extends AIUXElement {
  static properties = {
    sysId: {type: String},
    fileName: {type: String}
  };

  render() {
    return html`
      <aiux-control-file-attachment
        name="my_attachment"
        label="Attachment"
        .tableName=${'incident'}
        .tableSysId=${'abc123'}
        .sysId=${this.sysId ?? ''}
        .fileName=${this.fileName ?? ''}
        @AIUX_CONTROL_FILE_ATTACHMENT#VALUE_CHANGED=${this._onValueChange}
      ></aiux-control-file-attachment>
    `;
  }

  _onValueChange(e) {
    const {value, displayValue} = e.detail;
    this.sysId = value;
    this.fileName = displayValue;
    // persist value, e.g. update this.sysId/this.fileName and request an update
  }
}
```

**What happens:** the empty state shows an "Attach file" button; picking a file immediately starts an upload, showing a spinner, then either the success row (with download/rename/delete actions) or a failed row (with retry/delete). Only the success transition dispatches `AIUX_CONTROL_FILE_ATTACHMENT#VALUE_CHANGED` — `_dispatchUploadFailure` dispatches `UPLOAD_FAILED` only, with no accompanying `VALUE_CHANGED`.

### Additional patterns

Render a `user_image` field (image-specific labels and delete-confirmation copy; pass `extensions` explicitly to restrict uploads to image types, since the control itself applies no preset extension list):

```js
html`
  <aiux-control-file-attachment
    name="avatar"
    label="Profile picture"
    .attachmentType=${'image'}
    extensions="jpg,png,bmp,gif,jpeg,ico,svg"
    .tableName=${'sys_user'}
    .tableSysId=${'abc123'}
    .sysId=${this.avatarSysId ?? ''}
    .fileName=${this.avatarFileName ?? ''}
    @AIUX_CONTROL_FILE_ATTACHMENT#VALUE_CHANGED=${this._onValueChange}
  ></aiux-control-file-attachment>
`;
```

`attachment-type="video"` and `attachment-type="audio"` work the same way (pass a matching `extensions` list), swapping in native `<video>`/`<audio>` preview players instead of the document viewer. The dictionary-attribute-driven form renderer (`aiux-control-file-attachment`'s `controls-factory` integration) computes these preset extension lists automatically for `user_image`/`video`/`audio` field types; that logic lives outside this control.

## API

### `aiux-control-file-attachment`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `nowId` | `nowid` | `string` | `''` | Re-renders | Seeds `_internalId` (used to build internal element ids) if set before connection; otherwise an id is generated. |
| `label` | `label` | `string` | `''` | Re-renders | Field label. |
| `placeholder` | `placeholder` | `string` | `''` | Re-renders | Overrides the default localized "No file selected"-style empty-state text (readonly empty state only). |
| `extensions` | `extensions` | `string` | `''` | Passed to the next upload's validation | Comma-separated allow-list of file extensions (no leading dots), used as-is for both the `accept` attribute and upload validation regardless of `attachmentType`. The control itself has no built-in per-type extension presets — an empty `extensions` allows any file type. (The controls-factory form renderer computes and forwards preset lists for `image`/`video`/`audio` dictionary fields before this property ever reaches the control; set `extensions` explicitly when using the raw element directly.) |
| `maxAttachmentSize` | `maxattachmentsize` | `string` | `''` | Passed to the next upload's validation | Max upload size. |
| `tableName` | `tablename` | `string` | `''` | Passed to the next upload | Table the attachment is uploaded against. |
| `tableSysId` | `tablesysid` | `string` | `''` | Passed to the next upload | Sys ID of the record the attachment is uploaded against. |
| `scheduleForCleanup` | `scheduleforcleanup` | `boolean` | `false` | Passed to the next upload | Whether an orphaned upload (e.g. a replaced attachment) is scheduled for later cleanup rather than deleted immediately. |
| `attachmentType` | `attachmenttype` | `'file'\|'image'\|'video'\|'audio'` | `'file'` | Switches labels, preview behavior, and success-row layout | Selects which attachment-type variant of the control renders (see **Data shapes**). |
| `virusState` | `virusstate` | `string` | `''` | Re-renders | When `'not_available'` and a file is present, replaces the normal states with a virus-blocked state. |
| `sysId` | `sysid` | `string` | `''` | Syncs the internal upload controller's value | Sys ID of the current attachment. |
| `fileName` | `filename` | `string` | `''` | Syncs the internal upload controller's value | Current attachment's file name. |
| `contentType` | `contenttype` | `string` | `''` | Syncs the internal upload controller's value | Current attachment's MIME type. |
| `fileSize` | `filesize` | `number` | `0` | Syncs the internal upload controller's value | Current attachment's size in bytes. |
| `canEditName` | `caneditname` | `boolean` | `true` | Re-renders | Shows/hides the rename action (file type only — never shown for `image`/`video`/`audio`). |
| `canDelete` | `candelete` | `boolean` | `true` | Re-renders | Shows/hides the delete action. |
| `canDownload` | `candownload` | `boolean` | `true` | Re-renders | Shows/hides the download action (file type only — media types always use the preview action instead). |
| `optional` | `optional` | `boolean` | `false` | Re-renders | Standard layout property (own `@property` on this class, separate from the base declaration). |
| `hideRequiredIndicator` | `hiderequiredindicator` | `boolean` | `false` | Re-renders | Standard layout property (own `@property` on this class). |
| `messages` | (property only) | `ControlMessage[]` | `[]` | Re-renders | Field-level messages; validation errors and operation failures are appended here automatically. |
| `readonly` | `readonly` | `boolean` | `false` | Re-renders | Hides the attach/retry/rename/delete actions; empty state shows plain placeholder text instead of a button. |
| `disabled` | `disabled` | `boolean` | `false` | Re-renders | Standard disabled state. |
| `required`, `invalid`, `value`, `name` | various | various | see base identity properties | Standard identity properties; `value` is not used to hold the attachment (see **Data shapes**/events — the attachment identity lives in `sysId`/`fileName`/`contentType`/`fileSize`). |

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_FILE_ATTACHMENT#VALUE_CHANGED` | `{name, value, displayValue}` — `value` is the scalar attachment `sysId` string (`''` when cleared) and `displayValue` is the file name string (`''` when cleared); despite the exported `FileAttachmentEventDetail` type's `value: FileAttachmentValue \| null` shape, every actual dispatch sends plain strings, not an object | bubbles, composed, cancelable | A file is selected (value cleared while it uploads), upload succeeds, a rename succeeds, or the attachment is deleted | The one event to listen for to persist the field's value; read `value`/`displayValue` as strings, not `value.sysId`/`value.fileName`. |
| `AIUX_CONTROL_FILE_ATTACHMENT#FILE_SELECTED` | `{name, file, fileName, fileSize, contentType}` | bubbles, composed, cancelable | A file is chosen via the file picker, before upload starts | `file` is the native `File` object. |
| `AIUX_CONTROL_FILE_ATTACHMENT#UPLOAD_STARTED` | `{name, fileName}` | bubbles, composed, cancelable | The upload request begins | — |
| `AIUX_CONTROL_FILE_ATTACHMENT#UPLOAD_PROGRESS` | — | — | Never — declared as an action type constant but never dispatched. | Not currently used. |
| `AIUX_CONTROL_FILE_ATTACHMENT#UPLOAD_SUCCESS` | `{name, value: {sysId, fileName, contentType, size}, file}` | bubbles, composed, cancelable | The upload completes successfully | — |
| `AIUX_CONTROL_FILE_ATTACHMENT#UPLOAD_FAILED` | `{name, error: {type: 'upload-failed', message}}` | bubbles, composed, cancelable | The upload request fails | `_dispatchUploadFailure` only dispatches this event — unlike rename/delete/validation failures, it does **not** append to `messages`. Read the error from `detail.error` and surface it yourself. |
| `AIUX_CONTROL_FILE_ATTACHMENT#FILE_DOWNLOAD` | `{name, sysId, fileName}` | bubbles, composed, cancelable | The download action is clicked (non-media types) | Also triggers a browser navigation to the attachment's download URL. |
| `AIUX_CONTROL_FILE_ATTACHMENT#FILE_RENAME` | `{name, sysId, newFileName}` | bubbles, composed, cancelable | A rename is confirmed and succeeds | — |
| `AIUX_CONTROL_FILE_ATTACHMENT#FILE_DELETE` | `{name, deletedValue: {sysId, fileName, contentType, size}}` | bubbles, composed, cancelable | A delete is confirmed and succeeds | — |
| `AIUX_CONTROL_FILE_ATTACHMENT#FILE_RETRY` | `{name, fileName}` | bubbles, composed, cancelable | Retry is clicked with a pending file still available | If there is no pending file to retry, retry instead re-opens the file picker (no event fires in that case). |
| `AIUX_CONTROL_FILE_ATTACHMENT#RENAME_FAILED` | `{name, error: {type: 'rename-failed', message}}` | bubbles, composed, cancelable | A rename request fails | Also appends the message to `messages`. |
| `AIUX_CONTROL_FILE_ATTACHMENT#DELETE_FAILED` | `{name, error: {type: 'delete-failed', message}}` | bubbles, composed, cancelable | A delete request fails | Also appends the message to `messages`. |
| `AIUX_CONTROL_FILE_ATTACHMENT#ATTACHMENT_PREVIEW_REQUESTED` | `{name, sysId, fileName, contentType, readonly}` | bubbles, composed, cancelable | The preview action is clicked, before the built-in preview modal opens | `name` is added to every event's detail by the shared `dispatchAction` mixin, even though the call site here only passes `sysId`/`fileName`/`contentType`/`readonly`. Cancel this event (`event.preventDefault()`) to suppress the built-in preview modal and handle preview yourself. |
| `AIUX_CONTROL_FILE_ATTACHMENT#VALIDATION_ERROR` | `{name, error: {type, message}}` | bubbles, composed, cancelable | A selected file fails extension or size validation, before any upload starts | `type` is one of `'invalid-type' \| 'file-too-large'`. Also appends the message to `messages`. |
| `AIUX_CONTROL_FILE_ATTACHMENT#INTERNAL_ON_FOCUS` | `{name}` | bubbles, composed, cancelable | The empty-state attach button receives focus | — |
| `AIUX_CONTROL_FILE_ATTACHMENT#INTERNAL_ON_BLUR` | `{name}` | bubbles, composed, cancelable | The empty-state attach button loses focus | — |

#### Slots

None.

#### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Focuses the first visible action button for the current state (e.g. "Attach file" when empty, "Retry" when failed). |

### Data shapes

`AttachmentType`: `'file' \| 'image' \| 'video' \| 'audio'`.

`FileAttachmentValue`: `{sysId: string; fileName: string; contentType: string; size?: number}`.

`FileAttachmentEventDetail`: `{name: string; value: FileAttachmentValue | null; file?: File; error?: {type: FileValidationError; message: string}}`.

`FileValidationError`: `'invalid-type' \| 'file-too-large' \| 'upload-failed' \| 'virus-detected'`.

## Integration details

### Platform requirements

Upload, rename, and delete go through the platform attachment effects (`sys_attachment`-backed endpoints). Download navigates to `/sys_attachment.do?sys_id=<sysId>`. Non-media preview lazy-loads `@servicenow/aiux-components-document-viewer` on first use.

**Gotcha:** the control never validates `tableName`/`tableSysId` before uploading — they're passed straight through to `uploadAttachmentEffect` as-is. Picking a file while either is unset (e.g. a new, unsaved record with no `tableSysId` yet) still runs the upload and dispatches `FILE_SELECTED`/`UPLOAD_STARTED`; the request then fails server-side and the control surfaces it as a normal `UPLOAD_FAILED`/failed-row state, not a distinct error. Set both before letting the user attach.

### SSR

Safe to render on the server; no `window`/`document` access outside browser-driven event handlers (file input change, button clicks).

### Lifecycle

On `connectedCallback`, resolves `_internalId` (from `nowId` or a generated id) and syncs the internal upload controller from the current `sysId`/`fileName`/`contentType`/`fileSize` props. Any later change to those four properties re-syncs the controller (e.g. an externally-set value replacing what the user just uploaded). Deleting an attachment only issues a server-side `DELETE` when `attachmentType` is `'image'` and the current attachment was uploaded in this session (`uploadStatus === 'success'`); otherwise delete just clears the field's value and relies on `scheduleForCleanup` plus the eventual form save to reap the orphaned upload.

### Sizing and layout

Renders inside an `aiux-input`-styled container (`min-h-10`, `w-full`) via the shared form-field layout; the preview modal is a `size="lg"` `aiux-modal`, rename/delete confirmations are `size="sm"` `aiux-modal`s.

## Accessibility, localization, and customization

The hidden native `<input type="file">` (visually `sr-only`, `tabindex="-1"`) carries an `aria-label` from `label` or the type-specific "Attach ..." string. The virus-blocked state uses `role="alert"`. All action buttons are real `<button type="button">` elements with `title` attributes for their action (download/rename/delete/retry), so they're reachable and labeled for keyboard and screen-reader users; the rename and delete flows use focus-managed modal dialogs (`aiux-modal`). Every user-facing string (button labels, empty/uploading/failed status text, rename/delete dialog copy, virus-detected message) is produced via `@lit/localize`'s `msg()`, is localizable, and switches per `attachmentType` (e.g. "Attach file" vs. "Attach image" vs. "Attach video" vs. "Attach audio") — `placeholder` is the one host-settable override, and only affects the readonly empty state. No CSS custom properties or `::part()` selectors are exposed; the container uses the shared `aiux-input`/DaisyUI classes already applied internally.
