import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = await getToken({ req: req as never, secret: process.env.NEXTAUTH_SECRET }).catch(() => null);

  const publicPaths = ["/", "/login", "/register", "/education", "/api/auth", "/api/register", "/manifest.webmanifest", "/placeholder-waste.jpg"];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith("/api/auth"))) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname.startsWith("/uploads") || pathname.includes(".")) return NextResponse.next();

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  const role = (token as Record<string, unknown>).role as string | undefined;
  if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/collector") && role !== "COLLECTOR" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/report/:path*", "/reports/:path*", "/my-reports/:path*", "/collector/:path*", "/admin/:path*", "/points/:path*", "/scan/:path*", "/notifications/:path*"] };
