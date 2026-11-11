# ChatController

> Source: `@servicenow/aiux-controllers@1.3.20` · `controllers/docs/usage/ChatController.md`

`ChatController` runs the Now Assist chat (the omnibar and chat panel) inside
an app shell layout. The host layout creates it, renders `renderChat()` where
the chat belongs, and places it with CSS. The controller loads the chat
library from the instance, tracks the chat mode (collapsed omnibar, open
panel, full screen), keeps the active conversation in the URL (`chat_id`),
follows client navigation, and reacts to chat events and to `aiux:open-chat`
/ `aiux:close-chat` events from page content.

The built-in Karuna app shells (`aiux-nav-layout`, `aiux-app`) already host a
`ChatController`. Pages inside them open the chat by dispatching
`aiux:open-chat` (see Additional patterns) and must not create a second
controller. Use the controller directly only when building your own app shell
layout.

## Import

```js
import {ChatController, CHAT_MODES, AIEX_MODES} from '@servicenow/aiux-controllers';
```

On the server, `ChatController` is exported as `null`; construct it only in
the browser.

## Usage

### Minimal complete example

```js
import {html, css, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {AIUXAppLayoutElement} from '@servicenow/aiux-components-core';
import {ChatController, CHAT_MODES, deploymentDetailsContext} from '@servicenow/aiux-controllers';

@customElement('acme-chat-shell')
export class AcmeChatShell extends AIUXAppLayoutElement {
  static contexts = [deploymentDetailsContext];
  static styles = css`
    :host { display: block; min-height: 100vh; }
    .chat-slot { position: fixed; right: 1rem; bottom: 1rem; width: 28rem; z-index: 10; }
    .chat-slot.open { top: 1rem; }
  `;

  willUpdate(changed) {
    super.willUpdate(changed);
    if (!isServer && !this.chat && deploymentDetailsContext.get().enabled) {
      this.chat = new ChatController(this);
      this.chat.showHistoryButton = true;
    }
  }

  onNavigateEnd(path, page, options) {
    super.onNavigateEnd(path, page, options);
    this.chat?.onNavigate(path);
  }

  renderLayout() {
    const open = this.chat?.chatMode === CHAT_MODES.DEFAULT;
    return html`
      <main id="main-content" tabindex="-1">${this.renderPage()}</main>
      <div class=${classMap({'chat-slot': true, open})}>${this.chat?.renderChat() ?? null}</div>
    `;
  }
}
```

**What happens:** the server renders the page with an empty chat slot. In the
browser, when chat is deployed for the app, the controller is created, loads
the chat library and starts a session; once ready the host re-renders and the
collapsed omnibar appears. Sending a message or picking a conversation opens
the panel (`chatMode` becomes `DEFAULT`) and writes `chat_id` to the URL; the
close button collapses it back and removes `chat_id`. Navigating to another
page keeps the conversation open. Removing the layout stops all listeners.

### Additional patterns

Open or close the shell's chat from any page or component inside the layout.
The events must bubble and be composed so they reach the layout host:

```js
// Open the panel (no-op if already open and no options are given).
this.dispatchEvent(new CustomEvent('aiux:open-chat', {
  bubbles: true, composed: true,
  detail: {conversationId: 'abc123', fullScreen: false}
}));

// Start a fresh conversation seeded with context.
this.dispatchEvent(new CustomEvent('aiux:open-chat', {
  bubbles: true, composed: true,
  detail: {forceNewConversation: true, sessionContext: {transferred_search_result: result}}
}));

// Collapse to the omnibar.
this.dispatchEvent(new CustomEvent('aiux:close-chat', {bubbles: true, composed: true}));

// Ask the assistant to run a skill, then open the panel.
this.dispatchEvent(new CustomEvent('aiux:request-skill-execution', {
  bubbles: true, composed: true,
  detail: {skillId: 'my_skill_sys_id'}
}));

// Hide the whole chat. It stays hidden across navigations until
// {hidden: false} is dispatched, so dispatch that when the page is left.
this.dispatchEvent(new CustomEvent('aiux-chat-visibility-change', {
  bubbles: true, composed: true, detail: {hidden: true}
}));

// Hide only the collapsed omnibar (applies in OMNI; reset on navigation).
this.dispatchEvent(new CustomEvent('aiux-omnibar-visibility-change', {
  bubbles: true, composed: true, detail: {hidden: true}
}));
```

Drive it from the layout itself:

```js
this.chat.openChat({fullScreen: true});
this.chat.closeChat();
this.chat.switchMode(CHAT_MODES.DEFAULT);
```

Dock / full-screen controls when the chat lives in the instance window
manager (`window.nowWindowManager`), using the subpath helpers:

