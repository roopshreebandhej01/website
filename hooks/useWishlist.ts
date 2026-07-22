"use client"

import { useRouter } from "next/navigation"

import {
  getUserWishlistItems,
  removeUserWishlistItem,
  setUserWishlistItem,
} from "@/actions/wishlist.action"
import { useToast } from "@/components/common/ToastProvider"
import { useWishlistStore } from "@/store/wishlistStore"
import type { CartItemInput } from "@/store/cartTypes"

let localWishlistVersion = 0

export function useWishlist() {
  const router = useRouter()
  const toggleItemOptimistic = useWishlistStore((state) => state.toggleItem)
  const removeItem = useWishlistStore((state) => state.removeItem)
  const hasItem = useWishlistStore((state) => state.hasItem)
  const setWishlist = useWishlistStore((state) => state.setWishlist)
  const { showToast } = useToast()

  function redirectToAuth() {
    router.push("/auth")
  }

  async function syncWishlistFromDb(options?: { force?: boolean }) {
    const syncStartedAtVersion = localWishlistVersion
    const updatedWishlist = await getUserWishlistItems()

    if (updatedWishlist.success) {
      if (!options?.force && syncStartedAtVersion !== localWishlistVersion) {
        return
      }

      setWishlist(updatedWishlist.items)
    }
  }

  async function handleToggleWishlist(product: CartItemInput) {
    const previousItems = useWishlistStore.getState().items
    const shouldBeWishlisted = !useWishlistStore
      .getState()
      .hasItem(product.productId, product.dbProductId)

    toggleItemOptimistic(product)
    localWishlistVersion += 1
    const mutationVersion = localWishlistVersion

    if (!product.dbProductId) {
      // Guest item with no DB product ID — Zustand-only, no sync needed
      return true
    }

    try {
      const result = await setUserWishlistItem({
        productId: product.dbProductId,
        isWishlisted: shouldBeWishlisted,
      })

      if (result.userIsNotLoggedIn) {
        // Guest user — keep the Zustand update, skip DB sync
        return true
      }

      if (!result.success) {
        if (mutationVersion === localWishlistVersion) {
          setWishlist(previousItems)
          showToast({
            title: result.message ?? "Unable to update wishlist",
            tone: "error",
          })
        }
        return false
      }

      if (mutationVersion !== localWishlistVersion) {
        return true
      }

      await syncWishlistFromDb()
      return true
    } catch (error) {
      console.error(error)
      if (mutationVersion === localWishlistVersion) {
        setWishlist(previousItems)
        showToast({ title: "Unable to update wishlist", tone: "error" })
      }
      return false
    }
  }

  async function handleRemoveWishlist(product: CartItemInput) {
    const previousItems = useWishlistStore.getState().items

    removeItem(product.productId, product.dbProductId)
    localWishlistVersion += 1
    const mutationVersion = localWishlistVersion

    if (!product.dbProductId) {
      // Guest item with no DB product ID — Zustand-only, no sync needed
      return true
    }

    try {
      const result = await removeUserWishlistItem(product.dbProductId)

      if (result.userIsNotLoggedIn) {
        // Guest user — keep the Zustand update, skip DB sync
        return true
      }

      if (!result.success) {
        if (mutationVersion === localWishlistVersion) {
          setWishlist(previousItems)
          showToast({
            title: result.message ?? "Unable to update wishlist",
            tone: "error",
          })
        }
        return false
      }

      if (mutationVersion !== localWishlistVersion) {
        return true
      }

      await syncWishlistFromDb()
      return true
    } catch (error) {
      console.error(error)
      if (mutationVersion === localWishlistVersion) {
        setWishlist(previousItems)
        showToast({ title: "Unable to update wishlist", tone: "error" })
      }
      return false
    }
  }

  return { handleToggleWishlist, handleRemoveWishlist, hasItem, syncWishlistFromDb }
}
