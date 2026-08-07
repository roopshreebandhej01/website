import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";

import { formatPrice } from "@/components/global/const";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useWishlist } from "@/hooks/useWishlist";
import type { CartItem } from "@/store/cartTypes";
import { useRouter } from "next/navigation";

export function CartItemRow({ item }: { item: CartItem }) {
  const {
    handleDecreaseCartItem,
    handleIncreaseCartItem,
    handleRemoveCartItem,
  } = useAddToCart();
  const { handleToggleWishlist } = useWishlist();
  const router = useRouter();
  const total = item.price * item.quantity;
  const wishlistItem = {
    productId: item.productId,
    dbProductId: item.dbProductId,
    variantId: item.variantId,
    title: item.title,
    price: item.price,
    image: item.image,
    colour: item.colour,
    imageClass: item.imageClass,
    attributes: item.attributes,
  };

  return (
    <article className="grid gap-4 border-b border-[#3F2617]/55 py-4 md:grid-cols-[minmax(0,1fr)_110px_110px_110px_56px] md:items-start">
      <div className="flex min-w-0 gap-4">
        <div className="relative h-[74px] w-[62px] shrink-0 overflow-hidden bg-[#f7eadb]">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              height={700}
              width={700}
              sizes="62px"
              className="object-contain object-top"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-[10px] font-medium text-[#3f2617]/70">
              No image
            </div>
          )}
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="font-heading text-sm font-semibold leading-snug text-[#3F2617]">
            {item.title}
          </h2>
          <p className="mt-1 text-[11px] text-[#3F2617]/70">
            {item.colour} Colour
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 md:justify-center">
        <span className="text-xs font-semibold text-[#3F2617] md:hidden">
          Quantity
        </span>
        <div className="flex items-center gap-3 text-xs text-[#C39150]">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => handleDecreaseCartItem(item)}
          >
            <Minus className="size-3" />
          </button>
          <span className="font-semibold text-[#3F2617]">{item.quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => handleIncreaseCartItem(item)}
          >
            <Plus className="size-3" />
          </button>
        </div>
      </div>

      <CartValue label="Price" value={formatPrice(item.price)} />
      <CartValue label="Total" value={formatPrice(total)} />

      <div className="flex items-center justify-between gap-4 md:flex md:justify-center md:pt-1">
        <button
          type="button"
          aria-label="Remove item"
          onClick={() => handleRemoveCartItem(item)}
          className="text-red-500 transition hover:text-red-600"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          handleToggleWishlist(wishlistItem);
          handleRemoveCartItem(item);
          router.push("/dashboard/wishlist");
        }}
        className="text-left text-[11px] font-medium text-[#C39150] transition hover:text-[#3F2617] md:col-start-4 md:col-end-6 md:justify-self-end md:whitespace-nowrap md:text-right"
      >
        Move to wishlist
      </button>
    </article>
  );
}

function CartValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs md:block md:text-center">
      <span className="text-xs font-semibold text-[#3F2617] md:hidden">
        {label}
      </span>
      <span className="font-medium text-[#C39150]">{value}</span>
    </div>
  );
}
