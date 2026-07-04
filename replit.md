# OTI Frontend — OpenFlow Trust Infrastructure

React dashboard for scoring on-chain wallet trust. Paste a wallet address, pick a chain, get a 0–100 trust score backed by five on-chain signals.

## Stack

- **React 19 + TypeScript 6** (Vite 8 dev server)
- **TanStack Query v5** for data fetching
- **openapi-fetch** for typed API calls (schema at `src/api/schema.gen.ts`)
- **react-router-dom v7** for routing
- **@web3icons/react** for chain icons

## Running locally

```bash
pnpm install
pnpm run dev        # starts at http://localhost:5000
```

## Key environment variable

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the OTI backend API (already set via Replit shared env) |

The backend is hosted at `https://workspaceapi-server-production-5c0c.up.railway.app`.

## Regenerate API types

```bash
pnpm run codegen    # fetches OpenAPI schema and writes src/api/schema.gen.ts
```

## Project structure

```
src/
  api/          # openapi-fetch client + generated schema
  components/   # UI components (WalletForm, ScoreGauge, SignalBar, etc.)
  hooks/        # useScore, useHealth
  pages/        # Home, NotFound
  lib/          # utilities
```

## User preferences

- Keep the project's existing structure and stack.
