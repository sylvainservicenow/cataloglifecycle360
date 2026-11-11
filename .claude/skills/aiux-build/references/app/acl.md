# ACLs — Gating Pages, Widgets, and Experiences

**Use `@acl()` / `experienceAcls` for all new gating.** `@roles()` is legacy — no denies, no OR'd rules, no non-role predicates.

---

## Decide what you're protecting

| Type | Covers | On denial | Where declared |
| ---- | ------ | --------- | --------------- |
| `aiux_page` | one page | 302 to `page-not-found` | `@acl()` on the page class |
| `aiux_widget` | a widget's server-script execution + display | page still renders, widget doesn't | `@acl()` on the widget class |
| `aiux_experience` | every route under the app's basename | 302 to `page-not-found` for every route | `experienceAcls` in `aiux.json` |

A widget ACL does **not** protect its source bundle — anyone can fetch the JS/sourcemap regardless. Never rely on a widget ACL to keep code secret.

---

## Protect a page

```javascript
import {customElement} from 'lit/decorators.js';
import {AIUXElement, decorators} from '@servicenow/aiux-components-core';
const {acl} = decorators;

@acl([{roles: ['admin']}])
@customElement('my-protected-page')
export default class ProtectedPage extends AIUXElement { /* ... */ }
```

## Protect a widget

```javascript
import {customElement} from 'lit/decorators.js';
import {AIUXWidgetElement, decorators} from '@servicenow/aiux-components-core';
const {server, acl} = decorators;

@customElement('aiux-protected-widget')
@server('./server.js')
@acl([
  {decision: 'allow_if', securityAttribute: 'has_admin_role', id: 'my-widget-admin-acl'},
  {decision: 'allow_if', roles: ['itil'], id: 'itil-acl'}
])
export default class MyProtectedWidget extends AIUXWidgetElement { /* ... */ }
```

## Protect an experience (whole app)

Add to `aiux.json` — this is the only way to gate at experience level, there is no decorator for it:

```json
{
  "name": "My Experience",
  "basename": "my-experience",
  "experienceAcls": [
    {"decision": "allow_if", "securityAttribute": "user_is_authenticated"},
    {"decision": "allow_if", "roles": ["itil_admin"]}
  ]
}
```

**A brand-new experience with no `experienceAcls` is NOT open by default** — unlike pages/widgets, the experience catch-all only allows `aix_experience_admin`. If you're scaffolding a new app (`aiux init`) or adding `aiux.json` for the first time, add `experienceAcls` before anyone but that role can reach it.

---

## Rule shape

Every rule (page, widget, or experience) supports:

| Field | Values | Notes |
| ----- | ------ | ----- |
| `decision` | `'allow_if'` \| `'deny_unless'` | Defaults to `'allow_if'` if omitted |
| `roles` | array of role names | e.g. `['admin']`, or built-ins `snc_internal`/`snc_external` — **these two require the Explicit Roles plugin (`com.snc.explicit_roles`)**; on an instance without it, referencing them by name fails silently and the rule won't resolve as intended |
| `securityAttribute` | e.g. `'has_admin_role'`, `'user_is_authenticated'` | Non-role predicate |
| `id` | string, optional | Give one **rule** a stable identity across edits, or to disambiguate two rules that would otherwise collide |

Rules OR together for allows, AND together for denies. **A rule set with only `deny_unless` grants nothing and fails the build** — always pair a deny with the allow that defines who gets in.

---

## Build-time checks (fails the build, not silent)

- Two rules in the same array resolving to the same identity → give one an explicit `id`
- A rule set made entirely of `deny_unless` → add an allow
- Malformed rule shape

---

## Review checklist (before opening the PR)

- Gated surface has a non-empty `@acl()` or `experienceAcls`
- Audience is deliberate, not `user_is_authenticated` pasted in to clear a 404
- `id` values unique within the component
- Page/widget ACL names are scope-qualified automatically; experience ACL names are the bare `basename` — don't hand-construct either
- Verify as a non-privileged test user — `admin_overrides = true` on every decorator-generated rule, so admin passes everything including a deny
- New/renamed experience: `experienceAcls` provisioned and deployed before anyone needs to reach it (decision cache — see below, a fix can look like it did nothing for up to 5 minutes)

---

## Decision caching

ACL decisions are cached per session, not re-evaluated on every request, for up to **5 minutes** (`ACL_CACHE_TTL_SECONDS`). A rule change (new role, new `securityAttribute`) can look like it "did nothing" for up to that long after deploy — that's the cache, not a broken rule. Re-test after waiting out the full window, or in a fresh session, before concluding the rule itself is wrong.

## Troubleshooting: every page shows "Page not found"

This is almost always a missing or misconfigured `experienceAcls` on a new or renamed experience — remember, an experience with none is **not** open by default. Fix: add `experienceAcls` to `aiux.json` (start broad — `user_is_authenticated`, or the specific role you settled on — then tighten), rebuild, redeploy metadata, and re-test as the intended audience, not as admin (admin bypasses every rule).
