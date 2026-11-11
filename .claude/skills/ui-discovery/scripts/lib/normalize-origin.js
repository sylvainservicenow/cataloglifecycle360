/**
 * @fileoverview One definition of "these two URLs are the same instance".
 *
 * Used by two independent checks that must not drift apart:
 *   - the manifest-vs-project check (was this index synced from the instance the
 *     project now develops against?) in generate-ui-discovery.js
 *   - the dev-vs-deploy check (does the now-sdk alias deploy points at match the
 *     instance dev — and therefore discovery — reads from?) in the sync
 *
 * Compared loosely on purpose: trailing slashes and loopback spellings are the
 * same instance, and flagging those would train people to ignore the warning.
 */

/**
 * Reduce a URL to a comparable identity: scheme and trailing slashes dropped,
 * loopback spellings folded to `localhost`, lowercased.
 *
 * @param {string} url
 * @returns {string}
 */
export function normalizeOrigin(url) {
  return String(url ?? '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/^https?:\/\//, '')
    .replace(/^127\.0\.0\.1(?=$|[:/])/, 'localhost')
    .replace(/^\[::1\](?=$|[:/])/, 'localhost')
    .toLowerCase();
}

/**
 * True when both URLs name the same instance. An absent value on either side is
 * "unknown", never a match — callers must treat unknown as "skip the check", not
 * as a divergence.
 *
 * @param {string|undefined} a
 * @param {string|undefined} b
 * @returns {boolean}
 */
export function sameInstance(a, b) {
  if (!a || !b) return false;
  return normalizeOrigin(a) === normalizeOrigin(b);
}
