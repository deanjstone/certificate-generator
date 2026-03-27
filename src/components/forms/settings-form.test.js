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

const { SettingsForm } = await import('./settings-form.js');

function make() {
  const el = new SettingsForm();

  const formStub = { _listeners: {}, addEventListener(t, fn) { this._listeners[t] = fn; } };

  el.querySelector = (sel) => {
    if (sel === 'form') return formStub;
    return null;
  };

  return { el, formStub };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SettingsForm', () => {
  it('extends HTMLElement', () => {
    assert.ok(SettingsForm.prototype instanceof HTMLElement);
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

    it('renders a save / submit button', () => {
      const { el } = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Save'));
    });

    it('has an accessible aria-label on the form', () => {
      const { el } = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('aria-label'));
    });

    it('does not render a cancel button (settings has no cancel action)', () => {
      const { el } = make();
      el.connectedCallback();
      assert.ok(!el.innerHTML.includes('data-action="cancel"'));
    });
  });

  describe('settings-submit event', () => {
    it('dispatches settings-submit on form submit', () => {
      const { el, formStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('settings-submit', e => events.push(e));
      formStub._listeners['submit']({ preventDefault: () => {} });

      assert.equal(events.length, 1);
      assert.equal(events[0].type, 'settings-submit');
    });

    it('settings-submit detail includes a data object', () => {
      const { el, formStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('settings-submit', e => events.push(e));
      formStub._listeners['submit']({ preventDefault: () => {} });

      assert.ok('data' in events[0].detail);
    });

    it('settings-submit has bubbles set', () => {
      const { el, formStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('settings-submit', e => events.push(e));
      formStub._listeners['submit']({ preventDefault: () => {} });

      assert.ok(events[0].bubbles);
    });
  });
});
