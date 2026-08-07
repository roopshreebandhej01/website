"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCategory, getAllCategoriesMeta } from "@/helper/category/action";
import { useFileUpload } from "@/helper/upload/client";

type CategoryOption = {
  id: string;
  name: string;
};

export default function AddCategoryForm() {
  const router = useRouter();
  const { upload, uploading } = useFileUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");
  const [bannerImageKey, setBannerImageKey] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  useEffect(() => {
    getAllCategoriesMeta().then(setCategories);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await createCategory({
        name,
        parentId,
        description,
        bannerImage: bannerImageKey,
      });

      if (response.success) {
        toast.success(response.message);
        router.push("/admin/category");
        router.refresh();
        return;
      }

      toast.error(response.message);
    });
  }

  async function handleBanner(file?: File) {
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    setBannerPreview(localPreviewUrl);

    try {
      const { fileKey } = await upload(file, "category");
      setBannerImageKey(fileKey);
      toast.success("Image uploaded");
    } catch (error) {
      URL.revokeObjectURL(localPreviewUrl);
      setBannerPreview("");
      toast.error(
        error instanceof Error ? error.message : "Image upload failed",
      );
    }
  }

  return (
    <div className="w-full p-1">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Add Category
          </CardTitle>
          <CardDescription>
            Create a category using the current category schema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <Field label="Category Name">
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </Field>

              <Field label="Parent Category">
                <select
                  value={parentId}
                  onChange={(event) => setParentId(event.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">No parent</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Description">
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-36"
                />
              </Field>
            </div>

            <div className="space-y-6">
              <Field label="Category Image">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-sm text-muted-foreground"
                >
                  {bannerPreview ? (
                    <Image
                      src={bannerPreview}
                      alt="Category preview"
                      height={700}
                      width={700}
                      className="object-contain"
                    />
                  ) : uploading ? (
                    "Uploading..."
                  ) : (
                    "Click to upload category image"
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(event) => handleBanner(event.target.files?.[0])}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-4 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/category")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Add"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
