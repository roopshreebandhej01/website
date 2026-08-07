/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { getAllCategoriesMeta, updateCategory } from "@/helper/category/action";
import { toast } from "sonner";
import { useFileUpload } from "@/helper/upload/client";

export default function EditCategory({ categoryInfo }: any) {
  const router = useRouter();
  const { upload, uploading } = useFileUpload();
  const bannerRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const initialParentId =
    categoryInfo.parentId && categoryInfo.parentId !== categoryInfo.id
      ? categoryInfo.parentId
      : "";

  const [form, setForm] = useState({
    name: categoryInfo.name,
    description: categoryInfo.description ?? "",
  });

  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [selectedParent, setSelectedParent] = useState<string>(initialParentId);

  const [bannerImageKey, setBannerImageKey] = useState<string>(
    categoryInfo.bannerImage ?? "",
  );
  const [preview, setPreview] = useState<string | null>(
    categoryInfo.bannerPreview ?? null,
  );

  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesData = await getAllCategoriesMeta();
      setCategories(categoriesData);
    };
    fetchCategories();
  }, []);

  const submitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      const response = await updateCategory({
        id: categoryInfo.id,
        name: form.name,
        parentId: selectedParent,
        description: form.description,
        bannerImage: bannerImageKey,
      });

      if (response?.success) {
        toast.success(response.message ?? "Category updated successfully");
        router.push("/admin/category");
        router.refresh();
        return;
      }

      toast.error(response?.message ?? "Failed to update category");
    });
  };

  const handleBanner = async (file?: File) => {
    if (!file) return;

    const previousPreview = preview;
    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);

    try {
      const { fileKey } = await upload(file, "category");

      setBannerImageKey(fileKey);

      toast.success("Image uploaded");
    } catch (err) {
      URL.revokeObjectURL(localPreviewUrl);
      setPreview(previousPreview);
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    }
  };

  return (
    <div className="w-full p-1">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Manage Category
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Update category details and visibility.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={submitHandler}>
            <input type="hidden" name="id" value={categoryInfo.id} />
            <input type="hidden" name="parentId" value={selectedParent} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 font-medium">
                    Category Name
                  </Label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-600 font-medium">
                    Parent Category
                  </Label>
                  <select
                    value={selectedParent}
                    onChange={(event) => setSelectedParent(event.target.value)}
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">No parent</option>
                    {categories
                      .filter((category) => category.id !== categoryInfo.id)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-600 font-medium">
                    Description
                  </Label>
                  <Textarea
                    name="description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="min-h-[140px] resize-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 font-medium">
                    Category Image
                  </Label>

                  <div
                    onClick={() => bannerRef.current?.click()}
                    className="border-2 border-dashed rounded-xl h-48 flex items-center justify-center cursor-pointer relative overflow-hidden"
                  >
                    {!preview ? (
                      <p>Click to upload category image</p>
                    ) : (
                      <Image
                        src={preview}
                        alt="Category preview"
                        height={700}
                        width={700}
                        className="object-contain"
                      />
                    )}

                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        Uploading...
                      </div>
                    )}
                  </div>

                  <input
                    ref={bannerRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleBanner(e.target.files?.[0])}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 px-0 pt-10">
              <Button
                type="button"
                onClick={() => router.push("/admin/category")}
                variant="outline"
                className="px-12 h-11 rounded-full"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isPending || uploading}
                className="px-12 h-11 rounded-full bg-[#2D5A5D] hover:bg-[#234749] text-white"
              >
                {isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
