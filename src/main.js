import './styles/global.css';
import { router } from './components/base/router.js';

// ---------------------------------------------------------------------------
// Components — imported here so they are registered with customElements before
// the router renders the first route. Add each component as it is built.
// ---------------------------------------------------------------------------
// import './components/layout/app-shell.js';
// import './components/layout/app-nav.js';
// import './components/layout/app-toast.js';
// import './components/layout/app-modal.js';
// import './components/display/cert-table.js';

// ---------------------------------------------------------------------------
// Route definitions
//
// Routes are matched in order — more-specific patterns must come before
// parameterised siblings (e.g. /new before /:id).
//
// Each handler receives { params, path, pattern } and should return an
// HTMLElement, an HTML string, or null/void.
// ---------------------------------------------------------------------------

router
  // Root — redirect based on auth state (placeholder until auth is wired up)
  .addRoute('/', () => {
    router.replace('/admin');
  })

  // Auth
  .addRoute('/login', () => placeholder('Login', 'Sign in with your email and password.'))

  // Admin — dashboard
  .addRoute('/admin', () => placeholder('Dashboard', 'Welcome to the admin dashboard.'))

  // Admin — certificate list
  .addRoute('/admin/certificates', () =>
    placeholder('Certificates', 'Certificate list with search, filter and sort.'))

  // Admin — create new certificate (must be before /:id)
  .addRoute('/admin/certificates/new', () =>
    placeholder('New Certificate', 'Create a new certificate with live preview.'))

  // Admin — certificate detail
  .addRoute('/admin/certificates/:id', ({ params }) =>
    placeholder('Certificate Detail', `Viewing certificate: ${params.id}`))

  // Admin — CSV bulk import
  .addRoute('/admin/import', () =>
    placeholder('Import', 'Upload a CSV to bulk-issue certificates.'))

  // Admin — settings
  .addRoute('/admin/settings', () =>
    placeholder('Settings', 'RTO configuration, signatory and logo uploads.'))

  // Student — dashboard
  .addRoute('/student', () =>
    placeholder('Student Portal', 'Your issued certificates.'))

  // Student — certificate detail
  .addRoute('/student/certificates/:id', ({ params }) =>
    placeholder('Your Certificate', `Viewing certificate: ${params.id}`))

  // Public verify page (no auth)
  .addRoute('/verify/:cert_number', ({ params }) =>
    placeholder('Verify Certificate', `Certificate number: ${params.cert_number}`))

  // 404 catch-all
  .addRoute('*', ({ path }) =>
    placeholder('404 — Not Found', `No page found at ${path}`));

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const app = document.getElementById('app');
router.start(app);

// Intercept nav-navigate events from app-nav so the router handles them
document.addEventListener('nav-navigate', (e) => {
  router.navigate(e.detail.href);
});

// ---------------------------------------------------------------------------
// Placeholder helper — replaced as real page components are built
// ---------------------------------------------------------------------------

/**
 * @param {string} title
 * @param {string} description
 * @returns {HTMLElement}
 */
function placeholder(title, description) {
  const el = document.createElement('div');
  el.style.cssText = 'padding: var(--size-6); font-family: var(--font-sans)';
  el.innerHTML = `
    <h1 style="font-size:var(--font-size-5);margin:0 0 var(--size-2)">${title}</h1>
    <p style="color:var(--text-2)">${description}</p>
  `;
  return el;
}
