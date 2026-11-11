# Feed

## Pattern Usage

A feed is a section of a page that automatically loads new sections of content as the user scrolls. It enables screen reader users to use browse mode reading commands to move through the stream of rich content. Feed content is typically presented as a list of articles.

## Keyboard Interaction

| Key           | Function                                                   |
| ------------- | ---------------------------------------------------------- |
| `Page Down`   | Move focus to next article.                                |
| `Page Up`     | Move focus to previous article.                            |
| `Ctrl + End`  | Move focus to the first focusable element after the feed.  |
| `Ctrl + Home` | Move focus to the first focusable element before the feed. |

**Note:** These keys are recommendations. Due to variability in assistive technology support, authors should provide documentation about keyboard commands available in their feed implementation.

## WAI-ARIA Roles, States, and Properties

| Requirement                         | Implementation                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Feed role                           | The container element has role `feed`.                                                                                         |
| Article role                        | Each content unit has role `article`.                                                                                          |
| Accessible name                     | Each article has `aria-labelledby` referencing its title or `aria-label`. The feed itself should also have an accessible name. |
| Accessible description _(Optional)_ | Each article may have `aria-describedby` referencing primary content.                                                          |
| Position info                       | Each article has `aria-posinset` (position) and `aria-setsize` (total count). If total is unknown, set `aria-setsize="-1"`.    |
| Busy state                          | While loading new content, the feed has `aria-busy="true"`.                                                                    |
