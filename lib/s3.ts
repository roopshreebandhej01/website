import { PutObjectCommand, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { maxImageUploadSize } from '@/lib/upload-limits'

const defaultUploadExpiresIn = 60
const compressedImageContentType = 'image/webp'
const compressedImageExtension = 'webp'
const maxImageDimension = 1600
const minImageDimension = 320
const imageQualitySteps = [82, 74, 66, 58, 50, 42, 34, 26]

function getS3Region() {
  return process.env.S3_AWS_REGION ?? process.env.AWS_REGION ?? 'ap-south-1'
}

function getS3BucketName() {
  const bucketName = process.env.AWS_BUCKET

  if (!bucketName) {
    throw new Error('Missing AWS_BUCKET')
  }

  return bucketName
}

function getS3ClientConfig(): S3ClientConfig {
  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID ??
    process.env.ACCESS_KEY_ID ??
    process.env.ACCESS_KEY
  const secretAccessKey =
    process.env.S3_AWS_SECRET_ACCESS_KEY ??
    process.env.AWS_SECRET_ACCESS_KEY ??
    process.env.SECRET_KEY

  if (!accessKeyId || !secretAccessKey) {
    return {
      region: getS3Region(),
    }
  }

  return {
    region: getS3Region(),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  }
}

export const s3Client = new S3Client(getS3ClientConfig())

export function getS3ObjectPreviewUrl(key: string) {
  const publicBaseUrl =
    process.env.S3_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_S3_BASE_URL

  const s3Hostname = `https://${getS3BucketName()}.s3.${getS3Region()}.amazonaws.com/`

  if (key.startsWith('http://') || key.startsWith('https://')) {
    if (publicBaseUrl && key.startsWith(s3Hostname)) {
      return key.replace(s3Hostname, `${publicBaseUrl.replace(/\/$/, '')}/`)
    }
    return key;
  }


  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, '')}/${key}`
  }

  return `https://${getS3BucketName()}.s3.${getS3Region()}.amazonaws.com/${key}`
}

export async function createS3ImageUploadUrl({
  key,
  contentType,
  expiresIn = defaultUploadExpiresIn,
}: {
  key: string
  contentType: string
  expiresIn?: number
}) {
  const command = new PutObjectCommand({
    Bucket: getS3BucketName(),
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

function normalizeImageContentType(contentType: string) {
  const normalized = contentType.split(';')[0]?.trim().toLowerCase()

  if (normalized === 'image/jpg') return 'image/jpeg'
  if (normalized?.startsWith('image/')) return normalized

  return 'image/jpeg'
}

function getImageExtension(contentType: string) {
  if (contentType === 'image/jpeg') return 'jpg'
  if (contentType === 'image/png') return 'png'
  if (contentType === compressedImageContentType) return compressedImageExtension

  return contentType.split('/')[1]?.replace(/[^a-z0-9]/g, '') || 'jpg'
}

function getResizedDimensions(width?: number, height?: number) {
  if (!width || !height) {
    return {}
  }

  const largestDimension = Math.max(width, height)

  if (largestDimension <= maxImageDimension) {
    return { width, height }
  }

  const scale = maxImageDimension / largestDimension

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function scaleDimensions(width?: number, height?: number, scale = 0.82) {
  if (!width || !height) {
    return {}
  }

  const largestDimension = Math.max(width, height)

  if (largestDimension <= minImageDimension) {
    return { width, height }
  }

  const nextWidth = Math.max(1, Math.round(width * scale))
  const nextHeight = Math.max(1, Math.round(height * scale))
  const nextLargestDimension = Math.max(nextWidth, nextHeight)

  if (nextLargestDimension < minImageDimension) {
    const minScale = minImageDimension / largestDimension

    return {
      width: Math.max(1, Math.round(width * minScale)),
      height: Math.max(1, Math.round(height * minScale)),
    }
  }

  return { width: nextWidth, height: nextHeight }
}

async function compressImageBufferForUpload(
  buffer: Buffer,
  contentType: string,
) {
  const normalizedContentType = normalizeImageContentType(contentType)

  if (buffer.length <= maxImageUploadSize) {
    return {
      buffer,
      contentType: normalizedContentType,
      extension: getImageExtension(normalizedContentType),
    }
  }

  const sharp = (await import('sharp')).default
  const metadata = await sharp(buffer, { failOn: 'none' }).metadata()
  let { width, height } = getResizedDimensions(metadata.width, metadata.height)
  let smallestBuffer: Buffer | null = null

  for (let attempt = 0; attempt < 10; attempt += 1) {
    for (const quality of imageQualitySteps) {
      let transformer = sharp(buffer, { failOn: 'none' }).rotate()

      if (width && height) {
        transformer = transformer.resize({
          width,
          height,
          fit: 'inside',
          withoutEnlargement: true,
        })
      }

      const compressedBuffer = await transformer
        .webp({ quality, effort: 5 })
        .toBuffer()

      if (!smallestBuffer || compressedBuffer.length < smallestBuffer.length) {
        smallestBuffer = compressedBuffer
      }

      if (compressedBuffer.length <= maxImageUploadSize) {
        return {
          buffer: compressedBuffer,
          contentType: compressedImageContentType,
          extension: compressedImageExtension,
        }
      }
    }

    if (!width || !height || Math.max(width, height) <= minImageDimension) {
      break
    }

    const sizeScale = smallestBuffer
      ? Math.sqrt(maxImageUploadSize / smallestBuffer.length) * 0.92
      : 0.82
    const nextScale = Math.min(0.86, Math.max(0.55, sizeScale))
    const nextDimensions = scaleDimensions(width, height, nextScale)

    width = nextDimensions.width
    height = nextDimensions.height
  }

  throw new Error('Image could not be compressed below the upload limit')
}

export async function uploadImageFromUrlToS3(imageUrl: string, folder = 'products') {
  if (!imageUrl) return null;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const compressedImage = await compressImageBufferForUpload(buffer, contentType);

    const uniqueId = crypto.randomUUID();
    const key = `${folder}/${new Date().getFullYear()}/${uniqueId}.${compressedImage.extension}`;

    const command = new PutObjectCommand({
      Bucket: getS3BucketName(),
      Key: key,
      ContentType: compressedImage.contentType,
      Body: compressedImage.buffer,
    });

    await s3Client.send(command);

    return key;
  } catch (error) {
    console.error(`Error uploading image from URL (${imageUrl}):`, error);
    return null;
  }
}
