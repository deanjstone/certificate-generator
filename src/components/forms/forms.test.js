/**
 * Tests for form Web Components.
 * Focuses on pure logic (CSV parse, validation) plus rendering assertions
 * against innerHTML strings.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// DOM stubs — set before any dynamic imports
// ---------------------------------------------------------------------------

const _injectedStyles = {};

class FakeElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this._attrs = {};
    this.innerHTML = '';
    this.textContent = '';
    this.children = [];
    this.isConnected = true;
    this.eventListeners = {};
    this.value = '';
    this.checked = false;
    this.files = null;
    this.dataset = {};
    this.name = '';
    this.type = '';
    this.disabled = false;
    this.style = { cssText: '' };
    this.className = '';
  }
  hasAttribute(n) { return Object.prototype.hasOwnProperty.call(this._attrs, n); }
  getAttribute(n) { return this._attrs[n] ?? null; }
  setAttribute(n, v) { this._attrs[n] = String(v); if (n === 'class') this.className = String(v); }
  removeAttribute(n) { delete this._attrs[n]; }
  addEventListener(type, fn) {
    this.eventListeners[type] = this.eventListeners[type] || [];
    this.eventListeners[type].push(fn);
  }
  removeEventListener(type, fn) {
    if (this.eventListeners[type])
      this.eventListeners[type] = this.eventListeners[type].filter(f => f !== fn);
  }
  dispatchEvent(e) {
    (this.eventListeners[e.type] || []).forEach(fn => fn(e));
    return true;
  }
  querySelector(sel) {
    // [name="x"] selector
    const nameMatch = sel.match(/\[name="(.+?)"\]/);
    if (nameMatch) return this.#find(el => el.name === nameMatch[1] || el._attrs?.name === nameMatch[1]);
    // .class selector
    const clsMatch = sel.match(/^\.([\w-]+)$/);
    if (clsMatch) return this.#find(el => el.className?.includes(clsMatch[1]));
    // [data-action="x"]
    const actionMatch = sel.match(/\[data-action="(.+?)"\]/);
    if (actionMatch) return this.#find(el => el.dataset?.action === actionMatch[1]);
    // tag selector
    if (/^[a-z-]+$/.test(sel)) return this.#find(el => el.tagName?.toLowerCase() === sel);
    return null;
  }
  querySelectorAll(sel) {
    const nameMatch = sel.match(/\[data-unit-index\]/);
    if (nameMatch) return this.#findAll(el => el.dataset?.unitIndex !== undefined);
    const unitNameMatch = sel.match(/\[name="(.+?)"\]/);
    if (unitNameMatch) return this.#findAll(el => el.name === unitNameMatch[1] || el._attrs?.name === unitNameMatch[1]);
    return [];
  }
  #find(pred) {
    for (const child of this.children) {
      if (pred(child)) return child;
      const found = child.querySelector ? child.#find?.(pred) : null;
      if (found) return found;
    }
    return null;
  }
  #findAll(pred, result = []) {
    for (const child of this.children) {
      if (pred(child)) result.push(child);
      child.#findAll?.(pred, result);
    }
    return result;
  }
  closest(sel) {
    const clsMatch = sel.match(/^\.([\w-]+)$/);
    if (clsMatch && this.className?.includes(clsMatch[1])) return this;
    const actionMatch = sel.match(/\[data-action\]/);
    if (actionMatch && this.dataset?.action !== undefined) return this;
    const tagMatch = /^[a-z]+$/.test(sel);
    if (tagMatch && this.tagName?.toLowerCase() === sel) return this;
    return null;
  }
  appendChild(child) { this.children.push(child); return child; }
  before(el) { /* no-op in tests */ }
  remove() { this.isConnected = false; }
}

globalThis.HTMLElement = FakeElement;
globalThis.customElements = { define: () => {} };
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = init.bubbles ?? false;
    this.detail = init.detail ?? null;
  }
};
globalThis.document = {
  getElementById: id => _injectedStyles[id] ?? null,
  createElement(tag) {
    const el = new FakeElement(tag);
    if (tag === 'style') el.id = '';
    return el;
  },
  head: { appendChild(el) { if (el.id) _injectedStyles[el.id] = el; } },
};

