# Mayar Superapp

A reference application that demonstrates every Mayar billing model in one place.
Each model is built as a believable product, with a native checkout, a discount
code field, and QRIS as the primary payment method.

**This app runs against production.** Every completed checkout moves real money.
Demo prices are set to Rp1.000.

## Billing models

| Model            | Primary endpoint                                  |
| ---------------- | ------------------------------------------------- |
| Sekali bayar     | `POST /hl/v2/payments/create`                     |
| + fulfillment    | `POST /hl/v2/payments/create`, then an R2 grant   |
| Invoice berbutir | `POST /hl/v2/invoices/create`                     |
| Membership       | `POST /hl/v2/memberships/members/create`          |
| Dompet kredit    | `POST /hl/v2/credit/generate/immutable/checkout`  |
| Lisensi SaaS     | `POST /saas/v2/license/activate`                  |
| QRIS dinamis     | `POST /hl/v2/qr-codes/create`                     |
| Cicilan          | `POST /hl/v2/installments/create`                 |

See [CONTEXT.md](./CONTEXT.md) for the domain vocabulary this codebase uses.

## Notable constraints

This app uses **no webhook**. Payment is detected by polling Mayar's transaction
list endpoints from a single Durable Object, which also holds a token bucket for
Mayar's limit of 50 requests per minute per API key.

Two models return no transaction identifier, so their payment proof is
heuristic and fails closed. See the `Proof` and `Ambiguous` entries in
CONTEXT.md.

Mayar validates coupons but neither applies nor counts them, so the discount is
computed here and usage limits are enforced in D1.

## Stack

TanStack Start on Cloudflare Workers, with D1, R2, KV, and Durable Objects.
UI is shadcn/ui on Base UI, with blocks from the shadcnblocks registry.

## Setup

```bash
bun install
bunx wrangler d1 migrations apply mayar-superapp --local
bunx wrangler secret put MAYAR_API_KEY
bun dev
```

## Scripts

```bash
bun dev         # vite dev server on port 3000
bun run build   # production build
bun run typecheck
bun run lint
bun run format
```
