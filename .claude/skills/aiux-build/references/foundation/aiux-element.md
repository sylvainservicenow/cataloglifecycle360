# AIUXElement Foundation

## Base Classes

### AIUXElement

Extends `LitElement`. Base class for all AIUX components — pages, layouts, and custom components.

```js
import {AIUXElement} from '@servicenow/aiux-components-core';
import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';

@customElement('my-app-element')
export class MyElement extends AIUXElement {
  static styles = css`
    :host {
      display: block;
    }
  `;
  render() {
    return html`<div>Hello</div>`;
  }
}
```

### AIUXWidgetElement

Extends `AIUXElement`. Adds `this.server` for GlideRecord/GlideQuery communication and global adopted stylesheets. Used for standalone widgets.

```js
import {AIUXWidgetElement, decorators} from '@servicenow/aiux-components-core';
const {name, description, discoverable, bestFor} = decorators;

@customElement('aiux-my-widget')
@discoverable(true)
@name('My Widget')
@description('What this widget does')
@bestFor('When to use this widget')
@server('./server.js')
export default class MyWidget extends AIUXWidgetElement { ... }
```

Key differences from `AIUXElement`:

- `this.server.get({action, ...params})` — calls server script
- `this.server.update()` — re-fetch default data
- `this.trackEvent(name, detail)` — analytics
- Global styles adopted automatically (Tailwind + DaisyUI available in shadow DOM)
- `@server` decorator to bind server-side script

### WithData Mixin

Auto-binds server data to `this.data`. Use when the widget simply renders server-provided data.

```js
import {WithData, AIUXWidgetElement} from '@servicenow/aiux-components-core';

export default class MyWidget extends WithData(AIUXWidgetElement) {
  render() {
    // this.data is automatically populated from server script's `data` object
    const items = this.data?.items || [];
    return html`<ul>
      ${items.map(i => html`<li>${i.name}</li>`)}
    </ul>`;
  }
}
```

### withWidgetContext Mixin

Enables bidirectional widget ↔ AI chat communication. See `references/chat-integration.md` for full API.

```js
import {AIUXElement, withWidgetContext} from '@servicenow/aiux-components-core';

class MyWidget extends withWidgetContext(AIUXElement) {
  static client_tools = { ... };
  static aiContext = { description: '...', bestFor: '...' };
  firstUpdated() { this.setAiContext({key: 'value'}); }
}
```

---

## Reactive Properties and State

### With decorators (TS or decorator-enabled JS)

```js
import {property, state, query} from 'lit/decorators.js';

@property({type: String}) label = '';       // public, reflects to attribute
@state() _loading = false;                  // internal, no attribute
@query('#input') _inputEl;                  // DOM reference
```

### Without decorators (plain JS)

```js
static properties = {
  label: {type: String},
  _loading: {type: Boolean, state: true},
  _items: {type: Array, state: true}
};
```

**Rules:**

- Every entry MUST include a `type` key
- Internal state MUST have `state: true`
- All properties MUST be initialized with defaults in `constructor()`
- Declare only the component's own properties — Lit merges the prototype chain automatically

---

## Lifecycle Methods

| Method                   | When                | Key rules                                                                               |
| ------------------------ | ------------------- | --------------------------------------------------------------------------------------- |
| `constructor()`          | Instantiation       | Always call `super()`. Initialize all properties. No DOM access.                        |
| `connectedCallback()`    | Attached to DOM     | Always call `super.connectedCallback()`. Start data fetch, add listeners.               |
| `willUpdate(changed)`    | Before every render | Sync derived state. Re-provide scoped context on navigation. No `this.requestUpdate()`. |
| `render()`               | Each update cycle   | Return `html` template. Pure — no side effects, no mutations.                           |
| `firstUpdated()`         | After first render  | Client-only init (focus, scroll, third-party libs).                                     |
| `updated(changed)`       | After every render  | React to changes. No `this.update()`.                                                   |
| `disconnectedCallback()` | Removed from DOM    | Always call `super.disconnectedCallback()`. Clean up all resources.                     |

### Resource Cleanup (disconnectedCallback)

**All resources acquired in lifecycle MUST be released:**

| Resource                | Setup                                 | Cleanup                                         |
| ----------------------- | ------------------------------------- | ----------------------------------------------- |
| `addEventListener`      | `connectedCallback`                   | `removeEventListener` in `disconnectedCallback` |
| `IntersectionObserver`  | `new IntersectionObserver(...)`       | `.disconnect()`                                 |
| `ResizeObserver`        | `new ResizeObserver(...)`             | `.disconnect()`                                 |
| `MutationObserver`      | `new MutationObserver(...)`           | `.disconnect()`                                 |
| `setTimeout`            | `setTimeout(...)`                     | `clearTimeout(...)`                             |
| `setInterval`           | `setInterval(...)`                    | `clearInterval(...)`                            |
| `requestAnimationFrame` | `rAF(...)`                            | `cancelAnimationFrame(...)`                     |
| `AbortController`       | `new AbortController()`               | `.abort()`                                      |
| Event subscriptions     | `emitter.on(...)`                     | `emitter.off(...)`                              |
| Record watcher          | `recordWatcherService.subscribe(...)` | `.unsubscribe()`                                |
| Scoped context          | `ctx.provide(this, ...)`              | `ctx.unprovide(this)`                           |

```js
connectedCallback() {
  super.connectedCallback();
  this._observer = new IntersectionObserver(this._onIntersect);
  this._observer.observe(this);
  document.addEventListener('scroll', this._onScroll);
  this._timer = setInterval(this._poll, 5000);
}

disconnectedCallback() {
  super.disconnectedCallback();
  this._observer?.disconnect();
  document.removeEventListener('scroll', this._onScroll);
  clearInterval(this._timer);
}
```

---

## Event Handler Binding

Bind handlers in the constructor to ensure stable references:

```js
constructor() {
  super();
  this._handleClick = this._handleClick.bind(this);
  this._handleKeyDown = this._handleKeyDown.bind(this);
}
```

For loops, use `data-*` attributes with a single bound handler:

```js
${items.map(item => html`<li data-id=${item.id} @click=${this._handleSelect}>${item.name}</li>`)}
_handleSelect(e) { const id = e.currentTarget.dataset.id; ... }
```

---

## Custom Component Sub-Packages (TS)

When an app ships its own Lit components in a pnpm workspace:

```
components/my-component/
├── package.json          # @servicenow/aiux-components-my-component
├── build.js              # SWC transpiler: legacyDecorator + loose
├── index.js              # export * from './vN/index.js'
└── src/
    ├── my-component.ts   # @customElement('my-app-my-component')
    └── index.ts          # re-export
```

**Critical:** `lit` must be a **`peerDependency`**, not `dependency`. Putting `lit` in `dependencies` creates two Lit instances, breaking reactive updates.