// ---------------------------------------------------------------------------
// Load modules
// ---------------------------------------------------------------------------

const { CertForm }     = await import('./cert-form.js');
const { ImportForm }   = await import('./import-form.js');
const { StudentForm }  = await import('./student-form.js');
const { SettingsForm } = await import('./settings-form.js');

function make(Cls) { return new Cls(); }

// ===========================================================================
// CertForm
// ===========================================================================

describe('CertForm', () => {
  describe('registration', () => {
    it('extends HTMLElement', () => assert.ok(CertForm.prototype instanceof HTMLElement));
    it('observes mode attribute', () => assert.ok(CertForm.observedAttributes.includes('mode')));
  });

  describe('rendering', () => {
    it('renders without error when connected', () => {
      const el = make(CertForm);
      assert.doesNotThrow(() => el.connectedCallback());
    });

    it('renders cert_type select with three options', () => {
      const el = make(CertForm);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('qualification'));
      assert.ok(el.innerHTML.includes('statement'));
      assert.ok(el.innerHTML.includes('transcript'));
    });

    it('renders student fields', () => {
      const el = make(CertForm);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('name="student_name"'));
      assert.ok(el.innerHTML.includes('name="student_dob"'));
      assert.ok(el.innerHTML.includes('name="student_usi"'));
      assert.ok(el.innerHTML.includes('name="student_email"'));
    });

    it('renders qualification fields', () => {
      const el = make(CertForm);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('name="qual_code"'));
      assert.ok(el.innerHTML.includes('name="qual_title"'));
    });

    it('renders security checkboxes', () => {
      const el = make(CertForm);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('name="security_watermark"'));
      assert.ok(el.innerHTML.includes('name="security_eseal"'));
    });

    it('pre-populates fields from data property', () => {
      const el = make(CertForm);
      el.data = {
        cert_type: 'qualification',
        cert_number: 'CERT-001',
        student: { name: 'Jane Smith', email: 'jane@test.com' },
        qualification: { code: 'BSB50420', title: 'Diploma of Leadership' },
        security: {},
      };
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('CERT-001'));
      assert.ok(el.innerHTML.includes('Jane Smith'));
      assert.ok(el.innerHTML.includes('BSB50420'));
      assert.ok(el.innerHTML.includes('selected') && el.innerHTML.includes('qualification'));
    });

    it('renders existing units', () => {
      const el = make(CertForm);
      el.data = {
        qualification: {
          code: 'BSB50420', title: 'Test',
          units: [{ code: 'BSB001', title: 'Unit One' }],
        },
      };
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('BSB001'));
      assert.ok(el.innerHTML.includes('Unit One'));
    });

    it('escapes HTML in data values to prevent XSS', () => {
      const el = make(CertForm);
      el.data = { student: { name: '<script>alert(1)</script>' } };
      el.connectedCallback();
      assert.ok(!el.innerHTML.includes('<script>'));
      assert.ok(el.innerHTML.includes('&lt;script&gt;'));
    });
  });

  describe('validation', () => {
    it('emits cert-form-submit with valid data', () => {
      const el = make(CertForm);
      el.connectedCallback();

      // Stub querySelector to return field values
      el.querySelector = (sel) => {
        const map = {
          '[name="cert_number"]':       { value: '' },
          '[name="cert_type"]':         { value: 'qualification' },
          '[name="student_name"]':      { value: 'Jane Smith' },
          '[name="student_dob"]':       { value: '' },
          '[name="student_usi"]':       { value: '' },
          '[name="student_email"]':     { value: '' },
          '[name="qual_code"]':         { value: 'BSB50420' },
          '[name="qual_title"]':        { value: 'Diploma Test' },
          '[name="security_watermark"]':{ checked: false },
          '[name="security_eseal"]':    { checked: false },
          '.cert-form__actions':        { before: () => {} },
          '#cert-form-units':           null,
        };
        return map[sel] ?? null;
      };
      el.querySelectorAll = () => [];

      const events = [];
      el.addEventListener('cert-form-submit', e => events.push(e));
      el.eventListeners['submit']?.[0]?.({ preventDefault: () => {}, submitter: { dataset: { action: 'issue' } } });

      assert.equal(events.length, 1);
      assert.equal(events[0].detail.action, 'issue');
      assert.equal(events[0].detail.formData.student.name, 'Jane Smith');
    });

    it('does NOT emit cert-form-submit when required fields are missing', () => {
      const el = make(CertForm);
      el.connectedCallback();

      el.querySelector = (sel) => {
        const map = {
          '[name="cert_number"]':       { value: '' },
          '[name="cert_type"]':         { value: '' },   // missing
          '[name="student_name"]':      { value: '' },   // missing
          '[name="student_dob"]':       { value: '' },
          '[name="student_usi"]':       { value: '' },
          '[name="student_email"]':     { value: '' },
          '[name="qual_code"]':         { value: '' },   // missing
          '[name="qual_title"]':        { value: '' },   // missing
          '[name="security_watermark"]':{ checked: false },
          '[name="security_eseal"]':    { checked: false },
          '.cert-form__actions':        { before: () => {} },
          '.cert-form__errors':         null,
        };
        return map[sel] ?? null;
      };
      el.querySelectorAll = () => [];

      const events = [];
      el.addEventListener('cert-form-submit', e => events.push(e));
      el.eventListeners['submit']?.[0]?.({ preventDefault: () => {}, submitter: null });

      assert.equal(events.length, 0);
    });
  });

  describe('lifecycle', () => {
    it('registers input, change, click, and submit listeners', () => {
      const el = make(CertForm);
      el.connectedCallback();
      assert.ok(el.eventListeners['input']?.length > 0);
      assert.ok(el.eventListeners['change']?.length > 0);
      assert.ok(el.eventListeners['click']?.length > 0);
      assert.ok(el.eventListeners['submit']?.length > 0);
    });

    it('disconnectedCallback removes all listeners', () => {
      const el = make(CertForm);
      el.connectedCallback();
      el.disconnectedCallback();
      assert.equal(el.eventListeners['input']?.length ?? 0, 0);
      assert.equal(el.eventListeners['submit']?.length ?? 0, 0);
    });
  });
});

