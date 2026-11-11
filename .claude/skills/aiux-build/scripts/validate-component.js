/**
 * Validate an AIUX component for best practices and common issues.
 *
 * Usage: node validate-component.js <file-path>
 *
 * Checks for Lit patterns, AIUX-specific patterns,
 * styling patterns, accessibility, performance,
 * internationalization, and lifecycle management.
 */

import {readFileSync} from 'fs';

function validateComponent(code) {
  const issues = [];
  const warnings = [];
  const suggestions = [];

  validateLitPatterns(code, issues, warnings);
  validateAIUXPatterns(code, issues, warnings, suggestions);
  validateStylingPatterns(code, warnings, suggestions);
  validateAccessibility(code, warnings, suggestions);
  validatePerformance(code, issues, warnings, suggestions);
  validateI18n(code, warnings, suggestions);
  validateLifecycle(code, issues, warnings, suggestions);

  return {issues, warnings, suggestions};
}

function validateLitPatterns(code, issues, warnings) {
  if (!code.includes("from 'lit'") && !code.includes('from "lit"')) {
    issues.push({
      title: 'Missing Lit Import',
      description: 'Component should import from the lit package.',
      fix: "Add `import { html, css } from 'lit';` at the top."
    });
  }

  if (
    !code.includes('extends AIUXWidgetElement') &&
    !code.includes('extends WithData') &&
    !code.includes('extends LitElement')
  ) {
    issues.push({
      title: 'Invalid Base Class',
      description:
        'Component must extend AIUXWidgetElement (standard) or WithData(AIUXWidgetElement) (auto data binding).',
      fix: 'Change the class to extend AIUXWidgetElement.'
    });
  }

  if (
    !code.includes('static properties') &&
    !code.includes('static get properties')
  ) {
    warnings.push({
      title: 'No Properties Defined',
      description:
        'No reactive properties defined. Add static properties if needed.'
    });
  }

  if (!code.includes('render()') && !code.includes('render ()')) {
    issues.push({
      title: 'Missing render() Method',
      description: 'Lit components must have a render() method.',
      fix: 'Add a render() method returning html``.'
    });
  }

  if (code.includes('render()') && !code.includes('html`')) {
    warnings.push({
      title: 'No HTML Template',
      description: 'render() should return html`` template literal.'
    });
  }

  if (code.includes('constructor()') && !code.includes('super()')) {
    issues.push({
      title: 'Missing super() Call',
      description: 'Constructor must call super().',
      fix: 'Add super() as the first line in the constructor.'
    });
  }
}

function validateAIUXPatterns(code, issues, warnings, suggestions) {
  if (
    code.includes('extends LitElement') &&
    !code.includes('extends AIUXWidgetElement') &&
    !code.includes('extends WithData')
  ) {
    suggestions.push({
      title: 'Consider Using AIUXWidgetElement',
      description:
        'Extend AIUXWidgetElement for global styles, this.server, and platform API access.'
    });
  }

  if (
    code.includes('this.server.get') &&
    !code.includes('extends AIUXWidgetElement') &&
    !code.includes('extends WithData')
  ) {
    issues.push({
      title: 'server.get() Without AIUXWidgetElement',
      description:
        'this.server is only available on AIUXWidgetElement or WithData(AIUXWidgetElement).',
      fix: 'Extend AIUXWidgetElement to use this.server.'
    });
  }
}

