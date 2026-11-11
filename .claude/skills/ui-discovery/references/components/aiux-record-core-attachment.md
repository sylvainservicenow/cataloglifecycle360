# aiux-record-core-attachment

> Source: `@servicenow/aiux-components-attachment@2.2.11` · `components/attachment/docs/usage/aiux-record-core-attachment.md`

`<aiux-record-core-attachment>` shows the `sys_attachment` files of one record, identified by `table` and `sysId`. It loads the files itself via GraphQL and performs uploads, renames, deletes, and downloads against the instance.

Built-in features the host must not rebuild: drag-and-drop upload, upload review dialog (rename each file, choose an encryption module when available), file-type and size validation, per-file menu (download, rename, delete), inline file preview with document viewer, modeless dialog preview, selection checkboxes, search and sort, card/tile/list layout switching, success/error notifications, and delete confirmation dialogs.

## Import

```js
import '@servicenow/aiux-components-attachment';
```

For TypeScript consumers:

```ts
import '@servicenow/aiux-components-attachment';
import type {
  AIUXRecordCoreAttachment,
  AttachmentItem
} from '@servicenow/aiux-components-attachment';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import '@servicenow/aiux-components-attachment';

@customElement('my-incident-attachments')
export class MyIncidentAttachments extends AIUXElement {
  @property({type: String}) sysId = '';
  @state() private _selectedCount = 0;
  @query('aiux-record-core-attachment')
  private _attachment;

  render() {
    return html`
      <aiux-record-core-attachment
        table="incident"
        .sysId=${this.sysId}
        fileManagementHeader="Attachments"
        @aiux-record-core-attachment:state-change=${(e) =>
          (this._selectedCount = e.detail.selectedCount)}
      ></aiux-record-core-attachment>
      <div class="flex gap-2 mt-2">
        <button
          class="aiux-btn aiux-btn-secondary"
          ?disabled=${this._selectedCount === 0}
          @click=${() => this._attachment.bulkDelete()}
        >
          Delete selected
        </button>
        <button
          class="aiux-btn aiux-btn-secondary"
          @click=${() => this._attachment.downloadAll()}
        >
          Download all
        </button>
      </div>
    `;
  }
}
```

**What happens:** The component fetches attachments via GraphQL, renders a file list with drag-and-drop upload support, inline preview, and per-file actions. `bulkDelete()` opens the built-in confirmation dialog for selected files. `downloadAll()` triggers a zip download of all files.

### Additional patterns

#### Compact mode with upload instructions

A smaller layout with an Add file button and auto-generated upload hints showing allowed types and size limit.

```js
html`
  <aiux-record-core-attachment
    table="incident"
    .sysId=${sysId}
    mode="compact"
    showUploadInstruction="autoGenerate"
  ></aiux-record-core-attachment>
`;
```

#### Custom upload trigger

Replace the built-in UI entirely. Render your own controls in the default slot and call `triggerUpload()` to open the file picker.

```js
html`
  <aiux-record-core-attachment
    mode="custom"
    table="incident"
    .sysId=${sysId}
  >
    <button
      class="aiux-btn aiux-btn-primary"
      @click=${(e) => {
        const attachment = e.target.closest('aiux-record-core-attachment');
        attachment.triggerUpload();
      }}
    >
      Attach file
    </button>
  </aiux-record-core-attachment>
`;
```

#### Modal (popup) mode

Present the attachment surface as a popup overlay rather than inline.

```js
html`
  <aiux-record-core-attachment
    table="incident"
    .sysId=${sysId}
    modal
    .open=${this._showAttachments}
    fileManagementHeader="Attachments"
  ></aiux-record-core-attachment>
`;
```

#### Read-only with no upload

Disable all write operations. Users can still view and download files.

```js
html`
  <aiux-record-core-attachment
    table="incident"
    .sysId=${sysId}
    isReadOnly
  ></aiux-record-core-attachment>
