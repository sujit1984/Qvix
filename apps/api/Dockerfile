FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN corepack enable && corepack prepare pnpm@9.4.0 --activate
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @qvix/api build

EXPOSE 4000

CMD ["sh", "-c", "pnpm --filter @qvix/api db:push && pnpm --filter @qvix/api start"]
