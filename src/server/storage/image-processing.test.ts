import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { ownedStoragePath } from "@/lib/storage-ownership";
import { sanitizeUploadedImage } from "@/server/storage/image-processing";

test("re-encodes uploads, removes EXIF, and limits dimensions", async () => {
  const source = await sharp({
    create: {
      width: 400,
      height: 200,
      channels: 3,
      background: "#10b981",
    },
  })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
  const sanitized = await sanitizeUploadedImage({
    bytes: source,
    declaredContentType: "image/jpeg",
    maxBytes: 2 * 1024 * 1024,
    maxDimension: 100,
  });
  const metadata = await sharp(sanitized.bytes).metadata();
  assert.equal(sanitized.contentType, "image/jpeg");
  assert.ok((metadata.width ?? 0) <= 100);
  assert.ok((metadata.height ?? 0) <= 100);
  assert.equal(metadata.exif, undefined);
});

test("rejects files whose contents are not a supported image", async () => {
  await assert.rejects(
    sanitizeUploadedImage({
      bytes: Buffer.from("not an image"),
      declaredContentType: "image/jpeg",
      maxBytes: 1_024,
      maxDimension: 100,
    }),
  );
});

test("accepts only normalized storage paths owned by the auth user", () => {
  assert.equal(
    ownedStoragePath("auth-user/image.jpg", "auth-user"),
    "auth-user/image.jpg",
  );
  assert.equal(
    ownedStoragePath("other-user/image.jpg", "auth-user"),
    null,
  );
  assert.equal(
    ownedStoragePath("auth-user/../secret.jpg", "auth-user"),
    null,
  );
});
