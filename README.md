# Wallet

A digital wallet platform built as a Turborepo + pnpm monorepo: send and receive money (P2P), pay merchants, deposit and withdraw through a mock bank, and manage a merchant account with settlements and refunds.

| App | Port | What it is |
| --- | --- | --- |
| `apps/user-app` | 3002 | Customer wallet (Next.js): sign up, deposit, withdraw, P2P transfers, merchant payments |
| `apps/merchant-app` | 3003 | Merchant dashboard (Next.js): transactions, refunds, settlements to bank |
| `apps/mock-bank` | 3001 | Fake bank (Express + EJS) used for deposits and withdrawals |
| Postgres | 5433 | Docker, `postgres:19-alpine` |
| Mailpit | 8025 (web), 1025 (SMTP) | Docker, catches all outgoing email |

**Stack:** Next.js, React, TypeScript, Tailwind, shadcn/ui, NextAuth, Prisma, PostgreSQL, Express.

## Quick start

You need:

- [Node.js](https://nodejs.org) 26.5+
- [pnpm](https://pnpm.io/installation) (`corepack enable` is enough)
- [Docker](https://docs.docker.com/get-docker/) running

```bash
git clone <your-fork-or-this-repo-url> wallet
cd wallet
node scripts/setup.mjs
pnpm dev
```

`node scripts/setup.mjs` is safe to re-run. It will:

1. check Node, pnpm and Docker
2. copy every `.env.example` to `.env` (never overwrites an existing one) and generate a random `NEXTAUTH_SECRET` shared by both apps
3. run `pnpm install`
4. start Postgres and Mailpit with `docker compose up -d --wait`
5. run `prisma generate` and `prisma migrate deploy`
6. seed demo data (only on a brand-new database)

Then open <http://localhost:3002>.

> Don't use `pnpm setup`. That is a built-in pnpm command that configures your shell, not this project. Use `node scripts/setup.mjs` or `pnpm bootstrap`.

## Demo accounts

Password for all: **`Admin1`**

| Email | What it has |
| --- | --- |
| `admin@email.com` | Wallet, merchant profile and a full transaction history |
| `admin-new@gmail.com` | Wallet only, ready for merchant onboarding |
| `customer@example.com` | Counterparty user for payments and P2P transfers |

## Email in development (Mailpit)

Verification emails never leave your machine. Sign up with any address in user-app, then open <http://localhost:8025> to read the email and click the link. Seeded users are already verified.

## Google sign-in (optional)

Email + password login works without Google. To enable the "Sign in with Google" button you need your own OAuth client:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project (or pick an existing one).
2. Open **APIs & Services → OAuth consent screen** (shown as *Google Auth Platform* in newer consoles) and configure it:
   - User type: **External**
   - Fill in the app name and your email
   - While the app is in **Testing**, add your own Google account under **Test users**
3. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins:** `http://localhost:3002`
   - **Authorized redirect URIs:** `http://localhost:3002/api/auth/callback/google`
4. Copy the **Client ID** and **Client secret** into `apps/user-app/.env`:
   ```dotenv
   GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="..."
   ```
5. Restart `pnpm dev`.

Google Cloud's menus change now and then; if a label differs, look for "OAuth consent screen" and "OAuth client". Never commit your `.env` file.

## Useful commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run all apps with Turbo |
| `pnpm services:up` / `pnpm services:down` | Start / stop Postgres and Mailpit |
| `pnpm db:seed` | Reset the database contents to the demo data (**deletes all existing rows**) |
| `pnpm db:studio` | Browse the database with Prisma Studio |
| `pnpm db:reset` | Destroy the Docker volume and set everything up again |
| `pnpm lint` / `pnpm check-types` / `pnpm build` | Quality checks |

## How the pieces fit together

- **Auth:** user-app issues the NextAuth session. merchant-app reads the same JWT cookie (cookies on `localhost` are shared across ports), which is why both apps need the **same `NEXTAUTH_SECRET`**. Unauthenticated merchant-app visitors are redirected to user-app's sign-in page.
- **Database:** `packages/db` holds the Prisma schema, migrations, seed and the shared client. Plain `postgres://` URLs use the `pg` driver adapter; `prisma://` URLs use Prisma Accelerate (handy in production).
- **Money:** amounts are `BigInt` minor units (paise). Wallet balance and ownership rules are also enforced by SQL `CHECK` constraints in the migrations.

```
apps/        user-app, merchant-app, mock-bank, web
packages/    auth, common, db, ui, eslint-config, typescript-config
scripts/     setup.mjs
```

## Troubleshooting

- **Port already in use:** change the host port in `docker-compose.yaml` (e.g. `5433`) and in every `DATABASE_URL` / `DIRECT_DATABASE_URL`, or stop whatever is using it.
- **Wrong Node version:** this repo requires Node 26.5+. Check with `node -v`.
- **Start from scratch:** `pnpm db:reset` (deletes the local database volume).
- **Docker not running:** start Docker Desktop, then re-run `node scripts/setup.mjs`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
