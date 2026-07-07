# Judge0 CE — Self-Hosted Code Execution Engine

Production-ready Docker Compose deployment of [Judge0 CE v1.13.1](https://github.com/judge0/judge0)
for DevRann. Supports JavaScript, TypeScript, Python, Java, C++, Go, and Rust.

## Architecture

```
┌──────────┐    ┌──────────┐    ┌────────────────┐
│  DevRann │───▶│  Judge0  │───▶│  PostgreSQL 16  │
│   App    │    │  Server  │    │  (persistent DB)│
└──────────┘    │  :2358   │    └────────────────┘
                │          │    ┌────────────────┐
                │  Workers │───▶│  Redis 7        │
                └──────────┘    │  (job queue)    │
                                └────────────────┘
```

## Quick Start

### 1. Prerequisites

- Docker Engine 24+ and Docker Compose v2
- At least 4 GB RAM allocated to Docker
- 10 GB free disk space (for language runtimes)

### 2. Configure

```bash
cd infra/judge0

# Copy environment file and fill in secrets
cp judge0.conf.example .env
```

Edit `.env` and set:

| Variable | Description | Example |
|---|---|---|
| `JUDGE0_AUTH_TOKEN` | API auth token (generate with `openssl rand -hex 32`) | `a1b2c3d4...` |
| `POSTGRES_PASSWORD` | Strong random password | |
| `REDIS_PASSWORD` | Strong random password | |
| `CPU_COUNT` | Match your host CPU cores | `4` or `8` |
| `CONCURRENCY` | Worker threads (usually = CPU_COUNT) | `4` |

### 3. Start

**Windows:**
```powershell
.\scripts\judge0-start.ps1
```

**Linux / macOS:**
```bash
docker compose --env-file infra/judge0/.env -f infra/judge0/docker-compose.yml up -d
```

First startup downloads language runtimes (~2 GB) and runs database migrations.
Wait ~2–3 minutes for the server to become healthy.

### 4. Verify

```bash
# Health check
curl http://localhost:2358/api/v1/about

# List supported languages/runtimes
curl http://localhost:2358/api/v1/languages

# Test a code execution
curl -X POST http://localhost:2358/api/v1/submissions \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: YOUR_TOKEN" \
  -d '{
    "source_code": "console.log(42)",
    "language_id": 63,
    "wait": true
  }'
```

## Environment Variables

### Judge0 (`infra/judge0/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `JUDGE0_AUTH_TOKEN` | **yes** | — | API auth token sent as `X-Auth-Token` header |
| `POSTGRES_DB` | no | `judge0` | PostgreSQL database name |
| `POSTGRES_USER` | no | `judge0` | PostgreSQL user |
| `POSTGRES_PASSWORD` | **yes** | — | PostgreSQL password |
| `REDIS_PASSWORD` | **yes** | — | Redis password (used in `REDIS_URL`) |
| `JUDGE0_PORT` | no | `2358` | Host-side port mapping |
| `CPU_COUNT` | no | `4` | CPU cores for resource calculation |
| `MAX_QUEUE_SIZE` | no | `200` | Maximum queued submissions |
| `CONCURRENCY` | no | `4` | Resque worker concurrency |
| `RAILS_ENV` | no | `production` | Rails environment |
| `POSTGRES_MEM_LIMIT` | no | `512M` | PostgreSQL container memory limit |
| `REDIS_MEM_LIMIT` | no | `256M` | Redis container memory limit |
| `SERVER_MEM_LIMIT` | no | `1G` | Judge0 server container memory limit |
| `WORKERS_MEM_LIMIT` | no | `2G` | Worker container memory limit (largest consumer) |

### DevRann (`devrann/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `JUDGE0_API_URL` | **yes** | Judge0 server URL + path (e.g. `http://localhost:2358/api/v1`) |
| `JUDGE0_API_KEY` | **yes** | Must match `JUDGE0_AUTH_TOKEN` from Judge0 .env |
| `JUDGE_RATE_LIMIT` | no | Max API calls per 60s per user (default: 10) |

## Language IDs

Judge0 uses numeric language IDs. The DevRann judge-engine.ts maps them automatically:

| Language | Judge0 ID |
|---|---|
| JavaScript (Node.js 18) | 63 |
| TypeScript | 63 (via ts-node) |
| Python 3 | 71 |
| Java 17 | 62 |
| C++ (GCC 12) | 54 |
| Go 1.18 | 60 |
| Rust 1.68 | 73 |

## Maintaining

```bash
# View logs
docker compose -f infra/judge0/docker-compose.yml logs -f

# Restart services
docker compose -f infra/judge0/docker-compose.yml restart

# Stop
docker compose -f infra/judge0/docker-compose.yml down

# Full reset (deletes all data and runtimes!)
docker compose -f infra/judge0/docker-compose.yml down -v
```

## Production Deployment (VPS / Cloud VM)

1. **Provision a VM** with at least 4 GB RAM, 20 GB disk, Docker installed.
2. **Copy** the `infra/judge0/` directory to the VM.
3. **Set secrets** in `.env` on the VM.
4. **Start** with `docker compose up -d`.
5. **Configure firewall** to allow inbound on port 2358 only from DevRann's IP(s).
6. **Set up monitoring** — add the VM to your observability stack.
7. **Set `JUDGE0_API_URL`** in DevRann's Vercel environment variables to `http://<VM_IP>:2358/api/v1`.
8. **Set `JUDGE0_API_KEY`** to match the VM's `JUDGE0_AUTH_TOKEN`.

### Security Notes

- Place Judge0 on a **private network** or restrict port 2358 to DevRann's IPs only.
- Do **not** expose Judge0 to the public internet without auth.
- Both server and workers use `cap_add` (SYS_ADMIN, NET_ADMIN, SETUID, SETGID, SYS_RESOURCE, SYS_PTRACE) instead of `privileged: true` — this drops unnecessary capabilities (module loading, raw I/O, etc.) while still giving isolate the access it needs. The cgroup filesystem is bind-mounted at `/sys/fs/cgroup:rw` and the default seccomp profile is disabled (`seccomp=unconfined`) because isolate needs `clone()` with `CLONE_NEW*`, `mount()`, and `chroot()` which the default Docker seccomp profile blocks.
- The `JUDGE0_AUTH_TOKEN` is the only authentication — treat it like a database password.
- Judge0 executes arbitrary user code in isolated containers. This is by design, but ensure the host VM is not running other sensitive workloads.
- Regularly update the Judge0 image: `docker compose pull && docker compose up -d`.
- This deployment requires **cgroup v1**. If your host uses cgroup v2 (default on newer Linux distros), add `systemd.unified_cgroup_hierarchy=0` to the kernel cmdline (see [Judge0 CHANGELOG](https://github.com/judge0/judge0/blob/master/CHANGELOG.md) for details).
