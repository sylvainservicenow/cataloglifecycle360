---
name: accessibility
description: >
  Accessibility implementation for AIUX/Karuna Lit components. This skill contains
  project-specific reference files with AIUX conventions not in general training
  data: WCAG 2.2, reflow requirements at 320px, Shadow DOM ARIA labeling patterns,
  isServer guards for SSR-safe focus management, accessible drag-and-drop in Lit,
  canvas interface guidance, form validation, and forced-colors
  (Windows High Contrast Mode) CSS patterns.
metadata:
  author: servicenow
  version: '1.0.0'
compatibility: >
  Works with Claude Code, Cursor, VS Code Copilot, Windsurf, Gemini CLI,
  and other Agent Skills-compatible tools
license: MIT
---

# Accessibility Implementation Skill

## When to use this skill

- When the user asks about accessibility, WCAG compliance, or ARIA patterns
- When interactive elements are missing keyboard support or screen reader semantics
- When dynamic content changes are not announced to assistive technologies
- When focus management, live regions, or form validation feedback needs implementation

## Purpose

This skill provides comprehensive accessibility guidance for creating WCAG 2.2 Level A/AA compliant interfaces using ARIA Authoring Practices Guide (APG) patterns.

## Trigger Patterns

Use this skill when creating or fixing any user interface. All code you create must be accessible to the WCAG 2.2 at the AA Level.

## Reference Files

- **Reflow guide** - Guidance and techniques for meeting reflow criteria, a requirement for our designs → See [references/reflow-guide.md](references/reflow-guide.md)
- **Accessible drag and drop** - Guidance and techniques for drag and drop interactions, including keyboard and screen reader techniques → See [references/accessible-dnd.md](references/accessible-dnd.md)
- **Canvas interfaces** - Guidance and techniques for canvas based applications such as flow diagrams and WYSIWYG builders → See [references/canvas-interfaces.md](references/canvas-interfaces.md)
- **DaisyUI rules** - Enforced DaisyUI usage and accessibility rules live in `.argus/rules/shared/daisyui.md` (PR-review enforcement). DaisyUI-specific anti-patterns are also caught by ESLint via `tools/eslint-plugin-aiux-style/` and `tools/eslint-plugin-aiux-a11y/`. The per-component APG pattern for each DaisyUI component is in [references/aria-apg-patterns/](references/aria-apg-patterns/).
- **Forced colors reference** - Windows High Contrast Mode (forced-colors) CSS patterns, system color keywords, and the three behavioral patterns (interactive / field / container) every component must follow → See [references/forced-colors-reference.md](references/forced-colors-reference.md)
- **Form validation** - ARIA wiring (`aria-invalid`, `aria-describedby`), role mapping (`alert` vs `status`), validation timing, and the complete form validation cycle → See [references/form-validation.md](references/form-validation.md)
- **Alert and notification patterns** - `role="status"` vs `role="alert"` strategy, keyboard interactions, and focus management for Platform/growl, Toast, and Banner notification types, WCAG 4.1.3 mapping, live region failure modes, and implementation examples → See [references/aria-apg-patterns/alert.md](references/aria-apg-patterns/alert.md)

### ARIA APG Pattern References

Individual pattern files are in [references/aria-apg-patterns/](references/aria-apg-patterns/). **Do not read all pattern files.** Only read the patterns that are relevant to the component or interaction you are implementing.

