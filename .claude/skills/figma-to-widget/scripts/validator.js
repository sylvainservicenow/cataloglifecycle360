/**
 * Phase 5: Widget Validator
 *
 * Checks generated code against AIUX widget standards.
 * Returns errors (must fix) and warnings (should fix).
 *
 * Usage: node validator.js <file-path>
 */

import {readFileSync} from 'fs';

const CHECKS = [
  // Errors — these MUST be present
  {
    regex: /static\s+properties\s*=/,
    msg: 'Missing static properties',
    level: 'error',
    shouldExist: true
  },
  {
    regex: /static\s+styles\s*=\s*css/,
    msg: 'Missing static styles',
    level: 'error',
    shouldExist: true
  },
  {
    regex: /constructor\(\)/,
    msg: 'Missing constructor',
    level: 'error',
    shouldExist: true
  },
  {
    regex: /super\(\)/,
    msg: 'Missing super() in constructor',
    level: 'error',
    shouldExist: true
  },
  {
    regex: /super\.connectedCallback\(\)/,
    msg: 'Missing super.connectedCallback()',
    level: 'error',
    shouldExist: true
  },
  {
    regex: /render\(\)/,
    msg: 'Missing render() method',
    level: 'error',
    shouldExist: true
  },

  // Warnings — best practices
  {
    // i18n.getMessage(), or its `t` shorthand imported from aiux-services
    // (directly or via the @servicenow/aiux / @servicenow/karuna subpath).
    regex:
      /i18n\.getMessage|import\s*\{[^}]*\bt\b[^}]*\}\s*from\s*['"]@servicenow\/(?:(?:aiux|karuna)\/)?aiux-services['"][\s\S]*(?<![\w$.])t\(/,
    msg: 'No t() or i18n.getMessage() calls — text should be internationalized',
    level: 'warning',
    shouldExist: true
  },
  {
    regex: /disconnectedCallback/,
    msg: 'Missing disconnectedCallback() — should clean up listeners',
    level: 'warning',
    shouldExist: true
  },
  {
    regex: /display:\s*block/,
    msg: ':host should have display: block',
    level: 'warning',
    shouldExist: true
  },
  {
    regex: /height:\s*100%/,
    msg: 'Should have height: 100% on :host or container',
    level: 'warning',
    shouldExist: true
  },
  {
    regex: /loading/,
    msg: 'No loading state handling',
    level: 'warning',
    shouldExist: true
  },

  // Anti-patterns — these should NOT be present
  {
    regex: /<path\s+d=/,
    msg: 'Contains inline SVG <path> — use <aiux-icon> instead',
    level: 'warning',
    shouldExist: false
  },
  {
    regex: /w-\[\d+px\]/,
    msg: 'Contains arbitrary width w-[Npx] — use Tailwind scale',
    level: 'warning',
    shouldExist: false
  },
  {
    regex: /h-\[\d+px\]/,
    msg: 'Contains arbitrary height h-[Npx] — use Tailwind scale',
    level: 'warning',
    shouldExist: false
  },
  {
    regex: /gap-\[\d+px\]/,
    msg: 'Contains arbitrary gap — use Tailwind scale',
    level: 'warning',
    shouldExist: false
  },
  {
    regex: /bg-\[#[0-9a-fA-F]+\]/,
    msg: 'Contains arbitrary bg color — use semantic class or CSS var',
    level: 'warning',
    shouldExist: false
  },
  {
    regex: /text-\[#[0-9a-fA-F]+\]/,
    msg: 'Contains arbitrary text color — use semantic class or CSS var',
    level: 'warning',
    shouldExist: false
  },
  {
    regex: /console\.log\(/,
    msg: 'Contains console.log — remove for production',
    level: 'info',
    shouldExist: false
  }
];

export function validateWidget(code) {
  const errors = [];
  const warnings = [];
  const info = [];

  for (const check of CHECKS) {
    const found = check.regex.test(code);
    const fail = check.shouldExist ? !found : found;

    if (fail) {
      if (check.level === 'error') errors.push(check.msg);
      else if (check.level === 'warning') warnings.push(check.msg);
      else info.push(check.msg);
    }
  }

  // Extra checks
  const classMatch = code.match(/export\s+class\s+(\w+)/);
  if (!classMatch) {
    errors.push('No exported class found');
  }

  // Check for duplicate constructor
  const constructorCount = (code.match(/constructor\(\)/g) || []).length;
  if (constructorCount > 1) {
    errors.push('Duplicate constructor() methods');
  }

  // Check sys_id format
  const sysIdMatch = code.match(/@ExplicitSysId\(['"]([^'"]+)['"]\)/);
  if (sysIdMatch) {
    const id = sysIdMatch[1];
    if (!/^[0-9a-f]{32}$/.test(id)) {
      warnings.push(
        `@ExplicitSysId should be 32 lowercase hex chars, got: "${id}"`
      );
    }
  }

  return {
    errors,
    warnings,
    info,
    passed: errors.length === 0,
    score: Math.max(
      0,
      100 - errors.length * 15 - warnings.length * 5 - info.length * 1
    )
  };
}

// CLI entry point — only runs when invoked directly
const isCLI =
  process.argv[1] &&
  (process.argv[1].endsWith('validator.js') ||
    process.argv[1].endsWith('validator'));

if (isCLI) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node validator.js <file-path>');
    process.exit(1);
  }

  const code = readFileSync(filePath, 'utf-8');
  const result = validateWidget(code);

  if (result.errors.length)
    result.errors.forEach(e => console.error(`✗ ERROR: ${e}`));
  if (result.warnings.length)
    result.warnings.forEach(w => console.warn(`⚠ WARNING: ${w}`));
  if (result.info.length) result.info.forEach(i => console.log(`ℹ INFO: ${i}`));

  console.log(
    `\nScore: ${result.score}/100 — ${result.passed ? '✓ PASSED' : '✗ FAILED'}`
  );
  process.exit(result.passed ? 0 : 1);
}
