"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Minus, Plus, Star, Trash2 } from "lucide-react";

import {
  formatPrice,
  productToCartItem,
  type Product,
} from "@/components/global/const";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

export function ProductCard({ product }: { product: Product }) {
  const {
    handleAddToCart,
    handleDecreaseCartItem,
    handleIncreaseCartItem,
    handleRemoveCartItem,
  } = useAddToCart();
  const { handleToggleWishlist } = useWishlist();
  const storeItem = productToCartItem(product);
  const cartQuantity = useCartStore((state) =>
    state.getItemQuantity(
      storeItem.productId,
      storeItem.attributes,
      storeItem.variantId,
    ),
  );
  const isWishlisted = useWishlistStore((state) =>
    state.hasItem(storeItem.productId, storeItem.dbProductId),
  );
  const isInCart = cartQuantity > 0;

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[0.75] overflow-hidden bg-[#f8efe6] md:aspect-[0.78]">
        {product.isNewArrival ? (
          <span className="absolute left-3 top-3 z-10 rounded-[2px] bg-[#3F2617] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
            New Arrival
          </span>
        ) : null}
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0"
          aria-label={`View ${product.name}`}
          prefetch={false}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              width={600}
              height={600}
              className={`object-cover transition duration-500 group-hover:scale-[1.04] ${product.imageClass ?? ""}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-xs font-medium text-[#3f2617]/70">
              Product image coming soon
            </div>
          )}
        </Link>
        <button
          type="button"
          aria-label={`Add ${product.name} to wishlist`}
          onClick={() => handleToggleWishlist(storeItem)}
          className={`absolute right-3 top-3 z-10 flex size-8 translate-y-0 items-center justify-center rounded-full bg-[#C39150] text-white opacity-100 transition duration-300 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 ${
            isWishlisted ? "md:opacity-100" : ""
          }`}
        >
          <Heart
            className="size-4"
            fill={isWishlisted ? "currentColor" : "none"}
          />
        </button>
        <div
          className={`absolute inset-x-2 bottom-2 z-10 transition duration-300 md:inset-x-3 md:bottom-3 ${
            isInCart
              ? "translate-y-0 opacity-100"
              : "translate-y-0 opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
          }`}
        >
          {isInCart ? (
            <CartQuantityControls
              quantity={cartQuantity}
              productName={product.name}
              onDecrease={() => handleDecreaseCartItem(storeItem)}
              onIncrease={() => handleIncreaseCartItem(storeItem)}
              onRemove={() => handleRemoveCartItem(storeItem)}
            />
          ) : (
            <button
              type="button"
              onClick={() => handleAddToCart(storeItem)}
              className="h-10 w-full rounded-[4px] bg-[#C39150] text-sm font-semibold tracking-[0.12em] text-white shadow-lg shadow-black/10"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>

      <Link href={`/product/${product.slug}`} className="block">
        <h3 className="mt-3 font-heading text-[15px] leading-snug text-[#3F2617] md:text-sm">
          {product.name}
        </h3>
        {product.reviewCount ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#6b4a2e]">
            <Star className="size-3 fill-[#D4A056] text-[#D4A056]" />
            <span>{product.rating?.toFixed(1)}</span>
            <span className="text-[#8b7868]">({product.reviewCount})</span>
          </p>
        ) : null}
        <p className="mt-1 text-sm font-medium text-[#111] md:text-xs md:text-[#c39150]">
          {formatPrice(product.price)}
        </p>
      </Link>
    </article>
  );
}

function CartQuantityControls({
  quantity,
  productName,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  quantity: number;
  productName: string;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid h-10 grid-cols-[40px_1fr_40px_40px] overflow-hidden rounded-[4px] bg-white text-[#3F2617] shadow-lg shadow-black/10">
      <button
        type="button"
        aria-label={`Decrease ${productName} quantity`}
        onClick={onDecrease}
        className="flex items-center justify-center border-r border-[#C39150]/30 text-[#C39150]"
      >
        <Minus className="size-4" />
      </button>
      <span className="flex items-center justify-center text-xs font-semibold">
        Qty {quantity}
      </span>
      <button
        type="button"
        aria-label={`Increase ${productName} quantity`}
        onClick={onIncrease}
        className="flex items-center justify-center border-l border-[#C39150]/30 text-[#C39150]"
      >
        <Plus className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`Remove ${productName} from cart`}
        onClick={onRemove}
        className="flex items-center justify-center border-l border-[#C39150]/30 text-[#C39150]"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
