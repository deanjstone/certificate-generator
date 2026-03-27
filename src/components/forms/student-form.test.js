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

const { StudentForm } = await import('./student-form.js');

function make() {
  const el = new StudentForm();

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

describe('StudentForm', () => {
  it('extends HTMLElement', () => {
    assert.ok(StudentForm.prototype instanceof HTMLElement);
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

    it('renders "Create" label when student-id is absent', () => {
      const { el } = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Create'));
    });

    it('renders "Save" label when student-id is present', () => {
      const { el } = make();
      el.setAttribute('student-id', 'stu-99');
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Save'));
    });

    it('sets aria-label to "New student" when student-id is absent', () => {
      const { el } = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('New student'));
    });

    it('sets aria-label to "Edit student" when student-id is present', () => {
      const { el } = make();
      el.setAttribute('student-id', 'stu-99');
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Edit student'));
    });
  });

  describe('student-submit event', () => {
    it('dispatches student-submit on form submit', () => {
      const { el, formStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('student-submit', e => events.push(e));
      formStub._listeners['submit']({ preventDefault: () => {} });

      assert.equal(events.length, 1);
      assert.equal(events[0].type, 'student-submit');
    });

    it('student-submit detail includes a data object', () => {
      const { el, formStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('student-submit', e => events.push(e));
      formStub._listeners['submit']({ preventDefault: () => {} });

      assert.ok('data' in events[0].detail);
    });

    it('student-submit has bubbles and composed set', () => {
      const { el, formStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('student-submit', e => events.push(e));
      formStub._listeners['submit']({ preventDefault: () => {} });

      assert.ok(events[0].bubbles);
      assert.ok(events[0].composed);
    });
  });

  describe('student-cancel event', () => {
    it('dispatches student-cancel when cancel button fires', () => {
      const { el, cancelStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('student-cancel', e => events.push(e));
      cancelStub._listeners['click']();

      assert.equal(events.length, 1);
      assert.equal(events[0].type, 'student-cancel');
    });

    it('student-cancel has bubbles and composed set', () => {
      const { el, cancelStub } = make();
      el.connectedCallback();

      const events = [];
      el.addEventListener('student-cancel', e => events.push(e));
      cancelStub._listeners['click']();

      assert.ok(events[0].bubbles);
      assert.ok(events[0].composed);
    });
  });
});
