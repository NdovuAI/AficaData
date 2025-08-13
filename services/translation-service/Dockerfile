# Translation microservice
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY services/translation-service/package*.json ./
RUN npm ci --only=production

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 translationuser

COPY --from=deps /app/node_modules ./node_modules
COPY services/translation-service ./

USER translationuser

EXPOSE 3002

CMD ["node", "index.js"]
