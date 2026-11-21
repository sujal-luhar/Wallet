# Contributing

Thanks for taking a look! Bug reports, fixes and ideas are all welcome.

## Getting started

```bash
node scripts/setup.mjs   # env files, install, Docker, migrations, seed
pnpm dev
```

See the [README](./README.md) for ports, demo logins and troubleshooting.

## Before opening a PR

```bash
pnpm lint
pnpm check-types
pnpm format
```

- Keep PRs focused: one change per PR.
- Database changes need a Prisma migration (`pnpm --filter @wallet/db db:migrate`). Commit the generated SQL.
- Never commit `.env` files or real credentials. Only `.env.example` files belong in git.
- Money is stored as integer minor units (paise) in `BigInt` columns. Never use floats for amounts.

## Reporting security issues

Please open a private security advisory on GitHub instead of a public issue.
