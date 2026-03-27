import { AppElement } from '../base/AppElement.js';

/**
 * Feature-rich certificate list table component.
 *
 * Accepts certificate records via the `data` JS property (not an attribute —
 * arrays are too large for attribute serialisation). All filtering, sorting
 * and pagination happen client-side inside the component.
 *
 * @element cert-table
 *
 * @attr {number} [page-size=20] - Rows per page
 *
 * @prop {CertRecord[]} data - Array of certificate records to display.
 *   Setting this property re-renders the table.
 *
 * @fires cert-select - Bubbles/composed. `detail: { cert }` when a row is clicked.
 *
 * @typedef {object} CertRecord
 * @property {string} id
 * @property {string} cert_number
 * @property {'qualification'|'statement'|'transcript'} cert_type
 * @property {{ name: string, email: string }} student
 * @property {{ code: string, title: string }} qualification
 * @property {string|null} issued_at  - ISO date string
 * @property {'draft'|'issued'|'revoked'|'void'} status
 * @property {string} created_at     - ISO date string
 *
 * @example
 * const table = document.querySelector('cert-table');
 * table.data = certificates;
 * table.addEventListener('cert-select', e => console.log(e.detail.cert));
 */
export class CertTable extends AppElement {
  /** @type {CertRecord[]} */
  #data = [];

  /** @type {{ col: string, dir: 'asc'|'desc' }} */
  #sort = { col: 'issued_at', dir: 'desc' };

  /** @type {{ search: string, status: string, type: string, from: string, to: string }} */
  #filters = { search: '', status: '', type: '', from: '', to: '' };

  /** @type {number} */
  #page = 1;

