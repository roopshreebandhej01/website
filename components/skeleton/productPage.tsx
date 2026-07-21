import { BadgeCheck, Leaf, LockKeyhole, Truck } from "lucide-react";

export function ProductPageSkeleton() {
  return (
    <div>
      <section className="bg-white pb-14 pt-24 text-[#111] md:pt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 h-4 w-56 animate-pulse rounded bg-[#f4eadf]" />
          <div className="grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-7">
            <div className="min-w-0">
              <div className="aspect-[0.83] animate-pulse bg-[#f2e4d7] sm:aspect-[0.78] lg:aspect-[0.83]" />
              <div className="mt-7 flex gap-4 overflow-hidden">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 w-20 shrink-0 animate-pulse rounded-[4px] bg-[#f4eadf]"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-5">
              <div className="h-4 w-32 animate-pulse rounded bg-[#f4eadf]" />
              <div className="h-10 w-4/5 animate-pulse rounded bg-[#f4eadf]" />
              <div className="h-6 w-40 animate-pulse rounded bg-[#f4eadf]" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-[#f4eadf]" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-[#f4eadf]" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-10 animate-pulse rounded-[4px] bg-[#f4eadf]"
                  />
                ))}
              </div>
              <div className="h-12 w-full animate-pulse rounded-[4px] bg-[#e6cdae]" />
              <div className="h-12 w-full animate-pulse rounded-[4px] bg-[#f4eadf]" />
            </div>
          </div>
        </div>
      </section>
      <BenefitsSection />
      <section className="bg-white py-10">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="h-8 w-64 animate-pulse rounded bg-[#f4eadf]" />
          <div className="mt-5 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-[#f4eadf]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[#f4eadf]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#f4eadf]" />
          </div>
        </div>
      </section>
    </div>
  );
}

function BenefitsSection() {
  return (
    <section className="bg-white py-6">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="mt-5 grid gap-x-8 gap-y-8 rounded-[4px] border border-[#ead8c5] bg-[#fcf8f1] px-8 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-12">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-center gap-5 text-[#3f2617]">
              <Icon className="size-9 shrink-0 text-[#c39150]" />
              <div>
                <h3 className="font-heading text-base uppercase leading-tight  xl:text-sm">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-[#3f2617]/90">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const benefits = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "With Love & Tradition",
  },
  {
    icon: BadgeCheck,
    title: "Premium Quality",
    description: "Finest Fabrics",
  },
  {
    icon: Leaf,
    title: "Natural Dyes",
    description: "Eco-Friendly Colours",
  },
  {
    icon: LockKeyhole,
    title: "Secure Payment",
    description: "Fast & Secure",
  },
];
