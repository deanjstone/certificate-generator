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

## License

MIT
