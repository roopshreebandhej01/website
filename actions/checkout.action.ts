"use server"

import crypto from "node:crypto"

import { and, eq } from "drizzle-orm"

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
import { getPaiseOrderSummary } from "@/lib/checkout-pricing"
import {
  fetchRazorpayPayment,
  getRazorpayKeyId,
  getRazorpaySecret,
  isCapturedRazorpayPayment,
} from "@/lib/razorpay"

type ShippingDetails = {
  addressId?: string
  fullName: string
  phone: string
  secondPhone?: string
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
  orderId?: string
  userId: string
  source: "cart" | "buy-now"
  providerOrderId: string
  amountInPaise: number
  shipping: ShippingDetails
  items: CheckoutItemSnapshot[]
  createdAt: number
}

type PendingCheckoutOrderPayload = Omit<CheckoutTokenPayload, "providerOrderId">

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

class CheckoutActionError extends Error {}

function getCheckoutSigningSecret() {
  return process.env.CHECKOUT_TOKEN_SECRET ?? getRazorpaySecret()
}

function normalizeShippingDetails(input: ShippingDetails): ShippingDetails {
  return {
    addressId: input.addressId?.trim() || undefined,
    fullName: input.fullName?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    secondPhone: input.secondPhone?.trim() || undefined,
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
  secondPhone?: string,
): ShippingDetails {
  return {
    addressId: address.id,
    fullName: address.fullName,
    phone: address.phone,
    secondPhone,
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
  const secondPhoneError = getSecondPhoneValidationError(shipping.secondPhone)

  if (secondPhoneError) {
    return {
      ok: false as const,
      message: secondPhoneError,
    }
  }

  if (shipping.addressId) {
    const address = await findUserAddress(userId, shipping.addressId)

    if (!address) {
      return { ok: false as const, message: "Selected address was not found" }
    }

    return {
      ok: true as const,
      shipping: {
        ...mapAddressToShipping(address, shipping.secondPhone),
        email: shipping.email,
      },
    }
  }

  return validateManualShippingDetails(shipping)
}

function getSecondPhoneValidationError(secondPhone?: string) {
  const phone2Digits = secondPhone?.replace(/[^\d]/g, '') ?? ''

  if (phone2Digits && phone2Digits.length !== 10) {
    return "Alternate phone number must be exactly 10 digits"
  }

  return null
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
  return getPaiseOrderSummary(
    items.map((item) => ({
      price: item.productPrice,
      quantity: item.quantity,
    })),
  )
}

function assertTimingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  )
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

  if (!assertTimingSafeEqual(signature, expectedSignature)) {
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

  return assertTimingSafeEqual(payload.razorpay_signature, expectedSignature)
}

function assertCheckoutItemAvailable({
  productName,
  productStatus,
  variantId,
  variantIsActive,
  stockQuantity,
  quantity,
}: {
  productName: string
  productStatus: string
  variantId: string | null
  variantIsActive: boolean | null
  stockQuantity: number | null
  quantity: number
}) {
  if (productStatus !== "active") {
    throw new CheckoutActionError(`${productName} is not available`)
  }

  if (!variantId || !variantIsActive) {
    throw new CheckoutActionError(`${productName} variant is not available`)
  }

  if ((stockQuantity ?? 0) < quantity) {
    throw new CheckoutActionError(`${productName} does not have enough stock`)
  }
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
      productStatus: products.status,
      imageKey: mediaAssets.key,
      variantId: productVariants.id,
      variantTitle: productVariants.title,
      variantSku: productVariants.sku,
      variantPrice: productVariants.price,
      variantIsActive: productVariants.isActive,
      stockQuantity: productVariants.stockQuantity,
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
    assertCheckoutItemAvailable({
      productName: row.name,
      productStatus: row.productStatus,
      variantId: row.variantId,
      variantIsActive: row.variantIsActive,
      stockQuantity: row.stockQuantity,
      quantity: row.quantity,
    })

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
      productStatus: products.status,
      imageKey: mediaAssets.key,
      variantId: productVariants.id,
      variantTitle: productVariants.title,
      variantSku: productVariants.sku,
      variantPrice: productVariants.price,
      variantIsActive: productVariants.isActive,
      stockQuantity: productVariants.stockQuantity,
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

  const quantity = Math.max(1, Number(input.quantity ?? 1))

  assertCheckoutItemAvailable({
    productName: row.name,
    productStatus: row.productStatus,
    variantId: row.variantId,
    variantIsActive: row.variantIsActive,
    stockQuantity: row.stockQuantity,
    quantity,
  })

  const imageKey = row.imageKey ?? row.variantBannerImage

  return {
    productId: row.productId,
    variantId: row.variantId,
    quantity,
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

async function resolveGuestUserId(
  email: string,
  fullName: string,
  phone?: string,
  secondPhone?: string,
) {
  const normalizedEmail = email.trim().toLowerCase()
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)

  if (existing) {
    if (secondPhone && secondPhone !== existing.secondPhone) {
      await db
        .update(users)
        .set({
          secondPhone: formatE164Phone(secondPhone),
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
    }
    return existing.id
  }

  const [newUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: fullName.trim(),
      phone: phone ? formatE164Phone(phone) : null,
      secondPhone: secondPhone ? formatE164Phone(secondPhone) : null,
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
        productStatus: products.status,
        imageKey: mediaAssets.key,
        variantId: productVariants.id,
        variantTitle: productVariants.title,
        variantSku: productVariants.sku,
        variantPrice: productVariants.price,
        variantIsActive: productVariants.isActive,
        stockQuantity: productVariants.stockQuantity,
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

    if (!row) {
      throw new CheckoutActionError("An item in your cart is no longer available")
    }

    assertCheckoutItemAvailable({
      productName: row.name,
      productStatus: row.productStatus,
      variantId: row.variantId,
      variantIsActive: row.variantIsActive,
      stockQuantity: row.stockQuantity,
      quantity: qty,
    })

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

async function createPendingCheckoutOrder(checkout: PendingCheckoutOrderPayload) {
  return db.transaction(async (tx) => {
    let orderShipping = { ...checkout.shipping }

    if (checkout.shipping.addressId) {
      const [address] = await tx
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.id, checkout.shipping.addressId),
            eq(addresses.userId, checkout.userId),
          ),
        )
        .limit(1)

      if (!address) {
        throw new Error("Selected address was not found")
      }

      orderShipping = mapAddressToShipping(address, checkout.shipping.secondPhone)
    } else {
      const [duplicateAddress] = await tx
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.userId, checkout.userId),
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
          .where(eq(addresses.userId, checkout.userId))
          .limit(1)

        const [newSavedAddress] = await tx
          .insert(addresses)
          .values({
            userId: checkout.userId,
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

    if (orderShipping.secondPhone) {
      await tx
        .update(users)
        .set({
          secondPhone: orderShipping.secondPhone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, checkout.userId))
    }

    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: getOrderNumber(),
        userId: checkout.userId,
        addressId: orderShipping.addressId ?? null,
        status: "pending",
        shippingPhone: orderShipping.phone,
        shippingPhone2: orderShipping.secondPhone || null,
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

    return { orderId: order.id, orderNumber: order.orderNumber }
  })
}

async function createPendingCheckoutPayment({
  orderId,
  checkout,
  clearDbCartUserId,
}: {
  orderId: string
  checkout: CheckoutTokenPayload
  clearDbCartUserId?: string | null
}) {
  await db.insert(payments).values({
    orderId,
    provider: "razorpay",
    status: "pending",
    providerOrderId: checkout.providerOrderId,
    amountInPaise: checkout.amountInPaise,
    metadata: {
      source: checkout.source,
      checkoutCreatedAt: checkout.createdAt,
      checkoutUserId: checkout.userId,
      clearDbCartUserId: clearDbCartUserId ?? null,
    },
  })
}

async function findCheckoutPayment(providerOrderId: string) {
  const [payment] = await db
    .select({
      orderId: payments.orderId,
      status: payments.status,
      amountInPaise: payments.amountInPaise,
      orderTotalAmount: orders.totalAmount,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(eq(payments.providerOrderId, providerOrderId))
    .limit(1)

  return payment ?? null
}

async function waitForWebhookPaymentStatus(providerOrderId: string) {
  const deadline = Date.now() + 5000

  while (Date.now() < deadline) {
    const payment = await findCheckoutPayment(providerOrderId)

    if (payment?.status === "paid" || payment?.status === "failed") {
      return payment.status
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return null
}

export async function createCartPaymentOrder(input: {
  shipping: ShippingDetails
  guestItems?: GuestCartItem[]
}) {
  const inputShipping = normalizeShippingDetails(input.shipping)
  const secondPhoneError = getSecondPhoneValidationError(inputShipping.secondPhone)

  if (secondPhoneError) {
    return { success: false, message: secondPhoneError }
  }

  const sessionUserId = await getCurrentDbUserId()
  let userId = sessionUserId

  if (!userId) {
    if (!inputShipping.email) {
      return { success: false, userIsNotLoggedIn: true, message: "Login required" }
    }
    try {
      userId = await resolveGuestUserId(
        inputShipping.email,
        inputShipping.fullName,
        inputShipping.phone,
        inputShipping.secondPhone,
      )
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : "Guest checkout failed" }
    }
  }

  const shippingResult = await resolveShippingDetails(userId, inputShipping)

  if (!shippingResult.ok) {
    return { success: false, message: shippingResult.message }
  }

  try {
    // Logged-in users: read cart from DB. Guests: use items sent from the frontend (prices always re-fetched from DB).
    const isGuest = !sessionUserId
    const items = isGuest && input.guestItems?.length
      ? await getGuestCheckoutItems(input.guestItems)
      : await getCartCheckoutItems(userId)

    if (items.length === 0) {
      return { success: false, message: "Cart is empty" }
    }

    const totals = getTotals(items)
    const pendingCheckoutPayload = {
      userId,
      source: "cart",
      amountInPaise: totals.total,
      shipping: shippingResult.shipping,
      items,
      createdAt: Date.now(),
    } satisfies PendingCheckoutOrderPayload
    const pendingOrder = await createPendingCheckoutOrder(pendingCheckoutPayload)
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise: totals.total,
      receipt: pendingOrder.orderNumber,
    })
    const checkoutPayload = {
      ...pendingCheckoutPayload,
      providerOrderId: razorpayOrder.id,
    } satisfies CheckoutTokenPayload
    await createPendingCheckoutPayment({
      orderId: pendingOrder.orderId,
      checkout: checkoutPayload,
      clearDbCartUserId: sessionUserId,
    })
    const checkoutToken = signCheckoutPayload({
      ...checkoutPayload,
      orderId: pendingOrder.orderId,
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
    return {
      success: false,
      message:
        error instanceof CheckoutActionError
          ? error.message
          : "Unable to start payment",
    }
  }
}

export async function createBuyNowPaymentOrder(input: {
  shipping: ShippingDetails
  productId?: string
  variantId?: string | null
  quantity?: number
}) {
  const inputShipping = normalizeShippingDetails(input.shipping)
  const secondPhoneError = getSecondPhoneValidationError(inputShipping.secondPhone)

  if (secondPhoneError) {
    return { success: false, message: secondPhoneError }
  }

  const sessionUserId = await getCurrentDbUserId()
  let userId = sessionUserId

  if (!userId) {
    if (!inputShipping.email) {
      return { success: false, userIsNotLoggedIn: true, message: "Login required" }
    }
    try {
      userId = await resolveGuestUserId(
        inputShipping.email,
        inputShipping.fullName,
        inputShipping.phone,
        inputShipping.secondPhone,
      )
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : "Guest checkout failed" }
    }
  }

  if (!input.productId) {
    return { success: false, message: "Product id is required" }
  }

  const shippingResult = await resolveShippingDetails(userId, inputShipping)

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
    const pendingCheckoutPayload = {
      userId,
      source: "buy-now",
      amountInPaise: totals.total,
      shipping: shippingResult.shipping,
      items,
      createdAt: Date.now(),
    } satisfies PendingCheckoutOrderPayload
    const pendingOrder = await createPendingCheckoutOrder(pendingCheckoutPayload)
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise: totals.total,
      receipt: pendingOrder.orderNumber,
    })
    const checkoutPayload = {
      ...pendingCheckoutPayload,
      providerOrderId: razorpayOrder.id,
    } satisfies CheckoutTokenPayload
    await createPendingCheckoutPayment({
      orderId: pendingOrder.orderId,
      checkout: checkoutPayload,
      clearDbCartUserId: null,
    })
    const checkoutToken = signCheckoutPayload({
      ...checkoutPayload,
      orderId: pendingOrder.orderId,
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
    return {
      success: false,
      message:
        error instanceof CheckoutActionError
          ? error.message
          : "Unable to start payment",
    }
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

    if (
      !checkout.orderId ||
      (sessionUserId && checkout.userId !== sessionUserId) ||
      checkout.providerOrderId !== input.razorpay.razorpay_order_id
    ) {
      return { success: false, message: "Payment verification failed" }
    }

    const totals = getTotals(checkout.items)

    if (totals.total !== checkout.amountInPaise) {
      return { success: false, message: "Payment amount mismatch" }
    }

    const payment = await findCheckoutPayment(checkout.providerOrderId)

    if (
      !payment ||
      payment.orderId !== checkout.orderId ||
      payment.amountInPaise !== checkout.amountInPaise ||
      payment.orderTotalAmount !== checkout.amountInPaise
    ) {
      return { success: false, message: "Payment verification failed" }
    }

    const razorpayPayment = await fetchRazorpayPayment(
      input.razorpay.razorpay_payment_id!,
    )

    if (
      !isCapturedRazorpayPayment(razorpayPayment) ||
      razorpayPayment.order_id !== checkout.providerOrderId ||
      razorpayPayment.amount !== checkout.amountInPaise ||
      razorpayPayment.currency !== currency
    ) {
      return { success: false, message: "Payment verification failed" }
    }

    const finalizedStatus =
      payment.status === "paid"
        ? "paid"
        : await waitForWebhookPaymentStatus(checkout.providerOrderId)

    return {
      success: true,
      orderId: checkout.orderId,
      source: checkout.source,
      paymentFinalized: finalizedStatus === "paid",
    }
  } catch (error) {
    console.error("Complete payment failed:", error)
    return { success: false, message: "Unable to complete payment" }
  }
}
