import { AppElement } from '../base/AppElement.js';

/**
 * RTO settings form.
 *
 * Manages organisation-level configuration: RTO name, RTO code, signatory
 * name and title, logo upload, and certificate footer text. Emits
 * `settings-submit` when saved.
 *
 * @element settings-form
 *
 * @fires settings-submit - Bubbles/composed. `detail: { data }` with settings values on save.
 */
export class SettingsForm extends AppElement {
  connectedCallback() {
    super.connectedCallback();
    this.render();
  }

  render() {
    this.innerHTML = `
      <form class="settings-form" aria-label="RTO settings">
        <p>Settings form — to be implemented.</p>
        <div class="settings-form__actions">
          <button type="submit">Save settings</button>
        </div>
      </form>
    `;
    this.querySelector('form').addEventListener('submit', this.#handleSubmit);
  }

  /** @param {SubmitEvent} e */
  #handleSubmit = (e) => {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('settings-submit', {
      bubbles: true,
      composed: true,
      detail: { data: {} },
    }));
  };
}

customElements.define('settings-form', SettingsForm);
