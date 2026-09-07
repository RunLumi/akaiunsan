# Production Deployment Guide (Master Docker Compose + Caddy)

This directory contains the production deployment setup for the Akaiunsan platform on a single Virtual Private Server (VPS).

## 1. Architecture Overview

- **Caddy (`ayasan_caddy`)**: Front-facing reverse proxy and ingress. Automatically obtains and renews TLS certificates via Let's Encrypt / ZeroSSL with HTTP/3 (QUIC) enabled. Listens on ports 80 and 443.
- **Backend API (`ayasan_backend`)**: Node 22 LTS / Express 5 TypeScript API running internally on port 5000.
- **Frontend Portal (`ayasan_frontend`)**: Customer web portal.
- **Admin Dashboard (`ayasan_admin`)**: Back-office SPA interface.
- **MariaDB Database (`ayasan_mariadb`)**: Isolated on internal `db_net` network with persistent volume storage and automated healthchecks.

---

## 2. VPS Prerequisites & Initial Setup

### A. Swap Configuration (Essential for 2026 stability)
Prevent Linux kernel Out-Of-Memory (OOM) kills on a 2GB–4GB VPS by creating a 4GB swapfile:
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### B. Install Docker & Compose Plugin
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```
Log out and log back in to apply docker group permissions. Verify with `docker compose version`.

---

## 3. DNS Configuration

Point your domains/subdomains to your VPS public IP via DNS A/AAAA records:
- `api.yourdomain.com` &rarr; `<VPS_IP>`
- `admin.yourdomain.com` &rarr; `<VPS_IP>`
- `yourdomain.com` &rarr; `<VPS_IP>`
- `www.yourdomain.com` &rarr; `<VPS_IP>`

---

## 4. Initial Deployment on the VPS

1. **Clone the repository to `/opt/akaiunsan`:**
   ```bash
   sudo git clone https://github.com/streamentry/akaiunsan.git /opt/akaiunsan
   cd /opt/akaiunsan/deploy
   ```

2. **Configure production environment:**
   ```bash
   cp .env.example .env
   chmod 600 .env
   nano .env
   ```
   *Fill in your real domains, database passwords, and secrets.*

3. **Start the stack:**
   - **Registry Mode (Recommended - pulls prebuilt images from CI):**
     ```bash
     docker compose pull
     docker compose up -d
     ```
   - **Local Build Mode (Builds images on VPS directly):**
     ```bash
     docker compose up -d --build
     ```

4. **Verify running services:**
   ```bash
   docker compose ps
   docker compose logs -f caddy
   ```

---

## 5. Routine Operations

### Checking Service Health & Logs
```bash
# Check status
docker compose ps

# View live backend logs
docker compose logs -f backend

# View live Caddy proxy / SSL logs
docker compose logs -f caddy
```

### Applying Updates (Rolling Restart)
```bash
# Pull newest images
docker compose pull

# Recreate changed containers with minimal downtime
docker compose up -d --remove-orphans

# Clean up dangling images
docker image prune -f
```

### Database Backups
A pre-configured backup script is in `scripts/backup-db.sh`.
Schedule it via cron to run nightly at 2:00 AM:
```bash
crontab -e
# Add line:
0 2 * * * /opt/akaiunsan/deploy/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```
