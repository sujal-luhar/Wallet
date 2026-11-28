FROM --platform=linux/amd64 node:26.13.1-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11.15.1

FROM base AS pruner
RUN npm install -g turbo@2
WORKDIR /app
COPY . .
RUN turbo prune merchant-app --docker

FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/ .
COPY --from=pruner /app/out/full/ .

ARG NEXT_PUBLIC_MOCK_BANK_URL
ARG NEXT_PUBLIC_USER_APP_URL
ARG NEXT_PUBLIC_MERCHANT_APP_URL
ENV NEXT_PUBLIC_MOCK_BANK_URL=$NEXT_PUBLIC_MOCK_BANK_URL
ENV NEXT_PUBLIC_USER_APP_URL=$NEXT_PUBLIC_USER_APP_URL
ENV NEXT_PUBLIC_MERCHANT_APP_URL=$NEXT_PUBLIC_MERCHANT_APP_URL

# Build-time dummy secrets so static analysis and module evaluation do not throw
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DIRECT_DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXTAUTH_SECRET="build-time-secret-placeholder-minimum-32-chars"

RUN pnpm --filter @wallet/db exec prisma generate
RUN pnpm --filter merchant-app run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/merchant-app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/merchant-app/.next/static ./apps/merchant-app/.next/static

USER nextjs
EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3003/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "apps/merchant-app/server.js"]
