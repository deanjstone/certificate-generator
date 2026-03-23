# Certificate Generator

Generate a PDF certificate from learner data in an Excel spreadsheet (`.xlsx` or `.xls`).

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3 (for the local static server command)

## Setup

```sh
npm install
```

## Commands

- Run tests:
  ```sh
  npm test
  ```
- Run static checks:
  ```sh
  npm run lint
  ```
- Start a local server:
  ```sh
  npm start
  ```
  Then open `http://localhost:3000`.

## Usage

1. Open the app in a browser.
2. Upload an `.xlsx` or `.xls` file where:
   - `A1` contains the learner name.
   - Rows `A2:B11` contain unit code and unit title pairs.
3. Click **Generate Certificate**.
4. Download `Certificate.pdf`.

## Project Structure

- `src/html/index.html` – primary HTML entrypoint for the app UI.
- `src/js/app.js` – certificate generation logic + DOM bootstrap.
- `src/css/style.css` – UI styles.
- `tests/app.test.js` – Node-based automated tests.
- `TASKS.md` – backlog and implementation status.

## Deployment (GitHub Pages)

Every push to the default branch triggers the GitHub Pages deployment workflow at `.github/workflows/deploy-pages.yml`.

### One-time setup

1. In your repository, go to **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.

### Operational notes

- To trigger a manual redeploy, run the deploy workflow with `workflow_dispatch` from the **Actions** tab.
- View deployment logs in the relevant **Actions** workflow run and in the **Pages** environment details for that run.
- For project pages, the expected site URL format is: `https://<org-or-user>.github.io/<repo>/`.
- The root `index.html` is the published entrypoint, so maintainers should keep root-level static assets deployable.

## License

MIT