| Pattern                    | File                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accordion                  | [references/aria-apg-patterns/accordion.md](references/aria-apg-patterns/accordion.md)                                                                  |
| Alert                      | [references/aria-apg-patterns/alert.md](references/aria-apg-patterns/alert.md)                                                                          |
| Alert Dialog               | [references/aria-apg-patterns/alert-dialog.md](references/aria-apg-patterns/alert-dialog.md)                                                            |
| Breadcrumb                 | [references/aria-apg-patterns/breadcrumb.md](references/aria-apg-patterns/breadcrumb.md)                                                                |
| Button                     | [references/aria-apg-patterns/button.md](references/aria-apg-patterns/button.md)                                                                        |
| Carousel                   | [references/aria-apg-patterns/carousel.md](references/aria-apg-patterns/carousel.md)                                                                    |
| Checkbox                   | [references/aria-apg-patterns/checkbox.md](references/aria-apg-patterns/checkbox.md)                                                                    |
| Combobox                   | [references/aria-apg-patterns/combobox.md](references/aria-apg-patterns/combobox.md)                                                                    |
| Dialog (Modal)             | [references/aria-apg-patterns/dialog.md](references/aria-apg-patterns/dialog.md)                                                                        |
| Disclosure                 | [references/aria-apg-patterns/disclosure.md](references/aria-apg-patterns/disclosure.md)                                                                |
| Feed                       | [references/aria-apg-patterns/feed.md](references/aria-apg-patterns/feed.md)                                                                            |
| Grid / Selectable Listview | [references/aria-apg-patterns/grid.md](references/aria-apg-patterns/grid.md) — **use for any table with row checkboxes, row actions, or row selection** |
| Landmarks                  | [references/aria-apg-patterns/landmarks.md](references/aria-apg-patterns/landmarks.md)                                                                  |
| Link                       | [references/aria-apg-patterns/link.md](references/aria-apg-patterns/link.md)                                                                            |
| Listbox                    | [references/aria-apg-patterns/listbox.md](references/aria-apg-patterns/listbox.md)                                                                      |
| Menu and Menubar           | [references/aria-apg-patterns/menu-and-menubar.md](references/aria-apg-patterns/menu-and-menubar.md)                                                    |
| Menu Button                | [references/aria-apg-patterns/menu-button.md](references/aria-apg-patterns/menu-button.md)                                                              |
| Meter                      | [references/aria-apg-patterns/meter.md](references/aria-apg-patterns/meter.md)                                                                          |
| Radio Group                | [references/aria-apg-patterns/radio-group.md](references/aria-apg-patterns/radio-group.md)                                                              |
| Slider                     | [references/aria-apg-patterns/slider.md](references/aria-apg-patterns/slider.md)                                                                        |
| Slider (Multi-Thumb)       | [references/aria-apg-patterns/slider-multi-thumb.md](references/aria-apg-patterns/slider-multi-thumb.md)                                                |
| Spinbutton                 | [references/aria-apg-patterns/spinbutton.md](references/aria-apg-patterns/spinbutton.md)                                                                |
| Switch                     | [references/aria-apg-patterns/switch.md](references/aria-apg-patterns/switch.md)                                                                        |
| Table                      | [references/aria-apg-patterns/table.md](references/aria-apg-patterns/table.md)                                                                          |
| Tabs                       | [references/aria-apg-patterns/tabs.md](references/aria-apg-patterns/tabs.md)                                                                            |
| Toolbar                    | [references/aria-apg-patterns/toolbar.md](references/aria-apg-patterns/toolbar.md)                                                                      |
| Tooltip                    | [references/aria-apg-patterns/tooltip.md](references/aria-apg-patterns/tooltip.md)                                                                      |
| Tree View                  | [references/aria-apg-patterns/tree-view.md](references/aria-apg-patterns/tree-view.md)                                                                  |
| Treegrid                   | [references/aria-apg-patterns/treegrid.md](references/aria-apg-patterns/treegrid.md)                                                                    |
| Window Splitter            | [references/aria-apg-patterns/window-splitter.md](references/aria-apg-patterns/window-splitter.md)                                                      |

## Workflow

### Before Starting Any Work

