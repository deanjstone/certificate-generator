import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Minimal DOM stubs
// ---------------------------------------------------------------------------

class FakeElement {
  constructor() {
    this._attrs = {};
    this.innerHTML = '';
    this.isConnected = true;
    this._listeners = {};
  }
  hasAttribute(n) { return Object.prototype.hasOwnProperty.call(this._attrs, n); }
  getAttribute(n) { return this._attrs[n] ?? null; }
  setAttribute(n, v) { this._attrs[n] = String(v); }
  removeAttribute(n) { delete this._attrs[n]; }
  addEventListener(type, fn) {
    this._listeners[type] = this._listeners[type] || [];
    this._listeners[type].push(fn);
  }
  removeEventListener(type, fn) {
    if (this._listeners[type]) {
      this._listeners[type] = this._listeners[type].filter(f => f !== fn);
    }
  }
  dispatchEvent(e) {
    (this._listeners[e.type] || []).forEach(fn => fn(e));
    return true;
  }
  querySelector() { return null; }
}

globalThis.HTMLElement = FakeElement;
globalThis.customElements = { define: () => {} };
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = init.bubbles ?? false;
    this.composed = init.composed ?? false;
    this.detail = init.detail ?? null;
  }
};

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { CertForm } = await import('./cert-form.js');

/**
 * Create an instance with querySelector stubs that capture event listeners
 * attached to child elements returned from innerHTML.
 *
 * @returns {{ el: CertForm, formStub: object, cancelStub: object }}
 */
function make() {
  const el = new CertForm();

  const formStub = { _listeners: {}, addEventListener(t, fn) { this._listeners[t] = fn; } };
  const cancelStub = { _listeners: {}, addEventListener(t, fn) { this._listeners[t] = fn; } };

  el.querySelector = (sel) => {
    if (sel === 'form') return formStub;
    if (sel === '[data-action="cancel"]') return cancelStub;
    return null;
  };

  return { el, formStub, cancelStub };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CertForm', () => {
  it('extends HTMLElement', () => {
    assert.ok(CertForm.prototype instanceof HTMLElement);
  });

  describe('render()', () => {
    it('connectedCallback() does not throw', () => {
      const { el } = make();
      assert.doesNotThrow(() => el.connectedCallback());
    });

    it('renders a <form> element in innerHTML', () => {
      const { el } = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('<form'));
    });

    it('renders a cancel button', () => {
      const { el } = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('data-action="cancel"'));
    });

    it('renders "Create" label when cert-id is absent', () => {
      const { el } = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Create'));
    });

    it('renders "Save" label when cert-id is present', () => {
      const { el } = make();
      el.setAttribute('cert-id', 'abc-123');
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Save'));
    });

    it('sets aria-label to "New certificate" when cert-id is absent', () => {
      const { el } = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('New certificate'));
    });

    it('sets aria-label to "Edit certificate" when cert-id is present', () => {
      const { el } = make();
      el.setAttribute('cert-id', 'abc-123');
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Edit certificate'));
    });
  });

  describe('cert-submit event', () => {
    it('dispatches cert-submit when the form submit handler fires', () => {
      const { el, formStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('cert-submit', e => events.push(e));

      formStub._listeners['submit']({ preventDefault: () => {} });

      assert.equal(events.length, 1);
      assert.equal(events[0].type, 'cert-submit');
    });

    it('cert-submit detail includes a data object', () => {
      const { el, formStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('cert-submit', e => events.push(e));
      formStub._listeners['submit']({ preventDefault: () => {} });

      assert.ok('data' in events[0].detail);
    });

    it('cert-submit event has bubbles and composed set', () => {
      const { el, formStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('cert-submit', e => events.push(e));
      formStub._listeners['submit']({ preventDefault: () => {} });

      assert.ok(events[0].bubbles);
      assert.ok(events[0].composed);
    });
  });

  describe('cert-cancel event', () => {
    it('dispatches cert-cancel when the cancel button fires', () => {
      const { el, cancelStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('cert-cancel', e => events.push(e));
      cancelStub._listeners['click']();

      assert.equal(events.length, 1);
      assert.equal(events[0].type, 'cert-cancel');
    });

    it('cert-cancel event has bubbles and composed set', () => {
      const { el, cancelStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('cert-cancel', e => events.push(e));
      cancelStub._listeners['click']();

      assert.ok(events[0].bubbles);
      assert.ok(events[0].composed);
    });
  });
});
