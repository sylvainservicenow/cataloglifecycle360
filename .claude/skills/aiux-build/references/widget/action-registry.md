# Action Registry

Page-wide mechanism for registering named actions that other code can discover and run — no DOM references between widgets. One registry serves three use cases:

- **Chat (Otto) invocation** — the LLM discovers actions and runs them through chat's `execute_action` tool (only in apps that opted in via `EXECUTE_ACTION_TOOL` / `client_tools`).
- **Widget-to-widget invocation** — a toolbar button that saves a form elsewhere on the page, or a consumer that invokes whatever actions happen to be registered.
- **Keyboard shortcut invocation** — an action claims a key combo via its `shortcut` field.

> **Not for chat.** Client tools (`references/widget/chat-integration.md`) are the chat↔widget contract. There is deliberately no programmatic way to invoke a client tool — widget-to-widget invocation always goes through the action registry instead.

---

## "Configure an action" — which thing does the user actually mean?

The word "action" is overloaded. Before writing anything, classify the request:

| User says…                                                                                     | They mean                                                                       | Do this                                                                                                   |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| "Add a button/UI action on the `incident` form/list", "add a native ServiceNow UI action", "show this as a form button / list banner button / context-menu item on the table" | A **ServiceNow UI Action** — a `sys_ui_action` table record. Platform configuration, not AIUX widget code. | See [A ServiceNow UI Action is not built through this skill](#a-servicenow-ui-action-sys_ui_action-is-not-built-through-this-skill) below — not yet covered here; ask the user to configure it on the table directly. Do **not** write `registerActions` for this. |
| "Let this widget trigger/run/refresh another widget", "register a custom action", "add a keyboard shortcut that isn't a form button", "a consumer that discovers and runs whatever's registered" | A **custom action registry entry** — code, owned by a widget, invoked widget-to-widget (or by chat's `execute_action` tool). | Use `registerActions`/`@action`/`ActionController` below. |
| "Why does `executeAction`/the action bar show this ref twice" / "two forms, same action" | A UI Action with **multiple owners** (two providers for the same table/ref) — expected, not a bug. | See [Multi-owner](#model) and [Targeting one owner vs. broadcasting](#targeting-one-owner-vs-broadcasting). |

A `sys_ui_action` record and a `registerActions` descriptor both end up as entries in the same registry and both answer to `executeAction`/`broadcastAction` — but only one of them is something you write AIUX source code for. Get this classification right before touching any file.

---

## Imports

```js
import {
  registerActions,
  unregisterActions,
  getAction,
  listActions,
  executeAction,
  broadcastAction,
  listActionsWithOwners,
  actionRegistryContext,
  action,
  ActionController
} from '@servicenow/aiux-components-core';
```

---

## Model

Actions are keyed by a stable `actionRef` (e.g. a UI action's `sys_id` or a hand-picked string like `'my-widget:refresh'`). Any widget can register named actions; any other widget can discover and run them by ref. The registry is backed by a reactive context (`actionRegistryContext`) whose value is a serializable, deduped-by-ref snapshot (`{actionRef, name, description, arguments, metadata}`) — subscribe to it to re-render as actions change.

A single `actionRef` can have **more than one owner** (e.g. two record forms for the same table). `executeAction` runs the sole owner, or rejects on ambiguity unless `{owner}`/`{widgetId}` is given. `broadcastAction` runs every owner and never rejects.

Client-only: registration never happens during SSR, so server-rendered instances can't leak across requests.

---

## Registering: three ways, by how static the descriptor is

### 1. `registerActions` / `unregisterActions` — direct, for state-dependent registration

```js
connectedCallback() {
  super.connectedCallback();
  registerActions(this, [
    {
      actionRef: `${this.label}:addNote`,
      name: 'Add note',
      description: 'Append a note to this widget.',
      execute: ({text} = {}) => { /* … returns a value or a Promise */ }
    }
  ]);
}

disconnectedCallback() {
  unregisterActions(this);
  super.disconnectedCallback();
}
```

Use this when the caller isn't an `AIUXElement`, or the registration needs manual control. Every descriptor needs both `name` and a top-level `description` (not inside `metadata`) — a missing `description` logs a warning and leaves an empty description in `listActions()` and the chat catalog.

Full signature: `registerActions(owner, descriptors, ownerContext?, {advertiseToChat = true})`. Pass `{advertiseToChat: false}` as the 4th argument to keep the actions out of chat.

### 2. `@action` — declarative, for a descriptor fixed at class definition

```js
class MyWidget extends AIUXElement {
  @action({
    actionRef: 'my-widget:refresh',
    name: 'Refresh',
    description: 'Reload this widget\'s data.',
    shortcut: {mac: {metaKey: true, code: 'keyr'}, win: {ctrlKey: true, code: 'keyr'}}
  })
  refresh() { /* … */ }
}
```

`AIUXElement`'s own `connectedCallback`/`disconnectedCallback` register and unregister it automatically — no boilerplate needed. **Static only**: the descriptor (including `shortcut`) is fixed at class definition and never re-evaluated on property changes. If the shortcut or any other field needs to vary per instance or be resolved after connect, use `ActionController` instead.

Two limits: registration is own-class only (a subclass does not inherit its parent's `@action` methods), and `@action` registers under a private placeholder owner rather than the element — so `executeAction(ref, args, {owner: el})` and `getAction(ref, {owner: el})` do **not** reach it. Target it with the `{widgetId}` from `listActionsWithOwners()`, or omit the owner when it's the only one.

### 3. `ActionController` — a `ReactiveController` for descriptors that depend on instance state

```js
class MyWidget extends AIUXElement {
  _shortcuts = new ActionController(
    this,
    () => this._shortcutDescriptors(), // called fresh on every sync()
    {advertiseToChat: false}
  );

  // later, when whatever _shortcutDescriptors() reads has actually changed:
  //   this._shortcuts.sync();
}
```

Registers on `hostConnected`, unregisters on `hostDisconnected` — no `connectedCallback`/`disconnectedCallback` wiring needed. `sync()` is **not** re-run on every host update (it republishes the reactive context and the AIEL catalog) — call it explicitly only when the descriptor-driving state actually changed.

**Choosing between the three:** fixed-forever descriptor → `@action`. Descriptor depends on state that changes after connect → `ActionController`. Caller isn't a Lit `ReactiveControllerHost`, or needs full manual control → `registerActions`/`unregisterActions` directly.

---

## Invoking

```js
// discover what's available right now (deduped by ref)
const actions = listActions(); // [{actionRef, name, description, arguments, metadata}]

// same, plus owners — for targeting
const withOwners = listActionsWithOwners(); // + owners: [{widgetId, context}]

// rejects only on registry errors (no owner / ambiguous / unknown owner);
// the action's own outcome is settled into an envelope — a throwing executor resolves with success: false
const {success, data, error} = await executeAction('a1b2…', {field: 'x'});

// run one specific owner's action
await executeAction('a1b2…', {field: 'x'}, {owner});
// or
await executeAction('a1b2…', {field: 'x'}, {widgetId});

// run the same ref on EVERY owner — never rejects, settled result per owner
const results = await broadcastAction('a1b2…');
```

| Call                                 | Resolves to                                             | When                                                          |
| ------------------------------------ | -------------------------------------------------------- | -------------------------------------------------------------- |
| `executeAction(ref, args)`           | `{success, actionRef, data?, error?}`                    | exactly one widget owns `ref`; rejects if zero or more than one |
| `executeAction(ref, args, {owner})`  | `{success, actionRef, data?, error?}`                    | run one specific owner (widget-to-widget, single target)        |
| `broadcastAction(ref, args)`         | `[{actionRef, widgetId, success, data?, error?}]`         | run every owner of `ref`; never rejects on a single owner's failure |
| `listActions()`                      | `[{actionRef, name, description, arguments, metadata}]` (deduped by ref)         | discovery — build an action bar, or surface the catalog to the LLM |
| `getAction(ref, {owner})`            | the full `ActionEntry` (incl. executor), or `undefined`    | you need the executor closure for one owner                     |

A consumer widget should hold no action refs it doesn't own, and no DOM references to the widgets it invokes — subscribe to `actionRegistryContext` (`static contexts = [actionRegistryContext]`) to re-render as the registry changes, then drive everything through `listActions()`/`executeAction()`/`broadcastAction()`.

---

## UI actions are a subset — `metadata.source`

The registry is generic: custom (non-UI) actions registered directly via `registerActions` work the same as UI actions. Record forms and lists register their UI actions from the data/controller layer (`ActionsAPI` for records, `ListController` for lists) via `registerUiActions` — **never register UI actions by hand in widget code**; they come from the platform automatically (see below).

Every descriptor built by `registerUiActions` is tagged `metadata.source: 'ui-action'`. `registerActions` defaults `metadata.source` to `'pro-code'` when a descriptor doesn't already carry one, so a consumer of `listActions()` can always distinguish the two without the caller opting in:

```js
const uiActions = listActions().filter(a => a.metadata?.source === 'ui-action');
const customActions = listActions().filter(a => a.metadata?.source !== 'ui-action');
```

Do not build custom action bars by hand-querying record/list state — discover via `listActions()`/`listActionsWithOwners()` instead, so the bar stays correct as forms/lists mount and unmount.

### A ServiceNow UI Action (`sys_ui_action`) is not built through this skill

A ServiceNow **UI Action** is a platform-configured record (`sys_ui_action`) predating AIUX — not AIUX widget source, and not something to write with `registerActions`. This skill does not yet cover how to configure one. If the request is to add/change a UI Action itself (as opposed to invoking one that already exists), say so and ask the user to configure it on the table directly (Studio, or however UI Actions are managed on their instance today) rather than guessing at an implementation here.

Once a UI Action exists on a table, it needs zero AIUX code to appear: any `aiux-record-provider`/`aiux-record-form` or `aiux-list-connected` on that table surfaces it in the registry automatically, tagged `metadata.source: 'ui-action'` — see above. From that point on, treat it like any other registry entry: discover with `listActions()`, run with `executeAction(ref)`/`broadcastAction(ref)`. You read/run a UI Action; you don't `registerActions()` it.

### Targeting one owner vs. broadcasting

The same `actionRef` (UI Action or custom) commonly has multiple owners — two forms for the same table, or a form button and a context-menu item that happen to share a label. Chat's `execute_action(action_ref, widget_id?, broadcast?, args?)` tool flattens every match into `{actionRef, widgetId}` targets and resolves deterministically:

- **Exactly one target** → runs it directly.
- **More than one target, `widget_id` given and it matches** → `executeAction(ref, args, {widgetId})` runs only that target.
- **More than one target, `broadcast: true`** → runs every target, settled per target.
- **More than one target, neither given** → does not guess; returns a settled failure listing every target so chat can ask the user which widget they mean (offering "run on all" as an explicit choice), then re-calls with that `widget_id` or `broadcast: true`.

Widget-to-widget code follows the same two choices directly: `executeAction(ref, args, {owner})` to target one, `broadcastAction(ref, args)` for all — never guess at "the" owner when `listActionsWithOwners()` shows more than one.

---

## Keyboard shortcuts

Any registered action can claim a keyboard combo via the `shortcut` field — the same descriptor then drives both invocation paths (registry call, and a keypress):

```js
{
  actionRef: 'my-widget:save',
  name: 'Save',
  description: 'Save the current record.',
  shortcut: {mac: {metaKey: true, code: 'keys'}, win: {ctrlKey: true, code: 'keys'}},
  execute: () => this._save()
}
```

Pass `{advertiseToChat: false}` to keep an action registry-only (not chat-invocable): as `ActionController`'s 3rd argument, or as `registerActions(owner, descriptors, ownerContext, {advertiseToChat: false})`. `shortcut` is independent of this — leaving it out only means no combo is claimed; the action is still advertised to chat.

`KeyboardShortcutService.getInstance().init()` (from `@servicenow/aiux-services`, already started by the nav shell in every real app) is the global keydown listener — no widget needs to wire its own. On a collision (two widgets own the same combo), it resolves by walking up from `document.activeElement` (closest containing owner wins), falling back to `<aiux-shortcut-ambiguity-dialog>` only when focus doesn't resolve it.

**Deprecated, do not use in new code:** `KeyboardShortcutController`, `ComponentRegistry`, `resolveShortcut` (from `@servicenow/aiux-services`) — compatibility shims over this same registry.
