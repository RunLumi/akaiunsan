# ==============================================================================
# Backend Multi-Stage Dockerfile (Node 22 LTS / TypeScript)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build TypeScript into JavaScript (dist)
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies if needed
COPY package*.json ./
COPY patches/ ./patches/

# Install all dependencies (including devDependencies for tsc)
RUN npm ci

# Copy application source code
COPY . .

# Build TypeScript to dist and fix require paths + asset copying
RUN npm run build

# Prune devDependencies, leaving only production dependencies (which are already patched)
RUN npm prune --omit=dev

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runner
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000

# Install curl for container healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/mail-template ./mail-template
COPY --from=builder /app/config ./config
# migrations are applied at boot (app.ts runs migrate-up — sync() is gone)
COPY migrations ./migrations

# Copy container entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create persistent storage directories for uploads and generated exports, ensuring node user ownership
RUN mkdir -p uploads exports config && chown -R node:node /app

USER node

EXPOSE 5000

HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/app.js"]
