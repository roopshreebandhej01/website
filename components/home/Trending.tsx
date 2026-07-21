"use client"

import type { Product } from "@/components/global/const"
import { ProductCard } from "@/components/product/ProductCard"

const Trending = ({ products: fetchedProducts }: { products?: Product[] }) => {
  const productItems = fetchedProducts ?? []

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6 md:py-20 lg:px-8">
        <div className="text-center text-[#17110d]">
          <h2 className="font-semibold text-2xl leading-tight sm:text-5xl">
            Trending Collection
          </h2>
          <p className="mx-auto mt-2 max-w-[18rem] text-[0.62rem] font-medium leading-4 sm:max-w-none sm:text-lg">
            Our Best-Selling Bandhej, Loved Across Generations
          </p>
        </div>

        {productItems.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:mt-9 md:grid-cols-4 md:gap-x-5 md:gap-y-8">
            {productItems.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default Trending
