# aiux-nacm

> Source: `@servicenow/aiux-components-nacm@5.1.20` · `components/nacm/docs/usage/aiux-nacm.md`

Top-level orchestrator for the ServiceNow Otto contextual action menu (NACM). Place it next to a text field to give users AI-powered content generation (summarize, rewrite, translate, etc.) for the associated record. The component fetches its skill configuration from the instance, renders a trigger button (the Otto sparkle icon), and manages the full lifecycle: action invocation, streaming response display, call-to-action handling, feedback, copy, and refresh.

**Prerequisite:** An active Now Assist skill configuration must exist on the instance whose multi-skill variable set targets the `wwnaComponentId` you provide. Without an active config, the component renders nothing. Set `renderDisabledSkeleton` to `true` to see a disabled trigger while debugging.

Built-in features the host must not rebuild: trigger button with AI gradient, action menu and dropdown, streaming response panel with loading states, copy to clipboard, thumbs-up/down feedback, refresh/regenerate, record-watcher auto-refresh, response pagination, show more/less, citation rendering, and drag/resize for the dialog.

## Import

```js
import '@servicenow/aiux-components-nacm';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-nacm';

@customElement('my-ai-notes')
class MyAINotes extends AIUXElement {
  @property({type: String}) sysId = '';

  @state() private _notes = '';
  @state() private _selection = '';

  private _onEdit(e: Event) {
    const ta = e.target as HTMLTextAreaElement;
    this._notes = ta.value;
    this._selection = ta.value.substring(ta.selectionStart, ta.selectionEnd);
  }

  private _onCta(e: CustomEvent) {
    const r = e.detail?.response;
    const text = Array.isArray(r) ? r.map((x: {response: string}) => x.response).join('\n\n') : r?.response;
    if (text) this._notes = text;
  }

  render() {
    return html`
      <textarea
        class="aiux-textarea w-full"
        aria-label="Work notes"
        .value=${this._notes}
        @input=${this._onEdit}
        @select=${this._onEdit}
      ></textarea>
      <aiux-nacm
        .documentTableName=${'incident'}
        .documentSysId=${this.sysId}
        .wwnaComponentId=${'work_notes'}
        .selectedText=${this._selection}
        .draftedText=${this._notes}
        .buttonProps=${{tooltipContent: 'Ask Otto'}}
        @aiux-nacm-call-to-action-clicked=${this._onCta}
      ></aiux-nacm>
    `;
  }
}
```

**What happens:** A sparkle trigger button appears below the textarea. Clicking it opens an action menu driven by the instance skill configuration. The user picks an action (or types in the open prompt if enabled), the component streams an AI-generated response, and CTA buttons (Insert, Copy, etc.) let the user apply or discard the result.

### Additional patterns

#### Custom trigger element

Replace the built-in sparkle button with your own element by slotting it into `trigger`. Dispatch a bubbling, composed `aiux-nacm:trigger` CustomEvent from your element to activate NACM.

```js
render() {
  return html`
    <aiux-nacm
      .documentTableName=${'incident'}
      .documentSysId=${this.sysId}
      .wwnaComponentId=${'work_notes'}
      .selectedText=${this._selection}
      .draftedText=${this._notes}
      @aiux-nacm-call-to-action-clicked=${this._onCta}
    >
      <button
        slot="trigger"
        @click=${(e) => {
          e.target.dispatchEvent(
            new CustomEvent('aiux-nacm:trigger', {bubbles: true, composed: true})
          );
        }}
      >
        Summarize with AI
      </button>
    </aiux-nacm>
  `;
}
```

#### Pre-invoke action interception

Intercept and transform the action payload before it is sent to the server. Return a modified payload or the original. Runs only on the primary trigger action, not on refine or CTA actions.

```js
render() {
  return html`
    <aiux-nacm
      .documentTableName=${'incident'}
      .documentSysId=${this.sysId}
      .wwnaComponentId=${'work_notes'}
      .additionalConfig=${{
        preInvokeActionHandler: async (invokePayload) => {
          // invokePayload contains: {payload, commandName, handleAutogrow, actionConfig}
          const modified = {...invokePayload};
          modified.payload = {
            ...invokePayload.payload,
            payload: {
              ...invokePayload.payload.payload,
              customField: 'extra-context'
            }
          };
          return modified;
        }
      }}
      @aiux-nacm-call-to-action-clicked=${this._onCta}
    ></aiux-nacm>
  `;
}
```

#### Open prompt action interception

Intercept post-response open prompt submissions. Return flags to control whether the action is sent to the server and whether the response window resets.

