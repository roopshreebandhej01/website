import { BlogDetailPage } from "@/components/blog/BlogDetailPage"
import { getBlogBySlug, getBlogDetailPageData } from "@/services/blog.service"
import { notFound } from "next/navigation"

export const dynamic = "force-static"
export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogBySlug(slug)

  return {
    title: post ? `${post.title} | Roop Shree` : "Blog | Roop Shree",
    description: post?.excerpt,
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const pageData = await getBlogDetailPageData(slug)

  if (!pageData) {
    notFound()
  }

  return <BlogDetailPage {...pageData} />
}
