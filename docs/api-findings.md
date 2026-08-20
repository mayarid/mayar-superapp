# Mayar V2 API — findings

Behaviour observed against the production API that the documentation either does
not state or states differently. Recorded as we hit it, with the date and the
exact response, so that the demo pages can cite evidence rather than opinion.

Every entry below was reproduced against `https://api.mayar.id/hl/v2`.

---

## 1. Payment link update requires `name`, though the docs mark it optional

**Date:** 2026-08-20
**Endpoint:** `POST /hl/v2/payment-links/{id}/update`

The documentation lists `name` as optional and `id` as the only required field.
In practice, omitting `name` fails validation.

```jsonc
// request: { "id": "<uuid>", "amount": 2000 }
{
  "statusCode": 200,
  "messages": "failed",
  "data": [
    { "type": "required", "message": "The 'name' field is required.", "field": "name" }
  ]
}
```

Sending `id`, `name`, and `amount` together succeeds.

## 2. A failed write can still return HTTP 200

**Date:** 2026-08-20
**Endpoint:** `POST /hl/v2/payment-links/{id}/update`

Finding 1 above returned **HTTP 200** with `messages: "failed"` and a validator
array in `data`. A client that only checks the HTTP status will treat this as a
success and silently skip the update.

**Consequence for this codebase:** `mayarFetch` must treat
`messages === "failed"` as an error even on 2xx, not just `statusCode >= 400`.

## 3. Invoice line items reject a negative `rate`

**Date:** 2026-08-20
**Endpoint:** `POST /hl/v2/invoices/create`

A discount cannot be expressed as its own negative line.

```jsonc
// request items: [ {..rate: 1000}, { "quantity": 1, "rate": -200, "description": "Diskon" } ]
{
  "statusCode": 400,
  "messages": "Validation Error",
  "data": [
    {
      "type": "numberPositive",
      "message": "The 'items[1].rate' field must be a positive number.",
      "field": "items[1].rate",
      "actual": -200
    }
  ]
}
```

**Consequence:** a discount on an itemised invoice must be applied by lowering
the `rate` of the real lines proportionally. The buyer therefore cannot see the
discount as a separate line on the Mayar-hosted invoice.

## 4. Coupon `products` entries must be objects, not id strings

**Date:** 2026-08-20
**Endpoint:** `POST /hl/v2/coupons/create`

```jsonc
// products: ["<uuid>"]  ->
{ "type": "object", "message": "The 'products[0]' must be an Object.", "field": "products[0]" }
```

`products: [{ "id": "<uuid>" }]` is correct.

## 5. Coupon binding is enforced, and a mismatch reads as "not found"

**Date:** 2026-08-20
**Endpoint:** `POST /hl/v2/coupons/validate`

Validating a real coupon against a product it is not bound to returns 404 with
the same message as a code that does not exist at all:

```json
{ "statusCode": 404, "messages": "Gagal! Kode diskon ini tidak ditemukan.", "data": null }
```

**Consequence:** the app cannot distinguish "wrong product" from "no such
coupon", so the user-facing copy must not claim either specifically.

## 6. No V2 endpoint creates a membership, credit, or SaaS product

**Date:** 2026-08-20

`llms.txt` lists product-creation endpoints only for `generic_link`, digital
product, webinar, and event. The membership, credit, and SaaS groups expose
member, tier, balance, and license operations, but nothing that creates the
product itself. Those three must be created in the Mayar dashboard by the
merchant.

## 7. Coupons cannot be deleted

**Date:** 2026-08-20

The V2 discount group exposes `index`, `create`, `detail`, `validate`, and
`check`. There is no delete or deactivate endpoint, and the CLI exposes none
either. A coupon created by mistake stays in the account.

## 8. Create-product response is richer than documented

**Date:** 2026-08-20
**Endpoint:** `POST /hl/v2/products/payment-link/create`

