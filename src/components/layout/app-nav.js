import { AppElement } from '../base/AppElement.js';

/**
 * Navigation sidebar component.
 *
 * Renders a vertical nav list from a `links` attribute (JSON array) and
 * highlights the entry matching the current pathname. Emits a `nav-navigate`
 * event on link click so the router can intercept it.
 *
 * @element app-nav
 *
 * @attr {string} links - JSON array of `{ label: string, href: string }` objects
 * @attr {string} heading - Optional heading text shown above the links
 *
 * @fires nav-navigate - Bubbles. `detail: { href }` when a link is clicked.
 *
 * @example
 * <app-nav
 *   heading="Certificate Generator"
 *   links='[{"label":"Dashboard","href":"/admin"},{"label":"Certificates","href":"/admin/certificates"}]'
 * ></app-nav>
 */
export class AppNav extends AppElement {
  static get observedAttributes() {
    return ['links', 'heading'];
  }

  connectedCallback() {
    super.connectedCallback();
    this.render();
    this.#applyStyles();
    this.addEventListener('click', this.#handleClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#handleClick);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  render() {
    const heading = this.attr('heading', '');
    const links = this.#parseLinks();
    const current = typeof location !== 'undefined' ? location.pathname : '';

    this.innerHTML = `
      ${heading ? `<div class="app-nav__heading">${this.#escape(heading)}</div>` : ''}
      <nav aria-label="Main navigation">
        <ul class="app-nav__list" role="list">
          ${links.map(({ label, href }) => `
            <li>
              <a
                class="app-nav__link${current === href ? ' app-nav__link--active' : ''}"
                href="${this.#escape(href)}"
                aria-current="${current === href ? 'page' : 'false'}"
              >${this.#escape(label)}</a>
            </li>
          `).join('')}
        </ul>
      </nav>
    `;
  }

  /** @param {MouseEvent} e */
  #handleClick = (e) => {
    const link = e.target.closest('a.app-nav__link');
    if (!link) return;
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('nav-navigate', {
      bubbles: true,
      composed: true,
      detail: { href: link.getAttribute('href') },
    }));
  };

  /** @returns {Array<{label: string, href: string}>} */
  #parseLinks() {
    try {
      const raw = this.attr('links', '[]');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /** @param {string} str */
  #escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  #applyStyles() {
    if (!document.getElementById('app-nav-styles')) {
      const style = document.createElement('style');
      style.id = 'app-nav-styles';
      style.textContent = `
        app-nav {
          display: flex;
          flex-direction: column;
          block-size: 100%;
          padding: var(--size-3);
          gap: var(--size-3);
        }
        .app-nav__heading {
          font-size: var(--font-size-1);
          font-weight: var(--font-weight-6);
          color: var(--text-2);
          padding-block-end: var(--size-2);
          border-block-end: var(--border-size-1) solid var(--surface-3);
        }
        .app-nav__list {
          display: flex;
          flex-direction: column;
          gap: var(--size-1);
          padding: 0;
          margin: 0;
          list-style: none;
        }
        .app-nav__link {
          display: block;
          padding: var(--size-2) var(--size-3);
          border-radius: var(--radius-2);
          color: var(--text-1);
          text-decoration: none;
          font-size: var(--font-size-1);
        }
        .app-nav__link:hover {
          background: var(--surface-3);
        }
        .app-nav__link--active {
          background: var(--brand);
          color: var(--gray-0);
        }
        .app-nav__link--active:hover {
          background: var(--brand);
        }
      `;
      document.head.appendChild(style);
    }
  }
}

customElements.define('app-nav', AppNav);
