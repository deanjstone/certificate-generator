# Architecture Decision Records

## ADR-001: Native Web Components
**Date:** 2026-03-25
**Status:** Accepted
**Decision:** Use native HTML5 custom elements over any framework
**Rationale:** Zero runtime overhead, browser-native longevity, aligns with modular reuse goal

## ADR-002: Supabase as Backend
**Date:** 2026-03-25
**Status:** Accepted
**Decision:** Use Supabase for auth, database, and file storage
**Rationale:** Rapid backend setup, built-in RLS, generous free tier, JS SDK

## ADR-003: Vite as Bundler
**Date:** 2026-03-25
**Status:** Accepted
**Decision:** Use Vite over Webpack/Rollup/Parcel
**Rationale:** Native ES module dev server, fast HMR, minimal config

## ADR-004: No TypeScript
**Date:** 2026-03-25
**Status:** Accepted
**Decision:** Vanilla JS with JSDoc type annotations
**Rationale:** Reduces toolchain complexity; JSDoc provides IDE intellisense without a compile step

## ADR-005: Open Props over Tailwind
**Date:** 2026-03-25
**Status:** Accepted
**Decision:** Use Open Props CSS custom properties instead of a utility class framework
**Rationale:** Open Props provides a cohesive design token system (colours, sizes, typography,
shadows, easing) as native CSS custom properties. No class sprawl, no purging config, works
natively in Shadow DOM, and pairs cleanly with web components. Tailwind utility classes do not
penetrate Shadow DOM boundaries, making it a poor fit for this architecture.

## ADR-006: GitHub Pages via Actions
**Date:** 2026-03-25
**Status:** Accepted
**Decision:** Host on GitHub Pages, deployed via GitHub Actions on push to main
**Rationale:** Zero infrastructure cost, integrated with source control, OIDC-based deployment
(no long-lived tokens), automatic HTTPS. Vite base path set to repo name.
