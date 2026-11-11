# Landmarks

## Pattern Usage

Landmarks are a set of eight roles that identify the major sections of a page. They enable assistive technology users to understand page structure and navigate directly to page regions.

## Landmark Roles

| Role            | HTML Element             | Purpose                                                                                                       |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `banner`        | `<header>` (top-level)   | Site-oriented content at the beginning of the page (logo, search, navigation). Typically one per page.        |
| `complementary` | `<aside>`                | Supporting content related to main content but meaningful on its own.                                         |
| `contentinfo`   | `<footer>` (top-level)   | Information about the parent document (copyright, privacy, accessibility statements). Typically one per page. |
| `form`          | `<form>` (when named)    | Region containing form controls. Only becomes a landmark when it has an accessible name.                      |
| `main`          | `<main>`                 | Primary content of the document. Only one per page.                                                           |
| `navigation`    | `<nav>`                  | Groups of links for navigating the document or related documents.                                             |
| `region`        | `<section>` (when named) | Perceivable section with no more specific role. Only becomes a landmark when it has an accessible name.       |
| `search`        | `<search>`               | Section containing search functionality.                                                                      |

## Keyboard Interaction

Screen readers typically provide shortcut keys to navigate between landmarks:

- JAWS: `R` or `;` to move between regions/landmarks
- NVDA: `D` to move between landmarks
- VoiceOver: Rotor (landmarks section)

## Best Practices

| Practice                 | Guidance                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Use native HTML          | Prefer semantic HTML elements (`<main>`, `<nav>`, `<header>`, etc.) over ARIA roles when possible.                               |
| Name duplicates          | If multiple landmarks of the same type exist, give each a unique accessible name (e.g., "Main navigation", "Footer navigation"). |
| All content in landmarks | Ideally, all perceivable content should be contained in a landmark.                                                              |
| Nesting rules            | Don't nest `banner` in other landmarks except `region`. Same for `contentinfo`.                                                  |
| One main                 | Only use one `main` landmark per page.                                                                                           |
