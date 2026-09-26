import "server-only";

import sharp from "sharp";

export const MAX_IMAGE_INPUT_BYTES = 15 * 1024 * 1024;
export const MAX_MEDIA_INPUT_BYTES = 50 * 1024 * 1024;
export const MAX_UPLOADS_PER_BATCH = 10;
export const MAX_ACCOUNT_STORAGE_BYTES = 250 * 1024 * 1024;
export const MAX_ACCOUNT_FILES = 500;

type SafeUpload = {
  bytes: Buffer;
  contentType: string;
  extension: string;
};

const mediaSignatures: Array<{ type: string; extension: string; matches: (bytes: Buffer) => boolean }> = [
  { type: "audio/mpeg", extension: "mp3", matches: (b) => b.subarray(0, 3).toString("ascii") === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) },
  { type: "audio/wav", extension: "wav", matches: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WAVE" },
  { type: "video/webm", extension: "webm", matches: (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
  { type: "video/mp4", extension: "mp4", matches: (b) => b.subarray(4, 8).toString("ascii") === "ftyp" },
  { type: "audio/mp4", extension: "m4a", matches: (b) => b.subarray(4, 8).toString("ascii") === "ftyp" },
];

async function scanWithPrivateService(bytes: Buffer, file: File) {
  const endpoint = process.env.MORI_FILE_SCAN_URL;
  if (!endpoint) return false;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
      "x-mori-filename": encodeURIComponent(file.name.slice(0, 180)),
      ...(process.env.MORI_FILE_SCAN_TOKEN ? { authorization: `Bearer ${process.env.MORI_FILE_SCAN_TOKEN}` } : {}),
    },
    body: new Uint8Array(bytes).buffer,
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("File safety scanning is temporarily unavailable");
  const result = (await response.json()) as { clean?: boolean };
  if (result.clean !== true) throw new Error("This file did not pass the safety scan");
  return true;
}

export async function secureUpload(file: File): Promise<SafeUpload> {
  if (file.size < 1 || file.size > MAX_MEDIA_INPUT_BYTES) throw new Error("Choose a supported file up to 50 MB");
  const input = Buffer.from(await file.arrayBuffer());

  if (file.type.startsWith("image/")) {
    if (file.size > MAX_IMAGE_INPUT_BYTES) throw new Error("Images must be 15 MB or smaller");
    if (process.env.MORI_FILE_SCAN_URL) await scanWithPrivateService(input, file);
    try {
      const image = sharp(input, { failOn: "warning", limitInputPixels: 40_000_000, animated: false });
      const metadata = await image.metadata();
      if (!metadata.width || !metadata.height || !["jpeg", "png", "webp", "gif"].includes(metadata.format ?? "")) throw new Error();
      const bytes = await image
        .rotate()
        .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      return { bytes, contentType: "image/webp", extension: "webp" };
    } catch {
      throw new Error("The image is damaged or is not a supported JPEG, PNG, WebP, or GIF");
    }
  }

  const detected = mediaSignatures.find((signature) => signature.matches(input));
  const compatibleMp4 = detected?.extension === "mp4" && (file.type === "video/mp4" || file.type === "audio/mp4");
  if (!detected || (detected.type !== file.type && !compatibleMp4)) throw new Error("The file contents do not match the selected media type");
  if (!process.env.MORI_FILE_SCAN_URL) throw new Error("Audio and video uploads require the private file scanner");
  await scanWithPrivateService(input, file);
  return { bytes: input, contentType: file.type, extension: file.type === "audio/mp4" ? "m4a" : detected.extension };
}
