import crypto from "node:crypto";

const TOKEN_TTL_SECONDS = 10 * 60;

type CommunityClaims = { sub: string; role: "PUBLIC"; exp: number };

function secret() {
  return process.env.NEXTAUTH_SECRET ?? "development-only-community-secret";
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createCommunityAccessToken(userId: string) {
  const claims: CommunityClaims = { sub: userId, role: "PUBLIC", exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS };
  const payload = encode(JSON.stringify(claims));
  return `${payload}.${signature(payload)}`;
}

export function verifyCommunityAccessToken(token: string) {
  const [payload, providedSignature] = token.split(".");
  if (!payload || !providedSignature) return null;
  const expectedSignature = signature(payload);
  if (providedSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) return null;
  try {
    const claims = JSON.parse(decode(payload)) as CommunityClaims;
    if (claims.role !== "PUBLIC" || !claims.sub || claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}
