# Alert Dialog

## Pattern Usage

An alert dialog is a modal dialog that interrupts the user's workflow to communicate an important message and acquire a response. Examples include action confirmation prompts and error message confirmations. The `alertdialog` role enables assistive technologies and browsers to distinguish alert dialogs from other dialogs so they have the option of giving alert dialogs special treatment, such as playing a system alert sound.

## Keyboard Interaction

| Key           | Function                                                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tab`         | Moves focus to the next tabbable element inside the dialog. If focus is on the last tabbable element inside the dialog, moves focus to the first tabbable element inside the dialog.     |
| `Shift + Tab` | Moves focus to the previous tabbable element inside the dialog. If focus is on the first tabbable element inside the dialog, moves focus to the last tabbable element inside the dialog. |
| `Escape`      | Closes the dialog.                                                                                                                                                                       |

**Focus Management:**

- When the dialog opens, focus moves to an element inside the dialog. The element that receives focus depends on the nature and size of the content:
  - If the dialog content includes semantic structures (lists, tables, paragraphs) that need to be perceived to understand the content, set `tabindex="-1"` on a static element at the start of the content and set focus on that element.
  - If content is simple and can easily be understood when announced as a string, focus may be set on the first interactive element.
  - If the dialog asks the user to confirm or cancel an action, focus may be set on the least destructive action (e.g., "Cancel" rather than "Delete").
- When the dialog closes, focus returns to the element that invoked the dialog unless that element no longer exists or the workflow design dictates otherwise.

## WAI-ARIA Roles, States, and Properties

| Requirement                         | Implementation                                                                                                                                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alert dialog role                   | The element that contains all elements of the dialog, including the alert message and any dialog buttons, has role `alertdialog`.                                                                               |
| Modal attribute                     | The element with role `alertdialog` has `aria-modal` set to `true`.                                                                                                                                             |
| Accessible name                     | The `alertdialog` has an accessible name provided by either `aria-labelledby` (referencing visible title) or `aria-label`.                                                                                      |
| Accessible description _(Optional)_ | Optionally, `aria-describedby` is set on the element with role `alertdialog` to indicate which element or elements in the dialog contain content describing the primary purpose or message of the alert dialog. |
