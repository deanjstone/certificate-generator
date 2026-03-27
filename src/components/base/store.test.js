import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from './store.js';

/** @returns {Store} */
function makeStore() {
  return new Store();
}

describe('Store', () => {
  describe('get()', () => {
    it('returns empty object initially', () => {
      const s = makeStore();
      assert.deepEqual(s.get(), {});
    });

    it('returns a shallow copy, not the internal reference', () => {
      const s = makeStore();
      s.set({ count: 1 });
      const a = s.get();
      const b = s.get();
      assert.notEqual(a, b);
      assert.deepEqual(a, b);
    });
  });

  describe('set()', () => {
    it('merges the patch into state', () => {
      const s = makeStore();
      s.set({ a: 1 });
      s.set({ b: 2 });
      assert.deepEqual(s.get(), { a: 1, b: 2 });
    });

    it('overwrites existing keys on collision', () => {
      const s = makeStore();
      s.set({ a: 1 });
      s.set({ a: 99 });
      assert.equal(s.get().a, 99);
    });

    it('does not remove keys not present in the patch', () => {
      const s = makeStore();
      s.set({ a: 1, b: 2 });
      s.set({ b: 3 });
      assert.equal(s.get().a, 1);
    });
  });

  describe('subscribe()', () => {
    it('calls the listener immediately after set()', () => {
      const s = makeStore();
      const calls = [];
      s.subscribe(state => calls.push(state));
      s.set({ x: 42 });
      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0], { x: 42 });
    });

    it('does NOT call the listener before any set()', () => {
      const s = makeStore();
      let called = false;
      s.subscribe(() => { called = true; });
      assert.equal(called, false);
    });

    it('passes the full merged state to each listener', () => {
      const s = makeStore();
      const received = [];
      s.subscribe(state => received.push({ ...state }));
      s.set({ a: 1 });
      s.set({ b: 2 });
      assert.deepEqual(received[0], { a: 1 });
      assert.deepEqual(received[1], { a: 1, b: 2 });
    });

    it('notifies multiple subscribers', () => {
      const s = makeStore();
      let c1 = 0, c2 = 0;
      s.subscribe(() => c1++);
      s.subscribe(() => c2++);
      s.set({ v: 1 });
      assert.equal(c1, 1);
      assert.equal(c2, 1);
    });

    it('returns an unsubscribe function', () => {
      const s = makeStore();
      let count = 0;
      const unsub = s.subscribe(() => count++);
      s.set({ a: 1 });
      unsub();
      s.set({ a: 2 });
      assert.equal(count, 1);
    });

    it('unsubscribing one listener does not affect others', () => {
      const s = makeStore();
      let c1 = 0, c2 = 0;
      const unsub1 = s.subscribe(() => c1++);
      s.subscribe(() => c2++);
      unsub1();
      s.set({ v: 1 });
      assert.equal(c1, 0);
      assert.equal(c2, 1);
    });

    it('calling unsub twice is safe', () => {
      const s = makeStore();
      const unsub = s.subscribe(() => {});
      assert.doesNotThrow(() => { unsub(); unsub(); });
    });
  });

  describe('store singleton', () => {
    it('exports a shared Store instance', async () => {
      const { store } = await import('./store.js');
      assert.ok(store instanceof Store);
    });
  });
});
