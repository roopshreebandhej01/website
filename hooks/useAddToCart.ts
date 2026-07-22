"use client"

import { useRouter } from "next/navigation"

import {
  getUserCartItems,
  setUserCartItemQuantity,
} from "@/actions/cart.action"
import { useToast } from "@/components/common/ToastProvider"
import { useCartStore } from "@/store/cartStore"
import type { CartItem, CartItemInput } from "@/store/cartTypes"

const syncVersions = new Map<string, number>()
let activeSyncCount = 0
let localCartVersion = 0

function getCartItemKey(item: CartItem | CartItemInput) {
  const variantId = getVariantIdentity(item)

  if (variantId) {
    return `${item.dbProductId ?? item.productId}:${variantId}`
  }

  const attributes = getNormalizedAttributes(item.attributes)

  return `${item.dbProductId ?? item.productId}:${item.variantId ?? "default"}:${JSON.stringify(attributes)}`
}

function getVariantIdentity(item: { productId: string; variantId?: string | null }) {
  if (item.variantId) return item.variantId

  const variantId = item.productId.includes(":")
    ? item.productId.slice(item.productId.lastIndexOf(":") + 1)
    : null

  return variantId && variantId !== "default" ? variantId : null
}

function getNormalizedAttributes(attributes?: CartItem["attributes"]) {
  return (attributes ?? [])
    .slice()
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

export function useAddToCart() {
  const router = useRouter()
  const addItemOptimistic = useCartStore((state) => state.addItem)
  const removeItem = useCartStore((state) => state.removeItem)
  const increaseOptimistic = useCartStore((state) => state.increase)
  const decreaseOptimistic = useCartStore((state) => state.decrease)
  const setCart = useCartStore((state) => state.setCart)
  const { showToast } = useToast()

  function redirectToAuth() {
    router.push("/auth")
  }

  function getQuantityLimit(item: CartItem | CartItemInput) {
    return Math.max(0, item.stockQuantity ?? 10)
  }

  function showQuantityLimitToast(item: CartItem | CartItemInput) {
    const limit = getQuantityLimit(item)

    if (limit <= 0) {
      showToast({ title: "This item is out of stock", tone: "error" })
      return
    }

    showToast({
      title: `Only ${limit} item${limit === 1 ? "" : "s"} available`,
      tone: "info",
    })
  }

  async function syncCartFromDb(options?: { force?: boolean }) {
    const syncStartedAtVersion = localCartVersion
    const updatedCart = await getUserCartItems()

    if (updatedCart.success) {
      if (
        !options?.force &&
        (syncStartedAtVersion !== localCartVersion || activeSyncCount > 0)
      ) {
        return
      }

      setCart(updatedCart.items)
    }
  }

  async function syncItem(item: CartItem | CartItemInput) {
    if (!item.dbProductId) {
      // Guest item with no DB product ID — Zustand-only, no sync needed
      return true
    }

    const key = getCartItemKey(item)
    const nextVersion = (syncVersions.get(key) ?? 0) + 1
    const quantity = useCartStore
      .getState()
      .getItemQuantity(item.productId, item.attributes, item.variantId)
    const variantId = getVariantIdentity(item)

    syncVersions.set(key, nextVersion)

    try {
      activeSyncCount += 1

      const result = await setUserCartItemQuantity({
        productId: item.dbProductId,
        variantId: variantId ?? undefined,
        quantity,
      })

      if (syncVersions.get(key) !== nextVersion) {
        return true
      }

      if (result.userIsNotLoggedIn) {
        // Guest user — DB sync is skipped, Zustand update is kept
        return true
      }

      if (!result.success) {
        console.error(result.message ?? "Cart sync failed")
        showToast({
          title: result.message ?? "Unable to update cart",
          tone: "error",
        })
        await syncCartFromDb({ force: true })
        return false
      }

      await syncCartFromDb()
      return true
    } catch (error) {
      console.error(error)
      showToast({ title: "Unable to update cart", tone: "error" })

      if (syncVersions.get(key) === nextVersion) {
        await syncCartFromDb({ force: true })
        return false
      }

      return true
    } finally {
      activeSyncCount = Math.max(0, activeSyncCount - 1)
    }
  }

  async function handleAddToCart(product: CartItemInput) {
    const previousItems = useCartStore.getState().items

    const previousQuantity = useCartStore
      .getState()
      .getItemQuantity(product.productId, product.attributes, product.variantId)

    addItemOptimistic(product)
    localCartVersion += 1
    const nextQuantity = useCartStore
      .getState()
      .getItemQuantity(product.productId, product.attributes, product.variantId)

    if (nextQuantity === previousQuantity) {
      showQuantityLimitToast(product)
    }

    if (!(await syncItem(product))) {
      setCart(previousItems)
      return false
    }

    return true
  }

  async function handleIncreaseCartItem(item: CartItem | CartItemInput) {
    const previousItems = useCartStore.getState().items

    const previousQuantity = useCartStore
      .getState()
      .getItemQuantity(item.productId, item.attributes, item.variantId)

    increaseOptimistic(item.productId, item.attributes, item.variantId)
    localCartVersion += 1
    const nextQuantity = useCartStore
      .getState()
      .getItemQuantity(item.productId, item.attributes, item.variantId)

    if (nextQuantity === previousQuantity) {
      showQuantityLimitToast(item)
    }

    if (!(await syncItem(item))) {
      setCart(previousItems)
      return false
    }

    return true
  }

  async function handleDecreaseCartItem(item: CartItem | CartItemInput) {
    const previousItems = useCartStore.getState().items

    decreaseOptimistic(item.productId, item.attributes, item.variantId)
    localCartVersion += 1

    if (!(await syncItem(item))) {
      setCart(previousItems)
      return false
    }

    return true
  }

  async function handleRemoveCartItem(item: CartItem | CartItemInput) {
    const previousItems = useCartStore.getState().items

    removeItem(item.productId, item.attributes, item.variantId)
    localCartVersion += 1

    if (!(await syncItem(item))) {
      setCart(previousItems)
      return false
    }

    return true
  }

  return {
    handleAddToCart,
    handleIncreaseCartItem,
    handleDecreaseCartItem,
    handleRemoveCartItem,
  }
}
