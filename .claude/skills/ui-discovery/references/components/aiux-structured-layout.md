# aiux-structured-layout

> Source: `@servicenow/aiux-components-layout@2.3.110` · `components/layout/docs/usage/aiux-structured-layout.md`

`AIUXStructuredLayout` (`<aiux-structured-layout>`) is a base class for an
app's own root layout. Subclass it in `pages/layout.js`, register your own
tag, and override `renderHeader()`, `renderAsideStart()`, `renderAsideEnd()`,
and `renderFooter()` to fill those regions; the routed page renders in the
middle. A region whose method returns `null` (the default) is not rendered at
all.

Built in, do not rebuild: client-side routing and page mounting, the
page-transition loading overlay, the "Skip to main content" link, session
expiry and network-offline dialogs, and the slide-out side panel that
`openSidePanel()` (`@servicenow/aiux-components-core`) drives.

## Import

```js
import {AIUXStructuredLayout} from '@servicenow/aiux-components-layout';
```

## Usage

### Minimal complete example

```js
// pages/layout.js
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {createContext, userContext} from '@servicenow/aiux-components-core';
import {AIUXStructuredLayout} from '@servicenow/aiux-components-layout';

export const myShellContext = createContext('my-app-shell', {
  appTitle: '',
  activePath: ''
});

@customElement('my-app-layout')
export default class MyAppLayout extends AIUXStructuredLayout {
  static contexts = [myShellContext, userContext];

  static async loader(ctx) {
    myShellContext.set({appTitle: 'Field Ops', activePath: ctx.pagePath});
  }

  renderHeader() {
    const {appTitle} = myShellContext.get();
    const user = userContext.get();
    return html`
      <header class="aiux-navbar bg-base-200 px-4">
        <span class="flex-1 text-lg font-semibold">${appTitle}</span>
        ${user?.authenticated ? html`<span class="text-sm">${user.fullName}</span>` : null}
      </header>
    `;
  }

  renderAsideStart() {
    return html`
      <nav aria-label="Primary" class="w-56 h-full bg-base-200 p-2">
        <ul class="aiux-menu">
          <li><a href="/home">Home</a></li>
          <li><a href="/reports">Reports</a></li>
        </ul>
      </nav>
    `;
  }
}
```

**What happens:** Every route renders inside `my-app-layout`: the header
across the top, the navigation on the left, and the page in the scrolling
area to its right. No end sidebar or footer is rendered because those methods
still return `null`. Clicking a link navigates client-side; the header and
sidebar stay mounted.

## API

### Properties and attributes

None. Subclasses add their own reactive properties or contexts.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `route-change-completed` | `{path: string}` | Dispatched on `window`; not cancelable | A client-side navigation has loaded its page | Listen on `window`, not on the element. |
| `aiux:boot-loader:dismiss` | none | Dispatched on `window` | The layout has hydrated in the browser (first update) | Used by the platform boot loader. |

### Slots

Fill regions by overriding the render methods below.

| Slot | Description |
| --- | --- |
| (default) | Inside `<main>`. The framework mounts the routed page here; do not add your own children. |

### Methods

Override these in the subclass:

| Method | Returns | Description |
| --- | --- | --- |
| `renderHeader()` | template or `null` | Content above the body, full width. Default `null` (no header region). |
| `renderAsideStart()` | template or `null` | Sidebar before the page area; scrolls vertically on its own. Default `null`. |
| `renderAsideEnd()` | template or `null` | Sidebar after the page area. Default `null`. |
| `renderFooter()` | template or `null` | Content after the page, inside the page's scroll container, so it scrolls with the page. Default `null`. |
| `static async loader(ctx)` | `Promise` | Runs on the server before render. Default returns `{}`. Set contexts here. |
| `onNavigateStart(from, to, options)` | `void` | Called when a client-side navigation starts. `options.fromBrowserHistory` is `true` for back/forward. Default does nothing. |
| `onNavigateEnd(path, page, options)` | `void` | Called after the new page loads. `options.fromBrowserHistory` is `true` for back/forward; `options.notFound` is `true` when the app's page-not-found page was served instead of the requested page. Default does nothing. |
| `onNavigateError(path, error)` | `void` | Called when a navigation fails. Default does nothing. |
| `renderError(error)` | template or nothing | Optional. Return a template to replace the default error in the page area; return nothing to keep the default. The default is "Navigation failed", or the server's heading and message when an access gate could not decide. |
| `pageLoaderTarget` (getter) | `string` | Where the navigation loading overlay appears: `'page'` (default, whole shell), `'stage'` (the page area only), `'none'` (no overlay; render your own using `isNavigating`), or a CSS selector. `'content'` has no matching region in this layout and behaves like `'page'`. |

Call these on the layout:

| Method | Returns | Description |
| --- | --- | --- |
| `navigate(path, options?)` | `Promise` or `undefined` | Navigates the app client-side. `path` may include the app base path; URL rewrite rules are applied first. `options`: `replace` (replace the history entry), `query` (object of query parameters), `state` (history state). Does nothing on the server. |
| `currentPath` (getter) | `string` | The router's current path, or `window.location.pathname` before the router starts, or `'/'` on the server. |
| `isNavigating` (getter) | `boolean` | `true` while a client-side navigation is loading. |

### Exported helpers

None.

### Data shapes

Static fields a subclass may set:

| Field | Default | Description |
| --- | --- | --- |
| `static ssr` | `true` | Set to `false` to skip server rendering of the layout. |
| `static windowManagerEnabled` | `true` | Set to `false` to never load the platform window manager. |

## Integration details

### SSR

The layout, its regions, and the current page render on the server, unless
the layout sets `static ssr = false` or the experience is customer (`u_`) or
vendor (`x_`) scoped, which is CSR-only. Render
methods must be SSR-safe and deterministic: read data from contexts set in
`loader()`, and do not branch the template on `isServer`.

### Lifecycle

The layout stays mounted across client-side navigations; only the page area
changes. Region methods re-run on every layout render, so read active-route
state from a context or reactive property rather than caching it.

### Sizing and layout

- The host is `height: 100vh` with `overflow: hidden`; the document does not
  scroll. Header and footer do not shrink.
- The body row is a horizontal flex: start sidebar, page container, end
  sidebar. Sidebars do not shrink; give them a width (for example `w-56`).
- The page container is `flex: 1`, scrolls on overflow (`overflow: auto`), and
  is `position: relative`. The footer is inside it, after the page.

## Accessibility, localization, and customization

- The page is placed in `<main id="main-content" tabindex="-1">`, the target
  of the built-in, localized "Skip to main content" link. Do not add another
  `<main>` in your regions; use `<header>`, `<nav aria-label>`, and `<aside>`.
- Built-in strings are the skip link, the session expiry and network-offline
  dialogs, and the default "Navigation failed" message (not localized;
  override `renderError()` to replace it).
- Region content is styled with Tailwind and `aiux-` DaisyUI classes, which
  are available in the layout's shadow root. The layout adds no colors of its
  own and exposes no parts or CSS custom properties.