The documentation shows `data: { id, link }`. The actual response also returns
`name`, `amount`, `description`, `type`, `status`, `redirectUrl`, `coverImage`,
`expiredAt`, `limit`, `notes`, `tax`, and `createdAt`.

Extra fields are safe to ignore, but do not rely on them: they are not part of
the documented contract and may change.

## 9. Membership, SaaS, and credit products share one undocumented endpoint

**Date:** 2026-08-20
**Endpoint:** `POST /hl/v2/memberships/products/create` (exposed by the CLI as
`mayar membership product create`; absent from `llms.txt`)

Finding 6 said no V2 endpoint creates these products. That is true of the
documented surface only. The endpoint exists and works. Required fields are
`name` and `membershipInfo.type`; the enum error names the allowed values:

```json
{
  "type": "stringEnum",
  "message": "The 'membershipInfo.type' field does not match any of the allowed values.",
  "field": "membershipInfo.type",
  "expected": "MEMBERSHIP, SAAS, CREDIT",
  "actual": "ngawur"
}
```

So all three product families are one product type with a discriminator.
`membershipInfo` also carries `creditValue`, `isAccumulateCredit`,
`isAccumulateTopupCredit`, `enableCreditTopup`, `minCreditTopup`, and
`maxCreditTopup`, all null unless set.

Note that `membershipInfo.paymentLinkId` equals the product's own `id`, so a
membership product can be passed straight to `coupons/validate` as
`paymentLinkId`.

**Being undocumented, none of this is a contract.** Treat it as observed
behaviour that may change without notice.

## 10. Tier creation accepts a payload it has already rejected

**Date:** 2026-08-20
**Endpoint:** `POST /hl/v2/memberships/tiers/create`

Omitting `periods` fails with a clear, well-written error:

```
Field `periods` must contain at least one priced period.
A tier with no priced period cannot be sold.
```

But sending `periods: [{}]` **succeeds** and produces exactly what that error
was guarding against: a tier whose `membershipTierPeriod` entries are all
generated at the standard 1/3/6/12-month cadence with `amount: null` and
`status: null`. The tier is active and unsellable.

A priced tier needs explicit values:

```json
{ "periods": [{ "monthPeriod": 1, "amount": 2000, "credit": 100 }] }
```

`credit` is what grants wallet units on a CREDIT product. Only the periods you
name get an `amount`; the rest stay null.

## 11. Tiers cannot be deleted either

**Date:** 2026-08-20

As with coupons (finding 7), the CLI exposes only `tier create` and `tier get`,
and no delete or deactivate endpoint appears in `llms.txt`. An unsellable tier
created by mistake stays on the product.

## 12. Updating a membership-type product also requires `amount`

**Date:** 2026-08-20
**Endpoint:** `POST /hl/v2/payment-links/{id}/update`

Finding 1 showed `name` is required despite being documented as optional. For a
membership-family product, `amount` is required too:

```json
{ "type": "required", "message": "The 'amount' field is required.", "field": "amount" }
```

The required set therefore varies by product type, which the documentation does
not mention.

## 13. Renaming a product does not move its public URL, but `link` does

**Date:** 2026-08-20
**Endpoint:** `POST /hl/v2/payment-links/{id}/update`

A product's public slug is fixed at creation from its original `name`, and
changing `name` later leaves the slug behind. A product created as `probe` keeps
serving `https://<merchant>.myr.id/m/probe` no matter what it is renamed to.

An undocumented `link` field in the same update payload moves the slug:

```jsonc
{ "id": "<uuid>", "name": "superapp-demo-saas", "amount": 2000, "link": "superapp-demo-saas" }
// -> data.link: "https://<merchant>.myr.id/pl/superapp-demo-saas"
```

Being undocumented, this is observed behaviour and not a contract. But without
it, a mistaken product name is permanent in the URL a customer sees.

## 14. `GET /hl/v2/transactions` is balance history, not transactions

**Date:** 2026-08-20
**Endpoint:** `GET /hl/v2/transactions`

This is the most expensive finding in this file. It was invisible until a real
Rp1.000 payment was made and the reconciler failed to notice it.

