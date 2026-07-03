---
name: OTI frontend conventions
description: Brand/theme decisions and API quota tradeoff for the OpenFlow Trust Infrastructure frontend.
---

- Brand direction is strict: pure black (#000000) background everywhere, mint/emerald accent (~#00E5A0), monospace typography (JetBrains Mono). Red = compromised/danger, amber = warning. Keep new UI consistent with this rather than defaulting to a generic light/dark theme.
- The backend's anonymous rate limit (3 requests/day) is shared across score + history lookups — fetching history for a wallet counts against the same quota as fetching its score. Any new feature that calls the scoring API must account for this shared budget rather than assuming independent quotas.
- Project's `tsconfig.app.json` intentionally omits `baseUrl` and defines the `@/*` path alias directly under `paths` only. This project uses TypeScript ~6.0.3 (beta, from a Vite 8 template) which deprecates `baseUrl`; adding it back will cause a config warning/error.
