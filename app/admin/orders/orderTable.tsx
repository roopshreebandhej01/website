"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Eye, FileText } from "lucide-react";
import Link from "next/link";
import { Select } from "@/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateOrderStatus } from "@/helper/index";

export type OrderRow = {
  id: string;
  status: string;
  totalAmount: number;
  addressLine1: string;
  addressLine2: string | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: Date;
};

type OrderTableProps = {
  page: number;
  orders: OrderRow[];
  pageSize: number;
};

const orderStatus = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export default function OrderTable({
  page,
  orders,
  pageSize,
}: OrderTableProps) {
  const startIndex = (page - 1) * pageSize;
  const [isPending, startTransition] = useTransition();
  const [orderRows, setOrderRows] = useState(orders);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="mt-8">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>S.No</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Order date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead className=" w-52">Address Line 1</TableHead>
            <TableHead className="text-end">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderRows.length ? (
            orderRows.map((order, index) => (
              <TableRow
                key={order.id}
                className={isPending ? "opacity-60" : ""}
              >
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell>
                  {order.userName || order.userEmail || "Guest"}
                </TableCell>
                <TableCell>
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </TableCell>
                <TableCell>
                  <div className="min-w-36">
                    <Select
                      placeholder="Status"
                      label="Status"
                      value={order.status}
                      selectItems={orderStatus}
                      onValueChange={(value) => {
                        startTransition(async () => {
                          const result = await updateOrderStatus(
                            order.id,
                            value,
                          );

                          if (!result.success) {
                            return;
                          }

                          setOrderRows((currentRows) =>
                            currentRows.map((row) =>
                              row.id === order.id
                                ? { ...row, status: value }
                                : row,
                            ),
                          );
                          router.refresh();
                        });
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  ₹{(order.totalAmount / 100).toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="w-52 max-w-52 whitespace-normal break-words">
                  {order.addressLine1}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`${pathname}/${order.id}/invoice`}
                    className="mr-1 inline-flex items-center justify-center rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="View invoice"
                  >
                    <FileText className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => router.push(`${pathname}/${order.id}`)}
                    className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="View details"
                  >
                    <Eye className="size-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-gray-600">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
