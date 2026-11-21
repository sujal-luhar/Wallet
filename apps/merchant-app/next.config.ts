import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Extra hosts allowed to load the dev server (e.g. testing from a phone on your LAN).
  // Set ALLOWED_DEV_ORIGINS="192.168.1.5,192.168.1.6" in .env if you need it.
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export default nextConfig;
