# Deployment details context

> Source: `@servicenow/aiux-controllers@1.3.20` · `controllers/docs/usage/deploymentDetailsContext.md`

`deploymentDetailsContext` holds the current app's Now Assist chat deployment:
whether chat is enabled for the signed-in user and which deployment records it
uses. The framework resolves it for each page from the app's configuration and
the instance; components only read it. The value is always an object, never
`null`, so `deploymentDetailsContext.get().enabled` is safe at any time.

## Import

```js
import {deploymentDetailsContext} from '@servicenow/aiux-controllers';
```

Import it only from `@servicenow/aiux-controllers`. The page shares one
instance of that package; a copy bundled any other way does not receive
updates made in the browser.

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import {deploymentDetailsContext} from '@servicenow/aiux-controllers';

@customElement('acme-ask-assistant')
export class AcmeAskAssistant extends AIUXElement {
  static contexts = [deploymentDetailsContext];

  _openChat() {
    this.dispatchEvent(
      new CustomEvent('aiux:open-chat', {bubbles: true, composed: true, detail: {}})
    );
  }

  render() {
    const {enabled} = deploymentDetailsContext.get();
    return enabled
      ? html`<button class="aiux-btn aiux-btn-primary" @click=${this._openChat}>Ask the assistant</button>`
      : null;
  }
}
```

**What happens:** on an app with chat deployed for the user, the button
renders on the server and in the browser; clicking it asks the app shell's
chat (see `ChatController`) to open. Where chat is not deployed or could not
be resolved, nothing renders. `static contexts` re-renders the element if the
value is resolved later in the browser.

## API

### Value

An object (see Data shapes). Default, before or without resolution:
`{enabled: false, deploymentDocumentId: null, nowAssistDeploymentId: null, deploymentDocumentTable: null, resolved: false}`.

| Field or method | Type | Meaning |
| --- | --- | --- |
| `get()` | `() => DeploymentDetails` | Current value. |
| `subscribe(callback)` | `(cb: (value: DeploymentDetails) => void) => () => void` | Called with the new value when it is set in the browser; not called with the current value. Returns an unsubscribe function. |
| `set()` | — | Throws `Error`: the context is immutable. |

### Providing

Provided by the framework; do not provide it yourself.

- **Apps with an app lifecycle module** (an `application.js`): resolved on the
  server for every page, before rendering, and sent to the browser with the
  page. The deployment is identified, in order, by `chatDeploymentChannelSysId`
  in the app's `aiux.json`, by a `chatDeploymentChannelSysId` experience
  property, or by the app's basename / experience URL suffix.
- **Experiences rendered only in the browser**: resolved in the browser when
  the app shell's `ChatController` initializes, unless the server already
  resolved it. The shell must therefore construct the controller without
  gating on `enabled`; the gate applies only to apps with an app lifecycle
  module.
- **Otherwise** (no identifier, no lifecycle module, or the request failed):
  the default value, with `enabled: false` and `resolved: false`.

### Consuming

```js
static contexts = [deploymentDetailsContext];

render() {
  const details = deploymentDetailsContext.get();
  if (!details.enabled) return null;
  // ...
}
```

- Readable in `render()` and event handlers, on the server and in the
  browser.
- `resolved: false` means no answer was obtained; `resolved: true` with
  `enabled: false` means the instance reported chat as disabled.
- There is no `@lit/context` bridge; `ContextConsumer` and `@consume` receive
  nothing.

### Updating

Not writable by components. The value changes only when the framework
resolves it.

### Data shapes

```ts
interface DeploymentDetails {
  enabled: boolean;                       // chat is active for this app and user
  deploymentDocumentId: string | null;    // sys_id of the deployment document
  deploymentDocumentTable: string | null; // table of the deployment document
  nowAssistDeploymentId: string | null;   // sys_id of the Now Assist deployment
  resolved: boolean;                      // true once the instance answered
}
```

## Integration details

### Platform requirements

Requires Now Assist chat deployed on the instance for the app, and an
authenticated user. On other instances the value stays at the default.
