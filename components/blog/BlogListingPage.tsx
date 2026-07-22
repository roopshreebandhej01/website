import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Search, UserRound } from "lucide-react";

import type { BlogCategoryView, BlogView } from "@/services/blog.service";

export function BlogListingPage({
  posts,
  categories,
  activeCategory,
  search,
}: {
  posts: BlogView[];
  categories: BlogCategoryView[];
  activeCategory?: string;
  search?: string;
}) {
  return (
    <main className="flex-1 bg-white pt-16">
      <BlogHero />
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 md:py-12 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/blogs"
              className={`inline-flex h-8 items-center rounded-full border px-6 text-xs font-semibold transition ${
                !activeCategory
                  ? "border-[#C39150] bg-[#C39150] text-white"
                  : "border-transparent text-[#3F2617] hover:border-[#C39150]"
              }`}
            >
              All
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/blogs?category=${category.slug}`}
                className={`inline-flex h-8 items-center rounded-full border px-6 text-xs font-semibold transition ${
                  activeCategory === category.slug
                    ? "border-[#C39150] bg-[#C39150] text-white"
                    : "border-transparent text-[#3F2617] hover:border-[#C39150]"
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>

          <form action="/blogs" className="sm:w-72">
            {activeCategory ? (
              <input type="hidden" name="category" value={activeCategory} />
            ) : null}
            <label className="flex h-9 w-full items-center gap-2 rounded-full border border-[#3F2617]/45 bg-white px-4 text-xs text-[#3F2617]">
              <input
                name="search"
                type="search"
                defaultValue={search}
                placeholder="Search blog"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#3F2617]/70"
              />
              <Search className="size-4" />
            </label>
          </form>
        </div>

        {posts.length > 0 ? (
          <div className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-8 border border-[#ead8c5] bg-[#fcf8f1] px-5 py-10 text-center text-sm font-medium text-[#3f2617]">
            No blogs found in the database.
          </div>
        )}
      </section>
    </main>
  );
}

function BlogHero() {
  return (
    <section className="relative isolate min-h-[460px] overflow-hidden md:min-h-[520px]">
      <Image

        sizes="100vw"

        fill

        src="/new_banners/image 274.png"

        alt=""

        priority

        className="-z-10 hidden object-cover object-center md:block"

      />
      <Image

        sizes="100vw"

        fill

        src="/new_banners/blog-mobile.png"

        alt=""

        priority

        className="-z-10 block object-cover object-center md:hidden"

      />
      <div className="mx-auto flex min-h-[460px] max-w-7xl items-center px-5 py-14 sm:px-6 md:min-h-[520px] lg:px-8">
        <div className="max-w-xl text-[#3F2617]">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#C39150]">
            Blogs / Journal
          </p>
          <h1 className="-ml-[0.04em] mt-4 font-heading text-[3rem] leading-[0.95] text-[#3F2617] sm:text-6xl md:text-7xl">
            Stories Woven
            <span className="block italic text-[#C39150]">In Tradition</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-6 text-[#3F2617]/75">
            Discover the timeless beauty of Bandhej through our carefully
            curated stories, style inspiration, and cultural insights.
          </p>
          <p className="mt-5 max-w-lg text-sm leading-6 text-[#3F2617]/75">
            From traditional craftsmanship and heritage-rich techniques to
            modern styling tips, care guides, and behind-the-scenes moments,
            explore the journey of authentic Bandhej and the spirit of
            Rajasthan.
          </p>
        </div>
      </div>
    </section>
  );
}

export function BlogCard({ post }: { post: BlogView }) {
  return (
    <article className="group min-w-0">
      <Link href={`/blogs/${post.slug}`} className="block">
        <div className="relative aspect-[0.82] overflow-hidden bg-[#f7eadb]">
          {post.image ? (
            <Image

              width={400}

              height={488}

              src={post.image}
              alt={post.title}
              className="object-cover object-top transition duration-500 group-hover:scale-[1.04]"

            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-[#3F2617]/70">
              Blog image coming soon
            </div>
          )}
        </div>
        <h2 className="mt-4 font-heading text-sm font-semibold leading-snug text-[#3F2617]">
          {post.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#3F2617]/70">
          {post.excerpt}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#3F2617]/75">
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5 text-[#C39150]" />
            {post.author}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-[#C39150]" />
            {post.date}
          </span>
        </div>
      </Link>
    </article>
  );
}
