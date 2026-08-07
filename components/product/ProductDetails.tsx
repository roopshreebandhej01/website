"use client";

import { type MouseEvent, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";

import { formatPrice } from "@/components/global/const";
import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { CartItemInput } from "@/store/cartTypes";
import { useToast } from "@/components/common/ToastProvider";
import { IconBrandInstagram } from "@tabler/icons-react";

export type ProductDetailView = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  description: string;
  short_description: string;
  price: number;
  strikeThroughPrice: number | null;
  variants: {
    id: string;
    title: string;
    sku: string;
    instagramLink: string | null;
    price: number;
    strikeThroughPrice: number | null;
    stockQuantity: number;
    color: string | null;
    fabric: string | null;
    size: string | null;
    isDefault: boolean;
    rating: number;
    reviewCount: number;
    image: string;
  }[];
  media: {
    id: string;
    src: string;
    alt: string;
    variantId: string;
    isPrimary: boolean;
  }[];
  attributes: {
    id: string;
    name: string;
    value: string;
  }[];
  reviews: {
    id: string;
    rating: number;
    title: string;
    message: string;
    reviewerName: string;
    createdAt: string;
    media?: {
      key: string;
      url: string;
      contentType: string;
    }[];
  }[];
  reviewSummary: {
    averageRating: number;
    reviewCount: number;
    ratingRows: {
      rating: number;
      percent: number;
    }[];
  };
};

const breadcrumbLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Product Details", href: null },
];

