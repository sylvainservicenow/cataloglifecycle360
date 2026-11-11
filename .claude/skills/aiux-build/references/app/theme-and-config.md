# Theme & Configuration

## aiux.json

App configuration — MUST exist at the project root.

```json
{
  "name": "My App",
  "basename": "my-app",
  "landing": "/home",
  "systemPropertyAllowlist": true,
  "chatDeploymentChannelSysId": "0c697083ffd803104846fffffffffffd",
  "createAnalyticsApp": true,
  "development": {
    "token": "Basic YWRtaW46YWRtaW4="
  },
  "build": {
    "exclude": ["**/*.test.js", "**/test/**"]
  }
}
```

| Field                        | Purpose                          | Rule                                        |
| ---------------------------- | -------------------------------- | ------------------------------------------- |
| `name`                       | Human-readable app name          | Displayed in manifests                      |
| `basename`                   | URL prefix (e.g. `/aiux/my-app`) | Must match `package.json` → `aiux.basename` |
| `landing`                    | Default landing page path        | Must be a valid page route                  |
| `systemPropertyAllowlist`    | Enable sys prop allowlist file   | `true` when using `getSystemProperty()`     |
| `chatDeploymentChannelSysId` | Chat widget channel sys_id       | Required for embedded chat integration      |
| `createAnalyticsApp`         | Registers a `sys_analytics_app` record | Every app should set this. New apps get `true` by default from the templates. Existing apps should migrate: set it to the current hand-authored record's sys_id (and delete the old `.now.ts` file) to move onto the SDK-generated path. Absent/`false` only for apps not yet migrated |
| `build.exclude`              | Glob patterns to exclude         | Always exclude test files                   |

---

## `<srcDir>/application.js` — App Lifecycle Module

`<srcDir>` is the value of `srcDir` in `aiux.json` (scaffolded as `src/lux`) — unlike `aiux.json` and `package.json`, which stay at the true project root, `application.js` lives under `<srcDir>`. If `srcDir` is not set in `aiux.json`, `application.js` lives at the project root.

The `<srcDir>/application.js` file is the preferred way to configure the app shell, nav, and lifecycle hooks in production apps.

```js
// <srcDir>/application.js
import {MY_THEME} from './theme.js';

export default {
  appTheme: MY_THEME,
  applicationLayout: 'aiux-nav-layout',  // platform shell — replaces custom NavLayout class

  // Called once per SSR request before page loaders run
  async setup(ctx) { ... },

  // Called on every client-side navigation — return a path to redirect, undefined to allow
  navigate(navCtx) { return undefined; },

  // Called when leaving the app (CSR cross-app navigation only)
  teardown() { ... }
};
```

`applicationLayout: 'aiux-nav-layout'` tells the framework to use the platform's built-in nav shell component. This is required when using the `application.js` approach — without it the app has no shell.

---

## `<srcDir>/theme.js` — App Theme

```js
// <srcDir>/theme.js — exported as a named const, imported by application.js
export const MY_THEME = {
  primary_color: '#032D42',
  neutral_colors: {
    use_hex_value: true,
    hex_value: '#F8F7F4'
  },
  shape: {
    selector_radius: '0.75rem',
    field_radius: '0.5rem',
    boxes_radius: '1rem',
    border_width: '1px'
  }
};
```

Set in `application.js`:

```js
export default {
  appTheme: MY_THEME
  // ...
};
```

---

## package.json

Must include AIUX-specific fields:

```json
{
  "name": "@servicenow/my-app",
  "aiux": {
    "basename": "my-app"
  }
}
```

**`aiux.basename` MUST match `aiux.json#basename`** — mismatch causes routing failures.

---

## now.config.json

Fluent SDK metadata for the ServiceNow instance:

```json
{
  "scope": "x_snc_my_app",
  "scopeId": "abc123def456"
}
```

Scope configuration is managed by the now-sdk tooling — do not add `scope`/`scopeId` to `aiux.json`.
