/**
 * Minimal subscribe/notify reactive store.
 *
 * State is merged shallowly on each `set()` call (Object.assign semantics).
 * Listeners receive the full current state after every update.
 *
 * @example
 * import { store } from './store.js';
 *
 * const unsub = store.subscribe(state => console.log(state));
 * store.set({ user: { role: 'admin' } });
 * unsub(); // stop listening
 */
export class Store {
  /** @type {Record<string, *>} */
  #state = {};

  /** @type {Array<(state: Record<string, *>) => void>} */
  #listeners = [];

  /**
   * Register a listener that is called with the full state on every update.
   * Returns an unsubscribe function.
   *
   * @param {(state: Record<string, *>) => void} fn
   * @returns {() => void} Unsubscribe function
   */
  subscribe(fn) {
    this.#listeners.push(fn);
    return () => {
      this.#listeners = this.#listeners.filter(l => l !== fn);
    };
  }

  /**
   * Shallow-merge a patch into state and notify all listeners.
   *
   * @param {Record<string, *>} patch
   */
  set(patch) {
    Object.assign(this.#state, patch);
    const snapshot = this.get();
    this.#listeners.forEach(fn => fn(snapshot));
  }

  /**
   * Return a shallow copy of the current state.
   *
   * @returns {Record<string, *>}
   */
  get() {
    return { ...this.#state };
  }
}

/** Shared application store singleton. */
export const store = new Store();