The path suggests a list of the transactions that `payments/create` and
`invoices/create` produce. It is not. It is the merchant's balance history, and
its rows have a different shape:

```jsonc
{
  "id": "97904e7c-…",                    // the balance-history row, NOT the transaction
  "credit": 1000,                        // the amount — there is no `amount` field
  "status": "paid",                      // later becomes "settled"
  "balanceHistoryType": "payment_request",
  "paymentMethod": "QRIS",
  "paymentLinkTransactionId": "f00579d7-…",  // ← the id a create endpoint returned
  "paymentLinkId": "c418e217-…",         // an internal link, NOT the demo product
  "xenditTransactionId": "453d6ecb-…",   // the id shown in the hosted thank-you URL
  "customer": { "email": "…", "name": "…", "mobile": "…" }
}
```

Three traps:

1. **Matching on `id` finds nothing.** The transaction id lives in
   `paymentLinkTransactionId`.
2. **`amount` is always null.** The field is `credit`. Requesting `amount`
   through the `fields` parameter does not produce it.
3. **`paymentLinkId` is not the product.** A single payment request gets its own
   generated link (named "Penagihan"), so this cannot identify which demo
   product was bought.

`GET /hl/v2/transactions/unpaid` does *not* share this schema. There, `id` is
the transaction id and `amount` is present, with status `active` or `expired`.
The two list endpoints look related and are not.

`GET /hl/v2/transactions/{id}` is authoritative and behaves as documented: pass
the id from a create endpoint and it returns the real `status` and `amount`.

## 15. `payments/create` truly cannot redirect the buyer back

**Date:** 2026-08-20

Finding 13 showed that an undocumented field (`link`) worked where the docs were
silent, so `redirectUrl` was worth testing on the payment path too. It is not
supported, in either of two ways:

- `POST /hl/v2/payments/create` with `redirectUrl` returns 200 and ignores it.
  The value is absent from the created record. **A silently dropped field is
  worse than a rejection** — nothing signals that the request did not take.
- `POST /hl/v2/payment-links/{id}/update` with `redirectUrl` on the resulting
  payment link returns `messages: "success"`, and the value is still null
  afterwards.

`redirectUrl` only holds on a `generic_link` product created through
`products/create` or `products/payment-link/create`. Those endpoints accept no
buyer fields and no per-checkout amount.

**The trade is therefore forced:** a checkout can know who is buying and apply a
discount, or it can return the buyer to your site automatically. Not both.

## 16. `startAt` and `endAt` are accepted and ignored

**Date:** 2026-08-20
**Endpoint:** `GET /hl/v2/transactions`

The documentation lists `startAt` and `endAt` as Unix-millisecond bounds. They
have no effect. Asking for rows starting *tomorrow* returns the same page as
asking for none:

```
tanpa filter                 rows=30  newest=1787200118772
startAt = one hour ago       rows=30  newest=1787200118772
startAt = tomorrow           rows=30  newest=1787200118772   ← should be empty
```

Any design that narrows this feed by time is quietly reading whatever the
endpoint felt like returning.

## 17. `status=paid` is required, not an optimisation

**Date:** 2026-08-20
**Endpoint:** `GET /hl/v2/transactions`

Following on from finding 16: with no way to narrow by time, the default page
of 50 fills with old `settled` rows, and a payment made seconds ago is not in
it. `status=paid` is what surfaces it:

```
no filter        rows=30  our payment present: false
status=paid      rows=2   our payment present: true
```

This is how a second real payment went unnoticed even after finding 14 fixed
the field mapping. The keys were right by then; the page simply did not contain
the row.

**There is also a lag.** `GET /hl/v2/transactions/{id}` reported `paid` while no
balance-history row existed yet for that payment. The two views are not
updated together, so a reconciler built only on the feed will be late, and one
built only on per-transaction reads will be expensive. This codebase uses the
feed first and falls back to a capped number of direct reads for orders still
waiting after the lag window.

---

