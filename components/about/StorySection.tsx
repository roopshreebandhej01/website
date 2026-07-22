import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import SectionDivider from "./SectionDivider";

const StorySection = () => {
  return (
    <section className="bg-white pb-10 pt-3 text-[#17110d] sm:pb-14 lg:pb-20">
      <div className="mx-auto grid max-w-7xl items-center gap-9 px-5 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:gap-20 lg:px-8">
        <div className="mx-auto w-full max-w-[31rem]">
          <Image
            src="/about/ourstory.png"
            alt="Roopshree red Bandhej styling detail"
            width={670}
            height={770}
            sizes="(min-width: 1024px) 42vw, 92vw"
            className="h-auto w-full"
          />
        </div>

        <div className="text-[#17110d]">
          <div className="flex items-center gap-3">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-[#3f2617]">
              About Us
            </p>
            <span className="h-px w-16 bg-linear-to-r from-[#3f2617] via-[#c39150]/45 to-transparent sm:w-24" />
          </div>

          <p className="mt-4 font-heading text-2xl italic leading-none text-[#c39150] sm:text-3xl">
            Our Story
          </p>

          <h2 className="mt-5 max-w-[37rem] font-heading text-[2.15rem] leading-[1.06] text-black sm:text-5xl lg:text-6xl">
            A Legacy Woven in Every Thread
          </h2>

          <div className="mt-6 max-w-sm sm:max-w-md">
            <SectionDivider />
          </div>

          <div className="mt-8 max-w-[43rem] space-y-5 text-[0.72rem] font-medium leading-[1.6] text-black sm:text-sm lg:text-[0.95rem]">
            <p>
              Roop Shree was established in 1980 in Sikar, Rajasthan, by Mr.
              Suresh Kumar Agarwal with a vision to preserve and celebrate the
              timeless beauty of Bandhej and traditional Indian textiles. What
              began as a small family business has grown into a trusted name,
              offering authentic handcrafted creations that honor generations of
              skilled artisans.
            </p>
            <p>
              At Roop Shree, we don’t simply follow fashion—we preserve
              traditions, celebrate craftsmanship, and create heirloom pieces
              that carry the elegance of Indian heritage from one generation to
              the next.
            </p>
          </div>

          <Button
            asChild
            className="mt-8 h-11 rounded-[2px] bg-[#c39150] px-9 text-xs font-semibold text-white shadow-none hover:bg-[#3f2617] sm:h-12 sm:px-12 sm:text-sm"
          >
            <Link href="/shop">
              Shop Now
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default StorySection;
