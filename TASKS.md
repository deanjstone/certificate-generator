# Codebase Issues and Task Backlog

## Priority P0 (Fix first)

1. **Refactor for testability and modularity** ✅ **Done**
   - Split `src/js/app.js` into pure exported functions (`createDocDefinition`, worksheet parser, and generation coordinator) and a DOM bootstrap layer.
   - Ensure unit tests can import the functions directly.
   - Branch note: completed in `codex/complete-first-task-from-tasks.md` and ready to merge into `main`.

2. **Fix UI event wiring** ✅ **Done**
   - Remove inline `onclick` from HTML.
   - Use one consistent flow: either form `submit` with `type="submit"` button, or explicit click listener in JS.

3. **Fix worksheet parsing and null safety** ✅ **Done**
   - Read cell values via `.v` safely (`worksheet['A2']?.v`), not raw cell objects.
   - Validate required fields (e.g., name in `A1`) and fail gracefully with user-facing errors.

## Priority P1 (Stabilize project)

4. **Consolidate duplicated source files** ✅ **Done**
   - Chosen `src/*` as source of truth.
   - Removed duplicate root `app.js` and `style.css` to prevent drift.
   - Root `index.html` now references `src` assets.

5. **Add missing project tooling** ✅ **Done**
   - Added `package.json` scripts for local run (`npm start`), lint (`npm run lint`), and test (`npm test`).
   - Added deterministic lockfile (`package-lock.json`).

6. **Align documentation with reality** ✅ **Done**
   - Updated `README.md` commands and project structure to match current setup.

## Priority P2 (Quality improvements)

7. **Expand automated tests** ✅ **Done**
   - Added tests for malformed workbook layouts, empty-row behavior, missing `A1`, and invalid file selections.

8. **Improve accessibility and UX feedback** ✅ **Done**
   - `aria-labelledby` now points to an existing `form-title` element.
   - Generate button is disabled while processing.
   - Inline loading/status and error messages are shown without relying on alert popups in the browser bootstrap flow.

9. **Dependency and security hygiene** ✅ **Done**
   - Updated CDN dependencies to newer versions in HTML entrypoints:
     - `pdfmake` → `0.2.20`
     - `xlsx` → `0.18.5`
