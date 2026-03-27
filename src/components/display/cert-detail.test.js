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

const { CertDetail } = await import('./cert-detail.js');

/** @returns {CertDetail} */
function make() { return new CertDetail(); }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CertDetail', () => {
  it('extends HTMLElement', () => {
    assert.ok(CertDetail.prototype instanceof HTMLElement);
  });

  it('cert property defaults to null', () => {
    assert.equal(make().cert, null);
  });

  describe('render() with no cert', () => {
    it('connectedCallback() does not throw when cert is null', () => {
      const el = make();
      assert.doesNotThrow(() => el.connectedCallback());
    });

    it('shows empty-state element when no cert is set', () => {
      const el = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('cert-detail__empty'));
    });
  });

  describe('render() with a cert', () => {
    it('shows placeholder element when cert is set before connect', () => {
      const el = make();
      el.cert = { id: '1', cert_number: 'CERT-001' };
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('cert-detail__placeholder'));
    });

    it('does not show empty-state element when cert is set', () => {
      const el = make();
      el.cert = { id: '1' };
      el.connectedCallback();
      assert.ok(!el.innerHTML.includes('cert-detail__empty'));
    });
  });

  describe('cert setter re-renders', () => {
    it('switches from empty-state to placeholder on cert assignment', () => {
      const el = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('cert-detail__empty'));

      el.cert = { id: '2', cert_number: 'CERT-002' };
      assert.ok(el.innerHTML.includes('cert-detail__placeholder'));
    });

    it('switches back to empty-state when cert is set to null', () => {
      const el = make();
      el.cert = { id: '1' };
      el.connectedCallback();
      el.cert = null;
      assert.ok(el.innerHTML.includes('cert-detail__empty'));
    });

    it('getter returns the value that was set', () => {
      const el = make();
      const cert = { id: '1', cert_number: 'CERT-001' };
      el.cert = cert;
      assert.strictEqual(el.cert, cert);
    });

    it('setting cert to undefined coerces to null', () => {
      const el = make();
      el.cert = { id: '1' };
      el.cert = undefined;
      assert.equal(el.cert, null);
    });
  });
});
