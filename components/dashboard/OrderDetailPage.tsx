import { notFound } from "next/navigation";
import Image from "next/image";

import {
  DashboardCard,
  DashboardPageTitle,
} from "@/components/dashboard/DashboardPrimitives";
import { OrderCard } from "@/components/dashboard/OrderCard";
import type { getDashboardOrderDetails } from "@/services/order.service";

export function OrderDetailPage({
  details,
}: {
  details: Awaited<ReturnType<typeof getDashboardOrderDetails>>;
}) {
  if (!details) {
    notFound();
  }

  return (
    <div>
      <DashboardPageTitle>Order Details</DashboardPageTitle>

      <DashboardCard className="mt-5 grid gap-8 p-5 md:grid-cols-3">
        <div>
          <h2 className="text-sm font-semibold text-black">Order Summary</h2>
          <div className="mt-3 space-y-2 text-xs">
            {details.summary.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4"
              >
                <span className="text-[#555]">{item.label}</span>
                <span className={item.strong ? "font-semibold text-black" : ""}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-black">Payment Method</h2>
          <p className="mt-2 text-sm font-semibold text-black">
            {details.payment.provider.toUpperCase()}
          </p>
          <p className="mt-1 text-xs text-[#555]">
            Status: {details.payment.status}
          </p>
          {details.payment.providerPaymentId ? (
            <p className="mt-1 break-all text-xs text-[#555]">
              Payment ID: {details.payment.providerPaymentId}
            </p>
          ) : null}
        </div>

        <div className="md:text-right">
          <h2 className="text-sm font-semibold text-black">Address</h2>
          <div className="mt-3 flex flex-wrap gap-2 md:justify-end">
            <span className="rounded-full bg-[#eef5ff] px-3 py-1 text-[10px] font-semibold text-[#2974e6]">
              Shipping
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold">{details.address.name}</p>
          <p className="mt-1 text-xs text-[#555]">{details.address.phone}</p>
          <p className="mt-2 text-xs leading-5 text-[#555]">
            {details.address.line}
          </p>
        </div>
      </DashboardCard>

      <div className="mt-5">
        <OrderCard order={details.order} showViewDetail={false} />
      </div>

      <DashboardCard className="mt-5 overflow-hidden">
        <div className="border-b border-[#ead8c4] px-5 py-4">
          <h2 className="text-sm font-semibold text-black">Items</h2>
        </div>
        <div className="divide-y divide-[#ead8c4]">
          {details.items.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_80px_120px] sm:items-center"
            >
              <div className="flex min-w-0 gap-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-[#f8f0e6]">
                  <Image
                    src={item.image}
                    alt={item.product}
                    fill
                    sizes="56px"
                    className="object-cover object-top"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-base font-semibold text-[#2d180f]">
                    {item.product}
                  </h3>
                  {item.variant ? (
                    <p className="mt-1 text-xs text-[#777]">
                      Variant: {item.variant}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-[#777]">
                    Price: {item.price}
                  </p>
                </div>
              </div>
              <p className="text-xs font-semibold text-[#555]">
                Qty: {item.quantity}
              </p>
              <p className="text-sm font-semibold text-[#2d180f] sm:text-right">
                {item.total}
              </p>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}
