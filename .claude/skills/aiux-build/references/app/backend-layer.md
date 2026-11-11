# Backend Layer

Scoped AIUX applications add ServiceNow metadata (tables, roles, ACLs, navigation) and a deploy pipeline via the Fluent SDK.

---

## Fluent SDK File Map

```
fluent/
├── update/
│   ├── sys_db_object/           # Table definitions
│   ├── sys_dictionary/          # Field definitions
│   ├── sys_user_role/           # Roles
│   ├── sys_security_acl/        # ACLs
│   ├── sys_app_module/          # Application navigation modules
│   └── sys_ai_agent/            # AI agent configurations (optional)
└── now.config.json              # Scope and scopeId
```

---

## Build & Deploy Pipeline

```bash
pnpm run build                  # Build the AIUX app
pnpm run deploy                 # Deploy to ServiceNow instance
pnpm run deploy:full            # Build + deploy in one step
```

`deploy:full` runs:

1. `pnpm build` — compiles app, generates widget XML
2. `pnpm deploy` — pushes to instance via Fluent SDK

---

## Common Gotchas

| Issue                            | Cause                                                           | Fix                                              |
| -------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| Deploy fails with scope mismatch | `now.config.json`, `aiux.json`, `fluent/` have different scopes | Align all three                                  |
| Stale metadata on instance       | Cached old version                                              | Clear instance cache, re-deploy                  |
| Missing type definitions         | `dist/app` out of sync                                          | Delete `dist/`, rebuild                          |
| "Record not found" after deploy  | Role/ACL not deployed                                           | Check `sys_user_role` and `sys_security_acl` XML |
| Widget not visible on instance   | Missing `@discoverable(true)`                                   | Add decorator and rebuild                        |

---

## Role/ACL Contract

Three files must agree for a role-protected resource:

1. **`sys_user_role/`** — role definition XML
2. **`sys_security_acl/`** — ACL referencing the role
3. **Application code** — role checks in server scripts (`GlideRecordSecure`, `gs.hasRole()`)

---

## Dev Server

```bash
pnpm run dev    # Start local development server
```