const ProductDetails = ({ product }: { product: ProductDetailView }) => {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    handleAddToCart,
    handleDecreaseCartItem,
    handleIncreaseCartItem,
    handleRemoveCartItem,
  } = useAddToCart();
  const { handleToggleWishlist } = useWishlist();
  const defaultVariant =
    product.variants.find((variant) => variant.isDefault) ??
    product.variants[0] ??
    null;
  const [selectedVariantId, setSelectedVariantId] = useState(
    defaultVariant?.id ?? "",
  );
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [imageZoomOrigin, setImageZoomOrigin] = useState({ x: 50, y: 50 });
  const galleryScrollerRef = useRef<HTMLDivElement>(null);
  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ??
    defaultVariant;
  const selectedMedia =
    product.media.find((item) => item.id === selectedMediaId) ??
    product.media.find((item) => item.variantId === selectedVariant?.id) ??
    product.media.find(
      (item) => item.variantId === defaultVariant?.id && item.isPrimary,
    ) ??
    product.media[0] ??
    null;
  const selectedVariantMedia = product.media.filter(
    (item) => item.variantId === selectedVariant?.id,
  );
  const galleryMedia = selectedVariantMedia.length
    ? selectedVariantMedia
    : product.media.filter((item) => item.variantId === defaultVariant?.id);
  const displayedImage = selectedMedia?.src ?? selectedVariant?.image ?? "";
  const displayedAlt = selectedMedia?.alt ?? product.name;
  const price = selectedVariant?.price ?? product.price;
  const strikeThroughPrice =
    selectedVariant?.strikeThroughPrice ?? product.strikeThroughPrice;
  const discount =
    strikeThroughPrice && strikeThroughPrice > price
      ? Math.round(((strikeThroughPrice - price) / strikeThroughPrice) * 100)
      : null;
  const variantAttributes = useMemo(
    () =>
      [
        selectedVariant?.color
          ? { name: "Colour", value: selectedVariant.color }
          : null,
        selectedVariant?.fabric
          ? { name: "Fabric", value: selectedVariant.fabric }
          : null,
        selectedVariant?.size
          ? { name: "Size", value: selectedVariant.size }
          : null,
      ].filter(Boolean) as { name: string; value: string }[],
    [selectedVariant],
  );
  const cartItem: CartItemInput = {
    productId: `${product.slug}:${selectedVariant?.id ?? "default"}`,
    dbProductId: product.id,
    variantId: selectedVariant?.id,
    title: product.name,
    price,
    stockQuantity: selectedVariant?.stockQuantity,
    image: displayedImage,
    colour: selectedVariant?.color ?? undefined,
    imageClass: "object-top",
    attributes: variantAttributes.length ? variantAttributes : undefined,
  };
  const cartQuantity = useCartStore((state) =>
    state.getItemQuantity(
      cartItem.productId,
      cartItem.attributes,
      cartItem.variantId,
    ),
  );
  const isInCart = cartQuantity > 0;
  const isWishlisted = useWishlistStore((state) =>
    state.hasItem(cartItem.productId, cartItem.dbProductId),
  );
  function handleImageZoomMove(event: MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();

    setImageZoomOrigin({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
  }
  function selectGalleryImage(imageId: string) {
    setSelectedMediaId(imageId);
  }
  function scrollGallery(direction: "previous" | "next") {
    const scroller = galleryScrollerRef.current;

    if (!scroller) return;

    scroller.scrollBy({
      left:
        direction === "previous"
          ? -scroller.clientWidth * 0.85
          : scroller.clientWidth * 0.85,
      behavior: "smooth",
    });
  }

  return (
    <section className="bg-white pb-6 pt-24 text-[#111] md:pt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold text-black">
          {breadcrumbLinks.map((item, index) => (
            <span key={item.label} className="inline-flex items-center gap-2">
              {item.href ? (
                <Link href={item.href} className="hover:text-[#C39150]">
                  {item.label}
                </Link>
              ) : (
                <span className="text-[#3f2617]">{item.label}</span>
              )}
              {index < breadcrumbLinks.length - 1 ? (
                <span className="text-[#3f2617]">&gt;</span>
              ) : null}
            </span>
          ))}
        </nav>

        <div className="grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-7">
          <div className="min-w-0">
            <div
              className="relative overflow-hidden bg-[#f2e4d7]"
              onMouseEnter={() => setIsImageZoomed(true)}
              onMouseLeave={() => {
                setIsImageZoomed(false);
                setImageZoomOrigin({ x: 50, y: 50 });
              }}
              onMouseMove={handleImageZoomMove}
            >
              {displayedImage ? (
                <div className="flex h-full w-full cursor-zoom-in items-start justify-center">
                  <Image
                    src={displayedImage}
                    alt={displayedAlt}
                    priority
                    height={700}
                    width={500}
                    style={{
                      transformOrigin: `${imageZoomOrigin.x}% ${imageZoomOrigin.y}%`,
                    }}
                    className={`h-auto w-full object-contain object-top transition-transform duration-200 ease-out ${
                      isImageZoomed ? "scale-[1.9]" : "scale-100"
                    }`}
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-[#3f2617]/70">
                  Product image coming soon
                </div>
              )}
            </div>

            {galleryMedia.length > 0 ? (
              <div className="mt-7 flex items-center gap-4">
                <button
                  type="button"
                  aria-label="Previous product image"
                  onClick={() => scrollGallery("previous")}
                  className="text-[#c39150] transition hover:text-[#3f2617]"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <div
                  ref={galleryScrollerRef}
                  className="scrollbar-hidden flex flex-1 snap-x gap-3 overflow-x-auto scroll-smooth sm:gap-5"
                >
                  {galleryMedia.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => selectGalleryImage(image.id)}
                      className={`relative aspect-[0.78] w-[calc((100%-2.25rem)/4)] min-w-[calc((100%-2.25rem)/4)] snap-start overflow-hidden border transition sm:w-[calc((100%-3.75rem)/4)] sm:min-w-[calc((100%-3.75rem)/4)] ${
                        selectedMedia?.id === image.id
                          ? "border-[#c39150]"
                          : "border-transparent"
                      }`}
                      aria-label="View product image"
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        height={700}
                        width={700}
                        className="object-cover object-top"
                      />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  aria-label="Next product image"
                  onClick={() => scrollGallery("next")}
                  className="text-[#c39150] transition hover:text-[#3f2617]"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-4 sm:hidden grid grid-cols-3 gap-3 sm:grid-cols-4">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  setSelectedVariantId(variant.id);
                  setSelectedMediaId(null);
                  galleryScrollerRef.current?.scrollTo({
                    left: 0,
                    behavior: "smooth",
                  });
                }}
                className={`overflow-hidden rounded-[3px] border bg-white text-left transition ${
                  selectedVariant?.id === variant.id
                    ? "border-[#c39150] shadow-sm"
                    : "border-[#d8b278] hover:border-[#c39150]"
                }`}
              >
                <span className="relative block aspect-[0.78] bg-[#f8efe6]">
                  {variant.image ? (
                    <Image
                      src={variant.image}
                      alt={variant.title}
                      height={700}
                      width={700}
                      className="object-cover object-top"
                    />
                  ) : null}
                </span>
                <span className="block truncate px-2 py-2 text-xs font-semibold text-[#3f2617]">
                  {variant.color ?? variant.title}
                </span>
              </button>
            ))}
          </div>

          <div className="min-w-0 lg:pt-1">
            <h1 className="max-w-2xl font-heading text-[2rem] leading-[1.18] text-black md:text-[2.45rem]">
              {product.name}
            </h1>

            {product.short_description ? (
              <p className="mt-7 text-sm leading-5 text-gray-600 whitespace-pre-wrap">
                {product.short_description}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-baseline gap-4">
              <p className="text-3xl font-bold text-black md:text-4xl">
                {formatPrice(price)}
              </p>
              {price ? (
                <p className="text-xl text-[#5f5a55] line-through">
                  {formatPrice(price + 500)}
                </p>
              ) : null}
              {price ? (
                <p className="text-xl text-[#c39150]">
                  ( {((500 / price) * 100).toFixed(0)}% OFF)
                </p>
              ) : null}
            </div>

            <div className=" mt-6 flex gap-4">
              {selectedVariant?.instagramLink ? (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-[#d8b278] bg-white text-sm font-medium text-[#3f2617] hover:bg-[#fbf3ea]"
                >
                  <Link
                    href={selectedVariant.instagramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View this variant on Instagram"
                  >
                    <IconBrandInstagram className="size-4 text-[#c39150]" />
                  </Link>
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={() => handleToggleWishlist(cartItem)}
                className=" rounded-full  border-[#d8b278] bg-white text-sm font-medium text-[#3f2617] hover:bg-[#fbf3ea]"
              >
                <Heart
                  className="size-4 text-[#c39150]"
                  fill={isWishlisted ? "currentColor" : "none"}
                />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast({
                    title: "Link copied to clipboard",
                    tone: "success",
                  });
                }}
                className=" rounded-full border-[#d8b278] bg-white text-sm font-medium text-[#3f2617] hover:bg-[#fbf3ea]"
              >
                <Share2 className="size-4 text-[#c39150]" />
              </Button>
            </div>

            {variantAttributes.length > 0 ? (
              <div className="mt-6 grid gap-3">
                {variantAttributes.map((attribute) => (
                  <div
                    key={`${attribute.name}-${attribute.value}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-xs font-semibold uppercase text-black">
                      {attribute.name}
                    </span>{" "}
                    {":"}
                    <span className="text-right text-[#3f2617]">
                      {attribute.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {product.variants.length > 0 ? (
              <div className="mt-7">
                <p className="text-xs font-bold uppercase text-black">
                  Colour: {selectedVariant?.color ?? selectedVariant?.title}
                </p>
                <div className="mt-4 hidden sm:grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setSelectedMediaId(null);
                        galleryScrollerRef.current?.scrollTo({
                          left: 0,
                          behavior: "smooth",
                        });
                      }}
                      className={`overflow-hidden rounded-[3px] border bg-white text-left transition ${
                        selectedVariant?.id === variant.id
                          ? "border-[#c39150] shadow-sm"
                          : "border-[#d8b278] hover:border-[#c39150]"
                      }`}
                    >
                      <span className="relative block aspect-[0.78] bg-[#f8efe6]">
                        {variant.image ? (
                          <Image
                            src={variant.image}
                            alt={variant.title}
                            height={700}
                            width={700}
                            className="object-cover object-top"
                          />
                        ) : null}
                      </span>
                      <span className="block truncate px-2 py-2 text-xs font-semibold text-[#3f2617]">
                        {variant.color ?? variant.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-2">
              {isInCart ? (
                <ProductQuantityControls
                  quantity={cartQuantity}
                  onDecrease={() => handleDecreaseCartItem(cartItem)}
                  onIncrease={() => handleIncreaseCartItem(cartItem)}
                  onRemove={() => handleRemoveCartItem(cartItem)}
                />
              ) : (
                <Button
                  onClick={() => handleAddToCart(cartItem)}
                  disabled={selectedVariant?.stockQuantity === 0}
                  className="h-12 text-sm font-semibold disabled:opacity-60"
                >
                  {selectedVariant?.stockQuantity === 0
                    ? "Out of stock"
                    : "Add to cart"}
                </Button>
              )}
              <Button
                disabled={selectedVariant?.stockQuantity === 0}
                onClick={() => {
                  window.sessionStorage.setItem(
                    "roopshree-buy-now",
                    JSON.stringify({
                      ...cartItem,
                      quantity: 1,
                      addedAt: Date.now(),
                    }),
                  );
                  router.push("/checkout?source=buy-now");
                }}
                className="h-12 bg-[#3f2617] text-sm font-semibold text-white hover:bg-[#3f2617]/90 disabled:opacity-60"
              >
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function ProductQuantityControls({
  quantity,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid h-12 grid-cols-[52px_1fr_52px_52px] overflow-hidden border border-[#c39150] bg-white text-[#3f2617]">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={onDecrease}
        className="flex items-center justify-center border-r border-[#c39150]/35 text-[#c39150]"
      >
        <Minus className="size-4" />
      </button>
      <span className="flex items-center justify-center text-sm font-semibold">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={onIncrease}
        className="flex items-center justify-center border-l border-[#c39150]/35 text-[#c39150]"
      >
        <Plus className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Remove from cart"
        onClick={onRemove}
        className="flex items-center justify-center bg-red-50 text-red-500"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export default ProductDetails;
