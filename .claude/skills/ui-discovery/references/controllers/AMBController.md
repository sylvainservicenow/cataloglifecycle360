# AMBController

> Source: `@servicenow/aiux-components-core@10.6.9` · `components/core/docs/usage/AMBController.md`

`AMBController` holds a component's AMB (Asynchronous Message Bus)
subscriptions: you declare channels or record watchers with a callback, it
opens them through the shared `getAMBService()` connection while the host is
connected, and closes them on disconnect. It only delivers messages; it does
not load initial data, re-fetch after reconnect, or re-render the host. Assign
reactive state in the callback to update the view.

## Import

```js
import {AMBController} from '@servicenow/aiux-components-core';

/** @typedef {import('@servicenow/aiux-components-core').AMBSubscription} AMBSubscription */
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement, AMBController} from '@servicenow/aiux-components-core';

@customElement('incident-live-state')
export class IncidentLiveState extends AIUXElement {
  @property({type: String}) sysId = '';
  @property({type: String}) initialState = '';
  @state() _state = '';

  _amb = new AMBController(this);

  willUpdate(changed) {
    super.willUpdate(changed);
    if (changed.has('initialState')) this._state = this.initialState;
  }

  updated(changed) {
    super.updated(changed);
    if (changed.has('sysId')) {
      // Replaces the previous watcher, so switching records never stacks subscriptions.
      this._amb.setRecordWatchers(
        this.sysId ? [{table: 'incident', query: `sys_id=${this.sysId}`}] : [],
        message => this._onRecordChange(message)
      );
    }
  }

  _onRecordChange(message) {
    const value = message?.data?.record?.state?.value;
    if (value !== undefined) this._state = value;
  }

  render() {
    return html`<span class="aiux-badge">State: ${this._state || '—'}</span>`;
  }
}
```

**What happens:** the host renders the loaded `initialState`; after that,
each change the instance publishes for that incident calls the callback, and
assigning `_state` re-renders. Changing `sysId` drops the old watcher and
opens the new one. Removing the element closes the subscription; re-inserting
it reopens the same watcher.

### Additional patterns

Channels from loader data, one callback for all:

```js
connectedCallback() {
  super.connectedCallback();
  this._amb.setChannels(this.loaderData?.ambChannels ?? [], msg => this._onMessage(msg));
}
```

Legacy hosts whose callback writes non-reactive fields can opt back into a
render after every message:

```js
_amb = new AMBController(this, {requestUpdateOnMessage: true});
```

Test with the in-memory service. `hostConnected()` does nothing when Lit's
`isServer` is `true`, which it is in a Node-environment Vitest run. Run the
test in Vitest browser mode, or mock `isServer` to `false` as below. Vitest
mocks do not apply inside externalized dependencies, so the mock reaches the
package only when it is inlined
(`server.deps.inline: ['@servicenow/aiux-components-core']`):

```js
import {vi} from 'vitest';
import {AMBController, MockAMBService, buildRecordWatcherChannel} from '@servicenow/aiux-components-core';

vi.mock('lit', async () => ({...(await vi.importActual('lit')), isServer: false}));

const mock = new MockAMBService();
const host = {addController() {}, requestUpdate() {}};
const amb = new AMBController(host, {service: mock});
const received = [];
amb.subscribeToRecordWatcher('incident', 'active=true', msg => received.push(msg));
amb.hostConnected();
mock.receiveMessage(buildRecordWatcherChannel('incident', 'active=true'), {data: {sys_id: 'abc'}});
// received[0].data.sys_id === 'abc'
```

## API

### Constructor

```ts
new AMBController(host: ReactiveControllerHost, options?: AMBControllerOptions)
```

- `host`: any Lit `ReactiveControllerHost` (an `AIUXElement`); the controller
  calls `host.addController(this)`. Creating it as a class field or in the
  constructor is typical.
- `options.service`: service used instead of the `getAMBService()` singleton,
  typically a `MockAMBService` in tests. Read at each activation.
- `options.requestUpdateOnMessage` (default `false`): when `true`, calls
  `host.requestUpdate()` after each callback returns.

### Methods and fields

| Member | Signature | Effect |
| --- | --- | --- |
| `subscribe` | `(channel: string, callback: (message: AMBMessage) => void) => void` | Adds one channel subscription. Opens it now if the host is connected, otherwise on connect. Adds to, never replaces, earlier subscriptions; there is no per-channel unsubscribe. |
| `setChannels` | `(channels: string[], callback: (message: AMBMessage) => void) => void` | Closes and forgets every subscription (including ones from `subscribe`), then subscribes each channel with the same callback. `setChannels([], cb)` removes all. |
| `subscribeToRecordWatcher` | `(table: string, query: string, callback: (message: AMBMessage) => void, actionPrefix?: string) => void` | `subscribe` on the channel `/rw/{actionPrefix}/{table}/{base64(query)}`; `actionPrefix` defaults to `'default'`. `query` is an encoded query (`active=true^priority=1`). |
| `setRecordWatchers` | `(watchers: RecordWatcher[], callback: (message: AMBMessage) => void) => void` | `setChannels` with one record-watcher channel per entry. |
| `hostConnected` | `() => void` | Called by Lit. Opens all declared subscriptions (see Lifecycle). |
| `hostDisconnected` | `() => void` | Called by Lit. Closes all open subscriptions and keeps the declarations. |

### Behavior

- **Callback.** Called as `callback(message)`, without a `this` binding; pass an
  arrow function or bound method. The message is passed through unchanged from
  the AMB client; the payload is in `message.data` (see Data shapes).
