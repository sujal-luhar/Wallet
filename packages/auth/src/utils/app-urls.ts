const TRUSTED_APP_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
]);

export function getAllowedAppUrl(
  url: string | undefined,
  fallback: string,
): string {
  const parsed = new URL(url ?? fallback);

  if (!TRUSTED_APP_ORIGINS.has(parsed.origin)) {
    throw new Error("Untrusted application origin");
  }

  if (
    process.env.NODE_ENV === "production" &&
    parsed.protocol !== "https:"
  ) {
    throw new Error("HTTPS is required in production");
  }

  return parsed.origin;
}