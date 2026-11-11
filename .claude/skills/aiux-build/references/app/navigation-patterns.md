# Navigation Patterns

## `<srcDir>/application.js` — The Preferred App Shell Pattern

`<srcDir>` is the value of `srcDir` in `aiux.json` (scaffolded as `src/lux`). Falls back to project root if `srcDir` is not set in `aiux.json`.

Production apps (e.g. AICT) use `application.js` as the lifecycle module instead of a custom `NavLayout` class. The framework calls `setup()` once per SSR request before loaders run. Nav items, features, and app title are set via `navLayoutContext` inside `setup()`. The app shell is `aiux-nav-layout` (declared via `applicationLayout` in `application.js`).

```js
// application.js
import {navLayoutContext} from '@servicenow/aiux-components-nav';
import {i18n} from '@servicenow/aiux-services';
import {
  isPluginActive,
  getSystemProperty
} from '@servicenow/aiux-components-core';
import {MY_THEME} from './theme.js';
import {
  licenseContext,
  setLicenseContext,
  fetchLicense
} from './contexts/license-context.js';

export default {
  appTheme: MY_THEME,
  applicationLayout: 'aiux-nav-layout', // use platform nav shell
  contexts: [licenseContext], // auto-fetched before setup()

  async setup(ctx) {
    const [licenseResult] = await Promise.all([fetchLicense(ctx)]);
    setLicenseContext(licenseResult ?? {hasEnterpriseLicense: false});
    const hasEnterpriseLicense = licenseResult?.hasEnterpriseLicense === true;

    const features = {
      menus: false,
      userSession: false,
      chat: ctx.chat?.enabled === true,
      announcements: true
    };

    const items = [
      {
        icon: 'home',
        title: i18n.getMessage('Home'),
        action: {type: 'navigate', path: '/home'}
      },
      {
        icon: 'list-outline',
        title: i18n.getMessage('Inventory'),
        action: {type: 'navigate', path: '/inventory'},
        activePath: '/inventory'
      },
      ...(hasEnterpriseLicense
        ? [
            {
              icon: 'lightbulb',
              title: i18n.getMessage('Insights'),
              action: {type: 'navigate', path: '/insights'}
            }
          ]
        : []),
      {
        icon: 'gear',
        title: i18n.getMessage('Settings'),
        l2Nav: [
          {
            title: i18n.getMessage('Users'),
            action: {type: 'navigate', path: '/settings/users'}
          },
          {
            title: i18n.getMessage('Integrations'),
            action: {type: 'navigate', path: '/settings/integrations'}
          }
        ]
      }
    ];

    const current = navLayoutContext.get();
    navLayoutContext.set({
      ...current,
      appTitle: i18n.getMessage('My App'),
      features,
      items,
      defaultLogoFull:
        getSystemProperty('com.glide.myapp.logo_full') || 'servicenow',
      defaultLogoIcon:
        getSystemProperty('com.glide.myapp.logo_small') || 'servicenow'
    });
  },

  // Rewrite legacy SN URLs to app routes before navigation commits
  navigate(navCtx) {
    // navCtx.toAppPath, navCtx.to (URL), navCtx.from (URL)
    // return a new path string to redirect, or undefined to allow through
    if (/^\/incident\.do$/.test(navCtx.toAppPath)) {
      const sysId = navCtx.to.searchParams.get('sys_id');
      if (sysId) return `/record/incident/${sysId}`;
    }
    return undefined;
  },

  // Clean up nav when leaving this app (CSR cross-app navigation)
  teardown() {
    navLayoutContext.set({
      items: [],
      defaultLogoFull: null,
      defaultLogoIcon: null
    });
  }
};
```

### L2 Nav (Sub-menus) and L3 Nav (Header Tabs)

```js
// L2 (sidebar sub-menu items)
{
  icon: 'building',
  title: i18n.getMessage('Govern'),
  l2Nav: [
    {title: i18n.getMessage('Risk'), action: {type: 'navigate', path: '/control/risk'}},
    {title: i18n.getMessage('Security'), action: {type: 'navigate', path: '/security'}, l3Nav: [
      {label: i18n.getMessage('Overview'), path: '/security/overview'},
      {label: i18n.getMessage('Events'), path: '/security/events'}
    ]}
  ]
}

// activePath — marks an item active when any child route matches
{icon: 'inventory', title: 'Inventory', action: {type: 'navigate', path: '/inventory/all'}, activePath: '/inventory'}
```

