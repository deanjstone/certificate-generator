/**
 * History API SPA router.
 *
 * Routes are matched in registration order. The first match wins.
 * Route patterns support named parameters (`:param`) and a wildcard (`*`).
 *
 * Usage:
 * ```js
 * import { router } from './router.js';
 *
 * router.addRoute('/', ({ params }) => { ... });
 * router.addRoute('/admin/certificates/:id', ({ params }) => {
 *   console.log(params.id);
 * });
 *
 * // Start routing — attaches popstate listener and renders current URL
 * router.start(document.getElementById('app'));
 *
 * // Programmatic navigation
 * router.navigate('/admin/certificates');
 * ```
 *
 * The router strips the Vite `base` path prefix automatically so handlers
 * always receive the application-relative path (e.g. `/admin/certificates`
 * not `/certificate-generator/admin/certificates`).
 *
 * @module router
 */

/**
 * @typedef {object} RouteContext
 * @property {Record<string, string>} params  - Named URL parameters
 * @property {string}                 path    - Full matched path (after base)
 * @property {string}                 pattern - The pattern that matched
 */

/**
 * @typedef {(ctx: RouteContext) => HTMLElement|string|null|void} RouteHandler
 */

export class Router {
  /** @type {Array<{ pattern: string, regex: RegExp, keys: string[], handler: RouteHandler }>} */
  #routes = [];

  /** @type {HTMLElement|null} */
  #outlet = null;

  /** @type {string} Base path stripped from all URLs (e.g. '/certificate-generator') */
  #base = '';

  /** @type {(() => void)|null} */
  #unsubPopstate = null;

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /**
   * Set the base path prefix that the router strips before matching.
   * Automatically inferred from `document.baseURI` when start() is called,
   * but can be set explicitly for testing.
   *
   * @param {string} base - e.g. '/certificate-generator'
   */
  setBase(base) {
    this.#base = base.replace(/\/$/, ''); // strip trailing slash
  }

  // ---------------------------------------------------------------------------
  // Route registration
  // ---------------------------------------------------------------------------

  /**
   * Register a route.
   *
   * Pattern syntax:
   * - `/path/to/page`          — static
   * - `/path/:param`           — named parameter
   * - `/path/:a/:b`            — multiple parameters
   * - `*`                      — catch-all (place last)
   *
   * @param {string}       pattern
   * @param {RouteHandler} handler
   * @returns {Router} this (chainable)
   */
  addRoute(pattern, handler) {
    const { regex, keys } = this.#compile(pattern);
    this.#routes.push({ pattern, regex, keys, handler });
    return this;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Start the router.
   * Attaches a `popstate` listener and resolves the current URL immediately.
   *
   * @param {HTMLElement} outlet - Container element where route content is rendered
   */
  start(outlet) {
    this.#outlet = outlet;

    // Infer base from the Vite-injected <base> tag or document.baseURI
    if (!this.#base) {
      this.#base = this.#inferBase();
    }

    const handler = () => this.#resolve();
    window.addEventListener('popstate', handler);
    this.#unsubPopstate = () => window.removeEventListener('popstate', handler);

    this.#resolve();
  }

  /**
   * Stop the router and remove event listeners.
   */
  stop() {
    this.#unsubPopstate?.();
    this.#unsubPopstate = null;
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigate to a path, pushing a new history entry.
   *
   * @param {string} path - Application-relative path (e.g. '/admin/certificates')
   */
  navigate(path) {
    const full = this.#base + path;
    window.history.pushState(null, '', full);
    this.#resolve();
  }

  /**
   * Replace the current history entry without pushing.
   *
   * @param {string} path - Application-relative path
   */
  replace(path) {
    const full = this.#base + path;
    window.history.replaceState(null, '', full);
    this.#resolve();
  }

  /**
   * Return the current application-relative pathname (base stripped).
   *
   * @returns {string}
   */
  currentPath() {
    const raw = window.location.pathname;
    return this.#stripBase(raw);
  }

  // ---------------------------------------------------------------------------
  // Resolution
  // ---------------------------------------------------------------------------

  /** Resolve the current URL against registered routes. */
  #resolve() {
    const path = this.currentPath();

    for (const route of this.#routes) {
      const match = route.regex.exec(path);
      if (!match) continue;

      const params = {};
      route.keys.forEach((key, i) => {
        params[key] = decodeURIComponent(match[i + 1] ?? '');
      });

      const ctx = { params, path, pattern: route.pattern };
      this.#render(route.handler(ctx));
      return;
    }

    // No route matched — render nothing
    this.#render(null);
  }

  /**
   * Render the result of a route handler into the outlet.
   *
   * @param {HTMLElement|string|null|void} content
   */
  #render(content) {
    if (!this.#outlet) return;

    if (content instanceof HTMLElement) {
      this.#outlet.innerHTML = '';
      this.#outlet.appendChild(content);
    } else if (typeof content === 'string') {
      this.#outlet.innerHTML = content;
    } else {
      this.#outlet.innerHTML = '';
    }
  }

  // ---------------------------------------------------------------------------
  // Pattern compilation
  // ---------------------------------------------------------------------------

  /**
   * Compile a route pattern into a RegExp + list of param keys.
   *
   * @param {string} pattern
   * @returns {{ regex: RegExp, keys: string[] }}
   */
  #compile(pattern) {
    const keys = [];

    if (pattern === '*') {
      return { regex: /^[\s\S]*$/, keys };
    }

    const regexStr = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, (ch) => {
        // Allow ':param' — don't escape colons; escape everything else
        return ch === ':' ? ch : `\\${ch}`;
      })
      .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, key) => {
        keys.push(key);
        return '([^/]+?)';
      });

    return { regex: new RegExp(`^${regexStr}\\/?$`), keys };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** @param {string} raw */
  #stripBase(raw) {
    if (this.#base && raw.startsWith(this.#base)) {
      const stripped = raw.slice(this.#base.length) || '/';
      return stripped.startsWith('/') ? stripped : '/' + stripped;
    }
    return raw || '/';
  }

  /**
   * Infer the base path from the page's <base> href or document.baseURI.
   * @returns {string}
   */
  #inferBase() {
    try {
      const base = document.querySelector('base')?.getAttribute('href')
        ?? new URL(document.baseURI).pathname;
      return base.replace(/\/$/, '');
    } catch {
      return '';
    }
  }
}

/** Shared application router singleton. */
export const router = new Router();
