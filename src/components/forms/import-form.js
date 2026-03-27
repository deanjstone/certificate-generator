import { AppElement } from '../base/AppElement.js';

/**
 * CSV bulk import form component.
 *
 * Flow: Upload CSV → client-side parse & validate → preview table → confirm.
 *
 * Expected CSV columns (order-independent, matched by header name):
 *   cert_type, cert_number, student_name, student_dob, student_usi,
 *   student_email, qual_code, qual_title,
 *   unit_code_1…unit_code_10, unit_title_1…unit_title_10
 *
 * @element import-form
 *
 * @fires import-preview  - Bubbles/composed. `detail: { records, errors }`
 *   fired after parsing. `records` are valid rows; `errors` are row-level issues.
 * @fires import-confirm  - Bubbles/composed. `detail: { records }`
 *   fired when the user confirms the previewed records.
 * @fires import-reset    - Bubbles/composed. Fired when the form is reset.
 *
 * @example
 * <import-form></import-form>
 *
 * form.addEventListener('import-confirm', e => {
 *   bulkIssue(e.detail.records);
 * });
 */
export class ImportForm extends AppElement {
  /** @type {Array<object>} */
  #records = [];
  /** @type {Array<{row: number, message: string}>} */
  #errors = [];
  /** @type {'idle'|'preview'|'confirmed'} */
  #stage = 'idle';

