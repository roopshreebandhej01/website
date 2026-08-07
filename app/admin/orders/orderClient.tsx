"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import ProductPagination from "@/components/pagination";
import { Select } from "@/components/select";
import { useDebounce } from "@/components/debouceSearch";
import { useUpdateQuery } from "@/components/filter";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import OrderTable, { type OrderRow } from "./orderTable";

type OrderClientProps = {
  order: OrderRow[];
  total: number;
  currentPage: number;
  pageSize: number;
  status: string;
};

const orderStatus = [
  { value: "confirmed", label: "Confirmed" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export default function OrderClient({
  order,
  total,
  currentPage,
  pageSize,
  status,
}: OrderClientProps) {
  const [isPending, startTransition] = useTransition();
  const updateQuery = useUpdateQuery();
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 800);
  const selectedOrderStatus = status || undefined;
  const tableKey = `${currentPage}:${pageSize}:${status}:${order
    .map((row) => `${row.id}:${row.status}`)
    .join("|")}`;

  useEffect(() => {
    startTransition(() => updateQuery("search", debouncedSearch));
  }, [debouncedSearch, updateQuery]);

  return (
    <div className="w-full p-1">
      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>
            Manage orders from the current order schema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="w-full max-w-xl">
              <InputGroup className="flex items-center rounded-full bg-white py-2 shadow-none">
                <InputGroupAddon>
                  <Search className="text-gray-500" />
                </InputGroupAddon>
                <InputGroupInput
                  onChange={(event) => setSearchText(event.target.value)}
                  value={searchText}
                  type="text"
                  placeholder="Search by order ID"
                  className="w-full bg-transparent transition-all duration-200 focus:outline-none"
                />
              </InputGroup>
            </div>
            <Select
              placeholder="Order Status"
              label="Order Status"
              selectItems={orderStatus}
              value={selectedOrderStatus}
              onValueChange={(value) =>
                startTransition(() => updateQuery("status", value))
              }
            />
          </div>

          <div className="relative">
            {isPending ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : null}
            <OrderTable
              key={tableKey}
              page={currentPage}
              orders={order}
              pageSize={pageSize}
            />
          </div>
          <ProductPagination currentPage={currentPage} totalPages={total} />
        </CardContent>
      </Card>
    </div>
  );
}
