import Image from "next/image";
import Link from "next/link";

export type HomeCategory = {
  id?: string;
  name: string;
  href: string;
  image: string;
};

const CategorySection = ({
  categories: fetchedCategories,
}: {
  categories?: HomeCategory[];
}) => {
  const categoryItems = fetchedCategories ?? [];

  return (
    <section className="bg-white py-7 md:pb-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-semibold text-2xl leading-tight text-black sm:text-5xl md:text-6xl">
            Every Dupatta, A Story of{" "}
            <span className="text-[#c39150]">Grace.</span>
          </h2>
          <p className="mt-4 text-base font-medium text-black sm:text-lg">
            Explore Our Collection
          </p>
        </div>

        {categoryItems.length > 0 ? (
          <div className="scrollbar-hidden mt-12 flex snap-x gap-4 overflow-x-auto md:mt-16 lg:grid lg:grid-cols-5 lg:overflow-visible lg:gap-5">
            {categoryItems.map((category) => (
              <Link
                key={category.id ?? category.name}
                href={category.href}
                className="group relative block aspect-[334/473] w-[42vw] min-w-[10rem] shrink-0 snap-start overflow-hidden bg-transparent sm:w-[18rem] md:w-[20rem] lg:w-auto lg:min-w-0 lg:shrink"
                aria-label={`Explore ${category.name}`}
              >
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    height={700}
                    width={700}
                    className="object-fill transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center px-4 text-center font-heading text-xl text-[#3f2617]">
                    {category.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default CategorySection;
