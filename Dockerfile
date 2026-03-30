FROM node:20-alpine AS base

# Install dependencies, generate Prisma Client and build
FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
COPY . .
# Next.js telemetry disable
ENV NEXT_TELEMETRY_DISABLED 1

# Generate prisma client specifically
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image, copy all the files
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install only production dependencies
COPY package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN npm install --omit=dev

# Copy Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.ts ./next.config.ts

# Generate prisma client for production
RUN npx prisma generate

# Install tsx globally (required for running the collaboration server based on package.json script)
RUN npm install -g tsx

EXPOSE 3000
EXPOSE 1234
