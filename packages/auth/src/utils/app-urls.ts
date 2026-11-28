function getTrustedOrigins(): Set<string> {
  const origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
  ];

  const envOrigins = [
    process.env.WEB_APP_URL,
    process.env.MOCK_BANK_URL,
    process.env.USER_APP_URL,
    process.env.MERCHANT_APP_URL,
  ];

  for (const url of envOrigins) {
    if (url) {
      try {
        origins.push(new URL(url).origin);
      } catch {
        // ignore malformed URLs in env
      }
    }
  }

  return new Set(origins);
}

export function getAllowedAppUrl(
  url: string | undefined,
  fallback: string,
): string {
  const parsed = new URL(url ?? fallback);
  const trustedOrigins = getTrustedOrigins();

  if (!trustedOrigins.has(parsed.origin)) {
    throw new Error("Untrusted application origin");
  }

  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    throw new Error("HTTPS is required in production");
  }

  return parsed.origin;
}
