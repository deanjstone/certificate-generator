import { AppElement } from '../base/AppElement.js';

/**
 * Shadow DOM certificate template component.
 *
 * Renders a print-ready certificate layout using Shadow DOM for full style
 * encapsulation. Used as the source element for html2canvas → pdf-lib PDF
 * generation. The `cert` JS property drives the content; all layout and
 * branding tokens are applied via Shadow DOM styles.
 *
 * @element cert-template
 *
 * @prop {import('../display/cert-table.js').CertRecord|null} cert - Certificate data to render.
 * @prop {object|null} settings - RTO settings (name, code, logo URL, signatory, footer text).
 *
 * @example
 * const tpl = document.createElement('cert-template');
 * tpl.cert = certRecord;
 * tpl.settings = rtoSettings;
 * document.body.appendChild(tpl);
 * const pdf = await generatePdf(tpl.shadowRoot.querySelector('.cert-template__page'));
 */
export class CertTemplate extends AppElement {
  /** @type {import('../display/cert-table.js').CertRecord|null} */
  #cert = null;

  /** @type {object|null} */
  #settings = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    super.connectedCallback();
    this.#render();
  }

  /** @param {import('../display/cert-table.js').CertRecord|null} value */
  set cert(value) {
    this.#cert = value ?? null;
    if (this.isConnected) this.#render();
  }

  /** @returns {import('../display/cert-table.js').CertRecord|null} */
  get cert() {
    return this.#cert;
  }

  /** @param {object|null} value */
  set settings(value) {
    this.#settings = value ?? null;
    if (this.isConnected) this.#render();
  }

  /** @returns {object|null} */
  get settings() {
    return this.#settings;
  }

  #render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .cert-template__page {
          width: 297mm;
          min-height: 210mm;
          padding: 20mm;
          box-sizing: border-box;
          background: white;
          font-family: var(--font-sans, sans-serif);
          color: #000;
        }
      </style>
      <div class="cert-template__page">
        <p>Certificate template — to be implemented.</p>
      </div>
    `;
  }
}

customElements.define('cert-template', CertTemplate);
