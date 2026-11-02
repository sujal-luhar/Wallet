# Wallet Monorepo

A full-stack digital wallet monorepo architecture built with **Next.js App Router**, **Express**, **Prisma ORM**, and **pnpm Workspaces** managed via **Turborepo**.

---

## 🏗️ Repository Structure

```text
wallet/
├── apps/
│   ├── user-app/          # Customer application (P2P transfers, deposits, withdrawals)
│   ├── merchant-app/      # Merchant dashboard (analytics, settlements, refunds)
│   ├── mock-bank/         # Express engine simulating core banking network webhooks
│   └── web/               # Landing page & public marketing site
└── packages/
    ├── db/                # Prisma schema, migrations, seeders, and database client
    ├── auth/              # Shared NextAuth authentication options
    ├── common/            # Shared utilities, validation schemas, and global types
    ├── ui/                # Component library built with Base UI & Tailwind CSS
    ├── eslint-config/     # Centralized ESLint rule presets
    └── typescript-config/ # Shared tsconfig baseline configurations
```

---

## 🛠️ Tech Stack & Tooling

- **Package Manager:** `pnpm@11.15.1` (using workspace `catalog:` for unified dependencies)
- **Monorepo Engine:** Turborepo
- **Frontend Framework:** Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend Services:** Express.js (Mock Bank Engine), Next.js Server Actions
- **Database & ORM:** PostgreSQL, Prisma 7 with `@prisma/extension-accelerate`
- **Authentication:** NextAuth.js
- **Language & Quality:** TypeScript 5.9, ESLint 9, Prettier

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js and `pnpm` installed:
- Node.js: `^20.19.0`, `^22.12.0`, or `>=24.0.0`
- pnpm: `11.15.1`

### 2. Installation
Install all workspace dependencies:
```bash
pnpm install
```

---

## 💻 Development & Verification Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start all applications concurrently in development mode |
| `pnpm build` | Build all packages and applications in dependency order |
| `pnpm check-types` | Run type checking across the entire monorepo in parallel |
| `pnpm lint` | Execute ESLint rule checks across all apps and packages |
| `pnpm format` | Run Prettier auto-formatting on all TypeScript and Markdown files |