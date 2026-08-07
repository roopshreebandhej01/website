"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const reviews = [
  {
    quote:
      "I had a very good experience with them.💫 The response was great and the product quality is excellent. They have an amazing collection and one must definitely check out their products. The embroidery work is very fine, detailed and beautifully done. They are also very cooperative and responsive, especially when it comes to customization. You can completely trust them and confidently buy their products. Overall a wonderful experience—highly recommended!💫",
    name: "Pratibha soni",
  },
  {
    quote:
      "Very nice previously I am sacred about quality of product when I received it it got 💯 marks I loved it",
    name: "Amita Gupta",
  },
  {
    quote:
      "I recently had the pleasure of visiting roop shree, a delightful traditional shop nestled in Sikar (Raj).The shop's commitment to preserving tradition is evident in its carefully curated selection of Peela Chunri, each one reflecting quality craftsmanship and attention to detail. The staff's friendly demeanor and extensive knowledge added to the overall experience, making me feel like a valued customer. It's a true gem in the modern world of retail.",
    name: "Kavita Agarwal",
  },
  {
    quote:
      "Super happy with the product that I have recieved, the behaviour is so comforting and assisting ...thank you sooo much",
    name: "Nilam Rani",
  },
];

const Divider = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "mx-auto flex w-44 items-center justify-center gap-2 text-[#c39150]",
      className,
    )}
  >
    <span className="h-px flex-1 bg-linear-to-r from-transparent to-[#c39150]" />
    <span className="size-2 rotate-45 bg-[#C39150]" />
    <span className="h-px flex-1 bg-linear-to-l from-transparent to-[#c39150]" />
  </div>
);

const ReviewCard = ({ review }: { review: (typeof reviews)[number] }) => {
  return (
    <article
      className="flex min-h-[11.5rem] flex-col rounded-[6px] border border-[#d5b88d]/35 bg-[#eadac6] px-5 py-5 text-center text-[#3f2617] ring-1 ring-white/35 sm:min-h-[15.75rem] sm:px-6 sm:py-6"
      style={{
        boxShadow:
          "0 3px 10px rgba(63, 38, 23, 0.10), 0 10px 20px rgba(63, 38, 23, 0.14)",
      }}
    >
      <div className="flex justify-center gap-1.5 text-[#c39150] sm:gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className="size-4 fill-current sm:size-6"
            strokeWidth={1.2}
          />
        ))}
      </div>

      <p className="mx-auto mt-4 max-w-[14rem] line-clamp-4 font-medium leading-[1.22] sm:mt-5 sm:max-w-[16rem] sm:text-[0.88rem] sm:leading-[1.45]">
        &ldquo;{review.quote}&rdquo;
      </p>

      <Divider className="mt-auto w-28 sm:mt-6 sm:w-36" />

      <h3 className="font-heading mt-3 w-full text-center text-base font-semibold leading-none sm:mt-5 sm:text-xl">
        {review.name}
      </h3>
    </article>
  );
};

const Reviews = () => {
  const [api, setApi] = React.useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (!api) return;

    const update = () => {
      setSelectedIndex(api.selectedScrollSnap());
      setScrollSnaps(api.scrollSnapList());
    };

    const frame = requestAnimationFrame(update);
    api.on("select", update);
    api.on("reInit", update);

    return () => {
      cancelAnimationFrame(frame);
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  return (
    <section className="relative isolate overflow-hidden bg-[#f8ead7] py-8 sm:py-10 md:py-12">
      <Image
        src="/home/reviews_bg.png"
        alt=""
        height={700}
        width={700}
        sizes="100vw"
        className=" w-full h-auto absolute inset-0 object-cover object-center"
      />

      <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="text-center">
          <Image
            src="/about/timelesselegance.png"
            alt=""
            width={83}
            height={67}
            className="mx-auto h-6 w-7 object-contain sm:h-9 sm:w-11"
          />
          <p className="mt-2 text-[0.5rem] font-semibold uppercase tracking-[0.34em] text-black sm:mt-3 sm:text-xs sm:tracking-[0.36em]">
            In Their Words
          </p>
          <h2 className="mt-3 font-semibold text-2xl leading-tight text-black sm:text-5xl">
            Loved by Our Customers
          </h2>
          <Divider className="mt-3 hidden w-36 sm:flex" />
          <p className="mx-auto mt-2 max-w-[18rem] text-[0.62rem] font-medium leading-4 text-black sm:max-w-none sm:text-lg">
            Real Stories from women who cherish the grace of Roopshree Bandhej
          </p>
        </div>

        <Carousel
          setApi={setApi}
          opts={{
            align: "center",
            loop: true,
          }}
          className="mx-auto mt-4 max-w-[68rem] sm:mt-5"
        >
          <CarouselContent className="-ml-0 py-4 sm:py-5">
            {reviews.map((review, index) => (
              <CarouselItem
                key={`${review.name}-${index}`}
                className="basis-full px-4 sm:basis-1/2 sm:px-3 lg:basis-1/3"
              >
                <ReviewCard review={review} />
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="left-0 top-1/2 z-10 size-9 -translate-y-1/2 border-0 bg-[#3F2617] text-white shadow-lg hover:bg-[#C39150] hover:text-white disabled:opacity-100 sm:-left-16 sm:size-16">
            <ChevronLeft className="size-5 sm:size-8" />
          </CarouselPrevious>
          <CarouselNext className="right-0 top-1/2 z-10 size-9 -translate-y-1/2 border-0 bg-[#3F2617] text-white shadow-lg hover:bg-[#C39150] hover:text-white disabled:opacity-100 sm:-right-16 sm:size-16">
            <ChevronRight className="size-5 sm:size-8" />
          </CarouselNext>
        </Carousel>

        <div className="mt-4 flex items-center justify-center gap-1.5 sm:mt-5">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to review ${index + 1}`}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-2 rounded-full bg-[#C39150] transition-all",
                selectedIndex === index ? "w-7" : "w-2 opacity-80",
              )}
            />
          ))}
        </div>

        <p className="mx-auto mt-5 max-w-2xl text-center font-heading text-base leading-6 text-[#3f2617] sm:mt-6 sm:text-xl">
          Thank you for being a part of out journey.
          <span className="block font-heading italic text-[#c39150]">
            Your trust inspires us every day.
          </span>
        </p>
      </div>
    </section>
  );
};

export default Reviews;
