import { AppElement } from '../base/AppElement.js';

/**
 * Notification toast host component.
 *
 * Mount once near the root. Call the static `AppToast.show()` helper to
 * dispatch a toast from anywhere in the app — no direct element reference
 * needed.
 *
 * Toasts auto-dismiss after `duration` ms (default 4000). The user can also
 * dismiss them manually via the close button.
 *
 * @element app-toast
 *
 * @example
 * // In your HTML (once, near <body>)
 * <app-toast></app-toast>
 *
 * // Anywhere in JS
 * AppToast.show('Certificate issued successfully.', 'success');
 * AppToast.show('Something went wrong.', 'error');
 * AppToast.show('Saving…', 'info');
 */
export class AppToast extends AppElement {
  /** @type {number} Auto-dismiss delay in ms */
  static DEFAULT_DURATION = 4000;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'status');
    this.setAttribute('aria-live', 'polite');
    this.setAttribute('aria-atomic', 'false');
    this.#applyStyles();
    window.addEventListener('app-toast', this.#handleToastEvent);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('app-toast', this.#handleToastEvent);
  }

  /**
   * Show a toast notification.
   *
   * @param {string} message
   * @param {'info'|'success'|'error'|'warning'} [variant='info']
   * @param {number} [duration] - Override auto-dismiss delay (ms)
   */
  static show(message, variant = 'info', duration = AppToast.DEFAULT_DURATION) {
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { message, variant, duration },
    }));
  }

  /** @param {CustomEvent} e */
  #handleToastEvent = (e) => {
    const { message, variant, duration } = e.detail;
    this.#addToast(message, variant, duration);
  };

  /**
   * @param {string} message
   * @param {string} variant
   * @param {number} duration
   */
  #addToast(message, variant, duration) {
    const item = document.createElement('div');
    item.className = `app-toast__item app-toast__item--${variant}`;
    item.setAttribute('role', 'alert');
    item.innerHTML = `
      <span class="app-toast__message">${this.#escape(message)}</span>
      <button class="app-toast__close" aria-label="Dismiss notification">&#x2715;</button>
    `;

    item.querySelector('.app-toast__close').addEventListener('click', () => {
      this.#dismiss(item);
    });

    this.appendChild(item);

    // Trigger enter animation on next frame
    requestAnimationFrame(() => item.classList.add('app-toast__item--visible'));

    if (duration > 0) {
      setTimeout(() => this.#dismiss(item), duration);
    }
  }

  /** @param {HTMLElement} item */
  #dismiss(item) {
    if (!item.isConnected) return;
    item.classList.remove('app-toast__item--visible');
    item.addEventListener('transitionend', () => item.remove(), { once: true });
    // Fallback removal if transition never fires
    setTimeout(() => item.remove(), 400);
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
    if (!document.getElementById('app-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'app-toast-styles';
      style.textContent = `
        app-toast {
          position: fixed;
          inset-block-end: var(--size-5);
          inset-inline-end: var(--size-5);
          display: flex;
          flex-direction: column;
          gap: var(--size-2);
          z-index: 9000;
          pointer-events: none;
        }
        .app-toast__item {
          display: flex;
          align-items: center;
          gap: var(--size-3);
          padding: var(--size-3) var(--size-4);
          border-radius: var(--radius-3);
          box-shadow: var(--shadow-3);
          font-size: var(--font-size-1);
          max-inline-size: 380px;
          pointer-events: auto;
          opacity: 0;
          transform: translateY(var(--size-3));
          transition: opacity 200ms var(--ease-out-3), transform 200ms var(--ease-out-3);
          background: var(--surface-2);
          color: var(--text-1);
          border-inline-start: var(--border-size-3) solid var(--surface-3);
        }
        .app-toast__item--visible {
          opacity: 1;
          transform: translateY(0);
        }
        .app-toast__item--success { border-color: var(--green-6); }
        .app-toast__item--error   { border-color: var(--red-6); }
        .app-toast__item--warning { border-color: var(--yellow-6); }
        .app-toast__item--info    { border-color: var(--blue-6); }
        .app-toast__message { flex: 1; }
        .app-toast__close {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-2);
          padding: 0;
          font-size: var(--font-size-2);
          line-height: 1;
        }
        .app-toast__close:hover { color: var(--text-1); }
      `;
      document.head.appendChild(style);
    }
  }
}

customElements.define('app-toast', AppToast);
