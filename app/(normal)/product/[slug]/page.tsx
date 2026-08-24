import ProductDetails from "@/components/product/ProductDetails";
import ProductDescriptionReviews from "@/components/product/ProductDescriptionReviews";
import YouMayAlsoLike from "@/components/product/YouMayAlsoLike";
import { getProductDetailsBySlug } from "@/services/product.service";
import {
  BadgeCheck,
  Leaf,
  LockKeyhole,
  PackageCheck,
  Truck,
} from "lucide-react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Suspense } from "react";
import { ProductPageSkeleton } from "@/components/skeleton/productPage";

export const revalidate = 7200; // Revalidate every 2 hours
export const dynamic = "force-static";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const benefits = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Get free shipping on orders above ₹500",
  },
  {
    icon: BadgeCheck,
    title: "Premium Quality",
    description: "Finest Fabrics",
  },
  {
    icon: PackageCheck,
    title: "Delivery in 6–7 Days",
    description: "Your order will be delivered within 6–7 days.",
  },
  {
    icon: LockKeyhole,
    title: "Secure Payment",
    description: "Fast & Secure",
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const productName = titleFromSlug(slug);

  return {
    title: `${productName} | Roopshree`,
    description: `Buy ${productName} online at Roopshree`,
    alternates: {
      canonical: `https://roopshreebandhej.com/product/${slug}`,
    },
  };
}

function BenefitsSection() {
  return (
    <section className="bg-white py-6">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="mt-5 grid gap-x-8 gap-y-8 rounded-[4px] border border-[#ead8c5] bg-[#fcf8f1] px-8 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-12">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div key={title} className="space-y-1.5 text-[#3f2617]">
              <div className=" flex gap-1.5">
                <Icon className="size-5 shrink-0 text-[#c39150]" />
                <h3 className="font-heading text-base uppercase leading-tight">
                  {title}
                </h3>
              </div>
              <p className="mt-1 pl-7 text-xs text-[#3f2617]/90">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function ProductPageContent({ slug }: { slug: string }) {
  const product = await getProductDetailsBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <ProductDetails product={product} />
      <BenefitsSection />
      <ProductDescriptionReviews product={product} />
      <Suspense fallback={null}>
        <YouMayAlsoLike />
      </Suspense>
    </div>
  );
}

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductPageContent slug={slug} />
    </Suspense>
  );
};

export default Page;
