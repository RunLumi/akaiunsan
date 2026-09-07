# ==============================================================================
# Admin Service Dockerfile (Vite + React + Tailwind SPA)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Vite React SPA with pnpm
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm 9 via corepack (matching lockfileVersion 9.0)
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy dependency definitions
COPY package.json pnpm-lock.yaml ./

# Install dependencies strictly from lockfile
RUN pnpm install --frozen-lockfile

# Copy source code and build config
COPY . .

# Build application with TypeScript compilation and Vite bundling
RUN pnpm run build

# ------------------------------------------------------------------------------
# Stage 2: Serve static bundle via lightweight Caddy Alpine (<15MB RAM)
# ------------------------------------------------------------------------------
FROM caddy:2-alpine AS runner

WORKDIR /usr/share/caddy

# Copy built static assets from builder stage
COPY --from=builder /app/dist /usr/share/caddy

# Configure Caddy for SPA history fallback routing
RUN printf ':80 {\n  root * /usr/share/caddy\n  try_files {path} /index.html\n  file_server\n}\n' > /etc/caddy/Caddyfile

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
