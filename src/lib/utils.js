/**
 * Shared utility functions.
 *
 * Pure functions with no DOM side-effects. Import individually to keep
 * bundle size minimal.
 */

/**
 * Format an ISO date string for display.
 *
 * @param {string|null|undefined} iso - ISO date string (e.g. "2025-06-01T00:00:00Z")
 * @param {string} [locale='en-AU'] - BCP 47 locale tag
 * @returns {string} Formatted date string, or '—' if the input is falsy or invalid
 *
 * @example
 * formatDate('2025-06-01'); // → '01 Jun 2025'
 */
export function formatDate(iso, locale = 'en-AU') {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Escape a string for safe insertion into HTML.
 *
 * @param {*} val - Value to escape (coerced to string)
 * @returns {string} HTML-escaped string
 */
export function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate a certificate number string.
 *
 * Format: `CERT-<year>-<6-digit zero-padded sequence>`.
 * The sequence should come from the database — this helper formats it.
 *
 * @param {number} seq - Sequence number from the database
 * @param {number} [year] - Issue year (defaults to current year)
 * @returns {string} Certificate number, e.g. "CERT-2025-000042"
 */
export function formatCertNumber(seq, year = new Date().getFullYear()) {
  return `CERT-${year}-${String(seq).padStart(6, '0')}`;
}
