import Link from "next/link";
import HeroSection from "@/components/shop/Hero";
import ShopFilters from "@/components/shop/ShopFilters";
import ShopProducts from "@/components/shop/ShopProducts";
import {
  getCatalogCategories,
  getCatalogFilterOptions,
  getCatalogProductPage,
} from "@/services/product.service";
import { Metadata } from "next";
import { Suspense } from "react";

function getParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getParamList(value?: string | string[]) {
  const raw = Array.isArray(value) ? value.join(",") : value;

  return raw
    ? raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function getPriceInPaise(value?: string | string[]) {
  const price = Number(getParamValue(value));

  return Number.isFinite(price) && price > 0
    ? Math.round(price * 100)
    : undefined;
}

export const metadata: Metadata = {
  title: "Shop Authentic Bandhani Sarees & Dupattas Online | Roopshree",
  description:
    "Browse Roopshree's full collection of Bandhej sarees & dupattas, Gajji silk, zardozi work & gota-patti designs. Handcrafted pieces for weddings & festive wear.",
  alternates: {
    canonical: "https://roopshreebandhej.com/shop",
  },
  openGraph: {
    title: "Shop Authentic Bandhani Sarees & Dupattas Online | Roopshree",
    description:
      "Browse Roopshree's full collection of Bandhej sarees & dupattas, Gajji silk, zardozi work & gota-patti designs. Handcrafted pieces for weddings & festive wear.",
    url: "https://roopshreebandhej.com/shop",
    type: "website",
    images: [{ url: "https://roopshreebandhej.com/shop/shop_bg.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Authentic Bandhani Sarees & Dupattas Online | Roopshree",
    description:
      "Browse Roopshree's full collection of Bandhej sarees & dupattas, Gajji silk, zardozi work & gota-patti designs. Handcrafted pieces for weddings & festive wear.",
  },
};

type ShopSearchParams = Promise<Record<string, string | string[] | undefined>>;

function ShopCatalogLoader() {
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden space-y-4 lg:block">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-[4px] bg-[#f4eadf]"
          />
        ))}
      </aside>
      <section className="min-w-0">
        <div className="mb-6 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 md:gap-x-5 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-[4px] bg-[#f4eadf] sm:h-40 lg:h-44 xl:h-48"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-5 md:gap-y-8 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[3/4] animate-pulse rounded-[4px] bg-[#f4eadf]" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#f4eadf]" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-[#f4eadf]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

async function ShopCatalog({
  searchParams,
}: {
  searchParams?: ShopSearchParams;
}) {
  const params = await searchParams;
  const filterOptions = await getCatalogFilterOptions();
  const currentPage = Number(getParamValue(params?.page) ?? 1);
  const pageSize = 12;
  const customFilters = filterOptions.customGroups.reduce<
    Record<string, string[]>
  >((filters, group) => {
    const values = getParamList(params?.[`filter_${group.paramKey}`]);

    if (values.length > 0) {
      filters[group.title] = values;
    }

    return filters;
  }, {});
  const [{ items, total }, categories] = await Promise.all([
    getCatalogProductPage({
      limit: pageSize,
      offset: (Math.max(currentPage, 1) - 1) * pageSize,
      categorySlugs: getParamList(params?.category),
      colors: getParamList(params?.color),
      fabrics: getParamList(params?.fabric),
      sizes: getParamList(params?.size),
      availability: getParamList(params?.availability).filter(
        (item): item is "in-stock" | "out-of-stock" =>
          item === "in-stock" || item === "out-of-stock",
      ),
      minPriceInPaise: getPriceInPaise(params?.minPrice),
      maxPriceInPaise: getPriceInPaise(params?.maxPrice),
      filters: customFilters,
      sortBy:
        getParamValue(params?.sort) === "newest" ||
        getParamValue(params?.sort) === "price-low" ||
        getParamValue(params?.sort) === "price-high"
          ? (getParamValue(params?.sort) as
              | "newest"
              | "price-low"
              | "price-high")
          : "featured",
    }),
    getCatalogCategories(20),
  ]);

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <ShopFilters options={filterOptions} />
      <ShopProducts
        products={items}
        categories={categories}
        filterOptions={filterOptions}
        total={total}
        currentPage={Math.max(currentPage, 1)}
      />
    </div>
  );
}

const page = ({ searchParams }: { searchParams?: ShopSearchParams }) => {
  return (
    <main className="flex-1 overflow-x-hidden">
      <HeroSection />
      <section className="max-w-full overflow-x-hidden bg-white py-10 md:py-14">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="mb-5 hidden gap-4 text-xs font-medium text-[#111] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
            <p>
              <Link href="/" className="hover:text-[#C39150]">
                Home
              </Link>{" "}
              &nbsp;&gt;&nbsp;{" "}
              <Link href="/shop" className="hover:text-[#C39150]">
                Shop
              </Link>
            </p>
          </div>
          <Suspense fallback={<ShopCatalogLoader />}>
            <ShopCatalog searchParams={searchParams} />
          </Suspense>
          {/* <NewsletterSection /> */}
        </div>
      </section>
    </main>
  );
};

export default page;
