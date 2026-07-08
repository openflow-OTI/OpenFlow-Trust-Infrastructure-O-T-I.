---
id: rate-limits
title: Rate Limits & Plans
sidebar_position: 5
---

# Rate Limits & Plans

OTI enforces two types of rate limits:

1. **Daily limit** — maximum requests per UTC calendar day, per plan tier
2. **IP burst limit** — short-window burst protection applied to all requests regardless of plan

---

## Plan Tiers

| Plan | Daily Limit | API Key Required | Description |
|------|-------------|-----------------|-------------|
| Anonymous | Live — see note below | No | Default for unauthenticated requests |
| Free | Set by OpenFlow Labs | Yes | Entry-level keyed access |
| Pro | Set by OpenFlow Labs | Yes | Higher-volume integrations |
| Enterprise | Unlimited | Yes | Full access, no daily cap |

:::info Live anonymous limit
The anonymous daily limit is **100 requests per day** (verified from the live API on July 8, 2026). This value is configurable by OpenFlow Labs and may change — check the live endpoint for the current value:

```bash
curl https://workspaceapi-server-production-5c0c.up.railway.app/api/config/anonymous-limit
```

Response:
```json
{ "daily_limit": 100, "updated_at": "2026-07-08T08:56:58.719Z" }
```
:::

---

## Daily Limit Behavior

- Limits reset at **midnight UTC**.
- Anonymous requests are tracked by IP address.
- Keyed requests are tracked per API key.
- When the daily limit is exceeded, the API returns `429` with the reset timestamp:

```json
{
  "error": "Daily rate limit exceeded",
  "limit": 100,
  "reset": "2026-07-09T00:00:00.000Z"
}
```

The `reset` field is an ISO 8601 UTC timestamp indicating when the counter resets.

---

## IP Burst Limit

All requests (anonymous and keyed) are subject to a short-window burst limit per IP. This protects the API from sudden traffic spikes. When triggered, the API returns `429` with a human-readable explanation:

```json
{
  "error": "Too many requests",
  "details": "IP rate limit exceeded — slow down and retry"
}
```

Unlike the daily limit, burst protection is temporary. Back off for a few seconds and retry.

---

## Passing Your API Key

Include your key in the `x-api-key` header on every request:

```bash
curl "https://workspaceapi-server-production-5c0c.up.railway.app/api/score/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?chain=ethereum" \
  -H "x-api-key: oti_your_key_here"
```

API keys are in the format `oti_<32 hex chars>`. The full key is shown **only once** at creation — store it immediately.

---

## How to Get a Key

Contact [openflowlabs.io](https://openflowlabs.io) to request an API key. Free-tier keys are available for evaluation and low-volume production use.

---

## Upgrading Your Plan

Plan upgrades are handled by the OpenFlow Labs team. Reach out at [openflowlabs.io](https://openflowlabs.io) with your current key and desired tier.
