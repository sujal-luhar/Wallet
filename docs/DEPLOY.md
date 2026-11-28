# Production Deployment Guide: AWS EC2

This guide documents the end-to-end production deployment process for the Wallet monorepo on a single AWS EC2 instance running Docker Compose and Nginx, backed by Neon PostgreSQL (with Prisma Accelerate).

---

## 1. Architecture Overview

```
                      Internet (HTTPS: 443 / HTTP: 80)
                                    │
                                    ▼
                ┌───────────────────────────────────────┐
                │          Nginx Reverse Proxy          │
                │        (Host ports 80 and 443)        │
                └───────────────────┬───────────────────┘
                                    │ Internal Docker Network
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│     web      │            │   user-app   │            │ merchant-app │
│ (Port 3000)  │            │ (Port 3002)  │            │ (Port 3003)  │
└──────────────┘            └──────────────┘            └──────────────┘
                                    │                           │
                                    ▼                           ▼
                            ┌──────────────┐            ┌──────────────┐
                            │  mock-bank   │            │   migrate    │
                            │ (Port 3001)  │            │  (One-shot)  │
                            └───────┬──────┘            └───────┬──────┘
                                    │                           │
                                    ▼                           ▼
                            Neon DB via Accelerate        Neon DB Direct
                            (prisma://...)                (postgresql://...)
```

### Domain Routing Matrix

| Subdomain | Target Container | Port | Description |
| :--- | :--- | :--- | :--- |
| `wallet.sujalluhar.com` | `web` | `3000` | Marketing & Landing page |
| `wallet-user.sujalluhar.com` | `user-app` | `3002` | User Wallet portal & Auth entrypoint |
| `merchant.sujalluhar.com` | `merchant-app` | `3003` | Merchant Dashboard & Settlements |
| `bank.sujalluhar.com` | `mock-bank` | `3001` | Mock Bank UPI / Payout simulator |

- **Parent Cookie Domain**: `.sujalluhar.com` (enables shared authentication sessions between `user-app` and `merchant-app`).

---

## 2. Verified Container Image Sizes

All images are multi-stage builds compiled for `linux/amd64` using `node:26.13.1-slim`. Next.js applications run with `output: "standalone"` without developer dependencies:

| Image Name | Docker Content Size | `/app` Filesystem Size (`du -sh /app`) | Healthcheck Endpoint |
| :--- | :--- | :--- | :--- |
| `wallet-web` | ~116 MB | `37 MB` | `http://localhost:3000/api/health` |
| `wallet-user-app` | ~119 MB | `50 MB` | `http://localhost:3002/api/health` |
| `wallet-merchant-app` | ~119 MB | `49 MB` | `http://localhost:3003/api/health` |
| `wallet-mock-bank` | ~234 MB | `98 MB` | `http://localhost:3001/health` |

> [!NOTE]
> `wallet-mock-bank` includes the runtime TypeScript execution environment (`tsx`), the `@wallet/db` package source, the compiled Prisma 7 client engine, and `views/pay.ejs` to serve live payment simulation pages. It is also reused by the one-shot `migrate` service.

---

## 3. EC2 Bootstrap & Hardware Sizing

> [!WARNING]
> **EC2 Instance Sizing (t3.micro vs t3.small):**
> A `t3.micro` instance has only **~1 GB of RAM**. Running 4 Next.js standalone containers + Express mock-bank + Nginx simultaneously will consume 600–850 MB under idle load.
> 
> **Recommendation:**
> - Upgrade to **`t3.small`** (2 GB RAM) for optimal headroom, OR
> - If deploying on `t3.micro`, you **MUST** configure a **2 GB Swap file** immediately during bootstrap. Without swap, memory spikes during migrations or container startup will trigger the Linux kernel Out-Of-Memory (OOM) killer.

### Step 3.1: Security Group Rules

Configure the EC2 Security Group with only the following inbound ports:

