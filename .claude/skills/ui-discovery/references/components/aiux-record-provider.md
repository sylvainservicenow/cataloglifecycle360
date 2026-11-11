# aiux-record-provider

> Source: `@servicenow/aiux-components-record@16.1.11` · `components/record/docs/usage/aiux-record-provider.md`

Fetches or accepts pre-fetched ServiceNow record data, instantiates typed API façades, initializes client scripting, and publishes `RecordContext` so descendant record components can render and interact with the record.

Record components (such as `<aiux-record-form>`, `<aiux-record-activity-stream>`, and others) are presentational only — they do not fetch data, run client scripts, or manage record state themselves. A provider is required to make them work.

The record package exposes three main pieces: the **Record Provider**, the **Record Data Manager**, and the **Record Components**. **Platform-owned record pages already include a provider automatically**, so the record components placed on those pages use the page-level provider and you do not need to add one yourself. Add an additional provider only on pages that do not already have one — such as a home, list, dashboard, or custom app page — or when a component must bind to a different record than the one the record page's default provider is already managing.

## Import

```js
import '@servicenow/aiux/aiux-components-record';
```

## Usage

### Server-side rendering

```js
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {
  AIUXElement,
  createContext
} from '@servicenow/aiux/aiux-components-core';
import {
  RecordDataManager,
  RecordAPIKey
} from '@servicenow/aiux/aiux-components-record';

export const myCustomRecordPageContext = createContext(
  'my-custom-record-page',
  null
);

@customElement('my-custom-record-page')
class MyCustomRecordPage extends AIUXElement {
  static contexts = [myCustomRecordPageContext];

  static async loader(ctx) {
    const {table, recordId} = ctx.params;
    const data = await RecordDataManager.fetchRecord({table, sysId: recordId}, [
      RecordAPIKey.Form,
      RecordAPIKey.Activity
    ]);
    myCustomRecordPageContext.set(data);
  }

  render() {
    return html`
      <aiux-record-provider .data=${myCustomRecordPageContext.get()}>
        <aiux-record-form></aiux-record-form>
        <aiux-record-activity-stream></aiux-record-activity-stream>
      </aiux-record-provider>
    `;
  }
}
```

### Client-side connected mode

```js
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';

@customElement('my-custom-record-page')
class MyCustomRecordPage extends AIUXElement {
  render() {
    return html`
      <aiux-record-provider table="incident" sysId="abc123">
        <aiux-record-form></aiux-record-form>
        <aiux-record-activity-stream></aiux-record-activity-stream>
      </aiux-record-provider>
    `;
  }
}
```

## API

### Properties and attributes

