import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Check,
  Clock,
  Download,
  Mail,
  MapPin,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";

type OrderInfo = {
  orderId: string;
  email: string;
  isPaid: boolean;
  orderDate: string;
  paymentMethod: string;
  paymentStatus: string;
  estimatedDelivery: string;
  deliveryCharge: string;
  totalPaid: string;
};

type ShippingAddress = {
  name: string;
  line1: string;
  line2?: string;
  cityState?: string;
  phone: string;
  secondPhone?: string | null;
};

type OrderItem = {
  product: string;
  variant: string;
  quantity: number;
  total: string;
  image: string;
};

export function OrderConfirmationPage({
  order,
  address,
  items,
}: {
  order: OrderInfo;
  address: ShippingAddress;
  items: OrderItem[];
}) {
  return (
    <main className="relative pt-20 isolate min-h-screen overflow-hidden bg-[#fff6ea] text-[#3F2617]">
      <Image
        sizes="100vw"
        height={700}
        width={700}
        src="/orderconfirm-bg.png"
        alt=""
        priority
        className="-z-10 w-full h-full absolute inset-0 object-cover object-top"
      />

      <section className="mx-auto flex w-full max-w-[820px] flex-col items-center px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div
          className={`flex size-16 items-center justify-center rounded-full text-white shadow-sm ${
            order.isPaid ? "bg-[#59AF52]" : "bg-[#C39150]"
          }`}
        >
          {order.isPaid ? (
            <Check className="size-9 stroke-[3]" />
          ) : (
            <Clock className="size-8 stroke-[2.5]" />
          )}
        </div>

        <h1 className="mt-5 font-heading text-4xl font-semibold leading-none text-[#3F2617]">
          {order.isPaid ? "Thank You!" : "Payment Verified"}
        </h1>
        <p className="mt-3 text-center text-sm font-medium text-[#3F2617]/75">
          {order.isPaid
            ? "Your order has been placed successfully."
            : "Razorpay has verified your payment. Final order confirmation is in progress."}
        </p>

        <div className="mt-5 border border-[#C39150]/55 bg-[#fff8ef]/75 px-8 py-3 text-center text-base font-semibold text-[#C39150]">
          Order ID: {order.orderId}
        </div>

        {order.email ? (
          <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs font-medium text-[#3F2617]/75">
            <Mail className="size-4 text-[#C39150]" />
            {order.isPaid
              ? `We've sent a confirmation email to ${order.email}`
              : `We'll send a confirmation email to ${order.email} once Razorpay confirms the payment with us.`}
          </p>
        ) : null}

        <div className="mt-8 grid w-full gap-5 md:grid-cols-2">
          <InfoCard
            icon={<PackageCheck className="size-5" />}
            title="Order Information"
          >
            <InfoRow label="Order Date" value={order.orderDate} />
            <InfoRow label="Payment Method" value={order.paymentMethod} />
            <InfoRow
              label="Payment Status"
              value={
                <span
                  className={`rounded px-3 py-1 text-[11px] font-semibold ${
                    order.isPaid
                      ? "bg-[#DFF3D8] text-[#459B3F]"
                      : "bg-[#FFF0CC] text-[#9A6816]"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              }
            />
            <InfoRow
              label="Estimated Delivery"
              value={order.estimatedDelivery}
            />
          </InfoCard>

          <InfoCard
            icon={<MapPin className="size-5" />}
            title="Shipping Address"
          >
            <p className="text-sm font-semibold text-[#3F2617]">
              {address.name}
            </p>
            <div className="mt-3 space-y-2 text-xs font-medium leading-5 text-[#3F2617]/80">
              <p>{address.line1}</p>
              {address.line2 ? <p>{address.line2}</p> : null}
              {address.cityState ? <p>{address.cityState}</p> : null}
              <p>Phone: {address.phone}</p>
              {address.secondPhone ? (
                <p>Alternate Phone: {address.secondPhone}</p>
              ) : null}
            </div>
          </InfoCard>
        </div>

        <div className="mt-5 w-full border border-[#E9CFAF] bg-[#fff8ef]/78 px-5 py-5">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingBag className="size-5 text-[#C39150]" />
            <h2 className="font-heading text-lg font-semibold text-[#3F2617]">
              Order Items
            </h2>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_80px_110px] border-b border-[#E9CFAF] pb-3 text-xs font-semibold text-[#3F2617]">
            <span>Product</span>
            <span className="text-center">Quantity</span>
            <span className="text-right">Total</span>
          </div>

          <div className="divide-y divide-[#E9CFAF]">
            {items.map((item) => (
              <div
                key={`${item.product}-${item.variant}`}
                className="grid grid-cols-[minmax(0,1fr)_80px_110px] items-center gap-3 py-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-[#f3dfc7]">
                    <Image
                      sizes="48px"
                      height={700}
                      width={700}
                      src={item.image}
                      alt={item.product}
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-[#3F2617]">
                      {item.product}
                    </h3>
                    <p className="mt-1 text-xs text-[#3F2617]/60">
                      {item.variant}
                    </p>
                  </div>
                </div>
                <p className="text-center text-sm font-semibold">
                  {item.quantity}
                </p>
                <p className="text-right text-sm font-semibold">{item.total}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 w-full bg-[#3F2617] px-6 py-5 text-white">
          <div className="flex items-center justify-between gap-4 text-xs text-white/75">
            <p>Delivery Charge</p>
            <p className="font-semibold text-white">{order.deliveryCharge}</p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/15 pt-4">
            <p className="text-base font-semibold">
              {order.isPaid ? "Total Paid" : "Total Amount"}
            </p>
            <p className="text-xl font-semibold">{order.totalPaid}</p>
          </div>
        </div>

        <div
          className={`mt-7 grid w-full max-w-[520px] gap-4 ${
            order.isPaid ? "sm:grid-cols-2" : ""
          }`}
        >
          {order.isPaid ? (
            <Link
              href={`/order-confirmation/invoice?orderId=${encodeURIComponent(order.orderId)}`}
              className="flex h-12 items-center justify-center gap-2 border border-[#3F2617]/35 bg-white/75 text-sm font-semibold text-[#3F2617] transition hover:border-[#C39150] hover:text-[#C39150]"
            >
              <Download className="size-4" />
              Download Invoice
            </Link>
          ) : null}
          <Link
            href="/shop"
            className="flex h-12 items-center justify-center bg-[#C39150] text-sm font-semibold text-white transition hover:bg-[#3F2617]"
          >
            Continue Shopping
          </Link>
        </div>

        <p className="mt-8 max-w-sm text-center text-xs font-medium leading-5 text-[#3F2617]/75">
          Thank you for shopping with Roop Shree. We appreciate your trust in
          us!
        </p>
      </section>
    </main>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 border border-[#E9CFAF] bg-[#fff8ef]/78 px-5 py-5">
      <div className="mb-5 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#FEEDD0] text-[#C39150]">
          {icon}
        </span>
        <h2 className="font-heading text-lg font-semibold text-[#3F2617]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-2 text-xs font-medium">
      <span className="text-[#3F2617]/72">{label}</span>
      <span className="text-right font-semibold text-[#3F2617]">{value}</span>
    </div>
  );
}