| Type | Protocol | Port Range | Source | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| SSH | TCP | `22` | Your IP or `0.0.0.0/0` | Administrative / CI Deployment |
| HTTP | TCP | `80` | `0.0.0.0/0` | ACME challenge & HTTPS redirect |
| HTTPS | TCP | `443` | `0.0.0.0/0` | Secure web traffic |

> [!CAUTION]
> Never expose application ports `3000`, `3001`, `3002`, or `3003` to the host or internet. All traffic must terminate at Nginx.

### Step 3.2: Bootstrap Commands (Ubuntu 24.04 LTS)

SSH into your fresh EC2 instance and execute:

```bash
# 1. Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# 2. Configure 2 GB Swap File (Mandatory on t3.micro)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify swap activation
free -h

# 3. Install Docker Engine and Docker Compose Plugin
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Add 'ubuntu' user to docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker ubuntu

# 5. Create application and SSL directory structures
mkdir -p ~/wallet/nginx/conf.d
sudo mkdir -p /var/www/certbot
sudo mkdir -p /etc/letsencrypt
```

Log out and back in to apply the `docker` group membership:
```bash
exit
# Reconnect via SSH
```

---

## 4. DNS Configuration

Create DNS **A** records pointing each subdomain to your EC2 instance's **Elastic IP**:

| Hostname | Record Type | Target / Value |
| :--- | :--- | :--- |
| `wallet.sujalluhar.com` | `A` | `<EC2_ELASTIC_IP>` |
| `wallet-user.sujalluhar.com` | `A` | `<EC2_ELASTIC_IP>` |
| `merchant.sujalluhar.com` | `A` | `<EC2_ELASTIC_IP>` |
| `bank.sujalluhar.com` | `A` | `<EC2_ELASTIC_IP>` |

---

## 5. Google Cloud Console: OAuth Redirect URIs

