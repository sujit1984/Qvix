FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN corepack enable && corepack prepare pnpm@9.4.0 --activate
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @qvix/web build

EXPOSE 3000

CMD ["pnpm", "--filter", "@qvix/web", "start"]