  connectedCallback() {
    super.connectedCallback();
    this.render();
    this.#applyStyles();
    this.addEventListener('change', this.#handleChange);
    this.addEventListener('click', this.#handleClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('change', this.#handleChange);
    this.removeEventListener('click', this.#handleClick);
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  render() {
    if (this.#stage === 'idle') {
      this.innerHTML = this.#renderUpload();
    } else if (this.#stage === 'preview') {
      this.innerHTML = this.#renderPreview();
    }
  }

  #renderUpload() {
    return `
      <div class="import-form">
        <div class="import-form__dropzone" id="import-dropzone">
          <input class="import-form__file" type="file" accept=".csv,text/csv"
            id="import-file-input" aria-label="Choose CSV file" />
          <label class="import-form__dropzone-label" for="import-file-input">
            <span class="import-form__icon">&#x1F4C4;</span>
            <span>Choose a CSV file or drag and drop here</span>
            <span class="import-form__hint">
              Required columns: cert_type, student_name, qual_code, qual_title
            </span>
          </label>
        </div>
        <a class="import-form__template-link" href="#" data-action="download-template">
          Download CSV template
        </a>
      </div>
    `;
  }

  #renderPreview() {
    const { records, errors } = { records: this.#records, errors: this.#errors };
    const hasErrors = errors.length > 0;

    return `
      <div class="import-form import-form--preview">
        <div class="import-form__summary">
          <span class="import-form__count import-form__count--valid">
            ${records.length} valid record${records.length !== 1 ? 's' : ''}
          </span>
          ${hasErrors ? `
            <span class="import-form__count import-form__count--error">
              ${errors.length} row error${errors.length !== 1 ? 's' : ''}
            </span>
          ` : ''}
        </div>

        ${hasErrors ? `
          <details class="import-form__errors">
            <summary>Show row errors</summary>
            <ul class="import-form__error-list">
              ${errors.map(e => `<li>Row ${e.row}: ${this.#esc(e.message)}</li>`).join('')}
            </ul>
          </details>
        ` : ''}

        ${records.length > 0 ? `
          <div class="import-form__table-wrap">
            <table class="import-form__table">
              <thead>
                <tr>
                  <th>Type</th><th>Cert #</th><th>Student</th>
                  <th>Qual code</th><th>Qual title</th>
                </tr>
              </thead>
              <tbody>
                ${records.map((r, i) => `
                  <tr class="${i % 2 === 0 ? '' : 'import-form__row--alt'}">
                    <td>${this.#esc(r.cert_type)}</td>
                    <td>${this.#esc(r.cert_number ?? '—')}</td>
                    <td>${this.#esc(r.student?.name ?? '')}</td>
                    <td>${this.#esc(r.qualification?.code ?? '')}</td>
                    <td>${this.#esc(r.qualification?.title ?? '')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="import-form__actions">
            <button type="button" class="import-form__btn import-form__btn--secondary"
              data-action="reset">Start over</button>
            <button type="button" class="import-form__btn import-form__btn--primary"
              data-action="confirm">
              Issue ${records.length} certificate${records.length !== 1 ? 's' : ''}
            </button>
          </div>
        ` : `
          <div class="import-form__actions">
            <button type="button" class="import-form__btn import-form__btn--secondary"
              data-action="reset">Start over</button>
          </div>
        `}
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // CSV parsing
  // ---------------------------------------------------------------------------

  /**
   * Parse a CSV string into an array of row objects.
   * @param {string} csv
   * @returns {{ records: object[], errors: {row:number, message:string}[] }}
   */
  static parse(csv) {
    const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (lines.length < 2) {
      return { records: [], errors: [{ row: 0, message: 'CSV file is empty or missing headers.' }] };
    }

    const headers = ImportForm.#splitCsvRow(lines[0]).map(h => h.trim().toLowerCase());
    const records = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = ImportForm.#splitCsvRow(line);
      const row = {};
      headers.forEach((h, j) => { row[h] = (cols[j] ?? '').trim(); });

      const { record, error } = ImportForm.#mapRow(row, i + 1);
      if (error) {
        errors.push({ row: i + 1, message: error });
      } else {
        records.push(record);
      }
    }

    return { records, errors };
  }

  /**
   * Split a single CSV row respecting quoted fields.
   * @param {string} line
   * @returns {string[]}
   */
  static #splitCsvRow(line) {
    const result = [];
    let cur = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuote = !inQuote; }
      } else if (ch === ',' && !inQuote) {
        result.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result;
  }

  /**
   * Map a raw CSV row object to a certificate record.
   * @param {Record<string,string>} row
   * @param {number} rowNum
   * @returns {{ record?: object, error?: string }}
   */
  static #mapRow(row, rowNum) {
    const required = { cert_type: row.cert_type, student_name: row.student_name, qual_code: row.qual_code, qual_title: row.qual_title };
    const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) {
      return { error: `Missing required columns: ${missing.join(', ')}` };
    }

    const validTypes = ['qualification', 'statement', 'transcript'];
    if (!validTypes.includes(row.cert_type.toLowerCase())) {
      return { error: `Invalid cert_type "${row.cert_type}". Must be qualification, statement, or transcript.` };
    }

    const units = [];
    for (let i = 1; i <= 10; i++) {
      const code  = (row[`unit_code_${i}`] ?? '').trim();
      const title = (row[`unit_title_${i}`] ?? '').trim();
      if (code || title) units.push({ code, title });
    }

    return {
      record: {
        cert_number: row.cert_number || null,
        cert_type:   row.cert_type.toLowerCase(),
        student: {
          name:  row.student_name,
          dob:   row.student_dob   || null,
          usi:   row.student_usi   || null,
          email: row.student_email || null,
        },
        qualification: {
          code:  row.qual_code,
          title: row.qual_title,
          units,
        },
      },
    };
  }

  /**
   * Generate a CSV template string.
   * @returns {string}
   */
  static template() {
    const headers = [
      'cert_type', 'cert_number', 'student_name', 'student_dob', 'student_usi', 'student_email',
      'qual_code', 'qual_title',
      ...Array.from({ length: 10 }, (_, i) => [`unit_code_${i + 1}`, `unit_title_${i + 1}`]).flat(),
    ];
    const example = [
      'qualification', '', 'Jane Smith', '1990-05-15', 'ABCDE12345', 'jane@example.com',
      'BSB50420', 'Diploma of Leadership and Management',
      'BSBLDR511', 'Develop and use emotional intelligence',
      'BSBLDR523', 'Lead and manage effective workplace relationships',
      ...Array(16).fill(''),
    ];
    return [headers.join(','), example.join(',')].join('\n');
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  #handleChange = (e) => {
    const input = e.target.closest('input[type="file"]');
    if (!input?.files?.length) return;
    this.#processFile(input.files[0]);
  };

