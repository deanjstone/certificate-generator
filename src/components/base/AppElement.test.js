import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// HTMLElement is not available in Node. Provide a minimal stub before the
// module is loaded so AppElement.js can extend it without errors.
globalThis.HTMLElement = class {
  constructor() {
    this._attrs = {};
  }
  hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this._attrs, name); }
  getAttribute(name) { return this._attrs[name] ?? null; }
  setAttribute(name, value) { this._attrs[name] = String(value); }
  removeAttribute(name) { delete this._attrs[name]; }
};

// Dynamic import runs after the global is set, so AppElement.js can safely
// reference HTMLElement during class evaluation.
const { AppElement } = await import('./AppElement.js');

/** Create a bare AppElement instance without invoking the constructor. */
function makeElement() {
  const el = new AppElement();
  return el;
}

describe('AppElement', () => {
  describe('attr()', () => {
    it('returns the attribute value when the attribute is set', () => {
      const el = makeElement();
      el.setAttribute('role', 'admin');
      assert.equal(el.attr('role'), 'admin');
    });

    it('returns null by default when the attribute is absent', () => {
      const el = makeElement();
      assert.equal(el.attr('missing'), null);
    });

    it('returns the supplied defaultValue when the attribute is absent', () => {
      const el = makeElement();
      assert.equal(el.attr('missing', 'fallback'), 'fallback');
    });

    it('returns the attribute value even when a defaultValue is supplied', () => {
      const el = makeElement();
      el.setAttribute('status', 'issued');
      assert.equal(el.attr('status', 'draft'), 'issued');
    });
  });

  describe('reflect()', () => {
    it('sets the attribute to the given string value', () => {
      const el = makeElement();
      el.reflect('status', 'issued');
      assert.equal(el.getAttribute('status'), 'issued');
    });

    it('coerces non-string values to strings', () => {
      const el = makeElement();
      el.reflect('count', 42);
      assert.equal(el.getAttribute('count'), '42');
    });

    it('removes the attribute when passed null', () => {
      const el = makeElement();
      el.setAttribute('status', 'issued');
      el.reflect('status', null);
      assert.equal(el.hasAttribute('status'), false);
    });

    it('removes the attribute when passed undefined', () => {
      const el = makeElement();
      el.setAttribute('status', 'issued');
      el.reflect('status', undefined);
      assert.equal(el.hasAttribute('status'), false);
    });
  });

  describe('lifecycle stubs', () => {
    it('connectedCallback() exists and does not throw', () => {
      const el = makeElement();
      assert.doesNotThrow(() => el.connectedCallback());
    });

    it('disconnectedCallback() exists and does not throw', () => {
      const el = makeElement();
      assert.doesNotThrow(() => el.disconnectedCallback());
    });
  });

  describe('subclassing', () => {
    it('subclass inherits attr() and reflect()', () => {
      class MyEl extends AppElement {
        connectedCallback() {
          super.connectedCallback();
          this.reflect('ready', 'true');
        }
      }

      const el = new MyEl();
      el.connectedCallback();

      assert.equal(el.attr('ready'), 'true');
    });
  });
});
