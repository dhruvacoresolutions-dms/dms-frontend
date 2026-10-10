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

| Variable              | Required                      | Description                                        |
| --------------------- | ----------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | When the app talks to a backend | Base URL of the backend/API the frontend calls |

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

## Running with Docker

Prerequisites: [Docker](https://docs.docker.com/get-docker/) 24+ (includes `docker compose`).

The image is a multi-stage build (see `Dockerfile`): dependencies → `next build` → minimal `node:22-alpine` runner using Next.js [`standalone`](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) output. It serves on port `3000` as non-root user `nextjs`.

> `NEXT_PUBLIC_*` vars are baked into the client bundle at **build time**, not runtime. Rebuild the image (or pass a new `--build-arg`) whenever `NEXT_PUBLIC_API_URL` changes.

```bash
# 1. Build the image
docker build \
  -t dms-frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://api-staging.rahulpatel.online \
  .

# 2. Run it
docker run --rm -p 3000:3000 dms-frontend
# Open http://localhost:3000
```

Custom backend / port:

```bash
docker build -t dms-frontend --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 .
docker run --rm -p 8080:3000 dms-frontend
# Open http://localhost:8080
```

### Docker Compose

`compose.yaml` wires up the build arg and port from your environment, with staging defaults:

```bash
# Defaults: NEXT_PUBLIC_API_URL=https://api-staging.rahulpatel.online, PORT=3000
docker compose up --build

# With overrides
NEXT_PUBLIC_API_URL=http://localhost:8000 PORT=3000 docker compose up --build

# Detached + teardown
docker compose up --build -d
docker compose logs -f web
docker compose down
```

### Notes

- `.env*` files are excluded via `.dockerignore` (only `.env.example` ships), so don't rely on them inside the image — use `--build-arg` / compose `args` for `NEXT_PUBLIC_*` and `-e` / `environment` for runtime vars.
- No volumes are configured; the container is stateless. `restart: unless-stopped` is set in `compose.yaml`.

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
