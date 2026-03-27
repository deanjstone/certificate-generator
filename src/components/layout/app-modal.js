import { AppElement } from '../base/AppElement.js';

/**
 * Confirmation / dialog modal component.
 *
 * Uses the native `<dialog>` element for accessibility (focus trap, Escape key,
 * backdrop click). Call the static `AppModal.confirm()` helper to open a
 * confirmation dialog from anywhere without a direct element reference.
 *
 * @element app-modal
 *
 * @attr {string} heading - Dialog heading text
 * @attr {string} confirm-label - Confirm button label (default: "Confirm")
 * @attr {string} cancel-label  - Cancel button label (default: "Cancel")
 * @attr {string} variant - "danger" tints the confirm button red (default: "default")
 *
 * @fires modal-confirm - Bubbles/composed. Fired when the user confirms.
 * @fires modal-cancel  - Bubbles/composed. Fired when the user cancels or dismisses.
 *
 * @example
 * // Simple imperative API (returns a Promise<boolean>)
 * const confirmed = await AppModal.confirm('Revoke this certificate?', { variant: 'danger' });
 * if (confirmed) { … }
 *
 * // Or declarative
 * <app-modal heading="Revoke certificate?" variant="danger"></app-modal>
 */
export class AppModal extends AppElement {
  /** @type {HTMLDialogElement|null} */
  #dialog = null;

  connectedCallback() {
    super.connectedCallback();
    this.render();
    this.#applyStyles();
  }

  render() {
    const heading = this.attr('heading', '');
    const confirmLabel = this.attr('confirm-label', 'Confirm');
    const cancelLabel = this.attr('cancel-label', 'Cancel');
    const variant = this.attr('variant', 'default');

    // Build the structure programmatically so #dialog holds a real element
    // reference without relying on innerHTML + querySelector.
    const dialog = document.createElement('dialog');
    dialog.className = 'app-modal__dialog';

    const form = document.createElement('form');
    form.setAttribute('method', 'dialog');
    form.className = 'app-modal__form';

    if (heading) {
      const h2 = document.createElement('h2');
      h2.className = 'app-modal__heading';
      h2.textContent = heading;
      form.appendChild(h2);
    }

    const body = document.createElement('div');
    body.className = 'app-modal__body';
    const slot = document.createElement('slot');
    body.appendChild(slot);
    form.appendChild(body);

    const actions = document.createElement('div');
    actions.className = 'app-modal__actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'app-modal__btn app-modal__btn--cancel';
    cancelBtn.setAttribute('data-action', 'cancel');
    cancelBtn.textContent = cancelLabel;
    cancelBtn.addEventListener('click', () => this.#close(false));

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'submit';
    confirmBtn.className = `app-modal__btn app-modal__btn--confirm app-modal__btn--${variant}`;
    confirmBtn.setAttribute('data-action', 'confirm');
    confirmBtn.textContent = confirmLabel;
    confirmBtn.addEventListener('click', () => this.#close(true));

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    form.appendChild(actions);
    dialog.appendChild(form);

    dialog.addEventListener('click', this.#handleBackdropClick);
    dialog.addEventListener('cancel', () => this.#close(false)); // Escape key

    // Clear previous render and mount
    this.innerHTML = '';
    this.appendChild(dialog);
    this.#dialog = dialog;
  }

  /** Open the dialog. */
  open() {
    this.#dialog?.showModal();
  }

  /** Close the dialog without confirming. */
  close() {
    this.#close(false);
  }

  /** @param {boolean} confirmed */
  #close(confirmed) {
    this.#dialog?.close();
    const event = confirmed ? 'modal-confirm' : 'modal-cancel';
    this.dispatchEvent(new CustomEvent(event, { bubbles: true, composed: true }));
  }

  /** Close when the backdrop (outside the form) is clicked. */
  #handleBackdropClick = (e) => {
    if (e.target === this.#dialog) this.#close(false);
  };

  /**
   * Open a confirmation modal imperatively.
   * Returns a Promise that resolves to `true` if confirmed, `false` if cancelled.
   *
   * @param {string} message - Body text shown inside the modal
   * @param {object} [options]
   * @param {string} [options.heading]
   * @param {string} [options.confirmLabel]
   * @param {string} [options.cancelLabel]
   * @param {'default'|'danger'} [options.variant]
   * @returns {Promise<boolean>}
   */
  static confirm(message, options = {}) {
    return new Promise((resolve) => {
      const modal = document.createElement('app-modal');

      if (options.heading) modal.setAttribute('heading', options.heading);
      if (options.confirmLabel) modal.setAttribute('confirm-label', options.confirmLabel);
      if (options.cancelLabel) modal.setAttribute('cancel-label', options.cancelLabel);
      if (options.variant) modal.setAttribute('variant', options.variant);

      modal.addEventListener('modal-confirm', () => { modal.remove(); resolve(true); }, { once: true });
      modal.addEventListener('modal-cancel', () => { modal.remove(); resolve(false); }, { once: true });

      const p = document.createElement('p');
      p.textContent = message;

      document.body.appendChild(modal);
      modal.open();
    });
  }

  #applyStyles() {
    if (!document.getElementById('app-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'app-modal-styles';
      style.textContent = `
        .app-modal__dialog {
          border: none;
          border-radius: var(--radius-3);
          box-shadow: var(--shadow-6);
          padding: 0;
          max-inline-size: min(480px, 90vw);
          inline-size: 100%;
          background: var(--surface-1);
          color: var(--text-1);
        }
        .app-modal__dialog::backdrop {
          background: hsl(0 0% 0% / 50%);
          backdrop-filter: blur(2px);
        }
        .app-modal__form {
          display: flex;
          flex-direction: column;
          gap: var(--size-4);
          padding: var(--size-5);
        }
        .app-modal__heading {
          font-size: var(--font-size-3);
          font-weight: var(--font-weight-6);
          margin: 0;
        }
        .app-modal__body {
          font-size: var(--font-size-1);
          color: var(--text-2);
        }
        .app-modal__actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--size-2);
        }
        .app-modal__btn {
          padding: var(--size-2) var(--size-4);
          border-radius: var(--radius-2);
          border: var(--border-size-1) solid transparent;
          font-size: var(--font-size-1);
          cursor: pointer;
          font-weight: var(--font-weight-5);
        }
        .app-modal__btn--cancel {
          background: var(--surface-2);
          color: var(--text-1);
          border-color: var(--surface-3);
        }
        .app-modal__btn--cancel:hover { background: var(--surface-3); }
        .app-modal__btn--confirm.app-modal__btn--default {
          background: var(--brand);
          color: var(--gray-0);
        }
        .app-modal__btn--confirm.app-modal__btn--default:hover {
          filter: brightness(1.1);
        }
        .app-modal__btn--confirm.app-modal__btn--danger {
          background: var(--red-6);
          color: var(--gray-0);
        }
        .app-modal__btn--confirm.app-modal__btn--danger:hover {
          background: var(--red-7);
        }
      `;
      document.head.appendChild(style);
    }
  }
}

customElements.define('app-modal', AppModal);
