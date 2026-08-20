# Mayar Superapp

A reference application that demonstrates every Mayar billing model in one place.
Each model is built as a believable product so that a developer can read a real
integration rather than a snippet.

## Billing

**Billing Model**:
One way of collecting money, distinguished by how the money arrives rather than
by what is sold. There are eight.
_Avoid_: Product type, plan, pricing model

**Order**:
One checkout attempt made in this app, in any billing model. It exists before
any money moves and survives whether or not payment happens.
_Avoid_: Purchase, cart, session

**Transaction**:
Mayar's record of money moving. Owned by Mayar, never created by us directly.
_Avoid_: Payment, charge

**Demo Product**:
A product created inside the live Mayar account purely to make this app work.
Always named with the `superapp-demo-` prefix to separate it from the account
owner's real products.
_Avoid_: Test product, sample

## Money

**Gross**:
The list price shown to a visitor before any discount.
_Avoid_: Original price, MSRP

**Net**:
The amount actually sent to Mayar, after the discount is subtracted. This is the
only figure Mayar ever sees.
_Avoid_: Final price, total

**Unique Code** (_kode unik_):
A small random amount added to the Net so that a payment can be told apart from
every other payment of the same price. Used only where Mayar returns no
identifier to match against.
_Avoid_: Nonce, reference number

## Discount

**Coupon**:
A discount code defined in Mayar and bound to a single product. Mayar can
confirm a coupon is valid but cannot apply it, and does not count its use.
_Avoid_: Voucher, promo, discount code

**Redemption**:
A coupon use that counts against its limit. A coupon is only redeemed once its
Order is paid, never at the moment it is applied.
_Avoid_: Usage, claim

## Settlement

**Reconciliation**:
Deciding which paid Transaction belongs to which Order. Necessary because this
app uses no webhook.
_Avoid_: Sync, matching, polling

**Proof**:
The evidence that links an Order to a Transaction. Either certain, when Mayar
returned a transaction identifier, or heuristic, when only an email address or a
Unique Code is available.
_Avoid_: Confirmation, verification

**Ambiguous**:
The state of an Order whose heuristic Proof matched more than one candidate
Transaction. An Ambiguous Order is never fulfilled automatically.
_Avoid_: Conflict, duplicate, unknown

**Fulfillment**:
What the app grants once an Order is proven paid. Distinct per Billing Model,
and performed at most once per Order.
_Avoid_: Delivery, provisioning, entitlement
