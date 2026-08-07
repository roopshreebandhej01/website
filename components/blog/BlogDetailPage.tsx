import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  LinkIcon,
  Mail,
  MessageCircle,
  UserRound,
} from "lucide-react";

import { BlogCard } from "@/components/blog/BlogListingPage";
import { NewsletterSignupForm } from "@/components/common/NewsletterSignupForm";
import type { BlogView } from "@/services/blog.service";

export function BlogDetailPage({
  post,
  relatedPosts,
  morePosts,
}: {
  post: BlogView;
  relatedPosts: BlogView[];
  morePosts: BlogView[];
}) {
  return (
    <main className="flex-1 bg-white pt-16">
      <article className="mx-auto max-w-5xl px-5 py-10 sm:px-6 md:py-14 lg:px-8">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#C39150]">
            <Link href="/blogs" className="hover:text-[#3F2617]">
              Blogs
            </Link>
            <span>/</span>
            <span>{post.category}</span>
          </div>

          <h1 className="mt-5 font-heading text-3xl font-semibold leading-tight text-[#3F2617] md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#3F2617]/70">
            {post.excerpt}
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
          <div className="min-w-0">
            <div className="relative aspect-[1.55] overflow-hidden rounded-[3px] bg-[#f7eadb]">
              {post.image ? (
                <Image
                  src={post.image}
                  alt={post.title}
                  height={700}
                  width={700}
                  priority
                  sizes="(min-width: 1024px) 760px, 100vw"
                  className="object-cover object-top"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-[#3F2617]/70">
                  Blog image coming soon
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#3F2617]/70">
              <span className="inline-flex items-center gap-2">
                <UserRound className="size-4 text-[#C39150]" />
                {post.author}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4 text-[#C39150]" />
                {post.date}
              </span>
            </div>

            <div className="mt-7 space-y-5 text-sm leading-7 text-[#3F2617]/78">
              {post.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            {post.tags.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#C39150] px-4 py-1.5 text-xs font-medium text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="space-y-6">
            <AuthorCard post={post} />
            <RelatedArticles posts={relatedPosts} />
            <BlogSignup />
          </aside>
        </div>
      </article>

      {morePosts.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 md:pb-20 lg:px-8">
          <div className="mb-7 flex items-center justify-between gap-4">
            <h2 className="font-heading text-2xl font-semibold text-[#3F2617]">
              More to Explore
            </h2>
            <Link
              href="/blogs"
              className="text-xs font-semibold text-[#C39150] hover:text-[#3F2617]"
            >
              View All Blogs
            </Link>
          </div>
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {morePosts.map((item) => (
              <BlogCard key={item.slug} post={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function AuthorCard({ post }: { post: BlogView }) {
  return (
    <section className="bg-[#3F2617] p-5 text-white">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-[#C39150] text-sm font-semibold">
          {post.author
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </span>
        <div>
          <h2 className="text-sm font-semibold">{post.author}</h2>
          <p className="text-xs text-white/65">{post.authorRole}</p>
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-white/75">
        Rajan shares stories on textile heritage, styling ideas, and the
        evolving language of handcrafted Indian occasion wear.
      </p>
    </section>
  );
}

function RelatedArticles({ posts }: { posts: BlogView[] }) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="font-heading text-lg font-semibold text-[#3F2617]">
        Related Articles
      </h2>
      <div className="mt-4 space-y-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blogs/${post.slug}`}
            className="grid grid-cols-[64px_minmax(0,1fr)] gap-3"
          >
            <div className="relative aspect-square overflow-hidden bg-[#f7eadb]">
              {post.image ? (
                <Image
                  src={post.image}
                  alt={post.title}
                  height={700}
                  width={700}
                  sizes="64px"
                  className="object-cover object-top"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-[#3F2617]/60">
                  No image
                </div>
              )}
            </div>
            <div>
              <h3 className="line-clamp-2 text-xs font-semibold leading-5 text-[#3F2617]">
                {post.title}
              </h3>
              <p className="mt-1 text-[11px] text-[#3F2617]/55">{post.date}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function BlogSignup() {
  return (
    <section className="bg-[#3F2617] p-5 text-white">
      <h2 className="font-heading text-lg font-semibold">Stay Updated</h2>
      <p className="mt-2 text-xs leading-5 text-white/70">
        Get textile stories and styling inspiration delivered to your inbox.
      </p>
      <div className="mt-4">
        <NewsletterSignupForm
          inputClassName="h-10 w-full border border-white/20 bg-white/10 px-3 text-xs outline-none placeholder:text-white/50"
          buttonClassName="mt-3 h-10 w-full rounded-none bg-[#C39150] text-xs font-semibold text-white hover:bg-white hover:text-[#3F2617]"
          buttonText="Subscribe"
          pendingText="Subscribing..."
          placeholder="Your email"
          errorClassName="text-xs font-medium text-red-200"
        />
      </div>
    </section>
  );
}
