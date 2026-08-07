"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiCategorySelect } from "@/components/multiCategorySelect";
import { createProduct, updateProduct } from "@/helper/product/action";
import { useFileUpload } from "@/helper/upload/client";

type ProductStatus = "draft" | "active" | "archived";

type AttributeRow = {
  name: string;
  value: string;
};

type FilterRow = {
  name: string;
  value: string;
};

type MediaRow = {
  key: string;
  previewUrl: string;
};

type VariantRow = {
  id?: string;
  sku: string;
  instagramLink: string;
  title: string;
  price: string;
  strikeThroughPrice: string;
  stockQuantity: string;
  size: string;
  color: string;
  fabric: string;
  banner: MediaRow | null;
  gallery: MediaRow[];
  isDefault: boolean;
  isActive: boolean;
};

type ProductDetails = {
  id?: string;
  name?: string;
  slug?: string;
  sku?: string;
  shortDescription?: string | null;
  description?: string | null;
  basePrice?: number;
  strikeThroughPrice?: number | null;
  status?: ProductStatus;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isTrending?: boolean;
  categoryRes?: { categories: { id: string } }[];
  productAttributeRes?: { name?: string; attribute?: string; value: string }[];
  productMediaRes?: {
    key?: string;
    mediaURL?: string;
    previewUrl?: string;
    variantId?: string | null;
    isPrimary?: boolean;
  }[];
  productVariantRes?: Array<{
    id: string;
    sku: string;
    instagramLink?: string | null;
    title: string;
    price: number;
    strikeThroughPrice?: number | null;
    stockQuantity: number;
    size?: string | null;
    color?: string | null;
    fabric?: string | null;
    bannerImage?: string | null;
    isDefault: boolean;
    isActive: boolean;
  }>;
  filters?: { name?: string; type?: string; value?: string; filter?: string }[];
};

type ProductFormProps = {
  product?: ProductDetails;
};

const emptyVariant: VariantRow = {
  sku: "",
  instagramLink: "",
  title: "",
  price: "",
  strikeThroughPrice: "",
  stockQuantity: "0",
  size: "",
  color: "",
  fabric: "",
  banner: null,
  gallery: [],
  isDefault: false,
  isActive: true,
};

function rupees(value?: number | null) {
  if (!value) return "";
  return String(value / 100);
}

