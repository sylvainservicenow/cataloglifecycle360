import {html, css, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';
import {loadCatalog} from '../lib/catalog-data.js';
import {loadServiceData} from '../lib/investigations/csdm.js';
import {exploreLink} from '../lib/app-state.js';
import {createAssemblyLine, STAGE_IDS, APPROVAL_STEP, STANDARD_VARIABLES} from '../lib/grow/assembly-line.js';
import {DEMO_INTAKE, STAGES} from '../lib/grow/scenario.js';

const PATHS = {
  requirements: 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5',
  duplicates: 'M8 8h11v12H8zM5 16V4h11',
  draft: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
  governance: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5',
  review: 'M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  warning: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
  upload: 'M12 16V4M7 9l5-5 5 5M5 20h14',
  doc: 'M6 3h9l4 4v14H6zM14 3v5h5',
  x: 'M6 6l12 12M18 6L6 18',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 8.5h.01',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.5-6 8-6s8 2 8 6',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2.2.3-1.3-1.8.4-2.2-3-1-1 2h-2l-1-2-3 1 .4 2.2L6 8.3 3.8 8l-1 3 2 1v0l-2 1 1 3 2.2-.3 1.3 1.8-.4 2.2 3 1 1-2h2l1 2 3-1-.4-2.2 1.3-1.8 2.2.3 1-3z',
  clock: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'
};
const ic = k => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${PATHS[k] || PATHS.spark}></path></svg>`;

const BLANK = {title: '', description: '', owner: '', type: 'item', audience: 'All employees', files: []};
const AUDIENCES = ['All employees', 'Managers', 'IT staff', 'Contractors'];
const kb = n => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/**
 * The Grow workspace: overview, intake, the animated Assembly Line, and a draft the person can shape and review.
 * Everything here is local. The Assembly Line itself is a SIMULATION behind lib/grow/assembly-line.js, and the only
 * live data is the read-only catalog the app already loads. No catalog record is ever created or changed.
 */
@customElement('cat-grow')
export default class CatGrow extends AIUXElement {
  static properties = {
    _phase: {state: true},
    _intake: {state: true},
    _stages: {state: true},
    _proposal: {state: true},
    _tab: {state: true},
    _model: {state: true},
    _services: {state: true},
    _queue: {state: true},
    _drag: {state: true},
    _edits: {state: true},
    _vars: {state: true},
    _sets: {state: true},
    _approval: {state: true},
    _resolved: {state: true},
    _category: {state: true},
    _dupChoice: {state: true},
    _comment: {state: true},
    _decision: {state: true},
    _busy: {state: true},
    _log: {state: true},
    _say: {state: true}
  };

  static styles = css`
    :host {
      display: block;
      min-width: 0;
      container-type: inline-size;
      --grow: #12894a;
      --grow-deep: #0b5e33;
      --grow-tint: #effaf3;
      --ink: #032d42;
      --muted: #4d4c4a;
      --blue: #2f6fed;
    }
    * {
      box-sizing: border-box;
    }
    h1,
    h2,
    h3,
    p {
      margin: 0;
    }
    svg {
      width: 18px;
      height: 18px;
      flex: none;
    }
    button,
    input,
    select,
    textarea {
      font: inherit;
    }
    :focus-visible {
      outline: 3px solid var(--blue);
      outline-offset: 2px;
    }
    .vh {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
    .stack {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .sec {
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    /* clearly labelled simulation / live markers */
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .tag.sim {
      color: #8a5300;
      background: #fff1d6;
      border: 1px solid #f1cf8b;
    }
    .tag.live {
      color: #0b5e33;
      background: #dcf5e6;
      border: 1px solid #a8dfbf;
    }
    .notice {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 1rem;
      font-size: 0.84rem;
      line-height: 1.4;
      color: #5e3b00;
      background: #fff8e8;
      border: 1px solid #f1cf8b;
    }
    .notice svg {
      margin-top: 1px;
      color: #b36b00;
    }
    /* buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 40px;
      padding: 0 1.1rem;
      border-radius: 999px;
      border: 1px solid rgba(3, 45, 66, 0.18);
      background: #fff;
      color: var(--ink);
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    }
    .btn:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(3, 45, 66, 0.14);
    }
    .btn.primary {
      color: #fff;
      border-color: transparent;
      background: linear-gradient(135deg, var(--grow-deep), var(--grow));
    }
    .btn.danger {
      color: #a3262a;
      border-color: #f0b4b6;
      background: #fff5f5;
    }
    .btn.ghost {
      border-color: transparent;
      background: transparent;
      color: var(--blue);
      padding: 0 0.6rem;
    }
    .btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn.sm {
      min-height: 32px;
      padding: 0 0.8rem;
      font-size: 0.8rem;
    }
    a.link {
      color: var(--blue);
      font-weight: 700;
      text-decoration: none;
      font-size: 0.84rem;
    }
    a.link:hover {
      text-decoration: underline;
    }
    /* hero */
    .hero {
      position: relative;
      display: grid;
      gap: 10px;
      padding: 26px 30px;
      border-radius: 1.75rem;
      overflow: hidden;
      color: #fff;
      background: linear-gradient(125deg, #07402a 0%, #12894a 58%, #2f9bb3 130%);
      box-shadow: 0 14px 34px rgba(11, 94, 51, 0.28);
    }
    .hero::after {
      content: '';
      position: absolute;
      right: -70px;
      top: -90px;
      width: 320px;
      height: 320px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0) 70%);
      pointer-events: none;
    }
    .hero .eyebrow {
      font-family: ui-monospace, monospace;
      font-size: 0.74rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.85;
    }
    .hero h1 {
      font-size: clamp(1.5rem, 3.2vw, 2.2rem);
      line-height: 1.15;
      max-width: 22ch;
    }
    .hero p {
      max-width: 62ch;
      color: rgba(255, 255, 255, 0.92);
      line-height: 1.5;
    }
    .hero .row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 6px;
      position: relative;
      z-index: 1;
    }
    .hero .btn {
      border-color: transparent;
    }
    .hero .btn.solid {
      background: #fff;
      color: var(--grow-deep);
    }
    .hero .btn.outline {
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.5);
    }
    .hero :focus-visible {
      outline-color: #fff;
    }
    /* assembly line rail */
    .rail {
      position: relative;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0;
      padding: 18px 12px 14px;
      border-radius: 1.5rem;
      background: #fff;
      border: 1px solid rgba(3, 45, 66, 0.1);
      box-shadow: 0 2px 8px rgba(3, 45, 66, 0.06);
      list-style: none;
      margin: 0;
    }
    .stage {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 6px;
      padding: 0 6px;
      text-align: center;
      min-width: 0;
    }
    .stage:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 25px;
      left: calc(50% + 30px);
      width: calc(100% - 60px);
      height: 4px;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--grow), var(--grow)) no-repeat #e3e8ee;
      background-size: 0% 100%;
      transition: background-size 0.7s ease;
    }
    .stage.done:not(:last-child)::after,
    .stage.attention:not(:last-child)::after {
      background-size: 100% 100%;
    }
    .stage.running:not(:last-child)::after {
      background-image: linear-gradient(90deg, #e3e8ee 0%, var(--grow) 50%, #e3e8ee 100%);
      background-size: 200% 100%;
      animation: flow 1.1s linear infinite;
    }
    @keyframes flow {
      from {
        background-position: 200% 0;
      }
      to {
        background-position: -100% 0;
      }
    }
    .node {
      position: relative;
      z-index: 1;
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border-radius: 18px;
      border: 2px solid #d2dae3;
      background: #fff;
      color: #6b7886;
      cursor: default;
      transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease, color 0.25s ease;
    }
    .node svg {
      width: 24px;
      height: 24px;
    }
    button.node {
      cursor: pointer;
    }
    button.node:hover {
      transform: translateY(-3px);
    }
    .stage.running .node {
      color: var(--grow);
      border-color: var(--grow);
      box-shadow: 0 0 0 6px rgba(18, 137, 74, 0.16);
      animation: pulse 1.3s ease-in-out infinite;
    }
    @keyframes pulse {
      50% {
        box-shadow: 0 0 0 11px rgba(18, 137, 74, 0.04);
        transform: scale(1.06);
      }
    }
    .stage.done .node {
      color: #fff;
      border-color: var(--grow);
      background: var(--grow);
    }
    .stage.attention .node {
      color: #fff;
      border-color: #d9820b;
      background: #d9820b;
    }
    .stage.sel .node {
      outline: 3px solid var(--blue);
      outline-offset: 3px;
    }
    .stage .s-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--ink);
    }
    .stage .s-sub {
      font-size: 0.72rem;
      color: var(--muted);
      line-height: 1.3;
    }
    @container (max-width: 720px) {
      .rail {
        grid-template-columns: minmax(0, 1fr);
        gap: 10px;
      }
      .stage {
        grid-template-columns: 52px 1fr;
        justify-items: start;
        text-align: left;
        column-gap: 12px;
      }
      .stage:not(:last-child)::after {
        display: none;
      }
      .stage .s-tags {
        grid-column: 2;
      }
    }
    /* cards & grids */
    .card {
      padding: 18px 20px;
      border-radius: 1.4rem;
      background: #fff;
      border: 1px solid rgba(3, 45, 66, 0.1);
      box-shadow: 0 1px 3px rgba(3, 45, 66, 0.05);
      min-width: 0;
    }
    .card h2,
    .card h3 {
      font-size: 1rem;
      color: var(--ink);
    }
    .card-head {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .card-head .grow {
      flex: 1;
    }
    .signals {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    @container (max-width: 820px) {
      .signals {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    .signal {
      display: grid;
      gap: 4px;
      align-content: start;
      padding: 16px 18px;
      border-radius: 1.4rem;
      border: 1px solid #cfe9d9;
      background: linear-gradient(155deg, var(--grow-tint), #fff 75%);
      color: inherit;
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    a.signal:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 26px rgba(3, 45, 66, 0.14);
    }
    .signal .num {
      font-size: 2.2rem;
      font-weight: 700;
      line-height: 1.05;
      color: var(--grow);
      font-variant-numeric: tabular-nums;
    }
    .signal .lab {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: center;
    }
    .signal .txt {
      font-size: 0.85rem;
      color: #3b3a38;
      line-height: 1.4;
    }
    .queue {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
    }
    .qrow {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 14px;
      padding: 12px 14px;
      border-radius: 1.1rem;
      border: 1px solid rgba(3, 45, 66, 0.1);
      background: #fafcfb;
    }
    .qrow .id {
      font-family: ui-monospace, monospace;
      font-size: 0.74rem;
      color: var(--muted);
    }
    .qrow .t {
      font-weight: 700;
      color: var(--ink);
    }
    .qrow .m {
      font-size: 0.8rem;
      color: var(--muted);
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 0.74rem;
      font-weight: 700;
      background: #eef2f7;
      color: #36495a;
    }
    .chip.ok {
      background: #dcf5e6;
      color: #0b5e33;
    }
    .chip.warn {
      background: #fff1d6;
      color: #8a5300;
    }
    .chip.bad {
      background: #fde4e4;
      color: #a3262a;
    }
    .chip.blue {
      background: #e3edff;
      color: #1d4fb8;
    }
    @container (max-width: 640px) {
      .qrow {
        grid-template-columns: 1fr;
      }
    }
    /* intake */
    .two {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
      gap: 16px;
      align-items: start;
    }
    @container (max-width: 900px) {
      .two {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    .field {
      display: grid;
      gap: 5px;
      margin-bottom: 14px;
    }
    .field label,
    .field .lbl {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--ink);
    }
    .field small {
      color: var(--muted);
      font-size: 0.76rem;
    }
    .field input[type='text'],
    .field textarea,
    .field select {
      width: 100%;
      min-height: 42px;
      padding: 0.55rem 0.85rem;
      border-radius: 0.9rem;
      border: 1px solid rgba(3, 45, 66, 0.2);
      background: #fff;
      color: #1b1b1b;
    }
    .field textarea {
      min-height: 130px;
      resize: vertical;
      line-height: 1.45;
    }
    .seg {
      display: inline-flex;
      gap: 2px;
      padding: 3px;
      border-radius: 999px;
      background: rgba(3, 45, 66, 0.07);
      flex-wrap: wrap;
    }
    .seg button {
      border: 0;
      background: transparent;
      border-radius: 999px;
      padding: 0.4rem 1rem;
      font-weight: 600;
      font-size: 0.84rem;
      cursor: pointer;
      color: var(--muted);
    }
    .seg button[aria-pressed='true'] {
      background: #fff;
      color: var(--ink);
      box-shadow: 0 1px 4px rgba(3, 45, 66, 0.2);
    }
    .drop {
      display: grid;
      justify-items: center;
      gap: 6px;
      padding: 26px 18px;
      text-align: center;
      border-radius: 1.4rem;
      border: 2px dashed #9fcdb2;
      background: var(--grow-tint);
      color: #1c4f34;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .drop.over {
      background: #d7f3e2;
      border-color: var(--grow);
    }
    .drop svg {
      width: 30px;
      height: 30px;
      color: var(--grow);
    }
    .files {
      list-style: none;
      padding: 0;
      margin: 10px 0 0;
      display: grid;
      gap: 8px;
    }
    .file {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 0.9rem;
      border: 1px solid rgba(3, 45, 66, 0.12);
      background: #fff;
      font-size: 0.85rem;
    }
    .file .n {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 600;
    }
    .file button {
      border: 0;
      background: transparent;
      cursor: pointer;
      color: var(--muted);
      display: grid;
      place-items: center;
      padding: 4px;
      border-radius: 8px;
    }
    .cu {
      margin-top: 14px;
      padding: 14px 16px;
      border-radius: 1.2rem;
      border: 1px dashed #b9c6d4;
      background: #f7f9fc;
      font-size: 0.84rem;
      color: #3b3a38;
      line-height: 1.45;
    }
    .cu b {
      color: var(--ink);
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      margin-top: 6px;
    }
    /* running */
    .running-log {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    .running-log li {
      display: flex;
      gap: 10px;
      align-items: center;
      font-size: 0.9rem;
      padding: 10px 14px;
      border-radius: 1rem;
      background: #fff;
      border: 1px solid rgba(3, 45, 66, 0.1);
      animation: rise 0.4s ease both;
    }
    .running-log li svg {
      color: var(--grow);
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
    .skeleton {
      height: 120px;
      border-radius: 1.4rem;
      background: linear-gradient(100deg, #e9eef3 30%, #f6f9fb 50%, #e9eef3 70%) 0 0 / 200% 100%;
      animation: shimmer 1.4s linear infinite;
    }
    @keyframes shimmer {
      to {
        background-position: -200% 0;
      }
    }
    /* draft */
    .workbench {
      display: grid;
      grid-template-columns: minmax(0, 1.5fr) minmax(300px, 1fr);
      gap: 16px;
      align-items: start;
    }
    @container (max-width: 980px) {
      .workbench {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    .aside {
      display: grid;
      gap: 16px;
      position: sticky;
      top: 8px;
    }
    @container (max-width: 980px) {
      .aside {
        position: static;
      }
    }
    .tabs {
      display: flex;
      gap: 2px;
      padding: 3px;
      border-radius: 999px;
      background: rgba(3, 45, 66, 0.07);
      overflow-x: auto;
      scrollbar-width: none;
      margin-bottom: 14px;
    }
    .tabs button {
      border: 0;
      background: transparent;
      border-radius: 999px;
      padding: 0.45rem 1rem;
      font-weight: 600;
      font-size: 0.84rem;
      cursor: pointer;
      color: var(--muted);
      white-space: nowrap;
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }
    .tabs button[aria-selected='true'] {
      background: #fff;
      color: var(--ink);
      box-shadow: 0 1px 4px rgba(3, 45, 66, 0.2);
    }
    .badge-n {
      min-width: 18px;
      padding: 0 5px;
      border-radius: 999px;
      font-size: 0.7rem;
      line-height: 18px;
      color: #fff;
      background: #d9820b;
      text-align: center;
    }
    .kv {
      display: grid;
      gap: 3px;
      margin-bottom: 14px;
    }
    .kv .k {
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .kv .v {
      font-size: 0.95rem;
      color: #1b1b1b;
      line-height: 1.5;
    }
    .kv .v.big {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ink);
    }
    .opts {
      display: grid;
      gap: 8px;
    }
    .opt {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      text-align: left;
      padding: 10px 14px;
      border-radius: 1rem;
      border: 1px solid rgba(3, 45, 66, 0.14);
      background: #fff;
      cursor: pointer;
    }
    .opt[aria-pressed='true'] {
      border-color: var(--grow);
      background: var(--grow-tint);
      box-shadow: inset 4px 0 0 var(--grow);
    }
    .opt .o-main {
      flex: 1;
      min-width: 0;
    }
    .opt .o-sub {
      display: block;
      font-size: 0.78rem;
      color: var(--muted);
    }
    .req {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 8px;
    }
    .req li {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 10px;
      font-size: 0.88rem;
      line-height: 1.4;
    }
    .req li svg {
      color: var(--grow);
      margin-top: 2px;
    }
    .req .src {
      color: var(--muted);
      font-size: 0.76rem;
    }
    .vars {
      display: grid;
      gap: 8px;
    }
    .vgroup {
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--grow-deep);
      margin-top: 6px;
    }
    .var {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 10px 14px;
      border-radius: 1rem;
      border: 1px solid rgba(3, 45, 66, 0.12);
      background: #fff;
    }
    .var.off {
      opacity: 0.55;
      background: #f6f8fa;
    }
    .var .vn {
      font-weight: 700;
      color: var(--ink);
      font-size: 0.9rem;
    }
    .var .vm {
      font-size: 0.78rem;
      color: var(--muted);
    }
    .var .ctrl {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.78rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .var .ctrl label {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
    }
    .flow {
      list-style: none;
      margin: 0;
      padding: 0 0 0 4px;
      display: grid;
      gap: 0;
    }
    .step {
      position: relative;
      display: grid;
      grid-template-columns: 40px 1fr;
      gap: 12px;
      padding-bottom: 16px;
      animation: rise 0.4s ease both;
    }
    .step:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 19px;
      top: 40px;
      bottom: 0;
      width: 2px;
      background: #d6dee6;
    }
    .step .dot {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 14px;
      color: #fff;
      background: #5b7186;
    }
    .step.approval .dot {
      background: #d9820b;
    }
    .step.start .dot,
    .step.end .dot {
      background: var(--grow);
    }
    .step.auto .dot {
      background: var(--blue);
    }
    .step b {
      display: block;
      color: var(--ink);
    }
    .step span.d {
      font-size: 0.84rem;
      color: #3b3a38;
    }
    .finding {
      display: grid;
      gap: 6px;
      padding: 14px 16px;
      border-radius: 1.2rem;
      border: 1px solid rgba(3, 45, 66, 0.12);
      background: #fff;
      border-left: 5px solid #8ea0b2;
    }
    .finding.high {
      border-left-color: #d6383d;
    }
    .finding.medium {
      border-left-color: #d9820b;
    }
    .finding.low {
      border-left-color: var(--blue);
    }
    .finding.done {
      background: #f4faf6;
      border-left-color: var(--grow);
    }
    .finding .top {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .finding .rule {
      font-weight: 700;
      color: var(--ink);
    }
    .finding p {
      font-size: 0.86rem;
      line-height: 1.45;
      color: #3b3a38;
    }
    .finding .kbref {
      font-size: 0.74rem;
      color: var(--muted);
      font-family: ui-monospace, monospace;
    }
    .finding .fix {
      font-size: 0.82rem;
      padding: 8px 12px;
      border-radius: 0.8rem;
      background: #f3f6fa;
      color: #1b1b1b;
    }
    .score {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.76rem;
      color: var(--muted);
    }
    .bar {
      flex: 1;
      height: 8px;
      border-radius: 8px;
      background: #e3e8ee;
      overflow: hidden;
      min-width: 60px;
    }
    .bar i {
      display: block;
      height: 100%;
      border-radius: 8px;
      background: linear-gradient(90deg, #5fc58c, var(--grow));
    }
    .bar.warn i {
      background: linear-gradient(90deg, #f3b45c, #d9820b);
    }
    .verdict {
      padding: 12px 16px;
      border-radius: 1.1rem;
      font-size: 0.88rem;
      line-height: 1.45;
      margin-bottom: 12px;
      background: #eef7f1;
      border: 1px solid #bfe3cd;
      color: #12442b;
    }
    .verdict.warn {
      background: #fff6e4;
      border-color: #f1cf8b;
      color: #5e3b00;
    }
    .match {
      display: grid;
      gap: 6px;
      padding: 12px 14px;
      border-radius: 1.1rem;
      border: 1px solid rgba(3, 45, 66, 0.12);
      background: #fff;
    }
    .match .row {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
    .match .nm {
      font-weight: 700;
      color: var(--ink);
      flex: 1;
      min-width: 0;
    }
    .match .meta {
      font-size: 0.78rem;
      color: var(--muted);
    }
    /* portal preview */
    .portal {
      padding: 0;
      overflow: hidden;
    }
    .portal .p-top {
      display: flex;
      gap: 14px;
      padding: 18px 20px;
      background: linear-gradient(135deg, #032d42, #12586f);
      color: #fff;
      align-items: center;
    }
    .portal .p-ico {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border-radius: 16px;
      font-size: 1.4rem;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.18);
      flex: none;
    }
    .portal .p-name {
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }
    .portal .p-cat {
      font-size: 0.76rem;
      opacity: 0.8;
      margin-top: 2px;
    }
    .portal .p-body {
      padding: 14px 20px 18px;
      display: grid;
      gap: 10px;
    }
    .portal .p-desc {
      font-size: 0.84rem;
      color: #3b3a38;
      line-height: 1.45;
    }
    .pf {
      display: grid;
      gap: 3px;
    }
    .pf label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--ink);
    }
    .pf .star {
      color: #d6383d;
    }
    .pf input,
    .pf select,
    .pf textarea {
      width: 100%;
      min-height: 34px;
      padding: 0.35rem 0.7rem;
      border-radius: 0.7rem;
      border: 1px solid rgba(3, 45, 66, 0.18);
      background: #f7f9fb;
      color: #6b7886;
    }
    .pf textarea {
      min-height: 54px;
    }
    .pf.chk label {
      display: flex;
      gap: 8px;
      align-items: center;
      font-weight: 600;
    }
    .pf.chk input {
      width: auto;
      min-height: 0;
    }
    .p-foot {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
    /* review */
    .review textarea {
      width: 100%;
      min-height: 70px;
      padding: 0.55rem 0.8rem;
      border-radius: 0.9rem;
      border: 1px solid rgba(3, 45, 66, 0.2);
      margin: 6px 0 10px;
      resize: vertical;
    }
    .review .gate {
      font-size: 0.84rem;
      line-height: 1.4;
      margin-bottom: 8px;
    }
    .review .btns {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .outcome {
      display: grid;
      gap: 8px;
      padding: 14px 16px;
      border-radius: 1.2rem;
      font-size: 0.88rem;
      line-height: 1.45;
    }
    .outcome.approved {
      background: #eaf8f0;
      border: 1px solid #a8dfbf;
    }
    .outcome.changes {
      background: #fff6e4;
      border: 1px solid #f1cf8b;
    }
    .outcome.rejected {
      background: #fdecec;
      border: 1px solid #f0b4b6;
    }
    .timeline {
      list-style: none;
      margin: 8px 0 0;
      padding: 0;
      display: grid;
      gap: 6px;
      font-size: 0.78rem;
      color: #3b3a38;
    }
    .timeline time {
      font-family: ui-monospace, monospace;
      color: var(--muted);
      margin-right: 6px;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 16px;
      margin-top: 12px;
    }
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  constructor() {
    super();
    this._phase = 'overview';
    this._intake = {...BLANK, files: []};
    this._stages = this._freshStages();
    this._proposal = null;
    this._tab = 'overview';
    this._model = null;
    this._services = null;
    this._queue = [];
    this._drag = false;
    this._resetReview();
    this._log = [];
    this._say = '';
    this._line = null;
    this._base = '';
    this._busy = false;
    this._focusNext = false;
  }

  _freshStages() {
    return Object.fromEntries(STAGE_IDS.map(id => [id, 'idle']));
  }

  _resetReview() {
    this._edits = {};
    this._vars = {};
    this._sets = false;
    this._approval = false;
    this._resolved = {};
    this._category = null;
    this._dupChoice = '';
    this._comment = '';
    this._decision = null;
  }

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    const i = location.pathname.indexOf('/cataloglifecycle360');
    this._base = i >= 0 ? location.pathname.slice(0, i + '/cataloglifecycle360'.length) : '';
    loadCatalog()
      .then(async m => {
        this._model = m;
        this._services = await loadServiceData().catch(() => null);
        this._line = createAssemblyLine({model: m, services: this._services});
        this._queue = await this._line.listRequests();
      })
      .catch(() => (this._model = false));
  }

  updated() {
    if (this._focusNext) {
      this._focusNext = false;
      this.renderRoot.querySelector('#phase-h')?.focus();
    }
  }

  /* ---------- helpers ---------- */
  _href(path) {
    return `${this._base}${path}`;
  }

  _go(e, path) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    navigate(path);
  }

  _link(path, label) {
    return html`<a class="link" href=${this._href(path)} @click=${e => this._go(e, path)}>${label} →</a>`;
  }

  _phaseTo(phase) {
    this._phase = phase;
    this._focusNext = true;
  }

  _note(text) {
    this._log = [...this._log, {t: new Date(), text}];
  }

  _stageMeta() {
    return {
      requirements: {name: i18n.getMessage('Requirement analysis'), sub: i18n.getMessage('Reads the intake and attached documents')},
      duplicates: {name: i18n.getMessage('Duplicate detection'), sub: i18n.getMessage('Compares with your real catalog')},
      draft: {name: i18n.getMessage('Draft generation'), sub: i18n.getMessage('Assembles item, form and workflow')},
      governance: {name: i18n.getMessage('Governance'), sub: i18n.getMessage('Checks the knowledge base standards')},
      review: {name: i18n.getMessage('Human review'), sub: i18n.getMessage('A person approves or sends back')}
    };
  }

  /* ---------- journey ---------- */
  _newProposal() {
    this._intake = {...BLANK, files: []};
    this._resetReview();
    this._proposal = null;
    this._stages = this._freshStages();
    this._phaseTo('intake');
  }

  _openRequest(r) {
    this._intake = {...r.intake, files: r.intake.files.map(f => ({...f}))};
    this._resetReview();
    this._proposal = null;
    this._stages = this._freshStages();
    this._phaseTo('intake');
  }

  async _run() {
    if (!this._line || !this._intake.title.trim() || !this._intake.description.trim()) return;
    this._resetReview();
    this._proposal = null;
    this._stages = this._freshStages();
    this._log = [{t: new Date(), text: i18n.getMessage('Intake received from the service owner (simulated)')}];
    this._phaseTo('running');
    const names = this._stageMeta();
    const proposal = await this._line.analyse(this._intake, (id, status) => {
      this._stages = {...this._stages, [id]: status};
      if (status === 'running') this._say = i18n.getMessage('{0} is running', names[id].name);
      if (status !== 'running') this._note(i18n.getMessage('{0} finished', names[id].name));
    });
    this._proposal = proposal;
    this._category = proposal.draft.category?.id || null;
    this._tab = 'overview';
    this._say = i18n.getMessage('Draft ready for review');
    this._phaseTo('draft');
  }

  _addFiles(list) {
    const room = 5 - this._intake.files.length;
    const add = [...list].slice(0, Math.max(0, room)).map(f => ({name: f.name, size: f.size}));
    // only the name and size are read: nothing is uploaded or parsed in this preview
    this._intake = {...this._intake, files: [...this._intake.files, ...add]};
  }

  _set(key, value) {
    this._intake = {...this._intake, [key]: value};
  }

  /* ---------- draft state ---------- */
  _draftNow() {
    const d = this._proposal.draft;
    const vars = [];
    if (this._sets) STANDARD_VARIABLES.forEach(v => vars.push({...v, added: true}));
    d.variables.forEach(v => vars.push({...v}));
    vars.forEach(v => {
      const o = this._vars[v.id];
      v.include = o?.include ?? true;
      v.mandatory = o?.mandatory ?? v.mandatory;
    });
    const flow = d.workflow.map(s => ({...s}));
    if (this._approval) flow.splice(Math.max(1, flow.findIndex(s => s.id === 'w-check') + 1), 0, {...APPROVAL_STEP});
    const cat = d.categoryOptions.find(c => c.id === this._category);
    return {...d, name: this._edits.name ?? d.name, shortDescription: this._edits.shortDescription ?? d.shortDescription, variables: vars, workflow: flow, categoryNow: cat || null};
  }

  _applyFix(f) {
    const fx = f.fix;
    if (fx.type === 'rename') this._edits = {...this._edits, name: fx.value};
    else if (fx.type === 'shortDescription') this._edits = {...this._edits, shortDescription: fx.value};
    else if (fx.type === 'variableSet') this._sets = true;
    else if (fx.type === 'approval') this._approval = true;
    this._resolved = {...this._resolved, [f.id]: 'applied'};
    this._note(i18n.getMessage('Applied: {0}', f.rule));
    this._say = i18n.getMessage('{0} applied to the draft', f.rule);
  }

  _undoFix(f) {
    const fx = f.fix;
    const e = {...this._edits};
    if (fx.type === 'rename') delete e.name;
    else if (fx.type === 'shortDescription') delete e.shortDescription;
    else if (fx.type === 'variableSet') this._sets = false;
    else if (fx.type === 'approval') this._approval = false;
    this._edits = e;
    const r = {...this._resolved};
    delete r[f.id];
    this._resolved = r;
    this._note(i18n.getMessage('Reopened: {0}', f.rule));
  }

  _dismiss(f) {
    this._resolved = {...this._resolved, [f.id]: 'dismissed'};
    this._note(i18n.getMessage('Dismissed: {0}', f.rule));
  }

  _toggleVar(id, key, value) {
    this._vars = {...this._vars, [id]: {...this._vars[id], [key]: value}};
  }

  _openFindings() {
    return this._proposal.governance.findings.filter(f => !this._resolved[f.id]);
  }

  async _decide(outcome) {
    if (!this._line || this._busy) return;
    this._busy = true;
    const res = await this._line.submitDecision(this._proposal, {outcome, comment: this._comment});
    this._decision = {...res, comment: this._comment};
    this._stages = {...this._stages, review: outcome === 'approved' ? 'done' : 'attention'};
    this._note(outcome === 'approved' ? i18n.getMessage('Approved by reviewer (simulated)') : outcome === 'changes' ? i18n.getMessage('Changes requested (simulated)') : i18n.getMessage('Rejected by reviewer (simulated)'));
    this._say = i18n.getMessage('Decision recorded in the simulation. No catalog record was created.');
    this._busy = false;
  }

  _selectStage(id) {
    if (!this._proposal) return;
    const tab = STAGES.find(s => s.id === id)?.tab;
    if (this._phase !== 'draft') this._phase = 'draft';
    if (id === 'review') {
      const r = this.renderRoot.querySelector('#review');
      r?.scrollIntoView({block: 'center', behavior: 'smooth'});
      r?.focus({preventScroll: true});
    } else this._tab = tab;
  }

  /* ---------- renderers ---------- */
  _rail() {
    const meta = this._stageMeta();
    const current = STAGES.find(s => s.tab === this._tab && this._phase === 'draft')?.id;
    return html`<ol class="rail" aria-label=${i18n.getMessage('AI Catalog Assembly Line')}>
      ${STAGES.map(s => {
        const st = this._stages[s.id];
        const m = meta[s.id];
        const ready = !!this._proposal;
        const icon = st === 'done' ? 'check' : st === 'attention' ? 'warning' : s.id;
        const label = `${m.name}: ${st === 'idle' ? i18n.getMessage('waiting') : st === 'running' ? i18n.getMessage('running') : st === 'attention' ? i18n.getMessage('needs attention') : i18n.getMessage('done')}`;
        return html`<li class="stage ${st} ${current === s.id ? 'sel' : ''}">
          ${ready
            ? html`<button class="node" aria-label=${label} aria-current=${current === s.id ? 'step' : 'false'} @click=${() => this._selectStage(s.id)}>${ic(icon)}</button>`
            : html`<span class="node" role="img" aria-label=${label}>${ic(icon)}</span>`}
          <span class="s-name">${m.name}</span>
          <span class="s-sub">${m.sub}</span>
          <span class="s-tags">${s.live ? html`<span class="tag live">${i18n.getMessage('Live data')}</span>` : html`<span class="tag sim">${i18n.getMessage('Simulated')}</span>`}</span>
        </li>`;
      })}
    </ol>`;
  }

  _liveSignals() {
    const m = this._model;
    if (!m) return nothing;
    const f = n => new Intl.NumberFormat().format(n);
    const offerings = this._services?.offerings || [];
    const unserved = offerings.filter(o => !(this._services.byOffering.get(o.id)?.length > 0));
    const thin = m.clusters.filter(c => !c.uncategorised && c.items.length <= 2);
    const top = [...m.nodes].filter(n => n.active).sort((a, b) => b.requests - a.requests)[0];
    return html`<section class="stack" aria-labelledby="sig-h" style="gap:10px">
      <h2 id="sig-h" class="sec">${i18n.getMessage('Growth signals from your catalog')}</h2>
      <div class="signals">
        <a class="signal" href=${this._href(exploreLink({lens: 'csdm'}))} @click=${e => this._go(e, exploreLink({lens: 'csdm'}))}>
          <span class="lab">${i18n.getMessage('Services without an item')}<span class="tag live">${i18n.getMessage('Live')}</span></span>
          <span class="num">${this._services ? f(unserved.length) : '–'}</span>
          <span class="txt">${this._services ? i18n.getMessage('of {0} service offerings have no catalog item requesters can order.', f(offerings.length)) : i18n.getMessage('Service offerings are not readable right now.')}</span>
        </a>
        <a class="signal" href=${this._href(exploreLink({highlight: 'categories', lens: 'overview'}))} @click=${e => this._go(e, exploreLink({highlight: 'categories', lens: 'overview'}))}>
          <span class="lab">${i18n.getMessage('Thin categories')}<span class="tag live">${i18n.getMessage('Live')}</span></span>
          <span class="num">${f(thin.length)}</span>
          <span class="txt">${i18n.getMessage('of {0} categories in use hold two items or fewer, room to extend the offer.', f(m.stats.populatedCategories))}</span>
        </a>
        <a class="signal" href=${top ? this._href(exploreLink({item: top.id})) : '#'} @click=${e => top && this._go(e, exploreLink({item: top.id}))}>
          <span class="lab">${i18n.getMessage('Proven demand')}<span class="tag live">${i18n.getMessage('Live')}</span></span>
          <span class="num">${top ? f(top.requests) : '–'}</span>
          <span class="txt">${top ? i18n.getMessage('requests for “{0}”. Variations of popular items are strong candidates.', top.name) : i18n.getMessage('No request history yet.')}</span>
        </a>
      </div>
    </section>`;
  }

  _renderOverview() {
    return html`<div class="stack">
      <section class="hero" aria-labelledby="phase-h">
        <span class="eyebrow">${i18n.getMessage('Grow')}</span>
        <h1 id="phase-h" tabindex="-1">${i18n.getMessage('From an idea to a governed draft, in minutes.')}</h1>
        <p>${i18n.getMessage('A service owner describes what they need and attaches the policy. The Assembly Line reads it, checks it against your catalog, drafts the item and its form, applies your standards, and hands a person a draft to approve.')}</p>
        <div class="row">
          <button class="btn solid" @click=${() => this._newProposal()}>${ic('plus')}${i18n.getMessage('Start a proposal')}</button>
          <button class="btn outline" @click=${() => this._openRequest(this._queue[0] || {intake: DEMO_INTAKE})}>${ic('spark')}${i18n.getMessage('Run the demo scenario')}</button>
        </div>
      </section>
      <div class="notice" role="note">${ic('warning')}<span>${i18n.getMessage('Preview with a simulated Assembly Line. Requirement analysis, drafting, governance and approval are scripted examples. Only duplicate detection, category and service matching read your real catalog, and only to compare. No catalog item, record producer or any other record is ever created.')}</span></div>
      ${this._rail()}
      ${this._liveSignals()}
      <section class="card" aria-labelledby="q-h">
        <div class="card-head"><h2 id="q-h" class="grow">${i18n.getMessage('Service owner requests')}</h2><span class="tag sim">${i18n.getMessage('Simulated queue')}</span></div>
        <ul class="queue">
          ${this._queue.map(
            r => html`<li class="qrow">
              <span class="id">${r.id}</span>
              <span><span class="t">${r.title}</span><br /><span class="m">${r.owner} · ${r.age} · ${r.blurb}</span></span>
              <span style="display:flex;gap:8px;align-items:center"><span class="chip ${r.status === 'ready' ? 'ok' : ''}">${r.status === 'ready' ? i18n.getMessage('Documents attached') : i18n.getMessage('Waiting')}</span><button class="btn sm" @click=${() => this._openRequest(r)}>${i18n.getMessage('Open intake')}</button></span>
            </li>`
          )}
        </ul>
      </section>
    </div>`;
  }

  _renderIntake() {
    const it = this._intake;
    const ok = it.title.trim() && it.description.trim() && this._line;
    return html`<div class="stack">
      <header>
        <p class="sec">${i18n.getMessage('Step 1 · Intake')}</p>
        <h1 id="phase-h" tabindex="-1" style="font-size:1.6rem;color:var(--ink)">${i18n.getMessage('Describe the service')}</h1>
      </header>
      ${this._rail()}
      <div class="two">
        <section class="card" aria-label=${i18n.getMessage('Service description')}>
          <div class="field">
            <label for="g-title">${i18n.getMessage('What should people be able to request?')}</label>
            <input id="g-title" type="text" .value=${it.title} @input=${e => this._set('title', e.target.value)} placeholder=${i18n.getMessage('e.g. Loaner laptop for travel')} />
          </div>
          <div class="field">
            <label for="g-desc">${i18n.getMessage('Why is it needed, who is it for, how should it be fulfilled?')}</label>
            <textarea id="g-desc" .value=${it.description} @input=${e => this._set('description', e.target.value)}></textarea>
          </div>
          <div class="field">
            <label for="g-owner">${i18n.getMessage('Service owner')}</label>
            <input id="g-owner" type="text" .value=${it.owner} @input=${e => this._set('owner', e.target.value)} />
          </div>
          <div class="field">
            <span class="lbl" id="g-type-l">${i18n.getMessage('What should be created?')}</span>
            <div class="seg" role="group" aria-labelledby="g-type-l">
              <button aria-pressed=${it.type === 'item'} @click=${() => this._set('type', 'item')}>${i18n.getMessage('Catalog item')}</button>
              <button aria-pressed=${it.type === 'producer'} @click=${() => this._set('type', 'producer')}>${i18n.getMessage('Record producer')}</button>
            </div>
            <small>${it.type === 'producer' ? i18n.getMessage('A record producer creates a record directly, such as a case or a notification.') : i18n.getMessage('A catalog item creates a requested item that is fulfilled by a team.')}</small>
          </div>
          <div class="field">
            <label for="g-aud">${i18n.getMessage('Who can request it?')}</label>
            <select id="g-aud" @change=${e => this._set('audience', e.target.value)}>${AUDIENCES.map(a => html`<option .selected=${it.audience === a} value=${a}>${a}</option>`)}</select>
          </div>
        </section>
        <section class="card" aria-label=${i18n.getMessage('Supporting documents')}>
          <div class="card-head"><h2 class="grow">${i18n.getMessage('Supporting documents')}</h2><span class="tag sim">${i18n.getMessage('Preview')}</span></div>
          <div class="drop ${this._drag ? 'over' : ''}" @dragover=${e => (e.preventDefault(), (this._drag = true))} @dragleave=${() => (this._drag = false)} @drop=${e => (e.preventDefault(), (this._drag = false), this._addFiles(e.dataTransfer.files))}>
            ${ic('upload')}
            <b>${i18n.getMessage('Drop policies, standards or process documents here')}</b>
            <span style="font-size:0.82rem">${i18n.getMessage('PDF, Word or text. Up to 5 files.')}</span>
            <div class="actions" style="justify-content:center">
              <label class="btn sm" style="cursor:pointer">${i18n.getMessage('Choose files')}<input class="vh" type="file" multiple accept=".pdf,.doc,.docx,.txt,.md" @change=${e => (this._addFiles(e.target.files), (e.target.value = ''))} /></label>
              <button class="btn sm" @click=${() => this._set('files', [...it.files, {name: 'Travel-Device-Policy-v3.pdf', size: 482113, sample: true}].slice(0, 5))}>${i18n.getMessage('Attach sample policy')}</button>
            </div>
          </div>
          ${it.files.length
            ? html`<ul class="files">${it.files.map(
                (f, i) => html`<li class="file">${ic('doc')}<span class="n">${f.name}</span><span class="chip">${f.sample ? i18n.getMessage('Sample') : kb(f.size)}</span><button aria-label=${i18n.getMessage('Remove {0}', f.name)} @click=${() => this._set('files', it.files.filter((_, j) => j !== i))}>${ic('x')}</button></li>`
              )}</ul>`
            : nothing}
          <div class="cu">
            <b>${i18n.getMessage('Content Understanding')}</b> · <span class="tag sim">${i18n.getMessage('Not connected')}</span><br />
            ${i18n.getMessage('When connected, attached documents are read for eligibility rules, approvals, fulfilment steps and the data to collect. In this preview files stay in your browser: only their names are used, and the extracted requirements are an example.')}
            <div class="chips"><span class="chip blue">${i18n.getMessage('Eligibility')}</span><span class="chip blue">${i18n.getMessage('Approvals')}</span><span class="chip blue">${i18n.getMessage('Fulfilment steps')}</span><span class="chip blue">${i18n.getMessage('Data to collect')}</span></div>
          </div>
        </section>
      </div>
      <div class="actions">
        <button class="btn" @click=${() => this._phaseTo('overview')}>${i18n.getMessage('Back')}</button>
        <button class="btn primary" ?disabled=${!ok} @click=${() => this._run()}>${ic('spark')}${i18n.getMessage('Run the Assembly Line')}</button>
        ${!this._line ? html`<span class="m" role="status">${i18n.getMessage('Reading the catalog…')}</span>` : nothing}
      </div>
    </div>`;
  }

  _renderRunning() {
    const meta = this._stageMeta();
    return html`<div class="stack">
      <header>
        <p class="sec">${i18n.getMessage('Step 2 · Assembly')}</p>
        <h1 id="phase-h" tabindex="-1" style="font-size:1.6rem;color:var(--ink)">${i18n.getMessage('The Assembly Line is working')}</h1>
      </header>
      ${this._rail()}
      <ul class="running-log" aria-hidden="true">${STAGE_IDS.filter(id => this._stages[id] !== 'idle').map(id => html`<li>${ic(this._stages[id] === 'running' ? 'spark' : 'check')}${meta[id].name}${this._stages[id] === 'running' ? ' …' : ''}</li>`)}</ul>
      <div class="skeleton" aria-hidden="true"></div>
    </div>`;
  }

  _field(v) {
    const t = v.type;
    const id = `pf-${v.id}`;
    const star = v.mandatory ? html`<span class="star" aria-hidden="true"> *</span>` : nothing;
    if (/Checkbox/.test(t)) return html`<div class="pf chk"><label><input type="checkbox" disabled />${v.label}${star}</label></div>`;
    const control = /Multi line/.test(t)
      ? html`<textarea id=${id} disabled aria-label=${v.label}></textarea>`
      : /Date/.test(t)
        ? html`<input id=${id} type="date" disabled aria-label=${v.label} />`
        : /Select/.test(t)
          ? html`<select id=${id} disabled aria-label=${v.label}><option>${i18n.getMessage('Choose…')}</option></select>`
          : html`<input id=${id} type="text" disabled aria-label=${v.label} placeholder=${/Reference/.test(t) ? i18n.getMessage('Search…') : ''} />`;
    return html`<div class="pf"><label for=${id}>${v.label}${star}</label>${control}</div>`;
  }

  _renderPortal(d) {
    const shown = d.variables.filter(v => v.include);
    return html`<section class="card portal" aria-label=${i18n.getMessage('Portal preview')}>
      <div class="p-top"><span class="p-ico" aria-hidden="true">${d.name.charAt(0)}</span><div><div class="p-name">${d.name}</div><div class="p-cat">${d.categoryNow?.title || i18n.getMessage('No category chosen')} · ${d.type === 'producer' ? i18n.getMessage('Record producer') : i18n.getMessage('Catalog item')}</div></div></div>
      <div class="p-body">
        <p class="p-desc">${d.shortDescription}</p>
        ${shown.map(v => this._field(v))}
        <div class="p-foot"><button class="btn sm primary" disabled>${i18n.getMessage('Submit request')}</button><span class="tag sim">${i18n.getMessage('Preview only')}</span></div>
      </div>
    </section>`;
  }

  _renderReview() {
    const open = this._openFindings();
    const blocking = open.filter(f => f.blocking);
    const total = this._proposal.governance.findings.length;
    const dec = this._decision;
    return html`<section class="card review" id="review" tabindex="-1" aria-labelledby="rev-h">
      <div class="card-head"><h2 id="rev-h" class="grow">${i18n.getMessage('Human review')}</h2><span class="tag sim">${i18n.getMessage('Simulated')}</span></div>
      ${dec
        ? html`<div class="outcome ${dec.decision}" role="status">
              <b>${dec.decision === 'approved' ? i18n.getMessage('Approved (simulation)') : dec.decision === 'changes' ? i18n.getMessage('Sent back for changes (simulation)') : i18n.getMessage('Rejected (simulation)')}</b>
              <span>${dec.note}</span>
              ${dec.comment ? html`<span>“${dec.comment}”</span>` : nothing}
            </div>
            <ol class="timeline">${this._log.map(l => html`<li><time>${l.t.toLocaleTimeString()}</time>${l.text}</li>`)}</ol>
            <div class="actions"><button class="btn" @click=${() => (this._decision = null)}>${i18n.getMessage('Reopen review')}</button><button class="btn primary" @click=${() => this._newProposal()}>${i18n.getMessage('Start another proposal')}</button></div>`
        : html`<div class="score"><span>${i18n.getMessage('{0} of {1} findings resolved', String(total - open.length), String(total))}</span><span class="bar ${blocking.length ? 'warn' : ''}"><i style="width:${Math.round(((total - open.length) / total) * 100)}%"></i></span></div>
            <p class="gate" role="status">${blocking.length ? i18n.getMessage('Approval is locked until {0} required finding(s) are applied: {1}.', String(blocking.length), blocking.map(f => f.rule).join(', ')) : i18n.getMessage('All required standards are met. The draft can be approved.')}</p>
            <label for="rev-c" class="sec" style="display:block">${i18n.getMessage('Reviewer comment')}</label>
            <textarea id="rev-c" .value=${this._comment} @input=${e => (this._comment = e.target.value)}></textarea>
            <div class="btns">
              <button class="btn primary" ?disabled=${blocking.length > 0 || this._busy} @click=${() => this._decide('approved')}>${ic('check')}${i18n.getMessage('Approve draft')}</button>
              <button class="btn" ?disabled=${!this._comment.trim() || this._busy} @click=${() => this._decide('changes')}>${i18n.getMessage('Request changes')}</button>
              <button class="btn danger" ?disabled=${this._busy} @click=${() => this._decide('rejected')}>${i18n.getMessage('Reject')}</button>
            </div>
            <p class="m" style="font-size:0.76rem;color:var(--muted);margin-top:8px">${i18n.getMessage('“Request changes” needs a comment. Nothing here creates or changes a catalog record.')}</p>`}
    </section>`;
  }

  _tabBody(d) {
    const p = this._proposal;
    switch (this._tab) {
      case 'form': {
        let lastSet = null;
        return html`<div class="vars">
          <p style="font-size:0.84rem;color:#3b3a38">${i18n.getMessage('Proposed variables. Include or exclude a question and mark it required; the portal preview updates as you go.')}</p>
          ${d.variables.map(v => {
            const head = v.set && v.set !== lastSet ? html`<span class="vgroup">${(lastSet = v.set)} · ${i18n.getMessage('shared variable set')}</span>` : nothing;
            return html`${head}<div class="var ${v.include ? '' : 'off'}">
              ${ic(v.added ? 'governance' : 'tag')}
              <span><span class="vn">${v.label}</span> <span class="chip">${v.type}</span><br /><span class="vm">${v.hint}${v.added ? ` · ${i18n.getMessage('added by governance')}` : ''}</span></span>
              <span class="ctrl">
                <label><input type="checkbox" .checked=${v.include} @change=${e => this._toggleVar(v.id, 'include', e.target.checked)} />${i18n.getMessage('Include')}</label>
                <label><input type="checkbox" .checked=${v.mandatory} ?disabled=${!v.include} @change=${e => this._toggleVar(v.id, 'mandatory', e.target.checked)} />${i18n.getMessage('Required')}</label>
              </span>
            </div>`;
          })}
        </div>`;
      }
      case 'fulfilment':
        return html`<p style="font-size:0.84rem;color:#3b3a38;margin-bottom:12px">${i18n.getMessage('Recommended fulfilment flow. A person would build it in Flow Designer once the draft is approved.')}</p>
          <ol class="flow">${d.workflow.map(
            s => html`<li class="step ${s.kind}"><span class="dot">${ic(s.kind === 'approval' ? 'user' : s.kind === 'auto' ? 'gear' : s.kind === 'start' || s.kind === 'end' ? 'check' : 'clock')}</span><span><b>${s.label}${s.added ? html` <span class="chip warn">${i18n.getMessage('added by governance')}</span>` : nothing}</b><span class="d">${s.detail}</span></span></li>`
          )}</ol>`;
      case 'governance':
        return html`<p style="font-size:0.84rem;color:#3b3a38;margin-bottom:12px">${i18n.getMessage('Checked against {0}. Apply a suggested fix to see it change the draft, dismiss it, or undo.', p.governance.kb)}</p>
          <div class="stack" style="gap:10px">${p.governance.findings.map(f => this._finding(f))}</div>`;
      case 'duplicates':
        return this._renderDuplicates();
      default:
        return this._renderOverviewTab(d);
    }
  }

  _finding(f) {
    const st = this._resolved[f.id];
    const sev = {high: i18n.getMessage('Required'), medium: i18n.getMessage('Recommended'), low: i18n.getMessage('Suggestion'), info: i18n.getMessage('Note')}[f.severity];
    return html`<article class="finding ${f.severity} ${st ? 'done' : ''}">
      <div class="top"><span class="rule">${f.rule}</span><span class="chip ${f.blocking ? 'bad' : f.severity === 'medium' ? 'warn' : 'blue'}">${sev}</span>${st ? html`<span class="chip ok">${st === 'applied' ? i18n.getMessage('Applied') : st === 'dismissed' ? i18n.getMessage('Dismissed') : i18n.getMessage('Acknowledged')}</span>` : nothing}<span class="kbref">${f.kb}</span></div>
      <p>${f.message}</p>
      ${f.fix.type === 'rename' || f.fix.type === 'shortDescription' ? html`<div class="fix">${i18n.getMessage('Suggested')}: “${f.fix.value}”</div>` : nothing}
      <div class="actions" style="margin:0">
        ${st
          ? html`<button class="btn sm" @click=${() => this._undoFix(f)}>${i18n.getMessage('Undo')}</button>`
          : html`<button class="btn sm primary" @click=${() => (f.fix.type === 'acknowledge' ? this._ack(f) : this._applyFix(f))}>${f.fix.label}</button>${f.blocking ? nothing : html`<button class="btn sm" @click=${() => this._dismiss(f)}>${i18n.getMessage('Dismiss')}</button>`}`}
      </div>
    </article>`;
  }

  _ack(f) {
    this._resolved = {...this._resolved, [f.id]: 'acknowledged'};
    this._note(i18n.getMessage('Acknowledged: {0}', f.rule));
  }

  _renderDuplicates() {
    const dup = this._proposal.duplicates;
    const choices = [
      ['distinct', i18n.getMessage('Distinct service'), i18n.getMessage('Proceed with a new item')],
      ['extend', i18n.getMessage('Extend an existing item'), i18n.getMessage('Add this as a variation instead')],
      ['merge', i18n.getMessage('Review overlap first'), i18n.getMessage('Compare in Understand before deciding')]
    ];
    return html`<div class="card-head" style="margin-top:-4px"><span class="tag live">${i18n.getMessage('Live comparison with your catalog')}</span></div>
      <div class="verdict ${dup.verdict === 'overlap' ? 'warn' : ''}" role="status">${dup.verdict === 'none' ? i18n.getMessage('No active catalog item shares meaningful words with this proposal. It looks like a new service.') : dup.verdict === 'overlap' ? i18n.getMessage('At least one existing item reads very much alike. Decide whether this is really a new service.') : i18n.getMessage('Some existing items are related, but none reads like a duplicate.')}</div>
      <div class="stack" style="gap:10px">
        ${dup.matches.map(
          m => html`<article class="match"><div class="row"><span class="nm">${m.name}</span><span class="chip ${m.score >= 0.3 ? 'warn' : ''}">${Math.round(m.score * 100)}% ${i18n.getMessage('alike')}</span></div>
            <span class="bar ${m.score >= 0.3 ? 'warn' : ''}" role="img" aria-label=${i18n.getMessage('{0}% alike', String(Math.round(m.score * 100)))}><i style="width:${Math.round(m.score * 100)}%"></i></span>
            <span class="meta">${m.category || i18n.getMessage('No category')} · ${i18n.getMessage('{0} requests', String(m.requests))}${m.shortDescription ? ` · ${m.shortDescription}` : ''}</span>
            ${this._link(exploreLink({item: m.id}), i18n.getMessage('Inspect in Understand'))}</article>`
        )}
      </div>
      <div class="field" style="margin-top:14px"><span class="lbl" id="dc-l">${i18n.getMessage('Your call')}</span>
        <div class="opts" role="group" aria-labelledby="dc-l">${choices.map(([k, t, s]) => html`<button class="opt" aria-pressed=${this._dupChoice === k} @click=${() => (this._dupChoice = k)}><span class="o-main"><b>${t}</b><span class="o-sub">${s}</span></span>${this._dupChoice === k ? ic('check') : nothing}</button>`)}</div></div>
      <div class="links">${this._link(exploreLink({highlight: 'overlap'}), i18n.getMessage('Open duplicate detection'))}${this._link(exploreLink({highlight: 'categories', lens: 'overview'}), i18n.getMessage('See the catalog structure'))}</div>`;
  }

  _renderOverviewTab(d) {
    const p = this._proposal;
    return html`<div class="kv"><span class="k">${i18n.getMessage('Name')}</span><span class="v big">${d.name}</span></div>
      <div class="kv"><span class="k">${i18n.getMessage('Short description')}</span><span class="v">${d.shortDescription}</span></div>
      <div class="kv"><span class="k">${i18n.getMessage('Category')} · <span class="tag live">${i18n.getMessage('From your catalog')}</span></span>
        ${d.categoryOptions.length
          ? html`<div class="opts" role="group" aria-label=${i18n.getMessage('Suggested categories')}>${d.categoryOptions.map(c => html`<button class="opt" aria-pressed=${this._category === c.id} @click=${() => (this._category = c.id)}><span class="o-main"><b>${c.title}</b><span class="o-sub">${i18n.getMessage('{0} items today', String(c.items))}</span></span>${this._category === c.id ? ic('check') : nothing}</button>`)}</div>`
          : html`<span class="v">${i18n.getMessage('No existing category fits. A new category may be needed.')}</span>`}
        <div class="links">${this._link(exploreLink({highlight: 'categories', lens: 'overview'}), i18n.getMessage('See the catalog structure'))}</div></div>
      <div class="kv"><span class="k">${i18n.getMessage('Service alignment')} · <span class="tag live">${i18n.getMessage('From your catalog')}</span></span>
        ${d.offerings.length
          ? html`<div class="opts">${d.offerings.map(o => html`<div class="opt" style="cursor:default"><span class="o-main"><b>${o.name}</b><span class="o-sub">${o.linkedItems ? i18n.getMessage('{0} catalog items already linked', String(o.linkedItems)) : i18n.getMessage('No catalog item linked yet')}</span></span></div>`)}</div>`
          : html`<span class="v">${i18n.getMessage('No service offering matches. Ask the owner which service this supports.')}</span>`}</div>
      <div class="kv"><span class="k">${i18n.getMessage('Requirements found')} · <span class="tag sim">${p.requirements.fromDocuments ? i18n.getMessage('Simulated extraction') : i18n.getMessage('Simulated, from the intake')}</span></span>
        <ul class="req">${p.requirements.items.map(r => html`<li>${ic('check')}<span>${r.text}<br /><span class="src">${r.source}</span></span></li>`)}</ul></div>`;
  }

  _renderDraft() {
    const d = this._draftNow();
    const p = this._proposal;
    const open = this._openFindings().length;
    const tabs = [
      ['overview', i18n.getMessage('Overview')],
      ['form', i18n.getMessage('Form')],
      ['fulfilment', i18n.getMessage('Fulfilment')],
      ['governance', i18n.getMessage('Governance'), open],
      ['duplicates', i18n.getMessage('Duplicates'), p.duplicates.verdict === 'overlap' && !this._dupChoice ? 1 : 0]
    ];
    return html`<div class="stack">
      <header style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
        <div style="flex:1;min-width:240px"><p class="sec">${i18n.getMessage('Step 3 · Draft for review')} · ${p.id}</p>
        <h1 id="phase-h" tabindex="-1" style="font-size:1.6rem;color:var(--ink);overflow-wrap:anywhere">${d.name}</h1></div>
        <span class="tag sim">${i18n.getMessage('Simulated draft')}</span>
        <button class="btn sm" @click=${() => this._phaseTo('intake')}>${i18n.getMessage('Edit intake')}</button>
      </header>
      ${this._rail()}
      <div class="workbench">
        <section class="card" aria-label=${i18n.getMessage('Draft details')}>
          <div class="tabs" role="tablist" aria-label=${i18n.getMessage('Draft sections')}>
            ${tabs.map(([k, l, n]) => html`<button role="tab" id=${`tab-${k}`} aria-selected=${this._tab === k} aria-controls="tabpanel" tabindex=${this._tab === k ? 0 : -1} @click=${() => (this._tab = k)} @keydown=${e => this._tabKey(e, tabs)}>${l}${n ? html`<span class="badge-n" role="img" aria-label=${i18n.getMessage('{0} open', String(n))}>${n}</span>` : nothing}</button>`)}
          </div>
          <div id="tabpanel" role="tabpanel" aria-labelledby=${`tab-${this._tab}`}>${this._tabBody(d)}</div>
        </section>
        <div class="aside">${this._renderPortal(d)}${this._renderReview()}</div>
      </div>
    </div>`;
  }

  _tabKey(e, tabs) {
    const i = tabs.findIndex(t => t[0] === this._tab);
    const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : -1;
    if (next < 0) return;
    e.preventDefault();
    this._tab = tabs[next][0];
    this.updateComplete.then(() => this.renderRoot.querySelector(`#tab-${this._tab}`)?.focus());
  }

  render() {
    return html`<div role="status" aria-live="polite" class="vh">${this._say}</div>
      ${this._model === null ? html`<div class="skeleton" role="status" aria-label=${i18n.getMessage('Reading the catalog…')}></div>` : this._model === false ? html`<p role="alert">${i18n.getMessage('The catalog could not be read right now.')}</p>` : this._phase === 'intake' ? this._renderIntake() : this._phase === 'running' ? this._renderRunning() : this._phase === 'draft' && this._proposal ? this._renderDraft() : this._renderOverview()}`;
  }
}
