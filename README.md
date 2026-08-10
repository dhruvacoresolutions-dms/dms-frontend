# dms-frontend

A Next.js frontend app for distributor management system

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [TypeScript](https://www.typescriptlang.org) 5
- [Tailwind CSS](https://tailwindcss.com) 4
- [shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com)
- [lucide-react](https://lucide.dev) icons

## Prerequisites

- Node.js **22 LTS** (see `.nvmrc` / `engines` in `package.json`)
- npm **10+**

## Setup

```bash
# Install dependencies
npm install

# (Recommended) copy environment variables if provided:
# cp .env.example .env.local
```

See [Environment variables](#environment-variables) below for the expected keys.

## Environment variables

The template is in `.env.example`. Copy it to `.env.local` and fill in real values:

```bash
cp .env.example .env.local
```

| Variable             | Required | Description                                        |
| -------------------- | -------- | -------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | When the app talks to a backend | Base URL of the backend/API the frontend calls |
| `AUTH_SECRET`         | When auth is enabled          | Secret used to sign auth session cookies/tokens  |
| `AUTH_URL`            | When auth is enabled          | Public URL of the deployed app (auth callbacks)  |

> Env vars are only read once backend/auth is wired up — the app builds and runs today without any of them.

## Running the app

```bash
# Start the development server
npm run dev
# Open http://localhost:3000

# Production build
npm run build

# Start the production server (after build)
npm start
```

## Other scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm run lint`      | Run ESLint                   |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run format`    | Format code with Prettier    |

## Project structure

```
app/                # Next.js App Router routes (/, /dashboard, ...)
components/         # React components
configs/            # App configuration
hooks/              # Shared hooks
lib/                # Utilities
types/              # Shared TypeScript types
```

## Deploying to Vercel

The app is a standard Next.js project, so it can be deployed to [Vercel](https://vercel.com) with zero configuration:

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the repository.
3. Vercel auto-detects Next.js and defaults to `npm run build` (no build/install overrides needed).
4. If the app uses environment variables later, add them under **Settings → Environment Variables** (there are no build-time env vars today).
5. Deploy. Production builds run with Node 22 LTS (see `.nvmrc` / `engines` in `package.json`); local development should use Node 22 too.

Local CLI alternative:

```bash
npm i -g vercel
vercel
vercel --prod
```

## CI/CD

GitHub Actions runs lint, typecheck, and build on every push/PR to `main`.
See `.github/workflows/ci.yml`.
