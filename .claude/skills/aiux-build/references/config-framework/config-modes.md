# Config Modes — `static configMode`

In addition to `@configProperty` (**simple config** — persists values to the `sys_aix_configuration` table) and `@externalConfig` (**external config** — opens a platform table in a record-list editor), a component can set `static configMode` to defer configuration entirely to the widget author. Config modes do **not** persist data to `sys_aix_configuration` — the component author is responsible for their own storage.

A component can combine both — e.g., use `@configProperty` decorators for some properties while also setting `static configMode = 'inline-simple'` (**custom-url**) to expose a custom config URL.

> **Important:** All `@configProperty` decorator **options** accept static values only — dynamic option values are never supported. This does not constrain the field initializer, which is ordinary field-initializer code and commonly `i18n.getMessage('…')`.

> If a component needs its configuration persisted to the `sys_aix_configuration` table, it must use the `@configProperty` decorator pattern instead of (or in addition to) a config mode.

## `custom-url` — Custom URL Config

Components whose configuration lives in an external platform tool use this mode. The config editor discovers the component, renders a link-icon deep-linking button on its outline, and opens the returned URL in an iframe modal when clicked.

> **Naming note:** `custom-url` is a documentation-only label for this mode — it never appears as a literal in code. `static configMode` stays `'inline-simple'`.

A component can combine `custom-url` with `@configProperty` props — the config editor will show both the deep-linking button and the props pane pencil button.

`provideConfigDeepLinking()` is defined on the `AIUXElement` base class and returns `null` by default. Components that set `static configMode = 'inline-simple'` **override** this method to return a `{label, url}` object (or an array of them for multiple deep-linking buttons). The config editor calls `el.provideConfigDeepLinking()` on each discovered `inline-simple` element and renders a link-icon button for each returned entry.

> **Browser-only — browser APIs are safe here.** The config editor is never
> defined on the server (it bails on `isServer`), and its DOM scan that discovers
> `inline-simple` elements returns early there too. `provideConfigDeepLinking()`
> therefore only ever runs in the browser, so reading `window.location.origin`
> inside it needs **no** `isServer` guard. This is the exception to the usual
> no-unguarded-browser-APIs rule — which still applies to `constructor`,
> `connectedCallback`, and `render`.

```js
import {customElement} from 'lit/decorators.js';
import {i18n} from '@servicenow/aiux-services';
import {AIUXElement} from '@servicenow/aiux-components-core';

@customElement('my-list-config')
export class MyListConfig extends AIUXElement {
  static configMode = 'inline-simple'; // custom-url

  // Override the base class method — return one or more deep-linking entries.
  provideConfigDeepLinking() {
    return {
      label: i18n.getMessage('Configure Incident List'),
      url: `${window.location.origin}/incident_list.do`
    };
  }
}
```

### `provideConfigDeepLinking()` Return Shape

| Return type           | Description                        |
| --------------------- | ---------------------------------- |
| `{label, url}`        | Single deep-linking button           |
| `[{label, url}, ...]` | Multiple deep-linking buttons        |
| `null`                | No deep link (base class default)    |

| Property | Type     | Description                                                             |
| -------- | -------- | ----------------------------------------------------------------------- |
| `label`  | `string` | Button label shown on the outline deep-linking button — wrap in `i18n.getMessage()` for i18n |
| `url`    | `string` | URL loaded in the full-screen iframe modal                              |

The iframe modal is provided by `<aiux-config-editor-iframe-modal>` and emits `external-tool-modal:close` when dismissed.

## `inline-auto` — Self-Contained Config (Self-Config)

The component owns its entire config UI. Its outline in config mode carries a **Configure** toggle, set apart from the pencil and chevron beside it. Pressing it calls `openConfigEditor()` on the element with callbacks for change propagation and relabels the toggle **Exit configuration**; pressing it again calls `closeConfigEditor()` and relabels it back to **Configure**.