| Property                   | Attribute                     | Type                          | Default    | Update behavior                        | Description                                                                                                                                                                                                                                                                          |
| -------------------------- | ----------------------------- | ----------------------------- | ---------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data`                     | — (property only)             | `RecordFetchResult`           | —          | Re-initializes the record when changed | Pre-fetched result from `RecordDataManager.fetchRecord()`. Carries the original config, so `table`, `sysId`, `view`, etc. do not need to be passed again.                                                                                                                            |
| `table`                    | `table`                       | `String`                      | `''`       | Triggers re-fetch when changed         | Record table name.                                                                                                                                                                                                                                                                   |
| `sysId`                    | `sysId`                       | `String`                      | `''`       | Triggers re-fetch when changed         | Record sys_id.                                                                                                                                                                                                                                                                       |
| `view`                     | `view`                        | `String`                      | `''`       | Triggers re-fetch when changed         | Fallback view name.                                                                                                                                                                                                                                                                  |
| `ignoreUserViewPreference` | `ignore-user-view-preference` | `Boolean`                     | `false`    | —                                      | Use the supplied view and ignore the user's stored preference, but still allow view rules.                                                                                                                                                                                           |
| `forcedViewName`           | `forced-view-name`            | `String`                      | `''`       | —                                      | Render this exact view; bypass user preference and view rules.                                                                                                                                                                                                                       |
| `query`                    | `query`                       | `String`                      | `''`       | —                                      | Encoded query applied to the record.                                                                                                                                                                                                                                                 |
| `isCoreUI`                 | `is-core-ui`                  | `Boolean`                     | `true`     | —                                      | When `true`, fetches Desktop + All client scripts, the UI16 UI Action script variant, and Desktop field-validator scripts, and matches the UI16/CoreUI onLoad / UI policy / onChange execution order. When `false`, uses the Service Portal / Mobile / Workspace experience instead. |
| `parentTable`              | `parent-table`                | `String`                      | `''`       | —                                      | Parent record table for create-from-related-list context.                                                                                                                                                                                                                            |
| `parentRecordSysId`        | `parent-record-sys-id`        | `String`                      | `''`       | —                                      | Parent record sys_id for create-from-related-list context.                                                                                                                                                                                                                           |
| `isRelatedList`            | `is-related-list`             | `Boolean`                     | `false`    | —                                      | Mirrors the `sys_is_related_list` URL param.                                                                                                                                                                                                                                         |
| `linkCollection`           | `link-collection`             | `String`                      | `''`       | —                                      | Many-to-many intermediate link table.                                                                                                                                                                                                                                                |
| `collectionKey`            | `collection-key`              | `String`                      | `''`       | —                                      | Field on the child/link table pointing to the parent.                                                                                                                                                                                                                                |
| `collectionRelatedField`   | `collection-related-field`    | `String`                      | `''`       | —                                      | M2M link-table field pointing to the newly created record.                                                                                                                                                                                                                           |
| `collectionRelationship`   | `collection-relationship`     | `String`                      | `''`       | —                                      | Defined relationship sys_id/name for prefill and insert callback.                                                                                                                                                                                                                    |
| `initialDomainScope`       | `initial-domain-scope`        | `String`                      | `'record'` | —                                      | Domain scope applied on load.                                                                                                                                                                                                                                                        |
| `ignoreClass`              | `ignore-class`                | `Boolean`                     | `false`    | —                                      | Ignore class hierarchy when resolving the record.                                                                                                                                                                                                                                    |
| `contextId`                | `context-id`                  | `String`                      | `''`       | —                                      | Optional identifier for scoped lookup via `RecordContext.getById()`, page-level notification deduplication, and isolating state when multiple providers share a page. Generated automatically when omitted.                                                                          |
| `requiredAPIs`             | — (property only)             | `RecordAPIKey[]`              | all APIs   | Limits fetched data sources            | Explicitly limit which APIs and their data sources are fetched.                                                                                                                                                                                                                      |
| `showErrorDetails`         | `show-error-details`          | `Boolean`                     | `false`    | —                                      | Show error stack traces in the UI.                                                                                                                                                                                                                                                   |
| `disablePresence`          | `disable-presence`            | `Boolean`                     | `false`    | —                                      | Disable presence tracking.                                                                                                                                                                                                                                                           |
| `exposeActionsToChat`      | `expose-actions-to-chat`      | `Boolean`                     | `true`     | —                                      | When `false`, UI actions are still registered but not advertised to chat/LLM surfaces.                                                                                                                                                                                               |
| `enableCoreAiTools`        | `enable-core-ai-tools`        | `Boolean`                     | `false`    | —                                      | Render client tools in the provider shadow root so the record registers context with chat.                                                                                                                                                                                           |
| `onOpenRecord`             | — (property only)             | `Function`                    | —          | —                                      | Callback `(table, sysId, query?, params?) => void \| Promise<void>` for opening related records.                                                                                                                                                                                     |
| `onOpenList`               | — (property only)             | `Function`                    | —          | —                                      | Callback `(table, query?) => void` for opening a list.                                                                                                                                                                                                                               |
| `onRecordLoaded`           | — (property only)             | `Function`                    | —          | —                                      | Callback `(table, contextId) => void` fired once per successful full load.                                                                                                                                                                                                           |
| `formHandlers`             | — (property only)             | `RecordHandlers`              | `{}`       | —                                      | Handlers such as `onChange` and `onSubmitSucceeded` for the form environment.                                                                                                                                                                                                        |
| `notifications`            | — (property only)             | `NotificationsConfig \| null` | —          | —                                      | Override, suppress (`null`), or accept default form notification handling.                                                                                                                                                                                                           |
| `editMode`                 | — (property only)             | `String`                      | —          | —                                      | Page-level edit mode forwarded to `<aiux-record-form>`.                                                                                                                                                                                                                              |
| `autofocusFirstField`      | `autofocus-first-field`       | `Boolean`                     | —          | —                                      | Override `glide.ui.focus_first_element` for first-field autofocus.                                                                                                                                                                                                                   |
| `hideRelatedLists`         | `hide-related-lists`          | `Boolean`                     | `false`    | —                                      | Hide related lists under this provider.                                                                                                                                                                                                                                              |
| `hideRelatedLinks`         | `hide-related-links`          | `Boolean`                     | `false`    | —                                      | Hide related links under this provider.                                                                                                                                                                                                                                              |
| `hideHeader`               | `hide-header`                 | `Boolean`                     | `false`    | —                                      | Hint to header consumers that the record header should not be shown.                                                                                                                                                                                                                 |
| `recordListNavPosition`    | `record-list-nav-position`    | `Number`                      | —          | —                                      | Current position for list-relative record navigation.                                                                                                                                                                                                                                |
| `recordListNavTotal`       | `record-list-nav-total`       | `Number`                      | —          | —                                      | Total records for list-relative navigation.                                                                                                                                                                                                                                          |
| `recordListNavTarget`      | `record-list-nav-target`      | `String`                      | —          | —                                      | Target table for list-relative navigation.                                                                                                                                                                                                                                           |
| `recordListNavQuery`       | `record-list-nav-query`       | `String`                      | —          | —                                      | Encoded query for list-relative navigation.                                                                                                                                                                                                                                          |

### Events

None.

### Slots

| Slot    | Description                                                                         |
| ------- | ----------------------------------------------------------------------------------- |
| default | Record components such as `<aiux-record-form>` and `<aiux-record-activity-stream>`. |

### Methods

| Method   | Signature           | Description                                        |
| -------- | ------------------- | -------------------------------------------------- |
| `reload` | `(): Promise<void>` | Triggers a full re-fetch of the configured record. |

### Data shapes

```typescript
enum RecordAPIKey {
  Form = 'form',
  Header = 'header',
  Actions = 'actions',
  Activity = 'activity',
  User = 'user',
  Domain = 'domain',
  Attachments = 'attachments'
}

