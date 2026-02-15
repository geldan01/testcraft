# Deployment Guide

## Prerequisites

- Docker Engine 24+
- Docker Compose v2.20+

## Quick Start

1. Clone the repository and copy the environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and set at minimum:

```bash
JWT_SECRET=your-secure-random-string-here
POSTGRES_PASSWORD=a-strong-database-password
```

3. Start the production stack:

```bash
docker compose -f docker-compose.prod.yml up -d
```

This will:
- Start PostgreSQL with a persistent volume
- Run database migrations automatically
- Build and start the Nuxt application

4. Open `http://localhost:3000` in your browser.

5. Seed demo data (optional):

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

Demo accounts: `admin@testcraft.io` / `Admin123!`, `qa@testcraft.io` / `QATest123!`, `dev@testcraft.io` / `DevTest123!`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | _(required)_ | Secret key for signing JWT tokens |
| `POSTGRES_USER` | `testcraft` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `testcraft` | PostgreSQL password. **Change in production!** |
| `POSTGRES_DB` | `testcraft` | PostgreSQL database name |
| `APP_PORT` | `3000` | Host port for the application |
| `STORAGE_PROVIDER` | `local` | File storage backend: `local` or `s3` |
| `MAX_FILE_SIZE_MB` | `50` | Maximum upload file size in MB |
| `S3_BUCKET` | | S3 bucket name (required when using `s3` provider) |
| `S3_REGION` | `us-east-1` | AWS region |
| `S3_ENDPOINT` | | Custom endpoint for S3-compatible services |
| `S3_ACCESS_KEY_ID` | | S3 access key |
| `S3_SECRET_ACCESS_KEY` | | S3 secret key |

## File Storage Configuration

### Local Storage (default)

Files are stored inside the container at `/app/data/uploads/` and persisted via a Docker volume (`upload-data`). No additional configuration needed.

### AWS S3

```bash
STORAGE_PROVIDER=s3
S3_BUCKET=my-testcraft-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...
```

### Cloudflare R2

```bash
STORAGE_PROVIDER=s3
S3_BUCKET=my-testcraft-bucket
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

### MinIO (self-hosted)

```bash
STORAGE_PROVIDER=s3
S3_BUCKET=testcraft
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
```

### DigitalOcean Spaces

```bash
STORAGE_PROVIDER=s3
S3_BUCKET=my-testcraft-space
S3_REGION=nyc3
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

### Backblaze B2

```bash
STORAGE_PROVIDER=s3
S3_BUCKET=my-testcraft-bucket
S3_REGION=us-west-004
S3_ENDPOINT=https://s3.us-west-004.backblazeb2.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

## Database Migrations

Migrations run automatically when the stack starts via the `migrate` service. To run migrations manually:

```bash
docker compose -f docker-compose.prod.yml run --rm migrate
```

## Updating to a New Version

```bash
git pull
docker compose -f docker-compose.prod.yml up --build -d
```

This rebuilds the app image with new code, runs any pending migrations, and restarts the app. Database data and uploaded files persist across rebuilds.

## Monitoring

Health check endpoint (unauthenticated):

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"2025-01-15T12:00:00.000Z"}
```

Check container health:

```bash
docker compose -f docker-compose.prod.yml ps
```

View logs:

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f db
```

## Backups

### Database

```bash
# Create a backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U testcraft testcraft > backup.sql

# Restore from backup
docker compose -f docker-compose.prod.yml exec -T db psql -U testcraft testcraft < backup.sql
```

### Uploaded Files (local storage)

The upload volume can be backed up using standard Docker volume techniques:

```bash
docker run --rm -v testcraft_upload-data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

When using S3 storage, files are managed by the cloud provider and should be backed up according to that provider's best practices (e.g., S3 versioning, cross-region replication).
