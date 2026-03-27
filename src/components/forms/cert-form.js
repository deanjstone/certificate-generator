import { AppElement } from '../base/AppElement.js';

/**
 * Certificate creation / editing form.
 *
 * Collects all fields required to create or update a certificate record:
 * student, qualification, certificate type, and issue date. Emits
 * `cert-submit` when the form is submitted with valid data.
 *
 * @element cert-form
 *
 * @attr {string} [cert-id] - When present, the form is in edit mode for this certificate ID
 *
 * @fires cert-submit - Bubbles/composed. `detail: { data }` with form field values on valid submit.
 * @fires cert-cancel - Bubbles/composed. Fired when the user cancels the form.
 */
export class CertForm extends AppElement {
  connectedCallback() {
    super.connectedCallback();
    this.render();
  }

  render() {
    const certId = this.attr('cert-id');
    this.innerHTML = `
      <form class="cert-form" aria-label="${certId ? 'Edit certificate' : 'New certificate'}">
        <p>Certificate form — to be implemented.</p>
        <div class="cert-form__actions">
          <button type="button" data-action="cancel">Cancel</button>
          <button type="submit">${certId ? 'Save' : 'Create'}</button>
        </div>
      </form>
    `;
    this.querySelector('form').addEventListener('submit', this.#handleSubmit);
    this.querySelector('[data-action="cancel"]').addEventListener('click', this.#handleCancel);
  }

  /** @param {SubmitEvent} e */
  #handleSubmit = (e) => {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('cert-submit', {
      bubbles: true,
      composed: true,
      detail: { data: {} },
    }));
  };

  #handleCancel = () => {
    this.dispatchEvent(new CustomEvent('cert-cancel', { bubbles: true, composed: true }));
  };
}

customElements.define('cert-form', CertForm);
