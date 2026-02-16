# ---------- Stage 1: Install dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# ---------- Stage 2: Build the Nuxt application ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate && npm run build

# ---------- Stage 3: Production image ----------
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nuxt && \
    adduser --system --uid 1001 nuxt

# Nuxt production output
COPY --from=builder /app/.output ./.output

# Prisma client (generated native binary) and schema for migrations
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Prisma CLI for running migrations in production
# Install BEFORE copying package.json to avoid resolving all app dependencies
RUN npm install --no-save prisma

# package.json needed for seed config
COPY --from=builder /app/package.json ./package.json

# Upload directory for local storage mode
RUN mkdir -p /app/data/uploads && chown -R nuxt:nuxt /app/data

USER nuxt

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
