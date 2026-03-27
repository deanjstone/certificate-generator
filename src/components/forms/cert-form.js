import { AppElement } from '../base/AppElement.js';

/**
 * Create / edit certificate form component.
 *
 * Emits `cert-form-change` on every field change so the certificate preview
 * can update live. Emits `cert-form-submit` when the form is submitted.
 *
 * Pre-populate an existing certificate by setting the `data` JS property.
 * The `mode` attribute switches the submit label between "Save Draft" /
 * "Issue" and controls which actions are shown in edit mode.
 *
 * @element cert-form
 *
 * @attr {'create'|'edit'} [mode='create'] - Form mode
 *
 * @prop {object|null} data - Existing certificate record to pre-populate
 *
 * @fires cert-form-change - Bubbles/composed. `detail: { field, value, formData }`
 *   fired on every input/change event. `formData` is the full current form state.
 * @fires cert-form-submit - Bubbles/composed. `detail: { action, formData }`
 *   where `action` is 'draft' | 'issue'.
 *
 * @example
 * <cert-form mode="create"></cert-form>
 *
 * const form = document.querySelector('cert-form');
 * form.addEventListener('cert-form-submit', e => {
 *   const { action, formData } = e.detail;
 * });
 */
export class CertForm extends AppElement {
  /** @type {object|null} */
  #data = null;

