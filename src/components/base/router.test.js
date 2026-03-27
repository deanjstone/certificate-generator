import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Router } from './router.js';

// ---------------------------------------------------------------------------
// Minimal browser stubs
// ---------------------------------------------------------------------------

globalThis.HTMLElement = class HTMLElement {};

let _pathname = '/';
const _historyListeners = {};

globalThis.window = globalThis;
globalThis.addEventListener = (type, fn) => {
  _historyListeners[type] = _historyListeners[type] || [];
  _historyListeners[type].push(fn);
};
globalThis.removeEventListener = (type, fn) => {
  if (_historyListeners[type]) {
    _historyListeners[type] = _historyListeners[type].filter(f => f !== fn);
  }
};

globalThis.location = {
  get pathname() { return _pathname; },
};

globalThis.history = {
  pushState(_state, _title, url) { _pathname = url; },
  replaceState(_state, _title, url) { _pathname = url; },
};

globalThis.document = {
  querySelector: () => null,
  baseURI: 'http://localhost/',
};

/** Fake outlet element */
function makeOutlet() {
  return {
    innerHTML: '',
    _children: [],
    appendChild(child) { this._children.push(child); this.innerHTML = '[element]'; },
  };
}

/** Fire a popstate event */
function popstate() {
  (_historyListeners['popstate'] || []).forEach(fn => fn(new Event('popstate')));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** @returns {Router} fresh router with base set to '' */
function makeRouter() {
  const r = new Router();
  r.setBase('');
  return r;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Router', () => {
  beforeEach(() => {
    _pathname = '/';
    // Clear popstate listeners between tests
    _historyListeners['popstate'] = [];
  });

  // -------------------------------------------------------------------------
  // Pattern compilation / matching
  // -------------------------------------------------------------------------

  describe('route matching', () => {
    it('matches a static route exactly', () => {
      const r = makeRouter();
      const calls = [];
      r.addRoute('/admin', ctx => { calls.push(ctx); });
      _pathname = '/admin';
      r.start(makeOutlet());
      assert.equal(calls.length, 1);
      assert.equal(calls[0].path, '/admin');
    });

    it('does not match a different static route', () => {
      const r = makeRouter();
      const calls = [];
      r.addRoute('/admin', ctx => calls.push(ctx));
      _pathname = '/login';
      r.start(makeOutlet());
      assert.equal(calls.length, 0);
    });

    it('matches a route with a trailing slash', () => {
      const r = makeRouter();
      const calls = [];
      r.addRoute('/admin', ctx => calls.push(ctx));
      _pathname = '/admin/';
      r.start(makeOutlet());
      assert.equal(calls.length, 1);
    });

    it('extracts a single named parameter', () => {
      const r = makeRouter();
      let captured = null;
      r.addRoute('/admin/certificates/:id', ctx => { captured = ctx.params; });
      _pathname = '/admin/certificates/abc-123';
      r.start(makeOutlet());
      assert.deepEqual(captured, { id: 'abc-123' });
    });

    it('extracts multiple named parameters', () => {
      const r = makeRouter();
      let captured = null;
      r.addRoute('/org/:org/repo/:repo', ctx => { captured = ctx.params; });
      _pathname = '/org/acme/repo/certgen';
      r.start(makeOutlet());
      assert.deepEqual(captured, { org: 'acme', repo: 'certgen' });
    });

    it('URL-decodes parameter values', () => {
      const r = makeRouter();
      let captured = null;
      r.addRoute('/verify/:cert_number', ctx => { captured = ctx.params; });
      _pathname = '/verify/CERT%2F0001';
      r.start(makeOutlet());
      assert.equal(captured?.cert_number, 'CERT/0001');
    });

    it('wildcard * matches any path', () => {
      const r = makeRouter();
      const calls = [];
      r.addRoute('*', ctx => calls.push(ctx));
      _pathname = '/anything/at/all';
      r.start(makeOutlet());
      assert.equal(calls.length, 1);
    });

    it('first matching route wins (stops after first match)', () => {
      const r = makeRouter();
      const hits = [];
      r.addRoute('/page', () => hits.push('first'));
      r.addRoute('/page', () => hits.push('second'));
      _pathname = '/page';
      r.start(makeOutlet());
      assert.deepEqual(hits, ['first']);
    });

    it('no match renders nothing and does not throw', () => {
      const r = makeRouter();
      r.addRoute('/admin', () => {});
      _pathname = '/not-registered';
      assert.doesNotThrow(() => r.start(makeOutlet()));
    });

    it('provides pattern in context', () => {
      const r = makeRouter();
      let pat = null;
      r.addRoute('/admin/certificates/:id', ctx => { pat = ctx.pattern; });
      _pathname = '/admin/certificates/x';
      r.start(makeOutlet());
      assert.equal(pat, '/admin/certificates/:id');
    });
  });

  // -------------------------------------------------------------------------
  // Base path stripping
  // -------------------------------------------------------------------------

  describe('base path', () => {
    it('strips base from the URL before matching', () => {
      const r = new Router();
      r.setBase('/certificate-generator');
      const calls = [];
      r.addRoute('/admin', ctx => calls.push(ctx));
      _pathname = '/certificate-generator/admin';
      r.start(makeOutlet());
      assert.equal(calls.length, 1);
      assert.equal(calls[0].path, '/admin');
    });

    it('prepends base when calling navigate()', () => {
      const r = new Router();
      r.setBase('/app');
      r.addRoute('/login', () => {});
      r.start(makeOutlet());
      r.navigate('/login');
      assert.equal(_pathname, '/app/login');
    });

    it('prepends base when calling replace()', () => {
      const r = new Router();
      r.setBase('/app');
      r.addRoute('/login', () => {});
      r.start(makeOutlet());
      r.replace('/login');
      assert.equal(_pathname, '/app/login');
    });
  });

  // -------------------------------------------------------------------------
  // navigate() / replace()
  // -------------------------------------------------------------------------

  describe('navigate()', () => {
    it('pushes a new history entry and resolves the route', () => {
      const r = makeRouter();
      const calls = [];
      r.addRoute('/admin', ctx => calls.push(ctx));
      r.start(makeOutlet());
      r.navigate('/admin');
      assert.equal(_pathname, '/admin');
      assert.equal(calls.length, 1);
    });

    it('resolves the new route immediately', () => {
      const r = makeRouter();
      const log = [];
      r.addRoute('/a', () => log.push('a'));
      r.addRoute('/b', () => log.push('b'));
      _pathname = '/a';
      r.start(makeOutlet());
      r.navigate('/b');
      assert.deepEqual(log, ['a', 'b']);
    });
  });

  describe('replace()', () => {
    it('replaces the current history entry and resolves', () => {
      const r = makeRouter();
      const calls = [];
      r.addRoute('/settings', ctx => calls.push(ctx));
      r.start(makeOutlet());
      r.replace('/settings');
      assert.equal(_pathname, '/settings');
      assert.equal(calls.length, 1);
    });
  });

  // -------------------------------------------------------------------------
  // currentPath()
  // -------------------------------------------------------------------------

  describe('currentPath()', () => {
    it('returns the path with base stripped', () => {
      const r = new Router();
      r.setBase('/certificate-generator');
      _pathname = '/certificate-generator/admin';
      assert.equal(r.currentPath(), '/admin');
    });

    it('returns "/" when at the base root', () => {
      const r = new Router();
      r.setBase('/certificate-generator');
      _pathname = '/certificate-generator';
      assert.equal(r.currentPath(), '/');
    });

    it('returns the raw path when base is empty', () => {
      const r = makeRouter();
      _pathname = '/verify/CERT-001';
      assert.equal(r.currentPath(), '/verify/CERT-001');
    });
  });

  // -------------------------------------------------------------------------
  // Popstate (browser back/forward)
  // -------------------------------------------------------------------------

  describe('popstate', () => {
    it('re-resolves the route on popstate', () => {
      const r = makeRouter();
      const log = [];
      r.addRoute('/a', () => log.push('a'));
      r.addRoute('/b', () => log.push('b'));
      _pathname = '/a';
      r.start(makeOutlet());
      _pathname = '/b';
      popstate();
      assert.deepEqual(log, ['a', 'b']);
    });
  });

  // -------------------------------------------------------------------------
  // Outlet rendering
  // -------------------------------------------------------------------------

  describe('outlet rendering', () => {
    it('renders an HTMLElement returned by the handler', () => {
      const r = makeRouter();
      // Create an instance of the stubbed HTMLElement
      const el = new HTMLElement();
      const outlet = makeOutlet();
      r.addRoute('/page', () => el);
      _pathname = '/page';
      r.start(outlet);
      assert.equal(outlet._children[0], el);
    });

    it('renders a string returned by the handler as innerHTML', () => {
      const r = makeRouter();
      const outlet = makeOutlet();
      r.addRoute('/page', () => '<h1>Hello</h1>');
      _pathname = '/page';
      r.start(outlet);
      assert.equal(outlet.innerHTML, '<h1>Hello</h1>');
    });

    it('clears outlet when no route matches', () => {
      const r = makeRouter();
      const outlet = makeOutlet();
      outlet.innerHTML = 'old content';
      _pathname = '/no-match';
      r.start(outlet);
      assert.equal(outlet.innerHTML, '');
    });

    it('clears outlet when handler returns null', () => {
      const r = makeRouter();
      const outlet = makeOutlet();
      outlet.innerHTML = 'stale';
      r.addRoute('/empty', () => null);
      _pathname = '/empty';
      r.start(outlet);
      assert.equal(outlet.innerHTML, '');
    });
  });

  // -------------------------------------------------------------------------
  // stop() / lifecycle
  // -------------------------------------------------------------------------

  describe('stop()', () => {
    it('removes the popstate listener so navigation no longer fires handlers', () => {
      const r = makeRouter();
      const log = [];
      r.addRoute('/x', () => log.push('x'));
      _pathname = '/x';
      r.start(makeOutlet());
      r.stop();
      _pathname = '/x';
      popstate();
      // Only the initial resolve fired, not the one after stop()
      assert.equal(log.length, 1);
    });

    it('stop() is safe to call multiple times', () => {
      const r = makeRouter();
      r.addRoute('*', () => {});
      r.start(makeOutlet());
      assert.doesNotThrow(() => { r.stop(); r.stop(); });
    });
  });

  // -------------------------------------------------------------------------
  // addRoute() chaining
  // -------------------------------------------------------------------------

  describe('addRoute() chaining', () => {
    it('returns the router for chaining', () => {
      const r = makeRouter();
      const result = r.addRoute('/a', () => {});
      assert.equal(result, r);
    });

    it('supports fluent registration of multiple routes', () => {
      const r = makeRouter();
      const log = [];
      r.addRoute('/a', () => log.push('a'))
       .addRoute('/b', () => log.push('b'))
       .addRoute('/c', () => log.push('c'));
      _pathname = '/b';
      r.start(makeOutlet());
      assert.deepEqual(log, ['b']);
    });
  });

  // -------------------------------------------------------------------------
  // Singleton export
  // -------------------------------------------------------------------------

  describe('router singleton', () => {
    it('exports a shared Router instance', async () => {
      const { router } = await import('./router.js');
      assert.ok(router instanceof Router);
    });
  });

  // -------------------------------------------------------------------------
  // All application routes (smoke test — patterns compile and match correctly)
  // -------------------------------------------------------------------------

  describe('application routes', () => {
    const appRoutes = [
      { pattern: '/',                              path: '/',                              expectedParams: {} },
      { pattern: '/login',                         path: '/login',                         expectedParams: {} },
      { pattern: '/admin',                         path: '/admin',                         expectedParams: {} },
      { pattern: '/admin/certificates',            path: '/admin/certificates',            expectedParams: {} },
      { pattern: '/admin/certificates/new',        path: '/admin/certificates/new',        expectedParams: {} },
      { pattern: '/admin/certificates/:id',        path: '/admin/certificates/abc-123',    expectedParams: { id: 'abc-123' } },
      { pattern: '/admin/import',                  path: '/admin/import',                  expectedParams: {} },
      { pattern: '/admin/settings',                path: '/admin/settings',                expectedParams: {} },
      { pattern: '/student',                       path: '/student',                       expectedParams: {} },
      { pattern: '/student/certificates/:id',      path: '/student/certificates/cert-99',  expectedParams: { id: 'cert-99' } },
      { pattern: '/verify/:cert_number',           path: '/verify/CERT-0042',              expectedParams: { cert_number: 'CERT-0042' } },
    ];

    for (const { pattern, path: testPath, expectedParams } of appRoutes) {
      it(`pattern "${pattern}" matches "${testPath}"`, () => {
        const r = makeRouter();
        let captured = null;
        r.addRoute(pattern, ctx => { captured = ctx; });
        _pathname = testPath;
        r.start(makeOutlet());
        assert.ok(captured !== null, `Expected "${pattern}" to match "${testPath}"`);
        assert.deepEqual(captured.params, expectedParams);
      });
    }

    it('/admin/certificates/new is matched before /admin/certificates/:id', () => {
      const r = makeRouter();
      const log = [];
      // Register in the same order as the app will
      r.addRoute('/admin/certificates/new', () => log.push('new'));
      r.addRoute('/admin/certificates/:id', () => log.push('id'));
      _pathname = '/admin/certificates/new';
      r.start(makeOutlet());
      assert.deepEqual(log, ['new']);
    });
  });
});
