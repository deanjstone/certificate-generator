import { AppElement } from '../base/AppElement.js';

/**
 * Bulk CSV / Excel import form.
 *
 * Accepts a file upload, parses learner rows, and emits `import-submit` with
 * the parsed records for the parent to process. Shows a row-count preview and
 * validation errors before the user confirms the import.
 *
 * @element import-form
 *
 * @fires import-submit - Bubbles/composed. `detail: { rows }` with parsed learner records on confirm.
 * @fires import-cancel - Bubbles/composed. Fired when the user cancels.
 */
export class ImportForm extends AppElement {
  connectedCallback() {
    super.connectedCallback();
    this.render();
  }

  render() {
    this.innerHTML = `
      <form class="import-form" aria-label="Import certificates">
        <p>Import form — to be implemented.</p>
        <div class="import-form__actions">
          <button type="button" data-action="cancel">Cancel</button>
          <button type="submit">Import</button>
        </div>
      </form>
    `;
    this.querySelector('form').addEventListener('submit', this.#handleSubmit);
    this.querySelector('[data-action="cancel"]').addEventListener('click', this.#handleCancel);
  }

  /** @param {SubmitEvent} e */
  #handleSubmit = (e) => {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('import-submit', {
      bubbles: true,
      composed: true,
      detail: { rows: [] },
    }));
  };

  #handleCancel = () => {
    this.dispatchEvent(new CustomEvent('import-cancel', { bubbles: true, composed: true }));
  };
}

customElements.define('import-form', ImportForm);