## Still unresolved

**Where does a SaaS license code come from?** No page states how a license code
is first issued. Resolving this needs a real purchase of a SaaS product, which
needs a SaaS product to exist first. See finding 6.

## 18. The `/hl/v2/credit/*` group answers 404 on this account

**Date:** 2026-08-20

Every credit endpoint returns `{"statusCode": 404, "messages": "Not Found"}`,
using the paths printed in the documentation and the same paths the official
CLI uses:

```
POST /hl/v2/credit/credit-usage/customer/regist   -> 404
POST /hl/v2/credit/generate/immutable/checkout    -> 404
GET  /hl/v2/credit/balance                        -> 404
```

This is not a bad product id. The product reads back normally through
`mayar membership product get`, with `status: active`, `type: CREDIT`, and a
priced tier granting 100 credits for Rp2.000.

It was first assumed to be a configuration gap, because the original CREDIT
product had been created without any `membershipInfo` credit settings. A second
product was created with `creditValue`, `isAccumulateCredit`,
`isAccumulateTopupCredit`, `enableCreditTopup`, `minCreditTopup`, and
`maxCreditTopup` all set, and it confirmed those values on read. The endpoints
still answer 404.

**Update, same day: it is not account-specific.** The same three endpoints were
retried in the sandbox environment, against a different account
(`ad732280-…`) and a `Test Credit Type` product created earlier through the
dashboard rather than the API. They answer 404 there too.

Two accounts, two environments, and a product created by hand all produce the
same result, so an account entitlement no longer explains it. Either these
paths are not deployed, or they differ from what both the documentation and the
official CLI use. Confirming which needs Mayar support.

## 19. Tier-priced models cannot take a coupon

**Date:** 2026-08-20

Membership, SaaS, and credit are one product family — `membershipInfo.type` of
`MEMBERSHIP`, `SAAS`, or `CREDIT` (finding 9) — and all three are sold through a
tier whose period carries the price:

```json
{ "monthPeriod": 1, "amount": 2000, "credit": 100 }
```

The endpoint that raises their bill,
`POST /hl/v2/memberships/members/{memberId}/invoice/create`, computes `amount`
from that tier and accepts no override. `coupons/validate` will happily confirm
a coupon against these products, but nothing can apply it.

So a coupon is only usable where the app controls the amount it sends:
`payments/create`, `invoices/create`, `installments/create`, and the QRIS
amount. Five of the eight billing models, not eight.

## 20. Instalment terms return a bare slug where every other endpoint returns a URL

**Date:** 2026-08-20
**Endpoint:** `POST /hl/v2/installments/create`

`invoices/create` and `payments/create` both return `link` as an absolute URL.
Each term inside `installments[].invoices[]` returns `link` as a slug:

```json
{ "amount": 1000, "link": "5kg42jjzpa" }
```

Rendered as-is, that is a relative link that resolves against your own site.
The prefix has to be added by the client — `https://<merchant>.myr.id/invoices/`
— which means the merchant origin becomes something the integration must know
out of band.

## 21. Membership member rows arrive with flattened dotted keys

**Date:** 2026-08-20
**Endpoint:** `GET /hl/v2/memberships/members`

The nested objects are not nested. `customer.email` is a literal property name:

```json
{
  "memberId": "FDWGFECK",
  "customer.name": "Faiz Intifada",
  "customer.email": "faizintifada@gmail.com",
  "membershipTier.name": "Pro Bulanan"
}
```

Every other endpoint in this app nests its relations, including the balance
history, which returns a real `customer` object. Code written against the usual
shape reads `undefined` here and fails silently — which is exactly how the
membership re-registration path broke.

## 22. A membership email may only be registered once per tier

**Date:** 2026-08-20
**Endpoint:** `POST /hl/v2/memberships/members/create`

A second registration for the same email on the same tier is rejected:

```json
{ "messages": "Email sudah terdaftar pada tier ini." }
```