### `setHeaderConfig` and `setPageActions` (from nested layouts)

Nested layouts can push dynamic header config and action buttons to the nav shell:

```js
import {setHeaderConfig, setPageActions} from '@servicenow/aiux-components-nav';

// In a nested layout's connectedCallback or willUpdate
setHeaderConfig(this, {
  actionsDropdown: true,
  title: assetName,
  metadata: [
    {label: 'Active', iconName: 'check-outline', iconClass: 'text-success'}
  ],
  l3: [
    {label: i18n.getMessage('Overview'), path: `/inventory/${id}`},
    {label: i18n.getMessage('Details'), path: `/inventory/${id}/details`}
  ]
});

setPageActions(this, [
  {
    id: 'manage_asset',
    label: i18n.getMessage('Manage'),
    handler: async () => {
      await manageAsset(id);
      await this._refreshAfterAction();
    }
  },
  {
    id: 'unmanage_asset',
    label: i18n.getMessage('Unmanage'),
    handler: async () => {
      await unmanageAsset(id);
    }
  }
]);
```

---

## NavLayout — The Simple App Shell (Polaris-shell apps only)

Apps using the Polaris sidebar/header shell extend `NavLayout` from `@servicenow/aiux-components-nav`. It provides the sidebar, header, user session, and content slot. Apps that do not need the Polaris shell (embedded experiences, lightweight prototypes) extend `AIUXAppLayoutElement` directly.

