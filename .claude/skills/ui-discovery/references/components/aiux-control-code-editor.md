# aiux-control-code-editor

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-code-editor.md`

A form-field control that wraps `<aiux-code-editor>` (Monaco) from `@servicenow/aiux-components-code-editor`. Depending on its properties it renders one of two things: a full Monaco editor (the default, and for large XML fields in XML-view mode), or a plain `<aiux-control-input>` text field (for condition-string fields, and for XML fields that aren't both large and XML-view). The host sets the field's language/size configuration and reads the committed value and any validation error back off the dispatched events.

**Registration is a race, not a guarantee.** The controls factory's code-editor renderer lazily `import()`s the module that defines `<aiux-control-code-editor>` the first time `createFormControl` resolves a script/XML/condition-string field, and flips a module-level "already loading" flag to `true` *before* that import settles. If the dynamic import is still in flight on first render, the tag is temporarily an unresolved custom element (renders as plain, unstyled children) until the module registers; if the import *fails*, the flag is reset to `false` so the next render of any code-editor field retries it, but that first render's field is left unregistered with no retry of its own. This matters most for a field that mounts once and never re-renders (e.g. inside a one-shot modal) — a transient load failure there can leave the field permanently unregistered until something else re-renders a sibling code-editor field.

Built in: condition-string assignment-operator validation, optional ESLint-based condition-string linting run in a Web Worker, and XML well-formedness validation (via `fast-xml-validator`) run on blur. Do not build a separate script/XML/condition-string validator yourself — configure this control instead.

## Import

There is currently no import path that reliably registers `<aiux-control-code-editor>` on its own. `@servicenow/aiux-components-control`'s `package.json` only declares a package-root export (no subpaths), so a deep import like `@servicenow/aiux-components-control/code-editor` will not resolve. The package root import (`import '@servicenow/aiux-components-control';`) also does not register this element — its module is not included in that entry point's side-effect imports, unlike most other controls in this package. The only way this element is registered today is a lazy, dynamic import triggered internally the first time `createFormControl` renders a script/XML/condition-string field — so use `createFormControl` for this field type rather than placing the `<aiux-control-code-editor>` tag directly.

## Usage

### Minimal complete example

Render this field through `createFormControl` (see its own usage doc) rather than importing and placing the tag directly:

```js
import {createFormControl, FieldType} from '@servicenow/aiux-components-control';
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';

class MyHost extends AIUXElement {
  static properties = {
    script: {type: String}
  };

  render() {
    const field = {
      name: 'script',
      label: 'Script',
      type: FieldType.Script,
      value: this.script ?? '',
      displayValue: this.script ?? '',
      visible: true,
      readonly: false,
      mandatory: false
    };
    return html`${createFormControl(field, {layout: 'vertical'}, e => this._onCommit(e))}`;
  }

  _onCommit(e) {
    this.script = e.detail.value;
  }
}
```

**What happens:** `FieldType.Script` resolves to the Monaco (code-editor) view with `language` set to `'javascript'` internally, and the renderer's `scriptField` prop is set to `field.name` (there is no separate way to override it through `FormField`). Every keystroke inside Monaco fires its own `AIUX_CODE_EDITOR#CONTENT_CHANGED`, which this control re-dispatches as `AIUX_CONTROL_CODE_EDITOR#STAGED_VALUE_CHANGED` and also stores on `this.value` — so staged state and committed state briefly point at the same in-progress text even though nothing has "committed" yet. Losing focus fires Monaco's `AIUX_CODE_EDITOR#TEXT_EDITOR_FOCUS_CHANGED` with `hasFocus: false`, which this control turns into `AIUX_CONTROL_CODE_EDITOR#VALUE_CHANGED` with the current value (and, for XML fields, any validation error computed at that moment) — both are already wired to `onValueChange`/`onStagedValueChange` by `createFormControl`, so the host only needs the callback shown above. If `readonly` or `disabled` is true, that blur handler returns early and `VALUE_CHANGED` never fires at all, even though Monaco itself still reports the focus change internally.

### Additional patterns

A condition-string field (`FieldType.ConditionString`) always renders as a plain text input with assignment-operator validation on blur, rather than the Monaco editor — no extra configuration needed beyond the field's `type`.

