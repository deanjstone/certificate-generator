import { AppElement } from '../base/AppElement.js';

/**
 * Top-level application layout wrapper.
 *
 * Renders a two-region layout: a `<app-nav>` sidebar slot and a main content
 * slot. Global Open Props styles apply via light DOM.
 *
 * @element app-shell
 *
 * @example
 * <app-shell>
 *   <app-nav slot="nav"></app-nav>
 *   <main slot="content">…</main>
 * </app-shell>
 */
export class AppShell extends AppElement {
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasChildNodes()) {
      this.render();
    }
    this.#applyStyles();
  }

  render() {
    this.innerHTML = `
      <div class="app-shell__nav">
        <slot name="nav"></slot>
      </div>
      <div class="app-shell__content">
        <slot name="content"></slot>
      </div>
    `;
  }

  #applyStyles() {
    if (!document.getElementById('app-shell-styles')) {
      const style = document.createElement('style');
      style.id = 'app-shell-styles';
      style.textContent = `
        app-shell {
          display: grid;
          grid-template-columns: var(--app-nav-width, 240px) 1fr;
          min-block-size: 100dvh;
        }
        .app-shell__nav {
          background: var(--surface-2);
          border-inline-end: var(--border-size-1) solid var(--surface-3);
        }
        .app-shell__content {
          overflow-y: auto;
          padding: var(--size-4);
        }
      `;
      document.head.appendChild(style);
    }
  }
}

customElements.define('app-shell', AppShell);