type RecordConfig = {
  table: string;
  sysId: string;
  view?: string;
  ignoreUserViewPreference?: boolean;
  forcedViewName?: string;
  query?: string;
  isCoreUI?: boolean;
  parentTable?: string;
  parentRecordSysId?: string;
  linkCollection?: string;
  collectionKey?: string;
  collectionRelatedField?: string;
  collectionRelationship?: string;
};

type RecordFetchResult = RecordConfig & {
  data?: object;
  errors?: object[];
  requiredAPIs?: RecordAPIKey[];
};

type NotificationsConfig = {
  onAdd?: (
    type: NotificationType,
    message: string,
    preventDuplicates?: boolean,
    id?: string,
    messageHtml?: string
  ) => void;
  onRemove?: (id: string) => void;
  onClear?: () => void;
} | null;
```

## Integration details

### SSR

Pass `.data` from `RecordDataManager.fetchRecord()` in the loader. The provider extracts all record configuration from it automatically, so you do not need to repeat `table`, `sysId`, `view`, `query`, `requiredAPIs`, or any other config prop.

### Partial data fetching

Set `.requiredAPIs` to `[RecordAPIKey.Form]` (or any combination) to limit GraphQL data sources. For SSR, pass the same keys to `RecordDataManager.fetchRecord()`.

### Multiple providers

If you need to access a provider's data from outside its subtree, give it a unique `context-id` and retrieve its context with `RecordContext.getById(id)`. Otherwise, you can omit it — the provider generates one automatically.

## Accessibility, localization, and customization

Loading and error states are rendered inside the provider. Error markup uses `role="alert"`. Strings are provided by the package's localization messages and are not host-configurable.
