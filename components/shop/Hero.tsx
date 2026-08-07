"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const HeroSection = () => {
  return (
    <section className="relative isolate mt-16 overflow-hidden bg-[#d6965f] md:mt-0 md:h-auto md:min-h-svh">
      <Image
        src="/new_banners/image 279.png"
        alt="Bandhej saree collection"
        fill
        priority
        sizes="100vw"
        className="hidden object-cover object-center md:block"
      />
      <div className="relative aspect-[1023/1450] overflow-hidden md:hidden">
        <Image
          src="/new_banners/bandhej_saree_mobile.png"
          alt="Bandhej saree collection"
          height={700}
          width={700}
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 z-[1] bg-white/15 md:hidden" />

      <div className="absolute inset-x-0 top-0 z-[3] mx-auto flex max-w-7xl items-start px-3.5 pb-10 pt-10 sm:px-6 md:relative md:min-h-svh md:items-center md:px-8 md:py-20 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}
          className="max-w-[17.25rem] text-left md:max-w-xl lg:max-w-2xl"
        >
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mb-2 font-heading text-[0.64rem] uppercase tracking-[0.18em] text-[#C39150] md:mb-4 md:text-sm md:tracking-[0.32em]"
          >
            COLLECTION
          </motion.p>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="-ml-[0.1em] font-heading text-[2.65rem] leading-[0.9] text-[#3F2617] sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Discover Timeless
            <span className="block font-heading italic text-[#C18F50] sm:text-4xl md:text-5xl lg:text-7xl">
              Indian Ethnic Wear
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-4 max-w-[16rem] text-[0.68rem] leading-[1.45] text-[#3F2617]/75 md:mt-6 md:max-w-md md:text-base md:leading-6 md:text-[#535456]"
          >
            Explore our carefully curated collection of handcrafted sarees,
            suits, lehengas, and ethnic essentials—where tradition meets
            contemporary elegance.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