```js
import {handleDockToggle, handleFullscreenToggle, handleChatClose} from '@servicenow/aiux-controllers/chat-window-utils';

_onDock() {
  this.chat.deferIfResponding(() => handleDockToggle(this.chat));
  this.requestUpdate();
}
```

## API

### Constructor

```ts
new ChatController(host: AIUXAppLayoutElement)
```

- `host`: the app shell layout. The controller calls `host.addController(this)`
  and uses the host's `requestUpdate()`, `updateComplete`, `navigate()`,
  `querySelectorAll()` and `dispatchEvent()`. Extend `AIUXAppLayoutElement`.
- Reads `chat_mode` from the URL hash at construction.
- Set the configuration fields (below) right after constructing, before the
  host's next update. Later changes take effect the next time the chat mode
  or route changes.

Optional host members the controller reads:

| Host member | Type | Effect |
| --- | --- | --- |
| `isHomePage` | `boolean` | Overrides the built-in home detection (path `/` or `/home`). |
| `isChatPage` | `boolean` | Overrides the built-in full-page chat detection (path `/chat`). |
| `isFramedPage` | `boolean` | When `true`, the page is never treated as home. |
| `embedsHomeChat` | `boolean` | `true` when the host renders its own chat on the home page. Without it, the shell chat is hidden on home and opening a conversation there navigates to `/chat`. |
| `onHomeChatEvent` | `(type, payload, {switchMode, openChat, setFullscreen}) => boolean` | With `embedsHomeChat`, called for `conversation:created` and `message-input:mode-change` from the home page's embedded chat; return `true` to replace the default handling. |
| `experienceConfig` | `object` | Experience configuration used when the user pins a chat widget. |

### Methods and fields

Configuration fields:

| Field | Type | Default | Effect |
| --- | --- | --- | --- |
| `showHistoryButton` | `boolean` | `false` | Conversation history button in the chat header. |
| `showViewToggleButton` | `boolean` | `false` | Button that toggles the open panel to full screen and back. |
| `showPromotedTopics` | `boolean` | `false` | Promoted topics in a new conversation. |
| `showConversationTitle` | `boolean` | `true` | Conversation title in the header. |
| `showCloseButton` | `boolean \| null` | `null` | `null`: shown except on `/chat` (always shown in the mobile app). |
| `showInteractiveViewButton` | `boolean` | `false` | Interactive view button. |
| `enablePinnable` | `boolean` | `true` | Lets users pin chat widgets. |
| `branding` | `object` | `{backButtonIcon: 'panel'}` | Branding options passed to the chat client. |
| `sessionDomain` | `string \| undefined` | `undefined` | Domain sys_id for new conversations; `undefined` uses the user's default. |
| `pauseAIELContextOnHomePage` | `boolean` | `true` | Pauses page-context updates to the assistant while on the home page. Set `false` when the host embeds a home chat. |

State fields (read in `render`; write through methods):

| Field | Type | Meaning |
| --- | --- | --- |
| `chatMode` | `'OMNI' \| 'DEFAULT' \| 'AIEX_HIDDEN'` | `OMNI`: collapsed omnibar. `DEFAULT`: chat panel open. `AIEX_HIDDEN`: hidden. Initial `OMNI` unless the URL hash has `chat_mode`. |
| `isFullscreen` | `boolean` | Open panel covers the page. Always `true` on `/chat`; reset on each navigation. |
| `isChatDetached` | `boolean` | Chat floats outside the layout (window-manager helpers). |
| `hideChat` | `boolean` | Set by `aiux-chat-visibility-change`; not reset on navigation. |
| `hideOmnibar` | `boolean` | Set by `aiux-omnibar-visibility-change` while `OMNI`; reset on navigation. |
| `searchResultsOpened` | `boolean` | A search-results interactive view is open. |
| `brandingReady` | `boolean` | `true` once instance branding loaded or after 3 s. |
| `brandingIcon` | `string` | Chat icon from instance branding, default `'ai-sparkle-fill'`. |
| `brandingTitle` | `string` | Chat title from instance branding, default `'Otto'`. |
| `isHomePage` / `isChatPage` | `boolean` | Current page type (host value, else path). Settable to pin a value. |
| `lbfProps` | `object` | Props passed to the chat client; a stable reference until something changes. |
| `lbfPropsForNav` | `object` | `lbfProps` with title, close and view-toggle buttons hidden. |
| `CHAT_MODES` / `AIEX_MODES` | `object` | Same as the exported constants. |

Methods:

| Method | Signature | Effect |
| --- | --- | --- |
| `renderChat` | `() => TemplateResult \| nothing` | The chat element, or `nothing` until ready or while `shouldHideChat()` is `true`. Wrapped in `.chat-container-wrapper` with `data-mode` and `data-full-chat` attributes. |
| `renderChatContainer` | `() => TemplateResult` | The chat markup without the ready/hidden checks. |
| `openChat` | `(opts?: OpenChatOptions) => void` | Sets `DEFAULT` mode. Without options, no-op if already open. |
| `closeChat` | `() => void` | `switchMode('OMNI')`. |
| `switchMode` | `(mode: ChatMode) => void` | Sets `chatMode`, re-renders the host. No-op if already in that mode. `OMNI` also clears `chat_id` and full screen. Off home and `/chat`, writes `chat_mode` to the URL hash. |
| `switchLBFMode` | `(mode?: string) => void` | `switchMode` that also accepts `'omni'`, `'primary'`, `'side'`. Default `'OMNI'`; an unknown mode is logged and ignored. |
| `requestSkillExecution` | `({skill?, skillId?, ...rest}) => void` | Asks the assistant to run the skill (`skillId` is accepted for `skill`), then `openChat()`. |
| `navigateToChat` | `(conversationId?: string) => void` | Navigates to `/chat`, with `?chat_id=` when given. |
| `navigateToChatOnClick` | `() => void` | `navigateToChat` with the active conversation. |
| `onNavigate` | `(path: string) => void` | Call after each committed client navigation (from `onNavigateEnd`). Resets full screen, collapses on home without `chat_id`, restores mode from the hash. |
| `handleSidePanelChange` | `(open: boolean) => void` | Tell the controller the app's side panel opened or closed; on home, with `embedsHomeChat`, it shows the shell chat while open. |
| `deferIfResponding` | `(action: () => void) => void` | Runs `action` now, or after the assistant finishes its current response. Use for any change to `isFullscreen` or `isChatDetached`. |
| `shouldHideChat` / `shouldHideAIEX` | `() => boolean` | Whether `renderChat()` renders nothing for visibility reasons. |
| `getAiexMode` | `() => string` | `AIEX_MODES` value for the current state. |
| `isReady` | `() => boolean` | Chat library loaded and session established. |
| `remountChat` | `() => void` | Re-creates the chat element on the next render. |
| `initialize` | `() => Promise<void>` | Loads the chat library and session. Runs automatically on connect; later calls do nothing. |
| `setEventTarget` | `(element: EventTarget) => void` | Listen for chat events on `element` instead of the host. |
| `setExperienceConfig` | `(config: object) => void` | Experience config for widget pinning; also sets `host.experienceConfig` if unset. |
| `overrideChatNavigation` | `() => void` | Called automatically after render. |
| `cleanup` | `() => void` | Same as `hostDisconnected()`. |
| `hostConnected` / `hostDisconnected` | `() => void` | Called by Lit (see Lifecycle). |

The `handle*` arrow-function fields (`handleChatEvent`, `handleOpenChat`, …)
are the controller's event listeners; do not call them.

### Behavior

- **Events listened to** on the host (or `setEventTarget` element):
  `now:chat:event` (from the chat element), `aiux:open-chat` (`detail`:
  `OpenChatOptions`), `aiux:close-chat`, `aiux:request-skill-execution`
  (`detail`: `{skill?, skillId?, ...}`), `aiux-chat-visibility-change` and
  `aiux-omnibar-visibility-change` (`detail`: `{hidden: boolean}`),
  `SHOW_INTERACTIVE_VIEW` and `CLOSE_INTERACTIVE_VIEW`. Events from outside the
  host subtree (for example an element appended to `document.body`) are not
  received.
- **Chat events.** A sent message or new conversation opens the panel. The
  close button collapses it (navigates to `/home` on `/chat` in the mobile
  app). The view toggle flips full screen. Layout changes requested while the
  assistant is responding wait until the response ends. Opening an
  interactive view hides the app side panel and restores it on close.
- **URL state.** The open conversation is kept in the `chat_id` search
  parameter and carried across in-app navigations; the mode is kept in a
  `chat_mode` hash segment. Navigation flagged `fromSidebar` while the panel
  is open starts a new conversation. Unresolved template tokens in `chat_id`
  are dropped.
- **Home page.** Without `embedsHomeChat`, the shell chat is hidden on home
  and conversation actions there navigate to `/chat`; a `home?chat_id=` URL
  redirects to `/chat`.
- **Chat links.** Same-origin links the assistant opens are routed through
  the host's `navigate()`.
- **Event dispatched**, on the home page only, when state changes:

