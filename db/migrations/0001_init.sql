-- mayar-superapp initial schema
--
-- Scope note: Mayar itself is the system of record for entitlements — credit
-- balances, membership members, and license codes all live there. This database
-- holds only what Mayar cannot: our own checkout attempts, our own coupon usage
-- ledger, and a fulfillment log used purely for idempotency.

-- One row per checkout attempt, across all eight billing models.
CREATE TABLE orders (
  id               TEXT    PRIMARY KEY,          -- ord_<uuid>, our idempotency key
  model            TEXT    NOT NULL,             -- one_time | fulfillment | invoice |
                                                 -- membership | credit | saas | qris | installment
  status           TEXT    NOT NULL,             -- created | pending | paid | expired | ambiguous

  product_id       TEXT,                         -- Mayar productId / paymentLinkId
  mayar_id         TEXT,                         -- invoice.id / payment.id / installment.id
  transaction_id   TEXT,                         -- NULL for the credit and qris models

  -- Reconciliation keys. Only used by the two models that return no
  -- transactionId. See fail-closed matching in src/server/gate.ts.
  match_email      TEXT,                         -- credit model: customerInfo.email
  match_amount     INTEGER,                      -- qris model: amount + unique suffix

  amount_gross     INTEGER NOT NULL,
  amount_discount  INTEGER NOT NULL DEFAULT 0,
  amount_net       INTEGER NOT NULL,
  coupon_code      TEXT,

  buyer_name       TEXT,
  buyer_email      TEXT,
  buyer_mobile     TEXT,

  pay_url          TEXT,                          -- hosted Mayar link, or QR image url

  created_at       INTEGER NOT NULL,
  expires_at       INTEGER NOT NULL,
  paid_at          INTEGER,
  fulfilled_at     INTEGER
);

-- The reconciler sweeps on this every 5 seconds; keep it selective.
CREATE INDEX orders_pending ON orders (status, expires_at);
CREATE INDEX orders_txn     ON orders (transaction_id);
CREATE INDEX orders_match   ON orders (match_amount, created_at);
CREATE INDEX orders_email   ON orders (match_email, created_at);

-- Mayar's coupons/validate endpoint does not consume the coupon, and no create
-- endpoint accepts a coupon code. Usage limits are therefore enforced here.
-- Only rows with redeemed_at set count against a coupon's limit, so abandoned
-- checkouts never burn a redemption.
CREATE TABLE coupon_usage (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  coupon_code     TEXT    NOT NULL,
  order_id        TEXT    NOT NULL REFERENCES orders (id),
  product_id      TEXT    NOT NULL,
  discount_type   TEXT    NOT NULL,              -- monetary | percentage
  discount_value  INTEGER NOT NULL,
  applied_amount  INTEGER NOT NULL,              -- rupiah actually taken off
  created_at      INTEGER NOT NULL,
  redeemed_at     INTEGER
);

CREATE UNIQUE INDEX coupon_usage_order ON coupon_usage (order_id);
CREATE INDEX coupon_usage_redeemed ON coupon_usage (coupon_code, redeemed_at);

-- Fulfillment log. The unique index is the idempotency guarantee: a given
-- order can never be fulfilled twice for the same kind, enforced by the
-- database rather than by application logic.
CREATE TABLE fulfillments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    TEXT    NOT NULL REFERENCES orders (id),
  kind        TEXT    NOT NULL,                  -- receipt | r2_grant | membership_register |
                                                 -- credit_add | license_issue | schedule
  detail      TEXT,                              -- JSON, raw Mayar response reference
  created_at  INTEGER NOT NULL
);

CREATE UNIQUE INDEX fulfillments_once ON fulfillments (order_id, kind);
