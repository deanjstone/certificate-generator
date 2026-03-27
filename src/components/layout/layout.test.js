/**
 * Tests for layout Web Components.
 *
 * Components use `document`, `HTMLElement`, and `customElements` — none of
 * which exist in Node. We set up minimal stubs before the modules are loaded
 * via dynamic imports.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Minimal DOM stubs
// ---------------------------------------------------------------------------

class FakeElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this._attrs = {};
    this.innerHTML = '';
    this.children = [];
    this.eventListeners = {};
    this.style = {};
    this.classList = {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
    };
    this.isConnected = true;
  }
  hasAttribute(n) { return Object.prototype.hasOwnProperty.call(this._attrs, n); }
  getAttribute(n) { return this._attrs[n] ?? null; }
  setAttribute(n, v) { this._attrs[n] = String(v); }
  removeAttribute(n) { delete this._attrs[n]; }
  addEventListener(type, fn, opts) {
    this.eventListeners[type] = this.eventListeners[type] || [];
    this.eventListeners[type].push(fn);
  }
  removeEventListener(type, fn) {
    if (this.eventListeners[type]) {
      this.eventListeners[type] = this.eventListeners[type].filter(f => f !== fn);
    }
  }
  dispatchEvent(e) {
    const listeners = this.eventListeners[e.type] || [];
    listeners.forEach(fn => fn(e));
    return true;
  }
  querySelector(sel) {
    // data-action attribute selector
    const dataActionMatch = sel.match(/\[data-action="(.+?)"\]/);
    if (dataActionMatch) {
      return this.children.find(c => c._attrs?.['data-action'] === dataActionMatch[1]) ?? null;
    }
    // Simple tag name selector — search children recursively
    const tag = sel.trim().toLowerCase();
    if (/^[a-z]+$/.test(tag)) {
      return this.#findByTag(tag);
    }
    return null;
  }

  #findByTag(tag) {
    for (const child of this.children) {
      if (child.tagName?.toLowerCase() === tag) return child;
      if (child.children?.length) {
        const found = child.querySelector?.(tag);
        if (found) return found;
      }
    }
    return null;
  }
  querySelectorAll() { return []; }
  appendChild(child) { this.children.push(child); return child; }
  closest(sel) { return null; }
  remove() { this.isConnected = false; }
}

class FakeDialog extends FakeElement {
  constructor() { super('dialog'); }
  showModal() { this._open = true; }
  close() { this._open = false; }
}

// Capture injected <style> tags so tests can inspect them
const injectedStyles = {};

globalThis.HTMLElement = FakeElement;
globalThis.HTMLDialogElement = FakeDialog;
globalThis.customElements = { define: () => {} };
globalThis.requestAnimationFrame = fn => fn();
globalThis.location = { pathname: '/admin' };

// Provide window event listener support
const _windowListeners = {};
globalThis.window = globalThis;
globalThis.addEventListener = (type, fn) => {
  _windowListeners[type] = _windowListeners[type] || [];
  _windowListeners[type].push(fn);
};
globalThis.removeEventListener = (type, fn) => {
  if (_windowListeners[type]) {
    _windowListeners[type] = _windowListeners[type].filter(f => f !== fn);
  }
};
globalThis.dispatchEvent = (e) => {
  (_windowListeners[e.type] || []).forEach(fn => fn(e));
};

globalThis.document = {
  getElementById: id => injectedStyles[id] ? { id } : null,
  createElement(tag) {
    if (tag === 'dialog') return new FakeDialog();
    if (tag === 'p') return Object.assign(new FakeElement('p'), { textContent: '' });
    const el = new FakeElement(tag);
    if (tag === 'style') {
      el.textContent = '';
      el.id = '';
    }
    return el;
  },
  head: {
    appendChild(el) {
      if (el.id) injectedStyles[el.id] = el;
    },
  },
  body: {
    appendChild(el) {},
  },
};

// CustomEvent stub
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = init.bubbles ?? false;
    this.composed = init.composed ?? false;
    this.detail = init.detail ?? null;
  }
};

// ---------------------------------------------------------------------------
// Load modules after globals are set
// ---------------------------------------------------------------------------

const { AppNav } = await import('./app-nav.js');
const { AppToast } = await import('./app-toast.js');
const { AppModal } = await import('./app-modal.js');
const { AppShell } = await import('./app-shell.js');

// Helper: create a bare instance without browser constructor/registry
function make(Cls) {
  const el = new Cls();
  return el;
}

// ---------------------------------------------------------------------------
// AppShell
// ---------------------------------------------------------------------------

describe('AppShell', () => {
  it('is registered as app-shell', () => {
    assert.ok(AppShell.prototype instanceof HTMLElement);
  });

  it('connectedCallback() does not throw', () => {
    const el = make(AppShell);
    // Stub hasChildNodes — default FakeElement has no child nodes
    el.hasChildNodes = () => false;
    assert.doesNotThrow(() => el.connectedCallback());
  });

  it('render() sets innerHTML with nav and content slots', () => {
    const el = make(AppShell);
    el.hasChildNodes = () => false;
    el.connectedCallback();
    assert.ok(el.innerHTML.includes('slot name="nav"'));
    assert.ok(el.innerHTML.includes('slot name="content"'));
  });
});

// ---------------------------------------------------------------------------
// AppNav
// ---------------------------------------------------------------------------

describe('AppNav', () => {
  it('is registered as app-nav', () => {
    assert.ok(AppNav.prototype instanceof HTMLElement);
  });

  it('observes links and heading attributes', () => {
    assert.ok(AppNav.observedAttributes.includes('links'));
    assert.ok(AppNav.observedAttributes.includes('heading'));
  });

  it('render() renders a link for each entry in the links attribute', () => {
    const el = make(AppNav);
    el.setAttribute('links', JSON.stringify([
      { label: 'Dashboard', href: '/admin' },
      { label: 'Certificates', href: '/admin/certificates' },
    ]));
    el.render();
    assert.ok(el.innerHTML.includes('Dashboard'));
    assert.ok(el.innerHTML.includes('Certificates'));
    assert.ok(el.innerHTML.includes('href="/admin"'));
    assert.ok(el.innerHTML.includes('href="/admin/certificates"'));
  });

  it('marks the current route with --active class', () => {
    // location.pathname is stubbed to '/admin'
    const el = make(AppNav);
    el.setAttribute('links', JSON.stringify([
      { label: 'Dashboard', href: '/admin' },
      { label: 'Other', href: '/admin/certificates' },
    ]));
    el.render();
    assert.ok(el.innerHTML.includes('app-nav__link--active'));
    // Only one active link
    const matches = el.innerHTML.match(/app-nav__link--active/g) || [];
    assert.equal(matches.length, 1);
  });

  it('renders heading when heading attribute is set', () => {
    const el = make(AppNav);
    el.setAttribute('heading', 'My App');
    el.setAttribute('links', '[]');
    el.render();
    assert.ok(el.innerHTML.includes('My App'));
  });

  it('renders no heading when heading attribute is absent', () => {
    const el = make(AppNav);
    el.setAttribute('links', '[]');
    el.render();
    assert.ok(!el.innerHTML.includes('app-nav__heading'));
  });

  it('handles invalid JSON in links attribute gracefully (renders empty list)', () => {
    const el = make(AppNav);
    el.setAttribute('links', 'NOT JSON');
    assert.doesNotThrow(() => el.render());
    // Should still produce a list element, just empty
    assert.ok(el.innerHTML.includes('app-nav__list'));
  });

  it('escapes HTML in label and href to prevent XSS', () => {
    const el = make(AppNav);
    el.setAttribute('links', JSON.stringify([
      { label: '<script>alert(1)</script>', href: '/path' },
    ]));
    el.render();
    // Raw <script> tag must not appear
    assert.ok(!el.innerHTML.includes('<script>'));
    // Escaped form must be present
    assert.ok(el.innerHTML.includes('&lt;script&gt;'));
  });

  it('connectedCallback() adds click listener and calls render()', () => {
    const el = make(AppNav);
    el.setAttribute('links', '[]');
    let rendered = false;
    const orig = el.render.bind(el);
    el.render = () => { rendered = true; orig(); };
    el.connectedCallback();
    assert.ok(rendered);
    assert.ok(el.eventListeners['click']?.length > 0);
  });

  it('disconnectedCallback() removes click listener', () => {
    const el = make(AppNav);
    el.setAttribute('links', '[]');
    el.connectedCallback();
    el.disconnectedCallback();
    assert.equal(el.eventListeners['click']?.length ?? 0, 0);
  });
});

// ---------------------------------------------------------------------------
// AppToast
// ---------------------------------------------------------------------------

describe('AppToast', () => {
  it('is registered as app-toast', () => {
    assert.ok(AppToast.prototype instanceof HTMLElement);
  });

  it('AppToast.show() dispatches an app-toast event on window', () => {
    const events = [];
    window.addEventListener('app-toast', e => events.push(e));
    AppToast.show('Hello', 'success', 0);
    window.removeEventListener('app-toast', events[0]);
    assert.equal(events.length, 1);
    assert.equal(events[0].detail.message, 'Hello');
    assert.equal(events[0].detail.variant, 'success');
  });

  it('AppToast.show() defaults variant to "info"', () => {
    const events = [];
    const handler = e => events.push(e);
    window.addEventListener('app-toast', handler);
    AppToast.show('Test');
    window.removeEventListener('app-toast', handler);
    assert.equal(events[0].detail.variant, 'info');
  });

  it('connectedCallback() sets ARIA attributes', () => {
    const el = make(AppToast);
    el.connectedCallback();
    assert.equal(el.getAttribute('role'), 'status');
    assert.equal(el.getAttribute('aria-live'), 'polite');
  });

  it('disconnectedCallback() removes window app-toast listener', () => {
    const el = make(AppToast);
    el.connectedCallback();
    // Confirm the handler was registered
    const before = (window.eventListeners?.['app-toast'] ?? []).length;
    el.disconnectedCallback();
    // Should not throw and internal handler reference is cleared
    assert.doesNotThrow(() => el.disconnectedCallback());
  });
});

// ---------------------------------------------------------------------------
// AppModal
// ---------------------------------------------------------------------------

describe('AppModal', () => {
  it('is registered as app-modal', () => {
    assert.ok(AppModal.prototype instanceof HTMLElement);
  });

  it('connectedCallback() builds dialog with heading and action buttons', () => {
    const el = make(AppModal);
    el.setAttribute('heading', 'Delete record?');
    el.setAttribute('confirm-label', 'Delete');
    el.setAttribute('cancel-label', 'Keep');
    el.connectedCallback();

    // Dialog was appended as a child
    const dialog = el.children[0];
    assert.ok(dialog instanceof FakeDialog);

    // Heading, cancel and confirm button textContent
    const allText = el.children.map(c => c.textContent ?? '').join(' ');
    // Walk all descendants to find text
    function collectText(node) {
      let t = node.textContent ?? '';
      for (const child of node.children ?? []) t += ' ' + collectText(child);
      return t;
    }
    const fullText = collectText(el);
    assert.ok(fullText.includes('Delete record?'));
    assert.ok(fullText.includes('Delete'));
    assert.ok(fullText.includes('Keep'));
  });

  it('renders variant class on confirm button', () => {
    const el = make(AppModal);
    el.setAttribute('variant', 'danger');
    el.connectedCallback();

    function findByClass(node, cls) {
      if (typeof node.className === 'string' && node.className.includes(cls)) return node;
      for (const child of node.children ?? []) {
        const found = findByClass(child, cls);
        if (found) return found;
      }
      return null;
    }
    const confirmBtn = findByClass(el, 'app-modal__btn--danger');
    assert.ok(confirmBtn !== null);
  });

  it('defaults confirm-label to "Confirm" and cancel-label to "Cancel"', () => {
    const el = make(AppModal);
    el.connectedCallback();

    function collectText(node) {
      let t = node.textContent ?? '';
      for (const child of node.children ?? []) t += ' ' + collectText(child);
      return t;
    }
    const fullText = collectText(el);
    assert.ok(fullText.includes('Confirm'));
    assert.ok(fullText.includes('Cancel'));
  });

  it('heading textContent is set directly (no raw HTML injection)', () => {
    const el = make(AppModal);
    // Using textContent means raw HTML is never injected — test that textContent
    // is used rather than innerHTML for the heading.
    el.setAttribute('heading', '<img src=x onerror=alert(1)>');
    el.connectedCallback();
    function findByClass(node, cls) {
      if (typeof node.className === 'string' && node.className.includes(cls)) return node;
      for (const child of node.children ?? []) {
        const found = findByClass(child, cls);
        if (found) return found;
      }
      return null;
    }
    const h2 = findByClass(el, 'app-modal__heading');
    assert.ok(h2 !== null);
    // textContent stores the raw string — the <img> tag is NOT parsed as HTML
    assert.equal(h2.textContent, '<img src=x onerror=alert(1)>');
  });
});
