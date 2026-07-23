/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Phone, Mail } from "lucide-react";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { fetchOrderDetails } from "@/helper/index"; // server action
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NEXT_PUBLIC_S3_BASE_URL } from "@/env";
export default function Details({ id }: { id: string }) {
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await fetchOrderDetails(id);
      setOrderInfo(data);
    });
  }, [id]);

  if (isPending || !orderInfo) {
    return (
      <div className="flex items-center justify-center h-[70vh] w-full">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading order details...</p>
        </div>
      </div>
    );
  }

  const subtotal =
    orderInfo?.items?.reduce(
      (sum: number, item: any) => sum + item.productPrice * item.quantity,
      0,
    ) || 0;
  const deliveryCharge = Math.max(
    0,
    (orderInfo?.order?.totalAmount || 0) - subtotal,
  );
  const customerName =
    orderInfo?.address?.fullName ||
    orderInfo?.users?.name ||
    orderInfo?.users?.email?.split("@")[0] ||
    "Customer";
  const customerPhone =
    orderInfo?.address?.phone ||
    orderInfo?.users?.phone ||
    orderInfo?.order?.shippingPhone ||
    "-";

  return (
    <div className="w-full max-w-full mx-auto p-1 space-y-5">
      {/* Top Grid */}
      <div className=" gap-2">
        {/* Left Card: Timeline */}
        {/* Right Section */}
        <div className=" space-y-5">
          {/* Customer Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Customer</CardTitle>
            </CardHeader>
            <CardContent className=" flex flex-col gap-4">
              <div className="flex items-center gap-5">
                <Avatar className="h-24 w-24">
                  {/* <AvatarImage  src={`${process.env.NEXT_PUBLIC_S3_BASE_URL}/${orderInfo?.user.profileImage}`} />  */}
                  <AvatarFallback>
                    {customerName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">
                    {customerName}
                  </h3>
                  {/* <p className="text-md text-slate-400">12 previous orders</p> */}
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="flex items-center gap-2 text-md text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {customerPhone}
                    </span>
                    <span className="flex items-center gap-2 text-md break-all text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />{" "}
                      {orderInfo?.users?.email}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" className="rounded-full mt-4">
                  <Link href={`/admin/orders/${id}/invoice`}>Invoice</Link>
                </Button>
                <Badge className="rounded-full mt-4 px-4 py-2 text-sm capitalize bg-slate-100/50 text-slate-800 border border-slate-200">
                  {orderInfo?.order?.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold">₹ {subtotal / 100}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Delivery Charge</span>
                <span className="font-semibold">
                  {deliveryCharge > 0 ? `₹ ${deliveryCharge / 100}` : "Free"}
                </span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg text-[#D4AF37]">
                  ₹ {orderInfo?.order?.totalAmount / 100}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Table Card */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b text-xs uppercase text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Quantity</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>

              <tbody className="text-sm">
                {orderInfo?.items.map((item: any) => {
                  const total = item.productPrice * item.quantity;
                  const product = item.product;

                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20 border-2 border-slate-100">
                            <AvatarImage
                              src={
                                item.productImage?.startsWith("http")
                                  ? item.productImage
                                  : `${(NEXT_PUBLIC_S3_BASE_URL || "").replace(/\/$/, "")}/${item.productImage?.replace(/^\//, "")}`
                              }
                              className="object-contain"
                            />
                            <AvatarFallback>
                              {item.productName?.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <p className="font-bold text-slate-900">
                              {item.productName}
                            </p>
                            <p className="text-xs text-slate-400">
                              {product?.slug ?? item.productSlug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1">
                          {orderInfo?.order.status}
                        </Badge>
                      </td>

                      <td className="px-6 py-5 text-center text-slate-600">
                        {item.quantity}
                      </td>

                      <td className="pr-3 py-5 text-right  font-bold text-slate-900">
                        ₹ {total / 100}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