// ===========================================================================
// ImportForm — pure static parse() logic is the primary test target
// ===========================================================================

describe('ImportForm', () => {
  describe('registration', () => {
    it('extends HTMLElement', () => assert.ok(ImportForm.prototype instanceof HTMLElement));
  });

  describe('ImportForm.parse()', () => {
    const validCsv = [
      'cert_type,cert_number,student_name,student_dob,student_usi,student_email,qual_code,qual_title,unit_code_1,unit_title_1',
      'qualification,CERT-001,Jane Smith,1990-01-01,ABCDE12345,jane@test.com,BSB50420,Diploma of Leadership,BSBLDR511,Unit One',
      'statement,,Bob Jones,,,bob@test.com,BSB30120,Certificate III,,,',
    ].join('\n');

    it('parses valid rows into records', () => {
      const { records, errors } = ImportForm.parse(validCsv);
      assert.equal(records.length, 2);
      assert.equal(errors.length, 0);
    });

    it('extracts cert_type from first row', () => {
      const { records } = ImportForm.parse(validCsv);
      assert.equal(records[0].cert_type, 'qualification');
      assert.equal(records[1].cert_type, 'statement');
    });

    it('extracts student fields', () => {
      const { records } = ImportForm.parse(validCsv);
      assert.equal(records[0].student.name, 'Jane Smith');
      assert.equal(records[0].student.usi, 'ABCDE12345');
      assert.equal(records[0].student.email, 'jane@test.com');
    });

    it('extracts qualification fields', () => {
      const { records } = ImportForm.parse(validCsv);
      assert.equal(records[0].qualification.code, 'BSB50420');
      assert.equal(records[0].qualification.title, 'Diploma of Leadership');
    });

    it('extracts units', () => {
      const { records } = ImportForm.parse(validCsv);
      assert.equal(records[0].qualification.units.length, 1);
      assert.equal(records[0].qualification.units[0].code, 'BSBLDR511');
      assert.equal(records[0].qualification.units[0].title, 'Unit One');
    });

    it('uses null for empty optional fields', () => {
      const { records } = ImportForm.parse(validCsv);
      assert.equal(records[1].cert_number, null); // empty cert_number
      assert.equal(records[1].student.dob, null);
    });

    it('records an error for a row with missing required fields', () => {
      const csv = [
        'cert_type,student_name,qual_code,qual_title',
        ',Jane Smith,BSB50420,Test',  // cert_type missing
      ].join('\n');
      const { records, errors } = ImportForm.parse(csv);
      assert.equal(records.length, 0);
      assert.equal(errors.length, 1);
      assert.ok(errors[0].message.includes('cert_type'));
    });

    it('records an error for an invalid cert_type', () => {
      const csv = [
        'cert_type,student_name,qual_code,qual_title',
        'invalid,Jane Smith,BSB50420,Test',
      ].join('\n');
      const { records, errors } = ImportForm.parse(csv);
      assert.equal(records.length, 0);
      assert.equal(errors.length, 1);
      assert.ok(errors[0].message.toLowerCase().includes('invalid'));
    });

    it('skips blank lines', () => {
      const csv = validCsv + '\n\n\n';
      const { records } = ImportForm.parse(csv);
      assert.equal(records.length, 2);
    });

    it('handles CSV with quoted fields containing commas', () => {
      const csv = [
        'cert_type,cert_number,student_name,student_dob,student_usi,student_email,qual_code,qual_title',
        'qualification,,Jane Smith,,,,BSB50420,"Diploma of Leadership, Management"',
      ].join('\n');
      const { records } = ImportForm.parse(csv);
      assert.equal(records[0].qualification.title, 'Diploma of Leadership, Management');
    });

    it('handles Windows-style CRLF line endings', () => {
      const csv = 'cert_type,student_name,qual_code,qual_title\r\nqualification,Jane Smith,BSB50420,Test';
      const { records } = ImportForm.parse(csv);
      assert.equal(records.length, 1);
    });

    it('returns error when CSV has fewer than 2 lines', () => {
      const { records, errors } = ImportForm.parse('');
      assert.equal(records.length, 0);
      assert.equal(errors.length, 1);
    });

    it('normalises cert_type to lowercase', () => {
      const csv = [
        'cert_type,student_name,qual_code,qual_title',
        'QUALIFICATION,Jane Smith,BSB50420,Test',
      ].join('\n');
      const { records } = ImportForm.parse(csv);
      assert.equal(records[0].cert_type, 'qualification');
    });
  });

  describe('ImportForm.template()', () => {
    it('returns a non-empty CSV string', () => {
      const t = ImportForm.template();
      assert.ok(typeof t === 'string' && t.length > 0);
    });

    it('includes required headers', () => {
      const t = ImportForm.template();
      assert.ok(t.includes('cert_type'));
      assert.ok(t.includes('student_name'));
      assert.ok(t.includes('qual_code'));
    });

    it('includes unit columns up to unit_code_10', () => {
      const t = ImportForm.template();
      assert.ok(t.includes('unit_code_10'));
    });
  });

  describe('rendering', () => {
    it('renders upload stage by default', () => {
      const el = make(ImportForm);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('import-form__dropzone') || el.innerHTML.includes('file'));
    });

    it('connectedCallback does not throw', () => {
      const el = make(ImportForm);
      assert.doesNotThrow(() => el.connectedCallback());
    });
  });
});

