/**
 * @fileoverview Resolve WHERE widget queries go, and run them — one place, so
 * the stamped instance and the queried instance can never disagree (known-gap
 * #1).
 *
 * Discovery follows the DEV SERVER's configuration, deliberately. Both CLIs
 * (`aiux dev` and `now-sdk run dev`) funnel through `serve()` in
 * core/sdk/src/serve.js, which resolves instance and credential with precedence
 * `env var > aiux.json development > value passed in by the caller` — the
 * caller's alias-derived value being the LOWEST priority. Reading the same
 * files in the same order is what makes the widgets we index the widgets the
 * running app actually serves.
 *
 * Two modes, chosen by what the PROJECT configures:
 *
 *   direct — the project sets both an instance (`GLIDE_ORIGIN` / `aiux.json`
 *            `development.glideOrigin`) AND a credential (`AUTH_TOKEN`, or a
 *            now-sdk session pair `X_USER_TOKEN` + `DEV_COOKIE`). We hit the
 *            Table API ourselves with that origin + credential. The instance we
 *            query IS the instance we stamp — mismatch is structurally
 *            impossible, and it is the same instance `pnpm dev` talks to.
 *
 *   alias  — the project configures no usable credential and the environment is
 *            not in now-sdk's CI mode either. Fall back to the now-sdk alias,
 *            which carries its own host + credential globally. This is the
 *            only way to reach an instance in a zero-config consumer, but note
 *            it is NOT necessarily dev's instance: if the project declares an
 *            origin we could not authenticate against, we are reading
 *            somewhere else and say so. Callers surface that via
 *            `resolveDeployTarget()` (see below).
 *
 * Before falling to alias mode, direct mode also recognizes `SN_SDK_*` CI
 * credentials (`SN_SDK_INSTANCE_URL`/`SN_SDK_USER`/`SN_SDK_USER_PWD` gated on
 * `SN_SDK_NODE_ENV=SN_SDK_CI_INSTALL`) — the SDK's own non-interactive auth
 * path, checked by now-sdk itself ahead of the stored alias for every command.
 * A host app that logs in once and hands that session to every shell it spawns
 * (rather than writing `.env`/`aiux.json`) shows up this way; without
 * recognizing it, discovery would fall to an unrelated machine-default alias
 * even though `now-sdk run dev` itself would not.
 *
 * Credential handling: credentials are read only to build request headers at
 * query time. They are NEVER returned in provenance, logged, or written to
 * disk. The `.env`/`aiux.json` token format is a ready-to-use header value
 * (`Basic <base64>` / bearer), used verbatim — same contract as the framework's
 * config-loader and proxy.
 */
import {execFile} from 'child_process';
import {readFile} from 'fs/promises';
import {existsSync} from 'fs';
import {join} from 'path';
import {promisify} from 'util';

const run = promisify(execFile);

const DEFAULT_ORIGIN = 'http://localhost:8080';

/** Per-page timeout for a direct Table API read. */
const DIRECT_TIMEOUT_MS = 30_000;
/** Whole-command timeout for `now-sdk query` (spawns npx + node, so looser). */
const SDK_QUERY_TIMEOUT_MS = 60_000;
/** Whole-command timeout for the local `now-sdk auth --list` read. */
const AUTH_LIST_TIMEOUT_MS = 15_000;

/**
 * Direct pagination has no row ceiling by design, but a query that somehow
 * matches the whole table should be visible rather than silently accumulating.
 */
const LARGE_RESULT_WARN_AT = 5_000;

/**
 * Minimal `.env` reader — we cannot depend on `dotenv` being installed in an
 * arbitrary consumer. Mirrors the dotenv behaviors the framework's config-loader
 * relies on: `export KEY=VALUE`, surrounding quotes, and inline `#` comments on
 * unquoted values. Returns {} if the file is absent or unreadable.
 */