```js
render() {
  return html`
    <aiux-nacm
      .documentTableName=${'incident'}
      .documentSysId=${this.sysId}
      .wwnaComponentId=${'work_notes'}
      .additionalConfig=${{
        openPromptActionInterceptor: async (context) => {
          // context: {userQuery, commandName, sysId, actionType, currentResponse, skillConfig, payload}
          if (context.userQuery.startsWith('/custom')) {
            return {shouldInvokeOpenPromptAction: false, shouldCloseResponseWindow: true};
          }
          return {shouldInvokeOpenPromptAction: true};
        }
      }}
      @aiux-nacm-call-to-action-clicked=${this._onCta}
    ></aiux-nacm>
  `;
}
```

#### Pre-fetched skill configuration

Skip the instance API call by passing the full skill configuration object directly. The shape matches the `/api/sn_wwna/wwna/skill_config` response `result.data`.

```js
render() {
  return html`
    <aiux-nacm
      .documentTableName=${'incident'}
      .documentSysId=${this.sysId}
      .wwnaComponentId=${'work_notes'}
      .nacmConfig=${this.preloadedSkillConfig}
      @aiux-nacm-call-to-action-clicked=${this._onCta}
    ></aiux-nacm>
  `;
}
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- |--- |
| `documentSysId` | `documentsysid` | `string` | `''` | Connect-only. Set before first render. | Sys ID of the record this NACM instance is associated with. |
| `documentTableName` | `documenttablename` | `string` | `''` | Connect-only. Set before first render. | Table name of the record (e.g. `'incident'`). |
| `wwnaComponentId` | `wwnacomponentid` | `string` | `''` | Connect-only. Set before first render. | Identifier that maps this NACM instance to a skill configuration variable set on the instance. |
| `skillId` | `skillid` | `string` | `''` | Connect-only. | Optional skill ID to narrow the config lookup. |
| `skillConfigSysId` | `skillconfigsysid` | `string` | `''` | Connect-only. | Optional sys ID of a specific skill configuration record. |
| `payload` | — | `WwnaPayload` | `{}` | Updates immediately. Merges `excludeActions`, `reTriggerActions`, and `sectionsConfig` into the wrapper on change. | Structured payload for runtime action filtering, re-triggering, and section overrides. |
| `selectedText` | `selectedtext` | `string` | `''` | Updates immediately. Re-evaluates `minSelectedWordCount` gate. | Currently selected text in the associated field. Controls visibility when `minSelectedWordCount` is set. |
| `draftedText` | `draftedtext` | `string` | `''` | Updates immediately. | Current draft text in the associated field. Forwarded to the wrapper for context. |
| `buttonProps` | — | `ButtonProps` | `{}` | Updates immediately. Re-merges with config and defaults. | Overrides for the trigger button appearance and behavior. Merged as: defaults < skill-config `button_props` < this property. |
| `openPromptConfig` | — | `Record<string, string>` | `{}` | Updates immediately. | Overrides for open prompt behavior. Merged as: skill-config `open_prompt_config` < this property. |
| `additionalConfig` | — | `AdditionalConfig` | `{}` | Updates immediately. | Callbacks for action interception. See `preInvokeActionHandler` and `openPromptActionInterceptor`. |
| `recommendationDialogProps` | — | `RecommendationDialogProps` | `{}` | Updates immediately. Re-merges with config and defaults. | Overrides for the response dialog. Merged as: defaults < skill-config `recommendation_dialog_props` < this property. |
| `timeoutErrorMessage` | `timeouterrormessage` | `string` | `''` | Updates immediately. | Custom error message shown on timeout. Falls back to the skill-config message, then to `'An error occurred. Please try again.'`. |
| `ambChannelName` | `ambchannelname` | `string` | `''` | Connect-only. | Custom AMB channel name. When empty, auto-generated from `documentTableName`, `documentSysId`, `wwnaComponentId`, `userSysId`, and `caller`. |
| `nacmConfig` | — | `Record<string, unknown>` | `{}` | Connect-only. Bypasses the instance API call entirely when non-empty. | Pre-fetched skill configuration object. Shape matches the `/api/sn_wwna/wwna/skill_config` response `result.data`. |
| `caller` | `caller` | `CallerType` | `'aiux'` | Connect-only. | Rendering context. One of `'mobile'`, `'ui16'`, `'workspace'`, `'aiux'`. Falls back to `'aiux'` if invalid. |
| `additionalAnalyticsAttributes` | — | `Record<string, unknown>` | `{}` | Updates immediately. | Extra key-value pairs forwarded to telemetry events. |
| `renderDisabledSkeleton` | `renderdisabledskeleton` | `boolean` | `false` | Updates immediately. | When `true`, shows a disabled trigger button while skill config is loading or unavailable. When `false`, renders nothing until config is ready. |
| `feedbackProps` | — | `FeedbackProps` | `{}` | Updates immediately. | Configuration for the thumbs-up/down feedback UI. |

### Events

All events are dispatched with `bubbles: true` and `composed: true`.

| Event | `detail` | Fires when | Notes |
| --- | --- | --- | --- |
| `aiux-nacm-component-rendered` | `{isNAcmEnabled: boolean, componentKey: string}` | Skill config resolves (or fails). Fires once per lifecycle. | `isNAcmEnabled` is `true` when an active matching varset was found. |
| `aiux-nacm-call-to-action-clicked` | `{action: Record<string, unknown>, ctaType: 'primary' \| 'secondary', response: ResponseEntry \| ResponseEntry[] \| null}` | User clicks a CTA button (Insert, Copy to notes, etc.). | `response` is a single `ResponseEntry` for single-section skills, or a `ResponseEntry[]` for multi-section group CTAs. |
| `aiux-nacm-menu-action-clicked` | `{wwnaComponentId: string}` or `{selectedItem: {sysId, commandName, sectionId}, type: string, response: ResponseEntry \| null}` | A menu action is triggered. | Two shapes: the wrapper dispatches `{wwnaComponentId}` when a trigger-menu action is picked; forwarded flyout-item-clicked events carry `{selectedItem, type, response}`. |
| `aiux-nacm-recommendation-dialog-closed` | `{}` | The response dialog is closed. | |
| `aiux-nacm-feedback-submitted` | `{feedback: Record<string, unknown>, logId: string}` | User submits thumbs-up or thumbs-down feedback. | |
| `aiux-nacm-amb-message-received` | `{data: unknown}` | An AMB message arrives on the NACM channel. | |
| `aiux-nacm-rw-message-received` | `{data: unknown}` | A record-watcher message arrives. | Used to trigger refresh when the underlying record changes. |
| `aiux-nacm-preset-action-selected` | `{action: Record<string, unknown>, nacmComponentId: string}` | User selects a preset action from the trigger dropdown. | |
| `aiux-nacm-multi-skill-card-responded` | `{sectionId: string, ...ambData}` | A section finishes rendering its response. | |
| `aiux-nacm-ai-status-card-state-changed` | `{metadata: Record<string, unknown>}` | AI status card state changes during response streaming. | |
| `aiux-nacm-regenerate-recommendation-clicked` | `{nacmComponentId: string, timestamp: number}` | User clicks refresh/regenerate. | |
| `aiux-nacm-refresh-button-clicked-wwna` | `{nacmComponentId: string, timestamp: number}` | Refresh button in the header is clicked. | |
| `aiux-nacm-refresh-button-clicked` | `{sectionSysId: string}` | Section-level refresh is clicked. | |
| `aiux-nacm-close-response-window` | `{}` | A follow-up action requests the response window to close. | |
| `aiux-nacm-show-copy-failed` | `{}` | Copy to clipboard fails. | |

### Slots

| Slot | Description |
| --- | --- |
| `trigger` | Replaces the built-in sparkle trigger button. The slotted element must dispatch a bubbling, composed `aiux-nacm:trigger` CustomEvent to activate NACM. When empty, the default sparkle button renders. |
| `content-footer-slot-wwna` | Optional footer content injected below the response panel. |

### Methods

None.

### Data shapes

```ts
type CallerType = 'mobile' | 'ui16' | 'workspace' | 'aiux';