// ===========================================================================
// StudentForm
// ===========================================================================

describe('StudentForm', () => {
  describe('registration', () => {
    it('extends HTMLElement', () => assert.ok(StudentForm.prototype instanceof HTMLElement));
    it('observes mode attribute', () => assert.ok(StudentForm.observedAttributes.includes('mode')));
  });

  describe('rendering', () => {
    it('renders name, dob, usi, email fields', () => {
      const el = make(StudentForm);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('name="name"'));
      assert.ok(el.innerHTML.includes('name="dob"'));
      assert.ok(el.innerHTML.includes('name="usi"'));
      assert.ok(el.innerHTML.includes('name="email"'));
    });

    it('pre-populates from data property', () => {
      const el = make(StudentForm);
      el.data = { name: 'Alice Brown', email: 'alice@test.com', usi: 'ABCDE12345' };
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Alice Brown'));
      assert.ok(el.innerHTML.includes('alice@test.com'));
      assert.ok(el.innerHTML.includes('ABCDE12345'));
    });

    it('shows "Add student" in create mode', () => {
      const el = make(StudentForm);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Add student'));
    });

    it('shows "Save changes" in edit mode', () => {
      const el = make(StudentForm);
      el.setAttribute('mode', 'edit');
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Save changes'));
    });

    it('escapes HTML in data values', () => {
      const el = make(StudentForm);
      el.data = { name: '<img onerror=x>' };
      el.connectedCallback();
      assert.ok(!el.innerHTML.includes('<img'));
      assert.ok(el.innerHTML.includes('&lt;img'));
    });
  });

  describe('validation', () => {
    function makeWithValues(values) {
      const el = make(StudentForm);
      el.connectedCallback();
      el.querySelector = (sel) => {
        const map = {
          '[name="name"]':  { value: values.name  ?? '' },
          '[name="dob"]':   { value: values.dob   ?? '' },
          '[name="usi"]':   { value: values.usi   ?? '' },
          '[name="email"]': { value: values.email ?? '' },
          '.student-form__actions': { before: () => {} },
          '.student-form__errors':  null,
        };
        return map[sel] ?? null;
      };
      return el;
    }

    it('emits student-form-submit with valid data', () => {
      const el = makeWithValues({ name: 'Jane Smith', email: 'jane@test.com' });
      const events = [];
      el.addEventListener('student-form-submit', e => events.push(e));
      el.eventListeners['submit']?.[0]?.({ preventDefault: () => {} });
      assert.equal(events.length, 1);
      assert.equal(events[0].detail.formData.name, 'Jane Smith');
    });

    it('does NOT emit when name is empty', () => {
      const el = makeWithValues({ name: '' });
      const events = [];
      el.addEventListener('student-form-submit', e => events.push(e));
      el.eventListeners['submit']?.[0]?.({ preventDefault: () => {} });
      assert.equal(events.length, 0);
    });

    it('does NOT emit when USI has wrong format', () => {
      const el = makeWithValues({ name: 'Jane', usi: 'bad' });
      const events = [];
      el.addEventListener('student-form-submit', e => events.push(e));
      el.eventListeners['submit']?.[0]?.({ preventDefault: () => {} });
      assert.equal(events.length, 0);
    });

    it('accepts valid 10-char uppercase USI', () => {
      const el = makeWithValues({ name: 'Jane', usi: 'ABCDE12345' });
      const events = [];
      el.addEventListener('student-form-submit', e => events.push(e));
      el.eventListeners['submit']?.[0]?.({ preventDefault: () => {} });
      assert.equal(events.length, 1);
    });

    it('does NOT emit when email is malformed', () => {
      const el = makeWithValues({ name: 'Jane', email: 'notanemail' });
      const events = [];
      el.addEventListener('student-form-submit', e => events.push(e));
      el.eventListeners['submit']?.[0]?.({ preventDefault: () => {} });
      assert.equal(events.length, 0);
    });

    it('emits student-form-cancel when Cancel is clicked', () => {
      const el = make(StudentForm);
      el.connectedCallback();
      const events = [];
      el.addEventListener('student-form-cancel', e => events.push(e));
      const cancelEvent = {
        target: { closest: (sel) => sel === '[data-action="cancel"]' ? { dataset: { action: 'cancel' } } : null },
      };
      el.eventListeners['click']?.[0]?.(cancelEvent);
      assert.equal(events.length, 1);
    });
  });
});

