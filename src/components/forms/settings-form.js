import { AppElement } from '../base/AppElement.js';

/**
 * RTO settings form component.
 *
 * Manages three sections:
 *  1. RTO details — name, RTO number, CRICOS number
 *  2. Signatory — name and signature image upload (preview shown inline)
 *  3. Branding — logo image upload (preview shown inline)
 *
 * File uploads are handled client-side; the component emits a
 * `settings-form-submit` event with base64-encoded image data so the caller
 * can upload to Supabase Storage before persisting settings.
 *
 * @element settings-form
 *
 * @prop {object|null} data - Existing settings to pre-populate
 *
 * @fires settings-form-submit - Bubbles/composed.
 *   `detail: { formData }` where formData contains rto, signatory, and
 *   branding sections. Image files are included as File objects (or null).
 * @fires settings-form-cancel - Bubbles/composed.
 *
 * @example
 * <settings-form></settings-form>
 *
 * form.data = { rto: { name: 'Acme RTO', number: '12345' } };
 * form.addEventListener('settings-form-submit', e => persist(e.detail.formData));
 */
export class SettingsForm extends AppElement {
  /** @type {object|null} */
  #data = null;

  /** @type {File|null} */
  #signatureFile = null;

  /** @type {File|null} */
  #logoFile = null;

