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

const { ImportForm } = await import('./import-form.js');

function make() {
  const el = new ImportForm();

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

describe('ImportForm', () => {
  it('extends HTMLElement', () => {
    assert.ok(ImportForm.prototype instanceof HTMLElement);
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

    it('renders an Import submit button', () => {
      const { el } = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Import'));
    });

    it('has an accessible aria-label on the form', () => {
      const { el } = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('aria-label'));
    });
  });

  describe('import-submit event', () => {
    it('dispatches import-submit when the form submit handler fires', () => {
      const { el, formStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('import-submit', e => events.push(e));
      formStub._listeners['submit']({ preventDefault: () => {} });

      assert.equal(events.length, 1);
      assert.equal(events[0].type, 'import-submit');
    });

    it('import-submit detail includes a rows array', () => {
      const { el, formStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('import-submit', e => events.push(e));
      formStub._listeners['submit']({ preventDefault: () => {} });

      assert.ok(Array.isArray(events[0].detail.rows));
    });

    it('import-submit has bubbles and composed set', () => {
      const { el, formStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('import-submit', e => events.push(e));
      formStub._listeners['submit']({ preventDefault: () => {} });

      assert.ok(events[0].bubbles);
      assert.ok(events[0].composed);
    });
  });

  describe('import-cancel event', () => {
    it('dispatches import-cancel when the cancel button fires', () => {
      const { el, cancelStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('import-cancel', e => events.push(e));
      cancelStub._listeners['click']();

      assert.equal(events.length, 1);
      assert.equal(events[0].type, 'import-cancel');
    });

    it('import-cancel has bubbles and composed set', () => {
      const { el, cancelStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('import-cancel', e => events.push(e));
      cancelStub._listeners['click']();

      assert.ok(events[0].bubbles);
      assert.ok(events[0].composed);
    });
  });
});
