import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith("/signin") || pathname.startsWith("/signup");

  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/funds") ||
    pathname.startsWith("/p2ptransfer") ||
    pathname.startsWith("/payment-success") ||
    pathname.startsWith("/onboarding");

  // Logged-in users shouldn't see signin/signup
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Unauthenticated users cannot access protected routes or onboarding
  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/funds/:path*",
    "/p2ptransfer/:path*",
    "/payment-success/:path*",
    "/onboarding",
    "/signin",
    "/signup",
  ],
};

// `/verify-email` intentionally left open
// It should remain publicly accessible (do not block logged-in or 
// logged-out users from /verify-email since a user might click the 
// email link while logged in or out)