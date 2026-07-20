"use server";

import { revalidatePath, updateTag } from "next/cache";
import { CATALOG_CATEGORIES_CACHE_TAG } from "@/services/product.service";
import {
  createCategoryService,
  deleteCategoryService,
  getAllCategoriesMetaService,
  getCategoriesPaginationService,
  getCategoriesService,
  updateCategoryService,
} from "@/services/category.service";
import {
  validateCategoryPayload,
  validateCategoryQuery,
  validateCategoryUpdatePayload,
} from "@/validators/category.validator";

export async function getCategories() {
  return getCategoriesService();
}

export async function getAllCategoriesMeta() {
  return getAllCategoriesMetaService();
}

export async function getCategoriesPagination(query: unknown = {}) {
  return getCategoriesPaginationService(validateCategoryQuery(query));
}

export async function createCategory(payload: unknown) {
  try {
    await createCategoryService(validateCategoryPayload(payload));

    updateTag(CATALOG_CATEGORIES_CACHE_TAG);
    revalidatePath("/admin/category");
    return { success: true, message: "Category added successfully" };
  } catch (error) {
    console.error("Create category failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add category",
    };
  }
}

export async function updateCategory(payload: unknown) {
  try {
    const data = validateCategoryUpdatePayload(payload);
    await updateCategoryService(data);

    updateTag(CATALOG_CATEGORIES_CACHE_TAG);
    revalidatePath("/admin/category");
    revalidatePath(`/admin/category/${data.id}`);
    return { success: true, message: "Category updated successfully" };
  } catch (error) {
    console.error("Update category failed:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update category",
    };
  }
}

export async function deleteCategory(id: string) {
  try {
    await deleteCategoryService(id);
    updateTag(CATALOG_CATEGORIES_CACHE_TAG);
    revalidatePath("/admin/category");

    return { success: true, message: "Category deleted successfully" };
  } catch (error) {
    console.error("Delete category failed:", error);
    return { success: false, message: "Failed to delete category" };
  }
}
