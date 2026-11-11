# Lit Patterns for AIUX

Critical Lit web component rules for AIUX. Violating these causes runtime bugs, broken reactivity, or accessibility failures.

---

## `nothing` Sentinel

`nothing` removes content from the DOM entirely. Use it in child/content positions only. For attribute positions, use an empty string `''`:

```js
import {nothing} from 'lit';

// Child position — removes the element from DOM
render() {
  return html`<div>${this._show ? html`<p>Content</p>` : nothing}</div>`;
}

// Attribute position — use empty string, not nothing
render() {
  return html`<div class=${this._active ? 'active' : ''}>`;
}
```

---

## classMap for Conditional Classes

Use `classMap` for all conditional CSS classes:

```js
import {classMap} from 'lit/directives/class-map.js';

render() {
  const classes = classMap({
    'aiux-btn': true,
    'aiux-btn-primary': this._primary,
    'aiux-btn-disabled': this._disabled
  });
  return html`<button class=${classes}>Click</button>`;
}
```

---

## No Self-Mutation of @property()

`@property()` values flow downward from the parent. To request a change, dispatch an event. Internal `@state()` can be mutated freely.

```js
@property({type: Boolean}) active = false;

_toggle() {
  this.dispatchEvent(new CustomEvent('active-change', {
    detail: {active: !this.active},
    bubbles: true,
    composed: true
  }));
}
```

---

## Reactive State, Not Imperative DOM

Use reactive properties and `classMap` to control visual state. Reserve `@query` for imperative DOM APIs with no declarative equivalent (`.showModal()`, `.focus()`, `.scrollIntoView()`):

```js
@state() _panelOpen = false;

render() {
  const classes = classMap({'panel': true, 'open': this._panelOpen});
  return html`<div class=${classes}></div>`;
}
```

---

## Event Conventions

Use namespace-scoped names with `bubbles: true, composed: true` for all cross-component events:

```js
this.dispatchEvent(
  new CustomEvent('aiux-incident-list:sort-change', {
    detail: {field: 'opened_at', direction: 'desc'},
    bubbles: true,
    composed: true
  })
);
```

Dispatch events instead of calling callback props — events cross shadow DOM naturally and parents can listen at any level:

```js
_select(item) {
  this.dispatchEvent(new CustomEvent('aiux-widget:select', {
    detail: {item}, bubbles: true, composed: true
  }));
}
```

---

## Event Delegation in Loops

Use a single handler on the container with `data-*` attributes — one stable function reference per render:

```js
${items.map(item => html`
  <li data-id=${item.id} @click=${this._handleSelect}>${item.name}</li>
`)}

_handleSelect(e) {
  const id = e.currentTarget.dataset.id;
  this._selectedId = id;
}
```

---

## repeat() vs .map()

Use `repeat` when items have stable unique IDs and the list is reordered, sorted, or filtered. Use `.map()` for simple stateless lists:

```js
import {repeat} from 'lit/directives/repeat.js';

// Dynamic list with reordering — repeat preserves DOM nodes
${repeat(this._items, item => item.sys_id, item => html`
  <incident-card .incident=${item}></incident-card>
`)}

// Static/stateless list — .map() is fine
${this._tabs.map(tab => html`<span>${tab.label}</span>`)}
```

---

## cache() for State Switching

Use `cache` when switching between complex templates to preserve DOM state (scroll position, form input):

```js
import {cache} from 'lit/directives/cache.js';

render() {
  return html`${cache(this._view === 'list'
    ? html`<list-view .items=${this._items}></list-view>`
    : html`<detail-view .item=${this._selectedItem}></detail-view>`
  )}`;
}
```

---

## static properties Declaration

Declare only the component's own properties — Lit merges the prototype chain automatically:

```js
static properties = {
  _myState: {type: Boolean, state: true}
};
```