  static get observedAttributes() {
    return ['page-size'];
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  connectedCallback() {
    super.connectedCallback();
    this.#applyStyles();
    this.#render();
    this.addEventListener('click', this.#handleClick);
    this.addEventListener('change', this.#handleChange);
    this.addEventListener('input', this.#handleInput);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#handleClick);
    this.removeEventListener('change', this.#handleChange);
    this.removeEventListener('input', this.#handleInput);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Set the certificate records to display.
   * @param {CertRecord[]} records
   */
  set data(records) {
    this.#data = Array.isArray(records) ? records : [];
    this.#page = 1;
    if (this.isConnected) this.#render();
  }

  /** @returns {CertRecord[]} */
  get data() {
    return this.#data;
  }

  // ---------------------------------------------------------------------------
  // Filtering & sorting
  // ---------------------------------------------------------------------------

  /** @returns {CertRecord[]} */
  #filtered() {
    const { search, status, type, from, to } = this.#filters;
    const q = search.trim().toLowerCase();
    const fromMs = from ? new Date(from).getTime() : 0;
    const toMs = to ? new Date(to + 'T23:59:59').getTime() : Infinity;

    return this.#data.filter(c => {
      if (status && c.status !== status) return false;
      if (type && c.cert_type !== type) return false;
      if (q) {
        const name = (c.student?.name ?? '').toLowerCase();
        const num = (c.cert_number ?? '').toLowerCase();
        if (!name.includes(q) && !num.includes(q)) return false;
      }
      if (from || to) {
        const ts = c.issued_at ? new Date(c.issued_at).getTime() : 0;
        if (ts < fromMs || ts > toMs) return false;
      }
      return true;
    });
  }

  /** @param {CertRecord[]} rows @returns {CertRecord[]} */
  #sorted(rows) {
    const { col, dir } = this.#sort;
    const mult = dir === 'asc' ? 1 : -1;

    return [...rows].sort((a, b) => {
      const av = this.#sortVal(a, col);
      const bv = this.#sortVal(b, col);
      if (av < bv) return -1 * mult;
      if (av > bv) return 1 * mult;
      return 0;
    });
  }

  /**
   * @param {CertRecord} c
   * @param {string} col
   * @returns {string|number}
   */
  #sortVal(c, col) {
    switch (col) {
      case 'cert_number':  return c.cert_number ?? '';
      case 'student_name': return c.student?.name ?? '';
      case 'cert_type':    return c.cert_type ?? '';
      case 'status':       return c.status ?? '';
      case 'issued_at':    return c.issued_at ? new Date(c.issued_at).getTime() : 0;
      case 'created_at':   return c.created_at ? new Date(c.created_at).getTime() : 0;
      default:             return '';
    }
  }

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  #pageSize() {
    return Math.max(1, parseInt(this.attr('page-size', '20'), 10));
  }

  /** @param {CertRecord[]} rows @returns {CertRecord[]} */
  #paged(rows) {
    const size = this.#pageSize();
    const start = (this.#page - 1) * size;
    return rows.slice(start, start + size);
  }

  #totalPages(total) {
    return Math.max(1, Math.ceil(total / this.#pageSize()));
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  #render() {
    const filtered = this.#filtered();
    const sorted = this.#sorted(filtered);
    const page = this.#paged(sorted);
    const total = filtered.length;
    const totalPages = this.#totalPages(total);

    this.innerHTML = `
      ${this.#renderToolbar()}
      <div class="cert-table__wrap">
        <table class="cert-table__table">
          ${this.#renderHead()}
          ${this.#renderBody(page)}
        </table>
      </div>
      ${this.#renderPagination(total, totalPages)}
    `;
  }

  #renderToolbar() {
    const { search, status, type, from, to } = this.#filters;
    return `
      <div class="cert-table__toolbar">
        <input
          class="cert-table__search"
          type="search"
          placeholder="Search name or cert number…"
          value="${this.#esc(search)}"
          data-filter="search"
          aria-label="Search certificates"
        />
        <select class="cert-table__select" data-filter="status" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="draft"   ${status === 'draft'   ? 'selected' : ''}>Draft</option>
          <option value="issued"  ${status === 'issued'  ? 'selected' : ''}>Issued</option>
          <option value="revoked" ${status === 'revoked' ? 'selected' : ''}>Revoked</option>
          <option value="void"    ${status === 'void'    ? 'selected' : ''}>Void</option>
        </select>
        <select class="cert-table__select" data-filter="type" aria-label="Filter by type">
          <option value="">All types</option>
          <option value="qualification" ${type === 'qualification' ? 'selected' : ''}>Qualification</option>
          <option value="statement"     ${type === 'statement'     ? 'selected' : ''}>Statement</option>
          <option value="transcript"    ${type === 'transcript'    ? 'selected' : ''}>Transcript</option>
        </select>
        <div class="cert-table__daterange">
          <label class="cert-table__date-label">
            From
            <input type="date" class="cert-table__date" data-filter="from" value="${this.#esc(from)}" aria-label="Issue date from" />
          </label>
          <label class="cert-table__date-label">
            To
            <input type="date" class="cert-table__date" data-filter="to" value="${this.#esc(to)}" aria-label="Issue date to" />
          </label>
        </div>
      </div>
    `;
  }

  #renderHead() {
    const cols = [
      { key: 'cert_number',  label: 'Cert #' },
      { key: 'student_name', label: 'Student' },
      { key: 'cert_type',    label: 'Type' },
      { key: 'status',       label: 'Status' },
      { key: 'issued_at',    label: 'Issued' },
    ];

    const { col, dir } = this.#sort;
    const cells = cols.map(c => {
      const active = col === c.key;
      const arrow = active ? (dir === 'asc' ? ' ↑' : ' ↓') : '';
      return `
        <th
          class="cert-table__th${active ? ' cert-table__th--sorted' : ''}"
          data-sort="${c.key}"
          role="columnheader"
          aria-sort="${active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}"
          tabindex="0"
        >${this.#esc(c.label)}${arrow}</th>
      `;
    }).join('');

    return `<thead><tr>${cells}</tr></thead>`;
  }