// ===========================================================================
// SettingsForm
// ===========================================================================

describe('SettingsForm', () => {
  describe('registration', () => {
    it('extends HTMLElement', () => assert.ok(SettingsForm.prototype instanceof HTMLElement));
  });

  describe('rendering', () => {
    it('renders RTO fields', () => {
      const el = make(SettingsForm);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('name="rto_name"'));
      assert.ok(el.innerHTML.includes('name="rto_number"'));
      assert.ok(el.innerHTML.includes('name="rto_cricos"'));
    });

    it('renders signatory fields', () => {
      const el = make(SettingsForm);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('name="signatory_name"'));
      assert.ok(el.innerHTML.includes('name="signature_file"'));
    });

    it('renders logo file input', () => {
      const el = make(SettingsForm);
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('name="logo_file"'));
    });

    it('pre-populates from data property', () => {
      const el = make(SettingsForm);
      el.data = {
        rto: { name: 'Acme RTO', number: '12345', cricos: '01234A' },
        signatory: { name: 'John Doe' },
      };
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('Acme RTO'));
      assert.ok(el.innerHTML.includes('12345'));
      assert.ok(el.innerHTML.includes('John Doe'));
    });

    it('shows current signature preview when signature_url is set', () => {
      const el = make(SettingsForm);
      el.data = { signatory: { name: 'Joe', signature_url: 'https://cdn.example.com/sig.png' } };
      el.connectedCallback();
      assert.ok(el.innerHTML.includes('https://cdn.example.com/sig.png'));
    });

    it('escapes HTML in data values', () => {
      const el = make(SettingsForm);
      el.data = { rto: { name: '<script>x</script>', number: '123' } };
      el.connectedCallback();
      assert.ok(!el.innerHTML.includes('<script>'));
      assert.ok(el.innerHTML.includes('&lt;script&gt;'));
    });
  });

  describe('validation', () => {
    function makeWithValues(values) {
      const el = make(SettingsForm);
      el.connectedCallback();
      el.querySelector = (sel) => {
        const map = {
          '[name="rto_name"]':       { value: values.rto_name       ?? '' },
          '[name="rto_number"]':     { value: values.rto_number     ?? '' },
          '[name="rto_cricos"]':     { value: values.rto_cricos     ?? '' },
          '[name="signatory_name"]': { value: values.signatory_name ?? '' },
          '.settings-form__actions': { before: () => {} },
          '.settings-form__errors':  null,
        };
        return map[sel] ?? null;
      };
      return el;
    }

    it('emits settings-form-submit with valid data', () => {
      const el = makeWithValues({ rto_name: 'Acme', rto_number: '12345', signatory_name: 'John' });
      const events = [];
      el.addEventListener('settings-form-submit', e => events.push(e));
      el.eventListeners['submit']?.[0]?.({ preventDefault: () => {} });
      assert.equal(events.length, 1);
      assert.equal(events[0].detail.formData.rto.name, 'Acme');
    });

    it('does NOT emit when rto_name is missing', () => {
      const el = makeWithValues({ rto_number: '12345', signatory_name: 'John' });
      const events = [];
      el.addEventListener('settings-form-submit', e => events.push(e));
      el.eventListeners['submit']?.[0]?.({ preventDefault: () => {} });
      assert.equal(events.length, 0);
    });

    it('does NOT emit when rto_number is missing', () => {
      const el = makeWithValues({ rto_name: 'Acme', signatory_name: 'John' });
      const events = [];
      el.addEventListener('settings-form-submit', e => events.push(e));
      el.eventListeners['submit']?.[0]?.({ preventDefault: () => {} });
      assert.equal(events.length, 0);
    });

    it('does NOT emit when rto_number is non-numeric', () => {
      const el = makeWithValues({ rto_name: 'Acme', rto_number: 'ABC', signatory_name: 'John' });
      const events = [];
      el.addEventListener('settings-form-submit', e => events.push(e));
      el.eventListeners['submit']?.[0]?.({ preventDefault: () => {} });
      assert.equal(events.length, 0);
    });

    it('does NOT emit when signatory_name is missing', () => {
      const el = makeWithValues({ rto_name: 'Acme', rto_number: '12345' });
      const events = [];
      el.addEventListener('settings-form-submit', e => events.push(e));
      el.eventListeners['submit']?.[0]?.({ preventDefault: () => {} });
      assert.equal(events.length, 0);
    });

    it('emits settings-form-cancel when Cancel is clicked', () => {
      const el = make(SettingsForm);
      el.connectedCallback();
      const events = [];
      el.addEventListener('settings-form-cancel', e => events.push(e));
      const cancelEvent = {
        target: { closest: (sel) => sel === '[data-action="cancel"]' ? { dataset: { action: 'cancel' } } : null },
      };
      el.eventListeners['click']?.[0]?.(cancelEvent);
      assert.equal(events.length, 1);
    });
  });
});
