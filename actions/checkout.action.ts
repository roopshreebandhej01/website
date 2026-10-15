"use server"

import crypto from "node:crypto"

import { and, count, desc, eq, or } from "drizzle-orm"

import {
  cartItems,
  carts,
  orderItems,
  orders,
  payments,
} from "@/db/schema/orders"
import {
  mediaAssets,
  productMedia,
  products,
  productVariants,
} from "@/db/schema/products"
import { addresses, users } from "@/db/schema/users"
import { db } from "@/lib/db"
import { getCurrentDbUserId } from "@/lib/current-db-user"
import { getCurrentUser } from "@/lib/auth"
import { generateMerchantTxnNo, initiateIciciSale } from "@/lib/icici"
import {
  notifyFirstOrderEmail,
  notifyOrderConfirmationEmail,
} from "@/lib/email-notifications"
import { getS3ObjectPreviewUrl } from "@/lib/s3"

type ShippingDetails = {
  addressId?: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country?: string
}

type CheckoutItemSnapshot = {
  productId: string
  variantId: string | null
  quantity: number
  productPrice: number
  productName: string
  productSlug: string
  productSku: string
  productImage: string | null
  variantTitle: string | null
}

type CheckoutTokenPayload = {
  userId: string
  source: "cart" | "buy-now"
  providerOrderId: string
  amountInPaise: number
  shipping: ShippingDetails
  items: CheckoutItemSnapshot[]
  createdAt: number
}

type RazorpayOrderResponse = {
  id: string
  amount: number
  currency: string
  receipt?: string
}

type RazorpaySuccessPayload = {
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
}

const currency = "INR"

function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
}

function getRazorpaySecret() {
  return process.env.RAZORPAY_KEY_SECRET
}

function getCheckoutSigningSecret() {
  return process.env.CHECKOUT_TOKEN_SECRET ?? getRazorpaySecret()
}

function normalizeShippingDetails(input: ShippingDetails): ShippingDetails {
  return {
    addressId: input.addressId?.trim() || undefined,
    fullName: input.fullName?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    addressLine1: input.addressLine1?.trim() ?? "",
    addressLine2: input.addressLine2?.trim() || undefined,
    city: input.city?.trim() ?? "",
    state: input.state?.trim() ?? "",
    postalCode: input.postalCode?.trim() ?? "",
    country: input.country?.trim() || "India",
  }
}

function mapAddressToShipping(
  address: typeof addresses.$inferSelect,
): ShippingDetails {
  return {
    addressId: address.id,
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.line1,
    addressLine2: [address.line2, address.locality].filter(Boolean).join(", ") || undefined,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  }
}

async function findUserAddress(userId: string, addressId: string) {
  const [address] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .limit(1)

  return address ?? null
}

async function resolveShippingDetails(userId: string, input: ShippingDetails) {
  const shipping = normalizeShippingDetails(input)

  if (shipping.addressId) {
    const address = await findUserAddress(userId, shipping.addressId)

    if (!address) {
      return { ok: false as const, message: "Selected address was not found" }
    }

    return { ok: true as const, shipping: mapAddressToShipping(address) }
  }

  return validateManualShippingDetails(shipping)
}

function validateManualShippingDetails(input: ShippingDetails) {
  const shipping = normalizeShippingDetails(input)

  if (
    !shipping.fullName ||
    !shipping.phone ||
    !shipping.addressLine1 ||
    !shipping.city ||
    !shipping.state ||
    !shipping.postalCode
  ) {
    return { ok: false as const, message: "Shipping details are required" }
  }

  return { ok: true as const, shipping: { ...shipping, addressId: undefined } }
}

function getOrderNumber() {
  const date = new Date()
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("")
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase()

  return `RS-${stamp}-${suffix}`
}

const DELIVERY_CHARGE_PAISE = 7000 // ₹70 in paise
const FREE_DELIVERY_THRESHOLD_PAISE = 50000 // ₹500 in paise

function getDeliveryChargePaise(subtotalPaise: number): number {
  if (subtotalPaise <= 0) return 0
  return subtotalPaise >= FREE_DELIVERY_THRESHOLD_PAISE ? 0 : DELIVERY_CHARGE_PAISE
}

