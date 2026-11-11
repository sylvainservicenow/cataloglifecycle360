# Page Collections — One Route, Several Pages

Use this reference when **different audiences need a structurally different page at the same route** — a manager view and an individual view of `/team`, an admin console and a read-only version of `/settings`. Several page modules claim one path and the server picks one per request, per user.

## When This Applies

- User says "different content for different roles", "managers see X, everyone else sees Y", "gate this page by role", "admin version of this page"
- The variants differ in **structure** — different widgets, different layout, different loader — not just a hidden section

**Reach for something else when:**

| Situation | Use instead |
| --- | --- |
| One section of an otherwise identical page is hidden | A reactive property, or make the section a widget and give the widget its own `@acl()` |
| A *different scoped app* contributes the competing page | `references/app/extensions.md` — same resolution machinery, different authoring convention |
| The whole app should be gated | `experienceAcls` in `aiux.json` (fails closed — a missing record denies every route) |

A collection is worth the second file when each variant reads better standalone than as branches inside one `render()`.

## The `_variants/` Convention

Create a `_variants/` folder **as a sibling of** the base `page.js`, one subfolder per candidate:

```
pages/team/
├── page.js                    ← base page, order 100 (default), no @acl → the ungated floor
└── _variants/
    └── manager/
        └── page.js            ← gated candidate, ranked ahead of the base page
```

Both files answer `/team`. `_variants/` is a **reserved, non-routable** directory: it and everything under it contribute no route segment, so the subfolder name (`manager/`) is for readers, not the router. Route derivation freezes the sibling base page's route and applies it to every `page.{js,ts}` beneath `_variants/`, **at any nesting depth, regardless of subfolder name** (`isCollectionDir()` in `core/sdk/src/utils/page-collections.js`, shared by `findPages()` and `walkExtensionPages()`).

Two rules about the folder itself:

- **A `_variants/` with no sibling `page.js` is allowed** — that is how an app contributes only gated variants and leaves the ungated floor to whatever base page already exists at that route, or to none.
- **An *empty* `_variants/` fails the build** (`emptyCollectionError`) — one with no `page.js`/`page.ts` anywhere inside, at any depth. The build fails rather than silently producing an unreachable set of pages.
- **`_collections/` is the deprecated name** for this folder. It still builds identically but prints a deprecation warning; scaffold new work with `_variants/`. A route folder holding both `_collections/` and `_variants/` fails the build.

## Decorators

```js
import {AIUXElement, decorators} from '@servicenow/aiux-components-core';

const {acl, order} = decorators;
```

| Decorator | Contract |
| --- | --- |
| `@order(N)` | Integer, **lower wins**. Numeric literal only. No `@order()` means the dictionary default **100**, so undecorated pages sort last. A non-numeric argument (`@order('900')`) is *not* fatal: the build logs a `console.warn` and falls back to the default. |
| `@acl([{decision, roles, securityAttribute, id}])` | Non-empty array of rule objects; the build emits one `sys_security_acl` record per rule, named `<scope>.<tagName>`. `decision` is `'allow_if'` (the default when omitted) or `'deny_unless'`. Each rule needs a non-empty `roles` array **or** a non-empty `securityAttribute`. `id` is optional and gives the rule stable identity across edits. Unlike `@order()`, a shape violation here **fails the build** — invalid `decision`, empty `roles`, colliding `id`s, or a rule set that is *all* `deny_unless` with no allow. |

Both are runtime no-ops (`components/core/src/decorators.js`); their values exist only via build-time AST extraction.

**`@acl()`'s argument must be an inline literal.** It is read by static AST parsing (`getAclDecoratorArg` in `core/sdk/src/utils/swc-decorators.js`), which requires an `ArrayExpression` and throws otherwise — *"@acl() argument must be an array of rule objects. Decorator arguments are extracted statically at build time."* So the role name cannot come from a shared constant, an import, or the `Role()` record that declares it. Write the string out:

```js
@customElement('x-snc-myapp-team-manager-page')
@order(10)
@acl([
  {
    decision: 'allow_if',
    roles: ['x_snc_myapp.myapp_manager'],
    id: 'team-page-manager'
  }
])
export default class TeamManagerPage extends AIUXElement { /* … */ }
```

The base page carries **no decorators at all** — see the ordering trap below.

## Two Traps

**1. An ungated candidate must never sort ahead of a gated one.** `filterAccessibleCandidates` reads a *missing* ACL record leniently — accessible to everyone. So an undecorated page given an explicit low `@order()` is served to every identity and permanently shadows its gated siblings, managers included. Leave an intentional fallback at the default order (100) or higher. This is why the base page above has no `@order()` rather than `@order(100)`.

**2. `@acl()` and `@roles()` are mutually exclusive for selection.** `filterAccessibleCandidates` partitions candidates on whether `sys_aix_page.roles` is non-empty and takes exactly one branch: `roles` set → `checkRecordAccess` (fails **closed**); `roles` empty → the `aiux_page` ACL (fails **open**). A candidate declaring both still gets its `sys_security_acl` record generated, but that record is never consulted *for selection*. Declare one or the other per candidate — for new work, `@acl()`.

## Declaring the Role

`@acl()` references a role; it does not create one. Add it as a Fluent record:

```ts
// src/fluent/manager-role.now.ts
import {Role} from '@servicenow/sdk/core';

export const managerRole = Role({
  name: 'x_snc_myapp.myapp_manager',
  description: 'Manager of My App — sees the manager variant of /team.'
});
```

`name` must begin with the application scope, and must match the string inside `@acl([{roles: [...]}])` **exactly**, scope prefix included. Nothing links the two files, and nothing validates the pairing: the build passes role *names* through to the generated ACL record and the Fluent ACL plugin resolves them to `sys_user_role` references at install. A typo produces a clean build and an ACL that grants nothing. `$id` is deprecated on `Role()` — ids derive from `name`.

**The keys registry will hold two proposed sys_ids for one role, and that is fine.** `src/fluent/generated/keys.ts` gets a `sys_user_role` entry from your `Role()` *and* a separate nested `sys_user_role` reference inside the `sys_security_acl_role` entry, each with a different `id` but the same natural key (`name`). The platform resolves the reference by that natural key on install, so the installed `sys_security_acl_role` row points at the real role record — verified on an instance, where only one `sys_user_role` existed and the ACL's role link carried its sys_id. Do not "fix" the mismatch by hand-editing `keys.ts`.

## Verifying

**Build.** The build warns once per ungated global page:

```
[metadata] Page "x-snc-myapp-team-page" is global (no @global(false)) but has no @acl decorator — it will be accessible without any ACL restriction.
```

For a collection, expect this warning for the **base page only**. If it also names your gated candidate, the `@acl()` was not extracted. This is the cheapest confirmation that the decorator took effect.

**Instance.** Both candidates share one `path_pattern`:

```bash
# two rows, same path_pattern, orders 10 and 100, roles empty
curl -s -u <user>:<pass> "<instance>/api/now/table/sys_aix_page?sysparm_query=path_pattern%3D%2Fteam&sysparm_fields=path_pattern,order,active,roles"

# the generated ACL, and that its role link resolved
curl -s -u <user>:<pass> "<instance>/api/now/table/sys_security_acl?sysparm_query=name%3D<scope>.<tagName>"
curl -s -u <user>:<pass> "<instance>/api/now/table/sys_security_acl_role?sysparm_query=sys_security_acl.name%3D<scope>.<tagName>"
```

`roles` empty on both rows is correct and load-bearing — it is what routes them to the ACL branch of `filterAccessibleCandidates`.