- **No render by default.** The controller does not re-render the host after a
  message. Assigning a reactive property or `@state` field in the callback
  renders; writing a plain field does not, unless `requestUpdateOnMessage` is
  set or you call `this.requestUpdate()`.
- **Duplicates.** Each `subscribe`/`subscribeToRecordWatcher` call adds an
  entry, and entries survive disconnect. Calling one of them in
  `connectedCallback`, or again when a property changes, adds another entry
  each time; use `setChannels`/`setRecordWatchers` for anything that can
  repeat.
- **Shared connection.** All controllers share one AMB connection; the
  service opens each channel once and fans messages out to every subscriber.
  Once the AMB client has loaded, activations from one `hostConnected` or
  `setChannels` call are sent in one network batch; before that, they run
  unbatched and the queued channels open when it loads.
- **Loading and reconnect.** The AMB client library loads lazily on first
  use; channels declared before it is ready are opened once it loads. After a
  dropped connection, the client re-subscribes open channels on its own. The
  controller does not report connection state or replay missed messages; to
  reload after a reconnect, use `getAMBService().subscribeToEvent('connection.opened', …)`.
- **Failures.** If the library cannot load or the channel yields nothing,
  callbacks simply never run (the library-load case logs a console warning).
  No error reaches the host.
- Dispatches no events.

### Lifecycle

- `hostConnected`: in the browser, marks the controller connected and opens
  every declared subscription. On the server it does nothing.
- `hostDisconnected`: closes every open subscription; declarations are kept.
- Reusable: on reconnect the same declarations reopen automatically. Declare
  them once (constructor, `firstUpdated`, or on property change with
  `setChannels`/`setRecordWatchers`); nothing needs cleanup in
  `disconnectedCallback`.
- Calls made while disconnected are queued and opened on the next connect.

### Exported helpers

| Export | Signature | Use |
| --- | --- | --- |
| `getAMBService` | `() => AMBService` | The shared service singleton the controller uses. Use it for non-component code, `publish`, and connection events (methods below). Always returns an object; methods are no-ops on the server. |
| `buildRecordWatcherChannel` | `(table: string, query: string, actionPrefix?: string) => string` | Builds the `/rw/…` channel name used by the record-watcher methods, for `subscribe`/`setChannels` lists or test messages. |
| `MockAMBService` | `new MockAMBService()` | In-memory service for tests; pass as `options.service` or via `setAMBService`. `receiveMessage(channel, message)` delivers to subscribers, `emitEvent(event, data)` fires connection events, `hasSubscribers(channel)`, `getPublished()`, `clearPublished()`. Its own `subscribeToRecordWatcher` puts the raw query in the channel, not base64; to pair with `buildRecordWatcherChannel`, subscribe through `AMBController` or `mock.subscribe(buildRecordWatcherChannel(…), cb)`. |
| `setAMBService` | `(service: object) => void` | Replaces the singleton returned by `getAMBService()` (test injection). |

`AMBService` members from `getAMBService()`:

| Member | Signature | Effect |
| --- | --- | --- |
| `subscribe` | `(channel, callback) => AMBSubscription` | Direct subscription; call `unsubscribe()` yourself. |
| `subscribeToRecordWatcher` | `(table, query, callback, actionPrefix?) => AMBSubscription` | Direct record-watcher subscription. |
| `publish` / `publishAsync` | `(channel, message, callback?) => void` | Sends a message; `publishAsync` falls back to REST for payloads over the transport size limit. |
| `subscribeToEvent` | `(event: string, callback) => AMBSubscription` | Connection events such as `'connection.opened'`. Dropped (no-op handle) if the client is not loaded yet; wrap in `whenReady`. |
| `whenReady` | `(callback) => AMBSubscription` | Runs `callback` once the connection is open (synchronously if it already is); `unsubscribe()` cancels it. |
| `getConnectionState` | `() => string \| null` | `'closed'`, `'initialized'`, `'opened'` (connected), or `'broken'`; `null` on the server or before the library loads. |
| `isLoggedIn` | `() => boolean` | Whether the AMB client reports an authenticated session. |
| `batch` | `(fn: () => void) => void` | Groups subscribe/publish calls in `fn` into one round trip once the client has loaded; before that, runs `fn` unbatched. |
| `connect` / `disconnect` | `() => void` | Manual connection control; the client connects on its own. |
| `getClient` | `() => object \| null` | Raw AMB client; `null` on the server or before load. |

### Data shapes

```ts
interface AMBControllerOptions {
  service?: object;                 // same interface as AMBService
  requestUpdateOnMessage?: boolean; // default false
}

interface RecordWatcher {
  table: string;
  query: string;          // encoded query
  actionPrefix?: string;  // default 'default'
}

interface AMBMessage {
  channel?: string;
  data: {
    // Record watcher messages:
    sys_id?: string;
    record?: Record<string, {value?: string; [key: string]: unknown}>;
    // Other channels: payload defined by the server-side publisher.
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface AMBSubscription {
  unsubscribe(): void;
}
```

`AMBSubscription` is exported as a type from `@servicenow/aiux-components-core`.

## Integration details

### Platform requirements

Messages arrive only when the page is served by a ServiceNow instance with an
authenticated user session; elsewhere subscriptions stay silent. Record
watchers report changes only; load the initial data yourself (loader or
fetch).

### SSR

Safe to construct and call on the server: nothing connects, callbacks never
run, and declared subscriptions open after hydration when the element
connects in the browser. No `isServer` guard is needed around the controller.
