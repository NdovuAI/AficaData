# Authentication microservice
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY services/auth-service/package*.json ./
RUN npm ci --only=production

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 authuser

COPY --from=deps /app/node_modules ./node_modules
COPY services/auth-service ./

USER authuser

EXPOSE 3001

CMD ["node", "index.js"]
