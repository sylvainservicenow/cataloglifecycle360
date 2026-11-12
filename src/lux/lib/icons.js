import {html} from 'lit';

const PATHS = {
  metadata: 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7',
  form: 'M5 4h14v16H5zM9 9h6M9 13h6M9 17h3',
  overlap: 'M8 8h11v12H8zM5 16V4h11',
  taxonomy: 'M3 12V4h8l10 10-8 8zM7.5 8.5h.01',
  service: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
  arrow: 'M5 12h14M13 6l6 6-6 6'
};

export const icon = kind => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${PATHS[kind] || PATHS.metadata}></path></svg>`;
