"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminProductService,
  deleteAdminProductService,
  getFullProductService,
  getProductFilterOptionsService,
  getProductsCountService,
  getProductsService,
  updateAdminProductService,
} from "@/services/admin-product.service";
import {
  validateAdminProductCreateInput,
  validateAdminProductQuery,
  validateAdminProductUpdateInput,
  type AdminProductPayload,
} from "@/validators/admin-product.validator";

export async function getProducts(query: unknown = {}) {
  return getProductsService(validateAdminProductQuery(query));
}

export async function getFullProduct(id: string) {
  return getFullProductService(id);
}

export async function createProduct(input: AdminProductPayload | FormData) {
  try {
    const created = await createAdminProductService(
      validateAdminProductCreateInput(input),
    );

    revalidatePath("/admin/products");
    revalidatePath(`/product/${created.slug}`);
    return { success: true, message: "Product added successfully", data: created };
  } catch (error) {
    console.error("Create product failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add product",
    };
  }
}

export async function updateProduct(
  idOrInput: string | FormData,
  payloadInput?: AdminProductPayload,
) {
  try {
    const updated = await updateAdminProductService(
      validateAdminProductUpdateInput(idOrInput, payloadInput),
    );

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${updated.id}`);
    revalidatePath(`/product/${updated.slug}`);
    return {
      success: true,
      message: "Product updated successfully",
      data: updated,
    };
  } catch (error) {
    console.error("Update product failed:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

export async function deleteProduct(id: string) {
  try {
    await deleteAdminProductService(id);
    revalidatePath("/admin/products");

    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    console.error("Delete product failed:", error);
    return { success: false, message: "Failed to delete product" };
  }
}

export async function getProductsCount() {
  return getProductsCountService();
}

export async function getProductFilterOptions() {
  return getProductFilterOptionsService();
}

export async function duplicateProduct(id: string) {
  try {
    const original = await getFullProductService(id);

    if (!original) {
      return { success: false, message: "Product not found" };
    }

    // Use a short timestamp suffix so the slug is always unique and never
    // conflicts with the products_slug_idx unique constraint.
    const suffix = Date.now().toString(36); // e.g. "lzq8k7f"
    const payload: AdminProductPayload = {
      name: `${original.name} (Copy ${suffix})`,
      sku: original.sku ? `${original.sku}${suffix}` : "",
      shortDescription: original.shortDescription ?? "",
      description: original.description ?? "",
      price: original.basePrice ? String(original.basePrice / 100) : "",
      strikeThroughPrice: original.strikeThroughPrice
        ? String(original.strikeThroughPrice / 100)
        : "",
      // Duplicates always start as draft so admin can review before publishing
      status: "draft",
      isFeatured: original.isFeatured ?? false,
      categoryIds:
        original.categoryRes?.map(
          (row: { categories: { id: string } }) => row.categories.id,
        ) ?? [],
      attributes:
        original.productAttributeRes?.map(
          (item: { name?: string; attribute?: string; value: string }) => ({
            name: item.name ?? item.attribute ?? "",
            value: item.value,
          }),
        ) ?? [],
      filters:
        original.filters?.map(
          (item: {
            name?: string;
            type?: string;
            value?: string;
            filter?: string;
          }) => ({
            name: item.name ?? item.type ?? "",
            value: item.value ?? item.filter ?? "",
          }),
        ) ?? [],
      variants:
        original.productVariantRes?.map(
          (variant: {
            id?: string;
            sku: string;
            title: string;
            price: number;
            strikeThroughPrice?: number | null;
            stockQuantity: number;
            size?: string | null;
            color?: string | null;
            fabric?: string | null;
            isDefault: boolean;
            isActive: boolean;
          }) => ({
            // Do NOT include `id` — causes a new variant row to be inserted
            sku: variant.sku ? `${variant.sku}-copy-${suffix}` : "",
            title: variant.title,
            price: variant.price ? String(variant.price / 100) : "",
            strikeThroughPrice: variant.strikeThroughPrice
              ? String(variant.strikeThroughPrice / 100)
              : "",
            stockQuantity: String(variant.stockQuantity ?? 0),
            size: variant.size ?? "",
            color: variant.color ?? "",
            fabric: variant.fabric ?? "",
            banner: "", // media is not duplicated — admin can upload new images
            gallery: [],
            isDefault: variant.isDefault,
            isActive: variant.isActive,
          }),
        ) ?? [],
    };

    const created = await createAdminProductService(
      validateAdminProductCreateInput(payload),
    );

    revalidatePath("/admin/products");
    revalidatePath(`/product/${created.slug}`);
    return {
      success: true,
      message: "Product duplicated. Redirecting to edit page…",
      data: created,
    };
  } catch (error) {
    console.error("Duplicate product failed:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to duplicate product",
    };
  }
}
