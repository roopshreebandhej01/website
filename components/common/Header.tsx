"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";

import { searchCatalogAction } from "@/actions/product.action";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/components/global/const";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

type SearchResults = Awaited<ReturnType<typeof searchCatalogAction>>;

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Blogs", href: "/blogs" },
];

const Header = ({ isAuthenticated = false }: { isAuthenticated?: boolean }) => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults>({
    products: [],
    categories: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchRequestId = useRef(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
  const clearCart = useCartStore((state) => state.clearCart);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 12);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (isAuthenticated) return;

    clearCart();
    clearWishlist();
  }, [clearCart, clearWishlist, isAuthenticated]);

  useEffect(() => {
    const query = searchQuery.trim();
    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;

    if (query.length < 3) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");

      try {
        const result = await searchCatalogAction(query);

        if (searchRequestId.current !== requestId) return;

        setSearchResults(result);
      } catch (error) {
        console.error("Header search failed:", error);

        if (searchRequestId.current !== requestId) return;

        setSearchResults({ products: [], categories: [] });
        setSearchError("Search failed");
      } finally {
        if (searchRequestId.current === requestId) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults({ products: [], categories: [] });
    setSearchError("");
  }

  function handleSearchQueryChange(value: string) {
    setSearchQuery(value);

    if (value.trim().length < 3) {
      setSearchResults({ products: [], categories: [] });
      setIsSearching(false);
      setSearchError("");
    }
  }

  const mobileMenu = (
    <AnimatePresence>
      {isMenuOpen ? (
        <>
          <motion.button
            aria-label="Close menu"
            className="fixed inset-0 md:hidden"
            style={{
              zIndex: 9998,
              backgroundColor: "rgba(0, 0, 0, 0.55)",
              backdropFilter: "blur(2px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 flex w-80 max-w-[84vw] flex-col px-7 py-5 shadow-2xl md:hidden"
            style={{ zIndex: 9999, backgroundColor: "#ffffff" }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <div className="mb-10 flex items-center justify-between">
              <Link
                href="/"
                className="relative block h-14 w-24"
                onClick={() => setIsMenuOpen(false)}
              >
                <Image
                  src="/header-logo.png"
                  alt="Roop Shree"
                  fill
                  sizes="96px"
                  className="object-contain"
                />
              </Link>
              <Button
                aria-label="Close menu"
                size="icon-sm"
                variant="ghost"
                onClick={() => {
                  setIsMenuOpen(false);
                  closeSearch();
                }}
              >
                <X className="size-5" />
              </Button>
            </div>

            <nav className="flex flex-col gap-5 text-xl font-medium text-[#3F2617]">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setIsMenuOpen(false);
                    closeSearch();
                  }}
                  className="transition-colors hover:text-[#C39150]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {isAuthenticated ? (
              <Button
                asChild
                className="mt-auto h-12 rounded-[4px] bg-[#C39150] text-base text-white hover:bg-[#3F2617]"
              >
                <Link
                  href="/dashboard"
                  onClick={() => {
                    setIsMenuOpen(false);
                    closeSearch();
                  }}
                >
                  Account
                </Link>
              </Button>
            ) : (
              <div className="mt-auto grid gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-[4px] border-[#C39150] text-base text-[#C39150]"
                >
                  <Link
                    href="/auth"
                    onClick={() => {
                      setIsMenuOpen(false);
                      closeSearch();
                    }}
                  >
                    Login
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-12 rounded-[4px] bg-[#C39150] text-base text-white hover:bg-[#3F2617]"
                >
                  <Link
                    href="/auth?view=signup"
                    onClick={() => {
                      setIsMenuOpen(false);
                      closeSearch();
                    }}
                  >
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <header
        className={` print:hidden fixed inset-x-0 top-0 transition-all duration-300 ${
          isMenuOpen ? "z-[9997]" : "z-50"
        } ${
          hasScrolled || isMenuOpen
            ? "border-b border-[#C39150]/25 bg-white/85 shadow-sm backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 md:flex md:justify-between lg:px-8">
          <div className="flex items-center gap-2 justify-self-start md:hidden">
            <Button
              aria-label="Open menu"
              size="icon-sm"
              variant="ghost"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <Button
              aria-label={isSearchOpen ? "Close search" : "Search"}
              size="icon-sm"
              variant="ghost"
              onClick={() => setIsSearchOpen((open) => !open)}
            >
              {isSearchOpen ? (
                <X className="size-4" />
              ) : (
                <Search className="size-4" />
              )}
            </Button>
          </div>

          <Link
            href="/"
            className="relative block h-16 w-24 shrink-0 justify-self-center items-center md:justify-self-auto"
          >
            <Image
              src="/header-logo.png"
              alt="Roop Shree"
              fill
              priority
              sizes="108px"
              className="object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-9 text-xs font-medium text-[#3F2617] md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative pb-2 transition-colors duration-300 ${
                    isActive
                      ? "text-[#3F2617]"
                      : "text-[#3F2617] hover:text-[#C39150]"
                  }`}
                >
                  <span
                    className={`absolute bottom-0 left-0 h-[2px] bg-[#C39150] transition-all duration-300 ${
                      isActive ? "w-full" : "w-0"
                    }`}
                  />

                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-2 justify-self-end">
            <div className="relative hidden lg:block">
              <label className="flex h-9 w-64 items-center gap-2 rounded-full border border-[#3F2617] bg-white/80 px-4 text-xs text-[#3F2617]">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    handleSearchQueryChange(event.target.value)
                  }
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search products, categories..."
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#3F2617]"
                />
                <Search className="size-4" />
              </label>
              {isSearchOpen ? (
                <SearchResultsPanel
                  query={searchQuery}
                  results={searchResults}
                  isSearching={isSearching}
                  error={searchError}
                  onResultClick={closeSearch}
                />
              ) : null}
            </div>

            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button aria-label="Account" size="icon-sm" variant="ghost">
                  <User size={22} />
                </Button>
              </Link>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-[#3F2617] hover:text-[#C39150]"
                >
                  <Link href="/auth">Login</Link>
                </Button>
                {/* <Button
                asChild
                size="sm"
                className="rounded-[4px] bg-[#C39150] px-3 text-white hover:bg-[#3F2617]"
              >
                <Link href="/auth?view=signup">Sign Up</Link>
              </Button> */}
              </div>
            )}

            <Link href="/cart">
              <Button
                aria-label={`Cart, ${cartCount} items`}
                size="icon-sm"
                variant="ghost"
                className="relative"
              >
                <ShoppingBag className="size-4" />
                {cartCount > 0 ? <NavBadge count={cartCount} /> : null}
              </Button>
            </Link>
            <Link href="/dashboard/wishlist">
              <Button
                aria-label={`Wishlist, ${wishlistCount} items`}
                size="icon-sm"
                variant="ghost"
                className="relative"
              >
                <Heart className="size-4" />
                {wishlistCount > 0 ? <NavBadge count={wishlistCount} /> : null}
              </Button>
            </Link>
          </div>
        </div>
        {isSearchOpen ? (
          <div className="border-t border-[#C39150]/20 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md lg:hidden">
            <div className="relative mx-auto max-w-7xl">
              <label className="flex h-10 items-center gap-2 rounded-full border border-[#3F2617] bg-white px-4 text-xs text-[#3F2617]">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    handleSearchQueryChange(event.target.value)
                  }
                  autoFocus
                  placeholder="Search products, categories..."
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#3F2617]"
                />
                <Search className="size-4" />
              </label>
              <SearchResultsPanel
                query={searchQuery}
                results={searchResults}
                isSearching={isSearching}
                error={searchError}
                onResultClick={closeSearch}
              />
            </div>
          </div>
        ) : null}
      </header>
      {typeof document !== "undefined"
        ? createPortal(mobileMenu, document.body)
        : null}
    </>
  );
};

function SearchResultsPanel({
  query,
  results,
  isSearching,
  error,
  onResultClick,
}: {
  query: string;
  results: SearchResults;
  isSearching: boolean;
  error: string;
  onResultClick: () => void;
}) {
  const trimmedQuery = query.trim();
  const hasResults =
    results.products.length > 0 || results.categories.length > 0;

  if (!trimmedQuery) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,480px)] overflow-y-auto rounded-[6px] border border-[#C39150]/35 bg-white p-3 text-[#3F2617] shadow-xl">
      {trimmedQuery.length < 3 ? (
        <p className="px-2 py-3 text-xs text-[#3F2617]/65">
          Type at least 3 characters to search.
        </p>
      ) : isSearching ? (
        <p className="px-2 py-3 text-xs text-[#3F2617]/65">Searching...</p>
      ) : error ? (
        <p className="px-2 py-3 text-xs font-medium text-red-700">{error}</p>
      ) : hasResults ? (
        <div className="grid gap-4">
          {results.products.length > 0 ? (
            <SearchSection title="Products">
              {results.products.map((product) => (
                <Link
                  key={`product-${product.id}`}
                  href={product.href}
                  onClick={onResultClick}
                  className="grid grid-cols-[44px_1fr] gap-3 rounded-[4px] p-2 transition hover:bg-[#FAEBD8]"
                >
                  <div className="relative size-11 overflow-hidden bg-[#f7eadb]">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="44px"
                        className="object-contain object-top"
                      />
                    ) : (
                      <div className="size-full bg-[#f7eadb]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[#C39150]">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </SearchSection>
          ) : null}

          {results.categories.length > 0 ? (
            <SearchSection title="Categories">
              {results.categories.map((category) => (
                <Link
                  key={`category-${category.id}`}
                  href={category.href}
                  onClick={onResultClick}
                  className="flex items-center justify-between rounded-[4px] px-2 py-2 text-sm font-medium transition hover:bg-[#FAEBD8]"
                >
                  <span className="truncate">{category.name}</span>
                  <span className="text-xs text-[#C39150]">Shop</span>
                </Link>
              ))}
            </SearchSection>
          ) : null}
        </div>
      ) : (
        <p className="px-2 py-3 text-xs text-[#3F2617]/65">No results found.</p>
      )}
    </div>
  );
}

function SearchSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-1 px-2 text-[11px] font-semibold uppercase text-[#3F2617]/55">
        {title}
      </h2>
      <div className="grid gap-1">{children}</div>
    </section>
  );
}

function NavBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-[#C39150] px-1 text-[10px] font-semibold leading-4 text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default Header;
