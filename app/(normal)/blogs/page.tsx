import { BlogListingPage } from "@/components/blog/BlogListingPage";
import { getBlogCategories, getBlogs } from "@/services/blog.service";
import { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Roopshree Blog - Bandhej Stories, Styling & Maintenance Tips",
  description:
    "Explore Roopshree's blog for Bandhej craftsmanship stories, saree & dupatta styling tips, fabric care guides, and cultural insights from the heart of Rajasthan.",
  alternates: {
    canonical: "https://roopshreebandhej.com/blogs",
  },
  openGraph: {
    title: "Roopshree Blog - Bandhej Stories, Styling & Maintenance Tips",
    description:
      "Explore Roopshree's blog for Bandhej craftsmanship stories, saree & dupatta styling tips, fabric care guides, and cultural insights from the heart of Rajasthan.",
    url: "https://roopshreebandhej.com/blogs",
    type: "website",
    images: [{ url: "https://roopshreebandhej.com/blog/blog-bg.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roopshree Blog - Bandhej Stories, Styling & Maintenance Tips",
    description:
      "Explore Roopshree's blog for Bandhej craftsmanship stories, saree & dupatta styling tips, fabric care guides, and cultural insights from the heart of Rajasthan.",
  },
};

type BlogSearchParams = Promise<{
  category?: string;
  search?: string;
}>;

function BlogListingSkeleton() {
  return (
    <main className="flex-1 bg-white pt-16">
      <section className="relative isolate min-h-[460px] overflow-hidden bg-[#f7eadb] md:min-h-[520px]">
        <div className="mx-auto flex min-h-[460px] max-w-7xl items-center px-5 py-14 sm:px-6 md:min-h-[520px] lg:px-8">
          <div className="w-full max-w-xl space-y-5">
            <div className="h-4 w-36 animate-pulse rounded bg-[#e6cdae]" />
            <div className="h-16 w-[min(30rem,100%)] animate-pulse rounded bg-[#e6cdae]" />
            <div className="h-16 w-[min(24rem,88%)] animate-pulse rounded bg-[#e6cdae]" />
            <div className="h-4 w-[min(28rem,100%)] animate-pulse rounded bg-[#e6cdae]" />
            <div className="h-4 w-[min(24rem,90%)] animate-pulse rounded bg-[#e6cdae]" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 md:py-12 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-8 w-24 animate-pulse rounded-full bg-[#f4eadf]"
              />
            ))}
          </div>
          <div className="h-9 w-full animate-pulse rounded-full bg-[#f4eadf] sm:w-72" />
        </div>
        <div className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <article key={index} className="space-y-3">
              <div className="aspect-[0.82] animate-pulse bg-[#f4eadf]" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-[#f4eadf]" />
              <div className="h-4 w-full animate-pulse rounded bg-[#f4eadf]" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-[#f4eadf]" />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

async function BlogContent({
  searchParams,
}: {
  searchParams?: BlogSearchParams;
}) {
  const params = await searchParams;
  const [posts, categories] = await Promise.all([
    getBlogs({
      categorySlug: params?.category,
      search: params?.search,
    }),
    getBlogCategories(),
  ]);

  return (
    <BlogListingPage
      posts={posts}
      categories={categories}
      activeCategory={params?.category}
      search={params?.search}
    />
  );
}

function Blogs({ searchParams }: { searchParams?: BlogSearchParams }) {
  return (
    <Suspense fallback={<BlogListingSkeleton />}>
      <BlogContent searchParams={searchParams} />
    </Suspense>
  );
}

export default Blogs;