function removeAt<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const { upload, uploading } = useFileUpload();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(product?.id);

  const initialCategories = useMemo(
    () => product?.categoryRes?.map((row) => row.categories.id) ?? [],
    [product],
  );

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [shortDescription, setShortDescription] = useState(
    product?.shortDescription ?? "",
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(rupees(product?.basePrice));
  const [strikeThroughPrice, setStrikeThroughPrice] = useState(
    rupees(product?.strikeThroughPrice),
  );
  const [status, setStatus] = useState<ProductStatus>(
    product?.status ?? "draft",
  );
  const [isFeatured, setIsFeatured] = useState(Boolean(product?.isFeatured));
  const [isNewArrival, setIsNewArrival] = useState(
    Boolean(product?.isNewArrival),
  );
  const [isTrending, setIsTrending] = useState(Boolean(product?.isTrending));
  const [categoryIds, setCategoryIds] = useState(initialCategories);
  const [attributes, setAttributes] = useState<AttributeRow[]>(
    product?.productAttributeRes?.map((item) => ({
      name: item.name ?? item.attribute ?? "",
      value: item.value,
    })) ?? [],
  );
  const [filters, setFilters] = useState<FilterRow[]>(
    product?.filters?.map((item) => ({
      name: item.name ?? item.type ?? "",
      value: item.value ?? item.filter ?? "",
    })) ?? [],
  );
  const mediaByVariant = useMemo(() => {
    const grouped = new Map<string, MediaRow[]>();

    product?.productMediaRes?.forEach((item) => {
      if (!item.variantId) return;

      const mediaItem = {
        key: item.key ?? item.mediaURL ?? "",
        previewUrl: item.previewUrl ?? item.mediaURL ?? "",
      };

      if (!mediaItem.key) return;

      grouped.set(item.variantId, [
        ...(grouped.get(item.variantId) ?? []),
        mediaItem,
      ]);
    });

    return grouped;
  }, [product]);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.productVariantRes?.length
      ? product.productVariantRes.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          instagramLink: variant.instagramLink ?? "",
          title: variant.title,
          price: rupees(variant.price),
          strikeThroughPrice: rupees(variant.strikeThroughPrice),
          stockQuantity: String(variant.stockQuantity),
          size: variant.size ?? "",
          color: variant.color ?? "",
          fabric: variant.fabric ?? "",
          banner: (() => {
            const variantMedia = mediaByVariant.get(variant.id) ?? [];
            const bannerKey = variant.bannerImage ?? variantMedia[0]?.key ?? "";

            if (!bannerKey) return null;

            return {
              key: bannerKey,
              previewUrl:
                variantMedia.find((item) => item.key === bannerKey)
                  ?.previewUrl ??
                variantMedia[0]?.previewUrl ??
                bannerKey,
            };
          })(),
          gallery: (mediaByVariant.get(variant.id) ?? []).slice(1),
          isDefault: variant.isDefault,
          isActive: variant.isActive,
        }))
      : [{ ...emptyVariant, isDefault: true }],
  );

  function updateRow<T>(
    rows: T[],
    setRows: (value: T[]) => void,
    index: number,
    patch: Partial<T>,
  ) {
    setRows(
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validVariants = variants.filter(
      (variant) => variant.sku && variant.title,
    );

    if (validVariants.length === 0) {
      toast.error("At least one variant must have a SKU and Title filled in.");
      return;
    }

    const payload = {
      name,
      slug,
      sku,
      shortDescription,
      description,
      price,
      strikeThroughPrice,
      status,
      isFeatured,
      isNewArrival,
      isTrending,
      categoryIds,
      attributes: attributes.filter((item) => item.name && item.value),
      filters: filters.filter((item) => item.name && item.value),
      variants: validVariants.map((variant) => ({
        ...variant,
        banner: variant.banner?.key ?? "",
        gallery: variant.gallery
          .filter((item) => item.key)
          .map((item) => ({ key: item.key })),
      })),
    };

    startTransition(async () => {
      const result = product?.id
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);

      if (result.success) {
        toast.success(result.message);
        router.push("/admin/products");
        return;
      }

      toast.error(result.message);
    });
  }

  async function handleVariantMediaUpload(
    variantIndex: number,
    target: "banner" | "gallery",
    files?: FileList | null,
  ) {
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const localPreviewUrl = URL.createObjectURL(file);
        try {
          const { fileKey } = await upload(file, "products");
          return { key: fileKey, previewUrl: localPreviewUrl };
        } catch (error) {
          URL.revokeObjectURL(localPreviewUrl);
          throw error;
        }
      });

      const uploadedMediaItems = await Promise.all(uploadPromises);

      setVariants((currentVariants) =>
        currentVariants.map((variant, index) => {
          if (index !== variantIndex) return variant;

          return target === "banner"
            ? { ...variant, banner: uploadedMediaItems[0] }
            : {
                ...variant,
                gallery: [...variant.gallery, ...uploadedMediaItems],
              };
        }),
      );
      toast.success(
        target === "banner"
          ? "Banner uploaded"
          : `${uploadedMediaItems.length} images uploaded to gallery`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Media upload failed",
      );
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {isEdit ? "Edit Product" : "Add Product"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Fields match the current product schema.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-6">
          <DynamicRows
            title="Variants"
            onAdd={() => {
              const first = variants[0];
              const replicated: VariantRow =
                first &&
                (first.sku ||
                  first.title ||
                  first.price ||
                  first.size ||
                  first.color ||
                  first.fabric)
                  ? {
                      ...emptyVariant,
                      // Copy common fields from the first variant
                      price: first.price,
                      strikeThroughPrice: first.strikeThroughPrice,
                      size: first.size,
                      color: first.color,
                      fabric: first.fabric,
                      stockQuantity: first.stockQuantity,
                      isActive: first.isActive,
                      // Replicate sku and title too; reset only media/isDefault
                      sku: first.sku,
                      instagramLink: first.instagramLink,
                      title: first.title,
                      banner: null,
                      gallery: [],
                      isDefault: false,
                    }
                  : { ...emptyVariant };
              setVariants([...variants, replicated]);
            }}
          >
            {variants.map((variant, index) => (
              <div
                key={index}
                className="grid gap-3 border-b pb-4 last:border-b-0 md:grid-cols-3"
              >
                <Input
                  placeholder="Variant SKU"
                  value={variant.sku}
                  onChange={(event) =>
                    updateRow(variants, setVariants, index, {
                      sku: event.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Title"
                  value={variant.title}
                  onChange={(event) =>
                    updateRow(variants, setVariants, index, {
                      title: event.target.value,
                    })
                  }
                />
                <Input
                  type="url"
                  placeholder="Instagram link"
                  value={variant.instagramLink}
                  onChange={(event) =>
                    updateRow(variants, setVariants, index, {
                      instagramLink: event.target.value,
                    })
                  }
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  value={variant.price}
                  onChange={(event) =>
                    updateRow(variants, setVariants, index, {
                      price: event.target.value,
                    })
                  }
                />
                <Input
                  type="number"
                  min={variant.price ? Number(variant.price) + 0.01 : 0}
                  step="0.01"
                  placeholder="Strike-through price"
                  value={variant.strikeThroughPrice}
                  onChange={(event) =>
                    updateRow(variants, setVariants, index, {
                      strikeThroughPrice: event.target.value,
                    })
                  }
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="Stock"
                  value={variant.stockQuantity}
                  onChange={(event) =>
                    updateRow(variants, setVariants, index, {
                      stockQuantity: event.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Size"
                  value={variant.size}
                  onChange={(event) =>
                    updateRow(variants, setVariants, index, {
                      size: event.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Color"
                  value={variant.color}
                  onChange={(event) =>
                    updateRow(variants, setVariants, index, {
                      color: event.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Fabric"
                  value={variant.fabric}
                  onChange={(event) =>
                    updateRow(variants, setVariants, index, {
                      fabric: event.target.value,
                    })
                  }
                />
                <div className="grid gap-3 md:col-span-3">
                  <div className="grid gap-3 md:grid-cols-[6rem_1fr_auto] md:items-center">
                    <div className="relative size-24 overflow-hidden rounded-md border bg-muted">
                      {variant.banner ? (
                        <Image
                          src={variant.banner.previewUrl}
                          alt="Variant banner preview"
                          height={700}
                          width={700}
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <span className="min-w-0 truncate rounded-md border border-input px-3 py-2 text-sm text-muted-foreground">
                      {variant.banner?.key ?? "No variant banner uploaded"}
                    </span>
                    <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-border bg-background px-2.5 text-sm font-medium shadow-xs transition hover:bg-muted">
                      <Plus />
                      {uploading ? "Uploading..." : "Banner"}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(event) =>
                          handleVariantMediaUpload(
                            index,
                            "banner",
                            event.target.files,
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Variant gallery</p>
                      <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-md border border-border bg-background px-2.5 text-sm font-medium shadow-xs transition hover:bg-muted">
                        <Plus />
                        {uploading ? "Uploading..." : "Gallery"}
                        <input
                          type="file"
                          hidden
                          multiple
                          accept="image/*"
                          onChange={(event) =>
                            handleVariantMediaUpload(
                              index,
                              "gallery",
                              event.target.files,
                            )
                          }
                        />
                      </label>
                    </div>
                    {variant.gallery.map((item, mediaIndex) => (
                      <div
                        key={`${item.key}-${mediaIndex}`}
                        className="flex items-center gap-3"
                      >
                        <div className="relative size-16 overflow-hidden rounded-md border bg-muted">
                          <Image
                            src={item.previewUrl}
                            alt="Variant gallery preview"
                            height={700}
                            width={700}
                            className="object-cover"
                          />
                        </div>
                        <span className="min-w-0 flex-1 truncate rounded-md border border-input px-3 py-2 text-sm text-muted-foreground">
                          {item.key}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() =>
                            updateRow(variants, setVariants, index, {
                              gallery: removeAt(variant.gallery, mediaIndex),
                            })
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))}
                    {variant.gallery.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No gallery images uploaded yet.
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={variant.isDefault}
                      onChange={(event) =>
                        setVariants(
                          variants.map((row, rowIndex) => ({
                            ...row,
                            isDefault:
                              rowIndex === index ? event.target.checked : false,
                          })),
                        )
                      }
                    />
                    Default
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={variant.isActive}
                      onChange={(event) =>
                        updateRow(variants, setVariants, index, {
                          isActive: event.target.checked,
                        })
                      }
                    />
                    Active
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setVariants(removeAt(variants, index))}
                    disabled={variants.length === 1}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </DynamicRows>

          <Card>
            <CardHeader>{/* <CardTitle>Product</CardTitle> */}</CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </Field>
              <Field label="Slug">
                <Input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="product-url-slug"
                />
              </Field>
              {/* <Field label="SKU">
                <Input value={sku} onChange={(event) => setSku(event.target.value)} required />
              </Field>
              <Field label="Base price">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                />
              </Field>
              <Field label="Strike-through price">
                <Input
                  type="number"
                  min={price ? Number(price) + 0.01 : 0}
                  step="0.01"
                  value={strikeThroughPrice}
                  onChange={(event) => setStrikeThroughPrice(event.target.value)}
                />
              </Field> */}
              <Field label="Short description" className="md:col-span-2">
                <Textarea
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                />
              </Field>
              <Field label="Description" className="md:col-span-2">
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-32"
                />
              </Field>
            </CardContent>
          </Card>

          <KeyValueRows
            title="Attributes"
            rows={attributes}
            setRows={setAttributes}
            firstPlaceholder="Name"
            secondPlaceholder="Value"
          />
          <KeyValueRows
            title="Filters"
            rows={filters}
            setRows={setFilters}
            firstPlaceholder="Filter name"
            secondPlaceholder="Filter value"
          />
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ProductStatus)
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                />
                Featured product
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(event) => setIsNewArrival(event.target.checked)}
                />
                Show in New Arrival
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isTrending}
                  onChange={(event) => setIsTrending(event.target.checked)}
                />
                Show in Trending
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <MultiCategorySelect
                selectedCategories={categoryIds}
                onCategoriesChange={setCategoryIds}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {children}
    </div>
  );
}

function DynamicRows({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus />
          Add
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  );
}

function KeyValueRows({
  title,
  rows,
  setRows,
  firstPlaceholder,
  secondPlaceholder,
}: {
  title: string;
  rows: AttributeRow[];
  setRows: (rows: AttributeRow[]) => void;
  firstPlaceholder: string;
  secondPlaceholder: string;
}) {
  return (
    <DynamicRows
      title={title}
      onAdd={() => setRows([...rows, { name: "", value: "" }])}
    >
      {rows.map((row, index) => (
        <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <Input
            placeholder={firstPlaceholder}
            value={row.name}
            onChange={(event) =>
              setRows(
                rows.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, name: event.target.value }
                    : item,
                ),
              )
            }
          />
          <Input
            placeholder={secondPlaceholder}
            value={row.value}
            onChange={(event) =>
              setRows(
                rows.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, value: event.target.value }
                    : item,
                ),
              )
            }
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setRows(removeAt(rows, index))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
    </DynamicRows>
  );
}