async function readEnvFile(path) {
  if (!existsSync(path)) return {};
  let text;
  try {
    text = await readFile(path, 'utf8');
  } catch {
    return {};
  }
  const out = {};
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim().replace(/^export\s+/, '');
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
      value = value.slice(1, -1);
    } else {
      // Unquoted: an inline comment starts at the first ` #`. A bare `#` with no
      // preceding space is a legal value character (e.g. a fragment or colour).
      const comment = value.search(/\s#/);
      if (comment !== -1) value = value.slice(0, comment).trim();
    }
    if (key) out[key] = value;
  }
  return out;
}

/**
 * Load `.env`, then the per-instance `.env.N` override when `AIUX_INSTANCE` is
 * set — the same two-step the framework's config-loader performs
 * (config-loader.js §loadConfig). Without this, a developer running a second
 * instance via `.env.1` would have discovery read a different origin than the
 * dev server they are looking at.
 *
 * `process.env` still wins over both, matching dotenv's non-overriding default.
 */
async function readProjectEnv(cwd) {
  const base = await readEnvFile(join(cwd, '.env'));
  const instance = Number(process.env.AIUX_INSTANCE ?? base.AIUX_INSTANCE ?? 0);
  if (!Number.isFinite(instance) || instance <= 0) return base;
  const override = await readEnvFile(join(cwd, `.env.${instance}`));
  return {...base, ...override};
}

/**
 * Build the request headers for a direct read from whichever credential shape
 * the project configured.
 *
 * Two shapes, both accepted by the framework (config-loader.js): a verbatim
 * `Authorization` value, or a now-sdk session pair (`X-UserToken` + session
 * cookie) which is what a developer authenticated through the SDK actually has.
 * Supporting only the former is why session-authenticated projects used to fall
 * back to alias mode and read a possibly different instance.
 */
function credentialHeaders(credential) {
  if (credential?.type === 'authorization') {
    return {Authorization: credential.token};
  }
  if (credential?.type === 'session') {
    return {'X-UserToken': credential.xUserToken, Cookie: credential.devCookie};
  }
  return {};
}

/**
 * Resolve the instance + (optional) credential the project is configured for.
 *
 * Precedence mirrors the framework's config-loader: env vars (including
 * `.env`/`.env.N`) first, then the `aiux.json` development block.
 *
 * @param {{cwd: string, auth?: string}} opts
 * @returns {Promise<{mode:'direct'|'alias', origin:string, from:string,
 *   credentialFrom?:string, declaredOrigin?:string, auth?:string,
 *   _credential?:object}>}
 *   `from` names where the ORIGIN was found; `credentialFrom` names where the
 *   CREDENTIAL was found — they are frequently different files and must not be
 *   used interchangeably in messages. `credentialFrom` is a field name only,
 *   never a value; `_credential` is present only in direct mode and must never
 *   be persisted/logged. `declaredOrigin` is what the project declared, whether or
 *   not we could authenticate against it — callers compare it to report an
 *   alias-mode read that landed somewhere other than dev's instance.
 */
