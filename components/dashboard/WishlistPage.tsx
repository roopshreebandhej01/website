"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";

import { DashboardPageTitle } from "@/components/dashboard/DashboardPrimitives";
import { formatPrice } from "@/components/global/const";
import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useWishlistStore } from "@/store/wishlistStore";

export function WishlistPage() {
  const wishlistProducts = useWishlistStore((state) => state.items);
  const { handleAddToCart } = useAddToCart();
  const { handleRemoveWishlist, syncWishlistFromDb } = useWishlist();

  useEffect(() => {
    syncWishlistFromDb({ force: true });
  }, []);

  return (
    <div>
      <DashboardPageTitle>Wishlist</DashboardPageTitle>
      {wishlistProducts.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ">
          {wishlistProducts.map((product) => (
            <div
              key={product.productId}
              className="relative flex flex-col min-w-0 border"
            >
              <Link href="/shop" className="group block flex-1">
                <div className="relative aspect-[0.82] overflow-hidden bg-[#ead8c4]">
                  <Image
                    src={product.image}
                    alt={product.title}
                    height={700}
                    width={700}
                    className="object-cover object-top transition duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className=" p-4">
                  <h2 className="font-heading text-sm font-medium text-[#2d180f]">
                    {product.title}
                  </h2>
                  <p className="mt-1 text-xs font-medium text-[#C39150]">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                aria-label={`Remove ${product.title} from wishlist`}
                onClick={() => handleRemoveWishlist(product)}
                className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-white/90 text-[#C39150] shadow-sm transition hover:bg-white hover:text-[#3F2617]"
              >
                <Heart className="size-4" fill="currentColor" />
              </button>
              <div className="mt-auto grid gap-2 px-4 pb-4">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    handleAddToCart(product);
                    handleRemoveWishlist(product);
                  }}
                  className="bg-[#3F2617] text-white hover:bg-[#2d180f]"
                >
                  <ShoppingCart className="size-4" />
                  Move to cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-[#2d180f]/70">
          Your wishlist is empty.
        </p>
      )}
    </div>
  );
}
