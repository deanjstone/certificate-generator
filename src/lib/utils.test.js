import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { formatDate, escapeHtml, formatCertNumber } from './utils.js';

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('formats a valid ISO date string in en-AU locale', () => {
    const result = formatDate('2025-06-01');
    // en-AU: "01 Jun 2025" — at minimum the year and month abbreviation appear
    assert.ok(result.includes('2025'), `expected 2025 in "${result}"`);
    assert.ok(result.includes('Jun'), `expected Jun in "${result}"`);
  });

  it('returns "—" for null', () => {
    assert.equal(formatDate(null), '—');
  });

  it('returns "—" for undefined', () => {
    assert.equal(formatDate(undefined), '—');
  });

  it('returns "—" for empty string', () => {
    assert.equal(formatDate(''), '—');
  });

  it('accepts a custom locale', () => {
    const result = formatDate('2025-01-15', 'en-US');
    // en-US: month/day/year — just check year is present
    assert.ok(result.includes('2025'));
  });

  it('does not throw for any string input', () => {
    assert.doesNotThrow(() => formatDate('not-a-date'));
  });
});

// ---------------------------------------------------------------------------
// escapeHtml
// ---------------------------------------------------------------------------

describe('escapeHtml', () => {
  it('escapes &', () => {
    assert.equal(escapeHtml('a&b'), 'a&amp;b');
  });

  it('escapes <', () => {
    assert.equal(escapeHtml('<div>'), '&lt;div&gt;');
  });

  it('escapes >', () => {
    assert.equal(escapeHtml('1>0'), '1&gt;0');
  });

  it('escapes double quotes', () => {
    assert.equal(escapeHtml('"hi"'), '&quot;hi&quot;');
  });

  it('leaves safe text unchanged', () => {
    assert.equal(escapeHtml('Hello World'), 'Hello World');
  });

  it('coerces null to empty string', () => {
    assert.equal(escapeHtml(null), '');
  });

  it('coerces undefined to empty string', () => {
    assert.equal(escapeHtml(undefined), '');
  });

  it('coerces numbers to strings', () => {
    assert.equal(escapeHtml(42), '42');
  });

  it('escapes a full XSS payload', () => {
    const result = escapeHtml('<script>alert("xss")</script>');
    assert.ok(!result.includes('<script>'));
    assert.ok(result.includes('&lt;script&gt;'));
    assert.ok(result.includes('&quot;'));
  });
});

// ---------------------------------------------------------------------------
// formatCertNumber
// ---------------------------------------------------------------------------

describe('formatCertNumber', () => {
  it('zero-pads sequence to 6 digits', () => {
    assert.equal(formatCertNumber(1, 2025), 'CERT-2025-000001');
  });

  it('formats a larger sequence without truncating', () => {
    assert.equal(formatCertNumber(999999, 2025), 'CERT-2025-999999');
  });

  it('includes the supplied year', () => {
    assert.equal(formatCertNumber(42, 2030), 'CERT-2030-000042');
  });

  it('uses the current year when year is omitted', () => {
    const currentYear = new Date().getFullYear();
    const result = formatCertNumber(1);
    assert.ok(result.startsWith(`CERT-${currentYear}-`), `expected year ${currentYear} in "${result}"`);
  });

  it('produces the correct CERT-YYYY-NNNNNN format', () => {
    assert.match(formatCertNumber(7, 2025), /^CERT-\d{4}-\d{6}$/);
  });
});