  static get observedAttributes() {
    return ['mode'];
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  connectedCallback() {
    super.connectedCallback();
    this.render();
    this.#applyStyles();
    this.addEventListener('input', this.#handleInput);
    this.addEventListener('change', this.#handleChange);
    this.addEventListener('click', this.#handleClick);
    this.addEventListener('submit', this.#handleSubmit);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('input', this.#handleInput);
    this.removeEventListener('change', this.#handleChange);
    this.removeEventListener('click', this.#handleClick);
    this.removeEventListener('submit', this.#handleSubmit);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** @param {object|null} cert */
  set data(cert) {
    this.#data = cert ?? null;
    if (this.isConnected) this.render();
  }

  get data() { return this.#data; }

  /**
   * Return the current form state as a plain object.
   * @returns {object}
   */
  getFormData() {
    return this.#collectFormData();
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  render() {
    const mode = this.attr('mode', 'create');
    const d = this.#data ?? {};
    const student = d.student ?? {};
    const qualification = d.qualification ?? {};
    const security = d.security ?? {};

    this.innerHTML = `
      <form class="cert-form" novalidate>

        <fieldset class="cert-form__section">
          <legend class="cert-form__legend">Certificate</legend>
          <div class="cert-form__row">
            <label class="cert-form__label">
              Certificate number
              <input class="cert-form__input" type="text" name="cert_number"
                value="${this.#esc(d.cert_number ?? '')}"
                placeholder="Auto-generated if blank" />
            </label>
            <label class="cert-form__label">
              Type <span class="cert-form__required" aria-hidden="true">*</span>
              <select class="cert-form__select" name="cert_type" required>
                <option value="">Select type…</option>
                ${this.#typeOption('qualification', 'Certificate of Qualification', d.cert_type)}
                ${this.#typeOption('statement',     'Statement of Attainment',      d.cert_type)}
                ${this.#typeOption('transcript',    'Record of Results / Transcript', d.cert_type)}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset class="cert-form__section">
          <legend class="cert-form__legend">Student</legend>
          <div class="cert-form__row">
            <label class="cert-form__label">
              Full name <span class="cert-form__required" aria-hidden="true">*</span>
              <input class="cert-form__input" type="text" name="student_name"
                value="${this.#esc(student.name ?? '')}" required />
            </label>
            <label class="cert-form__label">
              Date of birth
              <input class="cert-form__input" type="date" name="student_dob"
                value="${this.#esc(student.dob ?? '')}" />
            </label>
          </div>
          <div class="cert-form__row">
            <label class="cert-form__label">
              USI
              <input class="cert-form__input" type="text" name="student_usi"
                value="${this.#esc(student.usi ?? '')}"
                placeholder="10-character USI" maxlength="10" />
            </label>
            <label class="cert-form__label">
              Email
              <input class="cert-form__input" type="email" name="student_email"
                value="${this.#esc(student.email ?? '')}" />
            </label>
          </div>
        </fieldset>

        <fieldset class="cert-form__section">
          <legend class="cert-form__legend">Qualification</legend>
          <div class="cert-form__row">
            <label class="cert-form__label">
              Code <span class="cert-form__required" aria-hidden="true">*</span>
              <input class="cert-form__input" type="text" name="qual_code"
                value="${this.#esc(qualification.code ?? '')}"
                placeholder="e.g. BSB50420" required />
            </label>
            <label class="cert-form__label">
              Title <span class="cert-form__required" aria-hidden="true">*</span>
              <input class="cert-form__input" type="text" name="qual_title"
                value="${this.#esc(qualification.title ?? '')}"
                placeholder="e.g. Diploma of Leadership and Management" required />
            </label>
          </div>
          <div class="cert-form__units" id="cert-form-units">
            ${this.#renderUnits(qualification.units ?? [])}
          </div>
          <button type="button" class="cert-form__btn-secondary" data-action="add-unit">
            + Add unit
          </button>
        </fieldset>

        <fieldset class="cert-form__section">
          <legend class="cert-form__legend">Security</legend>
          <div class="cert-form__row cert-form__row--checkboxes">
            <label class="cert-form__checkbox-label">
              <input type="checkbox" name="security_watermark"
                ${security.watermark ? 'checked' : ''} />
              Security watermark
            </label>
            <label class="cert-form__checkbox-label">
              <input type="checkbox" name="security_eseal"
                ${security.eseal ? 'checked' : ''} />
              Digital e-seal
            </label>
          </div>
        </fieldset>

        <div class="cert-form__actions">
          ${mode === 'edit' ? `
            <button type="submit" class="cert-form__btn cert-form__btn--secondary"
              data-action="draft">Save Draft</button>
            <button type="submit" class="cert-form__btn cert-form__btn--primary"
              data-action="issue">Issue Certificate</button>
          ` : `
            <button type="submit" class="cert-form__btn cert-form__btn--secondary"
              data-action="draft">Save Draft</button>
            <button type="submit" class="cert-form__btn cert-form__btn--primary"
              data-action="issue">Issue Certificate</button>
          `}
        </div>

      </form>
    `;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** @param {string} val @param {string} label @param {string|undefined} current */
  #typeOption(val, label, current) {
    return `<option value="${val}" ${current === val ? 'selected' : ''}>${label}</option>`;
  }

  /** @param {Array<{code:string,title:string}>} units */
  #renderUnits(units) {
    if (units.length === 0) {
      return `<p class="cert-form__units-empty">No units added yet.</p>`;
    }
    return units.map((u, i) => `
      <div class="cert-form__unit-row" data-unit-index="${i}">
        <input class="cert-form__input cert-form__input--unit-code"
          type="text" name="unit_code_${i}"
          value="${this.#esc(u.code ?? '')}" placeholder="Unit code" aria-label="Unit ${i + 1} code" />
        <input class="cert-form__input cert-form__input--unit-title"
          type="text" name="unit_title_${i}"
          value="${this.#esc(u.title ?? '')}" placeholder="Unit title" aria-label="Unit ${i + 1} title" />
        <button type="button" class="cert-form__btn-icon" data-action="remove-unit" data-unit-index="${i}"
          aria-label="Remove unit ${i + 1}">&#x2715;</button>
      </div>
    `).join('');
  }

  // ---------------------------------------------------------------------------
  // Form data collection
  // ---------------------------------------------------------------------------

  #collectFormData() {
    const units = this.#collectUnits();
    const get = name => this.querySelector(`[name="${name}"]`)?.value ?? '';
    const checked = name => this.querySelector(`[name="${name}"]`)?.checked ?? false;

    return {
      cert_number:  get('cert_number') || null,
      cert_type:    get('cert_type') || null,
      student: {
        name:  get('student_name'),
        dob:   get('student_dob') || null,
        usi:   get('student_usi') || null,
        email: get('student_email') || null,
      },
      qualification: {
        code:  get('qual_code'),
        title: get('qual_title'),
        units,
      },
      security: {
        watermark: checked('security_watermark'),
        eseal:     checked('security_eseal'),
      },
    };
  }

  #collectUnits() {
    const rows = this.querySelectorAll('[data-unit-index]');
    return Array.from(rows).map(row => {
      const idx = row.dataset.unitIndex;
      return {
        code:  row.querySelector(`[name="unit_code_${idx}"]`)?.value ?? '',
        title: row.querySelector(`[name="unit_title_${idx}"]`)?.value ?? '',
      };
    }).filter(u => u.code || u.title);
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  #handleInput = (e) => {
    if (!e.target.closest('form')) return;
    this.#emitChange(e.target.name, e.target.value);
  };

  #handleChange = (e) => {
    if (!e.target.closest('form')) return;
    this.#emitChange(e.target.name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
  };

  #handleClick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    if (btn.dataset.action === 'add-unit') {
      e.preventDefault();
      this.#addUnit();
    } else if (btn.dataset.action === 'remove-unit') {
      e.preventDefault();
      this.#removeUnit(parseInt(btn.dataset.unitIndex, 10));
    }
  };

  #handleSubmit = (e) => {
    e.preventDefault();
    // Determine which submit button was activated
    const action = e.submitter?.dataset?.action ?? 'draft';
    const formData = this.#collectFormData();

    if (!this.#validate(formData)) return;

    this.dispatchEvent(new CustomEvent('cert-form-submit', {
      bubbles: true, composed: true,
      detail: { action, formData },
    }));
  };

  /** @param {string} field @param {*} value */
  #emitChange(field, value) {
    this.dispatchEvent(new CustomEvent('cert-form-change', {
      bubbles: true, composed: true,
      detail: { field, value, formData: this.#collectFormData() },
    }));
  }

  // ---------------------------------------------------------------------------
  // Unit management
  // ---------------------------------------------------------------------------

  #addUnit() {
    const formData = this.#collectFormData();
    const units = formData.qualification.units;
    units.push({ code: '', title: '' });
    const container = this.querySelector('#cert-form-units');
    if (container) container.innerHTML = this.#renderUnits(units);
  }

  /** @param {number} index */
  #removeUnit(index) {
    const formData = this.#collectFormData();
    const units = formData.qualification.units.filter((_, i) => i !== index);
    const container = this.querySelector('#cert-form-units');
    if (container) container.innerHTML = this.#renderUnits(units);
    this.#emitChange('units', units);
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  /** @param {object} formData @returns {boolean} */
  #validate(formData) {
    const errors = [];
    if (!formData.cert_type) errors.push('Certificate type is required.');
    if (!formData.student.name?.trim()) errors.push('Student name is required.');
    if (!formData.qualification.code?.trim()) errors.push('Qualification code is required.');
    if (!formData.qualification.title?.trim()) errors.push('Qualification title is required.');

    this.#clearErrors();
    if (errors.length) {
      this.#showErrors(errors);
      return false;
    }
    return true;
  }

  #clearErrors() {
    const el = this.querySelector('.cert-form__errors');
    if (el) el.remove();
  }

  /** @param {string[]} errors */
  #showErrors(errors) {
    const el = document.createElement('div');
    el.className = 'cert-form__errors';
    el.setAttribute('role', 'alert');
    el.innerHTML = `<ul>${errors.map(e => `<li>${this.#esc(e)}</li>`).join('')}</ul>`;
    this.querySelector('.cert-form__actions')?.before(el);
  }

  // ---------------------------------------------------------------------------

  /** @param {*} val */
  #esc(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  #applyStyles() {
    if (document.getElementById('cert-form-styles')) return;
    const style = document.createElement('style');
    style.id = 'cert-form-styles';
    style.textContent = `
      cert-form { display: block; }
      .cert-form { display: flex; flex-direction: column; gap: var(--size-5); }
      .cert-form__section {
        border: var(--border-size-1) solid var(--surface-3);
        border-radius: var(--radius-2);
        padding: var(--size-4);
        margin: 0;
      }
      .cert-form__legend {
        font-weight: var(--font-weight-6);
        font-size: var(--font-size-1);
        padding: 0 var(--size-2);
        color: var(--text-2);
      }
      .cert-form__row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--size-3);
        margin-block-start: var(--size-3);
      }
      .cert-form__row--checkboxes { grid-template-columns: repeat(auto-fit, minmax(160px, max-content)); }
      .cert-form__label {
        display: flex; flex-direction: column; gap: var(--size-1);
        font-size: var(--font-size-1); color: var(--text-2);
      }
      .cert-form__required { color: var(--red-6); }
      .cert-form__input, .cert-form__select {
        padding: var(--size-2) var(--size-3);
        border: var(--border-size-1) solid var(--surface-3);
        border-radius: var(--radius-2);
        background: var(--surface-1); color: var(--text-1);
        font-size: var(--font-size-1);
      }
      .cert-form__input:focus, .cert-form__select:focus {
        outline: var(--border-size-2) solid var(--brand);
        outline-offset: 1px;
      }
      .cert-form__checkbox-label {
        display: flex; align-items: center; gap: var(--size-2);
        font-size: var(--font-size-1); color: var(--text-1); cursor: pointer;
        margin-block-start: var(--size-3);
      }
      .cert-form__units { display: flex; flex-direction: column; gap: var(--size-2); margin-block-start: var(--size-3); }
      .cert-form__unit-row { display: grid; grid-template-columns: 140px 1fr auto; gap: var(--size-2); align-items: center; }
      .cert-form__btn-icon {
        background: none; border: none; cursor: pointer;
        color: var(--text-2); font-size: var(--font-size-2); padding: var(--size-1);
      }
      .cert-form__btn-icon:hover { color: var(--red-6); }
      .cert-form__btn-secondary {
        margin-block-start: var(--size-3);
        background: none; border: var(--border-size-1) dashed var(--surface-3);
        border-radius: var(--radius-2); padding: var(--size-2) var(--size-3);
        font-size: var(--font-size-1); color: var(--text-2); cursor: pointer;
        inline-size: 100%;
      }
      .cert-form__btn-secondary:hover { border-color: var(--brand); color: var(--brand); }
      .cert-form__actions { display: flex; justify-content: flex-end; gap: var(--size-2); }
      .cert-form__btn {
        padding: var(--size-2) var(--size-5); border-radius: var(--radius-2);
        font-size: var(--font-size-1); font-weight: var(--font-weight-5); cursor: pointer;
        border: var(--border-size-1) solid transparent;
      }
      .cert-form__btn--secondary { background: var(--surface-2); border-color: var(--surface-3); color: var(--text-1); }
      .cert-form__btn--secondary:hover { background: var(--surface-3); }
      .cert-form__btn--primary { background: var(--brand); color: var(--gray-0); }
      .cert-form__btn--primary:hover { filter: brightness(1.1); }
      .cert-form__errors {
        background: var(--red-1); border: var(--border-size-1) solid var(--red-3);
        border-radius: var(--radius-2); padding: var(--size-3) var(--size-4);
        color: var(--red-8); font-size: var(--font-size-1);
      }
      .cert-form__errors ul { margin: 0; padding-inline-start: var(--size-4); }
      .cert-form__units-empty { color: var(--text-2); font-size: var(--font-size-1); margin: 0; }
    `;
    document.head.appendChild(style);
  }
}

customElements.define('cert-form', CertForm);