export async function resolveInstanceSource({cwd, auth}) {
  const env = await readProjectEnv(cwd);

  let origin = process.env.GLIDE_ORIGIN || env.GLIDE_ORIGIN;
  let originFrom = process.env.GLIDE_ORIGIN
    ? 'GLIDE_ORIGIN'
    : env.GLIDE_ORIGIN
      ? '.env GLIDE_ORIGIN'
      : undefined;

  // Credential: env/.env first, then aiux.json development — same fields and
  // order the framework reads (config-loader.js).
  //
  // Tracked separately from `originFrom`: the two can come from different files
  // (origin in .env, token in aiux.json, or the reverse), and a failure message
  // that names the origin's file when the CREDENTIAL was rejected sends the
  // reader to the one field that cannot be the cause.
  let token = process.env.AUTH_TOKEN || env.AUTH_TOKEN;
  let credentialFrom = process.env.AUTH_TOKEN
    ? 'AUTH_TOKEN'
    : env.AUTH_TOKEN
      ? '.env AUTH_TOKEN'
      : undefined;
  let xUserToken = process.env.X_USER_TOKEN || env.X_USER_TOKEN;
  let devCookie = process.env.DEV_COOKIE || env.DEV_COOKIE;

  const aiuxJson = join(cwd, 'aiux.json');
  if (existsSync(aiuxJson)) {
    try {
      const dev =
        JSON.parse(await readFile(aiuxJson, 'utf8'))?.development ?? {};
      if (!origin && dev.glideOrigin) {
        origin = dev.glideOrigin;
        originFrom = 'aiux.json development.glideOrigin';
      }
      if (!token && dev.token) {
        token = dev.token;
        credentialFrom = 'aiux.json development.token';
      }
      if (!xUserToken && dev.xUserToken) xUserToken = dev.xUserToken;
      if (!devCookie && dev.devCookie) devCookie = dev.devCookie;
    } catch {
      // Malformed aiux.json — treat as no config, fall through to alias mode.
    }
  }

  // SN_SDK_* CI credentials (docs/configuration/ci-integration.md in
  // @servicenow/sdk) — the SDK's own non-interactive auth path. It is not
  // install-only: @servicenow/sdk-cli's shared credentialProvider checks these
  // vars ahead of the stored alias for every now-sdk command, including
  // `run dev`. So a project that is already in CI mode — a pipeline, or a
  // host app that logs in once and hands the session to every shell it spawns
  // (the AIUX Lab desktop client does this) — has effectively already
  // committed to this instance via now-sdk itself. Missing this here would
  // fall through to whatever alias happens to be the machine's unrelated
  // default, even though `now-sdk` would not.
  //
  // Only fills the gap when nothing more specific already supplied an origin
  // or credential: this is one atomic triple from a single source, not a
  // field to merge piecemeal with `.env`/`aiux.json` the way individual keys
  // are above.
  if (
    !origin &&
    !token &&
    !(xUserToken && devCookie) &&
    process.env.SN_SDK_NODE_ENV === 'SN_SDK_CI_INSTALL'
  ) {
    const sdkInstanceUrl = process.env.SN_SDK_INSTANCE_URL;
    const sdkUser = process.env.SN_SDK_USER;
    const sdkPassword = process.env.SN_SDK_USER_PWD;
    if (sdkInstanceUrl && sdkUser && sdkPassword) {
      origin = sdkInstanceUrl;
      originFrom = 'SN_SDK_INSTANCE_URL';
      token = `Basic ${Buffer.from(`${sdkUser}:${sdkPassword}`).toString('base64')}`;
      credentialFrom = 'SN_SDK_USER + SN_SDK_USER_PWD';
    }
  }

  const credential = token
    ? {type: 'authorization', token}
    : xUserToken && devCookie
      ? {type: 'session', xUserToken, devCookie}
      : undefined;

  // Name the credential SHAPE for the session pair, not a single field: the two
  // halves can come from different places, and the two shapes fail differently
  // (a session expires, a static token does not) — worth seeing in the header.
  if (credential?.type === 'session') {
    credentialFrom = 'X_USER_TOKEN + DEV_COOKIE';
  }

  // Direct mode requires BOTH an instance and a credential: a configured
  // glideOrigin with no credential cannot authenticate a direct fetch, so a
  // partial config falls back to alias rather than failing confusingly.
  if (origin && credential) {
    return {
      mode: 'direct',
      origin,
      from: originFrom,
      credentialFrom,
      declaredOrigin: origin,
      _credential: credential
    };
  }

  // Alias mode: the now-sdk alias carries the host we actually reach. `origin`
  // here is display-only and may not be where the alias points; `declaredOrigin`
  // preserves what the project asked for so the caller can report the gap.
  return {
    mode: 'alias',
    origin: origin ?? DEFAULT_ORIGIN,
    from: originFrom ?? 'default',
    declaredOrigin: origin,
    auth
  };
}

