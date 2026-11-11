#!/usr/bin/env node
/**
 * Test the Figma-to-widget pipeline (Phases 1–3) using a local fixture.
 *
 * No FIGMA_ACCESS_TOKEN needed — the fixture replaces the live API call so
 * the full extraction → translation → blueprint output can be verified
 * without Figma credentials.
 *
 * Usage:
 *   node scripts/test-mock-pipeline.js [--raw]
 *
 * Options:
 *   --raw   Print translated blocks as JSON instead of the blueprint text
 *
 * The fixture at scripts/fixtures/task-card.json is a representative
 * "Task Card" frame with:
 *   - A vertical container with a title label
 *   - Three task rows (horizontal), each with: icon, text column, priority badge
 *
 * Expected output includes:
 *   - Icon instances named "Icon/checklist" and "Icon/user-clipboard" matched
 *     to aiux-icon names via the slash-notation lookup
 *   - badge layers matched to the DaisyUI "badge" pattern
 *   - Tailwind spacing, radius, and shadow classes generated from Figma values
 */

import {readFileSync} from 'fs';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';

import {extractBlocks} from './figma-extractor.js';
import {translateDesign} from './design-translator.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dir, 'fixtures', 'task-card.json');

// ── Blueprint builder (mirrors extract-and-translate.js) ──────────────────────

