"use client";

import { useEffect } from "react";

import { getUserCartItems } from "@/actions/cart.action";
import { getUserWishlistItems } from "@/actions/wishlist.action";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

export function StoreHydrator({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const setCart = useCartStore((state) => state.setCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const setWishlist = useWishlistStore((state) => state.setWishlist);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  useEffect(() => {
    let isMounted = true;

    async function hydrateStores() {
      if (!isAuthenticated) {
        // Guest users: keep their local Zustand cart/wishlist as-is.
        // Do NOT clear or sync with DB.
        return;
      }

      const [cartResult, wishlistResult] = await Promise.all([
        getUserCartItems(),
        getUserWishlistItems(),
      ]);

      if (!isMounted) return;

      if (cartResult.success) {
        setCart(cartResult.items);
      }

      if (wishlistResult.success) {
        setWishlist(wishlistResult.items);
      }
    }

    hydrateStores().catch((error) => {
      console.error("Unable to hydrate cart and wishlist:", error);
    });

    return () => {
      isMounted = false;
    };
  }, [clearCart, clearWishlist, isAuthenticated, setCart, setWishlist]);

  return null;
}