1. **Read the relevant reference files:**
   | Filename | When to Read | What It Is |
   |----------|--------------|------------|
   | `references/reflow-guide.md` | Always — **required before writing any layout, navigation, sidebar, toolbar, or responsive CSS** | Guide for responsive design techniques that maintain accessibility at different viewport sizes |
   | `references/aria-apg-patterns/*.md` | Always - Creating any interactive components | ARIA APG patterns with keyboard interactions and ARIA requirements. **Only read the specific pattern file(s) relevant to your component** — see the table of contents above |
   | `references/accessible-dnd.md` | Creating drag-and-drop, movable elements, resizable panels, or repositionable dialogs | Techniques for making drag, move, and resize interactions accessible (only read if making this type of interface) |
   | `references/canvas-interfaces.md` | Creating Canvas-based applications | Guidance for flow diagrams, WYSIWYG builders, and similar canvas interfaces (only read if making this type of interface) |
   | `.argus/rules/shared/daisyui.md` | Using any DaisyUI component | Enforced DaisyUI rules (anti-patterns, accessibility, theming). Read for PR-review-level requirements. ESLint plugins `aiux-style` and `aiux-a11y` catch many of these at build time. |
   | `references/forced-colors-reference.md` | Always | CSS patterns for Windows High Contrast Mode (forced-colors) support, system color keywords, and the three behavioral patterns (interactive / field / container) |
   | `references/form-validation.md` | Implementing or reviewing forms with validation | ARIA wiring, message role mapping, validation timing, and the complete form validation cycle |
   | `references/aria-apg-patterns/alert.md` | Implementing any notification (toast, alert, banner, system notification, live region) | `role="status"` vs `role="alert"` strategy, keyboard/focus spec for Platform/Toast/Banner, live region failure modes, WCAG 4.1.3 |
   - Read BEFORE writing any code

### Implementation Process

1. Consult APG pattern for component structure
2. Implement ALL keyboard interactions from APG
3. Include ALL required ARIA attributes from APG
4. **Ensure pages reflow at 320px** viewport width (equivalent to 400% zoom on 1280px baseline per WCAG 1.4.10), following the patterns in `references/reflow-guide.md` — read it before writing any layout, navigation, sidebar, or toolbar CSS. Do not remove any content or functionality, including navigation, headers, footer, or sidebars. Key rules:
   - **Never put horizontal scrolling inside navigation.** On small screens collapse sidebars and nav/tool bars to a stacked layout or an overflow ("3-dot") dropdown menu — do NOT convert them into a horizontally-scrolling tab strip.
   - **No nested scroll regions**, with one exception: a data-table wrapper where horizontal scrolling is unavoidable (`overflow-x: auto`). Two-dimensional scrolling within a component is a reflow failure.
   - Reflow content into a single column that wraps and grows vertically; never require horizontal page scrolling at 320px.
5. **Add `@media (forced-colors: active)` CSS** for every component following the patterns in `references/forced-colors-reference.md`. This is required, not optional. Key rules:
   - Apply `forced-color-adjust: none` to interactive elements (buttons, tabs, form controls, and each individual menu/listbox item element directly — do not rely on container inheritance)
   - Use `Canvas`/`CanvasText` for non-interactive containers (alerts, tooltips, modals, badges, menu panels, listbox popups) — no `forced-color-adjust: none` on containers
   - For hover/keyboard-cursor position use `Highlight`/`HighlightText` — always set BOTH `background-color` and `color` together
   - For persistent selection (`aria-selected="true"`, `aria-checked="true"`, `aria-pressed="true"`) use `SelectedItem`/`SelectedItemText` — never use `Highlight` for selection states
   - Ghost/bare buttons (transparent border in normal mode) must get a visible `ButtonBorder` border in the forced-colors block
   - Avatar/image elements: add `forced-color-adjust: none` to preserve original image appearance
6. Cross-reference WCAG criteria
7. Provide complete, tested code

### For Accessibility Audits

1. Check against WCAG 2.2 Level A and AA criteria
2. Test keyboard accessibility
3. Verify ARIA implementation
4. Test for Reflow down to 320px wide
5. Check semantic HTML usage
6. List issues with severity and WCAG references
7. Provide specific fix recommendations

## Core Principles

**Pages must Reflow (WCAG 1.4.10)**

- At 320px viewport width without horizontal scrolling (equivalent to 400% zoom on 1280px baseline)
- No loss of content or functionality
- No overlapping content
- Sticky positioning can interfere with reflow; avoid sticky headers/footers at narrow viewports

**Keyboard Accessibility:**

- Every interactive element must be keyboard accessible
- Focus must be visible (WCAG 2.4.7)
- Any element the user can **move or resize** must use the mode-based keyboard pattern: a dedicated key (Spacebar on the move/resize handle) enters the mode, arrow keys adjust, Spacebar or Enter confirms, Escape cancels. Read `references/accessible-dnd.md` before implementing.