This is correct behaviour, but it makes renewal the normal path rather than the
exception. A subscription checkout must look the member up and bill the
existing record, not create a new one. Combined with finding 21, the lookup is
easy to get wrong.

## 23. Both sandbox hosts are real and interchangeable

**Date:** 2026-08-20

Finding 16's neighbour: the V2 reference documents the sandbox as
`api.mayar.io`, while the official CLI targets `api.mayar.club`. One sandbox API
key was tried against all three hosts:

```
api.mayar.io     -> 200  22 payment channels
api.mayar.club   -> 200  22 payment channels
api.mayar.id     -> 401  Unauthorized
```

They are aliases of the same environment, not two environments. Neither source
is wrong. Production rejects a sandbox key outright, which at least makes a
mixed-up key fail loudly rather than quietly.

Note that the sandbox storefront origin differs too —
`<merchant>.mayar.shop` rather than `<merchant>.myr.id` — so anything that
prefixes a bare slug (finding 20) has to switch with the environment.

## 24. WITHDRAWN — sandbox does not reject SAAS or CREDIT

**Withdrawn 2026-08-20, the same day it was written.** The conclusion below was
wrong, and it is left here because a retracted finding is more useful than a
deleted one.

`mayar membership product create` created both a SAAS and a CREDIT product in
sandbox without complaint, moments after a hand-rolled POST to
`/hl/v2/memberships/products/create` refused them. The payload was the same, so
the CLI is not calling that path. The endpoint I guessed at exists and answers,
but it is not the one that creates these products — and it fails with a message
that sounds like a platform limit rather than a wrong address.

**The lesson is the one the skill states outright: do not guess a path.** I had
inferred this route from the CLI's command name rather than reading it, and the
error message was plausible enough to build a false conclusion on.

Note that finding 18 survives this: with a CREDIT product created properly by
the CLI, `credit/generate/immutable/checkout` still answers 404.

### Original claim, now withdrawn

**Date:** 2026-08-20
**Endpoint:** `POST /hl/v2/memberships/products/create`

Finding 9 recorded that this undocumented endpoint creates all three product
families, with `membershipInfo.type` of `MEMBERSHIP`, `SAAS`, or `CREDIT`. That
holds in production. Sandbox refuses two of them outright:

```
membershipInfo.type "SAAS" is not supported by this endpoint.
Only "MEMBERSHIP" products can be created here.
```

So the two environments are not running the same API. Sandbox is the stricter
of the pair, which suggests production is the older deployment rather than the
more capable one — and that the SaaS and credit products created there may have
been accepted without ever being fully valid. That fits finding 18, where a
CREDIT product read back correctly and every credit endpoint still answered 404.

**Sandbox is therefore not a safe rehearsal for production here.** A call that
works in one may fail in the other, in both directions.

## 25. The sandbox invoice origin differs from its storefront origin

**Date:** 2026-08-20

Sandbox lists products under `<merchant>.mayar.shop`, but the payment links it
returns are served from `<merchant>.myr.lat`:

```
product listing -> https://faizintifada.mayar.shop/pl/...
payment link    -> https://faizintifada.myr.lat/invoices/...
```

Production uses `<merchant>.myr.id` for both. Anything that expands the bare
instalment slug (finding 20) has to use the invoice origin, not the storefront
one, or it builds links that 404.

## 26. `/saas/v2` rejects the key that `/hl/v2` accepts

**Date:** 2026-08-20
**Endpoints:** `POST /saas/v2/license/activate`, `POST /saas/v2/license/verify`

The same sandbox API key that reads payment channels, creates payments, and
validates coupons under `/hl/v2` is refused on the licence path:

```json
{ "messages": "Failed authentication! Please check your token authorization." }
```

This is an authentication failure, not "licence not found", so it happens
before the code is even considered. Either the licence endpoints expect a
different credential, or `/saas/v2` is served from a host other than the one
`/hl/v2` uses.

Worth noting how easy this is to misread: with an invented code in the field,
"failed authentication" looks like the code being rejected. It is not — the
request never got that far.
