"use client";

import { Fragment } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
}

function getPageNumbers(currentPage: number, totalPages: number): number[] {
  return [1, currentPage - 1, currentPage, currentPage + 1, totalPages]
    .filter((p, i, arr) => p >= 1 && p <= totalPages && arr.indexOf(p) === i);
}

const ProductPagination = ({ currentPage, totalPages }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const pageNumber = Math.min(Math.max(currentPage, 1), totalPages);
  const pageNumbers = getPageNumbers(pageNumber, totalPages);

  const pushPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));

    router.push(`${pathname}?${params.toString()}`);
  };

  const renderPageButton = (page: number) => {
    const isActive = pageNumber === page;

    return (
      <button
        key={page}
        type="button"
        onClick={() => pushPage(page)}
        className={`flex size-8 md:size-9 items-center justify-center rounded-[4px] border text-xs md:text-sm font-medium transition cursor-pointer ${
          isActive
            ? "border-[#c39150] bg-[#C39150] text-white shadow-xs"
            : "border-[#d8a15a] bg-white text-[#3F2617] hover:border-[#c39150] hover:text-[#c39150]"
        }`}
      >
        {page}
      </button>
    );
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-[#3F2617]">
      <button
        type="button"
        aria-label="Previous page"
        disabled={pageNumber <= 1}
        onClick={() => pushPage(pageNumber - 1)}
        className="flex size-8 md:size-9 items-center justify-center rounded-[4px] border border-[#d8a15a] bg-white text-[#3F2617] transition hover:border-[#c39150] hover:text-[#c39150] disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pageNumbers.map((page, index) => (
        <Fragment key={page}>
          {index > 0 && page - pageNumbers[index - 1] > 1 && (
            <span className="flex size-8 md:size-9 items-center justify-center text-xs md:text-sm text-[#3F2617]/55 select-none">
              ...
            </span>
          )}
          {renderPageButton(page)}
        </Fragment>
      ))}

      <button
        type="button"
        aria-label="Next page"
        disabled={pageNumber >= totalPages}
        onClick={() => pushPage(pageNumber + 1)}
        className="flex size-8 md:size-9 items-center justify-center rounded-[4px] border border-[#d8a15a] bg-white text-[#3F2617] transition hover:border-[#c39150] hover:text-[#c39150] disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
};

export default ProductPagination;