function validateStylingPatterns(code, warnings, suggestions) {
  if (code.includes('style="') || code.includes("style='")) {
    warnings.push({
      title: 'Inline Styles Detected',
      description: 'Prefer Tailwind/DaisyUI classes or static styles.'
    });
  }

  if (!code.includes('static styles') && !code.includes('static get styles')) {
    suggestions.push({
      title: 'No Static Styles',
      description: 'Consider adding static styles for component-specific CSS.'
    });
  }

  if (code.includes('static styles') && !code.includes(':host')) {
    suggestions.push({
      title: 'Missing :host Styles',
      description:
        'Add :host { display: block; height: 100%; } for proper display.'
    });
  }

  // Check for hardcoded colors instead of CSS custom properties
  const hardcodedColorPattern =
    /(?:color|background):\s*(?:#[0-9a-fA-F]{3,8}\b|(?:rgb|rgba|hsl|hsla)\s*\(|(?:white|black|red|blue|green|gray|grey)\b)/;
  if (code.includes('static styles') && hardcodedColorPattern.test(code)) {
    const hasCustomProps = code.includes('var(--');
    if (!hasCustomProps) {
      suggestions.push({
        title: 'Use CSS Custom Properties',
        description:
          'Use var(--color-surface), var(--color-base-content), etc. instead of hardcoded colors for theme compatibility.'
      });
    }
  }

  // Check for inline SVGs instead of platform icons
  if (code.includes('<svg') && code.includes('viewBox')) {
    suggestions.push({
      title: 'Use Platform Icons',
      description:
        'Use <aiux-icon name="icon-name" size="sm"> instead of inline SVGs.'
    });
  }
}

function validateAccessibility(code, warnings, suggestions) {
  if (
    (code.includes('click') || code.includes('@click')) &&
    code.includes('<div') &&
    !code.includes('role=')
  ) {
    warnings.push({
      title: 'Clickable Div Without Role',
      description: 'Add role="button" or use <button> element instead.'
    });
  }

  if (code.includes('<img') && !code.includes('alt=')) {
    warnings.push({
      title: 'Missing Alt Text',
      description: 'Images should have alt attributes.'
    });
  }

  if (
    code.includes('<input') &&
    !code.includes('<label') &&
    !code.includes('aria-label')
  ) {
    warnings.push({
      title: 'Input Without Label',
      description: 'Form inputs need labels or aria-label.'
    });
  }

  // Check for keyboard accessibility on interactive elements
  if (
    code.includes('@click') &&
    !code.includes('@keydown') &&
    !code.includes('@keyup') &&
    !code.includes('<button')
  ) {
    suggestions.push({
      title: 'Consider Keyboard Accessibility',
      description:
        'Add @keydown handler for Enter/Space on clickable non-button elements, or use <button> elements.'
    });
  }
}

function validatePerformance(code, issues, warnings, suggestions) {
  if (code.includes('this.requestUpdate()')) {
    suggestions.push({
      title: 'Manual requestUpdate()',
      description: 'Reactive properties trigger updates automatically.'
    });
  }

  if (code.includes('addEventListener') && code.includes('render()')) {
    warnings.push({
      title: 'addEventListener in Render',
      description: 'Use @event syntax in templates instead.'
    });
  }

  if (code.includes('querySelector') && code.includes('render()')) {
    warnings.push({
      title: 'DOM Query in Render',
      description: 'Use reactive properties instead of DOM queries.'
    });
  }

  if (code.includes('async render()')) {
    issues.push({
      title: 'Async Render Method',
      description: 'render() must not be async.',
      fix: 'Remove async and use state properties for async data.'
    });
  }
}

// Named imports from @servicenow/aiux-services, or from either meta-package
// subpath of it (@servicenow/aiux/aiux-services, @servicenow/karuna/aiux-services).
const SERVICES_IMPORT_RE =
  /import\s*\{([^}]*)\}\s*from\s*['"]@servicenow\/(?:(?:aiux|karuna)\/)?aiux-services['"]/g;

function validateI18n(code, warnings, suggestions) {
  // Check for user-facing hardcoded strings in templates
  const hasTemplates = code.includes('html`');
  // Words per specifier, e.g. ['t'] or ['t', 'as', 'tr'].
  const servicesSpecifiers = Array.from(
    code.matchAll(SERVICES_IMPORT_RE),
    m => m[1]
  )
    .flatMap(list => list.split(','))
    .map(spec => spec.trim().split(/\s+/));
  // `t` is the i18n.getMessage shorthand; match it under its local name.
  const tLocalName = servicesSpecifiers.find(([name]) => name === 't')?.at(-1);
  const hasI18nImport =
    tLocalName !== undefined ||
    servicesSpecifiers.some(([name]) => name === 'i18n');
  const tCall =
    tLocalName &&
    new RegExp(String.raw`(?<![\w$.])${tLocalName.replaceAll('$', '\\$')}\(`);
  const hasI18nUsage =
    code.includes('i18n.getMessage') || (tCall && tCall.test(code));

  if (hasTemplates && !hasI18nImport) {
    warnings.push({
      title: 'Missing i18n Import',
      description:
        'Import i18n from @servicenow/aiux-services for internationalized strings.',
      fix: "Add an i18n import: `import {t}` or `import {i18n}` from '@servicenow/aiux-services'"
    });
  }

  if (hasI18nImport && !hasI18nUsage) {
    warnings.push({
      title: 'i18n Imported But Not Used',
      description:
        'i18n is imported but neither t() nor i18n.getMessage() is called. Wrap user-facing strings.'
    });
  }

  // Check for common hardcoded strings that should be i18n'd
  const hardcodedPatterns = [
    />\s*Loading\s*</,
    />\s*Error\s*</,
    />\s*No items?\s*(found)?\s*</,
    />\s*Save[d]?\s*</,
    />\s*Cancel\s*</,
    />\s*Submit\s*</,
    />\s*Delete\s*</,
    />\s*Retry\s*</
  ];

  if (hasTemplates && !hasI18nUsage) {
    for (const pattern of hardcodedPatterns) {
      if (pattern.test(code)) {
        suggestions.push({
          title: 'Hardcoded User-Facing String',
          description:
            'Wrap user-facing strings with i18n.getMessage() for internationalization.'
        });
        break;
      }
    }
  }
}

function validateLifecycle(code, issues, warnings, suggestions) {
  const hasConnectedCallback = code.includes('connectedCallback');
  const hasDisconnectedCallback = code.includes('disconnectedCallback');
  const hasAddEventListener = code.includes('addEventListener');
  const hasRemoveEventListener = code.includes('removeEventListener');
  const hasRecordWatcher =
    code.includes('recordWatcherService') || code.includes('subscribe(');
  const hasWindowListener = code.includes('window.addEventListener');

  // Check connectedCallback calls super
  if (hasConnectedCallback && !code.includes('super.connectedCallback()')) {
    issues.push({
      title: 'Missing super.connectedCallback()',
      description: 'connectedCallback must call super.connectedCallback().',
      fix: 'Add super.connectedCallback() as the first line.'
    });
  }

  // Check disconnectedCallback exists when needed
  if ((hasAddEventListener || hasRecordWatcher) && !hasDisconnectedCallback) {
    warnings.push({
      title: 'Missing disconnectedCallback',
      description:
        'Component adds event listeners or subscriptions but has no disconnectedCallback for cleanup.',
      fix: 'Add disconnectedCallback() to remove listeners and unsubscribe.'
    });
  }

  // Check disconnectedCallback calls super
  if (
    hasDisconnectedCallback &&
    !code.includes('super.disconnectedCallback()')
  ) {
    issues.push({
      title: 'Missing super.disconnectedCallback()',
      description:
        'disconnectedCallback must call super.disconnectedCallback().',
      fix: 'Add super.disconnectedCallback() as the first line.'
    });
  }

  // Check event listener cleanup
  if (hasWindowListener && !hasRemoveEventListener) {
    warnings.push({
      title: 'Window Listener Not Cleaned Up',
      description:
        'window.addEventListener used without matching removeEventListener in disconnectedCallback.',
      fix: 'Add removeEventListener in disconnectedCallback for each window listener.'
    });
  }

  // Check event handler binding
  const handlerPattern = /this\._\w+\s*=\s*this\._\w+\.bind\(this\)/;
  if (hasWindowListener && !handlerPattern.test(code)) {
    suggestions.push({
      title: 'Bind Event Handlers in Constructor',
      description:
        'Bind handlers in the constructor (e.g., this._handleResize = this._handleResize.bind(this)) so the same reference is used for add/removeEventListener.'
    });
  }

  // Check for recordWatcher cleanup
  if (
    hasRecordWatcher &&
    !code.includes('_unsub') &&
    !code.includes('unsubscribe')
  ) {
    warnings.push({
      title: 'Record Watcher Not Cleaned Up',
      description:
        'recordWatcherService subscription should be unsubscribed in disconnectedCallback.',
      fix: 'Store the unsubscribe function and call it in disconnectedCallback.'
    });
  }
}

export {validateComponent};

// CLI entry point — only runs when invoked directly
const isCLI =
  process.argv[1] &&
  (process.argv[1].endsWith('validate-component.js') ||
    process.argv[1].endsWith('validate-component'));

if (isCLI) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node validate-component.js <file-path>');
    process.exit(1);
  }

  try {
    const code = readFileSync(filePath, 'utf-8');
    const result = validateComponent(code);

    console.log('\n# AIUX Component Validation Report\n');

    if (result.issues.length === 0 && result.warnings.length === 0) {
      console.log('No issues found! Component follows AIUX best practices.\n');
    }

    if (result.issues.length > 0) {
      console.log('## Issues (Must Fix)\n');
      result.issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.title}`);
        console.log(`   ${issue.description}`);
        if (issue.fix) console.log(`   Fix: ${issue.fix}`);
        console.log();
      });
    }

    if (result.warnings.length > 0) {
      console.log('## Warnings\n');
      result.warnings.forEach((w, i) => {
        console.log(`${i + 1}. ${w.title}`);
        console.log(`   ${w.description}`);
        if (w.fix) console.log(`   Fix: ${w.fix}`);
        console.log();
      });
    }

    if (result.suggestions.length > 0) {
      console.log('## Suggestions\n');
      result.suggestions.forEach((s, i) => {
        console.log(`${i + 1}. ${s.title}`);
        console.log(`   ${s.description}\n`);
      });
    }

    console.log('---');
    console.log(
      `Issues: ${result.issues.length} | Warnings: ${result.warnings.length} | Suggestions: ${result.suggestions.length}`
    );

    process.exit(result.issues.length > 0 ? 1 : 0);
  } catch (err) {
    console.error(`Error reading file: ${err.message}`);
    process.exit(1);
  }
}
