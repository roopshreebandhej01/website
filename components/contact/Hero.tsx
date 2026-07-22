"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

const HeroSection = () => {
  return (
    <section className="relative isolate mt-16 overflow-hidden bg-[#f6eadf] md:mt-0 md:min-h-svh">
      <Image
        src="/new_banners/image 276.png"
        alt="Roop Shree Bandhej contact hero"
        fill
        priority
        sizes="100vw"
        className="hidden object-cover object-center md:block"
      />
      <div className="relative aspect-[1023/1450] overflow-hidden md:hidden">
        <Image
          src="/new_banners/image 276.png"
          alt="Roop Shree Bandhej contact hero"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 z-[1] bg-white/15 md:hidden" />

      <div className="absolute inset-x-0 top-0 z-[3] mx-auto flex max-w-7xl items-start px-3.5 pt-10 sm:px-6 md:relative md:min-h-svh md:items-center md:px-8 md:py-20 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}
          className="w-full max-w-[21.5rem] text-left md:max-w-xl lg:max-w-2xl"
        >
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mb-2 font-heading text-[0.64rem] font-medium uppercase tracking-[0.18em] text-[#C39150] md:mb-4 md:text-sm md:tracking-[0.32em]"
          >
            Contact Us
          </motion.p>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="-ml-[0.04em] text-[2.65rem] leading-[0.92] text-[#3F2617] sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Where Heritage Meets <span className="text-[#C18F50] italic ">Elegance</span>
          </motion.h1>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-4 space-y-3 text-[0.68rem] leading-[1.45] text-[#5f6166] md:mt-6 md:max-w-xl md:space-y-6 md:text-base md:leading-6"
          >
            <p>
              We&apos;d love to hear from you and assist with anything you
              need. Whether you have questions about our collections, custom
              orders, collaborations, shipping, or support.
            </p>
            <p>
              Our team is always here to help you with a smooth and delightful
              Roopshree Bandhej experience.
            </p>
          </motion.div>

          {/* <motion.div
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-6 md:hidden"
          >
            <Button
              asChild
              className="h-9 rounded-none bg-[#C39150] px-6 text-xs font-medium text-white shadow-lg shadow-[#3F2617]/15 hover:bg-[#3F2617]"
            >
              <Link href="/contact">Connect With Us</Link>
            </Button>
          </motion.div> */}
        </motion.div>
      </div>
    </section>
  )
}

export default HeroSection
