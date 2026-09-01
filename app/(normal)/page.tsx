import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import HomeShowcaseSection from "@/components/home/HomeShowcaseSection";
import Newarrival from "@/components/home/Newarrival";
import Trending from "@/components/home/Trending";
import Reviews from "@/components/home/Reviews";
import Heritage from "@/components/home/Heritage";
import StayConnected from "@/components/home/StayConnected";
import {
  getCatalogCategories,
  getFeaturedProducts,
  getNewArrivalProducts,
  getTrendingProducts,
} from "@/services/product.service";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Authentic Bandhej Sarees & Dupattas from Rajasthan | Roopshree",
  description:
    "Shop handcrafted Bandhej sarees & dupattas from Roopshree. Authentic heritage from Rajasthan with trusted quality. Explore the latest collection and shop online.",
  alternates: {
    canonical: "https://roopshreebandhej.com",
  },
  keywords: [
    "bandhani dupattas",
    "bandhej sarees",
    "leheriya sarees",
    "pure georgette bandhani dupatta",
    "ethnic wear online",
  ],
  openGraph: {
    title: "Authentic Bandhej Sarees & Dupattas from Rajasthan | Roopshree",
    description:
      "Shop handcrafted Bandhej sarees & dupattas from Roopshree. Authentic heritage from Rajasthan with trusted quality. Explore the latest collection and shop online.",
    url: "https://roopshreebandhej.com/",
    type: "website",
    images: [{ url: "https://roopshreebandhej.com/header-logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Authentic Bandhej Sarees & Dupattas from Rajasthan | Roopshree",
    description:
      "Shop handcrafted Bandhej sarees & dupattas from Roopshree. Authentic heritage from Rajasthan with trusted quality. Explore the latest collection and shop online.",
  },
};

function ProductSectionSkeleton({
  titleWidth = "w-72",
  withSubtitle = false,
}: {
  titleWidth?: string;
  withSubtitle?: boolean;
}) {
  return (
    <section className="bg-white py-10 md:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3">
          <div
            className={`h-10 ${titleWidth} max-w-full animate-pulse rounded bg-[#f4eadf]`}
          />
          {withSubtitle ? (
            <div className="h-4 w-80 max-w-full animate-pulse rounded bg-[#f4eadf]" />
          ) : null}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 md:gap-x-5 md:gap-y-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[3/4] animate-pulse rounded-[4px] bg-[#f4eadf]" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#f4eadf]" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-[#f4eadf]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const dynamic = "force-static";
export const revalidate = 3600;

function CategorySectionSkeleton() {
  return (
    <section className="bg-white py-7 md:pb-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-[min(34rem,100%)] animate-pulse rounded bg-[#f4eadf]" />
          <div className="h-5 w-56 animate-pulse rounded bg-[#f4eadf]" />
        </div>
        <div className="mt-12 flex gap-4 overflow-hidden md:mt-16 lg:grid lg:grid-cols-5 lg:gap-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[334/473] w-[42vw] min-w-[10rem] shrink-0 animate-pulse bg-[#f4eadf] sm:w-[18rem] md:w-[20rem] lg:w-auto lg:min-w-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeSectionsSkeleton() {
  return (
    <>
      <ProductSectionSkeleton titleWidth="w-80" />
      <CategorySectionSkeleton />
      <ProductSectionSkeleton titleWidth="w-56" withSubtitle />
      <ProductSectionSkeleton titleWidth="w-72" withSubtitle />
    </>
  );
}

async function HomeDataSections() {
  const [categories, newArrivals, trendingProducts, featuredProducts] =
    await Promise.all([
      getCatalogCategories(5),
      getNewArrivalProducts(4),
      getTrendingProducts(5),
      getFeaturedProducts(8),
    ]);

  return (
    <>
      <HomeShowcaseSection products={featuredProducts} />
      <CategorySection categories={categories} />
      <Newarrival products={newArrivals} />
      <Trending products={trendingProducts} />
    </>
  );
}

const Page = () => {
  return (
    <main className="flex-1">
      <HeroSection />
      <Suspense fallback={<HomeSectionsSkeleton />}>
        <HomeDataSections />
      </Suspense>
      <Reviews />
      <Heritage />
      <StayConnected />
    </main>
  );
};

export default Page;
