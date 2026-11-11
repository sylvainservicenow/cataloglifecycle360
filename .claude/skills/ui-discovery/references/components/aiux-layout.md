# aiux-layout

> Source: `@servicenow/aiux-components-layout@2.3.110` · `components/layout/docs/usage/aiux-layout.md`

`<aiux-layout>` is the framework's default root layout. It wraps the app's
routed page in a header bar (the text "AIUX Application" on the left, the
signed-in user's full name on the right), a `<main>` region, and a footer
reading `© <year> AIUX Application`. An app gets it automatically when it
declares no `applicationLayout` in `application.js` and has no
`pages/layout.js`; it can also be selected explicitly with
`applicationLayout: 'aiux-layout'` in `application.js` or by re-exporting it
from `pages/layout.js`.

Built in, do not rebuild: client-side routing and page mounting, the
page-transition loading overlay, the "Skip to main content" link, session
expiry and network-offline dialogs, and the slide-out side panel that
`openSidePanel()` (`@servicenow/aiux-components-core`) drives. The header text
is fixed to "AIUX Application"; for a custom header, sidebar, or footer, build
the root layout on `aiux-structured-layout` instead.

## Import

```js
import {AIUXLayout} from '@servicenow/aiux-components-layout';
```

## Usage

### Minimal complete example

No code is needed: omit `applicationLayout` from `application.js` and do not
create `pages/layout.js`, and every page renders inside `<aiux-layout>`.

To select it explicitly (for example, in an app that previously had a custom
layout), set `applicationLayout: 'aiux-layout'` in `application.js`, or
re-export it as the root layout:

```js
// pages/layout.js
import {AIUXLayout} from '@servicenow/aiux-components-layout';

export default AIUXLayout;
```

```js
// pages/home.js — a page rendered inside the layout
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';

@customElement('my-home-page')
export default class MyHomePage extends AIUXElement {
  render() {
    return html`<h1 class="text-2xl font-bold">Home</h1>`;
  }
}
```

**What happens:** The server renders the header, the home page inside
`<main>`, and the footer (in the browser instead for CSR-only scopes). Links to other routes navigate client-side; the
page area swaps while the header and footer stay mounted.

## API

### Properties and attributes

None. The element is created by the framework; it has no public reactive
properties.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `route-change-completed` | `{path: string}` | Dispatched on `window`; not cancelable | A client-side navigation has loaded its page | Listen on `window`, not on the element. |
| `aiux:boot-loader:dismiss` | none | Dispatched on `window` | The layout has hydrated in the browser (first update) | Used by the platform boot loader. |

### Slots

| Slot | Description |
| --- | --- |
| (default) | Inside `<main>`. The framework mounts the routed page here; do not add your own children. |

### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `navigate(path, options?)` | `Promise` or `undefined` | Navigates the app client-side. `path` may include the app base path; URL rewrite rules are applied first. `options`: `replace` (replace the history entry), `query` (object of query parameters), `state` (history state). Does nothing on the server. |
| `currentPath` (getter) | `string` | The router's current path, or `window.location.pathname` before the router starts, or `'/'` on the server. |
| `isNavigating` (getter) | `boolean` | `true` while a client-side navigation is loading. |

Pages and components usually navigate with in-app `<a href>` links instead of
calling these.

### Data shapes

The header reads `userContext` from `@servicenow/aiux-components-core`. The
user's name is shown only when `authenticated` is `true`, using `fullName`.

## Integration details

### SSR

The header, footer, and current page render on the server. The layout's
loader runs on the server and supplies the "AIUX Application" text and the
current year. Customer (`u_`) and vendor (`x_`) scoped experiences are
CSR-only: there the loader and render run in the browser.

### Lifecycle

The layout element stays mounted across client-side navigations; only the
page inside `<main>` changes.

### Sizing and layout

The host is a vertical flex column with `min-height: 100vh`. The `<main>`
region grows to fill the space and has `2rem` padding. The document scrolls
(the layout does not create its own scroll container).

## Accessibility, localization, and customization

- `<main id="main-content" tabindex="-1">` is the skip-link target; the
  "Skip to main content" link is visually hidden until focused and is
  localized.
- "AIUX Application" is hard-coded and not localized. The footer text is
  `© <year> AIUX Application`.
- Colors come from theme tokens: the header uses `--color-neutral` and
  `--color-neutral-content`; the footer uses `--color-base-200` and
  `--color-base-content`. There are no parts or layout-specific CSS custom
  properties.
