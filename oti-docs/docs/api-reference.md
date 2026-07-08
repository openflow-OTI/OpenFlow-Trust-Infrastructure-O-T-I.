---
id: api-reference
title: API Reference
sidebar_position: 2
---

# API Reference

**Base URL:** `https://workspaceapi-server-production-5c0c.up.railway.app/api`

All responses are `Content-Type: application/json`. Authentication is optional for anonymous requests; keyed requests include `x-api-key: oti_<your_key>` in the header.

---

## Authentication

| Method | Header | Notes |
|--------|--------|-------|
| Anonymous | _(none)_ | Up to 100 requests/day per IP |
| API Key | `x-api-key: oti_<key>` | Higher limits depending on plan |

---

## Endpoints

### `GET /healthz`

Health check. Returns immediately with no computation.

**Request**

```bash
curl https://workspaceapi-server-production-5c0c.up.railway.app/api/healthz
```

**Response `200 OK`**

```json
{ "status": "ok" }
```

---

### `GET /chains`

Returns all chains OTI can score, with their internal chain IDs.

**Request**

```bash
curl https://workspaceapi-server-production-5c0c.up.railway.app/api/chains
```

**Response `200 OK`**

```json
{
  "count": 15,
  "chains": [
    { "name": "ethereum",  "chainId": 1 },
    { "name": "bsc",       "chainId": 56 },
    { "name": "polygon",   "chainId": 137 },
    { "name": "arbitrum",  "chainId": 42161 },
    { "name": "optimism",  "chainId": 10 },
    { "name": "base",      "chainId": 8453 },
    { "name": "avalanche", "chainId": 43114 },
    { "name": "fantom",    "chainId": 146 },
    { "name": "linea",     "chainId": 59144 },
    { "name": "zksync",    "chainId": 324 },
    { "name": "ton",       "chainId": "ton" },
    { "name": "solana",    "chainId": "solana" },
    { "name": "sui",       "chainId": "sui" },
    { "name": "bitcoin",   "chainId": "bitcoin" },
    { "name": "tron",      "chainId": "tron" }
  ]
}
```

---

### `GET /score/{address}`

Computes or returns a cached trust score for the given wallet address on the specified chain.

Results are cached in memory. The first call fetches live on-chain data; subsequent calls for the same address + chain return `"cached": true`.

**Parameters**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `address` | path | string | ✅ | Wallet address. EVM addresses are case-insensitive (lowercased internally). |
| `chain` | query | string | ✅ | Chain identifier. See [Supported Chains](/supported-chains). |

**Request**

```bash
curl "https://workspaceapi-server-production-5c0c.up.railway.app/api/score/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?chain=ethereum"
```

**Response `200 OK` — Normal score**

```json
{
  "address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
  "chain": "ethereum",
  "cached": false,
  "compromised": false,
  "score": 87,
  "signals": {
    "walletAge": {
      "score": 100,
      "weighted": 25,
      "maxWeight": 25
    },
    "transactionCount": {
      "score": 100,
      "weighted": 20,
      "maxWeight": 20
    },
    "tokenHoldingBehavior": {
      "score": 90,
      "weighted": 18,
      "maxWeight": 20
    },
    "smartContractInteractions": {
      "score": 85,
      "weighted": 17,
      "maxWeight": 20
    },
    "transactionTimingPatterns": {
      "score": 46,
      "weighted": 7,
      "maxWeight": 15
    }
  }
}
```

**Response `200 OK` — Compromised wallet**

If the address is on the denylist, OTI returns `200` (not a 4xx error) with `"compromised": true` and `"score": null`:

```json
{
  "address": "0xabc...123",
  "chain": "ethereum",
  "compromised": true,
  "reason": "Known phishing wallet — flagged by OpenFlow Security",
  "reported_at": "2026-06-01T12:00:00.000Z",
  "score": null
}
```

**Response fields**

| Field | Type | Description |
|-------|------|-------------|
| `address` | string | Wallet address (EVM addresses lowercased) |
| `chain` | string | Chain the score was computed on |
| `cached` | boolean | `true` if result came from memory cache |
| `compromised` | boolean | `false` on a normal response |
| `score` | number | Overall trust score 0–100 |
| `signals.walletAge` | WeightedSignal | How long the wallet has been active |
| `signals.transactionCount` | WeightedSignal | Number of transactions (capped at 1,000) |
| `signals.tokenHoldingBehavior` | WeightedSignal | Token holding patterns |
| `signals.smartContractInteractions` | WeightedSignal | Smart contract usage history |
| `signals.transactionTimingPatterns` | WeightedSignal | Timing regularity between transactions |

