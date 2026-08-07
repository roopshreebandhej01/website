import Image from "next/image";

import { qualityItems } from "./about-data";

const QualityHighlights = () => {
  return (
    <section className="bg-[#4a2a19] py-12 text-white sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl leading-tight sm:text-4xl">
          Quality Highlights
        </h2>

        <div className="mx-auto mt-10 grid max-w-6xl gap-10 sm:grid-cols-3 sm:gap-8 lg:mt-14">
          {qualityItems.map((item) => (
            <article key={item.title} className="mx-auto max-w-[19rem]">
              <div className="relative mx-auto size-32 overflow-hidden rounded-full border-2 border-white bg-[#f7eadb] sm:size-36">
                <Image
                  src={item.image}
                  alt={item.title}
                  height={700}
                  width={700}
                  sizes="144px"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-7 font-heading text-xl leading-tight text-[#c39150] sm:text-2xl">
                {item.title}
              </h3>
              <p className="mx-auto mt-3 text-[0.68rem] font-medium leading-[1.55] text-white/85 sm:text-xs">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QualityHighlights;
