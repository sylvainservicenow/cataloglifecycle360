# Disclosure

## Pattern Usage

A disclosure is a widget that enables content to be either collapsed (hidden) or expanded (visible). It consists of a disclosure button that controls visibility of a section of content. Often used for FAQ sections, "show more/less" features, or collapsible navigation menus.

## Keyboard Interaction

| Key     | Function                                                             |
| ------- | -------------------------------------------------------------------- |
| `Enter` | Activates the disclosure button, toggling visibility of the content. |
| `Space` | Activates the disclosure button, toggling visibility of the content. |

## WAI-ARIA Roles, States, and Properties

| Requirement                     | Implementation                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| Button role                     | The element that shows/hides content has role `button`. Use native `<button>` element. |
| Expanded state                  | When content is visible, `aria-expanded="true"`. When hidden, `aria-expanded="false"`. |
| Controls reference _(Optional)_ | `aria-controls` references the ID of the controlled content element.                   |
| Accessible name                 | The disclosure button has an accessible name that describes what content it controls.  |

**Best Practice:** Use the native HTML `<details>` and `<summary>` elements when possible, as they provide built-in disclosure behavior.