**WeightedSignal shape**

| Field | Type | Description |
|-------|------|-------------|
| `score` | number | Raw signal score 0–100, independent of weight |
| `weighted` | number | Points this signal contributes to the overall score. `weighted = score × (maxWeight / 100)` |
| `maxWeight` | number | Maximum points this signal can contribute |

---

### `POST /score`

Alternative to `GET /score/{address}`. Accepts `address` and `chain` in the request body instead of path and query. Behaviour is identical — same caching, same compromised-wallet check, same response shapes.

**Request body**

```json
{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "chain": "ethereum"
}
```

**Request**

```bash
curl -X POST https://workspaceapi-server-production-5c0c.up.railway.app/api/score \
  -H "Content-Type: application/json" \
  -d '{"address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045","chain":"ethereum"}'
```

**Response:** Identical to `GET /score/{address}`.

---

### `GET /score/{address}/history`

Returns persisted score history for the given wallet address, ordered by most recent first, limited to the **50 most recent records**.

`?chain=` is optional. When omitted, results include history across all chains sharing the wallet's chain family (e.g. all EVM chains for an EVM address) — in this case the response's top-level `chain` is `null` and each history entry carries its own `chain`.

:::note
EVM addresses are ambiguous across the 10 supported EVM chains, so `?chain=` must be supplied when the address alone cannot be auto-detected.
:::

**Parameters**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `address` | path | string | ✅ | Wallet address |
| `chain` | query | string | ❌ | Filter results to a specific chain |

**Request**

```bash
curl "https://workspaceapi-server-production-5c0c.up.railway.app/api/score/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045/history?chain=ethereum"
```

**Response `200 OK`**

```json
{
  "address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
  "chain": "ethereum",
  "count": 3,
  "history": [
    {
      "score": 87,
      "signals": {
        "walletAge": 100,
        "transactionCount": 100,
        "tokenHoldingBehavior": 90,
        "smartContractInteractions": 85,
        "transactionTimingPatterns": 46
      },
      "chain": "ethereum",
      "address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      "timestamp": "2026-07-08T14:22:10.000Z"
    }
  ]
}
```

:::info
History `signals` contain **raw scores only** (not weighted), as stored at the time the record was created. This differs from the live `/score` endpoint which returns the full `WeightedSignal` shape.
:::

**Response fields**

| Field | Type | Description |
|-------|------|-------------|
| `address` | string | Wallet address |
| `chain` | string \| null | Chain filter applied, or `null` when no `?chain=` was provided |
| `count` | number | Number of history entries (max 50) |
| `history[]` | array | Array of history entries |
| `history[].score` | number | Overall score at time of recording |
| `history[].signals` | object | Raw signal scores (not weighted) |
| `history[].chain` | string | Chain this record was computed on |
| `history[].timestamp` | string | ISO 8601 UTC timestamp when the score was recorded |

---

## Error Codes

| HTTP Status | When | Body shape |
|-------------|------|------------|
| `400 Bad Request` | Invalid address format, unknown chain, malformed body | `{ "error": string, "details": string[] \| string }` |
| `404 Not Found` | Resource not found | `{ "error": string }` |
| `429 Too Many Requests` (daily) | Daily request limit exceeded | `{ "error": "Daily rate limit exceeded", "limit": number, "reset": string }` |
| `429 Too Many Requests` (IP burst) | Too many requests in a short window | `{ "error": "Too many requests", "details": string }` |
| `500 Internal Server Error` | Unexpected server error | `{ "error": string }` |
| `503 Service Unavailable` | Chain temporarily unavailable | `{ "error": string }` |

**Example 400 response:**

```json
{
  "error": "Invalid request",
  "details": ["Must be a valid Ethereum wallet address (0x followed by 40 hex characters)"]
}
```

**Example 429 daily limit response:**

```json
{
  "error": "Daily rate limit exceeded",
  "limit": 100,
  "reset": "2026-07-09T00:00:00.000Z"
}
```
