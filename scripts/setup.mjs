#!/usr/bin/env node
// One-command local setup for the wallet monorepo.
//
//   node scripts/setup.mjs            full setup (safe to re-run)
//   node scripts/setup.mjs --seed     force re-seeding (WIPES all data in the local DB)
//   node scripts/setup.mjs --no-seed  never seed
//
// Uses only Node built-ins so it can run before `pnpm install`.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IS_WIN = process.platform === "win32";
const flags = new Set(process.argv.slice(2));

const step = (msg) => console.log(`\n\x1b[36m▶ ${msg}\x1b[0m`);
const ok = (msg) => console.log(`  \x1b[32m✔\x1b[0m ${msg}`);
const info = (msg) => console.log(`  \x1b[2m${msg}\x1b[0m`);
const fail = (msg, hint) => {
  console.error(`\n\x1b[31m✖ ${msg}\x1b[0m`);
  if (hint) console.error(`  ${hint}`);
  process.exit(1);
};

function run(cmd, args, { capture = false } = {}) {
  return spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
    // pnpm is a .cmd shim on Windows and needs a shell; docker is a real .exe
    shell: IS_WIN && cmd === "pnpm",
  });
}

function mustRun(cmd, args, label, hint) {
  const r = run(cmd, args);
  if (r.status !== 0) fail(`${label} failed.`, hint);
}

// ── 1. Prerequisites ────────────────────────────────────────────────────────
step("Checking prerequisites");

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 26) {
  fail(
    `Node ${process.versions.node} detected, but this project needs Node 26.5+.`,
    "Install it from https://nodejs.org (or use nvm / fnm / volta), then re-run.",
  );
}
ok(`Node ${process.versions.node}`);

const pnpmCheck = run("pnpm", ["--version"], { capture: true });
if (pnpmCheck.error || pnpmCheck.status !== 0) {
  fail(
    "pnpm was not found.",
    "Run `corepack enable` (ships with Node) or see https://pnpm.io/installation, then re-run.",
  );
}
ok(`pnpm ${pnpmCheck.stdout.trim()}`);

const composeCheck = run("docker", ["compose", "version"], { capture: true });
if (composeCheck.error || composeCheck.status !== 0) {
  fail(
    "Docker with the Compose plugin was not found.",
    "Install Docker Desktop (or Docker Engine + compose plugin) and re-run.",
  );
}
const daemonCheck = run("docker", ["info"], { capture: true });
if (daemonCheck.status !== 0) {
  fail("The Docker daemon is not running.", "Start Docker Desktop / the docker service and re-run.");
}
ok("Docker + Compose");

// ── 2. .env files ───────────────────────────────────────────────────────────
step("Creating .env files from .env.example");

const ENV_DIRS = ["apps/user-app", "apps/merchant-app", "apps/mock-bank", "packages/db"];
const PLACEHOLDER = "replace-me";

const readVar = (file, key) => {
  if (!existsSync(file)) return null;
  const m = readFileSync(file, "utf8").match(new RegExp(`^${key}=["']?([^"'\\r\\n]*)["']?\\s*$`, "m"));
  return m ? m[1] : null;
};

// user-app and merchant-app MUST share NEXTAUTH_SECRET: merchant-app reads the
// session JWT that user-app issues.
const authEnvFiles = ["apps/user-app", "apps/merchant-app"].map((d) => join(ROOT, d, ".env"));
const existingSecret = authEnvFiles
  .map((f) => readVar(f, "NEXTAUTH_SECRET"))
  .find((v) => v && v !== PLACEHOLDER);
const authSecret = existingSecret ?? randomBytes(32).toString("hex");

for (const dir of ENV_DIRS) {
  const example = join(ROOT, dir, ".env.example");
  const target = join(ROOT, dir, ".env");
  if (!existsSync(example)) fail(`Missing ${dir}/.env.example`);
  if (existsSync(target)) {
    info(`${dir}/.env already exists, leaving it untouched`);
    continue;
  }
  copyFileSync(example, target);
  if (dir.startsWith("apps/user-app") || dir.startsWith("apps/merchant-app")) {
    const text = readFileSync(target, "utf8").replace(
      /^NEXTAUTH_SECRET=.*$/m,
      `NEXTAUTH_SECRET="${authSecret}"`,
    );
    writeFileSync(target, text);
  }
  ok(`created ${dir}/.env`);
}

// ── 3. Dependencies ─────────────────────────────────────────────────────────
step("Installing dependencies (pnpm install)");
mustRun("pnpm", ["install"], "pnpm install");

// ── 4. Docker services ──────────────────────────────────────────────────────
step("Starting Postgres + Mailpit (docker compose up)");
mustRun(
  "docker",
  ["compose", "up", "-d", "--wait"],
  "docker compose up",
  "Is port 5433, 1025 or 8025 already in use? Check with `docker compose ps` and `docker compose logs`.",
);
ok("Postgres and Mailpit are healthy");

// ── 5. Database ─────────────────────────────────────────────────────────────
step("Preparing the database");
mustRun("pnpm", ["--filter", "@wallet/db", "generate"], "prisma generate");

// Decide whether this is a brand-new database BEFORE migrating.
const probe = run(
  "docker",
  [
    "compose", "exec", "-T", "postgres",
    "psql", "-U", "wallet", "-d", "wallet", "-tAc",
    "SELECT to_regclass('public._prisma_migrations') IS NOT NULL",
  ],
  { capture: true },
);
const freshDatabase = probe.status === 0 && probe.stdout.trim() === "f";

mustRun("pnpm", ["--filter", "@wallet/db", "db:deploy"], "prisma migrate deploy");

const shouldSeed = !flags.has("--no-seed") && (flags.has("--seed") || freshDatabase);
if (shouldSeed) {
  step("Seeding demo data");
  mustRun("pnpm", ["--filter", "@wallet/db", "db:seed"], "database seed");
} else {
  info("Existing database detected, skipping seed. Use `node scripts/setup.mjs --seed` to reset demo data.");
}

// ── Done ────────────────────────────────────────────────────────────────────
console.log(`
\x1b[32m✔ All set!\x1b[0m Start everything with:

    pnpm dev

  user-app       http://localhost:3002
  merchant-app   http://localhost:3003
  mock-bank      http://localhost:3001
  Mailpit inbox  http://localhost:8025

Demo login (password for all: Admin1)
  admin@email.com        wallet + merchant profile + transactions
  admin-new@gmail.com    ready for merchant onboarding
  customer@example.com   counterparty user
`);
