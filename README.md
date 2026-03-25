# Certificate Generator — VET

Generate, manage and issue VET (Vocational Education & Training) certificates.

## Prerequisites

- Node.js 22+
- pnpm

## Setup

```sh
pnpm install
```

## Commands

- Start dev server: `pnpm dev`
- Build for production: `pnpm build`
- Preview production build: `pnpm preview`
- Run tests: `pnpm test`

## Deployment

Push to `main` to trigger the GitHub Pages deployment workflow.

### One-time setup

1. **Repo → Settings → Pages → Source → GitHub Actions**
2. **Settings → Secrets → Actions** — add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## License

MIT
