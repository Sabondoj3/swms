import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 8) * 1024 * 1024;

export interface StoredFile {
  url: string;
  filename: string;
}

export interface StorageProvider {
  save(buffer: Buffer, originalName: string, mime: string): Promise<StoredFile>;
}

// Local storage for MVP. Swap with S3/Cloudinary by implementing StorageProvider.
export class LocalStorageProvider implements StorageProvider {
  async save(buffer: Buffer, originalName: string, _mime: string): Promise<StoredFile> {
    const uploadDir = process.env.UPLOAD_DIR ?? "./public/uploads";
    const abs = path.isAbsolute(uploadDir) ? uploadDir : path.join(process.cwd(), uploadDir);
    await mkdir(abs, { recursive: true });
    const ext = path.extname(originalName) || ".jpg";
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    await writeFile(path.join(abs, filename), buffer);
    return { url: `/uploads/${filename}`, filename };
  }
}

export function getStorage(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  // Future: if (provider === "s3") return new S3StorageProvider(); etc.
  void provider;
  return new LocalStorageProvider();
}

export function validateImage(mime: string, size: number) {
  if (!ALLOWED_MIME.has(mime)) throw new Error("Only JPG, PNG or WEBP images are allowed");
  if (size > MAX_UPLOAD_BYTES) throw new Error(`Image must be smaller than ${process.env.MAX_UPLOAD_MB ?? 8}MB`);
}
