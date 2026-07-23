"use client";

import { useState } from "react";
import { createImageUploadAction } from "@/actions/upload.action";
import { maxImageUploadSize, maxImageUploadSizeLabel } from "@/lib/upload-limits";

type UploadResponse = {
  uploadUrl: string;
  key: string;
  previewUrl: string;
  error?: never;
};

type UploadErrorResponse = {
  error: string;
};

type UploadFolder = "products" | "categories" | "banners" | "users" | "reviews";

const compressedImageType = "image/webp";
const compressedImageExtension = "webp";
const compressibleImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageDimension = 1600;
const minImageDimension = 320;
const imageQualitySteps = [0.82, 0.74, 0.66, 0.58, 0.5, 0.42, 0.34, 0.26];

const folderAliases: Record<string, UploadFolder> = {
  product: "products",
  products: "products",
  category: "categories",
  categories: "categories",
  blog: "banners",
  blogs: "banners",
  banner: "banners",
  banners: "banners",
  user: "users",
  users: "users",
  review: "reviews",
  reviews: "reviews",
};

function normalizeFolder(folder: string): UploadFolder {
  return folderAliases[folder] ?? "products";
}

type LoadedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

function getImageDimensions(width: number, height: number) {
  const largestDimension = Math.max(width, height);

  if (largestDimension <= maxImageDimension) {
    return { width, height };
  }

  const scale = maxImageDimension / largestDimension;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function getCompressedImageExtension(contentType: string) {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";

  return compressedImageExtension;
}

function getCompressedFileName(fileName: string, contentType: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim() || "image";

  return `${baseName}.${getCompressedImageExtension(contentType)}`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to compress image"));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function drawImage(
  context: CanvasRenderingContext2D,
  image: LoadedImage,
  width: number,
  height: number,
) {
  context.clearRect(0, 0, width, height);
  context.drawImage(image.source, 0, 0, width, height);
}

async function loadImage(file: File): Promise<LoadedImage> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Fall back to an HTMLImageElement below for browsers/files that reject ImageBitmap.
    }
  }

  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => URL.revokeObjectURL(objectUrl),
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read image"));
    };
    image.src = objectUrl;
  });
}

async function compressImageForUpload(file: File) {
  if (!compressibleImageTypes.has(file.type)) {
    return file;
  }

  if (file.size <= maxImageUploadSize) {
    return file;
  }

  const image = await loadImage(file);

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to compress image");
    }

    let { width, height } = getImageDimensions(image.width, image.height);
    let smallestBlob: Blob | null = null;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      canvas.width = width;
      canvas.height = height;
      drawImage(context, image, width, height);

      for (const quality of imageQualitySteps) {
        const blob = await canvasToBlob(canvas, compressedImageType, quality);

        if (!smallestBlob || blob.size < smallestBlob.size) {
          smallestBlob = blob;
        }

        if (blob.size <= maxImageUploadSize) {
          const contentType = blob.type || compressedImageType;

          return new File([blob], getCompressedFileName(file.name, contentType), {
            type: contentType,
            lastModified: Date.now(),
          });
        }
      }

      const largestDimension = Math.max(width, height);

      if (largestDimension <= minImageDimension) {
        break;
      }

      const sizeScale = smallestBlob
        ? Math.sqrt(maxImageUploadSize / smallestBlob.size) * 0.92
        : 0.82;
      const nextScale = Math.min(0.86, Math.max(0.55, sizeScale));

      const nextWidth = Math.max(1, Math.round(width * nextScale));
      const nextHeight = Math.max(1, Math.round(height * nextScale));
      const nextLargestDimension = Math.max(nextWidth, nextHeight);

      if (nextLargestDimension < minImageDimension) {
        const minScale = minImageDimension / largestDimension;
        width = Math.max(1, Math.round(width * minScale));
        height = Math.max(1, Math.round(height * minScale));
      } else {
        width = nextWidth;
        height = nextHeight;
      }
    }
  } finally {
    image.close();
  }

  throw new Error(
    `Image could not be compressed below ${maxImageUploadSizeLabel}. Please choose a smaller image.`,
  );
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File, folder = "products") {
    setUploading(true);

    try {
      const uploadFile = await compressImageForUpload(file);

      const data = (await createImageUploadAction({
        fileName: uploadFile.name,
        contentType: uploadFile.type,
        size: uploadFile.size,
        folder: normalizeFolder(folder),
      })) as UploadResponse | UploadErrorResponse;

      if ("error" in data) {
        throw new Error(data.error);
      }

      if (!data.uploadUrl || !data.key || !data.previewUrl) {
        throw new Error("Failed to create upload URL");
      }

      const uploadResponse = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": uploadFile.type,
        },
        body: uploadFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      return {
        fileKey: data.key,
        fileUrl: data.previewUrl,
        contentType: uploadFile.type,
        size: uploadFile.size,
        originalSize: file.size,
      };
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading };
}
