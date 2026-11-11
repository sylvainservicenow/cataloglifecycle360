/**
 * @fileoverview Turn a `sys_aix_widget` row into the fields the index and the
 * generated reference need, and locate the widget's authored source.
 *
 * Nothing here derives an API. The wire-up contract comes from the authored
 * source, fetched per widget on demand — see extractAuthoredSource below.
 *
 * Two authoring paths produce structurally different records:
 *
 *   SDK-built        `component` is terser-minified; `input_schema` populated
 *                    from the AST analyzer; `sourcemap` non-empty.
 *   instance-authored `component` is readable source; `input_schema` is an empty
 *                    JSON Schema; `sourcemap` empty.
 *
 * Neither path is complete on its own, so every extractor below has a fallback.
 */

/**
 * The authored source of a widget, as written by its author (§13).
 *
 *   SDK-built        `sourcemap.sourcesContent[i]` where `sources[i]` is not
 *                    under node_modules. `component` is minified; this is not.
 *   instance-authored no sourcemap, but `component` was never minified — it IS
 *                    the original.
 *
 * This is ground truth, so it replaces derived API extraction at wire-up time.
 * Returns `{files: [{path, content}], from}`; `from === 'component-minified'`
 * marks the degraded case a caller should warn about.
 */
export function extractAuthoredSource(record) {
  const sourcemap = parseJson(record.sourcemap);
  const sources = sourcemap?.sources;
  const contents = sourcemap?.sourcesContent;

  if (Array.isArray(sources) && Array.isArray(contents)) {
    const files = [];
    for (const [i, sourcePath] of sources.entries()) {
      // node_modules is a proxy for "not the author's code" — good, not exact.
      // A widget importing ../shared/foo.js counts as own, which is intended.
      if (isDependencyPath(sourcePath)) continue;
      const content = contents[i];
      if (typeof content === 'string' && content.length) {
        files.push({path: sourcePath, content});
      }
    }
    if (files.length) return {files, from: 'sourcemap'};
  }

  const component = record.component ?? '';
  if (!component) return {files: [], from: 'none'};

  // No sourcemap. For an instance-authored widget that is expected and the
  // component is already authored source; for an SDK-built one it means
  // sourcesContent went missing upstream, which is worth a warning.
  return {
    files: [{path: '(component field)', content: component}],
    from:
      detectOrigin(record) === 'sdk-built' ? 'component-minified' : 'component'
  };
}

function isDependencyPath(sourcePath) {
  return sourcePath.includes('node_modules');
}

/**
 * Append the widget's server script to its authored source, when it has one.
 *
 * The server script is the CONTRACT for `this.server.get(input)`: which `input`
 * keys it reads, and what shape it writes back into `data`. The client source
 * alone cannot express that, so an agent wiring the widget up has to guess —
 * and a guessed action (`{action: 'approve'}` against a script that only reads
 * `input.limit`) round-trips successfully while doing nothing at all. Knowing
 * only that a server script EXISTS, which is all the index carries, is not
 * enough to use it.
 *
 * It lives in the record's `script` column, not in the sourcemap, so it has to
 * be attached separately. Widgets without one are unaffected.
 */
export function withServerScript(authoredSource, record) {
  const script = record.script ?? '';
  if (!hasServerScript(script)) return authoredSource;
  return {
    ...authoredSource,
    files: [...authoredSource.files, {path: '(server script)', content: script}]
  };
}

/** Widgets whose `component` was produced by the SDK build carry a sourcemap. */
export function detectOrigin(record) {
  const compileMeta = parseJson(record.component_compile_metadata) ?? {};
  const hasSourcemap = (record.sourcemap ?? '').length > 0;
  // The fixture drops `sourcemap` for size and keeps the byte count instead.
  const hasSourcemapBytes = (record._sourcemap_bytes ?? 0) > 0;
  const built = hasSourcemap || hasSourcemapBytes || Boolean(compileMeta.asset);
  return built ? 'sdk-built' : 'instance-authored';
}

function parseJson(value) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/**
 * Every widget gets a `script` field, and the SDK writes a stub IIFE with an
 * empty body into widgets that have no server script at all. A non-zero length
 * therefore proves nothing — the body has to be inspected.
 */
export function hasServerScript(script) {
  if (!script) return false;
  const body = script.match(
    /\(\s*function\s*\([^)]*\)\s*\{([\s\S]*)\}\s*\)\s*\(/
  )?.[1];
  // Unrecognized wrapper: fall back to treating any content as a real script.
  if (body === undefined) return script.trim().length > 0;
  return body.trim().length > 0;
}

/**
 * Everything the index and the generated reference need about one widget.
 *
 * Deliberately does NOT derive an API. This once extracted props, events,
 * methods and slots from source with regex heuristics, to render an API table in
 * the reference. That table was removed (§14.4) because a derived table can be
 * confidently wrong — it reported unmarked helpers as public API and could not
 * say how anything behaved — and the authored source is fetched on demand
 * anyway. Nothing consumed the extracted fields afterwards, so they are gone:
 * dead heuristics with known false positives are worse than none.
 *
 * @param record  a `sys_aix_widget` row
 * @param scopePrefix  resolved `sys_scope.scope` — NOT derivable from the app
 *   name, which truncates at 18 chars (§11.6)
 */
export function summarizeWidget(record, scopePrefix) {
  return {
    key: `${scopePrefix}.${record.id}`,
    scope: scopePrefix,
    tag: record.id,
    name: record.name || record.id,
    description: record.description || '',
    bestFor: record.best_for || '',
    category: record.category,
    origin: detectOrigin(record),
    importSpecifier: `@servicenow/glide-widgets/${scopePrefix}/${record.id}`,
    dependentWidgetIds: splitList(record.dependent_widget_ids),
    // Sync precomputes this and drops the raw `script` from the manifest, so
    // prefer the derived flag — `??` not `||`, so a precomputed `false` is
    // honored rather than falling through. The fallback covers the fixture
    // path, which still carries full records.
    hasServerScript:
      record._has_server_script ?? hasServerScript(record.script),
    chatCompatible: record.chat_compatible === 'true',
    roles: splitList(record.roles)
  };
}

function splitList(value) {
  return (value ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}
