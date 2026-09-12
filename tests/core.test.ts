import { describe, it, expect } from "vitest";
import { registerSchema, reportSchema, assignSchema, collectionPointSchema } from "../lib/validations";
import { suggestPriority } from "../lib/classification";
import { parseCollectionPointFromUrl, buildQrPayload } from "../lib/qr";
import { rateLimit } from "../lib/rate-limit";

process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

describe("registration validation", () => {
  it("accepts valid input", () => {
    const r = registerSchema.safeParse({ fullName: "Test User", email: "a@b.com", phone: "", password: "Password1", confirmPassword: "Password1", terms: true });
    expect(r.success).toBe(true);
  });
  it("rejects weak password", () => {
    const r = registerSchema.safeParse({ fullName: "T", email: "a@b.com", password: "weak", confirmPassword: "weak", terms: true });
    expect(r.success).toBe(false);
  });
  it("rejects mismatched passwords", () => {
    const r = registerSchema.safeParse({ fullName: "Test User", email: "a@b.com", password: "Password1", confirmPassword: "Password2", terms: true });
    expect(r.success).toBe(false);
  });
});

describe("report creation validation", () => {
  it("accepts valid report", () => {
    const r = reportSchema.safeParse({ latitude: -17.8, longitude: 31.05, address: "Library", wasteCategory: "PLASTIC", problemType: "BIN_OVERFLOWING", description: "", imageUrls: [] });
    expect(r.success).toBe(true);
  });
  it("rejects bad coords", () => {
    const r = reportSchema.safeParse({ latitude: 200, longitude: 31, address: "x", wasteCategory: "PLASTIC", problemType: "BIN_OVERFLOWING", imageUrls: [] });
    expect(r.success).toBe(false);
  });
});

describe("role + assignment validation", () => {
  it("assignment requires ids", () => {
    expect(assignSchema.safeParse({ reportId: "r1", collectorId: "c1" }).success).toBe(true);
    expect(assignSchema.safeParse({ reportId: "", collectorId: "" }).success).toBe(false);
  });
  it("collection point code format", () => {
    const ok = collectionPointSchema.safeParse({ code: "RGU-CAMPUS-BIN-001", name: "Test Bin Long", address: "Some address here", latitude: -17.8, longitude: 31.05 });
    expect(ok.success).toBe(true);
  });
});

describe("status/priority logic", () => {
  it("hazardous suggests critical", () => {
    expect(suggestPriority("BIN_OVERFLOWING", "HAZARDOUS")).toBe("CRITICAL");
  });
  it("illegal dumping suggests high", () => {
    expect(suggestPriority("ILLEGAL_DUMPING", "MIXED")).toBe("HIGH");
  });
});

describe("QR resolution", () => {
  it("builds and parses QR payload", () => {
    const payload = buildQrPayload("RGU-CAMPUS-BIN-001");
    expect(payload).toContain("RGU-CAMPUS-BIN-001");
    expect(parseCollectionPointFromUrl(payload)).toBe("RGU-CAMPUS-BIN-001");
    expect(parseCollectionPointFromUrl("RGU-CAMPUS-BIN-002")).toBe("RGU-CAMPUS-BIN-002");
  });
});

describe("rate limit", () => {
  it("blocks after limit", () => {
    const key = `test-${Date.now()}`;
    for (let i = 0; i < 5; i++) expect(rateLimit(key, 5, 60000).ok).toBe(true);
    expect(rateLimit(key, 5, 60000).ok).toBe(false);
  });
});