A large XML field (`FieldType.Xml`, with the field's `maxLength` over 255) renders as Monaco with XML well-formedness validation instead of a plain input; an XML field at or under that length still renders as a plain input.

Condition-string linting is driven entirely by system properties, not anything the host passes through `FormField` directly: the renderer reads `glide.ui.syntax_editor.linter.eslint_config` (parsed as JSON) for `linterConfig` and `glide.ui.workspace.script.code_editor.autoresize_line_limit` as a fallback for `autoresizeLineLimit` when the field doesn't set its own. A malformed value in either property is swallowed silently — an invalid `eslint_config` leaves `linterConfig` `undefined` (linting simply never runs, with no error surfaced anywhere) and an unparsable autoresize limit falls back to `0`.

## API

### `aiux-control-code-editor`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflect, inherited) | `string` | `''` | Updated from Monaco's `CONTENT_CHANGED`/`FOCUS_CHANGED` events or the text input's `VALUE_CHANGED` event; forwarded into whichever inner control is rendered. | The field's current value. |
| `language` | `language` | `string` | `'javascript'` | Read in `_getControlType()` (the `'xml'` branch) and forwarded to `<aiux-code-editor>`. | Monaco language mode. Also gates XML-specific validation and the small-vs-large XML rendering choice. |
| `height` | `height` | `string` | `'150px'` | Forwarded to `<aiux-code-editor>`. | CSS height string for the Monaco editor. |
| `autoresizeLineLimit` | `autoresizelinelimit` | `number` | `0` | Forwarded to `<aiux-code-editor>`. | Line-count cap used by the editor's autoresize behavior. |
| `scriptField` | `scriptfield` | `string` | `''` | Forwarded to `<aiux-code-editor>`. | Identifies which script field this editor is bound to, for platform features inside the editor. |
| `sysId` | `sysid` | `string` | `''` | Forwarded to `<aiux-code-editor>`. | Record sys_id, for platform features inside the editor. |
| `recordType` | `recordtype` | `string` | `''` | Forwarded to `<aiux-code-editor>`. | Record table, for platform features inside the editor. |
| `isClientScript` | `isclientscript` | `boolean` | `false` | Forwarded to `<aiux-code-editor>`. | Enables client-script-specific editor behavior. |
| `isConditionString` | `isconditionstring` | `boolean` | `false` | Read in `_getControlType()` (always renders the text-input branch when `true`) and in `_validateInputValue()` (runs assignment/lint validation instead of XML validation). | Marks this field as a condition-string field. |
| `isXMLView` | `isxmlview` | `boolean` | `false` | Read in `_getControlType()`'s `'xml'` branch, combined with `maxlength > 255`. | Requests the Monaco (code-editor) rendering for a large XML field instead of the plain text input. |
| `maxlength` | `maxlength` | `number` | `0` | Read in `_getControlType()`'s `'xml'` branch (`maxlength > 255` = "large") and forwarded to the text input when the input branch renders. | Field length; also the large/small XML threshold. |
| `scope` | `scope` | `string` | `'global'` | Forwarded to `<aiux-code-editor>`. | Application scope, for platform features inside the editor. |
| `scrollBeyondLastLine` | `scrollbeyondlastline` | `boolean` | `false` | Forwarded to `<aiux-code-editor>`. | Monaco's `scrollBeyondLastLine` editor option. |
| `autocompleteSuggestions` | `autocompletesuggestions` | `string \| undefined` | `undefined` | Forwarded to `<aiux-code-editor>`. | Autocomplete suggestion data passed through to Monaco. |
| `linterConfig` | `linterconfig` | `ConditionStringLinterConfig \| undefined` | `undefined` | Read in `_validateConditionStringInput()`; linting only runs when this is set to a non-empty config. | ESLint `Linter.Config`/legacy config, set as a property (`.linterConfig=`) in practice since it's a complex object. |
| `readonly` | `readonly` (reflect, inherited) | `boolean` | `false` | Forwarded to `<aiux-code-editor>` as `readOnly` (combined with `disabled`); gates `_handleFocusChanged`'s dispatch. | Read-only display. |
| `disabled` | `disabled` (reflect, inherited) | `boolean` | `false` | Forwarded to `<aiux-code-editor>` as part of `readOnly`; forwarded to the text input; gates `_handleFocusChanged`'s dispatch. | Disables editing. |
| `name` | `name` (inherited) | `string` | `''` | Included in dispatched `VALUE_CHANGED` event `detail`. | Field name identifier. |
| `label` | `label` | `string` | `''` | Read by the shared `renderWithLayout`/label rendering (inherited). | Field label text. |
| `required` | `required` (reflect) | `boolean` | `false` | Forwarded to the text input in the input-rendering branch. | Marks the field required. |
| `invalid` | `invalid` (reflect) | `boolean` | `false` | Combined with the internal condition-string/XML validation error (`?invalid=`) when the text-input branch renders. | Marks the field invalid. |
| `autofocus` | `autofocus` | `boolean` | `false` | Forwarded to the text input in the input-rendering branch as `?autofocus=`. | Focuses the input branch on mount; not wired to the Monaco branch. |
| `fieldLayout` | `fieldlayout` | `{layout?: 'vertical' \| 'horizontal' \| 'auto', columns?: string[]}` | `{layout: 'auto'}` | Read by `renderWithLayout` (inherited). | Label/control layout. |
| `messages` | `messages` | `ControlMessage[]` | `[]` | Read by `render()`, which appends a validation message (built from `_validationErrorMessage`) before passing the combined array into `renderWithLayout`. | Validation/status messages. |
| `helperContent` | `helper-content` | `string` | `''` | Read by `renderWithLayout`/the shared label rendering (inherited). | Helper text under the field. |
| `editMode` | `edit-mode` (reflect) | `'default' \| 'inline' \| 'display-only'` | `'default'` | Read by `renderWithLayout` (inherited); this control always supplies an `inlineView`. | Rendering mode. |
| `variant` | `variant` (reflect) | `'default' \| 'compact'` | `'default'` | Read by `renderWithLayout` (inherited) and forwarded to the text input. | Visual density. |
| `helperText` | `helpertext` | `string` | `''` | Not currently used — inherited from `AIUXControlElement` but never read by this control. | Reserved. |
| `placeholder` | `placeholder` | `string` | `''` | Not currently used — inherited but never read or forwarded by this control. | Reserved. |
| `labelUrl` | `label-url` | `string \| undefined` | `undefined` | Not currently used — inherited but never read or forwarded. | Reserved. |
| `labelUrlTarget` | `label-url-target` | `string` | `'_blank'` | Not currently used — inherited but never read or forwarded. | Reserved. |
| `nowId` | `now-id` | `string` | `''` | Not currently used — inherited but never read or forwarded. | Reserved. |
| `controlStyles` | `control-styles` | `string` | `''` | Forwarded to the text input in the input-rendering branch (condition-string/small-XML mode); not forwarded to the Monaco branch. | Raw CSS declarations applied to the text input's primary element. |
| `optional` | `optional` | `boolean` | `false` | Read by the shared label rendering (inherited) to suppress the required indicator. | Suppresses the required indicator. |
| `hideRequiredIndicator` | `hide-required-indicator` | `boolean` | `false` | Read by the shared label rendering (inherited). | Hides the required-field indicator. |
| `wrapLabel` | `wrap-label` | `boolean` | `false` | Read by the shared label rendering (inherited). | Allows the label to wrap. |
| `decorations` | `decorations` | `Decoration[]` | `[]` | Read by `renderLabelInlineContent` (inherited). | Label-row decorations. |
| `decorationWidgets` | `decorationwidgets` | `DecorationWidget[]` | `[]` | Read by `renderAddonContent` (inherited). | Custom widget slots in the addon area. |
| `highlightedValue` | `highlightedvalue` | `HighlightedValue[]` | `[]` | Read by `renderHighlightedValueBadges` (inherited). | Highlighted-value badge entries. |
| `showAIIndicator` | `show-ai-indicator` | `boolean` | `false` | Read by `renderLabelInlineContent` (inherited). | Shows the AI-generated indicator. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | `boolean` | `false` | Read by the shared label rendering (inherited) to show/hide the unsaved-change indicator. | Shows the unsaved-change indicator. |
| `nowAssistConfig` | `nowassistconfig` | `NacmConfig \| undefined` | `undefined` | Read by the inherited `withNacm` mixin's `renderWithLayout` override (invoked whenever this control calls `this.renderWithLayout(...)`) to decide whether to render a Now Assist Contextual Menu trigger. | Now Assist Contextual Menu configuration. |
| `referringRecordId` | `referring-record-id` | `string` | `''` | Read by the inherited `withNacm` mixin when NACM is enabled (passed to `<aiux-nacm>` as `documentSysId`). | Referring record identifier for NACM context. |
| `referringTable` | `referring-table` | `string` | `''` | Read by the inherited `withNacm` mixin when NACM is enabled (passed to `<aiux-nacm>` as `documentTableName`). | Table the current record belongs to, for NACM context. |
| `formData` | property only (`attribute: false`) | `ControlFormData \| undefined` | `undefined` | Not currently used — inherited but never read anywhere in the base tower or this control's own code. | Reserved. |
| `fieldContextMenu` | property only (`attribute: false`) | `FieldContextMenuConfig \| undefined` | `undefined` | Read by the inherited `FieldContextMenuMixin` to gate and configure the right-click context menu. | Right-click personalize/configure menu, set by the controls factory. |

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_CODE_EDITOR#STAGED_VALUE_CHANGED` | `{fieldValue: string, errors: any[], lintingEnabled: boolean}` | `bubbles: true, composed: true` (`cancelable` defaults to `false`) | Monaco branch only, on every `AIUX_CODE_EDITOR#CONTENT_CHANGED` from the inner editor — i.e. on every keystroke, not debounced by this control itself. | Only fires in the Monaco-rendered branch — the text-input branch (condition-string/small-XML mode) has no staged event, so `onStagedValueChange` is simply never invoked for condition-string or small/non-XML-view XML fields. `this.value` is updated synchronously alongside this event, before any commit. |
| `AIUX_CONTROL_CODE_EDITOR#VALUE_CHANGED` | `{name: string, value: string, fieldValue: string, errorMessage: string \| undefined, errors: any[], lintingEnabled: boolean}` | `bubbles: true, composed: true` (`cancelable` defaults to `false`) | Monaco branch: fires when the editor reports `AIUX_CODE_EDITOR#TEXT_EDITOR_FOCUS_CHANGED` with `hasFocus: false` (blur) — but only when the control is neither `readonly` nor `disabled`; blurring a readonly/disabled Monaco editor dispatches nothing. Text-input branch: fires on the inner `<aiux-control-input>`'s own `AIUX_CONTROL_INPUT#VALUE_CHANGED` (blur/commit), after this control's own validation (condition-string assignment check, then optional lint; or XML well-formedness) has resolved. | For `language="xml"` in the Monaco branch, XML validation runs synchronously on blur and `errorMessage` reflects its result. For the text-input branch, condition-string linting is async (ESLint in a Web Worker) and tracked by a monotonically increasing request id — if the field value changes again before a slower lint result comes back, that stale result is discarded and never dispatches a `VALUE_CHANGED` of its own; only the latest keystroke's validation result reaches this event. In the text-input branch `errors` is always `[]` and `lintingEnabled` is always `false`, even when ESLint linting actually ran — those two fields reflect Monaco-side linting state only. |

Dispatched with plain `this.dispatchEvent(new CustomEvent(...))`, not the shared `dispatchAction` helper — `name` is read directly off `this.name` at dispatch time rather than auto-injected.

#### Slots

None.

#### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Delegates to the rendered Monaco editor if present, otherwise to the text input. When the Monaco editor is rendered, this call resolves to `<aiux-code-editor>`'s own `focus()` — which, in the current `@servicenow/aiux-components-code-editor` package, does not forward focus into Monaco's editable surface (it only emits focus-change events), so this branch does not visibly focus the editor today. The text-input branch (condition-string/small-XML mode) receives real focus. |

### Data shapes

`ConditionStringLinterConfig` — one of ESLint's `Linter.LegacyConfig`, `Linter.Config`, or `Linter.Config[]` (re-exported type from the `eslint` package).

## Integration details

Condition-string linting runs ESLint inside a singleton Web Worker created from an inline blob script, which `importScripts()`s an ESLint bundle from a fixed platform asset URL (`/uxasset/externals/@servicenow/now-code-editor/eslint_7.4.0.jsdbx?sysparm_substitute=false`) on first use; linting resolves with no error after a 5 second timeout if the worker never responds. XML validation wraps the value in a synthetic `<xml>` root and runs `fast-xml-validator`'s `SyntaxValidator.validate`.

### Platform requirements

Requires `@servicenow/aiux-components-code-editor` (the `<aiux-code-editor>` Monaco wrapper) to be registered. Condition-string linting additionally requires the fixed ESLint bundle URL above to be reachable and a `Worker`-capable environment (linting is silently skipped, resolving no error, when `Worker` is undefined).

### SSR

Server-safe: validation and linting only run from `_handleInputValueChange`/`_handleFocusChanged`, which fire off user interaction with the rendered controls, not during `connectedCallback` or `render()`. The linting Web Worker is only constructed lazily on first condition-string validation with a non-empty `linterConfig`.

### Lifecycle

No custom `connectedCallback`/`disconnectedCallback` beyond the inherited base behavior. Each call to `_handleInputValueChange` (condition-string/XML input path) tracks a monotonically increasing lint-request id so that a stale, slower-resolving lint result can't overwrite a newer one's validation message.

### Sizing and layout

Uses the shared `renderWithLayout`/`inlineView` form-field chrome. `height` only affects the Monaco branch; the text-input branch sizes like any other `<aiux-control-input>`.

## Accessibility, localization, and customization

The condition-string assignment-operator message and both XML validation messages (declaration-position error, parse error with line/column) are wrapped in `@lit/localize`'s `msg()`/`str` — hard-coded English source text, localized through the standard pipeline, not host-settable. Keyboard/screen-reader behavior for the Monaco editing surface itself is owned entirely by the external `<aiux-code-editor>` component; the text-input branch gets whatever `<aiux-control-input>` provides. This control renders no styling hooks of its own (no `::part()`/slots) beyond what the nested `<aiux-code-editor>`/`<aiux-control-input>` and the shared form-field CSS parts expose.
