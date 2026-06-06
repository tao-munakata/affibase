FROM node:22-alpine AS base
RUN npm install -g pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml* ./

FROM base AS development
RUN pnpm install
COPY . .
EXPOSE 4321
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
