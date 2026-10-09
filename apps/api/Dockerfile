FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @relaax/api build
FROM node:22-alpine
WORKDIR /repo
COPY --from=build /repo .
ENV NODE_ENV=production
CMD ["node", "apps/api/dist/server.js"]