  #handleClick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    if (btn.dataset.action === 'confirm') {
      this.dispatchEvent(new CustomEvent('import-confirm', {
        bubbles: true, composed: true,
        detail: { records: this.#records },
      }));
    } else if (btn.dataset.action === 'reset') {
      this.#reset();
    } else if (btn.dataset.action === 'download-template') {
      e.preventDefault();
      this.#downloadTemplate();
    }
  };

  // ---------------------------------------------------------------------------
  // File processing
  // ---------------------------------------------------------------------------

  /** @param {File} file */
  #processFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const { records, errors } = ImportForm.parse(e.target.result);
      this.#records = records;
      this.#errors = errors;
      this.#stage = 'preview';
      this.render();
      this.dispatchEvent(new CustomEvent('import-preview', {
        bubbles: true, composed: true,
        detail: { records, errors },
      }));
    };
    reader.readAsText(file);
  }

  #reset() {
    this.#records = [];
    this.#errors = [];
    this.#stage = 'idle';
    this.render();
    this.dispatchEvent(new CustomEvent('import-reset', { bubbles: true, composed: true }));
  }

  #downloadTemplate() {
    const csv = ImportForm.template();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificate-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------------------------------------------------------------------------

  /** @param {*} val */
  #esc(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  #applyStyles() {
    if (document.getElementById('import-form-styles')) return;
    const style = document.createElement('style');
    style.id = 'import-form-styles';
    style.textContent = `
      import-form { display: block; }
      .import-form { display: flex; flex-direction: column; gap: var(--size-4); }
      .import-form__dropzone {
        border: var(--border-size-2) dashed var(--surface-3);
        border-radius: var(--radius-3);
        padding: var(--size-8) var(--size-4);
        text-align: center;
        cursor: pointer;
        transition: border-color 150ms;
      }
      .import-form__dropzone:has(input:focus) { border-color: var(--brand); }
      .import-form__file { position: absolute; opacity: 0; inline-size: 0; block-size: 0; }
      .import-form__dropzone-label {
        display: flex; flex-direction: column; align-items: center; gap: var(--size-2);
        cursor: pointer; color: var(--text-2); font-size: var(--font-size-1);
      }
      .import-form__icon { font-size: var(--font-size-7); }
      .import-form__hint { font-size: var(--font-size-0); color: var(--text-3); }
      .import-form__template-link { font-size: var(--font-size-0); color: var(--brand); }
      .import-form__summary { display: flex; gap: var(--size-3); }
      .import-form__count {
        padding: var(--size-1) var(--size-3); border-radius: var(--radius-round);
        font-size: var(--font-size-0); font-weight: var(--font-weight-5);
      }
      .import-form__count--valid { background: var(--green-2); color: var(--green-8); }
      .import-form__count--error { background: var(--red-2); color: var(--red-8); }
      .import-form__errors {
        background: var(--red-1); border: var(--border-size-1) solid var(--red-3);
        border-radius: var(--radius-2); padding: var(--size-2) var(--size-3);
        font-size: var(--font-size-0); color: var(--red-8);
      }
      .import-form__error-list { margin: var(--size-2) 0 0; padding-inline-start: var(--size-4); }
      .import-form__table-wrap { overflow-x: auto; }
      .import-form__table {
        inline-size: 100%; border-collapse: collapse; font-size: var(--font-size-0);
      }
      .import-form__table th, .import-form__table td {
        padding: var(--size-1) var(--size-2);
        text-align: start;
        border-block-end: var(--border-size-1) solid var(--surface-3);
      }
      .import-form__table th { background: var(--surface-2); font-weight: var(--font-weight-6); }
      .import-form__row--alt td { background: var(--surface-2); }
      .import-form__actions { display: flex; justify-content: flex-end; gap: var(--size-2); }
      .import-form__btn {
        padding: var(--size-2) var(--size-4); border-radius: var(--radius-2);
        font-size: var(--font-size-1); font-weight: var(--font-weight-5);
        cursor: pointer; border: var(--border-size-1) solid transparent;
      }
      .import-form__btn--secondary { background: var(--surface-2); border-color: var(--surface-3); color: var(--text-1); }
      .import-form__btn--secondary:hover { background: var(--surface-3); }
      .import-form__btn--primary { background: var(--brand); color: var(--gray-0); }
      .import-form__btn--primary:hover { filter: brightness(1.1); }
    `;
    document.head.appendChild(style);
  }
}

customElements.define('import-form', ImportForm);
