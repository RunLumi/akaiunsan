# Production Deployment Guide (Master Docker Compose + Caddy)

This directory contains the production orchestration infrastructure for the Akaiunsan platform on a single Virtual Private Server (VPS).

> **Navigation**:
> - [Root Overview (README.md)](../README.md)
> - [AI Agent Guidelines (AGENTS.md)](../AGENTS.md)
> - [Comprehensive Deployment Architecture (docs/deployment.md)](../docs/deployment.md)

---

## 1. Live Deployment Details

- **VPS Server**: `15.235.202.219` (`ssh ubuntu@15.235.202.219`)
- **Admin App**: [https://akai-admin.cjs.vn](https://akai-admin.cjs.vn)
- **Backend API**: [https://akai-api.cjs.vn](https://akai-api.cjs.vn)
- **API Health Check**: [https://akai-api.cjs.vn/health](https://akai-api.cjs.vn/health)

### Running Container Topology

| Service | Container Name | Technology | Internal Port | Ingress Host | Memory Footprint |
|---|---|---|---|---|---|
| **Reverse Proxy** | `ayasan_caddy` | Caddy 2 Alpine | 80, 443 | Port 80 & 443 | ~28 MiB |
| **Admin App** | `ayasan_admin` | Vite 8 + React 19 SPA | 80 | `akai-admin.cjs.vn` | ~12 MiB |
| **Backend API** | `ayasan_backend` | Node 22 / Express 5 | 5000 | `akai-api.cjs.vn` | ~105 MiB |
| **Database** | `ayasan_mariadb` | MariaDB 10.9.6 | 3306 | Internal network only (`db_net`) | ~70 MiB |
| **Customer Web** | `ayasan_frontend` | Caddy Alpine static | 80 | Internal stub | ~10 MiB |

**Total stack footprint**: **~225 MiB RAM** total (leaving >1.2 GiB free RAM on a 2GB VPS).

---

## 2. Server Configuration

### A. Swap Configuration
The host at `15.235.202.219` has a 2GB swap file enabled to prevent Linux kernel Out-Of-Memory (OOM) kills:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### B. Docker Engine & Compose
Docker Engine v29+ and Docker Compose v2 are installed and enabled via systemd.

### C. Git Deploy Key Authentication
The VPS uses an ed25519 deploy key (`~/.ssh/id_ed25519`) authorized on GitHub (`git@github.com:streamentry/akaiunsan.git`).

---

## 3. Directory Layout on VPS

```
/opt/akaiunsan/
├── backend/                 # Express 5 API source code & Dockerfile
├── admin/                   # shadcn-admin source code & Dockerfile
├── frontend/                # Customer portal source code & Dockerfile
├── deploy/                  # Orchestration root
│   ├── docker-compose.yml   # Master compose configuration
│   ├── Caddyfile            # Ingress rules, auto-TLS, and HTTP/3
│   ├── .env                 # Production environment variables (chmod 600)
│   ├── .env.example         # Template for environment variables
│   ├── README.md            # This operations runbook
│   └── scripts/
│       └── backup-db.sh     # Automated daily database backup script
```

---

## 4. Operational Runbook

### A. Inspecting Live Health & Logs
```bash
ssh ubuntu@15.235.202.219
cd /opt/akaiunsan/deploy

# Check running containers and healthchecks
sudo docker compose ps

# Inspect live resource usage
sudo docker stats --no-stream

# View backend application logs
sudo docker compose logs -f backend

# View Caddy reverse proxy and certificate logs
sudo docker compose logs -f caddy
```

### B. Deploying Updates (Rolling Rebuild)
To pull code changes and redeploy:
```bash
ssh ubuntu@15.235.202.219
cd /opt/akaiunsan

# Pull latest commits from main
git pull origin main

# Rebuild and restart containers with zero downtime
cd deploy
sudo docker compose --env-file .env up -d --build

# Clean up dangling images
sudo docker image prune -f
```

### C. Automated Nightly Database Backups
A pre-configured backup script is in `scripts/backup-db.sh`. It creates compressed gzip dumps in `deploy/backups/` and automatically prunes dumps older than 7 days.

Crontab entry on VPS:
```bash
crontab -e
# Runs daily at 02:00 AM:
0 2 * * * /opt/akaiunsan/deploy/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

---

## 5. Security & Isolation Notes

1. **Database Access**: Port 3306 is not published to the host. MariaDB is only reachable by `ayasan_backend` over the internal bridge network `db_net`.
2. **TLS / SSL Certificates**: Caddy handles ACME TLS challenges automatically via Let's Encrypt with HTTP-01 and TLS-ALPN-01 protocols. Certificates renew automatically 30 days before expiration.
3. **Environment Security**: `/opt/akaiunsan/deploy/.env` contains production database credentials, JWT secrets, and API keys. It is protected with file permissions `600` and is strictly excluded from Git.
