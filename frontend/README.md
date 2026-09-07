# Frontend Service (Customer Web Portal)

This directory is designated for the customer-facing web application.

## Recommended Setups

### Option A: Vite + React SPA (Recommended for simplicity & low RAM)
If using Vite (`npm create vite@latest . -- --template react-ts`):
Update `Dockerfile` to a two-stage build:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=builder /app/dist /usr/share/caddy
RUN printf ':80 {\n  root * /usr/share/caddy\n  try_files {path} /index.html\n  file_server\n}\n' > /etc/caddy/Caddyfile
EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
```

### Option B: Next.js (SSR / Standalone output)
If using Next.js with `output: "standalone"` in `next.config.js`:
Update `Dockerfile` to:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
USER node
CMD ["node", "server.js"]
```
And change the port in `deploy/docker-compose.yml` to `3000`.
