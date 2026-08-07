import Image from "next/image";

import { missionCards } from "./about-data";

const MissionSection = () => {
  return (
    <section className="relative isolate overflow-hidden bg-white py-12 text-[#17110d] sm:py-16 lg:py-20">
      <Image
        src="/about/missionbg.png"
        alt=""
        height={700}
        width={700}
        sizes="100vw"
        className="object-cover w-full h-full absolute inset-0 object-center"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl leading-tight sm:text-4xl lg:text-5xl text-[#17110d]">
            Mission and craft philosophy
          </h2>
          <p className="mx-auto mt-2 max-w-[34rem] text-[0.62rem] font-medium leading-4 sm:text-lg">
            Each piece reflects a commitment to elegance.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {missionCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="min-h-44 border border-[#dfc9b4] bg-[#f7efe7]/95 p-7 text-[#3f2617] shadow-sm"
              >
                <Icon className="size-4 text-[#c39150]" strokeWidth={1.5} />
                <h3 className="mt-6 font-heading text-xl leading-tight text-[#3f2617]">
                  {card.title}
                </h3>
                <p className="mt-3 text-[0.7rem] font-medium leading-[1.55] text-[#3f2617]/75 sm:text-xs">
                  {card.text}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
