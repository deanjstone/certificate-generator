# CLAUDE.md — AI Assistant Context

## Project
**Name:** certgen — VET Certificate Generator
**Purpose:** Generate, manage and issue VET (Vocational Education & Training) certificates
**Status:** Active development

---

## Tech Stack
- **Runtime:** Browser-native (no SSR)
- **Bundler:** Vite
- **Styling:** Open Props (CSS custom properties design system)
- **Backend:** Supabase (auth, DB, storage)
- **Package Manager:** pnpm
- **Language:** Vanilla JavaScript (ES Modules)
- **Components:** Native HTML5 Web Components (no framework)
- **Hosting:** GitHub Pages (via Actions workflow)

---

## Code Conventions

### General
- Modular, reusable functions — one responsibility per function
- Named exports preferred over default exports
- JSDoc for all public functions and components
- No TypeScript — use JSDoc types for IDE support

### Styling
- Use Open Props custom properties (`var(--size-3)`, `var(--blue-6)`, etc.)
- No utility class frameworks
- Component styles scoped via Shadow DOM where applicable
- Global tokens and overrides in `src/styles/global.css`
- Cherry-pick Open Props modules to keep bundle lean

### Web Components
- Extend `HTMLElement` directly
- Use `connectedCallback` / `disconnectedCallback` lifecycle
- Shadow DOM where encapsulation is needed
- Register via `customElements.define('cert-*', ClassName)`
- File naming: `kebab-case.js` matching element name

### File Structure
- `src/components/` — web components only
- `src/lib/` — pure utility functions (no DOM side effects)
- `src/services/` — all Supabase and external I/O
- Co-locate tests next to source files as `*.test.js`

### Supabase
- All queries go through `src/services/`
- Never call supabase client directly in components
- Use RLS — never bypass in client code

---

## Architecture Decisions
See `docs/DECISIONS.md` for full ADR log.

Key decisions:
- Native web components over React/Vue for longevity and zero framework overhead
- Vite for fast DX with ES module native bundling
- Open Props over Tailwind — semantic tokens, no utility class sprawl
- Supabase for rapid backend with built-in auth and storage
- GitHub Pages for hosting via Actions CI/CD

---

## Deployment
- **Target:** GitHub Pages at `https://<org>.github.io/certgen/`
- **Trigger:** Push to `main` branch
- **Secrets required:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Workflow:** `.github/workflows/deploy.yml`
- Vite `base` is set to `/certgen/` — update if repo name differs

---

## Current Work
<!-- Update this section each session -->
- [ ] In progress:
- [ ] Blocked by:
- [ ] Next up:

---

## Out of Scope
- No SSR / Node rendering
- No React, Vue, Svelte or similar
- No CSS-in-JS
- No utility class frameworks (Tailwind, UnoCSS, etc.)
