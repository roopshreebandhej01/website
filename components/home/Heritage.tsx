import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

const stats = [
  {
    value: "40+",
    label: "Years of Craft",
  },
  {
    value: "200+",
    label: "Master Artisans",
  },
  {
    value: "50K+",
    label: "Happy Customers",
  },
];

const Divider = () => (
  <div className="flex w-64 items-center justify-start gap-3 text-[#c39150]">
    <span className="h-px w-[9.5rem] bg-linear-to-r from-transparent via-[#c39150] to-[#c39150]" />
    <span className="size-2.5 shrink-0 rotate-45 bg-[#C39150]" />
    <span className="h-px w-[9.5rem] bg-linear-to-r from-[#c39150] via-[#c39150]/70 to-transparent" />
  </div>
);

const Heritage = () => {
  return (
    <section className="bg-white py-10 sm:py-14 lg:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-9 px-5 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:gap-16 lg:px-8">
        <div className="order-2 mx-auto w-full max-w-[365px] lg:order-1 lg:max-w-[31rem]">
          <Image
            src="/new_banners/image 291.png"
            alt="Artisan tying Bandhej fabric by hand"
            width={365}
            height={482}
            className="h-auto w-full"
          />
        </div>

        <div className="order-1 text-[#17110d] lg:order-2">
          <div className="flex items-center gap-3">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-[#3f2617]">
              Our Heritage
            </p>
            <span className="h-px w-20 bg-linear-to-r from-[#3f2617] via-[#c39150]/45 to-transparent sm:w-28" />
          </div>

          <h2 className="mt-4 max-w-[32rem] font-semibold text-2xl leading-[1.04] text-black sm:text-5xl lg:text-6xl">
            Weaving Stories of Tradition
          </h2>
          <p className="mt-3 font-heading text-[1.35rem] italic leading-none text-[#c39150] sm:text-3xl">
            Crafted Since 1980
          </p>

          <div className="mt-5">
            <Divider />
          </div>

          <div className="mt-7 max-w-[36rem] space-y-5 text-[0.72rem] font-medium leading-[1.55] text-gray-800 sm:text-sm lg:text-base">
            <p>
              Roopshree celebrates the timeless art of Bandhani, where every
              knot tells a story passed down through generations. Handcrafted by
              master artisans, our pieces honor a heritage rooted in
              Rajasthan&apos;s royal legacy.
            </p>
            <p>
              We preserve tradition while embracing contemporary elegance,
              creating Bandhej pieces that resonate with the modern woman who
              values authenticity and artistry.
            </p>
          </div>

          <Button
            asChild
            className="mt-6 h-11 bg-[#C39150] px-7 text-xs font-semibold text-white shadow-none hover:bg-[#3F2617] sm:h-12 sm:px-10 sm:text-base"
          >
            <Link href="/about">
              Discover Our Craft
              <ArrowRight className="size-4" />
            </Link>
          </Button>

          <div className="mt-8 pt-6 sm:mt-10 sm:pt-8">
            <div className="mb-6 h-px w-full bg-linear-to-r from-transparent via-[#c39150]/55 to-transparent sm:mb-8" />
            <div className="grid grid-cols-3 items-center">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="relative text-center text-[#3f2617]"
                >
                  <p className="font-heading text-[1.55rem] font-semibold leading-none text-[#c39150] sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-[0.58rem] font-semibold leading-tight sm:text-sm">
                    {stat.label}
                  </p>

                  {index < stats.length - 1 ? (
                    <div className="absolute right-0 top-1/2 hidden h-16 -translate-y-1/2 items-center sm:flex">
                      <span className="h-full w-px bg-linear-to-b from-transparent via-[#c39150] to-transparent" />
                      <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#C39150]" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Heritage;