Entering config mode calls neither method. It used to call `openConfigEditor()` on every `inline-auto` component on the page as config mode opened, so an admin who came to change one component got every self-config form on the page unfolded at once. Exiting config mode still calls `closeConfigEditor()`, but only on the components the admin actually opened.

The integration is two-way: the component may also implement `configEditorSaveRequest()` and `configEditorCloseRequest()`, which the editor calls to ask the component to persist its own data or to approve the exit.

The element is **not** set to `inert` during config mode (unlike `@configProperty` components), so it can render its own editing UI. Neither is anything it contains while its session is open — `inert` inherits and cannot be lifted off a subtree, so an id'd child of an open component would otherwise be a dead patch in the middle of its form.

### Children of a Self-Config Component

**Give the component `aiux-config-id` and its children are configurable by the normal rules.** A self-configuring component used to own its entire subtree: the scan stopped at it, so a child carrying its own `aiux-config-id` had no config entry and no outline. That was necessary while every self-config form opened at once — the component's UI was on screen from the start, and a dashed box with a pencil over a child of it was two editors for one component.

Now that the admin opens one deliberately, the two surfaces take turns. A component carrying `aiux-config-id` has its descendants scanned as ordinary entries, and their outlines are drawn **only while its own Configure toggle is off**:

| Component's own session | Its children's outlines | What the admin is editing |
| ----------------------- | ----------------------- | ------------------------- |
| Closed                  | Drawn, with pencil and chevron | the component from the outside — its children's `@config` props |
| Open                    | Hidden                  | the component from the inside — its own form |

A component with **no** `aiux-config-id` still owns its whole subtree, and that is not a policy choice: a child's value is keyed as `<chain>.<prop>` in the nearest anchoring ancestor's `aiuxConfigData` bag, and a component that never opted into config addressing has no such bag — so the edit would be offered and then saved nowhere. Add the id to the self-config component, not just to the child.

Regions rendered inside a self-configuring component stay excluded either way. A region is *loaded*, into an editing session with a canvas, a working tree and its own pending DSL text — not drawn as a surface that can be shown and hidden on a toggle, so handing one out and taking it back on every press of **Configure** would put the admin's unsaved layout edits on that toggle.

### Inside a Region

A widget placed in a region gets the same toggle, drawn by the region canvas rather than on an outline — a widget that is a node of a loaded region has no outline, because the canvas owns its surface. It is a labelled button of its own, standing to the left of the pencil/chevron split button, so the affordances read the same way inside a region as outside one: `[Configure]  [pencil | chevron]`. It is the one control the canvas draws with a visible label, because its press has two meanings and only the words say which.

**It does not require `aiux-config-id`,** unlike the pencil. The toggle is offered to any widget whose class declares `inline-auto` and whose element implements `openConfigEditor` — `inline-auto` says nothing about editor-side storage, so `<my-self-config-widget />` is a perfectly good region node. Without an id the widget has no scanned config entry, which costs exactly two things: `fieldValues` opens empty, and `onChange` logs an error instead of storing the value (there is nowhere to store it). `onSave`, `onClose`, `onDirtyChange`, `configEditorSaveRequest()` and `configEditorCloseRequest()` are unaffected. Add `aiux-config-id=${"some-id"}` when you want the editor to hold the widget's values; leave it off when the widget persists its own.

While the widget holds a session the editor **relays presses into it**. Editing a region otherwise takes every press in the region for the editor — `pointerdown` is prevented and `click` is swallowed in capture, which is what makes a press on a card select the card rather than submit its form — and for a component the admin asked to configure, the form under the pointer *is* the configuration UI. So for as long as the session is open, that one widget:

- receives pointer, click and `Escape` events untouched;
- is not selected by a press, and arms no drag;
- loses its resize brackets and its four `+` insertion pills;
- is exempt from the region's `user-select: none` and `cursor: grab`.

Every other widget in the region behaves exactly as before, and so does this one the moment the admin presses **Exit configuration** — it can be moved, resized and rearranged again. A structural edit to the region hands every open session back first, because re-rendering the region from its DSL remounts the widgets in it.

