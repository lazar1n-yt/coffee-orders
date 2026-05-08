# Розгортання Coffee Orders у production

> Документ описує **повний цикл розгортання** Coffee Orders у production —
> від підготовки сервера до моніторингу, оновлення та відкату.

---

## Зміст

1. [Вимоги до інфраструктури](#1-вимоги-до-інфраструктури)
2. [Передумови безпеки](#2-передумови-безпеки)
3. [Розгортання на одній VM (Docker Compose)](#3-розгортання-на-одній-vm-docker-compose)
4. [Reverse-proxy і HTTPS (Caddy)](#4-reverse-proxy-і-https-caddy)
5. [Бекапи бази даних](#5-бекапи-бази-даних)
6. [Моніторинг](#6-моніторинг)
7. [Оновлення (rolling update)](#7-оновлення-rolling-update)
8. [Відкат (rollback)](#8-відкат-rollback)
9. [Чек-лист OWASP Top 10:2021](#9-чек-лист-owasp-top-102021)
10. [Розгортання у Kubernetes (опційно)](#10-розгортання-у-kubernetes-опційно)

---

## 1. Вимоги до інфраструктури

| Компонент      | Мінімум     | Рекомендовано |
|----------------|-------------|---------------|
| CPU            | 1 vCPU      | 2 vCPU        |
| RAM            | 1 GB        | 2 GB          |
| Диск           | 10 GB SSD   | 30 GB SSD     |
| ОС             | Ubuntu 22.04 / Debian 12 | Ubuntu 24.04 LTS |
| Docker Engine  | 24.0+       | 27.0+         |
| Docker Compose | v2.20+      | v2.30+        |

Хмарні провайдери (перевірено): Hetzner Cloud, DigitalOcean Droplets, AWS EC2 t4g.small, GCP e2-small, Azure B2s.

---

## 2. Передумови безпеки

- SSH-доступ лише за ключем (вимкнути password authentication).
- UFW з відкритими портами 22, 80, 443; усі інші — заборонені.
- Автоматичні оновлення безпеки: `unattended-upgrades`.
- fail2ban для SSH і nginx/Caddy.
- Окремий `deploy`-користувач у групі `docker` (без sudo).
- Усі секрети — у `.env` із `chmod 600` та через `docker secret`/Vault у k8s.

---

## 3. Розгортання на одній VM (Docker Compose)

### 3.1. Підготовка сервера

```bash
ssh deploy@<server-ip>

# Docker Engine + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Перевірка
docker --version
docker compose version
```

### 3.2. Завантаження проєкту

```bash
sudo mkdir -p /opt/coffee-orders && sudo chown deploy:deploy /opt/coffee-orders
cd /opt/coffee-orders
git clone https://github.com/lazar1n-yt/coffee-orders.git .
git checkout v1.0.0          # бажано прибиватися до тегу
```

### 3.3. Налаштування `.env`

```bash
cp .env.example .env
chmod 600 .env

# Згенерувати міцні секрети
openssl rand -hex 32 | tee -a .env.secrets   # для JWT_ACCESS_SECRET
openssl rand -hex 32 | tee -a .env.secrets   # для JWT_REFRESH_SECRET
```

Заповніть:

```ini
JWT_ACCESS_SECRET=<32-байтний hex>
JWT_REFRESH_SECRET=<інший 32-байтний hex>
POSTGRES_PASSWORD=<довгий випадковий пароль>
CORS_ORIGIN=https://shop.example.com
VITE_API_BASE_URL=https://api.example.com/api
PUBLIC_FILES_BASE_URL=https://api.example.com/files
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
```

### 3.4. Запуск

Варіант 1 — **збірка з сирців**:

```bash
docker compose up -d --build
```

Варіант 2 — **готові образи з GHCR** (швидше):

```bash
docker compose pull
docker compose up -d
```

### 3.5. Перевірка

```bash
docker compose ps                              # усі сервіси у стані healthy
docker compose logs -f api | head -n 50
curl -fsS http://localhost:4000/api/health
```

---

## 4. Reverse-proxy і HTTPS (Caddy)

Рекомендований варіант — Caddy 2: автоматичний Let's Encrypt без додаткової конфігурації.

`/etc/caddy/Caddyfile`:

```caddy
shop.example.com {
    encode zstd gzip
    reverse_proxy localhost:8080
    header /assets/* Cache-Control "public, immutable, max-age=31536000"
    log {
        output file /var/log/caddy/shop.log
        format json
    }
}

api.example.com {
    encode gzip
    reverse_proxy localhost:4000
    header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    log {
        output file /var/log/caddy/api.log
        format json
    }
}
```

```bash
sudo systemctl reload caddy
```

Альтернативи: nginx + certbot, Traefik, Cloudflare Tunnel.

---

## 5. Бекапи бази даних

### 5.1. Щодобовий dump → S3

Скрипт `/opt/coffee-orders/scripts/backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
TARGET="/var/backups/coffee-orders/db-${STAMP}.sql.gz"
mkdir -p "$(dirname "$TARGET")"

docker compose -f /opt/coffee-orders/docker-compose.yml exec -T db \
  pg_dump -U coffee coffee_orders | gzip > "$TARGET"

# Завантаження в S3-сумісне сховище
aws s3 cp "$TARGET" "s3://coffee-orders-backups/db/" --storage-class STANDARD_IA

# Утримання локально 7 днів
find /var/backups/coffee-orders -mtime +7 -delete
```

cron:

```cron
15 2 * * * /opt/coffee-orders/scripts/backup.sh >> /var/log/coffee-backup.log 2>&1
```

### 5.2. Відновлення

```bash
gunzip -c db-20260509T021500Z.sql.gz | \
  docker compose exec -T db psql -U coffee -d coffee_orders
```

### 5.3. Бекап завантажених файлів

`uploads_data` volume — резервується через `docker run --rm -v uploads_data:/v -v $PWD:/b alpine tar czf /b/uploads.tar.gz /v`.

---

## 6. Моніторинг

### 6.1. Healthchecks

Усі контейнери мають `HEALTHCHECK`. Перегляд:

```bash
docker compose ps
docker inspect --format='{{.State.Health.Status}}' coffee-api
```

### 6.2. Uptime-моніторинг

Підключіть зовнішній сервіс (UptimeRobot, Better Uptime, Statuscake) до:

- `https://api.example.com/api/health` (інтервал 1 хв);
- `https://shop.example.com/health` (інтервал 5 хв).

### 6.3. Логи

```bash
docker compose logs -f --tail=200 api
docker compose logs -f --tail=200 web
```

Для агрегації: Loki + Promtail, ELK, Datadog. Контейнери вже пишуть у stdout — досить підхопити Docker driver.

### 6.4. Метрики (план v1.1)

- `/metrics` endpoint у backend → Prometheus.
- Дашборд Grafana з метриками RPS / p50/p95/p99 latency / error rate / DB connections.

---

## 7. Оновлення (rolling update)

```bash
cd /opt/coffee-orders
git fetch --tags
git checkout v1.1.0           # або новий тег

# Бекап перед оновленням
./scripts/backup.sh

# Підтягнути нові образи
docker compose pull

# Оновлення з мінімальним downtime
docker compose up -d --no-deps --build api
docker compose up -d --no-deps --build web

# Перевірка
docker compose ps
curl -fsS https://api.example.com/api/health
```

Міграції БД виконуються автоматично під час старту контейнера API
(`prisma migrate deploy` у `CMD`).

---

## 8. Відкат (rollback)

```bash
cd /opt/coffee-orders

# 1. Зупинити стек
docker compose down

# 2. Повернутися на попередній тег
git checkout v1.0.0

# 3. Відновити dump БД, якщо нова версія застосувала несумісні міграції
gunzip -c /var/backups/coffee-orders/db-<pre-update>.sql.gz | \
  docker compose run --rm -T db psql -U coffee -d coffee_orders

# 4. Підняти стек на старій версії
docker compose pull
docker compose up -d
```

> **Правило.** Завжди тестуйте rollback на staging-середовищі — Prisma не вміє
> робити автоматичних down-міграцій.

---

## 9. Чек-лист OWASP Top 10:2021

| #   | Категорія                                         | Реалізовано в Coffee Orders                                |
|-----|---------------------------------------------------|-------------------------------------------------------------|
| A01 | Broken Access Control                             | `requireAuth` + `requireRole`, перевірка `userId === req.user.sub` для отримання деталей замовлення |
| A02 | Cryptographic Failures                            | bcrypt 10 rounds, JWT з 32-байтним секретом, HTTPS-only, HSTS на edge |
| A03 | Injection                                         | Prisma — параметризовані запити; Zod-валідація вхідних даних |
| A04 | Insecure Design                                   | Threat model документована; trust boundaries чітко визначені |
| A05 | Security Misconfiguration                         | helmet(), nginx security headers, мінімальні права контейнерів |
| A06 | Vulnerable & Outdated Components                  | Dependabot, Trivy FS+image scan, CodeQL                     |
| A07 | Identification & Authentication Failures          | refresh-token rotation, JTI blacklist, обмеження тіла, rate-limit (план v1.1) |
| A08 | Software & Data Integrity Failures                | SLSA build provenance, SBOM, image signing (план v1.1)      |
| A09 | Security Logging & Monitoring Failures            | morgan combined logs у production; центральний аналіз — план |
| A10 | Server-Side Request Forgery (SSRF)                | Backend не виконує запитів за URL від клієнта; OAuth-callback фіксований allow-list |

---

## 10. Розгортання у Kubernetes (опційно)

Базова конфігурація — Helm-чарт у `deploy/charts/coffee-orders/` (план v1.1).
Стислий маніфест:

```yaml
# api Deployment (фрагмент)
apiVersion: apps/v1
kind: Deployment
metadata: { name: coffee-api }
spec:
  replicas: 2
  selector: { matchLabels: { app: coffee-api } }
  template:
    metadata: { labels: { app: coffee-api } }
    spec:
      containers:
        - name: api
          image: ghcr.io/lazar1n-yt/coffee-orders-backend:v1.0.0
          ports: [{ containerPort: 4000 }]
          envFrom:
            - secretRef: { name: coffee-api-secrets }
          livenessProbe:
            httpGet: { path: /api/health, port: 4000 }
            initialDelaySeconds: 30
          readinessProbe:
            httpGet: { path: /api/health, port: 4000 }
          resources:
            limits:   { cpu: "1", memory: 512Mi }
            requests: { cpu: "100m", memory: 128Mi }
          securityContext:
            runAsNonRoot: true
            readOnlyRootFilesystem: true
```

Для production-кластеру рекомендовано:

- HPA (CPU 70 %), 2–6 replicas.
- PodDisruptionBudget min available = 1.
- NetworkPolicy: `api` доступний тільки з `web`-namespace.
- ExternalSecrets з HashiCorp Vault або AWS Secrets Manager.
- CertManager з Let's Encrypt.

---

> **Контакт DevOps:** ops@example.com (escalation < 30 хв на P1).
