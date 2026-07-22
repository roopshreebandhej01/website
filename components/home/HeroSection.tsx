"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const HeroSection = () => {
  return (
    <section className="relative isolate mt-16 min-h-[calc(100svh-64px)] overflow-hidden bg-[#C39150]/10 md:mt-0 md:min-h-svh">
      <Image

        sizes="100vw"

        fill

        src="/new_banners/image 278.png"

        alt="Bandhej saree collection"

        priority

        className="hidden object-cover object-center md:block"

      />
      <div className="absolute inset-0 md:hidden">
        <Image

          sizes="100vw"

          fill

          src="/new_banners/hero_banner_mobile.png"

          alt="Bandhej saree collection"

          priority

          className="object-cover object-top"

        />
      </div>
      <div className="absolute inset-0 bg-white/10 md:hidden" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-[#C39150]/10 to-transparent md:hidden" />

      <div className="relative mx-auto flex min-h-[calc(100svh-64px)] max-w-7xl items-start justify-center px-4 pb-0 pt-9 sm:px-6 md:min-h-svh md:items-center md:justify-start md:py-20 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}
          className="mx-auto max-w-[20.5rem] text-center md:mx-0 md:max-w-xl md:text-left"
        >
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mb-2 text-[0.64rem]  font-medium uppercase tracking-[0.18em] text-[#C39150] md:mb-4 md:text-sm md:tracking-[0.32em] font-serif"
          >
            Timeless Tradition
          </motion.p>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="-ml-[0.1em] font-heading text-[2.65rem] leading-[0.9] text-[#3F2617] sm:text-5xl md:text-6xl lg:text-7xl"
          >
            BANDHEJ
            <span className="block text-[#C18F50] sm:text-5xl md:text-6xl lg:text-6xl">
              Sarees and dupattas
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mx-auto mt-4 max-w-[18.5rem] text-[0.68rem] leading-[1.45] text-[#3F2617]/75 md:mx-0 md:mt-6 md:max-w-md md:text-base md:leading-6"
          >
            <span className="md:hidden">
              Rooted in the vibrant culture of Rajasthan, Roopshree is a
              celebration of heritage, handcraft and timeless elegance.
            </span>
            <span className="hidden md:inline">
              Discover the art of Bandhej, where every knot tells a story of
              heritage and elegance.
            </span>
          </motion.p>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mx-auto mt-3 max-w-[18.5rem] text-[0.68rem] leading-[1.45] text-[#3F2617]/75 md:hidden"
          >
            Every piece we create is a blend of tradition, craftsmanship and
            feminine grace.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-6 flex justify-center md:mt-8 md:justify-start"
          >
            <Button
              asChild
              className="h-9 bg-[#C39150] px-6 text-xs text-white shadow-lg shadow-[#3F2617]/15 hover:bg-[#3F2617] md:h-11 md:px-7 md:text-sm"
            >
              <Link href="/shop">
                <span className="md:hidden">Explore Collection</span>
                <span className="hidden md:inline">Shop </span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