interface ButtonProps {
  icon?: string;
  label?: string;
  variant?: string;
  size?: string;
  tooltipContent?: string;
  hideButtonOnDialog?: boolean;
  fitToParent?: boolean | string;
  autoTriggerDefaultAction?: boolean;
  enableAIGradient?: boolean;
  minSelectedWordCount?: number;
  hidePrimaryIcon?: boolean;
  hasShadow?: boolean;
  openPromptInputPlaceholder?: string;
  additionalInfoOnTrigger?: string;
  isCaretForDropdown?: boolean;              // Not currently used.
  strictlyUseDefaultPresetAction?: boolean;  // Not currently used.
  isButtonEmbedded?: boolean;                // Not currently used.
  openPromptWidth?: number;                  // Not currently used.
  openPromptInputRows?: number;              // Not currently used.
  openPromptAutoFocus?: boolean;             // Not currently used.
  [key: string]: unknown;
}

interface WwnaPayload {
  excludeActions?: Record<string, unknown>;
  reTriggerActions?: Array<{sectionId: string; [key: string]: unknown}>;
  sectionsConfig?: Array<{
    sectionId?: string;
    renderSingleSection?: boolean;
    enableAIGradient?: boolean;
    ctaVariant?: string;
    secondaryCTAVariant?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface AdditionalConfig {
  preInvokeActionHandler?: (
    payload: Record<string, unknown>
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
  openPromptActionInterceptor?: (
    context: OpenPromptActionContext
  ) => OpenPromptActionResult | Promise<OpenPromptActionResult>;
  [key: string]: unknown;
}

interface OpenPromptActionContext {
  userQuery: string;
  commandName: string;
  sysId: string;
  actionType: 'refine' | 'open_prompt';
  currentResponse?: string | null;
  skillConfig?: RawSkillConfig | null;
  payload?: WwnaPayload;
}

interface OpenPromptActionResult {
  shouldInvokeOpenPromptAction?: boolean;
  shouldCloseResponseWindow?: boolean;
}

interface RecommendationDialogProps {
  isRefreshHidden?: boolean;
  isRefreshDisabled?: boolean;
  headerInitialLabel?: string;
  headerLoadingLabel?: string | string[];
  headerLoadedLabel?: string;
  headerLoadedIcon?: string;
  headerStatus?: 'info' | 'background-secondary' | 'neutral' | 'error' | 'accent';
  headerActions?: string;
  footerLabel?: string;
  ctaVariant?: string;
  secondaryCTAVariant?: string;
  offsetLeft?: number;
  offsetTop?: number;
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  refreshSummaryHelperText?: string;
  refreshSummaryButtonText?: string;
  closeButtonTooltip?: string;
  manageRefresh?: boolean;
  enableMultipleDialogs?: boolean;
  additionalInfoTooltip?: string;
  hideInsertButton?: boolean;
  isCopyButtonHidden?: boolean;
  hideFooter?: boolean;
  enableResize?: boolean;
  enableDrag?: boolean;
  ctaLabelsMapping?: Array<{sysId: string; label: string}>;
  showBorder?: boolean;
  insertButtonLabel?: string;       // Not currently used.
  primaryCTATooltip?: string;       // Not currently used.
  refineCount?: string;             // Not currently used.
  isDialogHoisted?: boolean;        // Not currently used.
  fixedVariantInitialLineCount?: number;  // Not currently used.
  fixedVariantShowMoreLineCount?: number; // Not currently used.
}

interface FeedbackProps {
  positiveFeedback?: Record<string, unknown>;
  negativeFeedback?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ResponseEntry {
  response: string;
  logId: string;
  feedback: 'THUMBS_UP' | 'THUMBS_DOWN' | null;
  synthesizedResponse?: string;
  citations?: Citation[];
  unSynthesizedResponse?: string;
  followupActions?: FollowupAction[];
}
```

## Integration details

### Platform requirements

The instance must have an active Now Assist contextual menu skill configuration whose multi-skill variable set is active and targets the `wwnaComponentId`. Without it, the component renders nothing (or a disabled skeleton if `renderDisabledSkeleton` is `true`). The skill configuration drives the variant (fixed, draggable, popover, or inline), available preset actions, refine actions, call-to-action buttons, and open prompt behavior.

### SSR

The component returns `nothing` on the server (`isServer` guard). It renders only in the browser after hydration.

### Lifecycle

On `connectedCallback`, the component fetches the skill configuration from `/api/sn_wwna/wwna/skill_config` (unless `nacmConfig` is provided) and subscribes to the record-watcher AMB channel for the associated record. `aiux-nacm-component-rendered` fires once with `isNAcmEnabled: true` or `false` depending on whether a matching active varset was found.

Property merge order for `buttonProps` and `recommendationDialogProps`: component defaults < skill-config JSON < host property. The host property always wins.

### Sizing and layout

The host element is `display: block`. The trigger button is inline by default. Set `buttonProps.fitToParent` to `true` for full-width trigger (draggable and popover variants only). Dialog dimensions are configurable via `recommendationDialogProps` (`width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`, `offsetLeft`, `offsetTop`). The draggable variant supports drag and resize by default (controlled by `enableDrag` and `enableResize`).

## Accessibility, localization, and customization

Keyboard and screen-reader support is built in. The trigger button has `aria-label` (defaults to "Otto", configurable via `buttonProps.tooltipContent`). The action dropdown uses `aria-haspopup` and `aria-expanded`. Loading state uses `role="status"`. Error alerts use `role="alert"` with `aria-live="assertive"`. Dialog close, refresh, collapse, expand, and copy buttons all have `aria-label`.

All user-facing strings are localized via `@lit/localize` and switch at runtime with the active locale. Localized labels include: "Otto", "Generating...", "An error occurred. Please try again.", "Copy to clipboard", "Copied!", "Refresh", "Show more", "Show less", "Insert", "Close", "Dismiss", "Ask Otto anything...", and others.

Trigger appearance is customizable via `buttonProps`: `icon`, `label`, `variant`, `size`, `tooltipContent`, `hidePrimaryIcon`, `enableAIGradient`, `hasShadow`, `fitToParent`. Dialog appearance is customizable via `recommendationDialogProps`: header labels, footer label, CTA variants, dimensions, offsets, header status color, border visibility, and header action buttons. For full trigger replacement, use the `trigger` slot.