**Screen Reader Support:**

- Provide accessible names (labels, aria-label)
- Use landmarks for page structure (main, nav, aside, footer)
- Use headings for content hierarchy
- Associate labels with form controls
- Announce dynamic changes (live regions)

**Focus Management:**

- Never lose focus
- Always visible focus indicator
- Announce focus changes when context changes
- Use `:focus-visible` pseudo-class for focus indicators (not `:focus`)
  - `:focus-visible` automatically shows focus indicators for keyboard navigation and hides them for mouse clicks
  - Browser determines when focus should be visible based on input modality
  - Always shows focus when keyboard navigates to any element
  - Typically hides focus when mouse clicks buttons, tabs, checkboxes, radio buttons, or switches
  - Always shows focus when mouse clicks into text inputs or textareas
  - Do NOT manually suppress focus visibility; let `:focus-visible` handle it
- **Focus after row deletion:** When a row is removed from a grid or list, always move focus before removing the element. Focus the next sibling row if one exists, otherwise the previous. Never leave focus on a destroyed element. See the full pattern in [references/aria-apg-patterns/grid.md](references/aria-apg-patterns/grid.md).

### Focus Controller (`@servicenow/aiux-controller-focus`)

Use the project's built-in `FocusController` for shadow DOM focus management instead of writing custom focus logic. It handles two patterns:

#### Auto-focus delegation

When `host.focus()` is called, focus is delegated to the first focusable element inside the shadow root rather than landing on the host itself. This ensures programmatic focus (e.g., after route navigation or closing a sibling component) reaches the correct interactive control.

```js
import {FocusController} from '@servicenow/aiux-controller-focus';

class MyCard extends AIUXElement {
  _focus = new FocusController(this);

  render() {
    return html`
      <input type="text" placeholder="Name" />
      <button>Save</button>
    `;
  }
}
// myCard.focus() → lands on the <input>, not the host
```

#### Runtime trap toggling (drawer / popover pattern)

For components that transition between trapped and non-trapped states, toggle the `trap` property:

```js
class MyDrawer extends AIUXElement {
  _focus = new FocusController(this);

  open() {
    this._focus.trap = true;
    this.focus(); // delegates into shadow root
  }

  close() {
    this._focus.trap = false;
    // Return focus to the trigger element (WCAG 2.4.3)
  }
}
```

#### Related WCAG criteria

- **2.1.2 No Keyboard Trap** — trapped components must provide an exit (e.g., Escape key)
- **2.4.3 Focus Order** — focus delegation and trapping preserve logical tab order
- **2.4.7 Focus Visible** — focus must remain visible throughout; the controller does not handle styling, so ensure `:focus-visible` indicators are in place

### Roving TabIndex Controller (`@servicenow/aiux-controller-roving-tabindex`)

Use this controller when a group of related items should behave as a **single Tab stop** with arrow-key navigation between them. The active item has `tabindex="0"`; all others have `tabindex="-1"`. Arrow keys move focus within the group; Tab/Shift+Tab leave it entirely.

- **When to use:** radio groups, toolbars, tab lists, segmented controls, listboxes / option groups
- **When NOT to use:** forms with mixed input types (each field should be individually Tab-reachable), items containing multiple interactive controls, or any widget where items need individual Tab access
- **Grid header controls:** In a `role="grid"` or `<table>`, header row controls (e.g., a select-all checkbox) must remain Tab-reachable. Do NOT set `tabindex="-1"` on header checkboxes. Arrow-key navigation governs body row movement only; header row interactive elements stay in the natural tab order so users can reach them before entering the grid.
- **Basic usage with AIUXElement:**

```js
import {AIUXElement} from '@servicenow/aiux-components-core';
import {RovingTabIndexController} from '@servicenow/aiux-controller-roving-tabindex';

class MyToolbar extends AIUXElement {
  _roving = new RovingTabIndexController(this, {
    selector: 'button',
    orientation: 'horizontal' // 'horizontal' | 'vertical' | 'both' (default)
  });
}
```

