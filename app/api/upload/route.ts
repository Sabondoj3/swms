import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStorage, validateImage } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const kind = (form.get("kind") as string) ?? "BEFORE";
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    validateImage(file.type, file.size);
    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorage();
    const saved = await storage.save(buffer, file.name || "upload.jpg", file.type);
    void kind;
    return NextResponse.json({ ok: true, url: saved.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
