# ==============================================================================
# Frontend Service Dockerfile
# ==============================================================================
# In production, this can serve either:
# 1. A Vite / React Single Page Application (SPA) via lightweight Caddy/Nginx Alpine
# 2. A Next.js standalone SSR application (see recipe in README.md)
#
# Below is the standard lightweight SPA static serving setup.
# ------------------------------------------------------------------------------

FROM caddy:2-alpine

WORKDIR /usr/share/caddy

# Copy static assets (or built dist from builder stage)
COPY index.html /usr/share/caddy/index.html

# Configure Caddy for SPA history routing (fallback to index.html for unknown routes)
RUN printf ':80 {\n  root * /usr/share/caddy\n  try_files {path} /index.html\n  file_server\n}\n' > /etc/caddy/Caddyfile

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
