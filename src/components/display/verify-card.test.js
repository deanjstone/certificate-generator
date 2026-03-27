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

const { VerifyCard } = await import('./verify-card.js');

/** @returns {VerifyCard} */
function make() { return new VerifyCard(); }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VerifyCard', () => {
  it('extends HTMLElement', () => {
    assert.ok(VerifyCard.prototype instanceof HTMLElement);
  });

  it('observes the state attribute', () => {
    assert.ok(VerifyCard.observedAttributes.includes('state'));
  });

  it('cert property defaults to null', () => {
    assert.equal(make().cert, null);
  });

  describe('cert setter', () => {
    it('getter returns the value that was set', () => {
      const el = make();
      const cert = { id: '1', cert_number: 'CERT-001' };
      el.cert = cert;
      assert.strictEqual(el.cert, cert);
    });

    it('reflects state="found" when a cert object is assigned', () => {
      const el = make();
      el.cert = { id: '1' };
      assert.equal(el.getAttribute('state'), 'found');
    });

    it('reflects state="not-found" when cert is set to null', () => {
      const el = make();
      el.cert = { id: '1' };
      el.cert = null;
      assert.equal(el.getAttribute('state'), 'not-found');
    });

    it('reflects state="not-found" when cert is set to undefined', () => {
      const el = make();
      el.cert = undefined;
      assert.equal(el.getAttribute('state'), 'not-found');
    });

    it('re-renders when cert is set while connected', () => {
      const el = make();
      el.connectedCallback();
      let renders = 0;
      const orig = el.render.bind(el);
      el.render = () => { renders++; orig(); };

      el.cert = { id: '1' };
      assert.ok(renders > 0, 'expected render to be called');
    });
  });

  describe('render()', () => {
    it('does not throw', () => {
      const el = make();
      assert.doesNotThrow(() => el.connectedCallback());
    });

    it('includes the current state value in output', () => {
      const el = make();
      el.connectedCallback();
      // Default state is 'loading' (no state attribute set yet)
      assert.ok(el.innerHTML.includes('loading'));
    });

    it('shows found state in output after cert is set', () => {
      const el = make();
      el.connectedCallback();
      el.cert = { id: '1' };
      assert.ok(el.innerHTML.includes('found'));
    });

    it('shows not-found state in output when cert is null', () => {
      const el = make();
      el.connectedCallback();
      el.cert = { id: '1' };
      el.cert = null;
      assert.ok(el.innerHTML.includes('not-found'));
    });
  });

  describe('attributeChangedCallback()', () => {
    it('re-renders when state attribute changes while connected', () => {
      const el = make();
      el.connectedCallback();
      el.setAttribute('state', 'found');
      el.attributeChangedCallback();
      assert.ok(el.innerHTML.includes('found'));
    });

    it('does not throw when not connected', () => {
      const el = make();
      el.isConnected = false;
      assert.doesNotThrow(() => el.attributeChangedCallback());
    });
  });
});