**Verify as a non-admin without the role.** Every decorator-generated ACL record lands with `admin_overrides = true` (the SDK's ACL plugin defaults it; `@acl()` never sets the field and gives you no way to change it), so an admin satisfies every rule — including a deny — and always lands on the gated candidate. Testing as admin tells you nothing about the fallback. Allow up to **5 minutes**: `@acl()` decisions go through a per-session cache (`ACL_CACHE_TTL_SECONDS` in `core/commons/acl-evaluator.js`), keyed to `JSESSIONID` and re-checked against the `glide_impersonation_change` cookie, so impersonating a different user does not serve the previous identity's decisions.

## Local Dev Server Does Not Resolve Collections

`pnpm run dev` deliberately resolves a collection route **differently from production**. Locally there are **no ACL or role checks, no `@order()`, and no sticky user preference** — a route with multiple candidates always serves the first by discovery order. Force a specific candidate with `?sysparm_collection_page=<tagName>` (locally the value is the page's **`tagName`**, not a `sys_aix_page` sys_id, since a pre-deploy build has none). Any `roles` shown in the picker or log are for orientation only.

**So local dev cannot confirm which variant a given user gets.** Deploy and check on the instance, signed in as a real non-admin test user.

## Switching Between Variants

`<aiux-page-variant-switcher>` lets a user load a different accessible variant of the page they are on. It is mounted by `<horizontal-contextual-nav>` as an inline sub-widget, and renders **only when more than one variant is applicable** — a single-variant page shows no control. Its trigger reads `View (Dev): <variant>`.

Two independent switches gate it, ANDed: the app-level `features.pageVariantSwitcher` (default on, set `false` to opt out) and the instance-wide `aiux.nav.page_variant_switcher.enabled` sys_property (default `true`). Both must allow it.

It is an `<aiux-flyout-menu>`, not a native `<select>` — the trigger text is independent of the item labels, and an item activates only on Enter/Space/click, never on arrow-key movement. (Older docs describe a two-step `<select>` plus "Load" button; that was the original design, replaced because a native select fires `change` on every arrow-key press on Windows — WCAG F37.)

Two things influence which variant a request resolves to, in order: an explicit `sysparm_collection_page` sys_id in the URL, then a per-route user preference `aiux.page_variant.<routeKey>` (e.g. `/home` → `aiux.page_variant.home`) holding the last variant chosen for that route. Either is only a *request* — an unknown, revoked, or inaccessible sys_id is ignored and normal order-then-access resolution proceeds. The preference read is skipped entirely for a route with no variant siblings.

## Gotchas

- **`collection_name` comes from the folder path.** The build writes `sys_aix_page.collection_name` as the folder path under `_variants/` (`_variants/finance/page.js` → `finance`, nested folders joined with `/`). Ordinary pages omit the field. It reaches the client as `collectionName` (shown in the decision trace), but the page-variant switcher labels each variant from its `@title()`, not from the folder name — give every variant a `@title()`.
- **Renaming the custom element repoints the ACL.** The record is named `<scope>.<tagName>`, so a new tag name generates a new ACL and leaves the old record guarding nothing.
- **No admin UI for `order`/`active`.** Changing them means editing the installed `sys_aix_page` record, which needs **both** `aix_admin` and `aix_config_admin` — the former grants read plus write to most fields, the latter is what grants write to `order` and `active` specifically.
- **No order-uniqueness enforcement.** Two candidates at one route with the same `order` break the tie by query position, not by anything you declared.
- **`ACL_ENABLED` does not gate collection filtering.** That switch governs only `enforceAcl`, a separate post-hoc gate that runs *after* a candidate is chosen and, on denial, redirects to `page-not-found` rather than falling through to the next candidate. Collection filtering always runs.
- **Published lint may not know `@acl` yet.** `valid-decorators` in `@servicenow/eslint-plugin-aiux-app` reports `unknownDecorator` for any name destructured from `decorators` that is not on its allowlist, and the published 0.5.0 artifact predates `acl` being added. It only fires when decorators are imported from `@servicenow/aiux-components-core` or `@servicenow/karuna/aiux-components-core`, so apps importing via another specifier are unaffected. Upgrade the plugin rather than removing the decorator.


## Related

- `references/app/extensions.md` — the cross-app analog, resolved by the same specificity → order → access machinery
- `references/app/pages-cookbook.md` — page templates the candidates themselves follow
- `references/app/acl.md` — gating pages, widgets and experiences with `@acl()`
