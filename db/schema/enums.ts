import { pgEnum } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['user', 'admin'])

export const mediaOwnerTypeEnum = pgEnum('media_owner_type', [
  'product',
  'category',
  'banner',
  'blog',
  'review',
  'catalogue',
  'user',
])

export const productStatusEnum = pgEnum('product_status', [
  'draft',
  'active',
  'archived',
])

export const discountTypeEnum = pgEnum('discount_type', ['flat', 'percent'])

export const couponScopeEnum = pgEnum('coupon_scope', [
  'order',
  'product',
  'category',
])

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
])

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'authorized',
  'paid',
  'failed',
  'refunded',
])

export const paymentProviderEnum = pgEnum('payment_provider', ['razorpay', 'icici'])

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'paused',
  'cancelled',
  'expired',
])

export const coinLedgerTypeEnum = pgEnum('coin_ledger_type', [
  'order_reward',
  'referral_reward',
  'redemption',
  'manual_adjustment',
])

export const customerContactTypeEnum = pgEnum(
  "customer_contact_type",
  ["newsletter", "enquiry"]
);


export const reviewStatusEnum = pgEnum('review_status', [
  'pending',
  'accepted',
  'rejected',
])
