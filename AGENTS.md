# MTProto Panel — Agent Guide

Web panel for managing MTProto proxy servers. Two-package repo: `backend/` (Express API) and `frontend/` (React SPA). All UI text and docs are in Russian.

## Architecture

- `backend/` — Express + PostgreSQL + TypeScript. JWT auth, raw SQL migrations (no migration tool), REST API under `/api/`.
- `frontend/` — React 18 + Vite + Gravity UI (Yandex component library) + TypeScript. Built to static files served by nginx.
- `docker-compose.yml` — Runs three containers: frontend (nginx), backend (node), db (postgres:16-alpine).
- Backend mounts `/var/run/docker.sock` and the project root at `/app/project` for self-update capability.
- Production install path: `/opt/mtproto-panel`.

## Dev Commands

### Backend (`backend/`)
```bash
cd backend
npm install
npm run dev          # ts-node src/index.ts (requires .env with DB credentials)
npm run build        # tsc → dist/
```

### Frontend (`frontend/`)
```bash
cd frontend
npm install
npm run dev          # Vite dev server, proxies /api → localhost:3000
npm run build        # tsc && vite build → dist/
```

### Docker (full stack)
```bash
docker compose up -d --build
```

## No Lint/Test/Typecheck Scripts

This repo has **no linting, testing, or typecheck scripts** configured. There are no test files, no ESLint/Prettier config, and no CI workflows. The frontend `build` script runs `tsc && vite build` which does type-checking implicitly.

## Key Gotchas

- **No `.env` in repo** — `.env` is gitignored and required for runtime. Create one based on the variables documented in `docker-compose.yml` (PORT, ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET, DB_NAME, DB_USER, DB_PASSWORD).
- **Backend Dockerfile installs bash, git, docker-cli** — needed for the self-update endpoint (`POST /api/system/update` runs `update.sh` inside the container).
- **`COMPOSE_PROJECT_NAME=mtproto-panel`** — set in `install.sh` and `update.sh` to keep the `pgdata` volume name consistent. Don't change this or the DB volume breaks.
- **Migrations are raw SQL** — `backend/src/db/migrations.ts` runs `CREATE TABLE IF NOT EXISTS` on startup. No migration versioning or rollback. Schema changes go here.
- **Backend reads `package.json` at runtime** — `GET /api/system/version` reads `../package.json` relative to `dist/`. Keep the `version` field in `backend/package.json` in sync.

## File Structure Reference

```
backend/src/
  index.ts          — Express app bootstrap, route registration
  config.ts         — env-based config (PORT, JWT, DB)
  db/index.ts       — pg Pool
  db/migrations.ts  — schema creation + admin user seeding
  middleware/auth.ts — JWT verification middleware
  routes/auth.ts    — login/register
  routes/nodes.ts   — CRUD for service nodes
  routes/proxies.ts — proxy management per node
  routes/allProxies.ts — cross-node proxy listing

frontend/src/
  App.tsx           — React Router setup (login, nodes, proxies, settings)
  api/index.ts      — API client (fetch-based)
  pages/            — Login, Nodes, NodeDetail, ProxyDetail, Proxies, Settings
  components/       — Layout and shared components
  hooks/            — Custom React hooks
  utils/            — Utility functions
```

## Deploy Flow

1. `install.sh` clones repo to `/opt/mtproto-panel`, generates `.env`, runs `docker compose up -d --build`
2. `update.sh` does `git pull`, `docker compose down`, rebuilds, and restarts
3. `uninstall.sh` tears down containers, removes volumes and the install directory
4. SSL is optional (self-signed or Let's Encrypt), configured during install via `docker-compose.override.yml`