/**
 * Resolve the instance `now-sdk deploy` would install to.
 *
 * Deploy takes its target ONLY from a now-sdk alias — `-a`, else the global
 * default set by the last `now-sdk auth --use` anywhere on this machine. It has
 * never heard of `.env`/`aiux.json`, so it can point somewhere other than the
 * instance dev (and therefore discovery) reads from. Nothing binds the two
 * today; the most we can do is surface the divergence.
 *
 * Local only — reads the credential store, never the network.
 *
 * KNOWN BRITTLENESS: `auth --list` has no `-o json`, so this scrapes
 * human-readable output. Any parse failure returns `null`, which callers MUST
 * treat as "unknown, skip the check" and never as a divergence. A stable
 * `--list -o json` would turn this into a contract.
 *
 * @param {{cwd: string, auth?: string}} opts
 * @returns {Promise<{alias: string, host: string}|null>}
 */
export async function resolveDeployTarget({cwd, auth}) {
  let stdout;
  try {
    ({stdout} = await run('npx', ['--no', 'now-sdk', 'auth', '--list'], {
      cwd,
      timeout: AUTH_LIST_TIMEOUT_MS
    }));
  } catch {
    // now-sdk absent, no credential store, or the command failed. Unknown.
    return null;
  }

  const aliases = [];
  let current;
  for (const rawLine of String(stdout).split('\n')) {
    const line = rawLine.trim();
    // `*[alias]` — the leading star marks the default in some versions, the
    // trailing `default = Yes` line in others. Accept either signal.
    const header = line.match(/^\*?\[(.+)\]$/);
    if (header) {
      current = {
        alias: header[1].trim(),
        host: '',
        isDefault: line.startsWith('*')
      };
      aliases.push(current);
      continue;
    }
    if (!current) continue;
    const field = line.match(/^([a-z_]+)\s*=\s*(.+)$/i);
    if (!field) continue;
    const [, key, value] = field;
    if (key.toLowerCase() === 'host') current.host = value.trim();
    if (key.toLowerCase() === 'default' && /^yes$/i.test(value.trim())) {
      current.isDefault = true;
    }
  }

  const selected = auth
    ? aliases.find(entry => entry.alias === auth)
    : aliases.find(entry => entry.isDefault);
  if (!selected?.host) return null;
  return {alias: selected.alias, host: selected.host};
}

/**
 * Turn a direct-fetch failure into an Error whose message carries the tokens
 * `classify-instance-error.js` matches on (status codes / network codes), so
 * both modes classify identically.
 */
function directError(message) {
  return new Error(message);
}

/**
 * Dig the OS-level error code out of whatever shape `fetch` threw.
 *
 * Three nestings occur in practice:
 *   err.code                          — rare, direct
 *   err.cause.code                    — single-address host
 *   err.cause.errors[i].code          — multi-address host (AggregateError),
 *                                       e.g. localhost resolving to ::1 and
 *                                       127.0.0.1
 * Falls back to the cause's message text so an unrecognized shape still carries
 * something the classifier can match, rather than an empty string.
 */
function networkCode(error) {
  const cause = error.cause;
  const nested = Array.isArray(cause?.errors)
    ? cause.errors.find(entry => entry?.code)?.code
    : undefined;
  return error.code ?? cause?.code ?? nested ?? cause?.message ?? '';
}

/**
 * Run one query against `table` in whichever mode `source` selected. Returns
 * `{records, hasMore}` with identical shape in both modes.
 *
 * Direct mode paginates through the whole result set (`limit` is the per-page
 * size, not a ceiling), so there is no row cliff — `hasMore` is always false.
 * Pass `paginate: false` for a point query (`sys_id=…`) to skip the extra
 * round-trip the pager would otherwise spend confirming there is no page 2.
 * Alias mode still throws when the result is truncated at `limit`: now-sdk is
 * the source of truth there and we do not drive its paging, so a partial catalog
 * would make false "no such widget" claims and callers preserve the prior
 * snapshot instead.
 *
 * @param {{source:object, cwd:string, table:string, query:string,
 *   fields?:string[], limit?:number, paginate?:boolean}} opts
 */
