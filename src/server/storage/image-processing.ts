import sharp from "sharp";

const OUTPUTS = {
  jpeg: {
    extension: "jpg",
    contentType: "image/jpeg",
  },
  png: {
    extension: "png",
    contentType: "image/png",
  },
  webp: {
    extension: "webp",
    contentType: "image/webp",
  },
} as const;

type AllowedFormat = keyof typeof OUTPUTS;

export async function sanitizeUploadedImage(input: {
  bytes: Buffer;
  declaredContentType: string;
  maxBytes: number;
  maxDimension: number;
}) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(
      input.declaredContentType,
    )
  ) {
    throw new Error("UNSUPPORTED_IMAGE_TYPE");
  }
  let image = sharp(input.bytes, {
    failOn: "error",
    limitInputPixels: 40_000_000,
    sequentialRead: true,
  });
  const metadata = await image.metadata();
  if (
    !metadata.format ||
    !(metadata.format in OUTPUTS) ||
    !metadata.width ||
    !metadata.height ||
    (metadata.pages ?? 1) > 1
  ) {
    throw new Error("INVALID_IMAGE_CONTENT");
  }

  const format = metadata.format as AllowedFormat;
  image = image
    .rotate()
    .resize({
      width: input.maxDimension,
      height: input.maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    });
  const bytes =
    format === "jpeg"
      ? await image.jpeg({ quality: 88, mozjpeg: true }).toBuffer()
      : format === "png"
        ? await image.png({ compressionLevel: 9 }).toBuffer()
        : await image.webp({ quality: 88 }).toBuffer();
  if (bytes.length <= 0 || bytes.length > input.maxBytes) {
    throw new Error("PROCESSED_IMAGE_TOO_LARGE");
  }
  return {
    bytes,
    ...OUTPUTS[format],
    originalWidth: metadata.width,
    originalHeight: metadata.height,
  };
}
