import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import {
  orderStatusEnum,
  paymentProviderEnum,
  paymentStatusEnum,
} from './enums'
import { productVariants, products } from './products'
import { addresses, users } from './users'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [uniqueIndex('carts_user_id_idx').on(table.userId)],
)

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, {
      onDelete: 'set null',
    }),
    quantity: integer('quantity').default(1).notNull(),
    isSubscription: boolean('is_subscription').default(false).notNull(),
    subscriptionFrequencyInMonths: integer('subscription_frequency_in_months'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('cart_items_cart_id_idx').on(table.cartId),
    index('cart_items_product_id_idx').on(table.productId),
  ],
)

export const wishlists = pgTable(
  'wishlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('wishlists_user_id_idx').on(table.userId)],
)

export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wishlistId: uuid('wishlist_id')
      .notNull()
      .references(() => wishlists.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('wishlist_items_unique_idx').on(table.wishlistId, table.productId),
    index('wishlist_items_product_id_idx').on(table.productId),
  ],
)

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 40 }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    addressId: uuid('address_id').references(() => addresses.id, {
      onDelete: 'set null',
    }),
    status: orderStatusEnum('status').default('pending').notNull(),
    shipmentProvider: varchar('shipment_provider').default('envia'),
    trackingNumber: varchar('tracking_number'),
    trackingUrl: text('tracking_url'),
    shipmentStatus: varchar('shipment_status', { length: 80 }).default('processing').notNull(),
    shipmentId: varchar('shipment_id', { length: 180 }),
    courierName: varchar('courier_name', { length: 160 }),
    estimatedDeliveryDate: timestamp('estimated_delivery_date', { withTimezone: true }),
    shipedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    shippingPhone: varchar('shipping_phone', { length: 20 }).notNull(),
    shippingPhone2: varchar('shipping_phone_2', { length: 20 }),
    addressLine1: text('address_line_1').notNull(),
    addressLine2: text('address_line_2'),
    city: varchar('city', { length: 120 }).notNull(),
    state: varchar('state', { length: 120 }).notNull(),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    country: varchar('country', { length: 80 }).default('India').notNull(),
    totalAmount: integer('total_amount').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('orders_order_number_idx').on(table.orderNumber),
    index('orders_user_id_idx').on(table.userId),
    index('orders_status_idx').on(table.status),
  ],
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, {
      onDelete: 'set null',
    }),
    quantity: integer('quantity').notNull(),
    productPrice: integer('product_price').notNull(),
    productName: varchar('product_name', { length: 220 }).notNull(),
    productSlug: varchar('product_slug', { length: 180 }).notNull(),
    productSku: varchar('product_sku', { length: 80 }).notNull(),
    productImage: varchar('product_image', { length: 220 }),
    variantTitle: varchar('variant_title', { length: 180 }),
  },
  (table) => [
    index('order_items_order_id_idx').on(table.orderId),
  ],
)

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: paymentProviderEnum('provider').default('razorpay').notNull(),
    status: paymentStatusEnum('status').default('pending').notNull(),
    providerOrderId: varchar('provider_order_id', { length: 180 }),
    providerPaymentId: varchar('provider_payment_id', { length: 180 }),
    amountInPaise: integer('amount_in_paise').notNull(),
    method: varchar('method', { length: 80 }),
    metadata: jsonb('metadata'),
    ...timestamps,
  },
  (table) => [
    index('payments_order_id_idx').on(table.orderId),
    index('payments_status_idx').on(table.status),
    uniqueIndex('payments_provider_order_id_idx').on(table.providerOrderId),
    uniqueIndex('payments_provider_payment_id_idx').on(table.providerPaymentId),
  ],
)

export const shipments = pgTable(
  'shipments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 80 }).notNull(),
    providerShipmentId: varchar('provider_shipment_id', { length: 180 }),
    courierName: varchar('courier_name', { length: 160 }),
    trackingNumber: varchar('tracking_number', { length: 160 }),
    trackingUrl: text('tracking_url'),
    status: varchar('status', { length: 80 }).default('processing').notNull(),
    estimatedDeliveryDate: timestamp('estimated_delivery_date', { withTimezone: true }),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('shipments_order_id_idx').on(table.orderId),
    index('shipments_tracking_number_idx').on(table.trackingNumber),
  ],
)