  /** @param {CertRecord[]} rows */
  #renderBody(rows) {
    if (rows.length === 0) {
      return `
        <tbody>
          <tr>
            <td class="cert-table__empty" colspan="5">No certificates found.</td>
          </tr>
        </tbody>
      `;
    }

    const rowsHtml = rows.map(c => `
      <tr class="cert-table__row" data-id="${this.#esc(c.id)}" tabindex="0" role="button" aria-label="View certificate ${this.#esc(c.cert_number)}">
        <td class="cert-table__td">${this.#esc(c.cert_number)}</td>
        <td class="cert-table__td">${this.#esc(c.student?.name ?? '—')}</td>
        <td class="cert-table__td">${this.#renderTypeBadge(c.cert_type)}</td>
        <td class="cert-table__td">${this.#renderStatusBadge(c.status)}</td>
        <td class="cert-table__td">${c.issued_at ? this.#formatDate(c.issued_at) : '—'}</td>
      </tr>
    `).join('');

    return `<tbody>${rowsHtml}</tbody>`;
  }

  /**
   * @param {'draft'|'issued'|'revoked'|'void'} status
   */
  #renderStatusBadge(status) {
    return `<span class="cert-table__badge cert-table__badge--${this.#esc(status)}">${this.#esc(status)}</span>`;
  }

  /**
   * @param {'qualification'|'statement'|'transcript'} type
   */
  #renderTypeBadge(type) {
    const labels = { qualification: 'Qualification', statement: 'Statement', transcript: 'Transcript' };
    return `<span class="cert-table__type">${this.#esc(labels[type] ?? type)}</span>`;
  }

  /** @param {number} total @param {number} totalPages */
  #renderPagination(total, totalPages) {
    const start = total === 0 ? 0 : (this.#page - 1) * this.#pageSize() + 1;
    const end = Math.min(this.#page * this.#pageSize(), total);

    return `
      <div class="cert-table__pagination">
        <span class="cert-table__page-info">
          ${total === 0 ? '0 results' : `${start}–${end} of ${total}`}
        </span>
        <div class="cert-table__page-btns">
          <button
            class="cert-table__page-btn"
            data-page="prev"
            ${this.#page <= 1 ? 'disabled' : ''}
            aria-label="Previous page"
          >&#8592;</button>
          <span class="cert-table__page-num">${this.#page} / ${totalPages}</span>
          <button
            class="cert-table__page-btn"
            data-page="next"
            ${this.#page >= totalPages ? 'disabled' : ''}
            aria-label="Next page"
          >&#8594;</button>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Event handling
  // ---------------------------------------------------------------------------

  /** @param {MouseEvent|KeyboardEvent} e */
  #handleClick = (e) => {
    // Sort column header
    const th = e.target.closest('[data-sort]');
    if (th) {
      const col = th.dataset.sort;
      if (this.#sort.col === col) {
        this.#sort.dir = this.#sort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        this.#sort = { col, dir: 'asc' };
      }
      this.#render();
      return;
    }

    // Pagination buttons
    const pageBtn = e.target.closest('[data-page]');
    if (pageBtn && !pageBtn.disabled) {
      const filtered = this.#filtered();
      const total = this.#totalPages(filtered.length);
      if (pageBtn.dataset.page === 'prev' && this.#page > 1) {
        this.#page--;
        this.#render();
      } else if (pageBtn.dataset.page === 'next' && this.#page < total) {
        this.#page++;
        this.#render();
      }
      return;
    }

    // Row click — emit cert-select
    const row = e.target.closest('[data-id]');
    if (row) {
      const cert = this.#data.find(c => c.id === row.dataset.id);
      if (cert) {
        this.dispatchEvent(new CustomEvent('cert-select', {
          bubbles: true,
          composed: true,
          detail: { cert },
        }));
      }
    }
  };

  /** @param {Event} e */
  #handleChange = (e) => {
    const el = e.target.closest('[data-filter]');
    if (!el) return;
    this.#filters[el.dataset.filter] = el.value;
    this.#page = 1;
    this.#render();
  };

  /** @param {Event} e */
  #handleInput = (e) => {
    const el = e.target.closest('[data-filter="search"]');
    if (!el) return;
    this.#filters.search = el.value;
    this.#page = 1;
    this.#render();
  };

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /** @param {string} iso */
  #formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('en-AU', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  /** @param {*} val */
  #esc(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  #applyStyles() {
    if (!document.getElementById('cert-table-styles')) {
      const style = document.createElement('style');
      style.id = 'cert-table-styles';
      style.textContent = `
        cert-table {
          display: flex;
          flex-direction: column;
          gap: var(--size-3);
          container-type: inline-size;
        }
        .cert-table__toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: var(--size-2);
          align-items: flex-end;
        }
        .cert-table__search,
        .cert-table__select,
        .cert-table__date {
          padding: var(--size-2) var(--size-3);
          border: var(--border-size-1) solid var(--surface-3);
          border-radius: var(--radius-2);
          background: var(--surface-1);
          color: var(--text-1);
          font-size: var(--font-size-1);
        }
        .cert-table__search { flex: 1 1 200px; }
        .cert-table__daterange {
          display: flex;
          gap: var(--size-2);
          align-items: flex-end;
        }
        .cert-table__date-label {
          display: flex;
          flex-direction: column;
          gap: var(--size-1);
          font-size: var(--font-size-0);
          color: var(--text-2);
        }
        .cert-table__wrap {
          overflow-x: auto;
          border: var(--border-size-1) solid var(--surface-3);
          border-radius: var(--radius-2);
        }
        .cert-table__table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--font-size-1);
        }
        .cert-table__th {
          padding: var(--size-2) var(--size-3);
          text-align: start;
          font-weight: var(--font-weight-6);
          background: var(--surface-2);
          color: var(--text-2);
          white-space: nowrap;
          cursor: pointer;
          user-select: none;
          border-block-end: var(--border-size-1) solid var(--surface-3);
        }
        .cert-table__th:hover { color: var(--text-1); }
        .cert-table__th--sorted { color: var(--brand); }
        .cert-table__td {
          padding: var(--size-2) var(--size-3);
          border-block-end: var(--border-size-1) solid var(--surface-3);
          vertical-align: middle;
        }
        .cert-table__row { cursor: pointer; }
        .cert-table__row:hover td { background: var(--surface-2); }
        .cert-table__row:focus-visible { outline: var(--border-size-2) solid var(--brand); }
        .cert-table__empty {
          text-align: center;
          padding: var(--size-8);
          color: var(--text-2);
        }
        .cert-table__badge {
          display: inline-block;
          padding: var(--size-1) var(--size-2);
          border-radius: var(--radius-round);
          font-size: var(--font-size-0);
          font-weight: var(--font-weight-5);
          text-transform: capitalize;
        }
        .cert-table__badge--draft   { background: var(--gray-2);   color: var(--gray-7); }
        .cert-table__badge--issued  { background: var(--green-2);  color: var(--green-8); }
        .cert-table__badge--revoked { background: var(--red-2);    color: var(--red-8); }
        .cert-table__badge--void    { background: var(--surface-3); color: var(--text-2); }
        .cert-table__pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--size-2) 0;
          font-size: var(--font-size-1);
          color: var(--text-2);
        }
        .cert-table__page-btns {
          display: flex;
          align-items: center;
          gap: var(--size-2);
        }
        .cert-table__page-btn {
          padding: var(--size-1) var(--size-3);
          border: var(--border-size-1) solid var(--surface-3);
          border-radius: var(--radius-2);
          background: var(--surface-2);
          cursor: pointer;
          color: var(--text-1);
        }
        .cert-table__page-btn:hover:not(:disabled) { background: var(--surface-3); }
        .cert-table__page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cert-table__page-num { color: var(--text-1); font-weight: var(--font-weight-5); }
      `;
      document.head.appendChild(style);
    }
  }
}

customElements.define('cert-table', CertTable);
