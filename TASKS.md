# Codebase Issues and Task Backlog

## Priority P0 (Fix first)

1. **Refactor for testability and modularity**
   - Split `src/js/app.js` into pure exported functions (`createDocDefinition`, worksheet parser, and generation coordinator) and a DOM bootstrap layer.
   - Ensure unit tests can import the functions directly.

2. **Fix UI event wiring**
   - Remove inline `onclick` from HTML.
   - Use one consistent flow: either form `submit` with `type="submit"` button, or explicit click listener in JS.

3. **Fix worksheet parsing and null safety**
   - Read cell values via `.v` safely (`worksheet['A2']?.v`), not raw cell objects.
   - Validate required fields (e.g., name in `A1`) and fail gracefully with user-facing errors.

## Priority P1 (Stabilize project)

4. **Consolidate duplicated source files**
   - Decide whether `src/*` is source-of-truth and remove/archive root duplicates (`app.js`, `index.html`, `style.css`) to prevent drift.

5. **Add missing project tooling**
   - Add `package.json` with scripts for local run, lint, and test.
   - Add testing configuration (Jest/Vitest) and lockfile.

6. **Align documentation with reality**
   - Update README commands and project structure to match actual runnable/testable setup.

## Priority P2 (Quality improvements)

7. **Expand automated tests**
   - Add tests for malformed workbook layouts, empty rows, missing `A1`, and invalid file selections.

8. **Improve accessibility and UX feedback**
   - Ensure `aria-labelledby` references existing elements.
   - Disable the generate button while processing and show inline status/error messages.

9. **Dependency and security hygiene**
   - Upgrade pinned CDN library versions and optionally bundle dependencies locally for deterministic builds.
