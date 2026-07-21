"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { ShopMobileFilters } from "./ShopFilters";
import type { getCatalogFilterOptions } from "@/services/product.service";
import {
  formatPrice,
  productToCartItem,
  type Product,
} from "@/components/global/const";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

const pageSize = 12;
const visiblePaginationPages = 4;

export type ShopCategory = {
  id?: string;
  name: string;
  slug?: string;
  href?: string;
  image: string;
};

function getVisiblePages(currentPage: number, totalPages: number) {
  const pageCount = Math.min(visiblePaginationPages, totalPages);
  const halfWindow = Math.floor(pageCount / 2);
  let startPage = Math.max(1, currentPage - halfWindow);
  const endOverflow = startPage + pageCount - 1 - totalPages;

  if (endOverflow > 0) {
    startPage = Math.max(1, startPage - endOverflow);
  }

  return Array.from({ length: pageCount }, (_, index) => startPage + index);
}

export default function ShopProducts({
  products,
  categories,
  filterOptions,
  total,
  currentPage,
}: {
  products: Product[];
  categories: ShopCategory[];
  filterOptions: Awaited<ReturnType<typeof getCatalogFilterOptions>>;
  total: number;
  currentPage: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState(searchParams.get("sort") ?? "featured");
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const pageNumber = Math.min(Math.max(currentPage, 1), totalPages);
  const visiblePages = getVisiblePages(pageNumber, totalPages);
  const firstVisiblePage = visiblePages[0] ?? 1;
  const lastVisiblePage = visiblePages[visiblePages.length - 1] ?? totalPages;

  function buildHref(updates: Record<string, string | number | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
        return;
      }

      params.set(key, String(value));
    });

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <section className="relative min-w-0 max-w-full overflow-hidden">
      <div className="hidden justify-end lg:absolute lg:right-0 lg:-top-[3.25rem] lg:flex">
        <SortControl sortBy={sortBy} onSortChange={setSortBy} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-[#111]">All Categories</h2>
      </div>

      {categories.length > 0 ? (
        <div className="grid max-w-full grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 md:gap-x-5 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((category, index) => (
            <Link
              key={`${category.slug ?? category.name}-${index}`}
              href={buildHref({ category: category.slug ?? null, page: 1 })}
              className="group block min-w-0"
            >
              {category.image ? (
                <Image
                  src={category.image}
                  height={400}
                  width={400}
                  alt={category.name}
                  className="mx-auto h-36 w-full object-contain transition duration-300 group-hover:scale-[1.02] sm:h-40 lg:h-44 xl:h-48"
                  unoptimized
                />
              ) : (
                <span className="flex h-36 items-center justify-center bg-[#f8efe6] px-3 text-center text-sm text-[#3f2617] sm:h-40 lg:h-44 xl:h-48">
                  {category.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-8 flex items-center justify-between lg:hidden">
        <ShopMobileFilters options={filterOptions} />
        <SortControl sortBy={sortBy} onSortChange={setSortBy} compact />
      </div>

      <h2 className="mt-7 hidden text-sm font-semibold text-[#111] lg:block">
        All Products ({total})
      </h2>

      {products.length > 0 ? (
        <div className="mt-6 grid min-w-0 grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-5 md:gap-y-8 lg:mt-4 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-6 border border-[#ead8c5] bg-[#fcf8f1] px-5 py-10 text-center text-sm font-medium text-[#3f2617]">
          No products found in the database.
        </div>
      )}

      <div className="mt-12 hidden items-center justify-end gap-2 text-xs font-medium text-[#3F2617] lg:flex">
        <Link
          aria-label="Previous page"
          href={buildHref({ page: Math.max(pageNumber - 1, 1) })}
          className={`flex size-8 items-center justify-center rounded-[3px] border border-[#d8a15a] bg-white transition hover:border-[#c39150] hover:text-[#c39150] ${
            pageNumber === 1 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          <ChevronLeft className="size-4" />
        </Link>
        {firstVisiblePage > 1 ? (
          <>
            <Link
              href={buildHref({ page: 1 })}
              className="flex size-8 items-center justify-center rounded-[3px] border border-[#d8a15a] bg-white text-[#3F2617] transition hover:border-[#c39150] hover:text-[#c39150]"
            >
              1
            </Link>
            {firstVisiblePage > 2 ? (
              <span className="flex size-8 items-center justify-center text-[#3F2617]/55">
                ...
              </span>
            ) : null}
          </>
        ) : null}
        {visiblePages.map((page) => (
          <Link
            key={page}
            href={buildHref({ page })}
            className={`flex size-8 items-center justify-center rounded-[3px] border transition ${
              page === pageNumber
                ? "border-[#c39150] bg-[#C39150] text-white"
                : "border-[#d8a15a] bg-white text-[#3F2617] hover:border-[#c39150] hover:text-[#c39150]"
            }`}
          >
            {page}
          </Link>
        ))}
        {lastVisiblePage < totalPages ? (
          <>
            {lastVisiblePage < totalPages - 1 ? (
              <span className="flex size-8 items-center justify-center text-[#3F2617]/55">
                ...
              </span>
            ) : null}
            <Link
              href={buildHref({ page: totalPages })}
              className={`flex h-8 min-w-8 items-center justify-center rounded-[3px] border px-2 transition ${
                pageNumber === totalPages
                  ? "border-[#c39150] bg-[#C39150] text-white"
                  : "border-[#d8a15a] bg-white text-[#3F2617] hover:border-[#c39150] hover:text-[#c39150]"
              }`}
            >
              {totalPages}
            </Link>
          </>
        ) : null}
        <Link
          aria-label="Next page"
          href={buildHref({ page: Math.min(pageNumber + 1, totalPages) })}
          className={`flex size-8 items-center justify-center rounded-[3px] border border-[#d8a15a] bg-white transition hover:border-[#c39150] hover:text-[#c39150] ${
            pageNumber === totalPages ? "pointer-events-none opacity-40" : ""
          }`}
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function SortControl({
  sortBy,
  onSortChange,
  compact = false,
}: {
  sortBy: string;
  onSortChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-2 self-start text-[#111] ${
        compact ? "text-sm font-semibold" : "text-xs"
      }`}
    >
      Sort by:
      <select
        value={sortBy}
        onChange={(event) => {
          onSortChange(event.target.value);
          const params = new URLSearchParams(window.location.search);
          params.set("sort", event.target.value);
          params.set("page", "1");
          window.location.href = `${window.location.pathname}?${params.toString()}`;
        }}
        className={`rounded-[2px] border border-[#d8a15a] bg-white px-3 font-normal text-[#c39150] outline-none ${
          compact ? "h-9 w-[92px] text-xs" : "h-8 min-w-28 text-xs"
        }`}
      >
        <option value="featured">Featured</option>
        <option value="newest">Newest</option>
        <option value="price-low">Price Low</option>
        <option value="price-high">Price High</option>
      </select>
    </label>
  );
}

function ProductCard({ product }: { product: Product }) {
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
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0"
          aria-label={`View ${product.name}`}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 1280px) 220px, (min-width: 768px) 28vw, 48vw"
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
              className="h-8 w-full rounded-[4px] bg-[#C39150] text-sm font-semibold md:tracking-[0.12em] text-white shadow-lg shadow-black/10"
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
        className="flex items-center justify-center bg-red-50 text-red-500"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
