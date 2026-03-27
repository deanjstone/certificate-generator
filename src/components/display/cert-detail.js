import { AppElement } from '../base/AppElement.js';

/**
 * Certificate detail view component.
 *
 * Displays the full details of a single certificate record alongside action
 * buttons (download PDF, revoke, void). Accepts data via the `cert` JS property.
 *
 * @element cert-detail
 *
 * @prop {import('./cert-table.js').CertRecord|null} cert - The certificate record to display.
 *
 * @fires cert-download - Bubbles/composed. `detail: { cert }` when download is requested.
 * @fires cert-revoke   - Bubbles/composed. `detail: { cert }` when revoke is requested.
 * @fires cert-void     - Bubbles/composed. `detail: { cert }` when void is requested.
 */
export class CertDetail extends AppElement {
  /** @type {import('./cert-table.js').CertRecord|null} */
  #cert = null;

  connectedCallback() {
    super.connectedCallback();
    this.render();
  }

  /**
   * @param {import('./cert-table.js').CertRecord|null} value
   */
  set cert(value) {
    this.#cert = value ?? null;
    if (this.isConnected) this.render();
  }

  /** @returns {import('./cert-table.js').CertRecord|null} */
  get cert() {
    return this.#cert;
  }

  render() {
    if (!this.#cert) {
      this.innerHTML = `<p class="cert-detail__empty">No certificate selected.</p>`;
      return;
    }
    this.innerHTML = `<p class="cert-detail__placeholder">Certificate detail — to be implemented.</p>`;
  }
}

customElements.define('cert-detail', CertDetail);
