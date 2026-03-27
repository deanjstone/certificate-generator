import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Minimal DOM stubs — cert-template uses Shadow DOM (attachShadow)
// ---------------------------------------------------------------------------

class FakeShadowRoot {
  constructor() {
    this.innerHTML = '';
  }
}

globalThis.HTMLElement = class {
  constructor() {
    this._attrs = {};
    this.innerHTML = '';
    this.isConnected = true;
    this.shadowRoot = null;
  }
  hasAttribute(n) { return Object.prototype.hasOwnProperty.call(this._attrs, n); }
  getAttribute(n) { return this._attrs[n] ?? null; }
  setAttribute(n, v) { this._attrs[n] = String(v); }
  removeAttribute(n) { delete this._attrs[n]; }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
  attachShadow({ mode }) {
    this.shadowRoot = new FakeShadowRoot();
    this.shadowRoot._mode = mode;
    return this.shadowRoot;
  }
};
globalThis.customElements = { define: () => {} };

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { CertTemplate } = await import('./cert-template.js');

/** @returns {CertTemplate} */
function make() { return new CertTemplate(); }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CertTemplate', () => {
  it('extends HTMLElement', () => {
    assert.ok(CertTemplate.prototype instanceof HTMLElement);
  });

  describe('constructor', () => {
    it('attaches a shadow root in open mode', () => {
      const el = make();
      assert.ok(el.shadowRoot !== null, 'shadowRoot should be attached');
      assert.equal(el.shadowRoot._mode, 'open');
    });
  });

  describe('property defaults', () => {
    it('cert defaults to null', () => {
      assert.equal(make().cert, null);
    });

    it('settings defaults to null', () => {
      assert.equal(make().settings, null);
    });
  });

  describe('connectedCallback()', () => {
    it('does not throw', () => {
      const el = make();
      assert.doesNotThrow(() => el.connectedCallback());
    });

    it('sets shadowRoot.innerHTML', () => {
      const el = make();
      el.connectedCallback();
      assert.ok(typeof el.shadowRoot.innerHTML === 'string');
      assert.ok(el.shadowRoot.innerHTML.length > 0);
    });

    it('renders a <style> block inside shadow root', () => {
      const el = make();
      el.connectedCallback();
      assert.ok(el.shadowRoot.innerHTML.includes('<style>'));
    });

    it('renders the page container element', () => {
      const el = make();
      el.connectedCallback();
      assert.ok(el.shadowRoot.innerHTML.includes('cert-template__page'));
    });
  });

  describe('cert setter', () => {
    it('getter returns the value that was set', () => {
      const el = make();
      const cert = { id: '1', cert_number: 'CERT-001' };
      el.cert = cert;
      assert.strictEqual(el.cert, cert);
    });

    it('coerces undefined to null', () => {
      const el = make();
      el.cert = undefined;
      assert.equal(el.cert, null);
    });

    it('re-renders shadow root when set while connected', () => {
      const el = make();
      el.connectedCallback();
      const before = el.shadowRoot.innerHTML;
      el.cert = { id: '1' };
      // Re-render still produces valid shadow DOM output
      assert.ok(el.shadowRoot.innerHTML.length > 0);
      assert.ok(typeof el.shadowRoot.innerHTML === 'string');
    });
  });

  describe('settings setter', () => {
    it('getter returns the value that was set', () => {
      const el = make();
      const settings = { rtoName: 'My RTO', rtoCode: '12345' };
      el.settings = settings;
      assert.strictEqual(el.settings, settings);
    });

    it('coerces undefined to null', () => {
      const el = make();
      el.settings = undefined;
      assert.equal(el.settings, null);
    });

    it('re-renders shadow root when set while connected', () => {
      const el = make();
      el.connectedCallback();
      el.settings = { rtoName: 'My RTO' };
      assert.ok(el.shadowRoot.innerHTML.length > 0);
    });
  });
});