function toPascalCase(str) {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function toKebabCase(str) {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map(w => w.toLowerCase())
    .join('-');
}

function buildBlueprint(title, translatedBlocks) {
  const bgColors = new Set();
  const textColors = new Set();
  const customCssBlocks = [];

  for (const b of translatedBlocks) {
    if (b.palette?.bg) bgColors.add(b.palette.bg);
    if (b.palette?.border) bgColors.add(b.palette.border);
    if (b.typo?.color) textColors.add(b.typo.color);
    if (b.cssProps) {
      const selector = b.name
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
      // Skip if we already emitted a rule for this selector (repeated rows)
      if (!customCssBlocks.some(block => block.startsWith(`.${selector} {`))) {
        const rules = Object.entries(b.cssProps)
          .map(([k, v]) => `  ${k}: ${v};`)
          .join('\n');
        customCssBlocks.push(`.${selector} {\n${rules}\n}`);
      }
    }
  }

  const treeLines = translatedBlocks
    .map(b => {
      const indent = '  '.repeat(b.depth);
      let tag;
      switch (b.role) {
        case 'row':
          tag = 'div.row';
          break;
        case 'column':
          tag = 'div.col';
          break;
        case 'label':
          tag = 'span';
          break;
        case 'glyph':
          tag = b.iconMatch ? `aiux-icon[${b.iconMatch}]` : 'icon?';
          break;
        case 'trigger':
          tag = 'button';
          break;
        case 'field':
          tag = 'input';
          break;
        case 'picker':
          tag = 'select';
          break;
        case 'shape':
          tag = 'div.shape';
          break;
        default:
          tag = 'div';
      }
      const parts = [`${indent}${tag}`];
      if (b.tailwind) parts.push(`class="${b.tailwind}"`);
      if (b.content) parts.push(`→ "${b.content.slice(0, 60)}"`);
      if (b.daisyPattern) parts.push(`[daisy:${b.daisyPattern}]`);
      if (b.sizeHint) parts.push(`{${b.sizeHint}}`);
      if (b.notes?.length) parts.push(`(${b.notes.join(', ')})`);
      return parts.join('  ');
    })
    .join('\n');

  const visibleText = translatedBlocks
    .filter(b => b.content?.trim())
    .map(b => `  [${b.role}] "${b.content.trim()}"`)
    .join('\n');

  const stats = {
    totalLayers: translatedBlocks.length,
    daisyPatterns: translatedBlocks
      .filter(b => b.daisyPattern)
      .map(b => b.daisyPattern),
    icons: translatedBlocks.filter(b => b.iconMatch).map(b => b.iconMatch),
    unmatchedGlyphs: translatedBlocks.filter(
      b => b.role === 'glyph' && !b.iconMatch
    ).length,
    hasGradients: translatedBlocks.some(b => b.palette?.gradient),
    hasImages: translatedBlocks.some(b => b.palette?.imagePlaceholder),
    hasShadows: translatedBlocks.some(b => b.palette?.shadow),
    textCount: translatedBlocks.filter(b => b.content).length,
    interactiveCount: translatedBlocks.filter(b =>
      ['trigger', 'field', 'picker'].includes(b.role)
    ).length
  };

  const className = toPascalCase(title);
  const elementName = toKebabCase(title);

  return `Create widget "${title}" (class: ${className}, element: ${elementName}) from this pre-mapped blueprint.

## Design Summary
- ${stats.totalLayers} layers total
- ${stats.textCount} text elements, ${stats.interactiveCount} interactive elements
- DaisyUI patterns detected: ${stats.daisyPatterns.length ? [...new Set(stats.daisyPatterns)].join(', ') : 'none'}
- Icons matched: ${stats.icons.length ? [...new Set(stats.icons)].join(', ') : 'none'}
- ${stats.unmatchedGlyphs} unmatched glyphs (use <!-- TODO: custom icon --> or best-guess aiux-icon)
${stats.hasGradients ? '- Has gradient fills → put in static styles\n' : ''}${stats.hasImages ? '- Has image placeholders → use bg-base-300 with background-size: cover\n' : ''}${stats.hasShadows ? '- Has drop shadows\n' : ''}
## Component Tree (Tailwind classes pre-mapped)
\`\`\`
${treeLines}
\`\`\`

## Custom CSS (for static styles)
${customCssBlocks.length ? customCssBlocks.join('\n\n') : 'None — all handled by Tailwind classes above'}

## Colors Found
Background: ${[...bgColors].slice(0, 8).join(', ') || 'standard'}
Text: ${[...textColors].slice(0, 8).join(', ') || 'standard'}

## Visible Text in Design (use this to build _mockData)
${visibleText || '  (no text layers detected)'}

## Requirements
1. Use the Tailwind classes from the tree above — they are already correctly mapped
2. For aiux-icon[name] nodes, render <aiux-icon name="name" size="sm">
3. For icon? nodes, pick a reasonable aiux-icon or add <!-- TODO: custom icon -->
4. For text content (→ "..."), wrap in i18n.getMessage()
5. Build static _mockData from the visible text content listed above — extract repeating items into a typed array (id, title, status, statusText etc.) that the template can map over
6. In fetchData(), fall back to _mockData on error OR empty response so the widget always renders content
7. Add this.server.get({ action: 'getData' }) in fetchData()
8. Add skeleton loader matching the layout structure
9. The outer container must be: <div class="widget-container flex flex-col p-6 rounded-3xl">`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const rawMode = process.argv.includes('--raw');

  // Load fixture — this replaces fetchFigmaFrame()
  console.error('Loading mock fixture: fixtures/task-card.json');
  let fixture;
  try {
    fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
  } catch (err) {
    console.error(`Error loading fixture: ${err.message}`);
    process.exit(1);
  }

  const frameId = Object.keys(fixture.nodes)[0];
  const rootLayer = fixture.nodes[frameId].document;
  const title = rootLayer.name;
  console.error(`  → Loaded frame "${title}" (id: ${frameId})`);

  // Phase 1: Extract blocks
  console.error('Phase 1: Extracting blocks...');
  const rawBlocks = extractBlocks(rootLayer);
  console.error(`  → ${rawBlocks.length} blocks extracted`);

  // Phase 2: Translate
  console.error('Phase 2: Translating to Tailwind/DaisyUI...');
  const translated = translateDesign(rawBlocks);
  const icons = translated.filter(b => b.iconMatch).length;
  const daisyPatterns = new Set(
    translated.filter(b => b.daisyPattern).map(b => b.daisyPattern)
  );
  console.error(
    `  → ${icons} icons matched, ${daisyPatterns.size} DaisyUI patterns: [${[...daisyPatterns].join(', ')}]`
  );

  // Phase 3: Build blueprint
  if (rawMode) {
    console.log(JSON.stringify(translated, null, 2));
  } else {
    console.error('Phase 3: Building blueprint...');
    const blueprint = buildBlueprint(title, translated);
    console.error('  → Blueprint ready\n');
    console.log(blueprint);
  }
}

main();
