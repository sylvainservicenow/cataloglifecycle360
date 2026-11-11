# aiux-app

> Source: `@servicenow/aiux-components-layout@2.3.110` · `components/layout/docs/usage/aiux-app.md`

`<aiux-app>` (`AIUXExperienceAppShell`) is the root layout the platform uses
for a metadata-driven experience whose `sys_aix_experience.app_shell` field
references a `sys_aix_app_shell` record. It renders the widgets that record
names in its header, start, end, and footer regions around the routed page,
and applies the record's CSS. Apps do not place `<aiux-app>` in a template or
subclass it; configure it by editing the app shell record.

Built in, do not rebuild: client-side routing and page mounting, a loader in
the content area during navigation (the shell regions stay visible), an
initial full-screen loader until the shell is ready, per-page CSS for composed
pages, widget-data prefetch for composed pages, the reserved full-page chat
route (`/chat`), the notification container, the "Skip to main content" link,
and session expiry and network-offline dialogs.

## Import

```js
import '@servicenow/aiux-components-layout';
```

## Usage

### Minimal complete example

The shell is configured by a `sys_aix_app_shell` record, not by code. Set
its fields, then reference the record from the experience's `app_shell`
field:

| Field | Value |
| --- | --- |
| `header` | Reference to the `sys_aix_widget` rendered across the top |
| `start` | Reference to the widget rendered on the start side (typically navigation) |
| `end` | Reference to the widget rendered on the end side; leave empty to omit |
| `footer` | Reference to the widget rendered across the bottom; leave empty to omit |
| `css` | CSS applied to the shell, for example `.shell-start { inline-size: 16rem; }` |

Every route in the experience then renders inside `<aiux-app>`.

**What happens:** A full-screen loader shows while the shell starts. When it
is ready, the header widget renders across the top, the start widget on the
left, and the routed page in the content area. On each navigation the
current page is replaced by a loader in the content area until the next page
is ready; the header and start widgets stay mounted.

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `showInitialLoader` | `showinitialloader` | `boolean` | `undefined` (off) | Updates immediately | When `true`, keeps the full-screen initial loader visible even after the shell is ready. |

Read-only getters, derived from the current app shell record:

| Getter | Type | Description |
| --- | --- | --- |
| `headerWidget` | `string \| null` | Tag rendered in the header region. |
| `startWidget` | `string \| null` | Tag rendered in the start region. |
| `endWidget` | `string \| null` | Tag rendered in the end region. |
| `footerWidget` | `string \| null` | Tag rendered in the footer region. |
| `shellCss` | `string \| null` | The record's CSS. |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_FIRST_PAGE_LOAD_COMPLETE` | none | Bubbles, composed | The shell is ready and the region widgets mount (once) | Fires only when the experience has an app shell record. |
| `route-change-completed` | `{path: string}` | Dispatched on `window`; not cancelable | A client-side navigation has loaded its page | Listen on `window`. |
| `aiux:boot-loader:dismiss` | none | Dispatched on `window` | The shell has hydrated in the browser (first update) | Used by the platform boot loader. |

### Slots

None. The element renders in light DOM; regions are filled from the app shell
record.

### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `navigate(path, options?)` | `Promise` or `undefined` | Navigates the experience client-side. URL rewrite rules are applied first. `options`: `replace`, `query`, `state`. Does nothing on the server. |
| `currentPath` (getter) | `string` | The router's current path. |
| `isNavigating` (getter) | `boolean` | `true` while a client-side navigation is loading. |

### Data shapes

The app shell, as the element receives it (only populated regions are
present; `tagName` is the referenced widget's tag):

```ts
{
  header?: {tagName: string};
  start?: {tagName: string};
  end?: {tagName: string};
  footer?: {tagName: string};
  css?: string;
}
```

Region widgets are rendered as plain custom elements with no attributes or
properties; each widget loads its own data.

## Integration details

### Platform requirements

The experience must have `sys_aix_experience.app_shell` set to a
`sys_aix_app_shell` record. Without one, the experience does not use
`<aiux-app>`; it renders through its layout chain instead.

### SSR

Experiences with an app shell render in the browser, not on the server.
Region widgets mount after the shell finishes starting up. A region whose
widget fails to load is omitted; the rest of the shell still renders.

### Lifecycle

The record's CSS is added to the document head and replaced when a
navigation moves to an experience with a different shell; if the new shell
has no CSS, the previous shell's CSS stays applied. A composed page's
CSS is scoped to the page area (`.page-outer`) and removed when navigating to
a page without it. Both are removed when the element disconnects.

### Sizing and layout

- The shell fills the viewport (`100%` wide, `100dvh` tall) and hides
  document overflow.
- It is a grid: header across the top, start and end columns sized to their
  content, the page area taking the remaining space, footer across the
  bottom.
- Region wrappers have the classes `shell-header`, `shell-start`,
  `shell-end`, and `shell-footer`; the page host has `page-outer`. Target
  these from the record's `css`.

## Accessibility, localization, and customization

- The page is placed in `<main id="main-content" tabindex="-1">`, the target
  of the built-in, localized "Skip to main content" link.
- The navigation loader's "Loading..." label is localized. The fallback
  "Navigation failed" message is not.
- Customize appearance through the record's `css` and theme tokens such as
  `--theme-background`. The record's CSS applies to the whole document, so
  target the `shell-*` and `page-outer` classes. The element has no shadow root,
  parts, or slots.
