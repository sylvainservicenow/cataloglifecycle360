/**
 * @fileoverview Turn a raw now-sdk/network failure into ONE sanitized reason
 * string the agent can repeat verbatim.
 *
 * Shared by both instance gates (§5.5): the catalog sync (all widgets) and the
 * per-widget source fetch (§14). Both must degrade — never block page work — and
 * must expose only a short reason, never raw output, commands, tokens or stacks.
 *
 * The `subject` distinguishes the two gates in the message without changing the
 * classification: "the widget query" for sync, "that widget's authored source"
 * for fetch.
 *
 * SANITIZATION RULE: the raw output is matched against, never echoed. The only
 * text ever interpolated from it is a now-sdk alias NAME, which the user chose
 * and which carries no secret. Credentials, hostnames from stack traces, and
 * response bodies must never reach the returned string.
 */

/** Status codes are matched from our own `failed with status NNN` format when
 * present, and by bare word otherwise — a loose `\b401\b` alone would match a
 * sys_id or timestamp that happens to contain those digits. */
const statusMatch = (output, codes) =>
  new RegExp(`status\\s+(?:${codes})\\b`, 'i').test(output) ||
  new RegExp(`\\b(?:${codes})\\b(?=\\s|$|[^0-9])`, 'i').test(output);

/**
 * @param {Error & {stdout?: string, stderr?: string}} error
 * @param {{origin: string}} target   the instance the project develops against
 * @param {string|undefined} auth     the now-sdk alias in play, if any
 * @param {string} subject            what failed, e.g. 'the widget query'
 * @returns {string} a single sanitized reason line (no raw output)
 */
export function classifyInstanceError(
  error,
  target,
  auth,
  subject = 'the widget query'
) {
  const output = [error.stdout, error.stderr, error.message]
    .filter(Boolean)
    .join('\n');
  // Callers always pass an origin, but a missing one must not render as
  // "rejected by undefined" — that reads like a bug in the message, not a
  // description of the failure.
  const origin = target?.origin;
  const where = origin ? ` at ${origin}` : '';

  const missingAlias = output.match(
    /Could not find stored credentials for alias:\s*([^,\n]+)/i
  );
  if (missingAlias) {
    return `the configured now-sdk auth alias "${missingAlias[1].trim()}" has no stored credentials`;
  }

  if (
    statusMatch(output, '401|403') ||
    /unauthorized|forbidden|authentication failed|invalid credentials/i.test(
      output
    )
  ) {
    return `authentication was rejected${origin ? ` by ${origin}` : ''}`;
  }

  // now-sdk itself is absent. Much more likely since the query runs under
  // `npx --no`, which fails fast instead of silently downloading an unpinned
  // now-sdk mid-sync. Without its own category this lands in the generic
  // bucket, which points the reader at the instance — the wrong place entirely.
  if (
    /could not determine executable to run|npm error 404|command not found|ENOENT/i.test(
      output
    )
  ) {
    // Name the remedy, not just the symptom. This fires most often on a project
    // whose dependencies have never been installed — common in an IDE where the
    // first thing someone does is ask for UI — and the generic guidance that
    // follows ("check the instance, network, VPN, credentials") would send them
    // to four places that are all fine.
    return 'the now-sdk command is not available in this project — its dependencies are not installed yet, so running `pnpm install` (or starting the dev server, which installs them) enables widget discovery';
  }

  // The alias path cannot page, so it refuses to write a truncated catalog
  // rather than making false "no such widget" claims later. Nothing is wrong
  // with the instance or the credential, and saying so avoids a pointless hunt.
  if (/more than \d+ rows/i.test(output)) {
    return 'the widget catalog is larger than the now-sdk query path can return in one page, so the previous snapshot was kept rather than a partial one';
  }

  // Corporate/dev instances behind a proxy or with a self-signed certificate
  // are common, and the fix (trust the certificate) is unrelated to anything
  // else here.
  if (
    /self[- ]signed|CERT_|ERR_TLS|UNABLE_TO_VERIFY|DEPTH_ZERO/i.test(output)
  ) {
    return `the TLS certificate presented${origin ? ` by ${origin}` : ''} could not be verified`;
  }

  if (/ECONNREFUSED|connection refused/i.test(output)) {
    return `the configured instance${where} refused the connection`;
  }
  if (/ENOTFOUND|getaddrinfo/i.test(output)) {
    return `the configured instance hostname${where} could not be resolved`;
  }
  // A connection that opened and then died mid-request — VPN drop, proxy reset,
  // instance restart. Distinct from "refused": the host is reachable.
  if (/ECONNRESET|EPIPE|socket hang ?up/i.test(output)) {
    return `the connection${where} was closed before the response completed`;
  }
  if (/ETIMEDOUT|timed? out/i.test(output)) {
    return `the configured instance${where} did not respond before the timeout`;
  }
  // 5xx: the instance answered, so the target and credential are fine. Dev
  // instances that are asleep, starting, or mid-upgrade land here.
  if (statusMatch(output, '500|502|503|504')) {
    return `the instance${where} returned a server error — it may be starting up or unavailable`;
  }

  if (auth) return `${subject} failed while using now-sdk auth alias "${auth}"`;
  return `${subject}${origin ? ` to ${origin}` : ''} failed for an unclassified reason`;
}