- **Dynamic item refresh:** call `this._roving.refresh()` after DOM mutations that add or remove items
- **Orientation options:**
  - `'horizontal'` — ArrowLeft / ArrowRight (toolbars)
  - `'vertical'` — ArrowUp / ArrowDown (listboxes)
  - `'both'` (default) — all four arrow keys (radio groups)
- **Related WCAG criteria:** 2.1.1 (Keyboard), 2.4.3 (Focus Order), 2.4.7 (Focus Visible)

**Use of Color (WCAG 1.4.1):**

- Color can never be the only _visual_ means of providing information
- Provide additional visual indicators (icons, patterns, text labels, underlines) alongside color
- Examples: error states need icons + color, required fields need asterisks + color, links need underlines + color

**Shadow DOM and Lit components:**

- ID-based ARIA references (`aria-labelledby`, `aria-describedby`) do not cross Shadow DOM boundaries. Keep the referenced element and the ARIA attribute inside the same shadow root.
- Use `aria-label` as an alternative when cross-boundary labeling is needed.
- Guard DOM-dependent accessibility code with `isServer` to prevent SSR crashes:

```js
import { isServer } from 'lit';

connectedCallback() {
  super.connectedCallback();
  if (!isServer) {
    // Safe to manage focus, observe DOM, etc.
  }
}
```

**Live regions for dynamic content**

## Live Regions

Live regions communicate dynamic content changes to users who rely on assistive technologies such as screen readers. Since screen reader users cannot perceive visual changes on a page, live regions announce updates directly to them.

## When to Use Live Regions

**Always inform users of the outcome when they trigger an action.** When a user presses a button and something happens (success, failure, loading state), they must be informed. This can be accomplished through:

1. **Visible feedback with appropriate ARIA roles** — alerts, toasts, status messages
2. **Visually hidden aria-live regions** — for non-visual status updates

## Types of Live Regions

| Type          | Role/Attribute                                  | When to Use                                                                                                                | Behavior                                           |
| ------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Status**    | `role="status"`                                 | Visible content that updates passively without direct user interaction (e.g., "3 items selected", "Saving...")             | Non-obtrusive; announced at next pause             |
| **Alert**     | `role="alert"`                                  | Urgent, time-sensitive information introduced to the page (e.g., toast messages, inline form errors, system notifications) | Assertive; interrupts current screen reader output |
| **Aria-live** | `aria-live="polite"` or `aria-live="assertive"` | Status updates that are NOT visually displayed (e.g., drag-and-drop position updates, background task completion)          | Polite waits for pause; assertive interrupts       |

## Implementation Guidelines

1. **Visible status messages** — Use `role="status"` for content that passively updates (counters, auto-save indicators, search result counts)

2. **Visible alerts** — Use `role="alert"` for critical, time-sensitive information that appears on screen (error messages, confirmation toasts, warnings)

3. **Hidden announcements** — Use a single, visually hidden element with `aria-live` for updates that have no visual representation:
   - Drag-and-drop position feedback ("Item moved to position 3 of 5")
   - Background process completion ("File uploaded successfully")
   - Action confirmations when no visible change occurs

4. Use `@servicenow/aiux-controller-aria-live` to announce status messages and dynamic updates:

   ```js
   import {AriaLiveController} from '@servicenow/aiux-controller-aria-live';

   class MyElement extends LitElement {
     _live = new AriaLiveController(this);

     async _save() {
       await saveData();
       this._live.announce('Changes saved successfully.');
     }
   }
   ```

## Action Feedback Pattern

Every user-initiated action that produces a result must provide accessible feedback:

```html
<!-- Visible alert example -->
<div role="alert">Record saved successfully</div>

<!-- Visually hidden live region for non-visual feedback -->
<div aria-live="polite" class="visually-hidden">Record saved successfully</div>
```

**Key principle:** If a sighted user sees feedback (a spinner, a success message, an error, a new page in a flow), a screen reader user must receive equivalent information through live regions.

## Testing Checklist

Before delivering any page or component, verify:

### Keyboard Testing

- [ ] All functionality available via keyboard
- [ ] Tab order is logical
- [ ] Focus visible on all elements when navigating via keyboard