```js
import {NavLayout, navLayoutContext} from '@servicenow/aiux-components-nav';
import {css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {MyAppTheme} from '../theme.js';

@customElement('my-app-layout')
export default class MyAppLayout extends NavLayout {
  static appTheme = MyAppTheme;

  static styles = [
    ...NavLayout.styles,
    css`
      :host {
        --nav-sidebar-bg: linear-gradient(to bottom, #032d42 0%, #044355 100%);
        --nav-layout-bg: #f5f7fa;
      }
    `
  ];

  static async loader(ctx) {
    await super.loader(ctx, {
      appName: 'My App',
      features: {
        menus: false,
        concoursePicker: false
      }
    });
    // configure sidebar items (see Sidebar section below)
  }
}
```

### Key Rules

- **Polaris-shell root layout extends `NavLayout`** — non-shell apps extend `AIUXAppLayoutElement`. Nested layouts extend `AIUXElement`.
- **Always call `super.loader(ctx, options)`** before setting sidebar items
- **Always spread `...NavLayout.styles`** in `static styles` — omitting it breaks the shell
- **Pages inside NavLayout MUST use `display: contents`** on `:host` — otherwise `aiux-list-connected` and other flex children collapse

### Features Object

Most nav features are **default-on** — only add a flag to `features` when explicitly turning something off. Do not list default-on flags like `userSession`, `notifications`, `themeToggle`, `profile`, `helpPanel`, `menus` with value `true`; they are implicit. `logo` is the exception — it **defaults to `false`**, so add `logo: true` explicitly when you want the instance-configured logo click URL.

| Feature              | Type    | Description                                        |
| -------------------- | ------- | -------------------------------------------------- |
| `appName`            | string  | Display name in header                             |
| `logo`               | boolean | Fetch instance logo click URL (default: **false**; set `true` to enable) |
| `unifiedExperience`  | boolean | Unified sidebar + user menu shell (default: true; set `false` for legacy shell) |
| `menus`              | boolean | Show global nav menus (default: true; set `false` to disable) |
| `concoursePicker`    | boolean | Show concourse scope picker (default: true; set `false` to disable) |
| `chat`               | boolean | Show chat entry point (default: true) — gate on instance config with `ctx.chat?.enabled === true` |
| `announcements`      | boolean | Show announcement banners (default: false; opt-in) |

### CSS Custom Properties

| Property              | Default | Description                            |
| --------------------- | ------- | -------------------------------------- |
| `--nav-sidebar-bg`    | —       | Sidebar background (gradient or color) |
| `--nav-layout-bg`     | —       | Main content area background           |
| `--nav-sidebar-width` | —       | Sidebar width when expanded            |

### navLayoutContext

`navLayoutContext` is the shared context for sidebar state. Always read-modify-write:

```js
navLayoutContext.set({
  ...navLayoutContext.get(),
  items: [...],        // sidebar items
  // other props the context supports
});
```

---

## File-Based Routing

Pages live in `<srcDir>/pages/`. Folders map directly to URL segments. `[param]` brackets create dynamic segments.

| File path                           | Route                | Params                              |
| ----------------------------------- | -------------------- | ----------------------------------- |
| `<srcDir>/pages/home/page.js`                | `/home`              | —                                   |
| `<srcDir>/pages/list/[table]/page.js`        | `/list/:table`       | `ctx.params.table`                  |
| `<srcDir>/pages/record/[table]/[id]/page.js` | `/record/:table/:id` | `ctx.params.table`, `ctx.params.id` |
| `<srcDir>/pages/[...slug]/page.js`           | `/:slug*`            | `ctx.params.slug` (catch-all)       |

Catch-all segments use `[...name]` to match the remainder of the path.

---

## Programmatic Navigation

```js
import {navigate} from '@servicenow/aiux-client';

// App-relative path — the router prepends basePath automatically
navigate('/record/incident/abc123');

// Replace current history entry (redirect-style)
navigate('/home', {replace: true});
```

The path is **app-relative** — do NOT include `basePath`.

---

## Anchor Links

Anchor links require the **full basePath-prefixed** href. Read `basePath` from the loader `ctx`.

```js
static async loader(ctx) {
  return {basePath: ctx.basePath};
}

render() {
  const {basePath} = this.loaderData || {};
  return html`<a href="${basePath}/home">Home</a>`;
}
```

**Do NOT use relative hrefs** like `./home` — they do not resolve correctly. The router intercepts absolute `basePath`-prefixed links for SPA navigation.

---

## Sidebar Navigation Items

Sidebar items are configured in the root layout's `loader` via `navLayoutContext`:

```js
const items = [
  {icon: 'home', title: 'Home', action: {type: 'navigate', path: '/home'}},
  {
    icon: 'list-outline',
    title: 'Incidents',
    action: {type: 'navigate', path: '/list/incident'}
  },
  {
    icon: 'document-outline',
    title: 'Tasks',
    action: {type: 'navigate', path: '/list/task'}
  },
  // Divider
  {divider: true},
  // External link
  {
    icon: 'link-outline',
    title: 'Docs',
    action: {type: 'link', href: 'https://docs.servicenow.com'}
  }
];
```

### Item Shape

| Property      | Type                     | Description                        |
| ------------- | ------------------------ | ---------------------------------- |
| `icon`        | string                   | Icon name for `<aiux-icon>`        |
| `title`       | string                   | Display text                       |
| `action.type` | `'navigate'` or `'link'` | Navigation type                    |
| `action.path` | string                   | App-relative path (for `navigate`) |
| `action.href` | string                   | Full URL (for `link`)              |
| `active`      | boolean                  | Highlight as current               |
| `divider`     | boolean                  | Render as separator                |

### Active State

Set active based on current `pagePath`:

```js
static async loader(ctx) {
  const pagePath = ctx.pagePath;
  // ...
  navLayoutContext.set({
    ...navLayoutContext.get(),
    items: items.map(item => {
      const isActive = pagePath?.startsWith(item.action?.path);
      return {...item, ...(isActive && {active: true})};
    })
  });
}
```

---

## Layout Chain

The layout chain resolves from outermost (root) to innermost:

```
<srcDir>/pages/layout.js           → Root layout (NavLayout, sidebar, theme)
  <srcDir>/pages/detail/layout.js  → Nested layout (scoped context provider)
    <srcDir>/pages/detail/[id].js  → Page (consumes context)
```

Each layout's loader runs **before** the page's loader. Layouts render their content via `<slot></slot>`.
