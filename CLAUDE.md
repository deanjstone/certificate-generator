# Certificate Generator — Claude Code Guide

## Project Overview

A lightweight, zero-dependency web app that generates PDF certificates from Excel spreadsheet data. Deployed as a static site on GitHub Pages.

External libraries (pdfmake, xlsx) are loaded from CDN — there are no npm runtime dependencies.

## Essential Commands

```bash
npm test          # Run all tests (Node.js built-in test runner)
npm run lint      # Syntax check source and test files
npm start         # Start local dev server at http://localhost:3000
```

Always run `npm test` and `npm run lint` before committing.

## Architecture

```
src/
  js/app.js       # All application logic — pure functions + DOM bootstrap
  html/index.html # App HTML (references ../js/ and ../css/)
  css/style.css   # Styles
index.html        # GitHub Pages entrypoint (references src/)
tests/
  app.test.js     # 14 unit tests using node:test + assert/strict
```

### Design Principles

- **Pure functions first**: `createDocDefinition`, `parseWorksheet`, `isSpreadsheetFile` have no DOM side effects and are directly unit-testable.
- **Dependency injection**: `generateCertificate` accepts `{ file, xlsx, pdfMake, ... }` so tests can mock external libraries without a browser.
- **DOM bootstrap last**: `bootstrapCertificateGenerator` wires everything to the DOM and is called once on page load.

## Testing Patterns

Uses `node:test` and `node:assert/strict` (Node 18+ built-ins — no test framework to install).

```js
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
```

Tests use dependency injection to mock `xlsx`, `pdfMake`, `FileReader`, and callbacks without a browser. See `tests/app.test.js` for examples.

## Key Constraints

- **No npm runtime dependencies** — do not add packages that bundle into the app. Use CDN libs instead.
- **No build step** — files are served as-is. No bundler (webpack/vite/etc.).
- **Node 18+** required for the built-in test runner.
- CDN library versions pinned in HTML: pdfmake 0.2.20, xlsx 0.18.5.

## Data Format

Excel file expected layout:
- `A1`: Learner name
- `A2:B11`: Unit code (col A) and unit title (col B), up to 10 units

## Deployment

Push to `main` → GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) automatically deploys to GitHub Pages. No manual steps required after initial Pages setup.

## Common Tasks

**Add a new test**: Add a `it(...)` block inside a `describe` in `tests/app.test.js`. Follow the existing dependency-injection pattern.

**Change certificate layout**: Edit `createDocDefinition` in `src/js/app.js`. The function returns a pdfmake doc definition object.

**Change data parsing**: Edit `parseWorksheet` in `src/js/app.js`. Update corresponding tests in `tests/app.test.js`.
