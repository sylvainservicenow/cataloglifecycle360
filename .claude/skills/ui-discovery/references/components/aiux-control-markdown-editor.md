# AIUXControlMarkdownEditor

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-markdown-editor.md`

A form-field control that mounts the `sn-markdown-editor` rich editor for editing markdown text, host-settable toolbar/sizing/placeholder, and reports back the committed and in-progress markdown text. If the editor library fails to load, the control falls back to a plain read-only `<textarea>` showing the raw value.

**Value ownership.** While the editor is mounted, its own in-memory buffer is
the source of truth for what is on screen; the `value` property is only a
one-way sync target that the control pushes into the live editor with
`setValue` whenever `value` changes and differs from what the editor already
holds. The control itself always keeps `value` current — both `onChange` and
`onBlur` set `this.value` before dispatching their event — so you do not need
to round-trip the host's own state just to keep the control in sync with
itself. But if you call `reset()`, or otherwise assign an older `value` back
onto the element (for example re-applying a value you captured before the
user's last edit), that overwrite is applied unconditionally and clobbers
whatever the user is currently typing, with no merge or confirmation.

Built in: lazy-loading and mounting/remounting the `sn-markdown-editor` instance, keeping it in sync with `value`/`readonly`/`disabled` without a full remount, tearing it down on disconnect, and the load-failure fallback view. Do not import or manage `sn-markdown-editor` directly — this control owns that lifecycle.

## Import

There is no import path that reliably registers `<aiux-control-markdown-editor>` on its own. `src/index.ts` only side-effect-imports `./controls-factory`, and `controls-factory`'s own markdown renderer (`renderers/markdown.ts`) imports `../../markdown` lazily, inside a function — so merely importing `@servicenow/aiux-components-control` does **not** register this element; `./markdown` never runs as a module-load side effect. The package's `exports` map also exposes only `"."`, so a deep import (`@servicenow/aiux-components-control/markdown`) won't resolve either. The only reliable way to render this field is through `createFormControl`, which triggers the lazy `import('../../markdown')` itself the first time it renders a markdown field.

## Usage

### Minimal complete example

Render this field through `createFormControl` (see its own usage doc) rather than importing and placing the tag directly:

```js
import {createFormControl, FieldType} from '@servicenow/aiux-components-control';
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';

class MyMarkdownField extends AIUXElement {
  static properties = {
    description: {type: String}
  };

  render() {
    const field = {
      name: 'description',
      label: 'Description',
      type: FieldType.Markdown,
      value: this.description ?? '',
      displayValue: this.description ?? '',
      visible: true,
      readonly: false,
      mandatory: false
    };
    return html`${createFormControl(field, {layout: 'vertical'}, e => this._onCommit(e))}`;
  }

  _onCommit(e) {
    this.description = e.detail.value;
  }
}
customElements.define('my-markdown-field', MyMarkdownField);
```

**What happens:** on first render the control shows a bare loading spinner (there is no live editor yet), then dynamically imports `sn-markdown-editor` and mounts it into an internal container inside `updated()`. Because the import is cached at module scope, this fetch only actually hits the network for the very first markdown editor mounted anywhere on the page; every subsequent instance (and every remount of this one) reuses the same resolved module. Once mounted, typing dispatches `AIUX_CONTROL_MARKDOWN_EDITOR#STAGED_VALUE_CHANGED` on every editor change; leaving the editor (blur) dispatches `AIUX_CONTROL_MARKDOWN_EDITOR#VALUE_CHANGED` with the committed markdown. Both events set `this.value` to the new markdown before dispatching, so `description` and the control's own value are already aligned by the time your handler runs — you still need to call `requestUpdate`-triggering state (like `@state() description`) so the *host's* re-render reflects it elsewhere in the UI.

### Additional patterns

Constraining the editor's toolbar and height:

```js
html`
  <aiux-control-markdown-editor
    name="notes"
    toolbar="bold,italic,link"
    minHeight="120px"
    maxHeight="480px"
  ></aiux-control-markdown-editor>
`;
```

