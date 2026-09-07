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
| **Reverse Proxy** | `akaiunsan_caddy` | Caddy 2 Alpine | 80, 443 | Port 80 & 443 | ~28 MiB |
| **Admin App** | `akaiunsan_admin` | Vite 8 + React 19 SPA | 80 | `akai-admin.cjs.vn` | ~12 MiB |
| **Backend API** | `akaiunsan_backend` | Node 22 / Express 5 | 5000 | `akai-api.cjs.vn` | ~105 MiB |
| **Database** | `akaiunsan_mariadb` | MariaDB 10.9.6 | 3306 | Internal network only (`db_net`) | ~70 MiB |
| **Customer Web** | `akaiunsan_frontend` | Caddy Alpine static | 80 | Internal stub | ~10 MiB |

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
The production deployment source branch is `prod`. Prefer the automated webhook, cron, or GitHub Actions path described below. For a controlled manual recovery:
```bash
ssh ubuntu@15.235.202.219
cd /opt/akaiunsan

# Force a pull, rebuild, and restart from origin/prod
./deploy/scripts/auto-deploy.sh --force
```

Before retrying a blocked pull, inspect `git status` and the exact diff. The current deploy script generates the tracked `backend/version.json` as build input; restore that file only when the diff is confirmed to be generated metadata. Preserve any other VPS-local work rather than resetting or discarding it.

After deployment, wait for the container health check and verify the public contract:
```bash
curl -sS -w '\nHTTP_STATUS:%{http_code}\n' https://akai-api.cjs.vn/health
sudo docker inspect --format '{{.State.Health.Status}}' akaiunsan_backend
```

The response must report HTTP 200, `status: "ok"`, `db: "up"`, and the expected deployed commit under `git.commit`. The container health state must be `healthy`. See the [backend health-check postmortem](../docs/postmortems/2026-09-07-backend-healthcheck-prod-deployment.md) for the failure mode and evidence standard.

### C. Automated Nightly Database Backups
A pre-configured backup script is in `scripts/backup-db.sh`. It creates compressed gzip dumps in `deploy/backups/` and automatically prunes dumps older than 7 days.

Crontab entry on VPS:
```bash
crontab -e
# Runs daily at 02:00 AM:
0 2 * * * /opt/akaiunsan/deploy/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

---

## 5. Automated Deployment (`prod` Branch)

The VPS is configured for automated deployment on changes to the `prod` branch using a dual mechanism:

### Option 1: GitHub Webhook (Instant)
Configure a webhook in GitHub repository settings to trigger deployments immediately upon push:
1. Go to **Settings &rarr; Webhooks &rarr; Add webhook** in the GitHub repository.
2. **Payload URL**: `https://akai-api.cjs.vn/webhook/deploy`
3. **Content type**: `application/json`
4. **Secret**: `akaiunsan_prod_deploy_secret_2026`
5. **Events**: Just the `push` event.
6. The webhook service on the VPS (`akaiunsan-webhook.service`) validates the HMAC-SHA256 signature and automatically runs `auto-deploy.sh` when pushes target `refs/heads/prod`.

*Manual trigger via curl:*
```bash
curl -X POST "https://akai-api.cjs.vn/webhook/deploy?token=akaiunsan_prod_deploy_secret_2026"
```

### Option 2: Automated Cron Sync (Every 2 Minutes)
The VPS runs a background cron check every 2 minutes:
```cron
*/2 * * * * /opt/akaiunsan/deploy/scripts/auto-deploy.sh >> /var/log/akaiunsan-deploy.log 2>&1
```
If new commits are detected on `origin/prod`, it automatically pulls and rebuilds containers.

### Option 3: GitHub Actions CI/CD
`.github/workflows/deploy.yml` triggers on pushes to `prod` to run the backend validation step, build and push Docker images, and invoke the VPS deploy script over SSH. The workflow's `typecheck` step is currently non-blocking while the TypeScript migration is incomplete; a successful workflow is not a substitute for the public health and container checks above.

---

## 6. Security & Isolation Notes

1. **Database Access**: Port 3306 is not published to the host. MariaDB is only reachable by `akaiunsan_backend` over the internal bridge network `db_net`.
2. **TLS / SSL Certificates**: Caddy handles ACME TLS challenges automatically via Let's Encrypt with HTTP-01 and TLS-ALPN-01 protocols. Certificates renew automatically 30 days before expiration.
3. **Environment Security**: `/opt/akaiunsan/deploy/.env` contains production database credentials, JWT secrets, and API keys. It is protected with file permissions `600` and is strictly excluded from Git.
