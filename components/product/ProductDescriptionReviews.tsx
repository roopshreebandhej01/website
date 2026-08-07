import Image from "next/image";
import { Star, ThumbsUp, UserRound } from "lucide-react";
import type { ProductDetailView } from "@/components/product/ProductDetails";

type ProductDescriptionReviewsProps = {
  product: ProductDetailView;
};

const Stars = ({
  rating = 5,
  className = "size-5",
}: {
  rating?: number;
  className?: string;
}) => (
  <span className="inline-flex items-center gap-0.5 text-[#f5b940]">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`${className} ${
          index < Math.round(rating) ? "fill-current" : ""
        }`}
        strokeWidth={1.2}
      />
    ))}
  </span>
);

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const ProductDescriptionReviews = ({
  product,
}: ProductDescriptionReviewsProps) => {
  const specs = product.attributes.filter((item) => item.name && item.value);
  const averageRating = Number(product.reviewSummary.averageRating.toFixed(1));
  const reviewCount = product.reviewSummary.reviewCount;

  const description = product.description
    .replace(/\r\n/g, "\n")
    .replace(/[“”]/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();

  const sections = description
    .split(/\n(?=[A-Za-z].*?:)|(?=\b\d+\.)/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <section className="bg-white py-8 md:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 border border-[#F1E1CD] bg-[#fbf8f4] px-5 py-7 md:grid-cols-[1.2fr_0.9fr] md:px-8 lg:px-12">
          <div>
            <h2 className="font-heading text-2xl text-black md:text-3xl">
              Description
            </h2>

            {sections.map((section, index) => (
              <p
                key={index}
                className="mt-4 max-w-3xl text-xs leading-6 text-gray-600 whitespace-pre-wrap font-sans"
              >
                {section}
              </p>
            ))}

            {specs.length > 0 ? (
              <div className="mt-6 border border-[#ead8c2] text-sm font-medium text-black md:text-base">
                {specs.map((spec) => (
                  <div
                    key={`${spec.name}-${spec.value}`}
                    className="grid grid-cols-[35%_65%] border-b border-[#ead8c2] last:border-b-0"
                  >
                    <div className="border-r border-[#ead8c2] px-4 py-4 capitalize md:px-6">
                      {spec.name.trim()}
                    </div>
                    <div className="px-4 py-4 md:px-6">{spec.value}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="md:pl-8 lg:pl-12">
            <div className="flex items-center gap-4">
              <span className="text-5xl font-bold leading-none text-black">
                {averageRating || "0.0"}
              </span>
              <div>
                <Stars rating={averageRating} className="size-7" />
                <p className="mt-1 text-base text-[#7a746f]">
                  {reviewCount} Reviews
                </p>
              </div>
            </div>

            <div className="mt-10 space-y-6">
              {product.reviewSummary.ratingRows.map((row) => (
                <div
                  key={row.rating}
                  className="grid grid-cols-[2rem_1.25rem_1fr_3rem] items-center gap-2 text-xl font-medium text-black"
                >
                  <span>{row.rating}</span>
                  <Star className="size-5 fill-[#f5b940] text-[#f5b940]" />
                  <div className="h-2 overflow-hidden rounded-full bg-[#d8d8d8]">
                    <div
                      className="h-full rounded-full bg-[#c39150]"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                  <span className="text-right text-base">{row.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 md:mt-16">
          <h2 className="font-heading text-xl font-semibold text-black">
            Customer Reviews
          </h2>

          {product.reviews.length > 0 ? (
            <div className="mt-6 space-y-8">
              {product.reviews.map((review) => (
                <article
                  key={review.id}
                  className="border-b border-[#d8d8d8] pb-8 last:border-b-0"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f1ddc4] text-[#c39150]">
                      <UserRound className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-black">
                        {review.reviewerName}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Stars rating={review.rating} className="size-4" />
                        <span className="text-xs text-black">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 max-w-3xl text-sm text-black">
                    <h3 className="font-semibold">{review.title}</h3>
                    <p className="mt-1 leading-5">{review.message}</p>

                    {review.media && review.media.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {review.media.map((mediaItem) => (
                          <div
                            key={mediaItem.key}
                            className="relative size-20 overflow-hidden border border-[#ead8c2] bg-[#fbf8f4]"
                          >
                            {mediaItem.contentType.startsWith("video/") ? (
                              <video
                                src={mediaItem.url}
                                className="size-full object-cover"
                                muted
                                controls
                              />
                            ) : (
                              <Image
                                src={mediaItem.url}
                                alt="Customer review media"
                                height={700}
                                width={700}
                                className="object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* <button
                    type="button"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-black"
                  >
                    <ThumbsUp className="size-4" />
                    Helpful
                  </button> */}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-[#3f2617]/70">
              No customer reviews yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductDescriptionReviews;
