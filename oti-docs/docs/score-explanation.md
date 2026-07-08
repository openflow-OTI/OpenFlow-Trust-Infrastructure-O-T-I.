---
id: score-explanation
title: Score Explanation
sidebar_position: 3
---

# Score Explanation

## The 0–100 Scale

Every OTI score is a number from **0 to 100**. A higher score means more evidence of legitimate, organic on-chain activity. A lower score means less evidence — whether from limited history, irregular behavior, or patterns associated with bots and malicious actors.

:::info
A low score does not mean a wallet is compromised. It means OTI has less data to establish trust. New wallets and small holders will naturally score lower.
:::

---

## Trust Tiers

| Score Range | Label | Meaning |
|-------------|-------|---------|
| 80–100 | **HIGHLY TRUSTED** | Strong on-chain history. Long active, high tx count, organic behavior. |
| 60–79 | **TRUSTED** | Solid history with minor gaps. Generally safe to interact with. |
| 40–59 | **CAUTION** | Limited or mixed signals. More scrutiny recommended. |
| 20–39 | **SUSPICIOUS** | Weak or irregular history. Proceed with care. |
| 0–19 | **HIGH RISK** | Minimal or clearly bot-like activity. High caution advised. |

---

## The Five Signals

OTI computes five independent signals from on-chain data. Each signal is scored 0–100, then weighted and summed to produce the overall score.

### walletAge — max 25 points

How long the wallet has been active, measured from its first on-chain transaction to the present day. Older wallets are more likely to belong to real users.

- A wallet active for several years scores near 100.
- A wallet created days ago scores near 0.

### transactionCount — max 20 points

Total number of transactions sent by the wallet, **capped at 1,000** for scoring purposes. More transactions indicate sustained, organic use.

- A wallet with 1,000+ transactions scores near 100.
- A wallet with 1–2 transactions scores near 0.

### tokenHoldingBehavior — max 20 points

How the wallet holds and interacts with tokens — diversity, holding duration, and whether patterns resemble genuine investment versus wash trading or airdrop farming.

- Long-term multi-token holders score near 100.
- Wallets that immediately dump or show no token activity score lower.

### smartContractInteractions — max 20 points

The breadth and depth of smart contract usage — DeFi protocols, NFT contracts, DAOs, bridges, and so on. Wallets that interact with many contracts tend to belong to real users.

- High-interaction wallets (DeFi power users, NFT traders) score near 100.
- Wallets that never interact with contracts score near 0.

### transactionTimingPatterns — max 15 points

The regularity and naturalness of transaction timing. Human activity is irregular; bot activity is often clock-precise.

- Organic, irregular timing patterns score near 100.
- Highly regular, automated cadences score lower.

---

## Weighted Score Formula

The overall score is the sum of each signal's weighted contribution:

```
overall_score = Σ (signal.score × signal.maxWeight / 100)
```

| Signal | maxWeight | At 100% raw score |
|--------|-----------|-------------------|
| walletAge | 25 | 25 pts |
| transactionCount | 20 | 20 pts |
| tokenHoldingBehavior | 20 | 20 pts |
| smartContractInteractions | 20 | 20 pts |
| transactionTimingPatterns | 15 | 15 pts |
| **Total** | **100** | **100 pts** |

### Example

If a wallet scores:
- walletAge: 100 → weighted = 100 × (25/100) = **25**
- transactionCount: 80 → weighted = 80 × (20/100) = **16**
- tokenHoldingBehavior: 75 → weighted = 75 × (20/100) = **15**
- smartContractInteractions: 60 → weighted = 60 × (20/100) = **12**
- transactionTimingPatterns: 40 → weighted = 40 × (15/100) = **6**

**Overall score = 25 + 16 + 15 + 12 + 6 = 74 → TRUSTED**

---

## Compromised Wallets

If a wallet appears in OTI's compromised denylist (flagged by the OpenFlow Security team), the API returns `"compromised": true` and `"score": null` — no trust score is computed. A compromised flag supersedes the scoring pipeline entirely.

The response includes a human-readable `reason` and a `reported_at` timestamp.

---

## Caching

OTI caches scores in memory. The first request for an address+chain pair fetches live on-chain data (may take a few seconds). Subsequent requests for the same pair return `"cached": true` instantly. Score history is persisted in the database and accessible via the `/score/{address}/history` endpoint.
