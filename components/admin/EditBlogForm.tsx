/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBlog } from "@/helper/blog/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import {
  IconDeviceFloppy,
  IconX,
  IconPhoto,
  IconUser,
  IconRefresh,
} from "@tabler/icons-react";
import RichTextEditor from "../ui/rich-text-editor";
import { useFileUpload } from "@/helper/upload/client";

export default function EditBlogForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { upload } = useFileUpload();

  const [formData, setFormData] = useState({
    title: initialData.title || "",
    metaDescription: initialData.metaDescription || "",
    blogCategory: initialData.blogCategory || "",
    image: initialData.image || "",
    imageKey: initialData.imageKey || "",
    userImage: initialData.userImage || "",
    userName: initialData.userName || "",
    date: initialData.date || "",
    data: initialData.data || "",
    tags: Array.isArray(initialData.tags)
      ? initialData.tags.join(", ")
      : initialData.tags || "",
  });

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "image" | "userImage",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    const previousPreview = formData[field];

    setFormData((prev) => ({
      ...prev,
      [field]: localPreviewUrl,
    }));

    try {
      const { fileKey } = await upload(
        file,
        field === "image" ? "blog" : "users",
      );

      setFormData((prev) => ({
        ...prev,
        ...(field === "image" ? { imageKey: fileKey } : {}),
      }));
    } catch (error) {
      URL.revokeObjectURL(localPreviewUrl);
      setFormData((prev) => ({
        ...prev,
        [field]: previousPreview,
      }));
      console.error("Upload failed", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await updateBlog(initialData.id, formData);

    if (res.success) {
      router.push("/admin/blog");
      router.refresh();
    } else {
      alert("Something went wrong!");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="space-y-4 bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-2">
            <IconPhoto className="w-5 h-5 text-teal-600" /> Main Details
          </h3>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Blog Title
            </label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter catchy title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Category
              </label>
              <Input
                value={formData.blogCategory}
                onChange={(e) =>
                  setFormData({ ...formData, blogCategory: e.target.value })
                }
                placeholder="e.g. Period Care"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Publish Date
              </label>
              <Input
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                placeholder="January 10, 2024"
              />
            </div>
          </div>

          {/* MAIN IMAGE */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Main Image
            </label>

            <div className="relative border-2 border-dashed rounded-xl p-6 text-center hover:bg-gray-50 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => handleFileUpload(e, "image")}
              />
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                {formData.image ? (
                  <>
                    <IconRefresh className="w-4 h-4" />
                    Change Image
                  </>
                ) : (
                  "Upload Image"
                )}
              </p>
            </div>

            {formData.image && (
              <div className="mt-3 relative h-40 w-full rounded-lg overflow-hidden border">
                <Image
                  src={formData.image}
                  alt="Preview"
                  height={700}
                  width={700}
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4 bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-2">
            <IconUser className="w-5 h-5 text-teal-600" /> Author & Metadata
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Author Name
              </label>
              <Input
                value={formData.userName}
                onChange={(e) =>
                  setFormData({ ...formData, userName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Author Image
              </label>

              <div className="relative border rounded-md p-3 text-center bg-white cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleFileUpload(e, "userImage")}
                />

                <span className="text-sm text-gray-600 flex items-center justify-center gap-2">
                  {formData.userImage ? (
                    <>
                      <IconRefresh className="w-4 h-4" />
                      Change Photo
                    </>
                  ) : (
                    "Upload Photo"
                  )}
                </span>
              </div>

              {formData.userImage && (
                <div className="mt-2 relative h-24 w-24 rounded-full overflow-hidden border">
                  <Image
                    src={formData.userImage}
                    alt="Author"
                    height={700}
                    width={700}
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Meta Description
            </label>
            <Textarea
              value={formData.metaDescription}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  metaDescription: e.target.value,
                })
              }
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Tags (comma separated)
            </label>
            <Input
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="health, wellness, hygiene"
            />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <label className="block font-bold text-lg mb-4 border-b pb-2">
          Blog Content (Data)
        </label>
        <RichTextEditor
          value={formData.data}
          onChange={(val) => setFormData({ ...formData, data: val })}
        />
      </div>

      {/* BUTTONS */}
      <div className="bottom-0 left-0 right-0 p-4 flex justify-center gap-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-100">
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#168BA0] hover:bg-[#137688] text-white px-10 py-4 text-lg font-bold shadow-md"
        >
          {loading ? (
            "Saving Changes..."
          ) : (
            <>
              <IconDeviceFloppy className="w-5 h-5 mr-2" />
              Update Post
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="px-10 py-4 text-lg border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <IconX className="w-5 h-5 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