| Event | `detail` | Delivery | Fires when |
| --- | --- | --- | --- |
| `aiux:chat-mode-changed` | `{chatMode, isFullscreen, sidePanelActive, shellChatActive}` | from host; `bubbles`, `composed` | Mode, full screen, or side-panel state changes on the home page. |

### Lifecycle

- `hostConnected` (browser only; does nothing on the server): starts
  following client navigation, resolves branding, calls `initialize()`, and,
  once `initialize()` finishes (chat library loaded and session ready) and
  the host's next update completes, attaches its event listeners to the host
  unless `setEventTarget` was called. Events dispatched before then are not
  received.
- `hostDisconnected`: removes all listeners and subscriptions. On reconnect
  they are attached to the host again; call `setEventTarget` again if you
  used it. The chat session and `chatMode` are kept.
- One controller per app shell. The most recently connected controller is
  the one the platform's chat actions address.

### Exported helpers

From `@servicenow/aiux-controllers`:

| Export | Value |
| --- | --- |
| `CHAT_MODES` | `{OMNI: 'OMNI', DEFAULT: 'DEFAULT', AIEX_HIDDEN: 'AIEX_HIDDEN'}` |
| `AIEX_MODES` | `{CHAT_AND_IV: 'chat_and_interactive_view', POPOVER: 'popover', CHAT: 'chat_only'}` |
| `deploymentDetailsContext` | Whether chat is deployed for the app; see its own entry. |

From `@servicenow/aiux-controllers/chat-window-utils`, for shells that put the
chat in the instance window manager (`window.nowWindowManager`, window id
`CHAT_WINDOW_ID`). Browser only. `syncChatWindowState`,
`handleFullscreenToggle`, `handleDockToggle` and `updateChatWindowBranding` do
nothing when the window manager is absent; `getWindowStartingState` only
returns a value, and `handleChatClose` always runs. None of them wait for a
running response: wrap state changes in `deferIfResponding`. Only the helpers
that switch mode (`handleDockToggle` when docking, `handleChatClose`) trigger a
host update; call `requestUpdate()` after the others.

| Export | Signature | Effect |
| --- | --- | --- |
| `CHAT_WINDOW_ID` | `'now-ai-canvas-window'` | Window id of the chat window. |
| `getWindowStartingState` | `(chatMode, isFullscreen) => {state, chromeless}` | `{state: 'modal', chromeless: false}` when full screen; `'docked-left'` with chrome in `DEFAULT`; otherwise chromeless `'modal'`. |
| `syncChatWindowState` | `(chatMode, isFullscreen, isChatDetached) => void` | Moves the chat window to floating, modal, docked, or chromeless modal to match the state. |
| `handleFullscreenToggle` | `(controller) => void` | Toggles modal ↔ floating and sets `isFullscreen` / `isChatDetached`. |
| `handleDockToggle` | `(controller) => void` | Sets the controller to floating (detached) when docked, otherwise to docked state and switches to `DEFAULT`. Does not move the window; call `syncChatWindowState` for that. |
| `handleChatClose` | `(controller) => void` | Clears full screen and detached, switches to `OMNI`. |
| `updateChatWindowBranding` | `({icon?, title?}) => void` | Updates the open chat window's header icon and title. |

### Data shapes

```ts
type ChatMode = 'OMNI' | 'DEFAULT' | 'AIEX_HIDDEN';

interface OpenChatOptions {
  conversationId?: string;        // resume this conversation
  fullScreen?: boolean;           // cover the page; default false
  sessionContext?: object;        // context for a new conversation
  forceNewConversation?: boolean; // start a new conversation; clears chat_id
}
```

## Integration details

### Platform requirements

Needs a ServiceNow instance with Now Assist chat deployed for the app and an
authenticated session; the chat library and session come from the instance.
In apps with an app lifecycle module (`application.js`), gate creation on
`deploymentDetailsContext.get().enabled`, which the framework resolves on the
server for those apps (as in the example). Shells serving experiences rendered
only in the browser must construct the controller without that gate: for them
the value is resolved by the controller's own `initialize()`. Until the
session is ready, `renderChat()` renders nothing.

### SSR

`ChatController` is `null` on the server; guard construction with `isServer`
(as in the example) or construct it in `firstUpdated()`. `renderChat()` renders
nothing on first browser render, so server and client markup match.
`CHAT_MODES`, `AIEX_MODES`, and `deploymentDetailsContext` are available on
the server.

### Sizing and layout

The controller does not position the chat. Place the element returned by
`renderChat()` and size it per `chatMode` and `isFullscreen` (or the
`data-mode` and `data-full-chat` attributes on `.chat-container-wrapper`).
The chat fills its container.
