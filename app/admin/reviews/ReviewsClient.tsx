"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Check, Eye, Images, Star, X } from "lucide-react";

import { updateReviewStatusAction } from "@/actions/review.action";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ReviewStatus = "pending" | "accepted" | "rejected";
type ReviewTab = "all" | ReviewStatus;

type DemoReview = {
  id: string;
  productName: string;
  userName: string;
  rating: number;
  review: string;
  submittedAt: string;
  status: ReviewStatus;
  media: {
    url: string;
    contentType: string;
  }[];
};

const tabs: { label: string; value: ReviewTab }[] = [
  { label: "All Review", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

export default function ReviewsClient({
  initialReviews,
}: {
  initialReviews: DemoReview[];
}) {
  const [activeTab, setActiveTab] = useState<ReviewTab>("all");
  const [reviews, setReviews] = useState<DemoReview[]>(initialReviews);
  const [isPending, startTransition] = useTransition();
  const filteredReviews = useMemo(
    () =>
      activeTab === "all"
        ? reviews
        : reviews.filter((review) => review.status === activeTab),
    [activeTab, reviews],
  );

  function updateReviewStatus(id: string, status: ReviewStatus) {
    startTransition(async () => {
      const result = await updateReviewStatusAction(id, status);

      if (!result.success) return;

      setReviews((currentReviews) =>
        currentReviews.map((review) =>
          review.id === id ? { ...review, status } : review,
        ),
      );
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review customer feedback before it appears on the store.
          </p>
        </div>
        <div className="rounded-md border bg-white px-3 py-2 text-sm text-gray-600">
          Pending reviews:{" "}
          <span className="font-semibold text-gray-900">
            {reviews.filter((review) => review.status === "pending").length}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const count =
            tab.value === "all"
              ? reviews.length
              : reviews.filter((review) => review.status === tab.value).length;
          const active = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium transition ${
                active
                  ? "border-[#D4A056] bg-[#FFF9EE] text-gray-900"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? "bg-[#D4A056] text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-md border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product Name</th>
                <th className="px-4 py-3 font-medium">User Name</th>
                <th className="px-4 py-3 font-medium">Ratings</th>
                <th className="px-4 py-3 font-medium">View Review</th>
                <th className="px-4 py-3 font-medium">Media</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length ? (
                filteredReviews.map((review) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    onUpdateStatus={updateReviewStatus}
                    disabled={isPending}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="h-24 px-4 text-center text-gray-500"
                  >
                    No reviews found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({
  review,
  onUpdateStatus,
  disabled,
}: {
  review: DemoReview;
  onUpdateStatus: (id: string, status: ReviewStatus) => void;
  disabled: boolean;
}) {
  const accepted = review.status === "accepted";
  const rejected = review.status === "rejected";

  return (
    <tr className="border-t">
      <td className="max-w-[320px] px-4 py-4 font-medium text-gray-900">
        <span className="line-clamp-2">{review.productName}</span>
      </td>
      <td className="px-4 py-4 text-gray-700">{review.userName}</td>
      <td className="px-4 py-4">
        <button
          type="button"
          className="inline-flex h-9 cursor-default items-center gap-1 rounded-md bg-amber-50 px-3 text-sm font-semibold text-amber-700"
          aria-label={`${review.rating} out of 5 rating`}
        >
          <Star className="size-4 fill-amber-500 text-amber-500" />
          {review.rating}/5
        </button>
      </td>
      <td className="px-4 py-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <Eye className="size-4" />
              View Review
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="break-words">
                {review.productName}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Review by {review.userName} on {review.submittedAt}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-4 min-w-0 rounded-md border bg-gray-50 p-4">
              <div className="mb-3 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-700">
                <Star className="size-4 fill-amber-500 text-amber-500" />
                {review.rating}/5
              </div>
              <p className="max-w-full break-words text-sm leading-6 text-gray-700 [overflow-wrap:anywhere]">
                {review.review}
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
      <td className="px-4 py-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={!review.media.length}>
              <Images className="size-4" />
              View Media
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="break-words">
                Media for {review.productName}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Uploaded with the review by {review.userName}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-4 grid max-h-[60vh] gap-4 overflow-y-auto sm:grid-cols-2">
              {review.media.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  className="relative aspect-video w-full overflow-hidden rounded-md border bg-gray-50"
                >
                  {item.contentType.startsWith("video/") ? (
                    <video
                      src={item.url}
                      controls
                      className="size-full bg-black object-contain"
                    />
                  ) : (
                    <Image
                      src={item.url}
                      alt={`Review media ${index + 1}`}
                      height={700}
                      width={700}
                      className="object-contain"
                    />
                  )}
                </div>
              ))}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
      <td className="px-4 py-4">
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => onUpdateStatus(review.id, "accepted")}
            disabled={disabled || accepted}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Check className="size-4" />
            {accepted ? "Accepted" : "Accept"}
          </Button>
          <Button
            variant="outline"
            onClick={() => onUpdateStatus(review.id, "rejected")}
            disabled={disabled || rejected}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <X className="size-4" />
            {rejected ? "Rejected" : "Reject"}
          </Button>
        </div>
      </td>
    </tr>
  );
}