```js
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';

@customElement('my-self-config-card')
export class MySelfConfigCard extends AIUXElement {
  static configMode = 'inline-auto';
  @state() _editing = false;
  _onChange = null;
  _onSave = null;
  _onClose = null;
  _onDirtyChange = null;

  openConfigEditor({fieldValues, onChange, onSave, onClose, onDirtyChange}) {
    this._onChange = onChange;
    this._onSave = onSave;
    this._onClose = onClose;
    this._onDirtyChange = onDirtyChange;
    this._editing = true;
  }

  closeConfigEditor() {
    this._editing = false;
    this._onChange = null;
    this._onSave = null;
    this._onClose = null;
    this._onDirtyChange = null;
  }

  // Call this._onChange(key, value) when user edits a field
  // Call this._onSave() to persist and exit config mode
  // Call this._onClose() to exit config mode without persisting
  // Call this._onDirtyChange(true|false) so the toolbar's Save button and the
  // navigate-away prompt reflect edits the editor cannot see

  // OPTIONAL. The admin pressed Save. Persist whatever you own and return
  // false if you could not — the editor reports the failure and stays open.
  async configEditorSaveRequest() {
    return this._persist();
  }

  // OPTIONAL. The admin is leaving the editor. Return false to refuse, and
  // show your own reason: the editor sets no message of its own here.
  async configEditorCloseRequest() {
    if (!this._saving) return true;
    this._refusalReason = 'Still saving…';
    return false;
  }
}
```

### `openConfigEditor()` Parameter Shape

| Property      | Type                                | Description                                                                                        |
| ------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `fieldValues` | `object`                            | Current persisted config values (`aiuxConfigData`) for the component                               |
| `onChange`    | `(key: string, value: any) => void` | Notify the config editor that a field value changed. The editor tracks the change for persistence. |
| `onSave`      | `() => void`                        | Signal the config editor to persist and exit config mode                                           |
| `onClose`     | `() => void`                        | Signal the config editor to exit config mode                                                       |
| `onDirtyChange` | `(dirty: boolean) => void`        | Report whether the component holds unsaved edits of its own. Enables the toolbar's Save button and arms the navigate-away prompt, for data the editor never sees. |

### Methods the Editor Calls on the Component

Both are **optional**. A component that does not implement one, or that returns anything other than `false`, counts as success — the editor has to keep working for components written before these existed. Every **open** `inline-auto` component on the page is called in parallel, so N components cost one round trip rather than N.

Only open ones. A component the admin never opened from its **Configure** toggle has no editing session: asking it to persist means asking it to write whatever its fields happen to hold, which for a component that clears them in `closeConfigEditor()` is nothing, over the admin's real data. It has nothing to veto an exit over either.

| Method                                         | Called when                                                                          | Returning `false`                                                                                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `configEditorSaveRequest(): Promise<boolean>`  | The admin saves — on **every** save, not only in one editing state                   | The editor names the component in its toolbar error and stays in config mode. Its own config-record writes are accounted separately and still commit.         |
| `configEditorCloseRequest(): Promise<boolean>` | The admin exits the editor (toolbar Exit button, `cancel()`, `__TOGGLE_CONFIG_MODE__()`) | The exit is refused. Config mode stays open and the discard-changes prompt never runs — so the **component** must show why it refused; the editor shows nothing. |

> **Note:** Unlike `@configProperty` (simple config) components — where the config editor manages dirty state and shows a confirmation modal — `inline-auto` (self-config) and `custom-url` components own their entire editing lifecycle. The component author decides how to handle unsaved changes: auto-save after every `onChange`, report dirtiness through `onDirtyChange` and let the editor's Save drive `configEditorSaveRequest()`, refuse the exit from `configEditorCloseRequest()` while a custom prompt is up, or simply discard.

**`closeConfigEditor()`** — Called when the admin presses **Exit configuration** on the component's toggle, and when config mode exits (via save, cancel, or page navigation) with the component still open. The component should tear down its editing UI and clear callback references. Its reported dirty state is cleared with it, on the grounds that this call is what discards whatever the component was holding.