### Screen Reader Testing

Describe how it should work with screen readers:

- [ ] All elements with roles have accessible names
- [ ] Roles are appropriate
- [ ] States are announced (expanded, selected, etc.)
- [ ] Errors are announced
- [ ] Dynamic content changes announced
- [ ] Landmarks provide structure

### Visual Testing

- [ ] Focus indicators visible (3:1 contrast minimum)
- [ ] Color contrast sufficient (4.5:1 text, 3:1 non-text)
- [ ] Content reflows at 320px viewport width without horizontal scrolling (WCAG 1.4.10)
- [ ] No information conveyed visually by color alone
- [ ] Text spacing can be adjusted without loss of content (WCAG 1.4.12): line-height 1.5x, paragraph spacing 2x, letter-spacing 0.12x, word-spacing 0.16x
- [ ] Motion respects prefers-reduced-motion (WCAG 2.3.3): animations can be disabled or reduced

### Reflow Testing

- [ ] Pages reflow down to 320px without scrolling in 2 directions
- [ ] No content is missing, truncated, or overlapping
- [ ] No functionality is missing

### Touch/Mobile Testing

- [ ] Touch targets are at least 44x44 CSS pixels (WCAG 2.5.5 Level AAA, recommended)
- [ ] Interactive elements have adequate spacing to prevent accidental activation
- [ ] Gestures have keyboard/pointer alternatives (WCAG 2.5.1)
- [ ] Orientation works in both portrait and landscape (WCAG 1.3.4)

### WCAG Compliance

- [ ] Cite specific WCAG criteria met
- [ ] Verify Level A requirements
- [ ] Verify Level AA requirements
- [ ] Document any limitations

## Reference Usage

### When to Read WCAG Reference

- Before creating pages and components
- Understanding requirements
- Explaining WHY something is needed
- Audit or review requests

### When to Read APG Reference

- Before implementing ANY component
- User mentions specific pattern (tabs, accordion, etc.)
- Keyboard interaction questions
- ARIA attribute questions
- Implementation best practices

### Always Read Before Coding

Never start implementing accessibility without first reading the relevant reference sections. The patterns are comprehensive and tested - following them ensures correct implementation.

## Examples

### Example: Design or prompt affords creation of a Menu

**Process:**

1. Read [references/aria-apg-patterns/menu-and-menubar.md](references/aria-apg-patterns/menu-and-menubar.md)
2. Note keyboard requirements (Arrow keys, Enter, Escape)
3. Note ARIA requirements (role="menu", role="menuitem", aria-haspopup, aria-expanded)
4. Implement complete pattern with all requirements
5. Explain WCAG criteria: 2.1.1 (Keyboard), 4.1.2 (Name, Role, Value)
6. Provide testing steps

### Example: Design or prompt affords creation of a Form

**Process:**

1. Read [references/form-validation.md](references/form-validation.md) for ARIA wiring, message role mapping, validation timing, and the complete form validation cycle
2. Read WCAG 3.3.1 (Error Identification), 3.3.2 (Labels), 3.3.3 (Error Suggestion), and other Error-related criteria
3. Implement proper labels (for/id association)
4. Wire `aria-invalid`, `aria-describedby`, and message containers per the form-validation reference
5. Choose `role="alert"` vs `role="status"` based on urgency, not visual style
6. Add required field indicators with `aria-required`
7. Move focus to the first invalid field on submit
8. Explain each feature and cite WCAG criteria

## Critical Reminders

1. **Always read reference files BEFORE coding**
2. **Implement ALL keyboard interactions from APG, not just some**
3. **Include ALL required ARIA attributes from APG**
4. **Test with keyboard before claiming it's accessible**
5. **Cite specific WCAG criteria when explaining requirements**
6. **Provide complete, production-ready code**
7. **Never compromise keyboard accessibility**
8. **Focus management is not optional**

## Success Indicators

You've done well when:

- Code includes all APG-specified keyboard interactions
- Code includes all required ARIA attributes
- WCAG criteria are specifically cited
- Testing instructions are provided
- Code is production-ready, not just examples
- Screen reader experience is described
- Focus management is correct