`;
```

#### Disable inline preview

When `inlinePreviewEnabled` is `false`, clicking a file opens it in the shared modeless dialog instead of the inline viewer.

```js
html`
  <aiux-record-core-attachment
    table="incident"
    .sysId=${sysId}
    .inlinePreviewEnabled=${false}
  ></aiux-record-core-attachment>
`;
```

#### Restricted file types and size

```js
html`
  <aiux-record-core-attachment
    table="incident"
    .sysId=${sysId}
    allowedFileTypes="pdf,docx,xlsx,png,jpg"
    maxFileSizeAllowed="25"
  ></aiux-record-core-attachment>
`;
```

#### Skip the upload review dialog

Upload files immediately on selection without showing the rename/review dialog.

```js
html`
  <aiux-record-core-attachment
    table="incident"
    .sysId=${sysId}
    disableUploadModal
  ></aiux-record-core-attachment>
`;
```

#### Pre-fetched attachment data

Skip the initial GraphQL call by passing pre-loaded data. The shape matches the `fetchAttachments()` return type.

```js
html`
  <aiux-record-core-attachment
    table="incident"
    .sysId=${sysId}
    .initialData=${this.preloadedAttachmentData}
  ></aiux-record-core-attachment>
`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `table` | `table` | `string` | `undefined` | Reloads attachments. | Record table name. Required. |
| `sysId` | `sysid` | `string` | `undefined` | Reloads attachments. | Record `sys_id`. Required. |
| `ignoreClass` | `ignore-class` | `boolean` | `false` | Reloads attachments. | Loads attachments from `table` only, not the record's class hierarchy (the record page's `sysparm_ignore_class`). Sent only on instances with the `aiux.ui.forms.gql_capability.ignore_class` capability; otherwise ignored. |
| `mode` | `mode` | `'full' \| 'compact' \| 'custom'` | `'full'` | Updates immediately. | `full`: list with selection, drop zone, inline preview, search/sort. `compact`: smaller list with an Add file button, no selection. `custom`: renders only the default slot plus the upload dialog and notifications. |
| `modal` | `modal` | `boolean` | `false` | Updates immediately. | Present the surface as a popup overlay rather than inline. |
| `open` | `open` | `boolean` | `false` | Updates immediately. | With `modal`: whether the popup is showing. |
| `inlinePreviewEnabled` | `inlinepreviewenabled` | `boolean` | `true` | Updates immediately. | `true` opens a clicked file in the inline viewer beside the list. `false` hands preview to the shared modeless dialog. |
| `initialData` | — | `FetchAttachmentsResult \| null` | `null` | Connect-only. Consumed on first load only. | Pre-fetched attachment data. Bypasses the initial GraphQL call when non-null. |
| `fileManagementHeader` | `filemanagementheader` | `string` | `''` | Updates immediately. | Heading text. In `compact`, defaults to "Attachments"; in `full`, no heading when empty. |
| `isReadOnly` | `isreadonly` | `boolean` | `false` | Applied when attachments load. | Disables upload, rename, and delete. |
| `isFileUploadDisabled` | `isfileuploaddisabled` | `boolean` | `false` | Applied when attachments load. | Disables upload only. |
| `isFileEditDisabled` | `isfileeditdisabled` | `boolean` | `false` | Applied when attachments load. | Disables rename and delete only. |
| `allowedFileTypes` | `allowedfiletypes` | `string` | `''` | Updates immediately. | Comma-separated extensions (`pdf` or `.pdf`) or MIME types. Empty uses the instance's allowed extensions from the server config. |
| `maxFileSizeAllowed` | `maxfilesizeallowed` | `string` (MB) | `''` | Updates immediately. | Maximum file size in megabytes. The instance limit (`com.glide.attachment.max_size`) still applies; the smaller value wins. |
| `isMultiFileUpload` | `ismultifileupload` | `boolean` | `true` | Updates immediately. | Allows selecting several files at once. |
| `disableUploadModal` | `disableuploadmodal` | `boolean` | `false` | Updates immediately. | Uploads immediately, skipping the review dialog. |
| `showSearch` | `showsearch` | `boolean` | `false` | Updates immediately. | Shows a name search and sort controls when files exist. |
| `showUploadInstruction` | `showuploadinstruction` | `'autoGenerate' \| 'custom' \| 'none'` | `'autoGenerate'` | Updates immediately. | `compact` only: upload hint under the heading. `autoGenerate` lists allowed types and the size limit. |
| `customUploadInstruction` | `customuploadinstruction` | `string` | `''` | Updates immediately. | Hint text when `showUploadInstruction="custom"`. |
| `showMetadata` | `showmetadata` | `boolean` | `true` | Updates immediately. | Shows file size and details under each name. |
| `showThumbnails` | `showthumbnails` | `boolean` | `undefined` | Updates immediately. | Shows file thumbnails. Defaults to `true` in `full` mode, `false` in `compact`. |
| `thumbnailSize` | `thumbnailsize` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Updates immediately. | Thumbnail size. |
| `refreshRequested` | `refreshrequested` | `number` | `0` | On change. | Change to a new non-zero number to trigger a list reload. |
| `filePreviewItem` | — | `AttachmentItem \| null` | `null` | With `showFilePreview`. | File to preview programmatically. |
| `showFilePreview` | `showfilepreview` | `boolean` | `false` | On change. | `true` opens the preview for `filePreviewItem`; `false` closes it. |
| `previewModalOnUpload` | `previewmodalonupload` | `boolean` | `true` | Updates immediately. | Controls whether the upload review modal shows a preview. |
| `enableDocumentManagement` | `enabledocumentmanagement` | `boolean` | `false` | Updates immediately. | Enables document management features. |
| `hideFooter` | `hide-footer` | `boolean` | `false` | — | Deprecated. No-op; no built-in footer is rendered. |
| `primaryUpfrontAction` | `primaryupfrontaction` | `string` | `'none'` | — | Deprecated. No-op since the explorer unification. |
| `showSkeletonLoader` | `showskeletonloader` | `boolean` | `true` | — | Deprecated. No-op; a skeleton always shows while loading. |
| `skipPreviewForUnsupportedFileTypes` | `skippreviewforunsupportedfiletypes` | `boolean` | `false` | — | Deprecated. No-op since the explorer unification. |
| `showCompactModeDropZone` | `showcompactmodedropzone` | `boolean` | `false` | — | Deprecated. No-op since the explorer unification. |
| `emptyPanelSize` | `emptypanelsize` | `string` | `'lg'` | — | Deprecated. No-op since the explorer unification. |
| `classicForm` | `classicform` | `boolean` | `false` | — | Deprecated. No-op. |
| `loadDocViewerIfNecessary` | `loaddocviewerifnecessary` | `boolean` | `false` | — | Deprecated. No-op since the explorer unification. |
| `selectedFiles` | — | `Set<string>` | empty | — | Deprecated. No-op; selection is internal (use `state-change` event). |
| `overlayContainer` | `overlaycontainer` | `string` | `''` | — | Deprecated. No-op since the explorer unification. |
| `view` | `view` | `string` | `''` | — | Deprecated. No-op since the explorer unification. |
| `actionConfigId` | `actionconfigid` | `string` | `''` | — | Deprecated. No-op since the explorer unification. |
| `recordDisplayValue` | `recorddisplayvalue` | `string` | `''` | — | Deprecated. No-op since the explorer unification. |
| `nowDsDomainId`, `nowDsDomainScope`, `nowDsRecordId`, `nowDsRecordTable` | lowercased | `string` | `''` | — | Deprecated. No-op since the explorer unification. |

**Boolean property binding:** Properties that default to `true` (`inlinePreviewEnabled`, `isMultiFileUpload`, `showMetadata`, `previewModalOnUpload`) require property binding to disable them. Use `.property=${false}` — the attribute alone (`property="false"`) is treated as truthy by Lit.

### Events

All events are dispatched with `bubbles: true` and `composed: true`.

| Event | `detail` | Fires when | Notes |
| --- | --- | --- | --- |
| `aiux-record-core-attachment:state-change` | `{selectedCount: number, isUploading: boolean, hasAttachments: boolean, canCreate: boolean}` | On first render and whenever selection, upload state, or attachment list changes. | Use to enable/disable host bulk-action buttons. |
| `aiux-record-core-attachment:upload-succeeded` | `{files: string[]}` or `{files: UploadFileEntry[]}` | An upload batch finishes with at least one successful file. | The component dispatches `{files: string[]}` (file names). The controller also dispatches `{files: UploadFileEntry[]}` (file entries with crypto module info); direct and drag-and-drop uploads fire only the controller shape. |
| `aiux-record-core-attachment:delete-succeeded` | `{isMulti: boolean, files: AttachmentItem[]}` or `{item: AttachmentItem}` or `{items: AttachmentItem[]}` | User confirms a delete and at least one file is deleted. | The component dispatches `{isMulti, files}`. The controller also dispatches `{item}` (single delete) or `{items}` (multi-delete). |
| `aiux-record-core-attachment:rename-succeeded` | `{file: AttachmentItem, newName: string}` | User submits a rename and it succeeds. | `file` contains the item with the original name; `newName` is the new name. The controller also dispatches `{item: {...item, name: newName}, table, sysId}` with the updated name. |
| `aiux-record-core-attachment:previewed` | `{file: AttachmentItem}` | User opens a file preview. | |
| `aiux-record-core-attachment:downloaded` | `{file: AttachmentItem}` | User downloads one file. | |
| `aiux-record-core-attachment:downloaded-all` | `{recordSysId: string}` | User triggers download-all. | Downloads a zip of all attachments. |
| `aiux-record-core-attachment:downloaded-selective` | `{files: string[]}` | User triggers download of selected files. | `files` contains the selected attachment sys IDs. |
| `aiux-record-core-attachment:sort-mode-changed` | `{mode: AttachmentSortMode, table: string, sysId: string}` | Sort mode changes (e.g. `'recent'` to `'name-asc'`). | Broadcast so other surfaces for the same record (e.g. chip bar) can sync. |

### Slots

| Slot | Description |
| --- | --- |
| (default) | Rendered only in `custom` mode. Place your own upload trigger or UI here. Call `triggerUpload()` on the host to open the file picker. |

### Methods

| Method | Signature | Description |
| --- | --- | --- |
| `triggerUpload()` | `() => void` | Programmatically opens the file picker. In non-`custom` modes, delegates to the internal explorer. In `custom` mode, clicks the hidden file input. |
| `bulkDelete()` | `() => void` | Opens the built-in delete confirmation dialog for the currently selected files. |
| `downloadAll()` | `() => void` | Downloads all attachments as a zip file. |
| `downloadSelected()` | `() => void` | Downloads only the selected attachments. Single selection downloads the file directly; multiple downloads a zip. |
| `getEffectiveMaxFileSizeMB()` | `() => string` | Returns the effective maximum file size in MB (minimum of property and system config). |
| `getEffectiveAllowedFileTypes()` | `() => string` | Returns the effective allowed file types (property or server config). |
| `getSanitizedAllowedFileTypes()` | `() => string` | Returns allowed types normalized to extensions (e.g. `'.pdf,.docx,.xlsx'`). |
| `getUploadInstructions()` | `() => string` | Returns the localized upload instruction string based on `showUploadInstruction`. |

### Data shapes

```ts
interface AttachmentItem {
  sysId: string;
  name: string;
  size: number | string;
  type: string;
  state?: string;
  canDelete?: boolean;
  canEditName?: boolean;
  isEncrypted?: boolean;
  sensitive?: boolean;
  readonly?: boolean;
  isLoading?: boolean;
  thumbnailUrl?: string;
  document?: {
    sysId: string;
    name: string;
    canEditName?: boolean;
    canRemoveRef?: boolean;
  };
  uploadProgress?: number;
  tempId?: string;
  date?: string;
  dateLabel?: string;
  uploadedBy?: string;
}

