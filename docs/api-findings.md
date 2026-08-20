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

---

## Still unresolved

**Where does a SaaS license code come from?** No page states how a license code
is first issued. Resolving this needs a real purchase of a SaaS product, which
needs a SaaS product to exist first. See finding 6.
