# Breadcrumb

## Pattern Usage

A breadcrumb trail consists of a list of links to the parent pages of the current page in hierarchical order. It helps users find their place within a website or web application. Breadcrumbs are often placed horizontally before a page's main content.

## Keyboard Interaction

Not applicable—breadcrumbs contain standard links that follow the link keyboard pattern. Users navigate between links using `Tab` and activate them with `Enter`.

## WAI-ARIA Roles, States, and Properties

| Requirement            | Implementation                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Navigation landmark    | Breadcrumb trail is contained within a navigation landmark region (use `<nav>` element or `role="navigation"`).                                        |
| Accessible name        | The landmark region is labelled via `aria-label` or `aria-labelledby` (e.g., `aria-label="Breadcrumb"`).                                               |
| Current page indicator | The link to the current page has `aria-current` set to `page`. If the element representing the current page is not a link, `aria-current` is optional. |
| List structure         | Use an ordered list (`<ol>`) to represent the hierarchical structure, enabling assistive technologies to announce the number of items.                 |
| Visual separators      | Add separators between items via CSS rather than inline text to prevent screen readers from announcing them.                                           |

---

## Forced Colors Requirements

### Breadcrumbs

```css
@media (forced-colors: active) {
  .breadcrumb-nav {
    forced-color-adjust: none;
  }

  /* ========================================
     LINK STATES
     ======================================== */
  .breadcrumb-link {
    color: LinkText;
  }

  .breadcrumb-link:visited {
    color: VisitedText;
  }

  .breadcrumb-link:hover {
    color: LinkText;
    text-decoration: underline;
  }

  .breadcrumb-link:focus,
  .breadcrumb-link:focus-visible {
    color: LinkText;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .breadcrumb-link:active {
    color: ActiveText;
  }

  /* ========================================
     CURRENT PAGE
     ======================================== */
  .breadcrumb-link[aria-current='page'] {
    color: CanvasText;
    text-decoration: none;
  }

  /* ========================================
     SEPARATOR
     ======================================== */
  .breadcrumb-separator {
    color: CanvasText;
  }
}
```
