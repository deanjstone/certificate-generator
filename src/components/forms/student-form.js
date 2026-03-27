import { AppElement } from '../base/AppElement.js';

/**
 * Student creation / editing form.
 *
 * Collects student name, email, and any other required profile fields.
 * Emits `student-submit` on valid submission and `student-cancel` on dismissal.
 *
 * @element student-form
 *
 * @attr {string} [student-id] - When present, the form is in edit mode for this student ID
 *
 * @fires student-submit - Bubbles/composed. `detail: { data }` with form field values on valid submit.
 * @fires student-cancel - Bubbles/composed. Fired when the user cancels.
 */
export class StudentForm extends AppElement {
  connectedCallback() {
    super.connectedCallback();
    this.render();
  }

  render() {
    const studentId = this.attr('student-id');
    this.innerHTML = `
      <form class="student-form" aria-label="${studentId ? 'Edit student' : 'New student'}">
        <p>Student form — to be implemented.</p>
        <div class="student-form__actions">
          <button type="button" data-action="cancel">Cancel</button>
          <button type="submit">${studentId ? 'Save' : 'Create'}</button>
        </div>
      </form>
    `;
    this.querySelector('form').addEventListener('submit', this.#handleSubmit);
    this.querySelector('[data-action="cancel"]').addEventListener('click', this.#handleCancel);
  }

  /** @param {SubmitEvent} e */
  #handleSubmit = (e) => {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('student-submit', {
      bubbles: true,
      composed: true,
      detail: { data: {} },
    }));
  };

  #handleCancel = () => {
    this.dispatchEvent(new CustomEvent('student-cancel', { bubbles: true, composed: true }));
  };
}

customElements.define('student-form', StudentForm);
