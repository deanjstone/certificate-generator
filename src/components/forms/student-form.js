import { AppElement } from '../base/AppElement.js';

/**
 * Create / edit student form component.
 *
 * @element student-form
 *
 * @attr {'create'|'edit'} [mode='create'] - Form mode
 *
 * @prop {object|null} data - Existing student record to pre-populate
 *
 * @fires student-form-submit - Bubbles/composed. `detail: { formData }`
 * @fires student-form-cancel - Bubbles/composed. Fired when Cancel is clicked.
 *
 * @example
 * <student-form mode="edit"></student-form>
 *
 * const form = document.querySelector('student-form');
 * form.data = { name: 'Jane Smith', email: 'jane@example.com' };
 * form.addEventListener('student-form-submit', e => save(e.detail.formData));
 */
export class StudentForm extends AppElement {
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
    this.addEventListener('submit', this.#handleSubmit);
    this.addEventListener('click', this.#handleClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('submit', this.#handleSubmit);
    this.removeEventListener('click', this.#handleClick);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** @param {object|null} student */
  set data(student) {
    this.#data = student ?? null;
    if (this.isConnected) this.render();
  }

  get data() { return this.#data; }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  render() {
    const mode = this.attr('mode', 'create');
    const d = this.#data ?? {};

    this.innerHTML = `
      <form class="student-form" novalidate>
        <div class="student-form__fields">

          <label class="student-form__label">
            Full name <span class="student-form__required" aria-hidden="true">*</span>
            <input class="student-form__input" type="text" name="name"
              value="${this.#esc(d.name ?? '')}" required
              autocomplete="name" />
          </label>

          <label class="student-form__label">
            Date of birth
            <input class="student-form__input" type="date" name="dob"
              value="${this.#esc(d.dob ?? '')}" />
          </label>

          <label class="student-form__label">
            USI
            <input class="student-form__input" type="text" name="usi"
              value="${this.#esc(d.usi ?? '')}"
              placeholder="10-character Unique Student Identifier"
              maxlength="10" pattern="[A-Z0-9]{10}"
              autocomplete="off" />
            <span class="student-form__hint">
              10 uppercase alphanumeric characters (e.g. ABCDE12345)
            </span>
          </label>

          <label class="student-form__label">
            Email
            <input class="student-form__input" type="email" name="email"
              value="${this.#esc(d.email ?? '')}"
              autocomplete="email" />
          </label>

        </div>

        <div class="student-form__actions">
          <button type="button" class="student-form__btn student-form__btn--secondary"
            data-action="cancel">Cancel</button>
          <button type="submit" class="student-form__btn student-form__btn--primary">
            ${mode === 'edit' ? 'Save changes' : 'Add student'}
          </button>
        </div>
      </form>
    `;
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  #handleSubmit = (e) => {
    e.preventDefault();
    const formData = this.#collectFormData();
    if (!this.#validate(formData)) return;

    this.dispatchEvent(new CustomEvent('student-form-submit', {
      bubbles: true, composed: true,
      detail: { formData },
    }));
  };

  #handleClick = (e) => {
    if (e.target.closest('[data-action="cancel"]')) {
      this.dispatchEvent(new CustomEvent('student-form-cancel', {
        bubbles: true, composed: true,
      }));
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  #collectFormData() {
    const get = name => this.querySelector(`[name="${name}"]`)?.value?.trim() ?? '';
    return {
      name:  get('name'),
      dob:   get('dob')   || null,
      usi:   get('usi')   || null,
      email: get('email') || null,
    };
  }

  /** @param {object} d @returns {boolean} */
  #validate(d) {
    const errors = [];
    if (!d.name) errors.push('Full name is required.');
    if (d.usi && !/^[A-Z0-9]{10}$/.test(d.usi)) {
      errors.push('USI must be exactly 10 uppercase alphanumeric characters.');
    }
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
      errors.push('Email address is not valid.');
    }

    this.#clearErrors();
    if (errors.length) { this.#showErrors(errors); return false; }
    return true;
  }

  #clearErrors() {
    this.querySelector('.student-form__errors')?.remove();
  }

  /** @param {string[]} errors */
  #showErrors(errors) {
    const el = document.createElement('div');
    el.className = 'student-form__errors';
    el.setAttribute('role', 'alert');
    el.innerHTML = `<ul>${errors.map(e => `<li>${this.#esc(e)}</li>`).join('')}</ul>`;
    this.querySelector('.student-form__actions')?.before(el);
  }

  /** @param {*} val */
  #esc(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  #applyStyles() {
    if (document.getElementById('student-form-styles')) return;
    const style = document.createElement('style');
    style.id = 'student-form-styles';
    style.textContent = `
      student-form { display: block; }
      .student-form { display: flex; flex-direction: column; gap: var(--size-4); }
      .student-form__fields { display: flex; flex-direction: column; gap: var(--size-3); }
      .student-form__label {
        display: flex; flex-direction: column; gap: var(--size-1);
        font-size: var(--font-size-1); color: var(--text-2);
      }
      .student-form__required { color: var(--red-6); }
      .student-form__hint { font-size: var(--font-size-0); color: var(--text-3); }
      .student-form__input {
        padding: var(--size-2) var(--size-3);
        border: var(--border-size-1) solid var(--surface-3);
        border-radius: var(--radius-2);
        background: var(--surface-1); color: var(--text-1);
        font-size: var(--font-size-1);
      }
      .student-form__input:focus {
        outline: var(--border-size-2) solid var(--brand); outline-offset: 1px;
      }
      .student-form__actions { display: flex; justify-content: flex-end; gap: var(--size-2); }
      .student-form__btn {
        padding: var(--size-2) var(--size-4); border-radius: var(--radius-2);
        font-size: var(--font-size-1); font-weight: var(--font-weight-5);
        cursor: pointer; border: var(--border-size-1) solid transparent;
      }
      .student-form__btn--secondary { background: var(--surface-2); border-color: var(--surface-3); color: var(--text-1); }
      .student-form__btn--secondary:hover { background: var(--surface-3); }
      .student-form__btn--primary { background: var(--brand); color: var(--gray-0); }
      .student-form__btn--primary:hover { filter: brightness(1.1); }
      .student-form__errors {
        background: var(--red-1); border: var(--border-size-1) solid var(--red-3);
        border-radius: var(--radius-2); padding: var(--size-2) var(--size-4);
        color: var(--red-8); font-size: var(--font-size-1);
      }
      .student-form__errors ul { margin: 0; padding-inline-start: var(--size-4); }
    `;
    document.head.appendChild(style);
  }
}

customElements.define('student-form', StudentForm);
