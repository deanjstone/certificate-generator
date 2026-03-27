/**
 * Base class for all UI Web Components in the certificate generator.
 *
 * All components extending AppElement use light DOM by default.
 * Only certificate template components use Shadow DOM (handled in subclasses).
 *
 * @example
 * import { AppElement } from '../base/AppElement.js';
 *
 * export class AppNav extends AppElement {
 *   connectedCallback() {
 *     super.connectedCallback();
 *     this.render();
 *   }
 *   render() {
 *     this.innerHTML = `<nav>…</nav>`;
 *   }
 * }
 * customElements.define('app-nav', AppNav);
 */
export class AppElement extends HTMLElement {
  /**
   * Called when the element is inserted into the document.
   * Subclasses should call super.connectedCallback() when overriding.
   */
  connectedCallback() {}

  /**
   * Called when the element is removed from the document.
   * Subclasses should call super.disconnectedCallback() when overriding.
   */
  disconnectedCallback() {}

  /**
   * Get an attribute value, with an optional fallback default.
   *
   * @param {string} name - Attribute name
   * @param {*} [defaultValue=null] - Value returned when the attribute is absent
   * @returns {string|*} The attribute value, or defaultValue if not present
   *
   * @example
   * // <app-nav role="admin"></app-nav>
   * this.attr('role');          // → 'admin'
   * this.attr('missing');       // → null
   * this.attr('missing', 'x'); // → 'x'
   */
  attr(name, defaultValue = null) {
    return this.hasAttribute(name) ? this.getAttribute(name) : defaultValue;
  }

  /**
   * Reflect a value back to an attribute.
   * Passing null or undefined removes the attribute.
   *
   * @param {string} name - Attribute name
   * @param {string|null|undefined} value - Value to set; null/undefined removes the attribute
   *
   * @example
   * this.reflect('status', 'issued');  // sets status="issued"
   * this.reflect('status', null);      // removes the status attribute
   */
  reflect(name, value) {
    if (value === null || value === undefined) {
      this.removeAttribute(name);
    } else {
      this.setAttribute(name, String(value));
    }
  }
}
