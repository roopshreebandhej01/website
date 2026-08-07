"use client";

import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Edit, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteProduct, duplicateProduct } from "@/helper/product/action";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  strikeThroughPrice: number | null;
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
  isNewArrival: boolean;
  isTrending: boolean;
  image?: string;
  createdAt: Date;
};

function formatPrice(value: number | null) {
  if (value == null) return "-";
  return `₹${(value / 100).toLocaleString("en-IN")}`;
}

export default function ProductTable({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteProduct(id);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.message);
    });
  }

  function handleDuplicate(id: string) {
    startTransition(async () => {
      const result = await duplicateProduct(id);

      if (result.success) {
        toast.success(result.message);
        // Navigate to the new product's edit page so admin can review/modify it
        if (result.data?.id) {
          router.push(`/admin/products/${result.data.id}`);
        } else {
          router.refresh();
        }
        return;
      }

      toast.error(result.message);
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Base Price</TableHead>
          <TableHead>Strike Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Featured</TableHead>
          <TableHead>New Arrival</TableHead>
          <TableHead>Trending</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.length ? (
          products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        height={700}
                        width={700}
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <span>{product.name}</span>
                </div>
              </TableCell>
              <TableCell>{product.slug}</TableCell>
              <TableCell>{formatPrice(product.basePrice)}</TableCell>
              <TableCell>{formatPrice(product.strikeThroughPrice)}</TableCell>
              <TableCell className="capitalize">{product.status}</TableCell>
              <TableCell>{product.isFeatured ? "Yes" : "No"}</TableCell>
              <TableCell>{product.isNewArrival ? "Yes" : "No"}</TableCell>
              <TableCell>{product.isTrending ? "Yes" : "No"}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  {/* Edit */}
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/products/${product.id}`)}
                    disabled={isPending}
                  >
                    <Edit />
                  </Button>

                  {/* Duplicate */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" disabled={isPending}>
                        {isPending ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Copy className="text-blue-500" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Duplicate this product?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          <p className="break-words whitespace-pre-wrap">
                            A copy of &quot;{product.name}&quot; will be created
                            as a <strong>Draft</strong>. You will be redirected
                            to the new product&apos;s edit page to review and
                            publish it.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={isPending}
                          onClick={() => handleDuplicate(product.id)}
                        >
                          {isPending ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Duplicate"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" disabled={isPending}>
                        <Trash2 className="text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete product permanently?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          <p className="break-words whitespace-pre-wrap">
                            This removes the product and related rows <br />{" "}
                            from the database.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={isPending}
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isPending ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center text-gray-600">
              No products found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
