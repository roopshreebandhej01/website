import { maxImageUploadSize, maxImageUploadSizeLabel } from "@/lib/upload-limits";

const validImageTypes = ["image/jpeg", "image/png", "image/webp"];

type ValidateImageOptions = {
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  ratio?: number;
};

export function validateImage(
  file?: File | null,
  options: ValidateImageOptions = {},
) {
  if (!file) {
    return { success: false, message: "Please select an image" };
  }

  if (!validImageTypes.includes(file.type)) {
    return { success: false, message: "Only JPG, PNG and WEBP images are allowed" };
  }

  const maxSize = options.maxSizeMB
    ? Math.min(maxImageUploadSize, options.maxSizeMB * 1024 * 1024)
    : maxImageUploadSize;

  if (file.size > maxSize) {
    return {
      success: false,
      message: `Image must be under ${maxImageUploadSizeLabel}`,
    };
  }

  return { success: true, message: "Image is valid" };
}
