"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/helper/upload/client";

type ImageUploadProps = {
  initialImage?: string | null;
  onUploadSuccess?: (url: string, key: string) => void;
  folder?: string;
};

export default function ImageUpload({
  initialImage,
  onUploadSuccess,
  folder = "uploads",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useFileUpload();
  const [preview, setPreview] = useState(initialImage ?? "");

  async function handleFile(file?: File) {
    if (!file) return;

    const result = await upload(file, folder);
    setPreview(result.fileUrl);
    onUploadSuccess?.(result.fileUrl, result.fileKey);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-md border border-dashed border-input bg-muted/30 text-sm text-muted-foreground"
      >
        {preview ? (
          <Image
            src={preview}
            alt="Uploaded preview"
            height={700}
            width={700}
            className="object-contain"
          />
        ) : (
          "Click to upload image"
        )}
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            Uploading...
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/*"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {preview ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          Change image
        </Button>
      ) : null}
    </div>
  );
}