export async function queryTable({
  source,
  cwd,
  table,
  query,
  fields,
  limit = 500,
  paginate = true
}) {
  if (source.mode === 'direct') {
    return queryDirect({source, table, query, fields, limit, paginate});
  }
  return queryViaSdk({source, cwd, table, query, fields, limit, paginate});
}

/**
 * One page of a direct Table API read. Kept separate so the pagination loop can
 * apply the per-page timeout and error classification uniformly. Returns the
 * parsed `{records, total}` where `total` is the instance's `x-total-count`
 * (NaN if the header is absent).
 */
async function fetchDirectPage({source, table, query, fields, limit, offset}) {
  const url = new URL(`/api/now/table/${table}`, source.origin);
  url.searchParams.set('sysparm_query', query);
  if (fields) url.searchParams.set('sysparm_fields', fields.join(','));
  url.searchParams.set('sysparm_limit', String(limit));
  url.searchParams.set('sysparm_offset', String(offset));
  url.searchParams.set('sysparm_exclude_reference_link', 'true');
  url.searchParams.set('sysparm_display_value', 'false');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DIRECT_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, {
      headers: {
        ...credentialHeaders(source._credential),
        Accept: 'application/json'
      },
      signal: controller.signal
    });
  } catch (error) {
    // Network layer. Surface cause.code (ECONNREFUSED/ENOTFOUND/…) into the
    // message so the shared classifier recognizes it; AbortError → "timed out".
    if (error.name === 'AbortError') {
      throw directError(`request to ${source.origin} timed out`);
    }
    // Node's fetch reports a connection failure as `TypeError: fetch failed`
    // with the real code buried in `cause`. When a host resolves to several
    // addresses the cause is an AggregateError and the code is one level deeper
    // still, in `cause.errors[]` — reading only `cause.code` there yields an
    // empty string, so ECONNREFUSED (the single most common failure) came out
    // as "unclassified".
    throw directError(
      `request to ${source.origin} failed ${networkCode(error)}`.trim()
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    // Status in the message → classifier maps 401/403 to "authentication
    // rejected". Body is intentionally NOT read into the error (could echo
    // sensitive detail); the status alone is enough to classify.
    throw directError(
      `request to ${source.origin} failed with status ${response.status}`
    );
  }

  const payload = await response.json();
  // Absent/empty header must be NaN, not 0: `Number(null)` is 0, which is
  // finite and would make the pager treat "no total" as "zero rows" and stop
  // after the first page. `'0'` (a real zero-result count) stays truthy.
  const totalHeader = response.headers.get('x-total-count');
  return {
    records: payload.result ?? [],
    total: totalHeader ? Number(totalHeader) : NaN
  };
}

async function queryDirect({source, table, query, fields, limit, paginate}) {
  const pageSize = limit;
  const all = [];
  let offset = 0;
  let warned = false;

  // Page until we've read every matching row. `ORDERBYname` in the widget query
  // gives a stable ordering across pages; a concurrent edit mid-sync can still
  // skew a boundary, which is acceptable for a best-effort catalog snapshot.
  for (;;) {
    const {records, total} = await fetchDirectPage({
      source,
      table,
      query,
      fields,
      limit: pageSize,
      offset
    });
    all.push(...records);

    // A point query asked for one specific row; there is no page 2 to look for.
    // Without this, a missing x-total-count forces a second request just to see
    // an empty page — on the per-widget freshness probe, that doubles the cost
    // of the hottest call in the skill.
    if (!paginate) break;

    // Prefer the authoritative total; fall back to "a short page means the end"
    // when the header is absent. An empty page always terminates so a missing
    // total can never spin forever.
    if (Number.isFinite(total)) {
      if (all.length >= total) break;
    } else if (records.length < pageSize) {
      break;
    }
    if (records.length === 0) break;

    if (!warned && all.length >= LARGE_RESULT_WARN_AT) {
      // No ceiling by design, but an unexpectedly huge result is worth seeing
      // rather than silently accumulating in memory.
      console.warn(
        `   ⚠ ${table}: ${all.length}+ rows and still paging — check the query`
      );
      warned = true;
    }
    offset += pageSize;
  }

  return {records: all, hasMore: false};
}