function getTotals(items: CheckoutItemSnapshot[]) {
  const subtotal = items.reduce(
    (total, item) => total + item.productPrice * item.quantity,
    0,
  )
  const shipping = getDeliveryChargePaise(subtotal)
  const gst = 0

  return {
    subtotal,
    shipping,
    gst,
    total: subtotal + shipping + gst,
  }
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatCurrency(amountInPaise: number) {
  return `₹${(amountInPaise / 100).toLocaleString("en-IN")}`
}

function signCheckoutPayload(payload: CheckoutTokenPayload) {
  const secret = getCheckoutSigningSecret()

  if (!secret) {
    throw new Error("Checkout signing secret is not configured")
  }

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url")

  return `${body}.${signature}`
}

function readCheckoutPayload(token: string): CheckoutTokenPayload {
  const secret = getCheckoutSigningSecret()

  if (!secret) {
    throw new Error("Checkout signing secret is not configured")
  }

  const [body, signature] = token.split(".")

  if (!body || !signature) {
    throw new Error("Invalid checkout token")
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url")

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    )
  ) {
    throw new Error("Invalid checkout token signature")
  }

  return JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
}

function verifyRazorpaySignature(payload: RazorpaySuccessPayload) {
  const secret = getRazorpaySecret()

  if (!secret) {
    throw new Error("Razorpay secret is not configured")
  }

  if (
    !payload.razorpay_order_id ||
    !payload.razorpay_payment_id ||
    !payload.razorpay_signature
  ) {
    return false
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${payload.razorpay_order_id}|${payload.razorpay_payment_id}`)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(payload.razorpay_signature),
    Buffer.from(expectedSignature),
  )
}

async function createRazorpayOrder({
  amountInPaise,
  receipt,
}: {
  amountInPaise: number
  receipt: string
}) {
  const keyId = getRazorpayKeyId()
  const keySecret = getRazorpaySecret()

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured")
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString(
        "base64",
      )}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency,
      receipt,
      payment_capture: 1,
    }),
  })

  if (!response.ok) {
    throw new Error("Unable to create Razorpay order")
  }

  return (await response.json()) as RazorpayOrderResponse
}

async function getCartCheckoutItems(userId: string) {
  const rows = await db
    .select({
      productId: products.id,
      slug: products.slug,
      name: products.name,
      sku: products.sku,
      basePrice: products.basePrice,
      imageKey: mediaAssets.key,
      variantId: productVariants.id,
      variantTitle: productVariants.title,
      variantSku: productVariants.sku,
      variantPrice: productVariants.price,
      variantBannerImage: productVariants.bannerImage,
      quantity: cartItems.quantity,
    })
    .from(carts)
    .innerJoin(cartItems, eq(cartItems.cartId, carts.id))
    .innerJoin(products, eq(products.id, cartItems.productId))
    .leftJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .leftJoin(
      productMedia,
      and(
        eq(productMedia.productId, products.id),
        eq(productMedia.variantId, productVariants.id),
        eq(productMedia.isPrimary, true),
      ),
    )
    .leftJoin(mediaAssets, eq(mediaAssets.id, productMedia.mediaAssetId))
    .where(eq(carts.userId, userId))

  return rows.map((row) => {
    const imageKey = row.imageKey ?? row.variantBannerImage

    return {
      productId: row.productId,
      variantId: row.variantId,
      quantity: row.quantity,
      productPrice: row.variantPrice ?? row.basePrice,
      productName: row.name,
      productSlug: row.slug,
      productSku: row.variantSku ?? row.sku,
      productImage: imageKey ? getS3ObjectPreviewUrl(imageKey) : null,
      variantTitle: row.variantTitle,
    } satisfies CheckoutItemSnapshot
  })
}

async function getBuyNowCheckoutItem(input: {
  productId: string
  variantId?: string | null
  quantity?: number
}) {
  const [row] = await db
    .select({
      productId: products.id,
      slug: products.slug,
      name: products.name,
      sku: products.sku,
      basePrice: products.basePrice,
      imageKey: mediaAssets.key,
      variantId: productVariants.id,
      variantTitle: productVariants.title,
      variantSku: productVariants.sku,
      variantPrice: productVariants.price,
      variantBannerImage: productVariants.bannerImage,
    })
    .from(products)
    .leftJoin(
      productVariants,
      input.variantId
        ? eq(productVariants.id, input.variantId)
        : and(
            eq(productVariants.productId, products.id),
            eq(productVariants.isDefault, true),
            eq(productVariants.isActive, true),
          ),
    )
    .leftJoin(
      productMedia,
      and(
        eq(productMedia.productId, products.id),
        eq(productMedia.variantId, productVariants.id),
        eq(productMedia.isPrimary, true),
      ),
    )
    .leftJoin(mediaAssets, eq(mediaAssets.id, productMedia.mediaAssetId))
    .where(eq(products.id, input.productId))
    .limit(1)

  if (!row) return null

  const imageKey = row.imageKey ?? row.variantBannerImage

  return {
    productId: row.productId,
    variantId: row.variantId,
    quantity: Math.max(1, Number(input.quantity ?? 1)),
    productPrice: row.variantPrice ?? row.basePrice,
    productName: row.name,
    productSlug: row.slug,
    productSku: row.variantSku ?? row.sku,
    productImage: imageKey ? getS3ObjectPreviewUrl(imageKey) : null,
    variantTitle: row.variantTitle,
  } satisfies CheckoutItemSnapshot
}

export async function createCartPaymentOrder(input: {
  shipping: ShippingDetails
  totalAmount?: number
}) {
  const userId = await getCurrentDbUserId()

  if (!userId) {
    return { success: false, userIsNotLoggedIn: true, message: "Login required" }
  }

  const shippingResult = await resolveShippingDetails(userId, input.shipping)

  if (!shippingResult.ok) {
    return { success: false, message: shippingResult.message }
  }

  try {
    const items = await getCartCheckoutItems(userId)

    if (items.length === 0) {
      return { success: false, message: "Cart is empty" }
    }

    const totals = getTotals(items)
    const payableAmountInPaise =
      input.totalAmount != null && input.totalAmount > 0
        ? Math.round(input.totalAmount * 100)
        : totals.total
    const receipt = getOrderNumber()
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise: payableAmountInPaise,
      receipt,
    })
    const checkoutToken = signCheckoutPayload({
      userId,
      source: "cart",
      providerOrderId: razorpayOrder.id,
      amountInPaise: payableAmountInPaise,
      shipping: shippingResult.shipping,
      items,
      createdAt: Date.now(),
    })

    return {
      success: true,
      keyId: getRazorpayKeyId(),
      providerOrderId: razorpayOrder.id,
      amountInPaise: payableAmountInPaise,
      currency,
      checkoutToken,
    }
  } catch (error) {
    console.error("Create payment order failed:", error)
    return { success: false, message: "Unable to start payment" }
  }
}

export async function createBuyNowPaymentOrder(input: {
  shipping: ShippingDetails
  productId?: string
  variantId?: string | null
  quantity?: number
  totalAmount?: number
}) {
  const userId = await getCurrentDbUserId()

  if (!userId) {
    return { success: false, userIsNotLoggedIn: true, message: "Login required" }
  }

  if (!input.productId) {
    return { success: false, message: "Product id is required" }
  }

  const shippingResult = await resolveShippingDetails(userId, input.shipping)

  if (!shippingResult.ok) {
    return { success: false, message: shippingResult.message }
  }

  try {
    const item = await getBuyNowCheckoutItem({
      productId: input.productId,
      variantId: input.variantId,
      quantity: input.quantity,
    })

    if (!item) {
      return { success: false, message: "Product not found" }
    }

    const items = [item]
    const totals = getTotals(items)
    const payableAmountInPaise =
      input.totalAmount != null && input.totalAmount > 0
        ? Math.round(input.totalAmount * 100)
        : totals.total
    const receipt = getOrderNumber()
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise: payableAmountInPaise,
      receipt,
    })
    const checkoutToken = signCheckoutPayload({
      userId,
      source: "buy-now",
      providerOrderId: razorpayOrder.id,
      amountInPaise: payableAmountInPaise,
      shipping: shippingResult.shipping,
      items,
      createdAt: Date.now(),
    })

    return {
      success: true,
      keyId: getRazorpayKeyId(),
      providerOrderId: razorpayOrder.id,
      amountInPaise: payableAmountInPaise,
      currency,
      checkoutToken,
    }
  } catch (error) {
    console.error("Create buy now payment order failed:", error)
    return { success: false, message: "Unable to start payment" }
  }
}

export async function completeRazorpayPayment(input: {
  checkoutToken: string
  razorpay: RazorpaySuccessPayload
}) {
  const userId = await getCurrentDbUserId()

  if (!userId) {
    return { success: false, userIsNotLoggedIn: true, message: "Login required" }
  }

  try {
    if (!verifyRazorpaySignature(input.razorpay)) {
      return { success: false, message: "Payment verification failed" }
    }

    const checkout = readCheckoutPayload(input.checkoutToken)

    if (
      checkout.userId !== userId ||
      checkout.providerOrderId !== input.razorpay.razorpay_order_id
    ) {
      return { success: false, message: "Payment verification failed" }
    }

    const totals = getTotals(checkout.items)

    if (checkout.amountInPaise < totals.subtotal) {
      return { success: false, message: "Payment amount mismatch" }
    }

    const result = await db.transaction(async (tx) => {
      const [existingPayment] = await tx
        .select({
          id: payments.id,
          orderId: payments.orderId,
        })
        .from(payments)
        .where(eq(payments.providerPaymentId, input.razorpay.razorpay_payment_id!))
        .limit(1)

      if (existingPayment) {
        return { orderId: existingPayment.orderId }
      }

      let orderShipping = { ...checkout.shipping }

      if (checkout.shipping.addressId) {
        const [address] = await tx
          .select()
          .from(addresses)
          .where(
            and(
              eq(addresses.id, checkout.shipping.addressId),
              eq(addresses.userId, userId),
            ),
          )
          .limit(1)

        if (!address) {
          throw new Error("Selected address was not found")
        }

        orderShipping = mapAddressToShipping(address)
      } else {
        const [duplicateAddress] = await tx
          .select()
          .from(addresses)
          .where(
            and(
              eq(addresses.userId, userId),
              eq(addresses.phone, checkout.shipping.phone),
              eq(addresses.line1, checkout.shipping.addressLine1),
              eq(addresses.postalCode, checkout.shipping.postalCode),
            ),
          )
          .limit(1)

        if (!duplicateAddress) {
          const [anyAddress] = await tx
            .select()
            .from(addresses)
            .where(eq(addresses.userId, userId))
            .limit(1)

          const [newSavedAddress] = await tx
            .insert(addresses)
            .values({
              userId,
              fullName: checkout.shipping.fullName,
              phone: checkout.shipping.phone,
              line1: checkout.shipping.addressLine1,
              line2: checkout.shipping.addressLine2 || null,
              city: checkout.shipping.city,
              state: checkout.shipping.state,
              postalCode: checkout.shipping.postalCode,
              country: checkout.shipping.country || "India",
              isDefault: !anyAddress,
            })
            .returning({ id: addresses.id })

          if (newSavedAddress) {
            orderShipping.addressId = newSavedAddress.id
          }
        } else {
          orderShipping.addressId = duplicateAddress.id
        }
      }

      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber: getOrderNumber(),
          userId,
          addressId: orderShipping.addressId ?? null,
          status: "paid",
          shippingPhone: orderShipping.phone,
          addressLine1: orderShipping.addressLine1,
          addressLine2: orderShipping.addressLine2 ?? null,
          city: orderShipping.city,
          state: orderShipping.state,
          postalCode: orderShipping.postalCode,
          country: orderShipping.country ?? "India",
          totalAmount: checkout.amountInPaise,
        })
        .returning({
          id: orders.id,
          orderNumber: orders.orderNumber,
          createdAt: orders.createdAt,
          totalAmount: orders.totalAmount,
        })

      await tx.insert(orderItems).values(
        checkout.items.map((item) => ({
          orderId: order.id,
          variantId: item.variantId,
          quantity: item.quantity,
          productPrice: item.productPrice,
          productName: item.productName,
          productSlug: item.productSlug,
          productSku: item.productSku,
          productImage: item.productImage,
          variantTitle: item.variantTitle,
        })),
      )

      await tx.insert(payments).values({
        orderId: order.id,
        provider: "razorpay",
        status: "paid",
        providerOrderId: input.razorpay.razorpay_order_id,
        providerPaymentId: input.razorpay.razorpay_payment_id,
        amountInPaise: checkout.amountInPaise,
        metadata: input.razorpay,
      })

      if (checkout.source === "cart") {
        const [userCart] = await tx
          .select({ id: carts.id })
          .from(carts)
          .where(eq(carts.userId, userId))
          .limit(1)

        if (userCart) {
          await tx
            .delete(cartItems)
            .where(eq(cartItems.cartId, userCart.id))
        }
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        source: checkout.source,
        items: checkout.items,
      }
    })

    if (result.source) {
      const sessionUser = await getCurrentUser()
      const email = sessionUser?.email

      if (email) {
        const customerName =
          sessionUser?.name || email.split("@")[0] || "Customer"

        try {
          await notifyOrderConfirmationEmail({
            email,
            customerName,
            orderId: result.orderNumber,
            orderDate: formatDate(result.createdAt),
            productNames: result.items
              .map((item) => item.productName)
              .filter(Boolean)
              .join(", "),
            orderTotal: formatCurrency(result.totalAmount),
          })
        } catch (emailError) {
          console.error("Unable to send order confirmation email:", emailError)
        }

        try {
          const [orderCount] = await db
            .select({ value: count() })
            .from(orders)
            .where(eq(orders.userId, userId))

          if ((orderCount?.value ?? 0) === 1) {
            await notifyFirstOrderEmail({ email, customerName })
          }
        } catch (emailError) {
          console.error("Unable to send first order email:", emailError)
        }
      }
    }

    return { success: true, orderId: result.orderId, source: result.source }
  } catch (error) {
    console.error("Complete payment failed:", error)
    return { success: false, message: "Unable to complete payment" }
  }
}

export async function createCartPaymentOrderIcici(input: {
  shipping: ShippingDetails
  totalAmount?: number
}) {
  const userId = await getCurrentDbUserId()

  if (!userId) {
    return { success: false, userIsNotLoggedIn: true, message: "Login required" }
  }

  const shippingResult = await resolveShippingDetails(userId, input.shipping)

  if (!shippingResult.ok) {
    return { success: false, message: shippingResult.message }
  }

  try {
    const items = await getCartCheckoutItems(userId)

    if (items.length === 0) {
      return { success: false, message: "Cart is empty" }
    }

    const totals = getTotals(items)
    const payableAmountInPaise =
      input.totalAmount != null && input.totalAmount > 0
        ? Math.round(input.totalAmount * 100)
        : totals.total
    const merchantTxnNo = generateMerchantTxnNo()
    const sessionUser = await getCurrentUser()

    const iciciSale = await initiateIciciSale({
      amountInPaise: payableAmountInPaise,
      merchantTxnNo,
      customerName:
        shippingResult.shipping.fullName || sessionUser?.name || "Customer",
      customerEmail: sessionUser?.email || "customer@roopshree.com",
      customerPhone: shippingResult.shipping.phone,
    })

    if (!iciciSale.success || !iciciSale.redirectUrl) {
      return {
        success: false,
        message: iciciSale.message || "Failed to initialize ICICI payment gateway",
      }
    }

    let orderShipping = { ...shippingResult.shipping }

    if (shippingResult.shipping.addressId) {
      const [address] = await db
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.id, shippingResult.shipping.addressId),
            eq(addresses.userId, userId),
          ),
        )
        .limit(1)

      if (address) {
        orderShipping = mapAddressToShipping(address)
      }
    }

    let createdOrderId: string | null = null

    await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber: getOrderNumber(),
          userId,
          addressId: orderShipping.addressId ?? null,
          status: "pending",
          shippingPhone: orderShipping.phone,
          addressLine1: orderShipping.addressLine1,
          addressLine2: orderShipping.addressLine2 || null,
          city: orderShipping.city,
          state: orderShipping.state,
          postalCode: orderShipping.postalCode,
          country: orderShipping.country || "India",
          totalAmount: payableAmountInPaise,
        })
        .returning({ id: orders.id })

      createdOrderId = order.id

      await tx.insert(orderItems).values(
        items.map((item) => ({
          orderId: order.id,
          variantId: item.variantId,
          quantity: item.quantity,
          productPrice: item.productPrice,
          productName: item.productName,
          productSlug: item.productSlug,
          productSku: item.productSku,
          productImage: item.productImage,
          variantTitle: item.variantTitle,
        })),
      )

      await tx.insert(payments).values({
        orderId: order.id,
        provider: "icici",
        status: "pending",
        providerOrderId: merchantTxnNo,
        amountInPaise: payableAmountInPaise,
        metadata: {
          source: "cart",
          items,
          merchantTxnNo,
        },
      })
    })

    return {
      success: true,
      redirectUrl: iciciSale.redirectUrl,
      merchantTxnNo,
      orderId: createdOrderId,
    }
  } catch (error) {
    console.error("Create ICICI cart payment order failed:", error)
    return { success: false, message: "Unable to start ICICI payment" }
  }
}

export async function createBuyNowPaymentOrderIcici(input: {
  shipping: ShippingDetails
  productId?: string
  variantId?: string | null
  quantity?: number
  totalAmount?: number
}) {
  const userId = await getCurrentDbUserId()

  if (!userId) {
    return { success: false, userIsNotLoggedIn: true, message: "Login required" }
  }

  if (!input.productId) {
    return { success: false, message: "Product id is required" }
  }

  const shippingResult = await resolveShippingDetails(userId, input.shipping)

  if (!shippingResult.ok) {
    return { success: false, message: shippingResult.message }
  }

  try {
    const item = await getBuyNowCheckoutItem({
      productId: input.productId,
      variantId: input.variantId,
      quantity: input.quantity,
    })

    if (!item) {
      return { success: false, message: "Product not found" }
    }

    const items = [item]
    const totals = getTotals(items)
    const payableAmountInPaise =
      input.totalAmount != null && input.totalAmount > 0
        ? Math.round(input.totalAmount * 100)
        : totals.total
    const merchantTxnNo = generateMerchantTxnNo()
    const sessionUser = await getCurrentUser()

    const iciciSale = await initiateIciciSale({
      amountInPaise: payableAmountInPaise,
      merchantTxnNo,
      customerName:
        shippingResult.shipping.fullName || sessionUser?.name || "Customer",
      customerEmail: sessionUser?.email || "customer@roopshree.com",
      customerPhone: shippingResult.shipping.phone,
    })

    if (!iciciSale.success || !iciciSale.redirectUrl) {
      return {
        success: false,
        message: iciciSale.message || "Failed to initialize ICICI payment gateway",
      }
    }

    let orderShipping = { ...shippingResult.shipping }

    if (shippingResult.shipping.addressId) {
      const [address] = await db
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.id, shippingResult.shipping.addressId),
            eq(addresses.userId, userId),
          ),
        )
        .limit(1)

      if (address) {
        orderShipping = mapAddressToShipping(address)
      }
    }

    let createdOrderId: string | null = null

    await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber: getOrderNumber(),
          userId,
          addressId: orderShipping.addressId ?? null,
          status: "pending",
          shippingPhone: orderShipping.phone,
          addressLine1: orderShipping.addressLine1,
          addressLine2: orderShipping.addressLine2 || null,
          city: orderShipping.city,
          state: orderShipping.state,
          postalCode: orderShipping.postalCode,
          country: orderShipping.country || "India",
          totalAmount: payableAmountInPaise,
        })
        .returning({ id: orders.id })

      createdOrderId = order.id

      await tx.insert(orderItems).values(
        items.map((i) => ({
          orderId: order.id,
          variantId: i.variantId,
          quantity: i.quantity,
          productPrice: i.productPrice,
          productName: i.productName,
          productSlug: i.productSlug,
          productSku: i.productSku,
          productImage: i.productImage,
          variantTitle: i.variantTitle,
        })),
      )

      await tx.insert(payments).values({
        orderId: order.id,
        provider: "icici",
        status: "pending",
        providerOrderId: merchantTxnNo,
        amountInPaise: payableAmountInPaise,
        metadata: {
          source: "buy-now",
          items,
          merchantTxnNo,
        },
      })
    })

    return {
      success: true,
      redirectUrl: iciciSale.redirectUrl,
      merchantTxnNo,
      orderId: createdOrderId,
    }
  } catch (error) {
    console.error("Create ICICI buy-now payment order failed:", error)
    return { success: false, message: "Unable to start ICICI payment" }
  }
}

export async function finalizeIciciPaymentOrder({
  merchantTxnNo,
  bankRefNo,
  status,
  rawResponse,
  paidAmountInPaise,
}: {
  merchantTxnNo: string
  bankRefNo?: string
  status: "paid" | "failed"
  rawResponse?: Record<string, unknown>
  paidAmountInPaise?: number
}) {
  try {
    const [existingPayment] = await db
      .select({
        id: payments.id,
        orderId: payments.orderId,
        status: payments.status,
        metadata: payments.metadata,
        amountInPaise: payments.amountInPaise,
      })
      .from(payments)
      .where(eq(payments.providerOrderId, merchantTxnNo))
      .limit(1)

    if (!existingPayment) {
      return { success: false, message: "Payment transaction not found" }
    }

    if (existingPayment.status === "paid") {
      return { success: true, orderId: existingPayment.orderId }
    }

    if (status === "failed") {
      await db.transaction(async (tx) => {
        await tx
          .update(payments)
          .set({
            status: "failed",
            metadata: {
              ...(typeof existingPayment.metadata === "object"
                ? (existingPayment.metadata as Record<string, unknown>)
                : {}),
              failureResponse: rawResponse,
            },
            updatedAt: new Date(),
          })
          .where(eq(payments.id, existingPayment.id))

        await tx
          .update(orders)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, existingPayment.orderId))
      })

      return {
        success: false,
        orderId: existingPayment.orderId,
        message: "Payment failed or was cancelled",
      }
    }

    // Amount Verification: Verify paid amount matches the order payment record
    if (paidAmountInPaise !== undefined && paidAmountInPaise !== null) {
      if (paidAmountInPaise !== existingPayment.amountInPaise) {
        console.error(
          `[ICICI Payment Security Alert] Amount mismatch! Expected: ${existingPayment.amountInPaise} paise, but received: ${paidAmountInPaise} paise. MerchantTxnNo: ${merchantTxnNo}`,
        )
        await db.transaction(async (tx) => {
          await tx
            .update(payments)
            .set({
              status: "failed",
              metadata: {
                ...(typeof existingPayment.metadata === "object"
                  ? (existingPayment.metadata as Record<string, unknown>)
                  : {}),
                failureReason: "AMOUNT_MISMATCH",
                expectedAmountInPaise: existingPayment.amountInPaise,
                receivedAmountInPaise: paidAmountInPaise,
                failureResponse: rawResponse,
              },
              updatedAt: new Date(),
            })
            .where(eq(payments.id, existingPayment.id))

          await tx
            .update(orders)
            .set({
              status: "cancelled",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, existingPayment.orderId))
        })

        return {
          success: false,
          orderId: existingPayment.orderId,
          message: "Payment amount mismatch detected. Order cancelled.",
        }
      }
    }

    // Success path
    const orderDetails = await db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({
          status: "paid",
          providerPaymentId: bankRefNo || merchantTxnNo,
          metadata: {
            ...(typeof existingPayment.metadata === "object"
              ? (existingPayment.metadata as Record<string, unknown>)
              : {}),
            successResponse: rawResponse,
          },
          updatedAt: new Date(),
        })
        .where(eq(payments.id, existingPayment.id))

      const [order] = await tx
        .update(orders)
        .set({
          status: "paid",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, existingPayment.orderId))
        .returning({
          id: orders.id,
          orderNumber: orders.orderNumber,
          userId: orders.userId,
          createdAt: orders.createdAt,
          totalAmount: orders.totalAmount,
        })

      const items = await tx
        .select({
          productName: orderItems.productName,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, existingPayment.orderId))

      const metadataObj =
        typeof existingPayment.metadata === "object"
          ? (existingPayment.metadata as Record<string, unknown>)
          : null
      const isCartSource = metadataObj?.source === "cart"

      if (isCartSource && order.userId) {
        const [userCart] = await tx
          .select({ id: carts.id })
          .from(carts)
          .where(eq(carts.userId, order.userId))
          .limit(1)

        if (userCart) {
          await tx
            .delete(cartItems)
            .where(eq(cartItems.cartId, userCart.id))
        }
      }

      return {
        order,
        items,
      }
    })

    let customerEmail: string | undefined
    let customerName = "Customer"

    if (orderDetails.order.userId) {
      try {
        const [customer] = await db
          .select({
            email: users.email,
            name: users.name,
          })
          .from(users)
          .where(eq(users.id, orderDetails.order.userId))
          .limit(1)

        if (customer?.email) {
          customerEmail = customer.email
          customerName = customer.name || "Customer"
        }
      } catch (e) {
        console.error("Error fetching customer for order confirmation:", e)
      }
    }

    if (!customerEmail) {
      try {
        const sessionUser = await getCurrentUser()
        if (sessionUser?.email) {
          customerEmail = sessionUser.email
          customerName = sessionUser.name || sessionUser.email.split("@")[0] || "Customer"
        }
      } catch {}
    }

    if (!customerEmail && rawResponse) {
      customerEmail = (rawResponse.customerEmailID || rawResponse.email || rawResponse.customerEmail) as string | undefined
    }

    if (customerEmail) {
      try {
        await notifyOrderConfirmationEmail({
          email: customerEmail,
          customerName,
          orderId: orderDetails.order.orderNumber,
          orderDate: formatDate(orderDetails.order.createdAt),
          productNames: orderDetails.items
            .map((item) => item.productName)
            .filter(Boolean)
            .join(", "),
          orderTotal: formatCurrency(orderDetails.order.totalAmount),
        })
        console.log(`[Order Confirmation] Email successfully dispatched to ${customerEmail}`)

        if (orderDetails.order.userId) {
          const [orderCount] = await db
            .select({ value: count() })
            .from(orders)
            .where(eq(orders.userId, orderDetails.order.userId))

          if ((orderCount?.value ?? 0) === 1) {
            await notifyFirstOrderEmail({
              email: customerEmail,
              customerName,
            })
          }
        }
      } catch (emailErr) {
        console.error("Unable to send ICICI confirmation email:", emailErr)
      }
    }

    return {
      success: true,
      orderId: orderDetails.order.id,
    }
  } catch (error) {
    console.error("finalizeIciciPaymentOrder error:", error)
    return {
      success: false,
      message: "Unable to finalize ICICI payment order",
    }
  }
}

export async function cancelPendingOrderAction({
  orderId,
  merchantTxnNo,
}: {
  orderId?: string
  merchantTxnNo?: string
}) {
  try {
    const userId = await getCurrentDbUserId()

    let targetOrderId = orderId

    if (!targetOrderId && merchantTxnNo) {
      const [paymentRecord] = await db
        .select({ orderId: payments.orderId })
        .from(payments)
        .where(
          or(
            eq(payments.providerOrderId, merchantTxnNo),
            eq(payments.providerPaymentId, merchantTxnNo),
          ),
        )
        .limit(1)

      if (paymentRecord?.orderId) {
        targetOrderId = paymentRecord.orderId
      }
    }

    if (!targetOrderId) {
      return { success: false, message: "Order not found" }
    }

    const isOrderNumber = targetOrderId.startsWith("RS-")
    const orderCondition = isOrderNumber
      ? eq(orders.orderNumber, targetOrderId)
      : eq(orders.id, targetOrderId)

    const whereConditions = [orderCondition]
    if (userId) {
      whereConditions.push(eq(orders.userId, userId))
    }

    const [existingOrder] = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(and(...whereConditions))
      .limit(1)

    if (!existingOrder) {
      return { success: false, message: "Order not found" }
    }

    if (existingOrder.status === "pending") {
      await db.transaction(async (tx) => {
        await tx
          .update(orders)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(orders.id, existingOrder.id))

        await tx
          .update(payments)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(payments.orderId, existingOrder.id))
      })
    }

    return { success: true }
  } catch (error) {
    console.error("cancelPendingOrderAction error:", error)
    return { success: false, message: "Unable to cancel pending order" }
  }
}

export async function getPendingOrderSummaryAction(orderId?: string) {
  try {
    const userId = await getCurrentDbUserId()

    // 1. If an explicit orderId is provided (e.g. from client session):
    if (orderId) {
      const isOrderNumber = orderId.startsWith("RS-")
      const orderMatchCondition = isOrderNumber
        ? eq(orders.orderNumber, orderId)
        : eq(orders.id, orderId)

      const [order] = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          totalAmount: orders.totalAmount,
          createdAt: orders.createdAt,
          status: orders.status,
          userId: orders.userId,
        })
        .from(orders)
        .where(orderMatchCondition)
        .limit(1)

      if (!order) return { hasPending: false }

      // If user is logged in, verify order ownership if userId exists on order
      if (userId && order.userId && order.userId !== userId) {
        return { hasPending: false }
      }

      // If the order status is NOT "pending" (i.e. cancelled or paid), banner must NOT show!
      if (order.status !== "pending") {
        return { hasPending: false }
      }

      // If order is older than 30 minutes, it's considered expired
      const ageMs = Date.now() - new Date(order.createdAt).getTime()
      if (ageMs > 30 * 60 * 1000) {
        return { hasPending: false }
      }

      return {
        hasPending: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
        },
      }
    }

    // 2. Otherwise, check the user's MOST RECENT order
    if (!userId) return { hasPending: false }

    const [latestOrder] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        status: orders.status,
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(1)

    if (!latestOrder) {
      return { hasPending: false }
    }

    // Crucial: Only show if the latest order is strictly "pending"!
    // If the latest order is cancelled, failed, or paid, no pending banner should show.
    if (latestOrder.status !== "pending") {
      return { hasPending: false }
    }

    // Must be within last 30 minutes
    const ageMs = Date.now() - new Date(latestOrder.createdAt).getTime()
    if (ageMs > 30 * 60 * 1000) {
      return { hasPending: false }
    }

    return {
      hasPending: true,
      order: {
        id: latestOrder.id,
        orderNumber: latestOrder.orderNumber,
        totalAmount: latestOrder.totalAmount,
      },
    }
  } catch (error) {
    console.error("getPendingOrderSummaryAction error:", error)
    return { hasPending: false }
  }
}

export async function getOrderStatusForVerificationAction(orderId: string) {
  try {
    const [orderRecord] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    if (!orderRecord) {
      return { success: false, message: "Order not found" }
    }

    const [paymentRecord] = await db
      .select({
        status: payments.status,
        providerPaymentId: payments.providerPaymentId,
      })
      .from(payments)
      .where(eq(payments.orderId, orderRecord.id))
      .limit(1)

    return {
      success: true,
      orderStatus: orderRecord.status,
      paymentStatus: paymentRecord?.status || "pending",
      orderNumber: orderRecord.orderNumber,
    }
  } catch (error) {
    console.error("getOrderStatusForVerificationAction error:", error)
    return { success: false, message: "Error fetching order status" }
  }
}




