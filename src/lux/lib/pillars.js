import {css} from 'lit';
import {i18n} from '@servicenow/aiux/aiux-services';
import {exploreLink} from './app-state.js';

/** The three pillars of the lifecycle and where each one lives. One definition, used by Home and every pillar page. */
export const PILLARS = [
  {
    id: 'understand',
    page: 'explore',
    tone: '#2f6fed',
    tint: '#f1f6ff',
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z',
    path: () => exploreLink({lens: 'overview'}),
    title: () => i18n.getMessage('Understand'),
    verb: () => i18n.getMessage('See what exists'),
    text: () => i18n.getMessage('Explore the living universe of items, categories and services. See health, demand, look-alikes and gaps.'),
    cta: () => i18n.getMessage('Explore the catalog')
  },
  {
    id: 'grow',
    page: 'grow',
    tone: '#12894a',
    tint: '#effaf3',
    icon: 'M12 20V10M12 10C12 6 9 4 5 4c0 4 2 6 7 6zM12 13c0-3 2.5-5 7-5 0 3.5-2 5-7 5z',
    path: () => '/grow',
    title: () => i18n.getMessage('Grow'),
    verb: () => i18n.getMessage('Create what is missing'),
    text: () => i18n.getMessage('Turn a service owner’s idea and documents into a governed draft item, with duplicate checks and human review.'),
    cta: () => i18n.getMessage('Open the Assembly Line'),
    badge: () => i18n.getMessage('Simulated demo')
  },
  {
    id: 'improve',
    page: 'improve',
    tone: '#6b3fd4',
    tint: '#f6f2ff',
    icon: 'M4 18l5-5 4 4 7-9M15 8h5v5',
    path: () => '/improve',
    title: () => i18n.getMessage('Improve'),
    verb: () => i18n.getMessage('Make it better'),
    text: () => i18n.getMessage('Fix metadata, forms, categories, duplicates and service links, with AI proposals you review before anything is saved.'),
    cta: () => i18n.getMessage('Find improvements')
  }
];

/** Shared look of the pillar entry cards (Home) and the pillar page headers. */
export const pillarStyles = css`
  .pillars {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  @container (max-width: 900px) {
    .pillars {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  a.pillar {
    --tone: #2f6fed;
    --tint: #f1f6ff;
    position: relative;
    display: grid;
    gap: 6px;
    padding: 18px 20px;
    border-radius: 1.4rem;
    border: 1px solid color-mix(in srgb, var(--tone) 22%, #ffffff);
    background: linear-gradient(155deg, var(--tint), #ffffff 80%);
    box-shadow: 0 1px 3px rgba(3, 45, 66, 0.06);
    color: #1b1b1b;
    text-decoration: none;
    overflow: hidden;
    min-width: 0;
    transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
  }
  a.pillar:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 30px rgba(3, 45, 66, 0.15);
    border-color: color-mix(in srgb, var(--tone) 55%, #ffffff);
  }
  a.pillar:focus-visible {
    outline: 3px solid #2f6fed;
    outline-offset: 2px;
  }
  .pillar .p-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pillar .p-ico {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 12px;
    color: #fff;
    background: var(--tone);
    flex: none;
  }
  .pillar .p-ico svg {
    width: 21px;
    height: 21px;
  }
  .pillar .p-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--tone);
  }
  .pillar .p-verb {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #4d4c4a;
  }
  .pillar p {
    margin: 0;
    font-size: 0.88rem;
    line-height: 1.45;
    color: #3b3a38;
  }
  .pillar .p-cta {
    font-size: 0.86rem;
    font-weight: 700;
    color: var(--tone);
  }
  .pillar .p-badge {
    margin-left: auto;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8a5300;
    background: #fff1d6;
    border: 1px solid #f1cf8b;
  }
  @media (prefers-reduced-motion: reduce) {
    a.pillar,
    a.pillar:hover {
      transition: none;
      transform: none;
    }
  }
`;
