import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const userAppUrl =
      process.env.NEXT_PUBLIC_USER_APP_URL || "http://localhost:3002";
    const url = new URL("/signin", userAppUrl);
    // Absolute URL, because signin lives on a different origin (user-app)
    url.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/settlements/:path*",
    "/onboarding/:path*",
  ],
};