interface UploadFileEntry {
  file: File;
  fileName: string;
  cryptoModuleId?: string | null;
}

type AttachmentSortMode = 'name-asc' | 'name-desc' | 'recent';

type AttachmentPanelLayout = 'card' | 'tiles' | 'list';

interface FetchAttachmentsResult {
  attachments: AttachmentItem[];
  count: number;
  canCreate: boolean;
  docViewerEnabled: boolean;
  extensions: string;
  fileNameLength: number;
  userCryptoModules: CryptoModule[];
  types: string[];
  currentCryptoModule: string;
  isRowEncrypted: boolean;
}

interface CryptoModule {
  id: string;
  label: string;
}
```

## Integration details

### Platform requirements

The component fetches attachments via GraphQL (`/api/now/graphql`) using the `GetAttachments` operation. Uploads go to `/api/now/attachment/file`. Renames and deletes use GraphQL mutations. Downloads use `/sys_attachment.do` for single files and `/download_all_attachments.do` for bulk zips. The instance must have the Attachment API enabled and the user must have appropriate ACLs on `sys_attachment`.

### SSR

The component guards browser APIs with `isServer`. The controller's `hostConnected()` no-ops on the server. The component renders only in the browser after hydration.

### Lifecycle

On `connectedCallback`, the controller calls `initializeAttachments()` which fetches the attachment list via GraphQL (unless `initialData` was provided). When `table` or `sysId` changes, attachments are re-fetched. The `refreshRequested` property can trigger a manual reload by changing its value to a new non-zero number.

File validation uses the host property when set, otherwise falls back to the server-provided config: `allowedFileTypes` replaces the server's `extensions` when non-empty; `maxFileSizeAllowed` takes the minimum of the property and `com.glide.attachment.max_size`.

### Sizing and layout

The host element is `display: block` when `modal` is not set. In `full` or `compact` mode with `inlinePreviewEnabled` set (the default), the host gets a fixed height of `var(--aiux-attachment-explorer-height, 32rem)` — override this custom property or set `inlinePreviewEnabled` to `false` to let the host size naturally. The CSS selector is `:host(:not([modal]):not([mode='custom'])[inlinepreviewenabled])`, so `custom` mode and `modal` mode are excluded. The explorer renders an attachment panel that supports card, tile, and list layouts with a view selector. When inline preview is enabled and a file is selected, the panel shrinks to a 420px rail with the document viewer beside it. In `compact` mode, the layout is a simpler file list with an Add file button. In `custom` mode, only the default slot renders alongside the hidden upload infrastructure.

## Accessibility, localization, and customization

Keyboard and screen-reader support is built in. The drop zone has `role="button"` with `aria-label` and responds to Enter/Space. File cards support keyboard navigation. The delete confirmation dialog, upload review modal, and modeless preview dialog all trap focus. Selection checkboxes, bulk action menus, search, and sort controls have appropriate ARIA attributes. The empty state drop zone uses `role="status"` with `aria-live`.

All user-facing strings are localized via `@lit/localize` and switch at runtime with the active locale. Localized labels include: file count, upload progress, delete confirmations, error messages, sort labels, view selector labels, search placeholder, drag-and-drop instructions, and notification messages.

Appearance is configurable via properties: `mode` (full/compact/custom), `thumbnailSize`, `showThumbnails`, `showMetadata`, `showSearch`, `fileManagementHeader`, `showUploadInstruction`, `customUploadInstruction`. For full UI replacement, use `mode="custom"` with the default slot.
