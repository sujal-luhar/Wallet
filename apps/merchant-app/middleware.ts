import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/settlements");

  // Unauthenticated users cannot access dashboard or merchant onboarding
  if ((isProtectedPage || isOnboardingPage) && !token) {
    const userAppUrl = process.env.NEXT_PUBLIC_USER_APP_URL || "http://localhost:3002";
    return NextResponse.redirect(new URL("/signin", userAppUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/settlements/:path*",
    "/onboarding",
  ],
};