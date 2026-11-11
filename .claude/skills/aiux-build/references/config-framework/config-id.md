# Exposing Configuration — `aiux-config-id`

> **Default behavior:** After adding or editing `@configProperty` on a widget, **always add the `aiux-config-id` attribute on every instance of that widget in host pages/layouts**. Assume the user wants config exposed unless they explicitly say otherwise. Without it, the widget works fine at its field-initializer values — its configuration simply isn't exposed to admins. This is valid when intentional, but is the most common oversight when setting up configurable widgets.

## Two Levels of Configuration

Declaring `@configProperty` on a class only makes that widget **configurable** — it defines a configurable surface but does **not** expose any instance's configuration to users. There are two distinct levels:

1. **`@configProperty` on the class** = "this widget _can_ be configured." Declares the configurable surface. Necessary, not sufficient.
2. **`aiux-config-id="unique-id"` on an instance** = "expose _this specific instance's_ config to users." This is the per-instance opt-in.

## Usage

To expose a widget's configuration, the **host** (page or parent component that renders the widget) sets a static `aiux-config-id` attribute on that instance's tag:

```javascript
import {AIUXElement} from '@servicenow/aiux-components-core';
import {customElement} from 'lit/decorators.js';
import {html} from 'lit';

@customElement('my-page')
export default class MyPage extends AIUXElement {
  render() {
    return html`
      <!-- This instance's config IS exposed to users -->
      <aiux-counter aiux-config-id="counter-1"></aiux-counter>

      <!-- This instance's config is NOT exposed (intentional — renders at its field-initializer values) -->
      <aiux-counter></aiux-counter>
    `;
  }
}
```

There is nothing extra to import — `aiux-config-id` is a plain attribute that the build desugars.

## What `aiux-config-id` Does

`aiux-config-id` is **authoring sugar resolved at build time**. Inside `html` tagged templates the build rewrites

```javascript
html`<aiux-counter aiux-config-id="counter-1"></aiux-counter>`;
```

into the directive form the runtime actually consumes

```javascript
html`<aiux-counter aiux-config-data=${elementId(this, 'counter-1')}></aiux-counter>`;
```

and auto-imports `elementId` from `@servicenow/aiux-components-core` when it is not already in scope. The transform runs on **both** the SSR and browser build paths, so compiled templates stay byte-identical and no hydration mismatch is introduced.

`elementId` is the Lit attribute directive that does the runtime work. It performs two operations:

1. **Sets `data-aiux-element-id`** on the child element — this is the marker the config editor uses to discover and anchor configurable instances during its DOM walk.
2. **Projects the matching slice of the host's config data** to the child — it reads the host's `aiuxConfigData`, selects keys prefixed with the given id (e.g. `counter-1.title`), strips the prefix, and passes the result as JSON to the child's `aiux-config-data` attribute.

## Constraints

- **Static string literal only.** `aiux-config-id=${id}`, `aiux-config-id="${id}"`, an unquoted value, or a missing value is a **build error**. This compile-time check is the main advantage over writing `elementId(this, …)` by hand, which could not enforce it.
- **`html` and `region` use different mechanisms.** The `html` build transform desugars the attribute as shown above. In a `region` definition, write the same static `aiux-config-id="id"`; the region renderer stamps `data-aiux-element-id` and forwards the rendering host's config slice. Do not pass `elementId(this, ...)` into a region: directives are not serializable region values. `layout` tagged templates are not the current editable-region authoring API.
- **`elementId` still works.** The manual form is unchanged and remains valid; it is now the escape hatch rather than the recommended path.

## Per-Instance Semantics

- The same widget tag can appear multiple times on a page. The author decides **independently per instance** whether config is exposed.
- Omitting the attribute is valid when the author **explicitly** intends that instance to be non-configurable — the instance renders at its field-initializer values and is not user-configurable. By default, always add it for `@configProperty` widgets.
- Each exposed instance must use a **unique** id string. Duplicate ids within the same host cause config path collisions — the config editor detects these and shows a duplicate-id overlay warning.

## Missing Binding Behavior

If `aiux-config-id` is missing from an instance that has `@configProperty` props, there is **no error or warning**. The widget renders and functions normally at its field-initializer values, but the config editor cannot discover it — its configuration is not exposed to admins. This is the most common oversight when setting up configurable widgets.

Contrast this with a *malformed* `aiux-config-id` (a dynamic or unquoted value), which fails loudly at build time.

## Chaining for Nested Configurable Components

The attribute must be present at **every level** of the render tree between the page and a configurable component. If page P renders widget A, and A renders configurable child B:

- P sets `aiux-config-id="a-1"` on `<widget-a>`
- A sets `aiux-config-id="b-1"` on `<widget-b>` in A's own `render()`

Breaking the chain at any level makes everything below it unconfigurable. The config editor's `getElementConfigPath()` walks up the DOM collecting `data-aiux-element-id` markers; if any custom-element ancestor in the chain lacks one, it returns `null` and the element is skipped.

## Top-Level Pages

Top-level elements (pages or layouts rendered directly into the document root, with no custom-element ancestor) do **not** need `aiux-config-id` on themselves. They are the config storage anchor — the config editor identifies them by their tag name. Only their child components need the attribute to be discoverable.

## Editable Region Layouts

A `region` tagged template lives in its own module under the app root's `regions/` directory, not inline in the page, and every widget instance inside it needs a static `aiux-config-id` as described above. See `regions.md` for placement, relative import depth, the DSL grammar, and verification.
