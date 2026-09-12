import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";

export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

export const MAX_UPLOAD_BYTES =
  Number(process.env.MAX_UPLOAD_MB ?? 8) * 1024 * 1024;

export interface StoredFile {
  url: string;
  filename: string;
}

export interface StorageProvider {
  save(
    buffer: Buffer,
    originalName: string,
    mime: string
  ): Promise<StoredFile>;
}

export class LocalStorageProvider implements StorageProvider {
  async save(
    buffer: Buffer,
    originalName: string,
    _mime: string
  ): Promise<StoredFile> {
    const uploadDir = process.env.UPLOAD_DIR ?? "./public/uploads";

    const abs = path.isAbsolute(uploadDir)
      ? uploadDir
      : path.join(process.cwd(), uploadDir);

    await mkdir(abs, { recursive: true });

    const ext = path.extname(originalName) || ".jpg";
    const filename = `${Date.now()}-${crypto
      .randomBytes(8)
      .toString("hex")}${ext}`;

    await writeFile(path.join(abs, filename), buffer);

    return {
      url: `/uploads/${filename}`,
      filename,
    };
  }
}

export class CloudinaryStorageProvider implements StorageProvider {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async save(
    buffer: Buffer,
    originalName: string,
    _mime: string
  ): Promise<StoredFile> {
    const baseName =
      path.parse(originalName).name || `swms-${Date.now()}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "swms",
          resource_type: "image",
          public_id: `${Date.now()}-${baseName}`,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }

          resolve({
            url: result.secure_url,
            filename: result.public_id,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }
}

export function getStorage(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  if (provider === "cloudinary") {
    return new CloudinaryStorageProvider();
  }

  return new LocalStorageProvider();
}

export function validateImage(mime: string, size: number) {
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("Only JPG, PNG or WEBP images are allowed");
  }

  if (size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Image must be smaller than ${process.env.MAX_UPLOAD_MB ?? 8}MB`
    );
  }
}