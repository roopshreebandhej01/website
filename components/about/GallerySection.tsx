"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import { galleryItems } from "./about-data";

const GallerySection = () => {
  const extendedGalleryItems = [...galleryItems, ...galleryItems];
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <section className="bg-[#faf8f5] py-12 text-[#17110d] sm:py-16 lg:py-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl leading-tight sm:text-4xl lg:text-5xl text-[#17110d]">
          Gallery
        </h2>
        <p className="mx-auto mt-4 max-w-[50rem] text-xs font-medium leading-relaxed text-[#17110d]/80 sm:text-sm md:text-base">
          Step into our gallery of timeless Bandhej artistry, showcasing
          handcrafted sarees and dupattas that beautifully blend traditional
          craftsmanship with modern elegance and refined luxury.
        </p>

        <div className="mt-12 px-2 sm:px-6 md:px-10 relative">
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              nextEl: ".swiper-button-next-custom",
              prevEl: ".swiper-button-prev-custom",
            }}
            autoplay={
              isMobile
                ? {
                    delay: 5000, // wait 5 seconds before sliding
                    disableOnInteraction: false,
                  }
                : false
            }
            speed={1200} // 1.2 seconds smooth glide animation
            loop={true}
            spaceBetween={16}
            slidesPerView={1.25}
            slidesPerGroup={1}
            centeredSlides={true}
            breakpoints={{
              640: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                centeredSlides: false,
              },
              768: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                centeredSlides: false,
              },
              1024: {
                slidesPerView: 4,
                slidesPerGroup: 4,
                centeredSlides: false,
              },
              1280: {
                slidesPerView: 5,
                slidesPerGroup: 5,
                centeredSlides: false,
              },
            }}
            className="relative w-full group/carousel"
          >
            {extendedGalleryItems.map((item, index) => (
              <SwiperSlide key={`${item.src}-${index}`}>
                <div className="relative aspect-[4/5] overflow-hidden border-[6px] border-[#f3e6d5] bg-[#eadac6] shadow-sm transition-all duration-300 md:hover:border-[#eadac6]/80 md:hover:shadow-md group/card">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    height={700}
                    width={700}
                    className={`object-cover transition-transform duration-700 ease-out md:group-hover/card:scale-105 ${item.className}`}
                  />
                </div>
              </SwiperSlide>
            ))}

            {/* Custom Navigation Buttons */}
            <button className="swiper-button-prev-custom hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-100 pointer-events-auto transition-all duration-300 border-[#c39150] text-[#3f2617] bg-[#faf8f5]/90 hover:bg-[#c39150] hover:text-white hover:border-[#c39150] focus-visible:ring-0 focus-visible:outline-none focus:outline-none active:scale-95 size-10 rounded-full items-center justify-center cursor-pointer">
              <ChevronLeft className="size-5" />
            </button>
            <button className="swiper-button-next-custom hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 opacity-100 pointer-events-auto transition-all duration-300 border-[#c39150] text-[#3f2617] bg-[#faf8f5]/90 hover:bg-[#c39150] hover:text-white hover:border-[#c39150] focus-visible:ring-0 focus-visible:outline-none focus:outline-none active:scale-95 size-10 rounded-full items-center justify-center cursor-pointer">
              <ChevronRight className="size-5" />
            </button>
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