  connectedCallback() {
    super.connectedCallback();
    this.render();
    this.#applyStyles();
    this.addEventListener('submit', this.#handleSubmit);
    this.addEventListener('click', this.#handleClick);
    this.addEventListener('change', this.#handleFileChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('submit', this.#handleSubmit);
    this.removeEventListener('click', this.#handleClick);
    this.removeEventListener('change', this.#handleFileChange);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** @param {object|null} settings */
  set data(settings) {
    this.#data = settings ?? null;
    this.#signatureFile = null;
    this.#logoFile = null;
    if (this.isConnected) this.render();
  }

  get data() { return this.#data; }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  render() {
    const d = this.#data ?? {};
    const rto = d.rto ?? {};
    const signatory = d.signatory ?? {};
    const branding = d.branding ?? {};

    this.innerHTML = `
      <form class="settings-form" novalidate>

        <fieldset class="settings-form__section">
          <legend class="settings-form__legend">RTO Details</legend>

          <label class="settings-form__label">
            RTO name <span class="settings-form__required" aria-hidden="true">*</span>
            <input class="settings-form__input" type="text" name="rto_name"
              value="${this.#esc(rto.name ?? '')}" required
              placeholder="Registered Training Organisation name" />
          </label>

          <div class="settings-form__row">
            <label class="settings-form__label">
              RTO number <span class="settings-form__required" aria-hidden="true">*</span>
              <input class="settings-form__input" type="text" name="rto_number"
                value="${this.#esc(rto.number ?? '')}" required
                placeholder="e.g. 12345" pattern="[0-9]+" />
            </label>
            <label class="settings-form__label">
              CRICOS number
              <input class="settings-form__input" type="text" name="rto_cricos"
                value="${this.#esc(rto.cricos ?? '')}"
                placeholder="e.g. 01234A (if applicable)" />
            </label>
          </div>
        </fieldset>

        <fieldset class="settings-form__section">
          <legend class="settings-form__legend">Signatory</legend>

          <label class="settings-form__label">
            Signatory name <span class="settings-form__required" aria-hidden="true">*</span>
            <input class="settings-form__input" type="text" name="signatory_name"
              value="${this.#esc(signatory.name ?? '')}" required
              placeholder="Name as it appears on certificates" />
          </label>

          <div class="settings-form__upload-group">
            <label class="settings-form__label">
              Signature image (PNG, max 2 MB)
              <input class="settings-form__file" type="file"
                name="signature_file" accept="image/png,image/jpeg"
                aria-describedby="signature-hint" />
              <span class="settings-form__hint" id="signature-hint">
                Upload a PNG or JPEG of the signatory's signature.
                ${signatory.signature_url ? 'Current signature on file.' : 'No signature uploaded yet.'}
              </span>
            </label>
            ${signatory.signature_url ? `
              <div class="settings-form__preview">
                <img src="${this.#esc(signatory.signature_url)}"
                  alt="Current signature" class="settings-form__preview-img" />
              </div>
            ` : ''}
            ${this.#signatureFile ? `
              <p class="settings-form__file-name">
                New file: ${this.#esc(this.#signatureFile.name)}
              </p>
            ` : ''}
          </div>
        </fieldset>

        <fieldset class="settings-form__section">
          <legend class="settings-form__legend">Branding</legend>

          <div class="settings-form__upload-group">
            <label class="settings-form__label">
              Organisation logo (PNG, max 2 MB)
              <input class="settings-form__file" type="file"
                name="logo_file" accept="image/png,image/jpeg"
                aria-describedby="logo-hint" />
              <span class="settings-form__hint" id="logo-hint">
                Upload a PNG or JPEG logo for certificate headers.
                ${branding.logo_url ? 'Current logo on file.' : 'No logo uploaded yet.'}
              </span>
            </label>
            ${branding.logo_url ? `
              <div class="settings-form__preview">
                <img src="${this.#esc(branding.logo_url)}"
                  alt="Current logo" class="settings-form__preview-img" />
              </div>
            ` : ''}
            ${this.#logoFile ? `
              <p class="settings-form__file-name">
                New file: ${this.#esc(this.#logoFile.name)}
              </p>
            ` : ''}
          </div>
        </fieldset>

        <div class="settings-form__actions">
          <button type="button" class="settings-form__btn settings-form__btn--secondary"
            data-action="cancel">Cancel</button>
          <button type="submit" class="settings-form__btn settings-form__btn--primary">
            Save settings
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

    this.dispatchEvent(new CustomEvent('settings-form-submit', {
      bubbles: true, composed: true,
      detail: { formData },
    }));
  };

  #handleClick = (e) => {
    if (e.target.closest('[data-action="cancel"]')) {
      this.dispatchEvent(new CustomEvent('settings-form-cancel', {
        bubbles: true, composed: true,
      }));
    }
  };

  /** @param {Event} e */
  #handleFileChange = (e) => {
    const input = e.target.closest('input[type="file"]');
    if (!input) return;

    const file = input.files?.[0] ?? null;
    if (!file) return;

    if (input.name === 'signature_file') {
      if (!this.#validateFile(file)) { input.value = ''; return; }
      this.#signatureFile = file;
    } else if (input.name === 'logo_file') {
      if (!this.#validateFile(file)) { input.value = ''; return; }
      this.#logoFile = file;
    }

    // Re-render to show new file name without resetting form values
    this.render();
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  #collectFormData() {
    const get = name => this.querySelector(`[name="${name}"]`)?.value?.trim() ?? '';
    return {
      rto: {
        name:   get('rto_name'),
        number: get('rto_number'),
        cricos: get('rto_cricos') || null,
      },
      signatory: {
        name:           get('signatory_name'),
        signature_file: this.#signatureFile,
      },
      branding: {
        logo_file: this.#logoFile,
      },
    };
  }

  /** @param {object} d @returns {boolean} */
  #validate(d) {
    const errors = [];
    if (!d.rto.name)   errors.push('RTO name is required.');
    if (!d.rto.number) errors.push('RTO number is required.');
    if (d.rto.number && !/^\d+$/.test(d.rto.number)) {
      errors.push('RTO number must contain digits only.');
    }
    if (!d.signatory.name) errors.push('Signatory name is required.');

    this.#clearErrors();
    if (errors.length) { this.#showErrors(errors); return false; }
    return true;
  }

  /**
   * Validate file type and size.
   * @param {File} file
   * @returns {boolean}
   */
  #validateFile(file) {
    const allowed = ['image/png', 'image/jpeg'];
    if (!allowed.includes(file.type)) {
      this.#showErrors(['Only PNG and JPEG images are accepted.']);
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.#showErrors(['Image must be smaller than 2 MB.']);
      return false;
    }
    return true;
  }

  #clearErrors() {
    this.querySelector('.settings-form__errors')?.remove();
  }

  /** @param {string[]} errors */
  #showErrors(errors) {
    this.#clearErrors();
    const el = document.createElement('div');
    el.className = 'settings-form__errors';
    el.setAttribute('role', 'alert');
    el.innerHTML = `<ul>${errors.map(e => `<li>${this.#esc(e)}</li>`).join('')}</ul>`;
    this.querySelector('.settings-form__actions')?.before(el);
  }

  /** @param {*} val */
  #esc(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  #applyStyles() {
    if (document.getElementById('settings-form-styles')) return;
    const style = document.createElement('style');
    style.id = 'settings-form-styles';
    style.textContent = `
      settings-form { display: block; }
      .settings-form { display: flex; flex-direction: column; gap: var(--size-5); }
      .settings-form__section {
        border: var(--border-size-1) solid var(--surface-3);
        border-radius: var(--radius-2); padding: var(--size-4); margin: 0;
        display: flex; flex-direction: column; gap: var(--size-3);
      }
      .settings-form__legend {
        font-weight: var(--font-weight-6); font-size: var(--font-size-1);
        padding: 0 var(--size-2); color: var(--text-2);
      }
      .settings-form__row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--size-3);
      }
      .settings-form__label {
        display: flex; flex-direction: column; gap: var(--size-1);
        font-size: var(--font-size-1); color: var(--text-2);
      }
      .settings-form__required { color: var(--red-6); }
      .settings-form__hint { font-size: var(--font-size-0); color: var(--text-3); }
      .settings-form__input {
        padding: var(--size-2) var(--size-3);
        border: var(--border-size-1) solid var(--surface-3);
        border-radius: var(--radius-2);
        background: var(--surface-1); color: var(--text-1);
        font-size: var(--font-size-1);
      }
      .settings-form__input:focus {
        outline: var(--border-size-2) solid var(--brand); outline-offset: 1px;
      }
      .settings-form__file { margin-block-start: var(--size-1); }
      .settings-form__upload-group { display: flex; flex-direction: column; gap: var(--size-2); }
      .settings-form__preview { max-inline-size: 200px; }
      .settings-form__preview-img {
        max-inline-size: 100%; max-block-size: 80px; object-fit: contain;
        border: var(--border-size-1) solid var(--surface-3); border-radius: var(--radius-2);
        padding: var(--size-2); background: var(--surface-1);
      }
      .settings-form__file-name { font-size: var(--font-size-0); color: var(--text-2); margin: 0; }
      .settings-form__actions { display: flex; justify-content: flex-end; gap: var(--size-2); }
      .settings-form__btn {
        padding: var(--size-2) var(--size-4); border-radius: var(--radius-2);
        font-size: var(--font-size-1); font-weight: var(--font-weight-5);
        cursor: pointer; border: var(--border-size-1) solid transparent;
      }
      .settings-form__btn--secondary { background: var(--surface-2); border-color: var(--surface-3); color: var(--text-1); }
      .settings-form__btn--secondary:hover { background: var(--surface-3); }
      .settings-form__btn--primary { background: var(--brand); color: var(--gray-0); }
      .settings-form__btn--primary:hover { filter: brightness(1.1); }
      .settings-form__errors {
        background: var(--red-1); border: var(--border-size-1) solid var(--red-3);
        border-radius: var(--radius-2); padding: var(--size-2) var(--size-4);
        color: var(--red-8); font-size: var(--font-size-1);
      }
      .settings-form__errors ul { margin: 0; padding-inline-start: var(--size-4); }
    `;
    document.head.appendChild(style);
  }
}

customElements.define('settings-form', SettingsForm);