/** One page of a `now-sdk query`. Returns the parsed payload. */
async function fetchSdkPage({
  source,
  cwd,
  table,
  query,
  fields,
  limit,
  offset
}) {
  // `--no` (npm's no-install form) keeps npx from silently DOWNLOADING now-sdk
  // when the project does not depend on it: that would be an unannounced
  // network fetch of an unpinned version in the middle of a read-only sync.
  // Absent now-sdk should fail fast and classify, not self-heal.
  const argv = ['--no', 'now-sdk', 'query', table, '-q', query, '-o', 'json'];
  if (fields) argv.push('-f', fields.join(','));
  if (source.auth) argv.push('-a', source.auth);
  argv.push('--limit', String(limit));
  if (offset) argv.push('--offset', String(offset));

  let stdout;
  try {
    ({stdout} = await run('npx', argv, {
      cwd,
      maxBuffer: 64 * 1024 * 1024,
      // Without a timeout a hung now-sdk hangs the whole sync forever — and the
      // classifier's "did not respond before the timeout" branch was
      // unreachable from this mode.
      timeout: SDK_QUERY_TIMEOUT_MS
    }));
  } catch (error) {
    if (error.killed) {
      throw new Error(
        `the widget query timed out after ${SDK_QUERY_TIMEOUT_MS}ms`
      );
    }
    throw error;
  }

  // npx can print notices on stdout ahead of the payload; parse from the first
  // brace so an update notice surfaces as a real failure, not a SyntaxError.
  const text = String(stdout);
  const start = text.indexOf('{');
  if (start === -1) throw new Error(`query for ${table} returned no JSON`);
  const payload = JSON.parse(text.slice(start));
  if (!payload.ok) throw new Error(`query failed for ${table}`);
  return payload;
}

/**
 * Alias mode, paged.
 *
 * This used to issue one query and THROW when now-sdk reported `hasMore`,
 * refusing to write a truncated catalog — fail-safe, but a hard cliff that
 * direct mode does not have. Whether the catalog paginated therefore depended
 * on how the project happened to be configured, which is the worse half of the
 * problem: alias mode is the path a zero-config SDK consumer actually uses.
 *
 * `now-sdk query` exposes `--limit`/`--offset`, so paging is driven the same way
 * as direct mode. `hasMore` is now advisory — a short page, an empty page, or a
 * cleared `hasMore` all end the walk. Each page is an `npx` spawn, so `limit` is
 * a page SIZE and should stay large.
 */
async function queryViaSdk({
  source,
  cwd,
  table,
  query,
  fields,
  limit,
  paginate
}) {
  const pageSize = limit;
  const all = [];
  let offset = 0;

  for (;;) {
    const payload = await fetchSdkPage({
      source,
      cwd,
      table,
      query,
      fields,
      limit: pageSize,
      offset
    });
    const records = payload.records ?? [];
    all.push(...records);

    // A point query asked for one specific row; there is no page 2.
    if (paginate === false) break;
    // A short page ends the walk, and an empty page always terminates so a
    // `hasMore` that never clears cannot spin forever.
    if (records.length < pageSize || records.length === 0) break;
    if (payload.hasMore === false) break;

    if (all.length >= LARGE_RESULT_WARN_AT) {
      console.warn(
        `   ⚠ ${table}: ${all.length}+ rows and still paging — check the query`
      );
    }
    offset += pageSize;
  }

  return {records: all, hasMore: false};
}