In the [Google Cloud Console](https://console.cloud.google.com/) under **APIs & Services > Credentials > OAuth 2.0 Client IDs**:

### Authorized JavaScript origins:
- `https://wallet-user.sujalluhar.com`
- `https://merchant.sujalluhar.com`

### Authorized redirect URIs:
- `https://wallet-user.sujalluhar.com/api/auth/callback/google`
- `https://merchant.sujalluhar.com/api/auth/callback/google`

---

## 6. GitHub Repository Secrets Setup

In your GitHub repository, navigate to **Settings > Secrets and variables > Actions** and add the following repository secrets:

| Secret Name | Value Description |
| :--- | :--- |
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub Personal Access Token (Read/Write permissions) |
| `EC2_HOST` | Public Elastic IP address or DNS of your EC2 instance |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Entire private SSH key (`-----BEGIN OPENSSH PRIVATE KEY-----...`) |
| `PROD_ENV_FILE` | Complete contents of `.env` file (see `.env.production.example`) |

### How `PROD_ENV_FILE` Sync Works:
During CI deployment (`.github/workflows/deploy.yml`):
1. GitHub Actions reads `secrets.PROD_ENV_FILE`.
2. It transfers this file securely to `~/wallet/.env` on the EC2 instance.
3. It copies `docker-compose.prod.yaml` and `nginx/conf.d/` configs.
4. It triggers `docker compose -f docker-compose.prod.yaml pull && up -d`.

---

## 7. NEXT_PUBLIC_* Build-Time Inlining

> [!IMPORTANT]
> Next.js bundles variables prefixed with `NEXT_PUBLIC_*` into client-side JavaScript bundles **at Docker build time**, not at container boot time.
> 
> The following variables are baked into the images during CI:
> - `NEXT_PUBLIC_USER_APP_URL=https://wallet-user.sujalluhar.com`
> - `NEXT_PUBLIC_MERCHANT_APP_URL=https://merchant.sujalluhar.com`
> - `NEXT_PUBLIC_MOCK_BANK_URL=https://bank.sujalluhar.com`
> 
> These are configured as `build-args` in `.github/workflows/deploy.yml`. If your production subdomains ever change, images must be rebuilt and pushed via CI.

---

## 8. Database & Migrations: Accelerate vs Direct URL

Neon PostgreSQL with Prisma Accelerate requires two separate connection URLs:

1. **`DATABASE_URL` (`prisma://...`)**:
   Used by `user-app`, `merchant-app`, and `mock-bank` at runtime. Queries route through Prisma Accelerate's global edge cache and connection pool.

2. **`DIRECT_DATABASE_URL` (`postgresql://...`)**:
   Used **exclusively** by the `migrate` service. Prisma migrate commands (`prisma migrate deploy`) cannot execute through an Accelerate HTTP proxy — they require a direct TCP connection with PostgreSQL credentials.

### Production Migration Execution:
The `migrate` service in `docker-compose.prod.yaml` runs:
```bash
pnpm --filter @wallet/db exec prisma migrate deploy
```
- Configured with `restart: "no"`.
- All application services declare `depends_on: migrate` with `condition: service_completed_successfully`.
- **`prisma db seed` is never run in production.**

---

## 9. Initial TLS / SSL Certificate Provisioning

Because Nginx will fail to start if the SSL certificates referenced in its configuration do not exist yet, follow this one-time initial provisioning procedure:

### Step 9.1: Deploy Bootstrap HTTP Nginx Config
On the EC2 instance, copy the temporary HTTP-only configuration:

```bash
cd ~/wallet
cp nginx/conf.d/bootstrap-http.conf.example nginx/conf.d/bootstrap.conf
# Temporarily rename SSL configs
for f in nginx/conf.d/*.conf; do [ "$f" != "nginx/conf.d/bootstrap.conf" ] && mv "$f" "$f.bak"; done
```

Start the Nginx container:
```bash
docker compose -f docker-compose.prod.yaml up -d nginx
```

### Step 9.2: Run Certbot Webroot Challenge
Execute Certbot via Docker to obtain a unified multi-domain certificate:

```bash
sudo docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d wallet.sujalluhar.com \
  -d wallet-user.sujalluhar.com \
  -d merchant.sujalluhar.com \
  -d bank.sujalluhar.com \
  --email your-email@sujalluhar.com \
  --agree-tos --no-eff-email --non-interactive
```

### Step 9.3: Enable Full SSL Configuration
Restore the full SSL configuration files and restart Nginx:

```bash
# Restore SSL configs and remove bootstrap config
rm nginx/conf.d/bootstrap.conf
for f in nginx/conf.d/*.conf.bak; do mv "$f" "${f%.bak}"; done

# Restart Nginx with SSL enabled
docker compose -f docker-compose.prod.yaml restart nginx
```

### Automatic Certificate Renewal
Set up a daily cron job to automatically renew certificates and reload Nginx:

```bash
(crontab -l 2>/dev/null; echo "0 3 * * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v /var/www/certbot:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker exec wallet-nginx nginx -s reload") | crontab -
```

---

## 10. First Deploy Checklist

1. [ ] EC2 instance launched with Ubuntu 24.04 and Elastic IP attached.
2. [ ] Security group restricted to ports `22`, `80`, `443`.
3. [ ] 2 GB Swap file configured and active (`free -h`).
4. [ ] Docker and Docker Compose plugin installed (`docker --version`).
5. [ ] DNS records (`wallet.*`, `wallet-user.*`, `merchant.*`, `bank.*`) pointing to Elastic IP.
6. [ ] Google OAuth redirect URIs added in Google Cloud Console.
7. [ ] GitHub repository secrets added (`DOCKERHUB_*`, `EC2_*`, `PROD_ENV_FILE`).
8. [ ] Initial TLS certificates provisioned using Certbot webroot.
9. [ ] Git commit and push to `main` branch to trigger GitHub Actions deploy.
10. [ ] Verify service health:
    ```bash
    docker compose -f ~/wallet/docker-compose.prod.yaml ps
    ```
11. [ ] Test HTTPS endpoints in browser:
    - `https://wallet.sujalluhar.com/api/health`
    - `https://wallet-user.sujalluhar.com/api/health`
    - `https://merchant.sujalluhar.com/api/health`
    - `https://bank.sujalluhar.com/health`
