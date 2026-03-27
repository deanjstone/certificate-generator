import { AppElement } from '../base/AppElement.js';

/**
 * Public certificate verification card.
 *
 * Shown on the unauthenticated `/verify/:cert_number` route. Displays the
 * certificate status and key details for a given certificate number. Accepts
 * data via the `cert` JS property after the parent fetches it.
 *
 * @element verify-card
 *
 * @prop {object|null} cert - Verified certificate data from the public lookup endpoint.
 *   Set to `null` to show a "not found" state.
 *
 * @attr {'loading'|'found'|'not-found'} [state='loading'] - Display state
 *
 * @example
 * const card = document.querySelector('verify-card');
 * card.cert = await fetchCertByNumber(certNumber);
 */
export class VerifyCard extends AppElement {
  /** @type {object|null} */
  #cert = null;

  static get observedAttributes() {
    return ['state'];
  }

  connectedCallback() {
    super.connectedCallback();
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  /** @param {object|null} value */
  set cert(value) {
    this.#cert = value ?? null;
    this.reflect('state', this.#cert ? 'found' : 'not-found');
    if (this.isConnected) this.render();
  }

  /** @returns {object|null} */
  get cert() {
    return this.#cert;
  }

  render() {
    const state = this.attr('state', 'loading');
    this.innerHTML = `<p class="verify-card__placeholder">Verify card (state: ${state}) — to be implemented.</p>`;
  }
}

customElements.define('verify-card', VerifyCard);
