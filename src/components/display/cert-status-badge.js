import { AppElement } from '../base/AppElement.js';

/**
 * Certificate status badge.
 *
 * Renders a small coloured pill reflecting the certificate status.
 * Intended for use inside tables, detail views, and cards.
 *
 * @element cert-status-badge
 *
 * @attr {'draft'|'issued'|'revoked'|'void'} status - The status to display
 *
 * @example
 * <cert-status-badge status="issued"></cert-status-badge>
 */
export class CertStatusBadge extends AppElement {
  static get observedAttributes() {
    return ['status'];
  }

  connectedCallback() {
    super.connectedCallback();
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  render() {
    const status = this.attr('status', 'draft');
    this.innerHTML = `
      <span class="cert-status-badge cert-status-badge--${status}">${status}</span>
    `;
  }
}

customElements.define('cert-status-badge', CertStatusBadge);
