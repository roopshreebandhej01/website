"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { X, Star, ThumbsUp } from "lucide-react";

import { submitReviewAction } from "@/actions/review.action";
import {
  DashboardCard,
  DashboardPageTitle,
  PrimaryAction,
} from "@/components/dashboard/DashboardPrimitives";
import { useFileUpload } from "@/helper/upload/client";
import { maxImageUploadSizeLabel } from "@/lib/upload-limits";
import type { getDashboardReviewData } from "@/services/review.service";

type ReviewData = Awaited<ReturnType<typeof getDashboardReviewData>>;
type PendingReviewItem = ReviewData["pending"][number];
type UploadedReviewMedia = {
  key: string;
  url: string;
  contentType: string;
};

export function ReviewsPage({ reviewData }: { reviewData: ReviewData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "submitted">(
    "all",
  );
  const [selectedItem, setSelectedItem] = useState<PendingReviewItem | null>(
    null,
  );

  useEffect(() => {
    document.body.style.overflow = selectedItem ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedItem]);

  const showPending = activeTab === "all" || activeTab === "pending";
  const showSubmitted = activeTab === "all" || activeTab === "submitted";

  return (
    <div>
      <DashboardPageTitle>Reviews & Ratings</DashboardPageTitle>

      <div className="mt-5 flex flex-wrap gap-3">
        <ReviewTab
          active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
          label="All"
          count={reviewData.pending.length + reviewData.submitted.length}
        />
        <ReviewTab
          active={activeTab === "pending"}
          onClick={() => setActiveTab("pending")}
          label="Pending"
          count={reviewData.pending.length}
        />
        <ReviewTab
          active={activeTab === "submitted"}
          onClick={() => setActiveTab("submitted")}
          label="Submitted"
          count={reviewData.submitted.length}
        />
      </div>

      {showPending ? (
        <section className="mt-5 space-y-5">
          {reviewData.pending.length ? (
            reviewData.pending.map((item) => (
              <DashboardCard key={item.orderItemId}>
                <div className="grid gap-3 bg-[#f1dfc7] px-4 py-3 text-xs text-[#C39150] sm:grid-cols-3">
                  <Meta label="Order ID" value={item.orderNumber} />
                  <Meta label="Date" value={item.date} />
                  <Meta label="Total" value={item.total} />
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <ProductSummary item={item} />
                  <PrimaryAction onClick={() => setSelectedItem(item)}>
                    Write a Review
                  </PrimaryAction>
                </div>
              </DashboardCard>
            ))
          ) : activeTab === "pending" ? (
            <EmptyState>No delivered orders are waiting for review.</EmptyState>
          ) : null}
        </section>
      ) : null}

      {showSubmitted ? (
        <section className="mt-5 space-y-5">
          {reviewData.submitted.length ? (
            reviewData.submitted.map((review) => (
              <SubmittedReview key={review.id} review={review} />
            ))
          ) : activeTab === "submitted" ? (
            <EmptyState>No reviews submitted yet.</EmptyState>
          ) : null}
        </section>
      ) : null}

      {!reviewData.pending.length && !reviewData.submitted.length ? (
        <EmptyState>
          Reviews become available here once one of your orders is delivered.
        </EmptyState>
      ) : null}

      {typeof document !== "undefined" && selectedItem
        ? createPortal(
            <ReviewModal
              item={selectedItem}
              onSubmitted={() => {
                setSelectedItem(null);
                router.refresh();
              }}
              onClose={() => setSelectedItem(null)}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

function ReviewTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-full border border-[#C39150] px-5 text-xs font-medium ${
        active ? "bg-[#C39150] text-white" : "text-[#C39150]"
      }`}
    >
      {label} ({count})
    </button>
  );
}

function ProductSummary({ item }: { item: PendingReviewItem }) {
  return (
    <div className="flex gap-4">
      <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-[#f8f0e6]">
        <Image
          src={item.image}
          alt={item.productName}
          height={700}
          width={700}
          sizes="56px"
          className="object-cover object-top"
        />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-black">{item.productName}</h2>
        {item.variant ? (
          <p className="mt-1 text-xs text-[#777]">Variant: {item.variant}</p>
        ) : null}
        <p className="text-xs text-[#777]">Qty: {item.quantity}</p>
      </div>
    </div>
  );
}

function SubmittedReview({
  review,
}: {
  review: ReviewData["submitted"][number];
}) {
  return (
    <DashboardCard className="grid min-w-0 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_216px] lg:items-center">
      <div className="min-w-0">
        <h2 className="break-words text-lg font-semibold text-black">
          {review.productName}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Stars filled={review.rating} />
          <span className="min-w-0 break-words text-sm font-semibold text-black">
            {review.title}
          </span>
          <span className="rounded-full bg-[#fbf3ea] px-3 py-1 text-[10px] font-semibold capitalize text-[#C39150]">
            {review.status}
          </span>
        </div>
        <p className="mt-3 max-w-full break-words text-sm leading-6 text-[#666] [overflow-wrap:anywhere]">
          {review.message}
        </p>
        <p className="mt-3 flex items-center gap-3 text-xs text-[#777]">
          Reviewed on {review.date}
          <ThumbsUp className="size-4" />
        </p>
      </div>
      <Link
        href={`/product/${review.productSlug}`}
        className="flex h-12 w-full items-center justify-center bg-[#C39150] px-6 text-xs font-semibold tracking-[0.08em] text-white transition hover:bg-[#3F2617] lg:w-[216px]"
      >
        View Product
      </Link>
    </DashboardCard>
  );
}

function ReviewModal({
  item,
  onClose,
  onSubmitted,
}: {
  item: PendingReviewItem;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const [media, setMedia] = useState<UploadedReviewMedia[]>([]);
  const { upload, uploading } = useFileUpload();

  async function uploadReviewMedia(files: FileList | null) {
    if (!files?.length) return;

    setFeedback("");

    const availableSlots = Math.max(0, 5 - media.length);
    const selectedFiles = Array.from(files).slice(0, availableSlots);

    if (!selectedFiles.length) {
      setFeedback("You can upload up to 5 photos or videos.");
      return;
    }

    try {
      const uploaded = await Promise.all(
        selectedFiles.map(async (file) => {
          const result = await upload(file, "reviews");

          return {
            key: result.fileKey,
            url: result.fileUrl,
            contentType: result.contentType,
          };
        }),
      );

      setMedia((current) => [...current, ...uploaded]);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Media upload failed.",
      );
    }
  }

  function submitReview() {
    setFeedback("");
    startTransition(async () => {
      const result = await submitReviewAction({
        orderId: item.orderId,
        productId: item.productId,
        rating,
        title,
        message,
        media: media.map((item) => ({
          key: item.key,
          contentType: item.contentType,
        })),
      });

      if (!result.success) {
        setFeedback(result.message);
        return;
      }

      onSubmitted();
    });
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6 md:py-12">
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex shrink-0 items-center justify-between bg-[#fbf3ea] px-6 py-5">
          <h2 className="text-xl font-semibold text-[#C39150]">
            Write a Review
          </h2>
          <button
            type="button"
            aria-label="Close review modal"
            onClick={onClose}
          >
            <X className="size-5 text-[#777]" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <ProductSummary item={item} />

          <div className="mt-6 block text-xs text-[#777]">
            Overall Rating *
            <div className="mt-2 flex gap-2 text-[#C39150]">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} star rating`}
                    onClick={() => setRating(value)}
                  >
                    <Star
                      className="size-7"
                      fill={value <= rating ? "currentColor" : "none"}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <label className="mt-5 block text-xs text-[#777]">
            Review Title *
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Summarize your experience"
              className="mt-2 h-10 w-full border border-[#e1c5a5] px-4 text-sm font-semibold text-black outline-none focus:border-[#C39150]"
            />
          </label>

          <label className="mt-5 block text-xs text-[#777]">
            Your Review *
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell us what you liked or disliked about this product"
              className="mt-2 h-28 w-full resize-none border border-[#e1c5a5] p-4 text-sm font-semibold text-black outline-none focus:border-[#C39150]"
            />
            <span className="mt-1 block text-right text-[10px] text-[#777]">
              ({message.length}/500)
            </span>
          </label>

          <label className="mt-5 block text-xs text-[#777]">
            Photos or Videos
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              multiple
              disabled={uploading || media.length >= 5}
              onChange={(event) => {
                void uploadReviewMedia(event.target.files);
                event.target.value = "";
              }}
              className="mt-2 block w-full text-sm text-[#555] file:mr-4 file:h-10 file:border-0 file:bg-[#C39150] file:px-4 file:text-xs file:font-semibold file:tracking-[0.08em] file:text-white disabled:opacity-60"
            />
            <span className="mt-1 block text-[10px] text-[#777]">
              Upload up to 5 files. Photos compress to {maxImageUploadSizeLabel}{" "}
              max, videos max 25MB.
            </span>
          </label>

          {media.length ? (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {media.map((item) => (
                <div
                  key={item.key}
                  className="relative aspect-square overflow-hidden border border-[#e1c5a5] bg-[#fbf3ea]"
                >
                  {item.contentType.startsWith("video/") ? (
                    <video
                      src={item.url}
                      className="size-full object-cover"
                      muted
                      controls
                    />
                  ) : (
                    <Image
                      src={item.url}
                      alt="Review media preview"
                      height={700}
                      width={700}
                      className="object-cover"
                    />
                  )}
                  <button
                    type="button"
                    aria-label="Remove media"
                    onClick={() =>
                      setMedia((current) =>
                        current.filter(
                          (mediaItem) => mediaItem.key !== item.key,
                        ),
                      )
                    }
                    className="absolute right-1 top-1 flex size-6 items-center justify-center bg-black/60 text-white"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {feedback ? (
            <p className="mt-3 text-sm font-medium text-red-600">{feedback}</p>
          ) : null}

          <PrimaryAction
            className="mt-4 w-full"
            disabled={isPending || uploading}
            onClick={submitReview}
          >
            {uploading
              ? "Uploading..."
              : isPending
                ? "Submitting..."
                : "Submit"}
          </PrimaryAction>
        </div>
      </div>
    </div>
  );
}

function Stars({ filled }: { filled: number }) {
  return (
    <span className="flex text-[#f5a400]">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className="size-4"
          fill={index < filled ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <DashboardCard className="p-6 text-sm font-medium text-[#777]">
      {children}
    </DashboardCard>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-black">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
