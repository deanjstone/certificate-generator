import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Minimal DOM stubs
// ---------------------------------------------------------------------------

globalThis.HTMLElement = class {
  constructor() {
    this._attrs = {};
    this.innerHTML = '';
    this.isConnected = true;
  }
  hasAttribute(n) { return Object.prototype.hasOwnProperty.call(this._attrs, n); }
  getAttribute(n) { return this._attrs[n] ?? null; }
  setAttribute(n, v) { this._attrs[n] = String(v); }
  removeAttribute(n) { delete this._attrs[n]; }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
};
globalThis.customElements = { define: () => {} };

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { CertStatusBadge } = await import('./cert-status-badge.js');

/** @returns {CertStatusBadge} */
function make() { return new CertStatusBadge(); }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CertStatusBadge', () => {
  it('extends HTMLElement', () => {
    assert.ok(CertStatusBadge.prototype instanceof HTMLElement);
  });

  it('observes the status attribute', () => {
    assert.ok(CertStatusBadge.observedAttributes.includes('status'));
  });

  describe('render()', () => {
    it('does not throw', () => {
      const el = make();
      assert.doesNotThrow(() => el.connectedCallback());
    });

    it('defaults to "draft" when status attribute is absent', () => {
      const el = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('draft'));
    });

    it('renders the status text inside the badge', () => {
      for (const status of ['draft', 'issued', 'revoked', 'void']) {
        const el = make();
        el.setAttribute('status', status);
        el.connectedCallback();
        assert.ok(el.innerHTML.includes(status), `expected "${status}" in innerHTML`);
      }
    });

    it('applies a BEM modifier class matching the status', () => {
      const el = make();
      el.setAttribute('status', 'issued');
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('cert-status-badge--issued'));
    });

    it('applies correct class for each status variant', () => {
      for (const status of ['draft', 'issued', 'revoked', 'void']) {
        const el = make();
        el.setAttribute('status', status);
        el.connectedCallback();
        assert.ok(
          el.innerHTML.includes(`cert-status-badge--${status}`),
          `expected modifier class for "${status}"`,
        );
      }
    });
  });

  describe('attributeChangedCallback()', () => {
    it('re-renders when the status attribute changes', () => {
      const el = make();
      el.setAttribute('status', 'draft');
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('draft'));

      el.setAttribute('status', 'issued');
      el.attributeChangedCallback();
      assert.ok(el.innerHTML.includes('issued'));
      assert.ok(!el.innerHTML.includes('cert-status-badge--draft'));
    });

    it('does not throw when called before connect', () => {
      const el = make();
      el.isConnected = false;
      assert.doesNotThrow(() => el.attributeChangedCallback());
    });
  });
});
