# Link

## Pattern Usage

A link widget provides an interactive reference to a resource. The target resource can be external (different page) or internal (anchor within the same page). Authors are strongly encouraged to use native HTML `<a>` elements with `href` attributes rather than ARIA link role.

## Keyboard Interaction

| Key     | Function                                                 |
| ------- | -------------------------------------------------------- |
| `Enter` | Activates the link and navigates to the target resource. |

**Note:** Unlike buttons, links are not activated by `Space`.

## WAI-ARIA Roles, States, and Properties

| Requirement              | Implementation                                                                    |
| ------------------------ | --------------------------------------------------------------------------------- |
| Link role                | Element has role `link`. Native `<a href="...">` has this implicitly.             |
| Accessible name          | Link has accessible name provided by content, `aria-labelledby`, or `aria-label`. |
| Focusable                | Element is focusable. For custom links, add `tabindex="0"`.                       |
| Description _(Optional)_ | If additional description exists, `aria-describedby` references it.               |

**Link vs. Button:**

| Use Link When                        | Use Button When      |
| ------------------------------------ | -------------------- |
| Navigation to a new page or location | Triggering an action |
| Changing the URL                     | Submitting a form    |
| Opening a new tab/window             | Opening a dialog     |
| Downloading a file                   | Toggling a state     |
