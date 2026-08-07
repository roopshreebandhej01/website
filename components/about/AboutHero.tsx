import Image from "next/image";

const AboutHero = () => {
  return (
    <section className="relative isolate mt-16 overflow-hidden bg-[#f4e6d8] md:mt-0 md:min-h-svh">
      <Image
        sizes="100vw"
        fill
        src="/new_banners/image 277.png"
        alt="Roopshree Bandhej about hero"
        priority
        className="hidden object-cover object-center md:block"
      />
      <div className="relative aspect-[903/1600] overflow-hidden md:hidden">
        <Image
          sizes="100vw"
          height={700}
          width={700}
          src="/new_banners/about_us_mobile.png"
          alt="Roopshree Bandhej about hero"
          priority
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 z-[1] bg-white/15 md:hidden" />

      <div className="absolute inset-x-0 top-0 z-[3] mx-auto flex max-w-7xl items-start px-5 pt-10 sm:px-6 md:relative md:min-h-svh md:items-center md:px-8 md:py-20">
        <div className="w-full max-w-[21rem] text-[#3f2617] sm:max-w-md md:max-w-2xl">
          <p className="mb-2 font-heading text-[0.64rem] font-medium uppercase tracking-[0.18em] text-[#c39150] md:mb-4 md:text-sm md:tracking-[0.32em]">
            About Us
          </p>

          <h1 className="-ml-[0.04em] font-heading text-[2.65rem] leading-[0.94] text-[#3f2617] sm:text-5xl md:text-6xl lg:text-7xl">
            A STORY OF
            <span className="block italic text-[#c18f50] sm:text-6xl md:text-7xl lg:text-8xl">
              Roopshree
            </span>
          </h1>

          <div className="mt-4 max-w-[19.25rem] space-y-3 text-[0.68rem] leading-[1.45] text-[#3f2617]/75 md:mt-6 md:max-w-[28rem] md:space-y-5 md:text-base md:leading-6">
            <p>
              Rooted in the vibrant culture of Rajasthan, Roopshree is a
              celebration of heritage, handcraft and timeless elegance.
            </p>
            <p>
              Every piece we create is a blend of tradition, craftsmanship and
              feminine grace.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
