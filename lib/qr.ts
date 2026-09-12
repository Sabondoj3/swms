import QRCode from "qrcode";

export function buildQrPayload(code: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/report?collectionPoint=${encodeURIComponent(code)}`;
}

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { width: 512, margin: 2, errorCorrectionLevel: "M" });
}

export function parseCollectionPointFromUrl(input: string): string | null {
  try {
    const u = new URL(input);
    return u.searchParams.get("collectionPoint");
  } catch {
    // Might be a raw code like RGU-CAMPUS-BIN-001
    if (/^[A-Z0-9\-_]{3,50}$/i.test(input.trim())) return input.trim();
    return null;
  }
}
