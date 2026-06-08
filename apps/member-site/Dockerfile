FROM node:22-alpine AS base
RUN npm install -g pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml* ./

FROM base AS development
RUN printf 'allowBuilds:\n  esbuild: true\n  sharp: true\n  unrs-resolver: true\n' > pnpm-workspace.yaml
RUN pnpm install
COPY . .
EXPOSE 4321
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

FROM base AS builder
RUN printf 'allowBuilds:\n  esbuild: true\n  sharp: true\n  unrs-resolver: true\n' > pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .
EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321
CMD ["node", "dist/server/entry.mjs"]