Edit-on-demand usage (`edit-mode="inline"`): when the host removes the control from edit mode, `onEditModeStopped()` reads whatever markdown is currently in the editor (even if the user never blurred) and — if it differs from `value` — dispatches `AIUX_CONTROL_MARKDOWN_EDITOR#VALUE_CHANGED` before tearing the editor down, so an in-progress edit is not silently lost when the field collapses back to its inline view.

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflect) | String | `''` | Applied to the live editor in place via `setValue` (no remount) | The markdown text. Also set locally (not just reported) whenever the editor commits a change, before the change event is dispatched. |
| `placeholder` | `placeholder` | String | `''` | Remounts the editor | Placeholder text shown in the empty editor. |
| `toolbar` | `toolbar` | String | `undefined` | Remounts the editor | Toolbar spec string passed to `sn-markdown-editor`; trimmed, and sent as `undefined` (not the underlying default) when blank. |
| `minHeight` | `minheight` | String | `undefined` | Remounts the editor | Minimum editor height (e.g. `'120px'`); trimmed, sent as `undefined` when blank. |
| `maxHeight` | `maxheight` | String | `undefined` | Remounts the editor | Maximum editor height (e.g. `'480px'`); trimmed, sent as `undefined` when blank. |
| `fileName` | `filename` | String | `undefined` | Remounts the editor | File name context passed to the underlying editor (e.g. for attachment/paste handling). |
| `name` | `name` | String | `''` | Remounts the editor | Field name; forwarded to the editor and used as `name` in dispatched event details. |
| `required` | `required` (reflect) | Boolean | `false` | Remounts the editor | Forwarded to the underlying editor's `required` option. |
| `readonly` | `readonly` (reflect) | Boolean | `false` | Applied to the live editor in place via `setReadonly` (no remount) | Puts the editor (or the fallback textarea) into read-only mode. |
| `disabled` | `disabled` (reflect) | Boolean | `false` | Applied to the live editor in place via `setReadonly` (no remount) | Treated identically to `readonly` for the editor instance (`setReadonly(this.readonly \|\| this.disabled)`). |
| `invalid` | `invalid` (reflect) | Boolean | `false` | Re-renders | Adds the `is-invalid` class, which switches the editor's border color token to the error color; also drives the fallback textarea's `aiux-textarea-error` class. |
| `autofocus` | `autofocus` | Boolean | `false` | Applied once, after the editor first mounts | Focuses the editor's `<textarea>` the first time it mounts. Not re-applied on later remounts. |
| `label` | `label` | String | `''` | Re-renders | Field label text. |
| `nowId` | `now-id` | String | `''` | Re-renders | Opaque identifier, inherited from the base control identity. |
| `controlStyles` | `control-styles` | String | `''` | Re-renders | Raw CSS declarations, inherited from the base control identity; applied via `fullControlStylesMap()` only to the fallback `<textarea>` (the normal editor view is styled entirely through the CSS custom properties below). |
| `fieldLayout` | `fieldLayout` | Object | `{layout: 'auto'}` | Re-renders | Vertical/horizontal/auto label layout. |
| `optional` | `optional` | Boolean | `false` | Re-renders | Shows an "Optional" label indicator instead of a required asterisk. |
| `helperContent` | `helper-content` | String | `''` | Re-renders | Text shown in a helper-info popover next to the label. |
| `hideRequiredIndicator` | `hide-required-indicator` | Boolean | `false` | Re-renders | Suppresses the required asterisk on the label. |
| `wrapLabel` | `wrap-label` | Boolean | `false` | Re-renders | Wraps rather than truncates the label text (vertical layout only). |
| `messages` | `messages` (property) | `ControlMessage[]` | `[]` | Re-renders | Field-level messages rendered below the editor. |
| `decorations` | `decorations` (property) | `Decoration[]` | `[]` | Re-renders | Rendered inline with the label. |
| `decorationWidgets` | `decorationWidgets` (property) | `DecorationWidget[]` | `[]` | Re-renders | Rendered in the addon column beside the editor. |
| `highlightedValue` | `highlightedValue` (property) | `HighlightedValue[]` | `[]` | Re-renders | Renders status badges near the label. |
| `showAIIndicator` | `show-ai-indicator` | Boolean | `false` | Re-renders | Shows an AI-generated-value indicator inline with the label. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | Boolean | `false` | Re-renders | Shows an unsaved-changes dot next to the label. |
| `editMode` | `edit-mode` (reflect) | `'default' \| 'inline' \| 'display-only'` | `'default'` | Re-renders | Switches to the edit-on-demand layout; see **Additional patterns** for `onEditModeStopped` behavior. |
| `variant` | `variant` (reflect) | `'default' \| 'compact'` | `'default'` | Re-renders | Switches label/messages density. |
| `nowAssistConfig` | `nowAssistConfig` (property) | `NacmConfig \| undefined` | `undefined` | Re-renders | Inherited from the base identity; not read by this control's own logic. |
| `referringRecordId` | `referring-record-id` | String | `''` | Re-renders | Inherited from the base identity; not read by this control's own logic. |
| `referringTable` | `referring-table` | String | `''` | Re-renders | Inherited from the base identity; not read by this control's own logic. |
| `helperText` | `helperText` | String | `''` | Re-renders | Inherited from `AIUXControlElement`; not read by this control's own logic. |

