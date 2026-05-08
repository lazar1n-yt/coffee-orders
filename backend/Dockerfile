# --- Stage 1: build TypeScript ---
FROM node:26-alpine AS builder
WORKDIR /app

ENV NODE_ENV=development
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --prefer-offline

COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate \
 && npm run build

# --- Stage 2: production deps only ---
FROM node:26-alpine AS deps
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev --no-audit --prefer-offline \
 && npx prisma generate \
 && npm cache clean --force

# --- Stage 3: runtime ---
FROM node:26-alpine AS runtime
WORKDIR /app

# tini для коректної обробки SIGTERM (graceful shutdown), wget — для healthcheck
RUN apk add --no-cache tini wget && \
    addgroup -S app && adduser -S app -G app

ENV NODE_ENV=production \
    PORT=4000 \
    UPLOAD_DIR=/app/uploads

COPY --chown=app:app package*.json ./
COPY --from=deps     --chown=app:app /app/node_modules ./node_modules
COPY --from=deps     --chown=app:app /app/prisma       ./prisma
COPY --from=builder  --chown=app:app /app/dist         ./dist
COPY --from=builder  --chown=app:app /app/src/openapi.yaml ./src/openapi.yaml

RUN mkdir -p /app/uploads && chown -R app:app /app/uploads

USER app
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:4000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
