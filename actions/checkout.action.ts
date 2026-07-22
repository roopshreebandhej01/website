"use server"

import crypto from "node:crypto"

import { and, count, eq, sql } from "drizzle-orm"

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
import {
  notifyFirstOrderEmail,
  notifyOrderConfirmationEmail,
} from "@/lib/email-notifications"
import { getS3ObjectPreviewUrl } from "@/lib/s3"

type ShippingDetails = {
  addressId?: string
  fullName: string
  phone: string
  email?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country?: string
}

type GuestCartItem = {
  productId: string
  variantId?: string | null
  quantity: number
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
    email: input.email?.trim() || undefined,
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

function getTotals(items: CheckoutItemSnapshot[]) {
  const subtotal = items.reduce(
    (total, item) => total + item.productPrice * item.quantity,
    0,
  )
  const shipping = 0
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
      productImage: imageKey || null,
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
    productImage: imageKey || null,
    variantTitle: row.variantTitle,
  } satisfies CheckoutItemSnapshot
}

function formatE164Phone(phone: string) {
  let digits = phone.replace(/[^\d]/g, '')

  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  const withoutCountryCode =
    digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits

  if (withoutCountryCode.length === 10) {
    return `+91${withoutCountryCode}`
  }
  return phone
}

async function resolveGuestUserId(email: string, fullName: string, phone?: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)

  if (existing[0]) {
    if (existing[0].cognitoSub) {
      throw new Error("This email is registered. Please sign in to complete your checkout.")
    }
    return existing[0].id
  }

  const [newUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: fullName.trim(),
      phone: phone ? formatE164Phone(phone) : null,
      cognitoSub: null,
      emailVerified: false,
    })
    .returning()

  return newUser.id
}

async function getGuestCheckoutItems(guestItems: GuestCartItem[]) {
  const results: CheckoutItemSnapshot[] = []

  for (const guestItem of guestItems) {
    const qty = Math.max(1, guestItem.quantity)

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
        guestItem.variantId
          ? eq(productVariants.id, guestItem.variantId)
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
      .where(eq(products.id, guestItem.productId))
      .limit(1)

    if (!row) continue

    const imageKey = row.imageKey ?? row.variantBannerImage

    results.push({
      productId: row.productId,
      variantId: row.variantId,
      quantity: qty,
      productPrice: row.variantPrice ?? row.basePrice,
      productName: row.name,
      productSlug: row.slug,
      productSku: row.variantSku ?? row.sku,
      productImage: imageKey || null,
      variantTitle: row.variantTitle,
    })
  }

  return results
}

export async function createCartPaymentOrder(input: {
  shipping: ShippingDetails
  guestItems?: GuestCartItem[]
}) {
  let userId = await getCurrentDbUserId()

  if (!userId) {
    if (!input.shipping.email) {
      return { success: false, userIsNotLoggedIn: true, message: "Login required" }
    }
    try {
      userId = await resolveGuestUserId(input.shipping.email, input.shipping.fullName, input.shipping.phone)
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : "Guest checkout failed" }
    }
  }

  const shippingResult = await resolveShippingDetails(userId, input.shipping)

  if (!shippingResult.ok) {
    return { success: false, message: shippingResult.message }
  }

  try {
    // Logged-in users: read cart from DB. Guests: use items sent from the frontend (prices always re-fetched from DB).
    const isGuest = !await getCurrentDbUserId()
    const items = isGuest && input.guestItems?.length
      ? await getGuestCheckoutItems(input.guestItems)
      : await getCartCheckoutItems(userId)

    if (items.length === 0) {
      return { success: false, message: "Cart is empty" }
    }

    const totals = getTotals(items)
    const receipt = getOrderNumber()
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise: totals.total,
      receipt,
    })
    const checkoutToken = signCheckoutPayload({
      userId,
      source: "cart",
      providerOrderId: razorpayOrder.id,
      amountInPaise: totals.total,
      shipping: shippingResult.shipping,
      items,
      createdAt: Date.now(),
    })

    return {
      success: true,
      keyId: getRazorpayKeyId(),
      providerOrderId: razorpayOrder.id,
      amountInPaise: totals.total,
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
}) {
  let userId = await getCurrentDbUserId()

  if (!userId) {
    if (!input.shipping.email) {
      return { success: false, userIsNotLoggedIn: true, message: "Login required" }
    }
    try {
      userId = await resolveGuestUserId(input.shipping.email, input.shipping.fullName, input.shipping.phone)
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : "Guest checkout failed" }
    }
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
    const receipt = getOrderNumber()
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise: totals.total,
      receipt,
    })
    const checkoutToken = signCheckoutPayload({
      userId,
      source: "buy-now",
      providerOrderId: razorpayOrder.id,
      amountInPaise: totals.total,
      shipping: shippingResult.shipping,
      items,
      createdAt: Date.now(),
    })

    return {
      success: true,
      keyId: getRazorpayKeyId(),
      providerOrderId: razorpayOrder.id,
      amountInPaise: totals.total,
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
  try {
    if (!verifyRazorpaySignature(input.razorpay)) {
      return { success: false, message: "Payment verification failed" }
    }

    const checkout = readCheckoutPayload(input.checkoutToken)
    const sessionUserId = await getCurrentDbUserId()
    const userId = sessionUserId || checkout.userId

    if (
      checkout.userId !== userId ||
      checkout.providerOrderId !== input.razorpay.razorpay_order_id
    ) {
      return { success: false, message: "Payment verification failed" }
    }

    const totals = getTotals(checkout.items)

    if (totals.total !== checkout.amountInPaise) {
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
        await tx.execute(
          sql`
            DELETE FROM ${cartItems}
            USING ${carts}
            WHERE ${cartItems.cartId} = ${carts.id}
            AND ${carts.userId} = ${userId}
          `,
        )
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
      const email = sessionUser?.email || checkout.shipping.email

      if (email) {
        const customerName =
          sessionUser?.name || checkout.shipping.fullName || email.split("@")[0] || "Customer"

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
