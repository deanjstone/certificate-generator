/**
 * Tests for cert-table component.
 * Uses the same minimal DOM stub pattern as layout.test.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// DOM stubs (must be set before dynamic import of the component)
// ---------------------------------------------------------------------------

const injectedStyles = {};

class FakeElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this._attrs = {};
    this.innerHTML = '';
    this.children = [];
    this.isConnected = true;
    this.eventListeners = {};
    this.disabled = false;
    this.dataset = {};
    this.value = '';
    this.style = {};
    this.classList = {
      _c: new Set(),
      add(c) { this._c.add(c); },
      remove(c) { this._c.delete(c); },
      contains(c) { return this._c.has(c); },
    };
  }
  hasAttribute(n) { return Object.prototype.hasOwnProperty.call(this._attrs, n); }
  getAttribute(n) { return this._attrs[n] ?? null; }
  setAttribute(n, v) { this._attrs[n] = String(v); }
  removeAttribute(n) { delete this._attrs[n]; }
  addEventListener(type, fn) {
    this.eventListeners[type] = this.eventListeners[type] || [];
    this.eventListeners[type].push(fn);
  }
  removeEventListener(type, fn) {
    if (this.eventListeners[type]) {
      this.eventListeners[type] = this.eventListeners[type].filter(f => f !== fn);
    }
  }
  dispatchEvent(e) {
    (this.eventListeners[e.type] || []).forEach(fn => fn(e));
    return true;
  }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest(sel) {
    const key = sel.replace('[data-', '').replace(']', '');
    if (sel.startsWith('[data-')) {
      const [attr, val] = key.split('="');
      const cleanVal = val?.replace('"', '');
      if (cleanVal === undefined) {
        // [data-foo] — just presence check
        if (this.dataset[attr.replace('data-', '')] !== undefined) return this;
      } else {
        if (this.dataset[attr] === cleanVal) return this;
      }
    }
    return null;
  }
  appendChild(child) { this.children.push(child); return child; }
  remove() { this.isConnected = false; }
}

globalThis.HTMLElement = FakeElement;
globalThis.customElements = { define: () => {} };
globalThis.document = {
  getElementById: id => injectedStyles[id] ?? null,
  createElement(tag) {
    const el = new FakeElement(tag);
    if (tag === 'style') { el.id = ''; el.textContent = ''; }
    return el;
  },
  head: { appendChild(el) { if (el.id) injectedStyles[el.id] = el; } },
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = init.bubbles ?? false;
    this.composed = init.composed ?? false;
    this.detail = init.detail ?? null;
  }
};

const { CertTable } = await import('./cert-table.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function make() { return new CertTable(); }

/** @returns {import('./cert-table.js').CertRecord[]} */
function makeCerts(n = 5) {
  const statuses = ['draft', 'issued', 'revoked', 'void'];
  const types = ['qualification', 'statement', 'transcript'];
  return Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    cert_number: `CERT-${String(i + 1).padStart(4, '0')}`,
    cert_type: types[i % 3],
    student: { name: `Student ${i + 1}`, email: `s${i}@test.com` },
    qualification: { code: `BSB${i}0`, title: `Qualification ${i}` },
    issued_at: i < 3 ? `2025-0${i + 1}-15T00:00:00Z` : null,
    status: statuses[i % 4],
    created_at: `2025-01-0${i + 1}T00:00:00Z`,
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CertTable', () => {
  describe('registration', () => {
    it('extends HTMLElement', () => {
      assert.ok(CertTable.prototype instanceof HTMLElement);
    });

    it('observes page-size attribute', () => {
      assert.ok(CertTable.observedAttributes.includes('page-size'));
    });
  });

  describe('data property', () => {
    it('defaults to empty array', () => {
      const el = make();
      assert.deepEqual(el.data, []);
    });

    it('setter stores the array', () => {
      const el = make();
      const certs = makeCerts(3);
      el.data = certs;
      assert.equal(el.data.length, 3);
    });

    it('setter with non-array falls back to empty array', () => {
      const el = make();
      el.data = null;
      assert.deepEqual(el.data, []);
    });
  });

  describe('rendering', () => {
    it('connectedCallback() renders without error', () => {
      const el = make();
      assert.doesNotThrow(() => el.connectedCallback());
    });

    it('renders column headers', () => {
      const el = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Cert #'));
      assert.ok(el.innerHTML.includes('Student'));
      assert.ok(el.innerHTML.includes('Status'));
      assert.ok(el.innerHTML.includes('Issued'));
    });

    it('renders empty-state message when data is empty', () => {
      const el = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('No certificates found'));
    });

    it('renders a row per record', () => {
      const el = make();
      el.data = makeCerts(3);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Student 1'));
      assert.ok(el.innerHTML.includes('Student 2'));
      assert.ok(el.innerHTML.includes('Student 3'));
    });

    it('renders cert_number in each row', () => {
      const el = make();
      el.data = makeCerts(2);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('CERT-0001'));
      assert.ok(el.innerHTML.includes('CERT-0002'));
    });

    it('renders status badges', () => {
      const el = make();
      el.data = makeCerts(4);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('cert-table__badge--draft'));
      assert.ok(el.innerHTML.includes('cert-table__badge--issued'));
    });

    it('renders toolbar with search input and select filters', () => {
      const el = make();
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('data-filter="search"'));
      assert.ok(el.innerHTML.includes('data-filter="status"'));
      assert.ok(el.innerHTML.includes('data-filter="type"'));
      assert.ok(el.innerHTML.includes('data-filter="from"'));
      assert.ok(el.innerHTML.includes('data-filter="to"'));
    });

    it('renders pagination controls', () => {
      const el = make();
      el.data = makeCerts(3);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('data-page="prev"'));
      assert.ok(el.innerHTML.includes('data-page="next"'));
    });

    it('escapes HTML in student name to prevent XSS', () => {
      const el = make();
      el.data = [{ ...makeCerts(1)[0], student: { name: '<script>evil()</script>' } }];
      el.connectedCallback();
      assert.ok(!el.innerHTML.includes('<script>'));
      assert.ok(el.innerHTML.includes('&lt;script&gt;'));
    });

    it('escapes HTML in cert_number', () => {
      const el = make();
      el.data = [{ ...makeCerts(1)[0], cert_number: '<img onerror=x>' }];
      el.connectedCallback();
      assert.ok(!el.innerHTML.includes('<img'));
      assert.ok(el.innerHTML.includes('&lt;img'));
    });
  });

  describe('filtering', () => {
    it('filters by status', () => {
      const el = make();
      el.data = makeCerts(8);
      el.connectedCallback();
      // Manually set filter and re-render via private method (via data setter)
      el._filters = el._filters; // no-op — instead we test the rendered output by resetting data

      // Inject filter via the internal state — access through a round-trip
      // by simulating a change event on the status select
      const changeEvent = { target: { closest: (sel) => sel === '[data-filter]' ? { dataset: { filter: 'status' }, value: 'issued' } : null } };
      el.eventListeners['change']?.[0]?.(changeEvent);

      assert.ok(el.innerHTML.includes('cert-table__badge--issued'));
      // Draft rows should not appear (status filter is 'issued')
      assert.ok(!el.innerHTML.includes('cert-table__badge--draft'));
    });

    it('filters by cert_type', () => {
      const el = make();
      el.data = makeCerts(6);
      el.connectedCallback();

      const changeEvent = { target: { closest: (sel) => sel === '[data-filter]' ? { dataset: { filter: 'type' }, value: 'qualification' } : null } };
      el.eventListeners['change']?.[0]?.(changeEvent);

      // Only qualification type badge should appear in tbody rows
      assert.ok(el.innerHTML.includes('cert-table__type'));
      // Statement and Transcript type badges must not be in rendered rows —
      // check the badge span specifically (not the <option> in the toolbar)
      const tbodyMatch = el.innerHTML.match(/<tbody>([\s\S]*?)<\/tbody>/);
      const tbody = tbodyMatch ? tbodyMatch[1] : '';
      assert.ok(!tbody.includes('>Statement<'));
      assert.ok(!tbody.includes('>Transcript<'));
    });

    it('filters by search term matching student name', () => {
      const el = make();
      const certs = makeCerts(3);
      certs[0].student.name = 'Alice Smith';
      certs[1].student.name = 'Bob Jones';
      certs[2].student.name = 'Charlie Brown';
      el.data = certs;
      el.connectedCallback();

      // Simulate input event
      const inputEvent = { target: { closest: (sel) => sel === '[data-filter="search"]' ? { dataset: { filter: 'search' }, value: 'alice' } : null } };
      el.eventListeners['input']?.[0]?.(inputEvent);

      assert.ok(el.innerHTML.includes('Alice Smith'));
      assert.ok(!el.innerHTML.includes('Bob Jones'));
      assert.ok(!el.innerHTML.includes('Charlie Brown'));
    });

    it('filters by search term matching cert_number', () => {
      const el = make();
      const certs = makeCerts(3);
      el.data = certs;
      el.connectedCallback();

      const inputEvent = { target: { closest: (sel) => sel === '[data-filter="search"]' ? { dataset: { filter: 'search' }, value: 'CERT-0001' } : null } };
      el.eventListeners['input']?.[0]?.(inputEvent);

      assert.ok(el.innerHTML.includes('CERT-0001'));
      assert.ok(!el.innerHTML.includes('CERT-0002'));
    });

    it('filter by date range excludes records outside range', () => {
      const el = make();
      const certs = [
        { ...makeCerts(1)[0], id: 'a', cert_number: 'A', issued_at: '2025-01-10T00:00:00Z' },
        { ...makeCerts(1)[0], id: 'b', cert_number: 'B', issued_at: '2025-06-10T00:00:00Z' },
        { ...makeCerts(1)[0], id: 'c', cert_number: 'C', issued_at: '2025-12-10T00:00:00Z' },
      ];
      el.data = certs;
      el.connectedCallback();

      // Set from=2025-05-01 to=2025-07-01 → only B should show
      const fromEvent = { target: { closest: (sel) => sel === '[data-filter]' ? { dataset: { filter: 'from' }, value: '2025-05-01' } : null } };
      const toEvent   = { target: { closest: (sel) => sel === '[data-filter]' ? { dataset: { filter: 'to' },   value: '2025-07-01' } : null } };
      el.eventListeners['change']?.[0]?.(fromEvent);
      el.eventListeners['change']?.[0]?.(toEvent);

      assert.ok(!el.innerHTML.includes('>A<'));
      assert.ok(el.innerHTML.includes('>B<'));
      assert.ok(!el.innerHTML.includes('>C<'));
    });

    it('shows empty state when filter matches nothing', () => {
      const el = make();
      el.data = makeCerts(3);
      el.connectedCallback();

      const inputEvent = { target: { closest: (sel) => sel === '[data-filter="search"]' ? { dataset: { filter: 'search' }, value: 'zzz-no-match' } : null } };
      el.eventListeners['input']?.[0]?.(inputEvent);

      assert.ok(el.innerHTML.includes('No certificates found'));
    });
  });

  describe('sorting', () => {
    it('clicking a column header sorts by that column ascending', () => {
      const el = make();
      const certs = [
        { ...makeCerts(1)[0], id: 'a', cert_number: 'Z001', student: { name: 'Zara' } },
        { ...makeCerts(1)[0], id: 'b', cert_number: 'A001', student: { name: 'Aaron' } },
      ];
      el.data = certs;
      el.connectedCallback();

      // Simulate click on student_name header
      const clickEvent = { target: { closest: (sel) => sel === '[data-sort]' ? { dataset: { sort: 'student_name' } } : null } };
      el.eventListeners['click']?.[0]?.(clickEvent);

      // Aaron should come before Zara in rendered order
      const aaronPos = el.innerHTML.indexOf('Aaron');
      const zaraPos  = el.innerHTML.indexOf('Zara');
      assert.ok(aaronPos < zaraPos, 'Aaron should appear before Zara when sorted asc');
    });

    it('clicking the same header again reverses sort direction', () => {
      const el = make();
      const certs = [
        { ...makeCerts(1)[0], id: 'a', student: { name: 'Zara' } },
        { ...makeCerts(1)[0], id: 'b', student: { name: 'Aaron' } },
      ];
      el.data = certs;
      el.connectedCallback();

      const clickEvent = { target: { closest: (sel) => sel === '[data-sort]' ? { dataset: { sort: 'student_name' } } : null } };
      // First click → asc
      el.eventListeners['click']?.[0]?.(clickEvent);
      // Second click → desc
      el.eventListeners['click']?.[0]?.(clickEvent);

      // Zara should come before Aaron (desc)
      const zaraPos  = el.innerHTML.indexOf('Zara');
      const aaronPos = el.innerHTML.indexOf('Aaron');
      assert.ok(zaraPos < aaronPos, 'Zara should appear before Aaron when sorted desc');
    });

    it('sorted column header has --sorted class and aria-sort', () => {
      const el = make();
      el.data = makeCerts(2);
      el.connectedCallback();

      const clickEvent = { target: { closest: (sel) => sel === '[data-sort]' ? { dataset: { sort: 'cert_number' } } : null } };
      el.eventListeners['click']?.[0]?.(clickEvent);

      assert.ok(el.innerHTML.includes('cert-table__th--sorted'));
      assert.ok(el.innerHTML.includes('aria-sort="ascending"'));
    });
  });

  describe('pagination', () => {
    // Sort by cert_number asc before pagination tests so the order is
    // predictable regardless of the default issued_at sort.
    function sortByCertNumber(el) {
      const click = { target: { closest: (sel) => sel === '[data-sort]' ? { dataset: { sort: 'cert_number' } } : null } };
      el.eventListeners['click']?.[0]?.(click); // asc
    }

    it('respects page-size attribute', () => {
      const el = make();
      el.setAttribute('page-size', '2');
      el.data = makeCerts(5);
      el.connectedCallback();
      sortByCertNumber(el);

      // CERT-0001, CERT-0002 on page 1
      assert.ok(el.innerHTML.includes('CERT-0001'));
      assert.ok(el.innerHTML.includes('CERT-0002'));
      assert.ok(!el.innerHTML.includes('CERT-0003'));
    });

    it('next button advances page', () => {
      const el = make();
      el.setAttribute('page-size', '2');
      el.data = makeCerts(5);
      el.connectedCallback();
      sortByCertNumber(el);

      const nextClick = { target: { closest: (sel) => sel === '[data-page]' ? { dataset: { page: 'next' }, disabled: false } : null } };
      el.eventListeners['click']?.[0]?.(nextClick);

      // Page 2: CERT-0003, CERT-0004
      assert.ok(!el.innerHTML.includes('CERT-0001'));
      assert.ok(el.innerHTML.includes('CERT-0003'));
    });

    it('prev button goes back a page', () => {
      const el = make();
      el.setAttribute('page-size', '2');
      el.data = makeCerts(5);
      el.connectedCallback();
      sortByCertNumber(el);

      const nextClick = { target: { closest: (sel) => sel === '[data-page]' ? { dataset: { page: 'next' }, disabled: false } : null } };
      const prevClick = { target: { closest: (sel) => sel === '[data-page]' ? { dataset: { page: 'prev' }, disabled: false } : null } };

      el.eventListeners['click']?.[0]?.(nextClick); // → page 2
      el.eventListeners['click']?.[0]?.(prevClick); // → page 1

      assert.ok(el.innerHTML.includes('CERT-0001'));
      assert.ok(!el.innerHTML.includes('CERT-0003'));
    });

    it('prev button is disabled on page 1', () => {
      const el = make();
      el.data = makeCerts(5);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('data-page="prev"'));
      // Prev button should have disabled attribute on first page
      const prevSection = el.innerHTML.slice(
        el.innerHTML.indexOf('data-page="prev"') - 50,
        el.innerHTML.indexOf('data-page="prev"') + 100
      );
      assert.ok(prevSection.includes('disabled'));
    });

    it('resets to page 1 when data is reassigned', () => {
      const el = make();
      el.setAttribute('page-size', '2');
      el.data = makeCerts(5);
      el.connectedCallback();
      sortByCertNumber(el);

      // Advance to page 2 — CERT-0001 should not be visible
      const nextClick = { target: { closest: (sel) => sel === '[data-page]' ? { dataset: { page: 'next' }, disabled: false } : null } };
      el.eventListeners['click']?.[0]?.(nextClick);
      assert.ok(!el.innerHTML.includes('CERT-0001'));

      // Reassigning data resets to page 1 and re-renders (default sort)
      // Verify page indicator returns to 1 / N
      el.data = makeCerts(5);
      assert.ok(el.innerHTML.includes('1 / '));
    });

    it('shows result count in pagination info', () => {
      const el = make();
      el.data = makeCerts(3);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('3'));
    });
  });

  describe('events', () => {
    it('dispatches cert-select when a row is clicked', () => {
      const el = make();
      const certs = makeCerts(2);
      el.data = certs;
      el.connectedCallback();

      const selected = [];
      el.addEventListener('cert-select', e => selected.push(e.detail.cert));

      // Simulate click on a row with data-id
      const rowClick = {
        target: {
          closest: (sel) => {
            if (sel === '[data-sort]') return null;
            if (sel === '[data-page]') return null;
            if (sel === '[data-id]') return { dataset: { id: 'id-0' } };
            return null;
          },
        },
      };
      el.eventListeners['click']?.[0]?.(rowClick);

      assert.equal(selected.length, 1);
      assert.equal(selected[0].id, 'id-0');
    });

    it('does not dispatch cert-select for unknown id', () => {
      const el = make();
      el.data = makeCerts(2);
      el.connectedCallback();

      const selected = [];
      el.addEventListener('cert-select', e => selected.push(e));

      const rowClick = {
        target: {
          closest: (sel) => sel === '[data-id]' ? { dataset: { id: 'no-such-id' } } : null,
        },
      };
      el.eventListeners['click']?.[0]?.(rowClick);
      assert.equal(selected.length, 0);
    });
  });

  describe('lifecycle', () => {
    it('connectedCallback() registers click, change, and input listeners', () => {
      const el = make();
      el.connectedCallback();
      assert.ok(el.eventListeners['click']?.length > 0);
      assert.ok(el.eventListeners['change']?.length > 0);
      assert.ok(el.eventListeners['input']?.length > 0);
    });

    it('disconnectedCallback() removes all listeners', () => {
      const el = make();
      el.connectedCallback();
      el.disconnectedCallback();
      assert.equal(el.eventListeners['click']?.length ?? 0, 0);
      assert.equal(el.eventListeners['change']?.length ?? 0, 0);
      assert.equal(el.eventListeners['input']?.length ?? 0, 0);
    });
  });
});