Note on `REBUILD_PROPS`: changing any of `name`, `required`, `toolbar`, `placeholder`, `minHeight`, `maxHeight`, or `fileName` (while already mounted) tears down and remounts the whole editor instance, seeded from whatever markdown is currently in the outgoing editor (not from the trailing `value` prop) so in-progress keystrokes are not lost across the remount.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_MARKDOWN_EDITOR#STAGED_VALUE_CHANGED` | `{name: string, value: string, fieldValue: string}` | bubbles, composed | The editor reports a content change (`onChange`), i.e. on every edit, not just on commit. | `value` and `fieldValue` are always equal. `this.value` is updated before the event is dispatched. |
| `AIUX_CONTROL_MARKDOWN_EDITOR#VALUE_CHANGED` | `{name: string, value: string, fieldValue: string}` | bubbles, composed | The editor blurs (`onBlur`), **or** edit-on-demand mode is exited (`onEditModeStopped`) while the live editor's markdown differs from `value`. | `value` and `fieldValue` are always equal. `this.value` is updated before the event is dispatched. |

### Slots

None.

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Focuses the mounted editor's `<textarea>` (queried by tag inside the mount container). No-op if no mount container or no `<textarea>` is present yet. |
| `reset()` | Inherited from `AIUXControlElement`. Resets `value` and internal touched/error state to their defaults; does not itself update the live editor instance (that follows from the normal `value`-changed re-render path). |

## Integration details

Requires the `sn-markdown-editor` package to be resolvable at runtime (loaded lazily via dynamic `import('sn-markdown-editor')` the first time the control mounts). If that import rejects, the control renders the plain-textarea fallback instead of throwing.

The import promise is cached in a module-level variable shared by every `aiux-control-markdown-editor` instance on the page, not per-instance: once one instance successfully loads the library, every other instance (existing or created later) reuses that same resolved module instead of issuing its own fetch. If the import rejects, the cache is cleared so the *next* mount attempt (on any instance) retries the import rather than being permanently poisoned by one failure.

### Platform requirements

None beyond `sn-markdown-editor` being installed/resolvable.

### SSR

Guards all editor-mounting logic with `isServer` inside `updated()` — nothing DOM-dependent runs during server rendering. The initial render (before `updated()` runs) always shows the loading-spinner view; the actual editor only mounts client-side.

### Lifecycle

`connectedCallback` requests an update if the control has already rendered once before (so reconnecting an already-initialized field remounts its editor). `disconnectedCallback` destroys the editor session. Any of `name`, `required`, `toolbar`, `placeholder`, `minHeight`, `maxHeight`, or `fileName` changing while mounted forces a full remount (see `REBUILD_PROPS` above); `value`/`readonly`/`disabled` changes are applied to the live instance without remounting.

Gotcha: `autofocus` is only ever honored on the very first successful mount of a given control instance — an internal flag is set the first time it applies and is never cleared, including across a disconnect/reconnect cycle that tears down and remounts the editor (e.g. the host conditionally removing and re-adding the control from the DOM, or an edit-on-demand field re-entering edit mode). If a host needs the editor refocused after such a remount, it must call `focus()` itself; the control will not refocus on its own.

### Sizing and layout

Editor height is controlled by `minHeight`/`maxHeight`, not by CSS on the host. The load-failure fallback textarea is fixed at `h-40` (10rem) and does not honor `minHeight`/`maxHeight`.

## Accessibility, localization, and customization

No `msg()`-wrapped or other user-facing text is rendered by this control itself (the loading state is a bare spinner with no text, and the fallback `<textarea>` has no separate label of its own — it relies on the shared form-field label). Keyboard and screen-reader behavior of the actual rich-text editing surface is owned entirely by the `sn-markdown-editor` library, not by this package. The mount point exposes three CSS `::part()` targets: `part="editor"` (the live editor's wrapper, present only while `sn-markdown-editor` is mounted), `part="loading"` (the spinner shown before it mounts), and `part="fallback"` (the read-only `<textarea>` shown if loading fails). Theming is done entirely through CSS custom properties scoped to `:host > *` — `--sn-md-color-*` (text/background/border/link/code colors), `--sn-md-btn-*` (toolbar button states), `--sn-md-tab-*`, `--sn-md-tooltip-*`, `--sn-md-focus-color`, `--sn-md-radius-*`, `--sn-md-font-*`, `--sn-md-space-*`, and `--sn-md-border-width` — all pre-wired to this design system's own `--color-*`/`--radius-*`/`--text-*`/`--font-*`/`--spacing` tokens, so no host action is needed to theme the editor consistently with the rest of the app; override individual `--sn-md-*` custom properties on the host element to customize further.
